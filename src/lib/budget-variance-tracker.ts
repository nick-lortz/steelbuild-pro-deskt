/**
 * Budget Variance Tracking with Drill-Down Analysis
 * 
 * Provides comprehensive budget variance analysis with the ability to drill down
 * into specific cost categories and identify root causes.
 */

import type { BudgetLineItem, BudgetVariance, Expense, CostCode } from './schema'

export interface VarianceAnalysis {
  total_variance: number
  total_variance_percent: number
  favorable_count: number
  unfavorable_count: number
  categories: {
    labor: { variance: number; percent: number }
    material: { variance: number; percent: number }
    equipment: { variance: number; percent: number }
    other: { variance: number; percent: number }
  }
  top_variances: {
    cost_code: string
    description: string
    variance: number
    variance_percent: number
    type: 'favorable' | 'unfavorable'
  }[]
  trend_data: {
    period: string
    variance: number
    cumulative_variance: number
  }[]
  recommendations: string[]
}

export interface DrillDownData {
  cost_code: CostCode
  budgeted: number
  committed: number
  actual: number
  variance: number
  variance_percent: number
  variance_type: 'favorable' | 'unfavorable'
  breakdown: {
    labor: {
      budgeted: number
      actual: number
      variance: number
      expense_details: {
        date: string
        vendor: string
        amount: number
        description: string
      }[]
    }
    material: {
      budgeted: number
      actual: number
      variance: number
      expense_details: {
        date: string
        vendor: string
        amount: number
        description: string
      }[]
    }
    equipment: {
      budgeted: number
      actual: number
      variance: number
      expense_details: {
        date: string
        vendor: string
        amount: number
        description: string
      }[]
    }
    other: {
      budgeted: number
      actual: number
      variance: number
      expense_details: {
        date: string
        vendor: string
        amount: number
        description: string
      }[]
    }
  }
  root_causes: string[]
  corrective_actions: string[]
}

export class BudgetVarianceTracker {
  /**
   * Calculate comprehensive variance analysis for a project budget
   */
  static async analyzeProjectVariance(
    projectId: string,
    budgetLineItems: BudgetLineItem[],
    expenses: Expense[],
    costCodes: CostCode[]
  ): Promise<VarianceAnalysis> {
    const totalVariance = budgetLineItems.reduce((sum, item) => sum + item.variance, 0)
    const totalBudgeted = budgetLineItems.reduce((sum, item) => sum + item.budgeted_amount, 0)
    const totalVariancePercent = totalBudgeted !== 0 ? (totalVariance / totalBudgeted) * 100 : 0

    const favorableCount = budgetLineItems.filter(item => item.variance > 0).length
    const unfavorableCount = budgetLineItems.filter(item => item.variance < 0).length

    const categories = this.calculateCategoryVariances(budgetLineItems, expenses, costCodes)
    const topVariances = this.getTopVariances(budgetLineItems, costCodes)
    const trendData = await this.calculateVarianceTrend(projectId, budgetLineItems, expenses)
    const recommendations = this.generateRecommendations(topVariances, categories)

    return {
      total_variance: totalVariance,
      total_variance_percent: totalVariancePercent,
      favorable_count: favorableCount,
      unfavorable_count: unfavorableCount,
      categories,
      top_variances: topVariances,
      trend_data: trendData,
      recommendations,
    }
  }

  /**
   * Calculate variances by category (labor, material, equipment, other)
   */
  private static calculateCategoryVariances(
    budgetLineItems: BudgetLineItem[],
    expenses: Expense[],
    costCodes: CostCode[]
  ) {
    const categories = {
      labor: { variance: 0, percent: 0, budgeted: 0 },
      material: { variance: 0, percent: 0, budgeted: 0 },
      equipment: { variance: 0, percent: 0, budgeted: 0 },
      other: { variance: 0, percent: 0, budgeted: 0 },
    }

    budgetLineItems.forEach(item => {
      const costCode = costCodes.find(cc => cc.id === item.cost_code_id)
      if (!costCode) return

      const category = this.categorizeCostCode(costCode)
      categories[category].variance += item.variance
      categories[category].budgeted += item.budgeted_amount
    })

    Object.keys(categories).forEach(key => {
      const cat = categories[key as keyof typeof categories]
      cat.percent = cat.budgeted !== 0 ? (cat.variance / cat.budgeted) * 100 : 0
    })

    return categories
  }

