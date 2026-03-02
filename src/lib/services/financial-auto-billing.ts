import { db } from '@/lib/db'

export interface EarnedValueCalculation {
  sequenceId: string
  sequenceName: string
  tonnageErected: number
  totalTonnage: number
  percentComplete: number
  budgetedValue: number
  earnedValue: number
  previouslyBilled: number
  billableThisPeriod: number
}

export interface DraftInvoiceLineItem {
  id: string
  projectId: string
  sovItemId: string
  description: string
  scheduledValue: number
  previouslyCompleted: number
  workThisPeriod: number
  materialsPresently: number
  totalCompleted: number
  percentComplete: number
  balance: number
  status: 'draft' | 'approved' | 'invoiced'
  createdAt: string
  metadata: {
    sequenceId?: string
    workPackageId?: string
    tonnageData?: {
      erected: number
      total: number
    }
  }
}

export class FinancialAutoBilling {
  async calculateEarnedValue(projectId: string, sequenceId: string): Promise<EarnedValueCalculation | null> {
    try {
      const sequence = await db.erectionSequences.get(sequenceId)
      if (!sequence) return null
      
      const fieldInstalls = await db.fieldInstalls
        .where('sequenceId')
        .equals(sequenceId)
        .toArray()
      
      const tonnageErected = fieldInstalls
        .filter(fi => fi.status === 'Erected')
        .reduce((sum, fi) => sum + (fi.tonnage || 0), 0)
      
      const totalTonnage = sequence.totalTonnage || 0
      const percentComplete = totalTonnage > 0 ? (tonnageErected / totalTonnage) * 100 : 0
      
      const sovItems = await db.sovItems
        .where('projectId')
        .equals(projectId)
        .filter(item => item.linkedSequenceId === sequenceId)
        .toArray()
      
      const budgetedValue = sovItems.reduce((sum, item) => sum + item.scheduledValue, 0)
      
      const earnedValue = (percentComplete / 100) * budgetedValue
      
      const invoiceLines = await db.invoiceLineItems
        .where('projectId')
        .equals(projectId)
        .filter(line => line.metadata?.sequenceId === sequenceId && line.status === 'invoiced')
        .toArray()
      
      const previouslyBilled = invoiceLines.reduce((sum, line) => sum + line.workThisPeriod, 0)
      
      const billableThisPeriod = Math.max(0, earnedValue - previouslyBilled)
      
      return {
        sequenceId,
        sequenceName: sequence.name,
        tonnageErected,
        totalTonnage,
        percentComplete: Math.round(percentComplete * 100) / 100,
        budgetedValue,
        earnedValue: Math.round(earnedValue * 100) / 100,
        previouslyBilled: Math.round(previouslyBilled * 100) / 100,
        billableThisPeriod: Math.round(billableThisPeriod * 100) / 100
      }
    } catch (error) {
      console.error('Error calculating earned value:', error)
      return null
    }
  }
  
  async generateDraftInvoiceLineItem(calculation: EarnedValueCalculation, projectId: string): Promise<DraftInvoiceLineItem> {
    const sovItems = await db.sovItems
      .where('projectId')
      .equals(projectId)
      .filter(item => item.linkedSequenceId === calculation.sequenceId)
      .toArray()
    
    const primarySovItem = sovItems[0]
    
    const draftLine: DraftInvoiceLineItem = {
      id: `draft-${Date.now()}-${calculation.sequenceId}`,
      projectId,
      sovItemId: primarySovItem?.id || '',
      description: `${calculation.sequenceName} - Erection Progress`,
      scheduledValue: calculation.budgetedValue,
      previouslyCompleted: calculation.previouslyBilled,
      workThisPeriod: calculation.billableThisPeriod,
      materialsPresently: 0,
      totalCompleted: calculation.earnedValue,
      percentComplete: calculation.percentComplete,
      balance: calculation.budgetedValue - calculation.earnedValue,
      status: 'draft',
      createdAt: new Date().toISOString(),
      metadata: {
        sequenceId: calculation.sequenceId,
        tonnageData: {
          erected: calculation.tonnageErected,
          total: calculation.totalTonnage
        }
      }
    }
    
    await db.invoiceLineItems.add(draftLine)
    
    return draftLine
  }
  
  async processFieldErectionUpdate(fieldInstallId: string): Promise<void> {
    const fieldInstall = await db.fieldInstalls.get(fieldInstallId)
    if (!fieldInstall || fieldInstall.status !== 'Erected') return
    
    const sequence = await db.erectionSequences.get(fieldInstall.sequenceId)
    if (!sequence) return
    
    const calculation = await this.calculateEarnedValue(fieldInstall.projectId, fieldInstall.sequenceId)
    if (!calculation || calculation.billableThisPeriod <= 0) return
    
    const existingDraft = await db.invoiceLineItems
      .where('projectId')
      .equals(fieldInstall.projectId)
      .filter(line => 
        line.status === 'draft' && 
        line.metadata?.sequenceId === fieldInstall.sequenceId
      )
      .first()
    
    if (existingDraft) {
      await db.invoiceLineItems.update(existingDraft.id, {
        workThisPeriod: calculation.billableThisPeriod,
        totalCompleted: calculation.earnedValue,
        percentComplete: calculation.percentComplete,
        balance: calculation.budgetedValue - calculation.earnedValue,
        metadata: {
          ...existingDraft.metadata,
          tonnageData: {
            erected: calculation.tonnageErected,
            total: calculation.totalTonnage
          }
        }
      })
    } else {
      await this.generateDraftInvoiceLineItem(calculation, fieldInstall.projectId)
    }
    
    await this.createBillingNotification(fieldInstall.projectId, calculation)
  }
  
  private async createBillingNotification(projectId: string, calculation: EarnedValueCalculation): Promise<void> {
    await db.notifications.add({
      id: `notif-billing-${Date.now()}`,
      projectId,
      userId: 'pm',
      type: 'billing_ready',
      title: 'Draft Invoice Line Generated',
      message: `${calculation.sequenceName}: $${calculation.billableThisPeriod.toLocaleString()} ready for billing (${calculation.percentComplete}% complete)`,
      link: `/projects/${projectId}/financials`,
      read: false,
      createdAt: new Date().toISOString()
    })
  }
  
  async generateG702Application(projectId: string, periodEndDate: string): Promise<any> {
    const draftLines = await db.invoiceLineItems
      .where('projectId')
      .equals(projectId)
      .filter(line => line.status === 'draft')
      .toArray()
    
    const project = await db.projects.get(projectId)
    
    return {
      projectId,
      projectName: project?.name,
      periodEndDate,
      applicationNumber: await this.getNextApplicationNumber(projectId),
      lineItems: draftLines.map(line => ({
        description: line.description,
        scheduledValue: line.scheduledValue,
        workCompleted: {
          previousApplications: line.previouslyCompleted,
          thisApplication: line.workThisPeriod,
          total: line.totalCompleted
        },
        percentComplete: line.percentComplete,
        balanceToFinish: line.balance
      })),
      totals: {
        scheduledValue: draftLines.reduce((sum, l) => sum + l.scheduledValue, 0),
        workCompletedToDate: draftLines.reduce((sum, l) => sum + l.totalCompleted, 0),
        retainage: 0,
        totalEarned: draftLines.reduce((sum, l) => sum + l.totalCompleted, 0)
      }
    }
  }
  
  private async getNextApplicationNumber(projectId: string): Promise<number> {
    const invoices = await db.clientInvoices
      .where('projectId')
      .equals(projectId)
      .toArray()
    
    return invoices.length + 1
  }
}

export const financialAutoBilling = new FinancialAutoBilling()
