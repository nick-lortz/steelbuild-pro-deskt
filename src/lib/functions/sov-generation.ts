import type { Budget, CostCode, Task, SOVItem, SOVVersion, WorkPackage } from '@/lib/types'

export interface SOVGenerationOptions {
  projectId: string
  periodStart: string
  periodEnd: string
  retainagePercent?: number
  includeMaterialsStored?: boolean
}

export interface GeneratedSOVData {
  version: Omit<SOVVersion, 'id' | 'createdAt'>
  items: Array<Omit<SOVItem, 'id' | 'createdAt' | 'updatedAt'>>
  summary: {
    totalScheduledValue: number
    totalWorkCompleted: number
    totalMaterialsStored: number
    totalCompleted: number
    totalRetainage: number
    totalCurrentBilling: number
    itemCount: number
  }
}

export interface SOVProgressUpdate {
  itemId: string
  previousPercent: number
  newPercent: number
  updatedBy: string
  updatedAt: string
  notes?: string
  sourceType: 'manual' | 'field-progress' | 'task-completion' | 'work-package'
  sourceId?: string
}

export interface SOVAuditEntry {
  id: string
  projectId: string
  sovItemId: string
  versionId: string
  action: 'create' | 'update' | 'recalculate' | 'submit' | 'approve'
  changes: {
    field: string
    oldValue: number | string
    newValue: number | string
  }[]
  updatedBy: string
  timestamp: string
  notes?: string
}

export async function recordSOVAudit(entry: Omit<SOVAuditEntry, 'id' | 'timestamp'>): Promise<void> {
  const auditEntry: SOVAuditEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  }
  
  const existingAudits = await spark.kv.get<SOVAuditEntry[]>(`sov-audit-${entry.projectId}`) || []
  await spark.kv.set(`sov-audit-${entry.projectId}`, [...existingAudits, auditEntry])
}

export async function getSOVAuditTrail(projectId: string, itemId?: string): Promise<SOVAuditEntry[]> {
  const audits = await spark.kv.get<SOVAuditEntry[]>(`sov-audit-${projectId}`) || []
  return itemId ? audits.filter(a => a.sovItemId === itemId) : audits
}

export async function generateSOVFromCostCodes(
  options: SOVGenerationOptions,
  budgets: Budget[],
  costCodes: CostCode[],
  tasks: Task[],
  workPackages: WorkPackage[]
): Promise<GeneratedSOVData> {
  const { projectId, periodStart, periodEnd, retainagePercent = 10, includeMaterialsStored = true } = options

  const items: Array<Omit<SOVItem, 'id' | 'createdAt' | 'updatedAt'>> = []
  let lineNumber = 1

  for (const budget of budgets) {
    const costCode = costCodes.find(cc => cc.id === budget.costCodeId || cc.code === budget.costCodeId)
    if (!costCode) continue

    const relatedTasks = tasks.filter(t => t.status === 'completed' && 
      (t.description?.includes(costCode.code) || t.name.includes(costCode.name)))
    
    const taskProgress = relatedTasks.length > 0 
      ? relatedTasks.reduce((sum, t) => sum + t.percentComplete, 0) / relatedTasks.length 
      : 0

    const scheduledValue = budget.budgetedAmount
    const workCompleted = Math.min(budget.actualAmount, scheduledValue * (taskProgress / 100))
    
    const materialsStored = includeMaterialsStored 
      ? Math.min(budget.committedAmount - workCompleted, scheduledValue * 0.1)
      : 0

    const totalCompleted = workCompleted + materialsStored
    const percentComplete = scheduledValue > 0 ? (totalCompleted / scheduledValue) * 100 : 0
    const retainage = totalCompleted * (retainagePercent / 100)
    
    const previouslyBilled = 0
    const currentBilling = Math.max(0, totalCompleted - retainage - previouslyBilled)
    const balance = scheduledValue - totalCompleted

    items.push({
      projectId,
      versionId: '',
      lineNumber: lineNumber++,
      description: `${costCode.code} - ${costCode.name}`,
      scheduledValue,
      workCompleted,
      materialsStored,
      totalCompleted,
      percentComplete,
      retainage,
      previouslyBilled,
      currentBilling,
      balance,
      costCodeId: costCode.id,
    })
  }

  const summary = {
    totalScheduledValue: items.reduce((sum, item) => sum + item.scheduledValue, 0),
    totalWorkCompleted: items.reduce((sum, item) => sum + item.workCompleted, 0),
    totalMaterialsStored: items.reduce((sum, item) => sum + item.materialsStored, 0),
    totalCompleted: items.reduce((sum, item) => sum + item.totalCompleted, 0),
    totalRetainage: items.reduce((sum, item) => sum + item.retainage, 0),
    totalCurrentBilling: items.reduce((sum, item) => sum + item.currentBilling, 0),
    itemCount: items.length,
  }

  const version: Omit<SOVVersion, 'id' | 'createdAt'> = {
    projectId,
    versionNumber: 1,
    periodStart,
    periodEnd,
    status: 'draft',
    notes: `Auto-generated from ${items.length} cost codes`,
  }

  return {
    version,
    items,
    summary,
  }
}

