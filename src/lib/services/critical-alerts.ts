import { v4 as uuidv4 } from 'uuid'

export type AlertSeverity = 'amber' | 'red' | 'critical'
export type AlertType = 'stale-rfi' | 'budget-leak' | 'drawing-lag' | 'schedule-overrun' | 'blocker-extended'

export interface CriticalAlert {
  id: string
  projectId: string
  type: AlertType
  severity: AlertSeverity
  title: string
  description: string
  actionRequired: string
  entityRefs: Array<{
    entityType: string
    entityId: string
    label: string
    link: string
  }>
  triggeredAt: string
  status: 'active' | 'acknowledged' | 'resolved'
  acknowledgedAt?: string
  acknowledgedBy?: string
  resolvedAt?: string
  resolvedBy?: string
  metadata?: Record<string, any>
}

export interface AlertRule {
  type: AlertType
  severity: AlertSeverity
  checkInterval: number
  condition: (data: any) => boolean
  generateAlert: (data: any) => Omit<CriticalAlert, 'id' | 'projectId' | 'triggeredAt' | 'status'>
}

export const ALERT_RULES: AlertRule[] = [
  {
    type: 'stale-rfi',
    severity: 'amber',
    checkInterval: 3600000,
    condition: (rfi: any) => {
      if (rfi.status !== 'open' && rfi.status !== 'Open') return false
      const submittedDate = new Date(rfi.submitted_date || rfi.submittedDate || rfi.created_at)
      const hoursSinceSubmitted = (Date.now() - submittedDate.getTime()) / (1000 * 60 * 60)
      return hoursSinceSubmitted > 72
    },
    generateAlert: (rfi: any) => {
      const submittedDate = new Date(rfi.submitted_date || rfi.submittedDate || rfi.created_at)
      const hoursSinceSubmitted = Math.floor((Date.now() - submittedDate.getTime()) / (1000 * 60 * 60))
      
      return {
        type: 'stale-rfi',
        severity: 'amber',
        title: `Stale RFI: ${rfi.number || rfi.rfi_number}`,
        description: `RFI has been open for ${hoursSinceSubmitted} hours without response`,
        actionRequired: 'Follow up with architect/engineer for response',
        entityRefs: [
          {
            entityType: 'rfi',
            entityId: rfi.id,
            label: `RFI-${rfi.number || rfi.rfi_number}: ${rfi.subject}`,
            link: `/projects/${rfi.project_id}/rfis`
          }
        ],
        metadata: {
          hoursOpen: hoursSinceSubmitted,
          submittedDate: submittedDate.toISOString(),
          rfiNumber: rfi.number || rfi.rfi_number,
        }
      }
    }
  },
  {
    type: 'budget-leak',
    severity: 'red',
    checkInterval: 1800000,
    condition: (costCode: any) => {
      const budget = costCode.budget_amount || costCode.budgetAmount || 0
      const actual = costCode.actual_amount || costCode.actualAmount || 0
      if (budget === 0) return false
      const percentUsed = (actual / budget) * 100
      return percentUsed > 90
    },
    generateAlert: (costCode: any) => {
      const budget = costCode.budget_amount || costCode.budgetAmount || 0
      const actual = costCode.actual_amount || costCode.actualAmount || 0
      const percentUsed = ((actual / budget) * 100).toFixed(1)
      
      return {
        type: 'budget-leak',
        severity: 'red',
        title: `Budget Overrun Alert: ${costCode.code}`,
        description: `Cost code is at ${percentUsed}% of budget ($${actual.toLocaleString()} / $${budget.toLocaleString()})`,
        actionRequired: 'Review spending and consider change order or budget reallocation',
        entityRefs: [
          {
            entityType: 'cost-code',
            entityId: costCode.id,
            label: `${costCode.code}: ${costCode.description}`,
            link: `/projects/${costCode.project_id}/cost-codes`
          }
        ],
        metadata: {
          percentUsed: parseFloat(percentUsed),
          budgetAmount: budget,
          actualAmount: actual,
          remaining: budget - actual,
          costCode: costCode.code,
        }
      }
    }
  },
  {
    type: 'drawing-lag',
    severity: 'amber',
    checkInterval: 3600000,
    condition: (data: { fabricationStarted: boolean, drawingStatus: string, sheetNo?: string }) => {
      return data.fabricationStarted && data.drawingStatus !== 'FFF'
    },
    generateAlert: (data: { fabricationStarted: boolean, drawingStatus: string, sheetNo?: string, projectId: string, setId?: string, sheetId?: string, setName?: string }) => {
      return {
        type: 'drawing-lag',
        severity: 'amber',
        title: `Potential Error: Fabrication Started on ${data.drawingStatus} Drawing`,
        description: `Fabrication has begun on drawing ${data.sheetNo || 'Unknown'} which is not in FFF (For Fabrication & Field) status`,
        actionRequired: 'Verify drawing status or halt fabrication to prevent rework',
        entityRefs: [
          {
            entityType: 'drawing',
            entityId: data.sheetId || data.setId || '',
            label: `${data.sheetNo || 'Drawing'} - ${data.drawingStatus} Status`,
            link: `/projects/${data.projectId}/drawings`
          }
        ],
        metadata: {
          currentStatus: data.drawingStatus,
          sheetNo: data.sheetNo,
          setName: data.setName,
        }
      }
    }
  }
]

