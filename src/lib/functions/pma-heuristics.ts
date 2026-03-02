import type { Task, RFI, Delivery, Budget, CostCode, ProjectChecklistItem } from '../types'
import type { PMInsight, PMInsightConfig, PMHeuristicSignal, PMDailyBrief } from '../types-pma'

const DEFAULT_CONFIG: Record<string, PMInsightConfig> = {
  'rfi-aging': {
    id: 'rfi-aging',
    type: 'rfi-aging',
    enabled: true,
    thresholds: {
      daysOpen: 4,
      criticalDays: 14,
      highPriorityDays: 7,
    },
    reminderDays: 3,
    autoResolve: true,
  },
  'critical-path-task-rfi': {
    id: 'critical-path-task-rfi',
    type: 'critical-path-task-rfi',
    enabled: true,
    thresholds: {
      daysOpen: 2,
      criticalPathImpact: 1,
    },
    reminderDays: 1,
    autoResolve: false,
  },
  'schedule-slip': {
    id: 'schedule-slip',
    type: 'schedule-slip',
    enabled: true,
    thresholds: {
      daysOverdue: 1,
      criticalPathBuffer: 2,
      variancePercent: 10,
    },
    reminderDays: 2,
    autoResolve: false,
  },
  'delivery-risk': {
    id: 'delivery-risk',
    type: 'delivery-risk',
    enabled: true,
    thresholds: {
      daysPastDue: 1,
      daysUntilDue: 3,
    },
    reminderDays: 1,
    autoResolve: false,
  },
  'cost-variance': {
    id: 'cost-variance',
    type: 'cost-variance',
    enabled: true,
    thresholds: {
      percentThreshold: 90,
      criticalPercent: 105,
      highPercent: 100,
    },
    reminderDays: 7,
    autoResolve: false,
  },
  'budget-overrun': {
    id: 'budget-overrun',
    type: 'budget-overrun',
    enabled: true,
    thresholds: {
      percentThreshold: 90,
      criticalPercent: 100,
      highPercent: 95,
    },
    reminderDays: 7,
    autoResolve: false,
  },
  'missing-approval': {
    id: 'missing-approval',
    type: 'missing-approval',
    enabled: true,
    thresholds: {
      daysWaiting: 5,
      criticalDays: 10,
    },
    reminderDays: 3,
    autoResolve: true,
  },
  'checklist-incomplete': {
    id: 'checklist-incomplete',
    type: 'checklist-incomplete',
    enabled: true,
    thresholds: {
      requiredItemsThreshold: 1,
      daysUntilDue: 2,
    },
    reminderDays: 1,
    autoResolve: true,
  },
}

export async function getInsightConfig(projectId: string): Promise<Record<string, PMInsightConfig>> {
  const config = await spark.kv.get<Record<string, PMInsightConfig>>(`pm-insight-config-${projectId}`)
  return config || DEFAULT_CONFIG
}

export async function updateInsightConfig(
  projectId: string,
  config: Record<string, PMInsightConfig>
): Promise<void> {
  await spark.kv.set(`pm-insight-config-${projectId}`, config)
}

export async function detectRFIAgingSignals(
  projectId: string,
  rfis: RFI[]
): Promise<PMHeuristicSignal[]> {
  const config = await getInsightConfig(projectId)
  const rfiConfig = config['rfi-aging']
  if (!rfiConfig.enabled) return []

  const now = new Date()
  const signals: PMHeuristicSignal[] = []

  const openRFIs = rfis.filter(r => r.status === 'open' || r.status === 'submitted')

  for (const rfi of openRFIs) {
    const daysOpen = (now.getTime() - new Date(rfi.submittedDate).getTime()) / (1000 * 60 * 60 * 24)
    
    let severity: PMInsight['severity'] = 'low'
    let triggered = false

    if (daysOpen >= rfiConfig.thresholds.criticalDays) {
      severity = 'critical'
      triggered = true
    } else if (rfi.priority === 'high' && daysOpen >= rfiConfig.thresholds.highPriorityDays) {
      severity = 'high'
      triggered = true
    } else if (daysOpen >= rfiConfig.thresholds.daysOpen) {
      severity = 'medium'
      triggered = true
    }

    if (triggered) {
      signals.push({
        type: 'rfi-aging',
        severity,
        triggered: true,
        value: daysOpen,
        threshold: rfiConfig.thresholds.daysOpen,
        message: `RFI #${rfi.number} has been open for ${Math.floor(daysOpen)} days`,
        dataIds: [rfi.id],
      })
    }
  }

  return signals
}

