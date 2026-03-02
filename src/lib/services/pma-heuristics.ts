import { rfisDb, costCodesDb, projectsDb } from '../db'
import type { RFI, CostCode, Project } from '../types'

export interface PMAInsight {
  id: string
  projectId: string
  type: 'rfi-aging' | 'budget-overrun' | 'schedule-slip' | 'critical-path' | 'delivery-delay'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  actionable: string
  entityType: string
  entityId: string
  deepLink: string
  createdAt: string
  status: 'open' | 'resolved' | 'dismissed'
  resolvedAt?: string
  resolvedBy?: string
  dismissedAt?: string
  dismissedBy?: string
  dismissReason?: string
  metadata: Record<string, any>
}

export interface RFIAgeThresholds {
  highPriority: number
  mediumPriority: number
  lowPriority: number
}

const DEFAULT_THRESHOLDS: RFIAgeThresholds = {
  highPriority: 72,
  mediumPriority: 120,
  lowPriority: 168,
}

export function calculateRFIAge(createdAt: string): number {
  const created = new Date(createdAt)
  const now = new Date()
  const diffMs = now.getTime() - created.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60))
}

export function getSeverityFromAge(ageHours: number, priority: RFI['priority'], thresholds = DEFAULT_THRESHOLDS): PMAInsight['severity'] {
  if (priority === 'high') {
    if (ageHours > thresholds.highPriority) return 'critical'
    if (ageHours > thresholds.highPriority * 0.75) return 'high'
    return 'medium'
  }
  
  if (priority === 'medium') {
    if (ageHours > thresholds.mediumPriority) return 'high'
    if (ageHours > thresholds.mediumPriority * 0.75) return 'medium'
    return 'low'
  }
  
  if (priority === 'low') {
    if (ageHours > thresholds.lowPriority) return 'medium'
    return 'low'
  }
  
  return 'low'
}

export async function scanStaleRFIs(projectId: string, thresholds = DEFAULT_THRESHOLDS): Promise<PMAInsight[]> {
  const rfis = await rfisDb.getByProject(projectId)
  const insights: PMAInsight[] = []
  
  const openRFIs = rfis.filter(r => r.status === 'open')
  
  for (const rfi of openRFIs) {
    const ageHours = calculateRFIAge(rfi.createdAt)
    
    let shouldFlag = false
    let thresholdHours = 0
    
    if (rfi.priority === 'high' && ageHours > thresholds.highPriority) {
      shouldFlag = true
      thresholdHours = thresholds.highPriority
    } else if (rfi.priority === 'medium' && ageHours > thresholds.mediumPriority) {
      shouldFlag = true
      thresholdHours = thresholds.mediumPriority
    } else if (rfi.priority === 'low' && ageHours > thresholds.lowPriority) {
      shouldFlag = true
      thresholdHours = thresholds.lowPriority
    }
    
    if (shouldFlag) {
      const severity = getSeverityFromAge(ageHours, rfi.priority, thresholds)
      const ageDays = Math.floor(ageHours / 24)
      
      insights.push({
        id: crypto.randomUUID(),
        projectId,
        type: 'rfi-aging',
        severity,
        title: `RFI #${rfi.number} is overdue`,
        description: `RFI "${rfi.subject}" has been open for ${ageDays} day${ageDays !== 1 ? 's' : ''} (${ageHours} hours) with ${rfi.priority} priority. Threshold: ${Math.floor(thresholdHours / 24)} days.`,
        actionable: `Review and respond to RFI #${rfi.number}. ${rfi.priority === 'high' ? 'This is blocking critical path work.' : 'This may be delaying downstream activities.'}`,
        entityType: 'rfi',
        entityId: rfi.id,
        deepLink: `/projects/${projectId}/rfis?highlight=${rfi.id}`,
        createdAt: new Date().toISOString(),
        status: 'open',
        metadata: {
          rfiNumber: rfi.number,
          rfiSubject: rfi.subject,
          rfiPriority: rfi.priority,
          ageHours,
          ageDays,
          thresholdHours,
          createdAt: rfi.createdAt,
        },
      })
    }
  }
  
  return insights
}

export async function scanBudgetOverruns(projectId: string): Promise<PMAInsight[]> {
  const costCodes = await costCodesDb.getByProject(projectId)
  const insights: PMAInsight[] = []
  
  for (const cc of costCodes) {
    const budget = cc.budgetAmount || 0
    const actual = cc.actualAmount || 0
    
    if (actual > budget && budget > 0) {
      const variance = actual - budget
      const variancePercent = (variance / budget) * 100
      
      let severity: PMAInsight['severity'] = 'medium'
      if (variancePercent > 20) severity = 'critical'
      else if (variancePercent > 10) severity = 'high'
      
      insights.push({
        id: crypto.randomUUID(),
        projectId,
        type: 'budget-overrun',
        severity,
        title: `Cost Code ${cc.code} exceeds budget`,
        description: `${cc.name} is over budget by $${variance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${variancePercent.toFixed(1)}%). Budget: $${budget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}, Actual: $${actual.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
        actionable: `Review cost code ${cc.code} expenditures and implement cost control measures. Consider issuing a change order if scope has increased.`,
        entityType: 'costCode',
        entityId: cc.id,
        deepLink: `/projects/${projectId}/cost-codes?highlight=${cc.id}`,
        createdAt: new Date().toISOString(),
        status: 'open',
        metadata: {
          costCode: cc.code,
          costCodeName: cc.name,
          budget,
          actual,
          variance,
          variancePercent,
        },
      })
    }
  }
  
  return insights
}

export async function generateProjectInsights(projectId: string, thresholds = DEFAULT_THRESHOLDS): Promise<PMAInsight[]> {
  const [rfiInsights, budgetInsights] = await Promise.all([
    scanStaleRFIs(projectId, thresholds),
    scanBudgetOverruns(projectId),
  ])
  
  return [...rfiInsights, ...budgetInsights].sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })
}

export function generateDailyBrief(insights: PMAInsight[]): {
  summary: string
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  topRisks: PMAInsight[]
  recommendedActions: string[]
} {
  const criticalCount = insights.filter(i => i.severity === 'critical').length
  const highCount = insights.filter(i => i.severity === 'high').length
  const mediumCount = insights.filter(i => i.severity === 'medium').length
  const lowCount = insights.filter(i => i.severity === 'low').length
  
  const topRisks = insights
    .filter(i => i.severity === 'critical' || i.severity === 'high')
    .slice(0, 5)
  
  const recommendedActions = topRisks.map(risk => risk.actionable)
  
  let summary = ''
  if (insights.length === 0) {
    summary = 'No active risks detected. Project is on track.'
  } else {
    const parts: string[] = []
    if (criticalCount > 0) parts.push(`${criticalCount} critical issue${criticalCount !== 1 ? 's' : ''}`)
    if (highCount > 0) parts.push(`${highCount} high priority item${highCount !== 1 ? 's' : ''}`)
    if (mediumCount > 0) parts.push(`${mediumCount} medium concern${mediumCount !== 1 ? 's' : ''}`)
    if (lowCount > 0) parts.push(`${lowCount} low priority item${lowCount !== 1 ? 's' : ''}`)
    
    summary = `Detected ${parts.join(', ')} requiring attention.`
  }
  
  return {
    summary,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    topRisks,
    recommendedActions,
  }
}