export async function scanForCriticalAlerts(projectId: string): Promise<CriticalAlert[]> {
  const alerts: CriticalAlert[] = []

  try {
    if (window.SBP?.db) {
      const [rfiResult, costCodeResult, drawingSetsResult] = await Promise.all([
        window.SBP.db.listRFIs(projectId, { status: 'open', limit: 1000 }),
        window.SBP.db.listCostCodes(projectId, { limit: 1000 }),
        window.SBP.db.listDrawingSets(projectId, { limit: 1000 })
      ])

      if (rfiResult.success && rfiResult.data) {
        const staleRfiRule = ALERT_RULES.find(r => r.type === 'stale-rfi')!
        for (const rfi of rfiResult.data) {
          if (staleRfiRule.condition(rfi)) {
            const alertData = staleRfiRule.generateAlert(rfi)
            alerts.push({
              id: uuidv4(),
              projectId,
              ...alertData,
              triggeredAt: new Date().toISOString(),
              status: 'active'
            })
          }
        }
      }

      if (costCodeResult.success && costCodeResult.data) {
        const budgetLeakRule = ALERT_RULES.find(r => r.type === 'budget-leak')!
        for (const costCode of costCodeResult.data) {
          if (budgetLeakRule.condition(costCode)) {
            const alertData = budgetLeakRule.generateAlert(costCode)
            alerts.push({
              id: uuidv4(),
              projectId,
              ...alertData,
              triggeredAt: new Date().toISOString(),
              status: 'active'
            })
          }
        }
      }

      if (drawingSetsResult.success && drawingSetsResult.data) {
        const drawingLagRule = ALERT_RULES.find(r => r.type === 'drawing-lag')!
        
        for (const set of drawingSetsResult.data) {
          const sheetsResult = await window.SBP.db.listDrawingSheets(set.id)
          if (sheetsResult.success && sheetsResult.data) {
            for (const sheet of sheetsResult.data) {
              const fabricationStarted = await checkFabricationStatus(projectId, sheet.sheet_no)
              
              if (drawingLagRule.condition({ 
                fabricationStarted, 
                drawingStatus: sheet.status,
                sheetNo: sheet.sheet_no 
              })) {
                const alertData = drawingLagRule.generateAlert({ 
                  fabricationStarted, 
                  drawingStatus: sheet.status,
                  sheetNo: sheet.sheet_no,
                  projectId,
                  setId: set.id,
                  sheetId: sheet.id,
                  setName: set.name
                })
                alerts.push({
                  id: uuidv4(),
                  projectId,
                  ...alertData,
                  triggeredAt: new Date().toISOString(),
                  status: 'active'
                })
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error scanning for critical alerts:', error)
  }

  return alerts
}

async function checkFabricationStatus(projectId: string, sheetNo?: string): Promise<boolean> {
  try {
    const notesResult = await window.SBP?.db.listProductionNotes(projectId, {
      category: 'fab',
      limit: 1000
    })

    if (notesResult?.success && notesResult.data && sheetNo) {
      return notesResult.data.some(note => 
        note.body.includes(sheetNo) || note.title.includes(sheetNo)
      )
    }
  } catch (error) {
    console.error('Error checking fabrication status:', error)
  }
  
  return false
}

export function getAlertIcon(severity: AlertSeverity): string {
  switch (severity) {
    case 'red':
    case 'critical':
      return '🔴'
    case 'amber':
      return '🟠'
    default:
      return '🟡'
  }
}

export function getAlertPriority(severity: AlertSeverity): number {
  switch (severity) {
    case 'critical':
      return 1
    case 'red':
      return 2
    case 'amber':
      return 3
    default:
      return 4
  }
}

export function sortAlertsBySeverity(alerts: CriticalAlert[]): CriticalAlert[] {
  return [...alerts].sort((a, b) => getAlertPriority(a.severity) - getAlertPriority(b.severity))
}