  /**
   * Categorize cost code into labor, material, equipment, or other
   */
  private static categorizeCostCode(costCode: CostCode): 'labor' | 'material' | 'equipment' | 'other' {
    const categoryLower = costCode.category.toLowerCase()
    if (categoryLower.includes('labor') || categoryLower.includes('manpower')) return 'labor'
    if (categoryLower.includes('material') || categoryLower.includes('supply')) return 'material'
    if (categoryLower.includes('equipment') || categoryLower.includes('machinery')) return 'equipment'
    return 'other'
  }

  /**
   * Get top variances (both favorable and unfavorable)
   */
  private static getTopVariances(
    budgetLineItems: BudgetLineItem[],
    costCodes: CostCode[],
    limit: number = 10
  ) {
    return budgetLineItems
      .map(item => {
        const costCode = costCodes.find(cc => cc.id === item.cost_code_id)
        const variancePercent = item.budgeted_amount !== 0 
          ? (item.variance / item.budgeted_amount) * 100 
          : 0

        return {
          cost_code: costCode?.code || 'Unknown',
          description: item.description,
          variance: item.variance,
          variance_percent: variancePercent,
          type: (item.variance >= 0 ? 'favorable' : 'unfavorable') as 'favorable' | 'unfavorable',
        }
      })
      .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
      .slice(0, limit)
  }

  /**
   * Calculate variance trend over time
   */
  private static async calculateVarianceTrend(
    projectId: string,
    budgetLineItems: BudgetLineItem[],
    expenses: Expense[]
  ) {
    const periodMap = new Map<string, { variance: number; cumulative: number }>()
    let cumulativeVariance = 0

    const sortedExpenses = [...expenses].sort((a, b) => 
      new Date(a.expense_date).getTime() - new Date(b.expense_date).getTime()
    )

    sortedExpenses.forEach(expense => {
      const period = expense.expense_date.substring(0, 7)
      const budgetItem = budgetLineItems.find(item => item.cost_code_id === expense.cost_code_id)
      
      if (budgetItem) {
        const variance = budgetItem.budgeted_amount - expense.amount
        cumulativeVariance += variance

        if (!periodMap.has(period)) {
          periodMap.set(period, { variance: 0, cumulative: 0 })
        }
        
        const periodData = periodMap.get(period)!
        periodData.variance += variance
        periodData.cumulative = cumulativeVariance
      }
    })

    return Array.from(periodMap.entries()).map(([period, data]) => ({
      period,
      variance: data.variance,
      cumulative_variance: data.cumulative,
    }))
  }

  /**
   * Generate actionable recommendations based on variance analysis
   */
  private static generateRecommendations(
    topVariances: any[],
    categories: any
  ): string[] {
    const recommendations: string[] = []

    const criticalVariances = topVariances.filter(v => 
      v.type === 'unfavorable' && Math.abs(v.variance_percent) > 10
    )

    if (criticalVariances.length > 0) {
      recommendations.push(
        `Review ${criticalVariances.length} cost codes with >10% unfavorable variance`
      )
    }

    if (categories.labor.percent < -5) {
      recommendations.push('Labor costs trending over budget - review crew productivity and overtime')
    }

    if (categories.material.percent < -5) {
      recommendations.push('Material costs over budget - investigate pricing or quantity variances')
    }

    if (categories.equipment.percent < -10) {
      recommendations.push('Equipment costs significantly over budget - review rental vs purchase decisions')
    }

    const totalUnfavorable = topVariances.filter(v => v.type === 'unfavorable').length
    if (totalUnfavorable > topVariances.length / 2) {
      recommendations.push('More than half of tracked items over budget - consider budget revision or cost reduction measures')
    }

    return recommendations
  }

