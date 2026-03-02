import type { Project, Task, RFI, Budget, CostCode, Delivery } from '../types'
import { businessRules } from '../business-rules'

export interface DailyBriefing {
  projectId: string
  projectName: string
  date: string
  summary: string
  scheduleHealth: {
    score: number
    criticalPathTasks: Task[]
    overdueTasks: Task[]
    upcomingMilestones: Task[]
  }
  costHealth: {
    budgetStatus: string
    variance: number
    atRiskCostCodes: CostCode[]
    burnRate: number
  }
  rfiStatus: {
    openCount: number
    agingRFIs: RFI[]
    avgResponseTime: number
  }
  deliveryStatus: {
    pendingCount: number
    atRiskDeliveries: any[]
  }
  topActions: Array<{
    action: string
    priority: 'high' | 'medium' | 'low'
    link: string
    reason: string
  }>
  risks: Array<{
    type: 'schedule' | 'cost' | 'rfi' | 'delivery' | 'quality'
    description: string
    severity: 'high' | 'medium' | 'low'
    impact: string
  }>
}

export async function generateDailyBrief(projectId: string): Promise<DailyBriefing> {
  const projects = await spark.kv.get<Project[]>('projects') || []
  const project = projects.find(p => p.id === projectId)
  
  if (!project) {
    throw new Error('Project not found')
  }

  const tasks = await spark.kv.get<Task[]>(`schedule-tasks-${projectId}`) || []
  const rfis = await spark.kv.get<RFI[]>(`rfis-${projectId}`) || []
  const budgets = await spark.kv.get<Budget[]>(`budgets-${projectId}`) || []
  const costCodes = await spark.kv.get<CostCode[]>('costCodes') || []
  const deliveries = await spark.kv.get<any[]>(`deliveries-${projectId}`) || []

  const scheduleRisks = businessRules.pma.detectScheduleRisks(tasks)
  const costRisks = businessRules.pma.detectCostRisks(budgets)
  const rfiRisks = businessRules.pma.detectRFIAgingRisks(rfis)

  const now = new Date()
  const agingRFIs = rfis.filter(r => {
    const daysSinceSubmitted = (now.getTime() - new Date(r.submittedDate).getTime()) / (1000 * 60 * 60 * 24)
    return r.status === 'open' && daysSinceSubmitted > 7
  })

  const avgResponseTime = rfis.filter(r => r.responseDate).length > 0
    ? rfis
        .filter(r => r.responseDate)
        .reduce((sum, r) => {
          const response = new Date(r.responseDate!).getTime()
          const submitted = new Date(r.submittedDate).getTime()
          return sum + (response - submitted) / (1000 * 60 * 60 * 24)
        }, 0) / rfis.filter(r => r.responseDate).length
    : 0

  const totalBudget = budgets.reduce((sum, b) => sum + b.allocatedAmount, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + (b.actualAmount || 0), 0)
  const variance = totalBudget - totalSpent

  const atRiskCostCodes = costCodes.filter(cc => {
    const budget = budgets.find(b => b.costCodeId === cc.id)
    if (!budget) return false
    const spent = budget.actualAmount || 0
    const allocated = budget.allocatedAmount
    return spent > allocated * 0.9
  })

  const atRiskDeliveries = deliveries.filter(d => 
    d.status === 'delayed' || d.risks?.length > 0
  )

  const upcomingMilestones = tasks
    .filter(t => {
      const dueDate = new Date(t.endDate)
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      return dueDate >= now && dueDate <= sevenDaysFromNow && t.status !== 'completed'
    })
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
    .slice(0, 5)

  const topActions: DailyBriefing['topActions'] = []

  if (scheduleRisks.overdueTasks.length > 0) {
    topActions.push({
      action: `Review ${scheduleRisks.overdueTasks.length} overdue task${scheduleRisks.overdueTasks.length > 1 ? 's' : ''}`,
      priority: 'high',
      link: `/projects/${projectId}/schedule`,
      reason: 'Tasks are past their due date and may impact project timeline'
    })
  }

  if (agingRFIs.length > 0) {
    topActions.push({
      action: `Follow up on ${agingRFIs.length} aging RFI${agingRFIs.length > 1 ? 's' : ''}`,
      priority: 'high',
      link: `/projects/${projectId}/rfis`,
      reason: 'RFIs open for more than 7 days may delay project progress'
    })
  }

  if (atRiskCostCodes.length > 0) {
    topActions.push({
      action: `Review budget for ${atRiskCostCodes.length} cost code${atRiskCostCodes.length > 1 ? 's' : ''}`,
      priority: 'medium',
      link: `/projects/${projectId}/financials`,
      reason: 'Cost codes approaching or exceeding budget'
    })
  }

  if (atRiskDeliveries.length > 0) {
    topActions.push({
      action: `Address ${atRiskDeliveries.length} at-risk deliver${atRiskDeliveries.length > 1 ? 'ies' : 'y'}`,
      priority: 'high',
      link: `/projects/${projectId}/deliveries`,
      reason: 'Deliveries are delayed or have identified risks'
    })
  }

  if (scheduleRisks.criticalPathCount > 0 && scheduleRisks.atRiskTasks.length > 0) {
    topActions.push({
      action: `Monitor ${scheduleRisks.atRiskTasks.length} critical path task${scheduleRisks.atRiskTasks.length > 1 ? 's' : ''}`,
      priority: 'medium',
      link: `/projects/${projectId}/schedule`,
      reason: 'Critical path tasks require close monitoring to avoid schedule impact'
    })
  }

  const risks: DailyBriefing['risks'] = []

  if (scheduleRisks.overdueTasks.length > 0) {
    risks.push({
      type: 'schedule',
      description: `${scheduleRisks.overdueTasks.length} tasks overdue`,
      severity: 'high',
      impact: 'Project timeline may be impacted'
    })
  }

  if (variance < 0) {
    risks.push({
      type: 'cost',
      description: 'Project over budget',
      severity: 'high',
      impact: `Overrun of $${Math.abs(variance).toLocaleString()}`
    })
  } else if (variance < totalBudget * 0.1) {
    risks.push({
      type: 'cost',
      description: 'Budget approaching limit',
      severity: 'medium',
      impact: `Only $${variance.toLocaleString()} remaining`
    })
  }

  if (agingRFIs.length > 0) {
    risks.push({
      type: 'rfi',
      description: `${agingRFIs.length} RFIs aging beyond 7 days`,
      severity: 'medium',
      impact: 'Delays in receiving critical information'
    })
  }

  if (atRiskDeliveries.length > 0) {
    risks.push({
      type: 'delivery',
      description: `${atRiskDeliveries.length} deliveries at risk`,
      severity: 'high',
      impact: 'Material shortages may impact schedule'
    })
  }

  const scheduleHealth = tasks.length > 0
    ? Math.round(
        ((tasks.filter(t => t.status === 'completed' || new Date(t.endDate) >= now).length / tasks.length) * 100)
      )
    : 100

  const summaryPrompt = spark.llmPrompt`Generate a brief executive summary for ${project.name} daily briefing. 

Project Status:
- Schedule Health: ${scheduleHealth}%
- Tasks: ${tasks.length} total, ${scheduleRisks.overdueTasks.length} overdue
- RFIs: ${rfis.filter(r => r.status === 'open').length} open, ${agingRFIs.length} aging
- Budget: $${totalSpent.toLocaleString()} spent of $${totalBudget.toLocaleString()}
- Deliveries: ${deliveries.length} total, ${atRiskDeliveries.length} at risk

Top Risks: ${risks.slice(0, 3).map(r => r.description).join(', ')}

Provide a 2-3 sentence executive summary highlighting the most critical items.`

  let summary = 'Project progressing as planned.'
  try {
    summary = await spark.llm(summaryPrompt, 'gpt-4o-mini')
  } catch (error) {
    console.error('Failed to generate summary:', error)
  }

  return {
    projectId,
    projectName: project.name,
    date: now.toISOString(),
    summary,
    scheduleHealth: {
      score: scheduleHealth,
      criticalPathTasks: scheduleRisks.atRiskTasks.filter(t => t.isCriticalPath),
      overdueTasks: scheduleRisks.overdueTasks,
      upcomingMilestones,
    },
    costHealth: {
      budgetStatus: variance >= 0 ? 'on-track' : 'over-budget',
      variance,
      atRiskCostCodes,
      burnRate: totalSpent / Math.max(1, (now.getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)),
    },
    rfiStatus: {
      openCount: rfis.filter(r => r.status === 'open').length,
      agingRFIs,
      avgResponseTime,
    },
    deliveryStatus: {
      pendingCount: deliveries.filter(d => d.status === 'pending' || d.status === 'in-transit').length,
      atRiskDeliveries,
    },
    topActions: topActions.slice(0, 5),
    risks: risks.slice(0, 10),
  }
}

export async function analyzeProjectWithPMA(projectId: string, query: string): Promise<string> {
  const tasks = await spark.kv.get<Task[]>(`schedule-tasks-${projectId}`) || []
  const rfis = await spark.kv.get<RFI[]>(`rfis-${projectId}`) || []
  const budgets = await spark.kv.get<Budget[]>(`budgets-${projectId}`) || []

  const prompt = spark.llmPrompt`You are PMA (Project Management Assistant), an expert AI assistant for steel erection and fabrication construction projects.

User Query: ${query}

Project Context:
- Tasks: ${tasks.length} total
- Open RFIs: ${rfis.filter(r => r.status === 'open').length}
- Budget Items: ${budgets.length}

Provide a helpful, actionable response focused on the query. Include specific recommendations with deep links when relevant (e.g., /projects/${projectId}/schedule, /projects/${projectId}/rfis, etc.).`

  return await spark.llm(prompt, 'gpt-4o')
}
