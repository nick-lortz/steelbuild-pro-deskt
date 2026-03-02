import { costCodesDb, tasksDb, projectsDb } from '../db'
import type { CostCode, Task, Project } from '../types'

export interface SOVItem {
  id: string
  projectId: string
  costCodeId: string
  costCode: string
  description: string
  scheduledValue: number
  percentComplete: number
  workCompleteToDate: number
  previouslyBilled: number
  currentBillable: number
  balanceToFinish: number
  taskId?: string
  taskName?: string
  lastUpdated: string
}

export interface SOVSummary {
  totalContractValue: number
  totalWorkComplete: number
  totalPreviouslyBilled: number
  totalCurrentBillable: number
  totalBalanceToFinish: number
  percentComplete: number
  retainage: number
  netDueThisPeriod: number
}

export interface AutomatedSOVResult {
  projectId: string
  items: SOVItem[]
  summary: SOVSummary
  generatedAt: string
  period: string
}

export async function calculateAutomatedSOV(
  projectId: string,
  retainagePercent: number = 0
): Promise<AutomatedSOVResult> {
  const project = await projectsDb.getById(projectId)
  if (!project) {
    throw new Error('Project not found')
  }

  const costCodes = await costCodesDb.getByProject(projectId)
  const tasks = await tasksDb.getByProject(projectId)
  
  const taskMap = new Map(tasks.map(t => [t.id, t]))
  
  const sovItems: SOVItem[] = []
  
  for (const costCode of costCodes) {
    const linkedTask = tasks.find(t => t.costCodeId === costCode.id)
    const percentComplete = linkedTask?.percentComplete || 0
    const scheduledValue = costCode.budgetAmount || 0
    
    const workCompleteToDate = (scheduledValue * percentComplete) / 100
    
    const previouslyBilled = costCode.previouslyBilled || 0
    
    const currentBillable = Math.max(0, workCompleteToDate - previouslyBilled)
    
    const balanceToFinish = scheduledValue - workCompleteToDate
    
    sovItems.push({
      id: crypto.randomUUID(),
      projectId,
      costCodeId: costCode.id,
      costCode: costCode.code,
      description: costCode.name || costCode.description,
      scheduledValue,
      percentComplete,
      workCompleteToDate,
      previouslyBilled,
      currentBillable,
      balanceToFinish,
      taskId: linkedTask?.id,
      taskName: linkedTask?.name,
      lastUpdated: new Date().toISOString(),
    })
  }
  
  const totalContractValue = sovItems.reduce((sum, item) => sum + item.scheduledValue, 0)
  const totalWorkComplete = sovItems.reduce((sum, item) => sum + item.workCompleteToDate, 0)
  const totalPreviouslyBilled = sovItems.reduce((sum, item) => sum + item.previouslyBilled, 0)
  const totalCurrentBillable = sovItems.reduce((sum, item) => sum + item.currentBillable, 0)
  const totalBalanceToFinish = sovItems.reduce((sum, item) => sum + item.balanceToFinish, 0)
  
  const percentComplete = totalContractValue > 0 
    ? (totalWorkComplete / totalContractValue) * 100 
    : 0
  
  const retainage = (totalCurrentBillable * retainagePercent) / 100
  const netDueThisPeriod = totalCurrentBillable - retainage
  
  const summary: SOVSummary = {
    totalContractValue,
    totalWorkComplete,
    totalPreviouslyBilled,
    totalCurrentBillable,
    totalBalanceToFinish,
    percentComplete,
    retainage,
    netDueThisPeriod,
  }
  
  const now = new Date()
  const period = `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`
  
  return {
    projectId,
    items: sovItems,
    summary,
    generatedAt: now.toISOString(),
    period,
  }
}

