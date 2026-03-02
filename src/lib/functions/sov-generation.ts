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
