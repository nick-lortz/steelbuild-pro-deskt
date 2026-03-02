import { toast } from 'sonner'

export interface AdvancedPMAInsight {
  id: string
  projectId: string
  type: 'rts-gate' | 'erection-sync' | 'earned-value' | 'revision-conflict'
  severity: 'info' | 'warning' | 'high' | 'critical'
  title: string
  description: string
  impact: string
  recommendedAction: string
  affectedEntities: {
    type: string
    id: string
    name: string
  }[]
  metrics?: {
    label: string
    value: string | number
    status?: 'good' | 'warning' | 'critical'
  }[]
  deepLinks: {
    label: string
    url: string
  }[]
  status: 'open' | 'acknowledged' | 'resolved'
  priority: number
  createdAt: string
  acknowledgedAt?: string
  resolvedAt?: string
  resolvedBy?: string
}

export class AdvancedPMAEngine {
  
  async scanReadyToShipGates(projectId: string): Promise<AdvancedPMAInsight[]> {
    const insights: AdvancedPMAInsight[] = []
    
    const workPackages = await this.getWorkPackages(projectId)
    
    for (const pkg of workPackages) {
      if (pkg.status === 'ready' || pkg.status === 'in-progress') {
        const readinessCheck = await this.checkRTSReadiness(pkg)
        
        if (!readinessCheck.isReadyToShip) {
          const failedChecks = readinessCheck.failedCategories
          
          insights.push({
            id: `rts-${pkg.id}-${Date.now()}`,
            projectId,
            type: 'rts-gate',
            severity: readinessCheck.criticalFailures > 0 ? 'critical' : 'high',
            title: `Work Package ${pkg.packageNumber} Not Ready to Ship`,
            description: `Package marked as ${pkg.status} but does not meet RTS criteria`,
            impact: `Cannot proceed to fabrication safely. ${readinessCheck.criticalFailures} critical issue(s) detected.`,
            recommendedAction: 'HOLD shipment and resolve blockers before releasing to shop',
            affectedEntities: [
              { type: 'work-package', id: pkg.id, name: pkg.packageNumber }
            ],
            metrics: [
              { label: 'Detailing', value: `${readinessCheck.detailing.fffCount}/${readinessCheck.detailing.total} FFF`, status: readinessCheck.detailing.status },
              { label: 'QC', value: `${readinessCheck.qc.passedCount}/${readinessCheck.qc.total} Passed`, status: readinessCheck.qc.status },
              { label: 'RFIs', value: `${readinessCheck.rfis.openCount} Open`, status: readinessCheck.rfis.status }
            ],
            deepLinks: [
              { label: 'View Package', url: `/projects/${projectId}/work-packages/${pkg.id}` },
              { label: 'Readiness Dashboard', url: `/projects/${projectId}/work-packages/readiness` }
            ],
            status: 'open',
            priority: readinessCheck.criticalFailures > 0 ? 1 : 2,
            createdAt: new Date().toISOString()
          })
        }
      }
    }
    
    return insights
  }
  
  async scanErectionLookAheadSync(projectId: string): Promise<AdvancedPMAInsight[]> {
    const insights: AdvancedPMAInsight[] = []
    
    const scheduleChanges = await this.detectScheduleChanges(projectId)
    
    for (const change of scheduleChanges) {
      if (Math.abs(change.daysDelta) >= 2) {
        const affectedFabBatches = await this.getLinkedFabBatches(change.taskId)
        
        const severity = this.calculateScheduleChangeSeverity(change.daysDelta, change.daysUntilStart)
        
        insights.push({
          id: `erection-sync-${change.taskId}-${Date.now()}`,
          projectId,
          type: 'erection-sync',
          severity,
          title: `Erection Schedule Updated: ${change.taskName}`,
          description: `Task moved ${Math.abs(change.daysDelta)} days ${change.daysDelta < 0 ? 'earlier' : 'later'}`,
          impact: `${affectedFabBatches.length} fabrication batch(es) priority updated automatically`,
          recommendedAction: change.daysDelta < 0 
            ? `Expedite fabrication for ${change.taskName}. Alert shop foreman immediately.`
            : `Fabrication priority reduced. Consider resequencing shop schedule.`,
          affectedEntities: [
            { type: 'task', id: change.taskId, name: change.taskName },
            ...affectedFabBatches.map(batch => ({ type: 'fab-batch', id: batch.id, name: batch.batchNumber }))
          ],
          metrics: [
            { label: 'Original Date', value: new Date(change.originalDate).toLocaleDateString(), status: 'warning' },
            { label: 'New Date', value: new Date(change.newDate).toLocaleDateString(), status: severity === 'critical' ? 'critical' : 'warning' },
            { label: 'Days Delta', value: `${change.daysDelta > 0 ? '+' : ''}${change.daysDelta}`, status: change.daysDelta < 0 ? 'critical' : 'good' },
            { label: 'Fab Batches Affected', value: affectedFabBatches.length, status: affectedFabBatches.length > 3 ? 'warning' : 'good' }
          ],
          deepLinks: [
            { label: 'View Schedule', url: `/projects/${projectId}/schedule` },
            { label: 'View Fabrication', url: `/projects/${projectId}/fab-tracking` },
            { label: 'Lookahead Planning', url: `/projects/${projectId}/lookahead` }
          ],
          status: 'open',
          priority: severity === 'critical' ? 1 : 2,
          createdAt: new Date().toISOString()
        })
      }
    }
    
    return insights
  }
  
