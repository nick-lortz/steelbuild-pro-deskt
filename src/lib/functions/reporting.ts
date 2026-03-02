import type { 
  Project, 
  Budget, 
  Task, 
  RFI, 
  ChangeOrder, 
  Expense,
  LaborEntry,
  SOVItem,
  ReportSnapshot
} from '@/lib/types'

export interface ProjectMetrics {
  financial: {
    totalBudget: number
    totalActual: number
    totalCommitted: number
    variance: number
    variancePercent: number
    costPerformanceIndex: number
    estimateAtCompletion: number
  }
  schedule: {
    totalTasks: number
    completedTasks: number
    percentComplete: number
    schedulePerformanceIndex: number
    criticalPathTasks: number
    delayedTasks: number
    daysRemaining: number
  }
  quality: {
    openRFIs: number
    overdueRFIs: number
    avgRFIResponseTime: number
    changeOrderCount: number
    changeOrderValue: number
    changeOrderImpactPercent: number
  }
  productivity: {
    laborHoursLogged: number
    costPerLaborHour: number
    productivityTrend: 'improving' | 'stable' | 'declining'
  }
}

export function generateProjectMetrics(
  project: Project,
  budgets: Budget[],
  tasks: Task[],
  rfis: RFI[],
  changeOrders: ChangeOrder[],
  expenses: Expense[],
  laborEntries: LaborEntry[]
): ProjectMetrics {
  const totalBudget = budgets.reduce((sum, b) => sum + b.budgetedAmount, 0)
  const totalActual = budgets.reduce((sum, b) => sum + b.actualAmount, 0)
  const totalCommitted = budgets.reduce((sum, b) => sum + b.committedAmount, 0)
  const variance = totalBudget - totalActual
  const variancePercent = totalBudget > 0 ? (variance / totalBudget) * 100 : 0

  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const percentComplete = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0
  const schedulePerformanceIndex = percentComplete > 0 ? percentComplete / Math.max((totalActual / totalBudget) * 100, 1) : 1

  const costPerformanceIndex = totalActual > 0 ? (totalBudget * (percentComplete / 100)) / totalActual : 1

  const estimateAtCompletion = costPerformanceIndex > 0 ? totalBudget / costPerformanceIndex : totalBudget

  const criticalPathTasks = tasks.filter(t => t.isCriticalPath).length
  const delayedTasks = tasks.filter(t => {
    if (t.status === 'completed') return false
    const endDate = new Date(t.endDate)
    return endDate < new Date()
  }).length

  const projectEnd = project.endDate ? new Date(project.endDate) : new Date()
  const daysRemaining = Math.max(0, Math.ceil((projectEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))

  const openRFIs = rfis.filter(r => r.status === 'open' || r.status === 'escalated').length
  const overdueRFIs = rfis.filter(r => {
    if (r.status === 'closed' || r.status === 'answered') return false
    if (!r.dueDate) return false
    return new Date(r.dueDate) < new Date()
  }).length

  const answeredRFIs = rfis.filter(r => r.answeredDate)
  const avgRFIResponseTime = answeredRFIs.length > 0
    ? answeredRFIs.reduce((sum, rfi) => {
        const submitted = new Date(rfi.submittedDate).getTime()
        const answered = new Date(rfi.answeredDate!).getTime()
        return sum + (answered - submitted) / (1000 * 60 * 60 * 24)
      }, 0) / answeredRFIs.length
    : 0

  const changeOrderCount = changeOrders.length
  const changeOrderValue = changeOrders.reduce((sum, co) => sum + co.total, 0)
  const changeOrderImpactPercent = project.contractValue > 0 ? (changeOrderValue / project.contractValue) * 100 : 0

  const laborHoursLogged = laborEntries.reduce((sum, entry) => sum + entry.totalHours, 0)
  const laborCost = expenses.filter(e => e.category.toLowerCase().includes('labor')).reduce((sum, e) => sum + e.amount, 0)
  const costPerLaborHour = laborHoursLogged > 0 ? laborCost / laborHoursLogged : 0

  const recentEntries = laborEntries.slice(-30)
  const olderEntries = laborEntries.slice(-60, -30)
  const recentAvgHours = recentEntries.length > 0 ? recentEntries.reduce((sum, e) => sum + e.totalHours, 0) / recentEntries.length : 0
  const olderAvgHours = olderEntries.length > 0 ? olderEntries.reduce((sum, e) => sum + e.totalHours, 0) / olderEntries.length : 0
  
  let productivityTrend: 'improving' | 'stable' | 'declining' = 'stable'
  if (recentAvgHours > olderAvgHours * 1.1) {
    productivityTrend = 'improving'
  } else if (recentAvgHours < olderAvgHours * 0.9) {
    productivityTrend = 'declining'
  }

  return {
    financial: {
      totalBudget,
      totalActual,
      totalCommitted,
      variance,
      variancePercent,
      costPerformanceIndex,
      estimateAtCompletion,
    },
    schedule: {
      totalTasks: tasks.length,
      completedTasks,
      percentComplete,
      schedulePerformanceIndex,
      criticalPathTasks,
      delayedTasks,
      daysRemaining,
    },
    quality: {
      openRFIs,
      overdueRFIs,
      avgRFIResponseTime,
      changeOrderCount,
      changeOrderValue,
      changeOrderImpactPercent,
    },
    productivity: {
      laborHoursLogged,
      costPerLaborHour,
      productivityTrend,
    },
  }
}

export function generateExecutiveReport(
  projects: Project[],
  metrics: Map<string, ProjectMetrics>
): ReportSnapshot {
  const totalContractValue = projects.reduce((sum, p) => sum + p.contractValue, 0)
  
  let totalBudget = 0
  let totalActual = 0
  let totalVariance = 0
  let totalRFIs = 0
  let totalOverdueRFIs = 0
  let projectsOnTrack = 0
  let projectsAtRisk = 0
  
  projects.forEach(project => {
    const metric = metrics.get(project.id)
    if (metric) {
      totalBudget += metric.financial.totalBudget
      totalActual += metric.financial.totalActual
      totalVariance += metric.financial.variance
      totalRFIs += metric.quality.openRFIs
      totalOverdueRFIs += metric.quality.overdueRFIs
      
      if (metric.financial.costPerformanceIndex >= 0.95 && metric.schedule.schedulePerformanceIndex >= 0.95) {
        projectsOnTrack++
      } else if (metric.financial.costPerformanceIndex < 0.85 || metric.schedule.schedulePerformanceIndex < 0.85) {
        projectsAtRisk++
      }
    }
  })

  const portfolioHealth = projectsOnTrack / Math.max(projects.length, 1) * 100

  const summary = `Portfolio Overview: ${projects.length} active projects with $${(totalContractValue / 1000000).toFixed(1)}M in contract value. ${projectsOnTrack} projects on track, ${projectsAtRisk} at risk. Overall budget variance: ${totalVariance >= 0 ? 'under' : 'over'} by $${Math.abs(totalVariance).toLocaleString()}.`

  const trends = [
    {
      metric: 'Portfolio Health',
      direction: portfolioHealth >= 75 ? 'up' as const : portfolioHealth >= 50 ? 'stable' as const : 'down' as const,
      value: portfolioHealth,
    },
    {
      metric: 'Budget Performance',
      direction: totalVariance >= 0 ? 'up' as const : 'down' as const,
      value: totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0,
    },
    {
      metric: 'RFI Volume',
      direction: totalOverdueRFIs === 0 ? 'stable' as const : 'down' as const,
      value: totalRFIs,
    },
  ]

  return {
    id: crypto.randomUUID(),
    reportId: 'executive-summary',
    generatedDate: new Date().toISOString(),
    data: {
      projects: projects.length,
      totalContractValue,
      totalBudget,
      totalActual,
      totalVariance,
      projectsOnTrack,
      projectsAtRisk,
      portfolioHealth,
    },
    summary,
    trends,
    createdAt: new Date().toISOString(),
  }
}

export function generateCostAnalysisReport(
  budgets: Budget[],
  expenses: Expense[],
  sovItems: SOVItem[]
): Record<string, unknown> {
  const costCodeAnalysis = budgets.map(budget => {
    const relatedExpenses = expenses.filter(e => e.category === budget.costCodeId)
    const relatedSOV = sovItems.filter(s => s.costCodeId === budget.costCodeId)
    
    const totalExpenses = relatedExpenses.reduce((sum, e) => sum + e.amount, 0)
    const billedToDate = relatedSOV.reduce((sum, s) => sum + s.totalCompleted, 0)
    
    return {
      costCode: budget.costCodeId,
      budgeted: budget.budgetedAmount,
      actual: budget.actualAmount,
      committed: budget.committedAmount,
      variance: budget.budgetedAmount - budget.actualAmount,
      expenseCount: relatedExpenses.length,
      billedAmount: billedToDate,
      unbilledCost: Math.max(0, budget.actualAmount - billedToDate),
    }
  })

  return {
    timestamp: new Date().toISOString(),
    costCodeAnalysis,
    summary: {
      totalBudget: budgets.reduce((sum, b) => sum + b.budgetedAmount, 0),
      totalActual: budgets.reduce((sum, b) => sum + b.actualAmount, 0),
      totalCommitted: budgets.reduce((sum, b) => sum + b.committedAmount, 0),
      totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
      expenseCount: expenses.length,
    },
  }
}
