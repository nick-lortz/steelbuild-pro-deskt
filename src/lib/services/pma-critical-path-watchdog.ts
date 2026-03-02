import { db } from '@/lib/db'

export interface CriticalAlert {
  id: string
  projectId: string
  type: 'schedule_vs_production_mismatch' | 'critical_path_delay' | 'detailing_behind' | 'fabrication_behind'
  severity: 'critical' | 'high' | 'medium'
  title: string
  description: string
  impact: string
  recommendation: string
  entityType: 'task' | 'sequence' | 'work_package' | 'detailing'
  entityId: string
  daysUntilDue: number
  createdAt: string
  resolvedAt?: string
  metadata?: Record<string, any>
}

export class PMAcriticalPathWatchdog {
  async scanForCriticalAlerts(projectId: string): Promise<CriticalAlert[]> {
    const alerts: CriticalAlert[] = []
    
    const sequenceAlerts = await this.checkSequenceLogic(projectId)
    alerts.push(...sequenceAlerts)
    
    const detailingAlerts = await this.checkDetailingCriticalPath(projectId)
    alerts.push(...detailingAlerts)
    
    const fabricationAlerts = await this.checkFabricationCriticalPath(projectId)
    alerts.push(...fabricationAlerts)
    
    for (const alert of alerts) {
      const existing = await db.pmaInsights
        .where(['projectId', 'entityId'])
        .equals([projectId, alert.entityId])
        .filter(insight => insight.status === 'open')
        .first()
      
      if (!existing) {
        await db.pmaInsights.add({
          ...alert,
          status: 'open',
          type: 'risk',
          category: 'schedule'
        })
      }
    }
    
    return alerts
  }
  
  private async checkSequenceLogic(projectId: string): Promise<CriticalAlert[]> {
    const alerts: CriticalAlert[] = []
    
    const sequences = await db.erectionSequences
      .where('projectId')
      .equals(projectId)
      .toArray()
    
    for (const sequence of sequences) {
      const daysUntilErection = Math.floor(
        (new Date(sequence.erectionStartDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      
      if (daysUntilErection > 14) continue
      
      const detailings = await db.detailings
        .where('sequenceId')
        .equals(sequence.id)
        .toArray()
      
      const behindDetailings = detailings.filter(d => {
        if (d.status === 'complete') return false
        if (!d.targetDate) return false
        
        const daysUntilTarget = Math.floor(
          (new Date(d.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
        
        return daysUntilTarget < 0
      })
      
      if (behindDetailings.length > 0) {
        alerts.push({
          id: `alert-seq-${sequence.id}-${Date.now()}`,
          projectId,
          type: 'schedule_vs_production_mismatch',
          severity: daysUntilErection < 7 ? 'critical' : 'high',
          title: `Detailing Behind for Sequence: ${sequence.name}`,
          description: `${behindDetailings.length} detailing item(s) are behind schedule with erection starting in ${daysUntilErection} days`,
          impact: `Erection may be delayed if detailing is not completed. This could impact ${daysUntilErection} days of scheduled work.`,
          recommendation: `Prioritize detailing completion for ${sequence.name}. Consider expediting or adding resources.`,
          entityType: 'sequence',
          entityId: sequence.id,
          daysUntilDue: daysUntilErection,
          createdAt: new Date().toISOString(),
          metadata: {
            sequenceName: sequence.name,
            erectionStartDate: sequence.erectionStartDate,
            behindCount: behindDetailings.length,
            totalDetailings: detailings.length
          }
        })
      }
    }
    
    return alerts
  }
  
  private async checkDetailingCriticalPath(projectId: string): Promise<CriticalAlert[]> {
    const alerts: CriticalAlert[] = []
    
    const tasks = await db.tasks
      .where('projectId')
      .equals(projectId)
      .filter(t => t.isCriticalPath)
      .toArray()
    
    for (const task of tasks) {
      const daysUntilStart = Math.floor(
        (new Date(task.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      
      if (daysUntilStart > 14) continue
      
      const detailings = await db.detailings
        .where('linkedTaskIds')
        .equals(task.id)
        .toArray()
      
      const incompleteDetailings = detailings.filter(d => d.status !== 'complete')
      
      if (incompleteDetailings.length > 0 && daysUntilStart < 14) {
        alerts.push({
          id: `alert-task-${task.id}-${Date.now()}`,
          projectId,
          type: 'detailing_behind',
          severity: daysUntilStart < 7 ? 'critical' : 'high',
          title: `Critical Path Task Detailing Behind: ${task.name}`,
          description: `${incompleteDetailings.length} detailing item(s) incomplete for critical path task starting in ${daysUntilStart} days`,
          impact: `This task is on the critical path. Delays will directly impact project completion.`,
          recommendation: `Immediately prioritize detailing for ${task.name}. Escalate to detailing manager.`,
          entityType: 'task',
          entityId: task.id,
          daysUntilDue: daysUntilStart,
          createdAt: new Date().toISOString(),
          metadata: {
            taskName: task.name,
            startDate: task.startDate,
            incompleteCount: incompleteDetailings.length,
            totalDetailings: detailings.length,
            isCriticalPath: true
          }
        })
      }
    }
    
    return alerts
  }
  
  private async checkFabricationCriticalPath(projectId: string): Promise<CriticalAlert[]> {
    const alerts: CriticalAlert[] = []
    
    const workPackages = await db.workPackages
      .where('projectId')
      .equals(projectId)
      .toArray()
    
    for (const wp of workPackages) {
      if (!wp.requiredByDate) continue
      
      const daysUntilRequired = Math.floor(
        (new Date(wp.requiredByDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      
      if (daysUntilRequired > 21) continue
      
      if (wp.status !== 'Fabrication' && daysUntilRequired < 21) {
        let severity: 'critical' | 'high' | 'medium' = 'medium'
        if (daysUntilRequired < 7) severity = 'critical'
        else if (daysUntilRequired < 14) severity = 'high'
        
        alerts.push({
          id: `alert-wp-${wp.id}-${Date.now()}`,
          projectId,
          type: 'fabrication_behind',
          severity,
          title: `Work Package Not in Fabrication: ${wp.name}`,
          description: `Work Package required in ${daysUntilRequired} days but not yet in fabrication status`,
          impact: `Delivery and erection schedules may be impacted. Field crew could be idle.`,
          recommendation: `Check readiness status and move to fabrication immediately if ready. Investigate blockers.`,
          entityType: 'work_package',
          entityId: wp.id,
          daysUntilDue: daysUntilRequired,
          createdAt: new Date().toISOString(),
          metadata: {
            workPackageName: wp.name,
            currentStatus: wp.status,
            requiredByDate: wp.requiredByDate
          }
        })
      }
    }
    
    return alerts
  }
  
  async getCriticalAlertsCount(projectId: string): Promise<number> {
    const alerts = await db.pmaInsights
      .where('projectId')
      .equals(projectId)
      .filter(insight => 
        insight.status === 'open' && 
        (insight.severity === 'critical' || insight.severity === 'high') &&
        (insight.type === 'schedule_vs_production_mismatch' ||
         insight.type === 'critical_path_delay' ||
         insight.type === 'detailing_behind' ||
         insight.type === 'fabrication_behind')
      )
      .count()
    
    return alerts
  }
  
  async resolveAlert(alertId: string, resolution: string): Promise<void> {
    await db.pmaInsights.update(alertId, {
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
      resolution
    })
  }
}

export const pmaCriticalPathWatchdog = new PMAcriticalPathWatchdog()