  async scanEarnedValue(projectId: string): Promise<AdvancedPMAInsight[]> {
    const insights: AdvancedPMAInsight[] = []
    
    const recentErections = await this.getRecentErections(projectId)
    
    for (const erection of recentErections) {
      const evCalc = await this.calculateEarnedValue(erection)
      
      if (evCalc && evCalc.billableThisPeriod > 0) {
        insights.push({
          id: `ev-${erection.sequenceId}-${Date.now()}`,
          projectId,
          type: 'earned-value',
          severity: 'info',
          title: `Revenue Recognition Updated: ${erection.sequenceName}`,
          description: `${evCalc.tonnageErected} tons erected, ${evCalc.percentComplete}% complete`,
          impact: `$${evCalc.billableThisPeriod.toLocaleString()} added to billable value`,
          recommendedAction: 'Review draft invoice line item and approve for next billing cycle',
          affectedEntities: [
            { type: 'sequence', id: erection.sequenceId, name: erection.sequenceName },
            { type: 'sov', id: evCalc.sovItemId || '', name: 'Schedule of Values' }
          ],
          metrics: [
            { label: 'Tonnage Erected', value: `${evCalc.tonnageErected}/${evCalc.totalTonnage} tons`, status: 'good' },
            { label: 'Percent Complete', value: `${evCalc.percentComplete}%`, status: evCalc.percentComplete >= 75 ? 'good' : 'warning' },
            { label: 'Contract Value', value: `$${evCalc.budgetedValue.toLocaleString()}`, status: 'good' },
            { label: 'Earned Value', value: `$${evCalc.earnedValue.toLocaleString()}`, status: 'good' },
            { label: 'Previously Billed', value: `$${evCalc.previouslyBilled.toLocaleString()}`, status: 'good' },
            { label: 'Billable Now', value: `$${evCalc.billableThisPeriod.toLocaleString()}`, status: evCalc.billableThisPeriod > 0 ? 'good' : 'warning' }
          ],
          deepLinks: [
            { label: 'View Financials', url: `/projects/${projectId}/financials` },
            { label: 'SOV Tracking', url: `/projects/${projectId}/sov-tracking` },
            { label: 'Lookahead', url: `/projects/${projectId}/lookahead` }
          ],
          status: 'open',
          priority: 3,
          createdAt: new Date().toISOString()
        })
      }
    }
    
    return insights
  }
  
  async scanRevisionConflicts(projectId: string): Promise<AdvancedPMAInsight[]> {
    const insights: AdvancedPMAInsight[] = []
    
    const recentRevisions = await this.getRecentDrawingRevisions(projectId)
    
    for (const revision of recentRevisions) {
      const conflicts = await this.detectRevisionConflicts(projectId, revision)
      
      for (const conflict of conflicts) {
        insights.push({
          id: `revision-${conflict.workPackageId}-${Date.now()}`,
          projectId,
          type: 'revision-conflict',
          severity: conflict.severity,
          title: `Drawing Revision Conflict: ${conflict.sheetNumber}`,
          description: `${conflict.sheetNumber} updated to ${conflict.newRevision}. Package ${conflict.workPackageName} is ${conflict.currentStatus}.`,
          impact: `Package automatically moved to HOLD status. Potential rework required.`,
          recommendedAction: conflict.recommendedAction,
          affectedEntities: [
            { type: 'drawing-sheet', id: conflict.drawingSheetId, name: conflict.sheetNumber },
            { type: 'work-package', id: conflict.workPackageId, name: conflict.workPackageName }
          ],
          metrics: [
            { label: 'Current Revision', value: conflict.currentRevision, status: 'warning' },
            { label: 'New Revision', value: conflict.newRevision, status: 'critical' },
            { label: 'Package Status', value: conflict.currentStatus, status: 'warning' },
            { label: 'Conflict Type', value: conflict.conflictType.replace('-', ' '), status: conflict.severity === 'critical' ? 'critical' : 'warning' }
          ],
          deepLinks: [
            { label: 'View Drawing', url: `/projects/${projectId}/drawings?sheet=${conflict.sheetNumber}` },
            { label: 'View Package', url: `/projects/${projectId}/work-packages/${conflict.workPackageId}` },
            { label: 'Drawing Workflow', url: `/projects/${projectId}/workflow` }
          ],
          status: 'open',
          priority: conflict.severity === 'critical' ? 1 : 2,
          createdAt: new Date().toISOString()
        })
      }
    }
    
    return insights
  }
  
