import { db } from '@/lib/db'

export interface ReadinessChecklistItem {
  category: 'detailing' | 'materials' | 'rfis'
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: any
}

export interface ReadinessChecklist {
  workPackageId: string
  isReadyToShip: boolean
  overallStatus: 'ready' | 'not-ready' | 'warning'
  checks: ReadinessChecklistItem[]
  lastChecked: string
}

export class ReadinessChecker {
  async checkWorkPackageReadiness(workPackageId: string): Promise<ReadinessChecklist> {
    const checks: ReadinessChecklistItem[] = []
    
    const detailingCheck = await this.checkDetailingStatus(workPackageId)
    checks.push(detailingCheck)
    
    const materialsCheck = await this.checkMaterialsStatus(workPackageId)
    checks.push(materialsCheck)
    
    const rfisCheck = await this.checkRFIsStatus(workPackageId)
    checks.push(rfisCheck)
    
    const failCount = checks.filter(c => c.status === 'fail').length
    const warningCount = checks.filter(c => c.status === 'warning').length
    
    const isReadyToShip = failCount === 0
    const overallStatus = failCount > 0 ? 'not-ready' : warningCount > 0 ? 'warning' : 'ready'
    
    return {
      workPackageId,
      isReadyToShip,
      overallStatus,
      checks,
      lastChecked: new Date().toISOString()
    }
  }
  
  private async checkDetailingStatus(workPackageId: string): Promise<ReadinessChecklistItem> {
    try {
      const workPackage = await db.workPackages.get(workPackageId)
      if (!workPackage) {
        return {
          category: 'detailing',
          status: 'fail',
          message: 'Work package not found'
        }
      }
      
      const drawings = await db.drawings
        .where('workPackageId')
        .equals(workPackageId)
        .toArray()
      
      if (drawings.length === 0) {
        return {
          category: 'detailing',
          status: 'fail',
          message: 'No drawings associated with this work package'
        }
      }
      
      const nonFFFDrawings = drawings.filter(d => d.status !== 'FFF')
      
      if (nonFFFDrawings.length > 0) {
        return {
          category: 'detailing',
          status: 'fail',
          message: `${nonFFFDrawings.length} drawing(s) not at FFF status`,
          details: {
            total: drawings.length,
            fffCount: drawings.filter(d => d.status === 'FFF').length,
            nonFFFDrawings: nonFFFDrawings.map(d => ({
              id: d.id,
              number: d.sheetNumber,
              status: d.status
            }))
          }
        }
      }
      
      return {
        category: 'detailing',
        status: 'pass',
        message: `All ${drawings.length} drawings at FFF (Final for Fabrication)`,
        details: { drawingCount: drawings.length }
      }
    } catch (error) {
      return {
        category: 'detailing',
        status: 'fail',
        message: 'Error checking detailing status: ' + (error as Error).message
      }
    }
  }
  
  private async checkMaterialsStatus(workPackageId: string): Promise<ReadinessChecklistItem> {
    try {
      const pieceMarks = await db.pieceMarks
        .where('workPackageId')
        .equals(workPackageId)
        .toArray()
      
      if (pieceMarks.length === 0) {
        return {
          category: 'materials',
          status: 'warning',
          message: 'No piece marks defined for this package'
        }
      }
      
      const notReceivedMarks = pieceMarks.filter(
        pm => pm.materialStatus !== 'In Stock' && pm.materialStatus !== 'Received'
      )
      
      if (notReceivedMarks.length > 0) {
        return {
          category: 'materials',
          status: 'fail',
          message: `${notReceivedMarks.length} piece mark(s) materials not received`,
          details: {
            total: pieceMarks.length,
            receivedCount: pieceMarks.length - notReceivedMarks.length,
            notReceivedMarks: notReceivedMarks.map(pm => ({
              id: pm.id,
              mark: pm.mark,
              status: pm.materialStatus
            }))
          }
        }
      }
      
      return {
        category: 'materials',
        status: 'pass',
        message: `All ${pieceMarks.length} piece marks materials received`,
        details: { pieceMarkCount: pieceMarks.length }
      }
    } catch (error) {
      return {
        category: 'materials',
        status: 'fail',
        message: 'Error checking materials status: ' + (error as Error).message
      }
    }
  }
  
  private async checkRFIsStatus(workPackageId: string): Promise<ReadinessChecklistItem> {
    try {
      const workPackage = await db.workPackages.get(workPackageId)
      if (!workPackage) {
        return {
          category: 'rfis',
          status: 'fail',
          message: 'Work package not found'
        }
      }
      
      const drawings = await db.drawings
        .where('workPackageId')
        .equals(workPackageId)
        .toArray()
      
      const drawingIds = drawings.map(d => d.id)
      
      const openRFIs = await db.rfis
        .where('projectId')
        .equals(workPackage.projectId)
        .filter(rfi => 
          rfi.status === 'Open' && 
          drawingIds.some(id => rfi.linkedDrawingIds?.includes(id))
        )
        .toArray()
      
      if (openRFIs.length > 0) {
        return {
          category: 'rfis',
          status: 'fail',
          message: `${openRFIs.length} open RFI(s) linked to drawings in this package`,
          details: {
            openRFIs: openRFIs.map(rfi => ({
              id: rfi.id,
              number: rfi.number,
              subject: rfi.subject,
              daysOpen: Math.floor((Date.now() - new Date(rfi.createdAt).getTime()) / (1000 * 60 * 60 * 24))
            }))
          }
        }
      }
      
      return {
        category: 'rfis',
        status: 'pass',
        message: 'No open RFIs linked to this package',
        details: { openRFICount: 0 }
      }
    } catch (error) {
      return {
        category: 'rfis',
        status: 'fail',
        message: 'Error checking RFI status: ' + (error as Error).message
      }
    }
  }
}

export const readinessChecker = new ReadinessChecker()
