export interface PMInsight {
  id: string
  projectId: string
  type: 'rfi-aging' | 'schedule-slip' | 'delivery-risk' | 'budget-overrun' | 'missing-approval' | 'checklist-incomplete' | 'critical-path-task-rfi' | 'cost-variance'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  details: string
  detectedAt: string
  status: 'active' | 'resolved' | 'dismissed'
  resolvedAt?: string
  resolvedBy?: string
  dismissedAt?: string
  dismissedBy?: string
  dismissReason?: string
  entityRefs: Array<{
    type: 'rfi' | 'task' | 'delivery' | 'cost-code' | 'checklist' | 'approval' | 'work-package'
    id: string
    label: string
    link: string
  }>
  reasoningInputs: {
    sourceData: Record<string, unknown>
    thresholds: Record<string, number>
    calculations: Record<string, number>
    triggers: string[]
  }
  recommendedActions: Array<{
    action: string
    priority: 'high' | 'medium' | 'low'
    link: string
  }>
  followUpDate?: string
  reminderSent?: boolean
  createdAt: string
  updatedAt: string
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