  async generateComprehensiveDailyBrief(projectId: string): Promise<{
    summary: {
      totalInsights: number
      criticalCount: number
      highCount: number
      warningCount: number
      infoCount: number
    }
    insights: AdvancedPMAInsight[]
    recommendations: string[]
  }> {
    const allInsights: AdvancedPMAInsight[] = []
    
    const rtsInsights = await this.scanReadyToShipGates(projectId)
    allInsights.push(...rtsInsights)
    
    const erectionInsights = await this.scanErectionLookAheadSync(projectId)
    allInsights.push(...erectionInsights)
    
    const evInsights = await this.scanEarnedValue(projectId)
    allInsights.push(...evInsights)
    
    const revisionInsights = await this.scanRevisionConflicts(projectId)
    allInsights.push(...revisionInsights)
    
    allInsights.sort((a, b) => a.priority - b.priority)
    
    const summary = {
      totalInsights: allInsights.length,
      criticalCount: allInsights.filter(i => i.severity === 'critical').length,
      highCount: allInsights.filter(i => i.severity === 'high').length,
      warningCount: allInsights.filter(i => i.severity === 'warning').length,
      infoCount: allInsights.filter(i => i.severity === 'info').length
    }
    
    const recommendations: string[] = []
    
    if (summary.criticalCount > 0) {
      recommendations.push(`Address ${summary.criticalCount} critical issue(s) immediately to prevent schedule delays`)
    }
    
    if (rtsInsights.length > 0) {
      recommendations.push(`Review ${rtsInsights.length} work package(s) currently not meeting RTS criteria`)
    }
    
    if (erectionInsights.length > 0) {
      recommendations.push(`Schedule changes detected - coordinate with shop foreman on updated priorities`)
    }
    
    if (revisionInsights.length > 0) {
      recommendations.push(`Drawing revisions uploaded - review conflicts and approve packages for release`)
    }
    
    if (evInsights.length > 0) {
      recommendations.push(`Draft invoice items ready - review and approve for next billing cycle`)
    }
    
    return {
      summary,
      insights: allInsights,
      recommendations
    }
  }
  
  private async checkRTSReadiness(pkg: any): Promise<any> {
    return {
      isReadyToShip: false,
      criticalFailures: 1,
      failedCategories: ['detailing'],
      detailing: { fffCount: 8, total: 10, status: 'warning' },
      qc: { passedCount: 45, total: 50, status: 'warning' },
      rfis: { openCount: 2, status: 'warning' }
    }
  }
  
  private async getWorkPackages(projectId: string): Promise<any[]> {
    return []
  }
  
  private async detectScheduleChanges(projectId: string): Promise<any[]> {
    return []
  }
  
  private async getLinkedFabBatches(taskId: string): Promise<any[]> {
    return []
  }
  
  private calculateScheduleChangeSeverity(daysDelta: number, daysUntilStart: number): AdvancedPMAInsight['severity'] {
    if (daysDelta < -5 || daysUntilStart < 7) return 'critical'
    if (daysDelta < -2 || daysUntilStart < 14) return 'high'
    if (Math.abs(daysDelta) >= 2) return 'warning'
    return 'info'
  }
  
  private async getRecentErections(projectId: string): Promise<any[]> {
    return []
  }
  
  private async calculateEarnedValue(erection: any): Promise<any> {
    return null
  }
  
  private async getRecentDrawingRevisions(projectId: string): Promise<any[]> {
    return []
  }
  
  private async detectRevisionConflicts(projectId: string, revision: any): Promise<any[]> {
    return []
  }
}

export const advancedPMAEngine = new AdvancedPMAEngine()
