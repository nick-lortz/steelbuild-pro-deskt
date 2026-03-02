export interface PMInsight {
  id: string
  projectId: string
  type: 'rfi-aging' | 'schedule-slip' | 'delivery-risk' | 'budget-overrun' | 'missing-approval' | 'checklist-incomplete'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  detectedAt: string
  status: 'active' | 'resolved' | 'dismissed'
  resolvedAt?: string
  resolvedBy?: string
  dismissedAt?: string
  dismissedBy?: string
  dismissReason?: string
  dataReferences: Array<{
    type: 'rfi' | 'task' | 'delivery' | 'cost-code' | 'checklist' | 'approval'
    id: string
    label: string
    link: string
  }>
  recommendedActions: Array<{
    action: string
    priority: 'high' | 'medium' | 'low'
    link: string
  }>
  metrics?: Record<string, number>
  followUpDate?: string
  reminderSent?: boolean
}

export interface PMInsightConfig {
  id: string
  type: PMInsight['type']
  enabled: boolean
  thresholds: Record<string, number>
  reminderDays: number
  autoResolve: boolean
}

export interface PMDailyBrief {
  projectId: string
  date: string
  summary: string
  insightCount: {
    total: number
    critical: number
    high: number
    medium: number
    low: number
  }
  topRisks: Array<{
    type: PMInsight['type']
    title: string
    severity: PMInsight['severity']
    impact: string
    insightId: string
  }>
  recommendedActions: Array<{
    action: string
    priority: 'high' | 'medium' | 'low'
    link: string
    insightId: string
  }>
  metrics: {
    scheduleHealth: number
    budgetHealth: number
    rfiResponseTime: number
    deliveryOnTime: number
  }
}

export interface PMHeuristicSignal {
  type: PMInsight['type']
  severity: PMInsight['severity']
  triggered: boolean
  value: number
  threshold: number
  message: string
  dataIds: string[]
}