export async function updateCostCodePreviousBilling(
  projectId: string,
  billingUpdates: Array<{ costCodeId: string; amount: number }>
): Promise<void> {
  for (const update of billingUpdates) {
    const costCode = await costCodesDb.getById(update.costCodeId)
    if (!costCode || costCode.projectId !== projectId) {
      continue
    }
    
    const previouslyBilled = (costCode.previouslyBilled || 0) + update.amount
    await costCodesDb.update(update.costCodeId, { previouslyBilled })
  }
}

export function validateSOVTotals(sovResult: AutomatedSOVResult): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  for (const item of sovResult.items) {
    if (item.workCompleteToDate > item.scheduledValue) {
      errors.push(`${item.costCode}: Work complete ($${item.workCompleteToDate.toFixed(2)}) exceeds scheduled value ($${item.scheduledValue.toFixed(2)})`)
    }
    
    if (item.currentBillable < 0) {
      errors.push(`${item.costCode}: Current billable amount is negative ($${item.currentBillable.toFixed(2)})`)
    }
    
    if (item.percentComplete > 100) {
      warnings.push(`${item.costCode}: Percent complete exceeds 100% (${item.percentComplete.toFixed(1)}%)`)
    }
    
    const totalBilled = item.previouslyBilled + item.currentBillable
    if (totalBilled > item.scheduledValue * 1.01) {
      warnings.push(`${item.costCode}: Total billing exceeds scheduled value by more than 1%`)
    }
  }
  
  const calculatedTotal = sovResult.items.reduce((sum, item) => sum + item.scheduledValue, 0)
  if (Math.abs(calculatedTotal - sovResult.summary.totalContractValue) > 0.01) {
    errors.push(`SOV total mismatch: items sum to $${calculatedTotal.toFixed(2)}, summary shows $${sovResult.summary.totalContractValue.toFixed(2)}`)
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

export async function exportSOVToG702Format(sovResult: AutomatedSOVResult): Promise<string> {
  const lines: string[] = []
  
  lines.push('AIA Document G702 - Application and Certificate for Payment')
  lines.push('')
  lines.push(`Project: ${sovResult.projectId}`)
  lines.push(`Period: ${sovResult.period}`)
  lines.push(`Generated: ${new Date(sovResult.generatedAt).toLocaleString()}`)
  lines.push('')
  lines.push('=' .repeat(120))
  lines.push('')
  
  lines.push(
    'Item'.padEnd(10) +
    'Description'.padEnd(40) +
    'Scheduled Value'.padStart(15) +
    '% Complete'.padStart(12) +
    'Work Complete'.padStart(15) +
    'Previously Billed'.padStart(17) +
    'This Period'.padStart(15)
  )
  lines.push('-'.repeat(120))
  
  for (const item of sovResult.items) {
    lines.push(
      item.costCode.padEnd(10) +
      item.description.substring(0, 38).padEnd(40) +
      `$${item.scheduledValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.padStart(15) +
      `${item.percentComplete.toFixed(1)}%`.padStart(12) +
      `$${item.workCompleteToDate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.padStart(15) +
      `$${item.previouslyBilled.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.padStart(17) +
      `$${item.currentBillable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.padStart(15)
    )
  }
  
  lines.push('-'.repeat(120))
  lines.push(
    'TOTALS'.padEnd(50) +
    `$${sovResult.summary.totalContractValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.padStart(15) +
    `${sovResult.summary.percentComplete.toFixed(1)}%`.padStart(12) +
    `$${sovResult.summary.totalWorkComplete.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.padStart(15) +
    `$${sovResult.summary.totalPreviouslyBilled.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.padStart(17) +
    `$${sovResult.summary.totalCurrentBillable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.padStart(15)
  )
  
  lines.push('')
  lines.push(`Less Retainage (${((sovResult.summary.retainage / sovResult.summary.totalCurrentBillable) * 100).toFixed(1)}%): $${sovResult.summary.retainage.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
  lines.push(`Net Due This Period: $${sovResult.summary.netDueThisPeriod.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
  
  return lines.join('\n')
}
