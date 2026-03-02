import type { Budget, BudgetForecast, Expense, SOVItem } from '@/lib/types'

export async function forecastProjectCost(
  projectId: string,
  budgets: Budget[],
  expenses: Expense[],
  sovItems: SOVItem[]
): Promise<BudgetForecast[]> {
  const forecasts: BudgetForecast[] = []
  const currentDate = new Date()
  const forecastMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

  for (const budget of budgets) {
    const actualToDate = budget.actualAmount
    const budgetedAmount = budget.budgetedAmount
    const percentComplete = budgetedAmount > 0 ? (actualToDate / budgetedAmount) : 0

    let estimatedCompletion = budgetedAmount
    let methodology: BudgetForecast['methodology'] = 'historical'
    let confidenceLevel: BudgetForecast['confidenceLevel'] = 'medium'

    const relatedSovItems = sovItems.filter(item => item.costCodeId === budget.costCodeId)
    const sovPercentComplete = relatedSovItems.length > 0
      ? relatedSovItems.reduce((sum, item) => sum + item.percentComplete, 0) / relatedSovItems.length
      : 0

    if (percentComplete > 0.2 && percentComplete < 0.9) {
      estimatedCompletion = actualToDate / Math.max(percentComplete, 0.01)
      methodology = 'earned-value'
      confidenceLevel = percentComplete > 0.5 ? 'high' : 'medium'
    } else if (percentComplete >= 0.9) {
      estimatedCompletion = actualToDate + (budgetedAmount - actualToDate) * 0.1
      methodology = 'manual'
      confidenceLevel = 'high'
    } else {
      const burnRate = actualToDate / Math.max((currentDate.getTime() - new Date(budget.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30), 1)
      estimatedCompletion = budgetedAmount * (1 + burnRate * 0.1)
      methodology = 'historical'
      confidenceLevel = 'low'
    }

    if (sovPercentComplete > 0 && Math.abs(sovPercentComplete - percentComplete) < 0.2) {
      estimatedCompletion = actualToDate / Math.max(sovPercentComplete, 0.01)
      confidenceLevel = 'high'
    }

    const projectedCost = Math.round(estimatedCompletion * 100) / 100
    const variance = budgetedAmount - projectedCost

    forecasts.push({
      id: crypto.randomUUID(),
      projectId,
      forecastDate: currentDate.toISOString(),
      forecastMonth,
      costCodeId: budget.costCodeId,
      projectedCost,
      actualToDate,
      estimatedCompletion,
      variance,
      confidenceLevel,
      methodology,
      createdAt: currentDate.toISOString(),
    })
  }

  return forecasts
}

export function calculateCostTrend(
  budgets: Budget[],
  expenses: Expense[]
): Array<{ date: string; actual: number; budget: number; forecast: number }> {
  const trend: Array<{ date: string; actual: number; budget: number; forecast: number }> = []
  
  const sortedExpenses = [...expenses].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const totalBudget = budgets.reduce((sum, b) => sum + b.budgetedAmount, 0)
  const monthlyData = new Map<string, number>()

  sortedExpenses.forEach(expense => {
    if (expense.status === 'approved' || expense.status === 'paid') {
      const month = expense.date.substring(0, 7)
      monthlyData.set(month, (monthlyData.get(month) || 0) + expense.amount)
    }
  })

  let cumulativeActual = 0
  const sortedMonths = Array.from(monthlyData.keys()).sort()

  sortedMonths.forEach((month, index) => {
    cumulativeActual += monthlyData.get(month) || 0
    const progress = index / Math.max(sortedMonths.length - 1, 1)
    const budgetAtMonth = totalBudget * progress
    const burnRate = cumulativeActual / Math.max(index + 1, 1)
    const forecast = burnRate * sortedMonths.length

    trend.push({
      date: month,
      actual: cumulativeActual,
      budget: budgetAtMonth,
      forecast: Math.min(forecast, totalBudget * 1.3),
    })
  })

  return trend
}

export function calculateBudgetHealthScore(
  budgets: Budget[],
  forecasts: BudgetForecast[]
): { score: number; status: 'healthy' | 'warning' | 'critical'; issues: string[] } {
  let score = 100
  const issues: string[] = []

  const totalBudget = budgets.reduce((sum, b) => sum + b.budgetedAmount, 0)
  const totalActual = budgets.reduce((sum, b) => sum + b.actualAmount, 0)
  const totalForecast = forecasts.reduce((sum, f) => sum + f.projectedCost, 0)

  const overrunPercent = totalBudget > 0 ? ((totalForecast - totalBudget) / totalBudget) * 100 : 0

  if (overrunPercent > 15) {
    score -= 40
    issues.push(`Projected ${overrunPercent.toFixed(1)}% over budget`)
  } else if (overrunPercent > 10) {
    score -= 25
    issues.push(`Projected ${overrunPercent.toFixed(1)}% over budget`)
  } else if (overrunPercent > 5) {
    score -= 15
    issues.push(`Projected ${overrunPercent.toFixed(1)}% over budget`)
  }

  const highVarianceBudgets = budgets.filter(b => {
    const variance = b.budgetedAmount - b.actualAmount
    const variancePercent = b.budgetedAmount > 0 ? Math.abs(variance / b.budgetedAmount) * 100 : 0
    return b.actualAmount > b.budgetedAmount * 0.9 && variancePercent > 10
  })

  if (highVarianceBudgets.length > 0) {
    score -= highVarianceBudgets.length * 10
    issues.push(`${highVarianceBudgets.length} cost code(s) significantly over budget`)
  }

  const lowConfidenceForecasts = forecasts.filter(f => f.confidenceLevel === 'low')
  if (lowConfidenceForecasts.length > forecasts.length * 0.5) {
    score -= 10
    issues.push('Many forecasts have low confidence')
  }

  score = Math.max(0, Math.min(100, score))

  let status: 'healthy' | 'warning' | 'critical'
  if (score >= 80) {
    status = 'healthy'
  } else if (score >= 60) {
    status = 'warning'
  } else {
    status = 'critical'
  }

  return { score, status, issues }
}
