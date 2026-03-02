import { toast } from 'sonner'

export interface RevisionConflict {
  workPackageId: string
  workPackageName: string
  drawingSheetId: string
  sheetNumber: string
  currentRevision: string
  newRevision: string
  conflictType: 'major_change' | 'scope_change' | 'pending_co'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  recommendedAction: string
  createdAt: string
}

export interface RevisionImpact {
  affectedPackages: string[]
  affectedTasks: string[]
  affectedFabBatches: string[]
  estimatedDelay: number
  costImpact: number
  requiresChangeOrder: boolean
}

export class RevisionConflictDetector {
  async detectConflictsOnRevisionUpload(
    projectId: string,
    sheetId: string,
    newRevision: string
  ): Promise<RevisionConflict[]> {
    const conflicts: RevisionConflict[] = []
    
    const sheet = await this.getDrawingSheet(sheetId)
    if (!sheet) return conflicts
    
    const affectedPackages = await this.getAffectedWorkPackages(sheetId)
    
    for (const pkg of affectedPackages) {
      if (pkg.status === 'in-progress' || pkg.status === 'ready') {
        const conflict: RevisionConflict = {
          workPackageId: pkg.id,
          workPackageName: pkg.packageNumber,
          drawingSheetId: sheetId,
          sheetNumber: sheet.sheetNumber,
          currentRevision: sheet.currentRevision,
          newRevision,
          conflictType: this.determineConflictType(sheet, newRevision),
          severity: this.calculateSeverity(pkg.status, newRevision),
          description: `Drawing ${sheet.sheetNumber} has new revision ${newRevision}. Package ${pkg.packageNumber} is ${pkg.status} and may be using outdated drawings.`,
          recommendedAction: this.getRecommendedAction(pkg.status),
          createdAt: new Date().toISOString()
        }
        
        conflicts.push(conflict)
        
        await this.movePackageToHold(pkg.id, conflict)
        
        await this.createRevisionAlert(projectId, conflict)
      }
    }
    
    return conflicts
  }
  
  private async getDrawingSheet(sheetId: string): Promise<any> {
    return {
      id: sheetId,
      sheetNumber: 'A101',
      currentRevision: 'REV 2',
      status: 'FFF'
    }
  }
  
  private async getAffectedWorkPackages(sheetId: string): Promise<any[]> {
    return []
  }
  
  private determineConflictType(sheet: any, newRevision: string): RevisionConflict['conflictType'] {
    const revisionNumber = this.extractRevisionNumber(newRevision)
    const currentNumber = this.extractRevisionNumber(sheet.currentRevision)
    
    if (revisionNumber - currentNumber > 1) {
      return 'major_change'
    }
    
    if (newRevision.includes('CO') || newRevision.includes('PCO')) {
      return 'pending_co'
    }
    
    return 'scope_change'
  }
  
  private extractRevisionNumber(revision: string): number {
    const match = revision.match(/\d+/)
    return match ? parseInt(match[0]) : 0
  }
  
  private calculateSeverity(
    packageStatus: string,
    newRevision: string
  ): RevisionConflict['severity'] {
    if (packageStatus === 'ready' || packageStatus === 'in-progress') {
      if (newRevision.includes('CO')) return 'critical'
      return 'high'
    }
    
    if (packageStatus === 'planning') {
      return 'medium'
    }
    
    return 'low'
  }
  
  private getRecommendedAction(packageStatus: string): string {
    switch (packageStatus) {
      case 'ready':
        return 'HOLD shipment immediately. Review drawing changes before proceeding. PM must approve release.'
      case 'in-progress':
        return 'STOP fabrication. Assess work completed against new revision. Determine if rework is required.'
      case 'planning':
        return 'Update package with new revision before starting work.'
      default:
        return 'Review drawing changes and update package documentation.'
    }
  }
  
  private async movePackageToHold(packageId: string, conflict: RevisionConflict): Promise<void> {
    console.log(`Moving package ${packageId} to HOLD status due to revision conflict`)
  }
  
  private async createRevisionAlert(projectId: string, conflict: RevisionConflict): Promise<void> {
    toast.error('Revision Conflict Detected', {
      description: `${conflict.sheetNumber} revision updated. ${conflict.workPackageName} moved to HOLD.`,
      duration: 10000,
      action: {
        label: 'Review',
        onClick: () => window.location.href = `/projects/${projectId}/work-packages/${conflict.workPackageId}`
      }
    })
  }
  
  async analyzeRevisionImpact(
    projectId: string,
    sheetId: string,
    newRevision: string
  ): Promise<RevisionImpact> {
    const affectedPackages = await this.getAffectedWorkPackages(sheetId)
    const affectedTasks: string[] = []
    const affectedFabBatches: string[] = []
    
    let estimatedDelay = 0
    let costImpact = 0
    
    for (const pkg of affectedPackages) {
      if (pkg.status === 'ready' || pkg.status === 'in-progress') {
        estimatedDelay += this.calculatePackageDelay(pkg)
        costImpact += this.calculatePackageCostImpact(pkg)
      }
    }
    
    const requiresChangeOrder = costImpact > 5000 || estimatedDelay > 5
    
    return {
      affectedPackages: affectedPackages.map(p => p.id),
      affectedTasks,
      affectedFabBatches,
      estimatedDelay,
      costImpact,
      requiresChangeOrder
    }
  }
  
  private calculatePackageDelay(pkg: any): number {
    if (pkg.status === 'in-progress') return 7
    if (pkg.status === 'ready') return 3
    return 1
  }
  
  private calculatePackageCostImpact(pkg: any): number {
    if (pkg.status === 'in-progress') return 15000
    if (pkg.status === 'ready') return 5000
    return 500
  }
  
  async approveRevisionForPackage(
    packageId: string,
    approvedBy: string,
    notes: string
  ): Promise<void> {
    console.log(`Revision approved for package ${packageId} by ${approvedBy}`)
    
    toast.success('Revision Approved', {
      description: `Package released from HOLD status.`
    })
  }
  
  async requireChangeOrderForRevision(
    projectId: string,
    conflict: RevisionConflict
  ): Promise<string> {
    const changeOrderId = `co-${Date.now()}`
    
    console.log(`Change Order ${changeOrderId} required for revision conflict`)
    
    return changeOrderId
  }
}

export const revisionConflictDetector = new RevisionConflictDetector()
