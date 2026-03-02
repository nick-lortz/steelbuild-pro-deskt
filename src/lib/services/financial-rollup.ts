import { projectsDb, costCodesDb, changeOrdersDb } from '../db'
import type { Project, CostCode, ChangeOrder } from '../types'

export interface ProjectFinancials {
  contractValue: number
  budgetAmount: number
  actualCosts: number
  marginAtRisk: number
  variance: number
  variancePercent: number
  costHealth: 'healthy' | 'warning' | 'critical'
}

export async function calculateProjectFinancials(projectId: string): Promise<ProjectFinancials> {
  const project = await projectsDb.getById(projectId)
  if (!project) {
    throw new Error('Project not found')
  }

  const costCodes = await costCodesDb.getByProject(projectId)
  const changeOrders = await changeOrdersDb.getByProject(projectId)

  const baseBudget = costCodes.reduce((sum, cc) => sum + (cc.budgetAmount || 0), 0)
  
  const approvedCOValue = changeOrders
    .filter(co => co.status === 'approved')
    .reduce((sum, co) => sum + (co.amount || 0), 0)
  
  const contractValue = (project.contractValue || 0) + approvedCOValue
  const totalBudget = baseBudget + approvedCOValue
  
  const actualCosts = costCodes.reduce((sum, cc) => sum + (cc.actualAmount || 0), 0)
  
  const variance = totalBudget - actualCosts
  const variancePercent = totalBudget > 0 ? (variance / totalBudget) * 100 : 0
  
  const marginAtRisk = actualCosts > totalBudget ? actualCosts - totalBudget : 0
  
  let costHealth: 'healthy' | 'warning' | 'critical' = 'healthy'
  if (variancePercent < -10) {
    costHealth = 'critical'
  } else if (variancePercent < 0) {
    costHealth = 'warning'
  }

  return {
    contractValue,
    budgetAmount: totalBudget,
    actualCosts,
    marginAtRisk,
    variance,
    variancePercent,
    costHealth,
  }
}

export async function triggerFinancialRollup(projectId: string): Promise<void> {
  try {
    const financials = await calculateProjectFinancials(projectId)
    
    await projectsDb.update(projectId, {
      contractValue: financials.contractValue,
      budgetAmount: financials.budgetAmount,
      actualCosts: financials.actualCosts,
      marginAtRisk: financials.marginAtRisk,
    })
    
    const event = new CustomEvent('financialRollupComplete', {
      detail: { projectId, financials }
    })
    window.dispatchEvent(event)
  } catch (error) {
    console.error('Financial rollup failed:', error)
    throw error
  }
}

export async function recalculateAllProjectFinancials(): Promise<Map<string, ProjectFinancials>> {
  const projects = await projectsDb.getAll()
  const results = new Map<string, ProjectFinancials>()
  
  for (const project of projects) {
    try {
      const financials = await calculateProjectFinancials(project.id)
      results.set(project.id, financials)
      
      await projectsDb.update(project.id, {
        contractValue: financials.contractValue,
        budgetAmount: financials.budgetAmount,
        actualCosts: financials.actualCosts,
        marginAtRisk: financials.marginAtRisk,
      })
    } catch (error) {
      console.error(`Failed to calculate financials for project ${project.id}:`, error)
    }
  }
  
  return results
}

export function getCostHealthSignal(variancePercent: number): 'green' | 'yellow' | 'red' {
  if (variancePercent >= 5) return 'green'
  if (variancePercent >= -5) return 'yellow'
  return 'red'
}

export async function validateCostCodeTotal(projectId: string): Promise<{
  isValid: boolean
  expectedTotal: number
  actualTotal: number
  discrepancy: number
}> {
  const project = await projectsDb.getById(projectId)
  const costCodes = await costCodesDb.getByProject(projectId)
  
  const actualTotal = costCodes.reduce((sum, cc) => sum + (cc.budgetAmount || 0), 0)
  const expectedTotal = project?.budgetAmount || 0
  const discrepancy = Math.abs(expectedTotal - actualTotal)
  
  return {
    isValid: discrepancy < 0.01,
    expectedTotal,
    actualTotal,
    discrepancy,
  }
}