export async function updateSOVFromProgress(
  existingItems: SOVItem[],
  budgets: Budget[],
  tasks: Task[],
  retainagePercent: number = 10
): Promise<SOVItem[]> {
  return existingItems.map(item => {
    const budget = budgets.find(b => b.costCodeId === item.costCodeId)
    if (!budget) return item

    const relatedTasks = tasks.filter(t => 
      t.description?.includes(item.costCodeId || '') && 
      new Date(t.endDate) <= new Date()
    )
    
    const taskProgress = relatedTasks.length > 0
      ? relatedTasks.filter(t => t.status === 'completed').length / relatedTasks.length * 100
      : 0

    const workCompleted = Math.min(
      budget.actualAmount,
      item.scheduledValue * (taskProgress / 100)
    )

    const materialsStored = Math.min(
      budget.committedAmount - workCompleted,
      item.scheduledValue * 0.1
    )

    const totalCompleted = workCompleted + materialsStored
    const percentComplete = item.scheduledValue > 0 
      ? (totalCompleted / item.scheduledValue) * 100 
      : 0
    const retainage = totalCompleted * (retainagePercent / 100)
    const currentBilling = Math.max(0, totalCompleted - retainage - item.previouslyBilled)
    const balance = item.scheduledValue - totalCompleted

    return {
      ...item,
      workCompleted,
      materialsStored,
      totalCompleted,
      percentComplete,
      retainage,
      currentBilling,
      balance,
      updatedAt: new Date().toISOString(),
    }
  })
}

export async function updateSOVFromFieldProgress(
  projectId: string,
  sovItemId: string,
  percentComplete: number,
  updatedBy: string,
  notes?: string
): Promise<SOVItem> {
  const sovItems = await spark.kv.get<SOVItem[]>(`sov-items-${projectId}`) || []
  const item = sovItems.find(i => i.id === sovItemId)
  
  if (!item) {
    throw new Error('SOV item not found')
  }

  if (percentComplete < 0 || percentComplete > 100) {
    throw new Error('Percent complete must be between 0 and 100')
  }

  if (percentComplete < item.percentComplete) {
    throw new Error('Progress cannot decrease. Current: ' + item.percentComplete + '%, Attempted: ' + percentComplete + '%')
  }

  const previousWorkCompleted = item.workCompleted
  const previousPercentComplete = item.percentComplete

  const workCompleted = item.scheduledValue * (percentComplete / 100)
  const totalCompleted = workCompleted + item.materialsStored
  const retainage = totalCompleted * (item.retainage / item.totalCompleted || 0.1)
  const currentBilling = Math.max(0, totalCompleted - retainage - item.previouslyBilled)
  const balance = item.scheduledValue - totalCompleted

  const updatedItem: SOVItem = {
    ...item,
    workCompleted,
    totalCompleted,
    percentComplete,
    retainage,
    currentBilling,
    balance,
    updatedAt: new Date().toISOString(),
  }

  await recordSOVAudit({
    projectId,
    sovItemId: item.id,
    versionId: item.versionId,
    action: 'update',
    changes: [
      {
        field: 'percentComplete',
        oldValue: previousPercentComplete,
        newValue: percentComplete,
      },
      {
        field: 'workCompleted',
        oldValue: previousWorkCompleted,
        newValue: workCompleted,
      },
      {
        field: 'currentBilling',
        oldValue: item.currentBilling,
        newValue: currentBilling,
      },
    ],
    updatedBy,
    notes,
  })

  const updatedItems = sovItems.map(i => (i.id === sovItemId ? updatedItem : i))
  await spark.kv.set(`sov-items-${projectId}`, updatedItems)

  return updatedItem
}

export function calculateSOVSummary(items: SOVItem[]) {
  return {
    totalScheduledValue: items.reduce((sum, item) => sum + item.scheduledValue, 0),
    totalWorkCompleted: items.reduce((sum, item) => sum + item.workCompleted, 0),
    totalMaterialsStored: items.reduce((sum, item) => sum + item.materialsStored, 0),
    totalCompleted: items.reduce((sum, item) => sum + item.totalCompleted, 0),
    totalRetainage: items.reduce((sum, item) => sum + item.retainage, 0),
    totalCurrentBilling: items.reduce((sum, item) => sum + item.currentBilling, 0),
    totalPreviouslyBilled: items.reduce((sum, item) => sum + item.previouslyBilled, 0),
    totalBalance: items.reduce((sum, item) => sum + item.balance, 0),
    averagePercentComplete: items.length > 0
      ? items.reduce((sum, item) => sum + item.percentComplete, 0) / items.length
      : 0,
    itemCount: items.length,
  }
}

export function validateSOVItems(items: SOVItem[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  items.forEach((item, index) => {
    if (item.scheduledValue < 0) {
      errors.push(`Line ${item.lineNumber}: Scheduled value cannot be negative`)
    }
    if (item.totalCompleted > item.scheduledValue) {
      errors.push(`Line ${item.lineNumber}: Total completed exceeds scheduled value`)
    }
    if (item.retainage < 0) {
      errors.push(`Line ${item.lineNumber}: Retainage cannot be negative`)
    }
    if (item.currentBilling < 0) {
      errors.push(`Line ${item.lineNumber}: Current billing cannot be negative`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}