export async function detectScheduleSlipSignals(
  projectId: string,
  tasks: Task[]
): Promise<PMHeuristicSignal[]> {
  const config = await getInsightConfig(projectId)
  const scheduleConfig = config['schedule-slip']
  if (!scheduleConfig.enabled) return []

  const now = new Date()
  const signals: PMHeuristicSignal[] = []

  for (const task of tasks) {
    if (task.status === 'completed') continue

    const endDate = new Date(task.endDate)
    const daysOverdue = (now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)

    if (daysOverdue > scheduleConfig.thresholds.daysOverdue) {
      const severity: PMInsight['severity'] = task.isCriticalPath
        ? 'critical'
        : daysOverdue > 7
        ? 'high'
        : 'medium'

      signals.push({
        type: 'schedule-slip',
        severity,
        triggered: true,
        value: daysOverdue,
        threshold: scheduleConfig.thresholds.daysOverdue,
        message: `Task "${task.name}" is ${Math.floor(daysOverdue)} days overdue${
          task.isCriticalPath ? ' (Critical Path)' : ''
        }`,
        dataIds: [task.id],
      })
    }

    if (task.baselineEndDate && !task.isCriticalPath) {
      const baselineEnd = new Date(task.baselineEndDate)
      const variance = (endDate.getTime() - baselineEnd.getTime()) / (1000 * 60 * 60 * 24)
      const variancePercent = (variance / ((baselineEnd.getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60 * 24))) * 100

      if (Math.abs(variancePercent) > scheduleConfig.thresholds.variancePercent) {
        signals.push({
          type: 'schedule-slip',
          severity: 'medium',
          triggered: true,
          value: variancePercent,
          threshold: scheduleConfig.thresholds.variancePercent,
          message: `Task "${task.name}" has ${Math.floor(Math.abs(variancePercent))}% schedule variance vs baseline`,
          dataIds: [task.id],
        })
      }
    }
  }

  return signals
}