  /**
   * Drill down into specific cost code variance
   */
  static async drillDownVariance(
    costCodeId: string,
    budgetLineItem: BudgetLineItem,
    expenses: Expense[],
    costCode: CostCode
  ): Promise<DrillDownData> {
    const costCodeExpenses = expenses.filter(e => e.cost_code_id === costCodeId)

    const breakdown = {
      labor: this.calculateCategoryBreakdown(costCodeExpenses, 'labor'),
      material: this.calculateCategoryBreakdown(costCodeExpenses, 'material'),
      equipment: this.calculateCategoryBreakdown(costCodeExpenses, 'equipment'),
      other: this.calculateCategoryBreakdown(costCodeExpenses, 'other'),
    }

    const laborBudget = budgetLineItem.budgeted_amount * 0.4
    const materialBudget = budgetLineItem.budgeted_amount * 0.35
    const equipmentBudget = budgetLineItem.budgeted_amount * 0.15
    const otherBudget = budgetLineItem.budgeted_amount * 0.1

    breakdown.labor.budgeted = laborBudget
    breakdown.labor.variance = laborBudget - breakdown.labor.actual
    breakdown.material.budgeted = materialBudget
    breakdown.material.variance = materialBudget - breakdown.material.actual
    breakdown.equipment.budgeted = equipmentBudget
    breakdown.equipment.variance = equipmentBudget - breakdown.equipment.actual
    breakdown.other.budgeted = otherBudget
    breakdown.other.variance = otherBudget - breakdown.other.actual

    const rootCauses = this.identifyRootCauses(budgetLineItem, breakdown)
    const correctiveActions = this.generateCorrectiveActions(breakdown, rootCauses)

    return {
      cost_code: costCode,
      budgeted: budgetLineItem.budgeted_amount,
      committed: budgetLineItem.committed_amount,
      actual: budgetLineItem.actual_amount,
      variance: budgetLineItem.variance,
      variance_percent: budgetLineItem.budgeted_amount !== 0
        ? (budgetLineItem.variance / budgetLineItem.budgeted_amount) * 100
        : 0,
      variance_type: budgetLineItem.variance >= 0 ? 'favorable' : 'unfavorable',
      breakdown,
      root_causes: rootCauses,
      corrective_actions: correctiveActions,
    }
  }

  /**
   * Calculate breakdown for a specific category
   */
  private static calculateCategoryBreakdown(expenses: Expense[], category: string) {
    const categoryExpenses = expenses.filter(e => 
      e.category.toLowerCase().includes(category.toLowerCase())
    )

    return {
      budgeted: 0,
      actual: categoryExpenses.reduce((sum, e) => sum + e.amount, 0),
      variance: 0,
      expense_details: categoryExpenses.map(e => ({
        date: e.expense_date,
        vendor: e.vendor,
        amount: e.amount,
        description: e.description || '',
      })),
    }
  }

  /**
   * Identify root causes of variance
   */
  private static identifyRootCauses(budgetLineItem: BudgetLineItem, breakdown: any): string[] {
    const causes: string[] = []

    if (breakdown.labor.variance < 0 && Math.abs(breakdown.labor.variance) > breakdown.labor.budgeted * 0.1) {
      causes.push('Labor costs exceed budget by >10% - possible overtime or inefficiency')
    }

    if (breakdown.material.variance < 0) {
      causes.push('Material costs over budget - check for price increases or quantity overruns')
    }

    if (breakdown.equipment.variance < 0) {
      causes.push('Equipment costs higher than planned - review rental duration and utilization')
    }

    if (budgetLineItem.percent_complete < 50 && budgetLineItem.actual_amount > budgetLineItem.budgeted_amount * 0.6) {
      causes.push('Cost burn rate exceeds progress - potential for significant overrun')
    }

    return causes
  }

  /**
   * Generate corrective actions based on root causes
   */
  private static generateCorrectiveActions(breakdown: any, rootCauses: string[]): string[] {
    const actions: string[] = []

    if (rootCauses.some(c => c.includes('Labor'))) {
      actions.push('Review crew composition and productivity metrics')
      actions.push('Implement daily productivity tracking')
      actions.push('Consider crew retraining or reassignment')
    }

    if (rootCauses.some(c => c.includes('Material'))) {
      actions.push('Renegotiate material pricing with suppliers')
      actions.push('Implement stricter material quantity controls')
      actions.push('Review takeoff quantities for accuracy')
    }

    if (rootCauses.some(c => c.includes('Equipment'))) {
      actions.push('Optimize equipment scheduling to reduce idle time')
      actions.push('Evaluate equipment purchase vs rental economics')
    }

    if (rootCauses.some(c => c.includes('burn rate'))) {
      actions.push('Implement weekly cost vs progress reviews')
      actions.push('Consider value engineering opportunities')
      actions.push('Review and update cost forecast')
    }

    return actions
  }
}