export async function detectDeliveryRiskSignals(
  projectId: string,
  deliveries: Delivery[]
): Promise<PMHeuristicSignal[]> {
  const config = await getInsightConfig(projectId)
  const deliveryConfig = config['delivery-risk']
  if (!deliveryConfig.enabled) return []

  const now = new Date()
  const signals: PMHeuristicSignal[] = []

  for (const delivery of deliveries) {
    if (delivery.status === 'delivered' || delivery.status === 'cancelled') continue

    const expectedDate = new Date(delivery.expectedDate)
    const daysDiff = (expectedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

    if (daysDiff < 0) {
      const daysPastDue = Math.abs(daysDiff)
      signals.push({
        type: 'delivery-risk',
        severity: daysPastDue > 7 ? 'critical' : daysPastDue > 3 ? 'high' : 'medium',
        triggered: true,
        value: daysPastDue,
        threshold: deliveryConfig.thresholds.daysPastDue,
        message: `Delivery "${delivery.description}" is ${Math.floor(daysPastDue)} days overdue`,
        dataIds: [delivery.id],
      })
    } else if (
      daysDiff <= deliveryConfig.thresholds.daysUntilDue &&
      delivery.status === 'pending'
    ) {
      signals.push({
        type: 'delivery-risk',
        severity: 'medium',
        triggered: true,
        value: daysDiff,
        threshold: deliveryConfig.thresholds.daysUntilDue,
        message: `Delivery "${delivery.description}" is due in ${Math.ceil(daysDiff)} days`,
        dataIds: [delivery.id],
      })
    }

    if (delivery.risks && delivery.risks.length > 0) {
      signals.push({
        type: 'delivery-risk',
        severity: 'high',
        triggered: true,
        value: delivery.risks.length,
        threshold: 0,
        message: `Delivery "${delivery.description}" has ${delivery.risks.length} identified risk(s)`,
        dataIds: [delivery.id],
      })
    }
  }

  return signals
}

export async function detectBudgetOverrunSignals(
  projectId: string,
  budgets: Budget[],
  costCodes: CostCode[]
): Promise<PMHeuristicSignal[]> {
  const config = await getInsightConfig(projectId)
  const budgetConfig = config['budget-overrun']
  if (!budgetConfig.enabled) return []

  const signals: PMHeuristicSignal[] = []

  for (const budget of budgets) {
    const allocated = budget.allocatedAmount
    const actual = budget.actualAmount || 0

    if (allocated === 0) continue

    const percentUsed = (actual / allocated) * 100

    if (percentUsed >= budgetConfig.thresholds.criticalPercent) {
      const costCode = costCodes.find(cc => cc.id === budget.costCodeId)
      signals.push({
        type: 'budget-overrun',
        severity: 'critical',
        triggered: true,
        value: percentUsed,
        threshold: budgetConfig.thresholds.criticalPercent,
        message: `Cost code "${costCode?.name || 'Unknown'}" has exceeded budget (${percentUsed.toFixed(1)}%)`,
        dataIds: [budget.id, budget.costCodeId || ''],
      })
    } else if (percentUsed >= budgetConfig.thresholds.highPercent) {
      const costCode = costCodes.find(cc => cc.id === budget.costCodeId)
      signals.push({
        type: 'budget-overrun',
        severity: 'high',
        triggered: true,
        value: percentUsed,
        threshold: budgetConfig.thresholds.highPercent,
        message: `Cost code "${costCode?.name || 'Unknown'}" is at ${percentUsed.toFixed(1)}% of budget`,
        dataIds: [budget.id, budget.costCodeId || ''],
      })
    } else if (percentUsed >= budgetConfig.thresholds.percentThreshold) {
      const costCode = costCodes.find(cc => cc.id === budget.costCodeId)
      signals.push({
        type: 'budget-overrun',
        severity: 'medium',
        triggered: true,
        value: percentUsed,
        threshold: budgetConfig.thresholds.percentThreshold,
        message: `Cost code "${costCode?.name || 'Unknown'}" is at ${percentUsed.toFixed(1)}% of budget`,
        dataIds: [budget.id, budget.costCodeId || ''],
      })
    }
  }

  return signals
}

export async function detectMissingApprovalSignals(
  projectId: string
): Promise<PMHeuristicSignal[]> {
  const config = await getInsightConfig(projectId)
  const approvalConfig = config['missing-approval']
  if (!approvalConfig.enabled) return []

  const signals: PMHeuristicSignal[] = []
  
  const changeOrders = (await spark.kv.get<any[]>(`change-orders-${projectId}`)) || []
  const submittals = (await spark.kv.get<any[]>(`submittals-${projectId}`)) || []

  const now = new Date()

  for (const co of changeOrders) {
    if (co.status === 'submitted' || co.status === 'pending-approval') {
      const daysWaiting = (now.getTime() - new Date(co.requestedDate).getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysWaiting >= approvalConfig.thresholds.criticalDays) {
        signals.push({
          type: 'missing-approval',
          severity: 'critical',
          triggered: true,
          value: daysWaiting,
          threshold: approvalConfig.thresholds.criticalDays,
          message: `Change Order #${co.number} pending approval for ${Math.floor(daysWaiting)} days`,
          dataIds: [co.id],
        })
      } else if (daysWaiting >= approvalConfig.thresholds.daysWaiting) {
        signals.push({
          type: 'missing-approval',
          severity: 'high',
          triggered: true,
          value: daysWaiting,
          threshold: approvalConfig.thresholds.daysWaiting,
          message: `Change Order #${co.number} pending approval for ${Math.floor(daysWaiting)} days`,
          dataIds: [co.id],
        })
      }
    }
  }

  for (const submittal of submittals) {
    if (submittal.status === 'submitted' || submittal.status === 'under-review') {
      const daysWaiting = (now.getTime() - new Date(submittal.submittedDate).getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysWaiting >= approvalConfig.thresholds.criticalDays) {
        signals.push({
          type: 'missing-approval',
          severity: 'critical',
          triggered: true,
          value: daysWaiting,
          threshold: approvalConfig.thresholds.criticalDays,
          message: `Submittal "${submittal.title}" pending ${Math.floor(daysWaiting)} days`,
          dataIds: [submittal.id],
        })
      } else if (daysWaiting >= approvalConfig.thresholds.daysWaiting) {
        signals.push({
          type: 'missing-approval',
          severity: 'medium',
          triggered: true,
          value: daysWaiting,
          threshold: approvalConfig.thresholds.daysWaiting,
          message: `Submittal "${submittal.title}" pending ${Math.floor(daysWaiting)} days`,
          dataIds: [submittal.id],
        })
      }
    }
  }

  return signals
}

export async function detectChecklistIncompleteSignals(
  projectId: string,
  checklistItems: ProjectChecklistItem[]
): Promise<PMHeuristicSignal[]> {
  const config = await getInsightConfig(projectId)
  const checklistConfig = config['checklist-incomplete']
  if (!checklistConfig.enabled) return []

  const signals: PMHeuristicSignal[] = []

  const requiredIncomplete = checklistItems.filter(item => item.required && !item.completed)

  if (requiredIncomplete.length >= checklistConfig.thresholds.requiredItemsThreshold) {
    signals.push({
      type: 'checklist-incomplete',
      severity: requiredIncomplete.length > 5 ? 'high' : 'medium',
      triggered: true,
      value: requiredIncomplete.length,
      threshold: checklistConfig.thresholds.requiredItemsThreshold,
      message: `${requiredIncomplete.length} required checklist items incomplete`,
      dataIds: requiredIncomplete.map(item => item.id),
    })
  }

  return signals
}

export async function detectCriticalPathRFISignals(
  projectId: string,
  rfis: RFI[],
  tasks: Task[]
): Promise<PMHeuristicSignal[]> {
  const config = await getInsightConfig(projectId)
  const rfiConfig = config['critical-path-task-rfi']
  if (!rfiConfig.enabled) return []

  const now = new Date()
  const signals: PMHeuristicSignal[] = []

  const criticalPathTasks = tasks.filter(t => t.isCriticalPath && t.status !== 'completed')
  
  for (const task of criticalPathTasks) {
    const relatedRFIs = rfis.filter(
      rfi =>
        (rfi.status === 'open' || rfi.status === 'escalated') &&
        (rfi.question.toLowerCase().includes(task.name.toLowerCase()) ||
          task.description?.toLowerCase().includes(rfi.number))
    )

    for (const rfi of relatedRFIs) {
      const daysOpen = (now.getTime() - new Date(rfi.submittedDate).getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysOpen >= rfiConfig.thresholds.daysOpen) {
        signals.push({
          type: 'critical-path-task-rfi',
          severity: 'critical',
          triggered: true,
          value: daysOpen,
          threshold: rfiConfig.thresholds.daysOpen,
          message: `RFI #${rfi.number} affecting critical path task "${task.name}" open for ${Math.floor(daysOpen)} days`,
          dataIds: [rfi.id, task.id],
        })
      }
    }
  }

  return signals
}

export async function detectCostVarianceSignals(
  projectId: string,
  budgets: Budget[],
  costCodes: CostCode[]
): Promise<PMHeuristicSignal[]> {
  const config = await getInsightConfig(projectId)
  const costConfig = config['cost-variance']
  if (!costConfig.enabled) return []

  const signals: PMHeuristicSignal[] = []

  for (const budget of budgets) {
    const budgeted = budget.budgetedAmount || budget.allocatedAmount
    const actual = budget.actualAmount || 0

    if (budgeted === 0) continue

    const percentSpent = (actual / budgeted) * 100
    const variance = actual - budgeted

    if (percentSpent >= costConfig.thresholds.criticalPercent) {
      const costCode = costCodes.find(cc => cc.id === budget.costCodeId)
      signals.push({
        type: 'cost-variance',
        severity: 'critical',
        triggered: true,
        value: percentSpent,
        threshold: costConfig.thresholds.criticalPercent,
        message: `Cost code "${costCode?.name || 'Unknown'}" actuals exceed budget by ${Math.abs(variance).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} (${percentSpent.toFixed(1)}%)`,
        dataIds: [budget.id, budget.costCodeId || ''],
      })
    } else if (percentSpent >= costConfig.thresholds.highPercent) {
      const costCode = costCodes.find(cc => cc.id === budget.costCodeId)
      signals.push({
        type: 'cost-variance',
        severity: 'high',
        triggered: true,
        value: percentSpent,
        threshold: costConfig.thresholds.highPercent,
        message: `Cost code "${costCode?.name || 'Unknown'}" at ${percentSpent.toFixed(1)}% of budget (variance: ${variance >= 0 ? '+' : ''}${variance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })})`,
        dataIds: [budget.id, budget.costCodeId || ''],
      })
    } else if (percentSpent >= costConfig.thresholds.percentThreshold) {
      const costCode = costCodes.find(cc => cc.id === budget.costCodeId)
      signals.push({
        type: 'cost-variance',
        severity: 'medium',
        triggered: true,
        value: percentSpent,
        threshold: costConfig.thresholds.percentThreshold,
        message: `Cost code "${costCode?.name || 'Unknown'}" approaching budget at ${percentSpent.toFixed(1)}%`,
        dataIds: [budget.id, budget.costCodeId || ''],
      })
    }
  }

  return signals
}

export async function runAllHeuristics(projectId: string): Promise<PMHeuristicSignal[]> {
  const [tasks, rfis, deliveries, budgets, costCodes, checklistItems] = await Promise.all([
    spark.kv.get<Task[]>(`schedule-tasks-${projectId}`) || [],
    spark.kv.get<RFI[]>(`rfis-${projectId}`) || [],
    spark.kv.get<Delivery[]>(`deliveries-${projectId}`) || [],
    spark.kv.get<Budget[]>(`budgets-${projectId}`) || [],
    spark.kv.get<CostCode[]>('costCodes') || [],
    spark.kv.get<ProjectChecklistItem[]>(`checklist-items-${projectId}`) || [],
  ])

  const [
    rfiSignals,
    criticalPathRFISignals,
    scheduleSignals,
    deliverySignals,
    budgetSignals,
    costVarianceSignals,
    approvalSignals,
    checklistSignals,
  ] = await Promise.all([
    detectRFIAgingSignals(projectId, rfis),
    detectCriticalPathRFISignals(projectId, rfis, tasks),
    detectScheduleSlipSignals(projectId, tasks),
    detectDeliveryRiskSignals(projectId, deliveries),
    detectBudgetOverrunSignals(projectId, budgets, costCodes),
    detectCostVarianceSignals(projectId, budgets, costCodes),
    detectMissingApprovalSignals(projectId),
    detectChecklistIncompleteSignals(projectId, checklistItems),
  ])

  return [
    ...rfiSignals,
    ...criticalPathRFISignals,
    ...scheduleSignals,
    ...deliverySignals,
    ...budgetSignals,
    ...costVarianceSignals,
    ...approvalSignals,
    ...checklistSignals,
  ]
}

export async function signalToInsight(
  projectId: string,
  signal: PMHeuristicSignal
): Promise<PMInsight> {
  const entityRefs: PMInsight['entityRefs'] = []
  const recommendedActions: PMInsight['recommendedActions'] = []
  const now = new Date().toISOString()

  const reasoningInputs: PMInsight['reasoningInputs'] = {
    sourceData: {
      signalType: signal.type,
      detectedValue: signal.value,
      entityIds: signal.dataIds,
    },
    thresholds: {
      configured: signal.threshold,
    },
    calculations: {
      actualValue: signal.value,
      thresholdValue: signal.threshold,
      variance: signal.value - signal.threshold,
    },
    triggers: [signal.message],
  }

  switch (signal.type) {
    case 'rfi-aging':
      entityRefs.push({
        type: 'rfi',
        id: signal.dataIds[0],
        label: `RFI #${signal.dataIds[0].slice(0, 8)}`,
        link: `/projects/${projectId}/rfis?highlight=${signal.dataIds[0]}`,
      })
      recommendedActions.push({
        action: 'Follow up on RFI response',
        priority: signal.severity === 'critical' ? 'high' : 'medium',
        link: `/projects/${projectId}/rfis?highlight=${signal.dataIds[0]}`,
      })
      reasoningInputs.sourceData.daysOpen = signal.value
      reasoningInputs.thresholds.daysOpenThreshold = signal.threshold
      break

    case 'critical-path-task-rfi':
      entityRefs.push({
        type: 'rfi',
        id: signal.dataIds[0],
        label: `RFI #${signal.dataIds[0].slice(0, 8)}`,
        link: `/projects/${projectId}/rfis?highlight=${signal.dataIds[0]}`,
      })
      entityRefs.push({
        type: 'task',
        id: signal.dataIds[1],
        label: `Critical Path Task`,
        link: `/projects/${projectId}/schedule?highlight=${signal.dataIds[1]}`,
      })
      recommendedActions.push({
        action: 'Escalate RFI immediately - impacts critical path',
        priority: 'high',
        link: `/projects/${projectId}/rfis?highlight=${signal.dataIds[0]}`,
      })
      recommendedActions.push({
        action: 'Review task dependencies and potential workarounds',
        priority: 'high',
        link: `/projects/${projectId}/schedule?highlight=${signal.dataIds[1]}`,
      })
      reasoningInputs.sourceData.criticalPathImpact = true
      reasoningInputs.sourceData.daysOpen = signal.value
      break

    case 'schedule-slip':
      entityRefs.push({
        type: 'task',
        id: signal.dataIds[0],
        label: `Task #${signal.dataIds[0].slice(0, 8)}`,
        link: `/projects/${projectId}/schedule?highlight=${signal.dataIds[0]}`,
      })
      recommendedActions.push({
        action: 'Update task schedule or mark complete',
        priority: signal.severity === 'critical' ? 'high' : 'medium',
        link: `/projects/${projectId}/schedule?highlight=${signal.dataIds[0]}`,
      })
      reasoningInputs.sourceData.daysOverdue = signal.value
      break

    case 'delivery-risk':
      entityRefs.push({
        type: 'delivery',
        id: signal.dataIds[0],
        label: `Delivery #${signal.dataIds[0].slice(0, 8)}`,
        link: `/projects/${projectId}/deliveries?highlight=${signal.dataIds[0]}`,
      })
      recommendedActions.push({
        action: 'Contact supplier and update delivery status',
        priority: 'high',
        link: `/projects/${projectId}/deliveries?highlight=${signal.dataIds[0]}`,
      })
      reasoningInputs.sourceData.daysDifference = signal.value
      break

    case 'cost-variance':
      entityRefs.push({
        type: 'cost-code',
        id: signal.dataIds[1],
        label: `Cost Code`,
        link: `/projects/${projectId}/cost-codes?highlight=${signal.dataIds[1]}`,
      })
      recommendedActions.push({
        action: 'Review cost code actuals and forecast',
        priority: signal.severity === 'critical' ? 'high' : 'medium',
        link: `/projects/${projectId}/budget-tracking?costCode=${signal.dataIds[1]}`,
      })
      recommendedActions.push({
        action: 'Evaluate cost-saving measures or re-allocate budget',
        priority: 'medium',
        link: `/projects/${projectId}/financials`,
      })
      reasoningInputs.sourceData.percentSpent = signal.value
      reasoningInputs.calculations.budgetUtilization = signal.value
      break

    case 'budget-overrun':
      entityRefs.push({
        type: 'cost-code',
        id: signal.dataIds[1],
        label: `Cost Code`,
        link: `/projects/${projectId}/cost-codes?highlight=${signal.dataIds[1]}`,
      })
      recommendedActions.push({
        action: 'Review budget allocation and spending',
        priority: signal.severity === 'critical' ? 'high' : 'medium',
        link: `/projects/${projectId}/budget-tracking`,
      })
      reasoningInputs.sourceData.percentUsed = signal.value
      break

    case 'missing-approval':
      recommendedActions.push({
        action: 'Escalate approval request',
        priority: 'high',
        link: `/projects/${projectId}/change-orders`,
      })
      reasoningInputs.sourceData.daysWaiting = signal.value
      break

    case 'checklist-incomplete':
      entityRefs.push(...signal.dataIds.map(id => ({
        type: 'checklist' as const,
        id,
        label: `Checklist Item #${id.slice(0, 8)}`,
        link: `/projects/${projectId}/job-setup?highlight=${id}`,
      })))
      recommendedActions.push({
        action: 'Complete required checklist items',
        priority: 'medium',
        link: `/projects/${projectId}/job-setup`,
      })
      reasoningInputs.sourceData.incompleteCount = signal.value
      break
  }

  return {
    id: crypto.randomUUID(),
    projectId,
    type: signal.type,
    severity: signal.severity,
    title: signal.message,
    details: `Detected by heuristic rule. Value: ${signal.value.toFixed(1)}, Threshold: ${signal.threshold}. ${reasoningInputs.triggers.join('. ')}`,
    detectedAt: now,
    status: 'active',
    entityRefs,
    recommendedActions,
    reasoningInputs,
    createdAt: now,
    updatedAt: now,
  }
}

export async function generateInsightsFromSignals(projectId: string): Promise<PMInsight[]> {
  const signals = await runAllHeuristics(projectId)
  
  const existingInsights = (await spark.kv.get<PMInsight[]>(`pm-insights-${projectId}`)) || []
  
  const newInsights: PMInsight[]= []
  
  for (const signal of signals) {
    const existingInsight = existingInsights.find(
      insight =>
        insight.status === 'active' &&
        insight.type === signal.type &&
        signal.dataIds.some(id => insight.entityRefs.some(ref => ref.id === id))
    )
    
    if (!existingInsight) {
      const insight = await signalToInsight(projectId, signal)
      newInsights.push(insight)
    }
  }

  if (newInsights.length > 0) {
    await spark.kv.set(`pm-insights-${projectId}`, [...existingInsights, ...newInsights])
  }

  return newInsights
}

export async function resolveInsight(
  projectId: string,
  insightId: string,
  resolvedBy: string
): Promise<void> {
  const insights = (await spark.kv.get<PMInsight[]>(`pm-insights-${projectId}`)) || []
  const updated = insights.map(insight =>
    insight.id === insightId
      ? { ...insight, status: 'resolved' as const, resolvedAt: new Date().toISOString(), resolvedBy }
      : insight
  )
  await spark.kv.set(`pm-insights-${projectId}`, updated)
}

export async function dismissInsight(
  projectId: string,
  insightId: string,
  dismissedBy: string,
  reason: string
): Promise<void> {
  const insights = (await spark.kv.get<PMInsight[]>(`pm-insights-${projectId}`)) || []
  const updated = insights.map(insight =>
    insight.id === insightId
      ? {
          ...insight,
          status: 'dismissed' as const,
          dismissedAt: new Date().toISOString(),
          dismissedBy,
          dismissReason: reason,
        }
      : insight
  )
  await spark.kv.set(`pm-insights-${projectId}`, updated)
}

export async function generateDailyBrief(projectId: string, enhanceWithLLM: boolean = false): Promise<PMDailyBrief> {
  const insights = (await spark.kv.get<PMInsight[]>(`pm-insights-${projectId}`)) || []
  const activeInsights = insights.filter(i => i.status === 'active')

  const insightCount = {
    total: activeInsights.length,
    critical: activeInsights.filter(i => i.severity === 'critical').length,
    high: activeInsights.filter(i => i.severity === 'high').length,
    medium: activeInsights.filter(i => i.severity === 'medium').length,
    low: activeInsights.filter(i => i.severity === 'low').length,
  }

  const topRisks = activeInsights
    .sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return severityOrder[b.severity] - severityOrder[a.severity]
    })
    .slice(0, 5)
    .map(insight => ({
      type: insight.type,
      title: insight.title,
      severity: insight.severity,
      impact: insight.description,
      insightId: insight.id,
    }))

  const allActions = activeInsights.flatMap(insight =>
    insight.recommendedActions.map(action => ({ ...action, insightId: insight.id }))
  )
  
  const recommendedActions = allActions
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
    .slice(0, 10)

  const tasks = (await spark.kv.get<Task[]>(`schedule-tasks-${projectId}`)) || []
  const rfis = (await spark.kv.get<RFI[]>(`rfis-${projectId}`)) || []
  const budgets = (await spark.kv.get<Budget[]>(`budgets-${projectId}`)) || []
  const deliveries = (await spark.kv.get<any[]>(`deliveries-${projectId}`)) || []

  const now = new Date()
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const scheduleHealth = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 100

  const totalBudget = budgets.reduce((sum, b) => sum + b.allocatedAmount, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + (b.actualAmount || 0), 0)
  const budgetHealth = totalBudget > 0 ? ((totalBudget - totalSpent) / totalBudget) * 100 : 100

  const openRFIs = rfis.filter(r => r.status === 'open' || r.status === 'submitted')
  const respondedRFIs = rfis.filter(r => r.responseDate)
  const avgRFIResponseTime =
    respondedRFIs.length > 0
      ? respondedRFIs.reduce((sum, r) => {
          const response = new Date(r.responseDate!).getTime()
          const submitted = new Date(r.submittedDate).getTime()
          return sum + (response - submitted) / (1000 * 60 * 60 * 24)
        }, 0) / respondedRFIs.length
      : 0

  const onTimeDeliveries = deliveries.filter(
    d => d.status === 'delivered' && new Date(d.actualDate) <= new Date(d.expectedDate)
  ).length
  const deliveryOnTime = deliveries.length > 0 ? (onTimeDeliveries / deliveries.length) * 100 : 100

  let summary = `Project has ${insightCount.total} active insight${insightCount.total !== 1 ? 's' : ''}. `
  if (insightCount.critical > 0) {
    summary += `${insightCount.critical} critical issue${insightCount.critical !== 1 ? 's' : ''} require immediate attention. `
  } else if (insightCount.high > 0) {
    summary += `${insightCount.high} high-priority issue${insightCount.high !== 1 ? 's' : ''} identified. `
  } else {
    summary += 'No critical issues identified. '
  }

  if (enhanceWithLLM) {
    try {
      const prompt = spark.llmPrompt`Generate a concise executive summary (2-3 sentences) for today's project management briefing.

Active Insights:
- Critical: ${insightCount.critical}
- High: ${insightCount.high}
- Medium: ${insightCount.medium}

Top Risks:
${topRisks.map(r => `- ${r.title}`).join('\n')}

Project Health Metrics:
- Schedule Health: ${scheduleHealth.toFixed(1)}%
- Budget Health: ${budgetHealth.toFixed(1)}%
- Average RFI Response: ${avgRFIResponseTime.toFixed(1)} days

Focus on actionable insights for executive decision-making.`

      summary = await spark.llm(prompt, 'gpt-4o-mini')
    } catch (error) {
      console.error('Failed to enhance summary with LLM:', error)
    }
  }

  return {
    projectId,
    date: now.toISOString(),
    summary,
    insightCount,
    topRisks,
    recommendedActions,
    metrics: {
      scheduleHealth,
      budgetHealth,
      rfiResponseTime: avgRFIResponseTime,
      deliveryOnTime,
    },
  }
}
