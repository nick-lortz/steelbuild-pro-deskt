import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendUp, TrendDown, CurrencyDollar, ChartBar, Warning, CheckCircle } from '@phosphor-icons/react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import type { Budget, SOVItem, Expense, ChangeOrder, CostCode } from '@/lib/types'

export function InDepthFinancialAnalysis() {
  const { projectId } = useParams()
  const [budgets] = useKV<Budget[]>(`budgets-${projectId}`, [])
  const [sovItems] = useKV<SOVItem[]>(`sov-items-${projectId}`, [])
  const [expenses] = useKV<Expense[]>(`expenses-${projectId}`, [])
  const [changeOrders] = useKV<ChangeOrder[]>(`change-orders-${projectId}`, [])
  const [costCodes] = useKV<CostCode[]>(`cost-codes`, [])

  const [analysis, setAnalysis] = useState({
    budgetVsActual: [] as Array<{ name: string; budget: number; actual: number; variance: number }>,
    sovVsBudget: [] as Array<{ name: string; scheduled: number; billed: number; budget: number }>,
    costByCategory: [] as Array<{ name: string; value: number; percentage: number }>,
    cashFlow: [] as Array<{ period: string; income: number; expenses: number; net: number }>,
    changeOrderImpact: [] as Array<{ name: string; original: number; changes: number; final: number }>,
  })

  useEffect(() => {
    if (!projectId) return

    const projectCostCodes = costCodes.filter(cc => !cc.projectId || cc.projectId === projectId)
    
    const budgetVsActual = projectCostCodes.map(cc => {
      const budget = budgets.find(b => b.costCodeId === cc.id)
      const budgetAmount = budget?.budgetedAmount || cc.budgetAmount || 0
      const actualAmount = budget?.actualAmount || cc.actualAmount || 0
      const variance = budgetAmount - actualAmount
      const variancePercent = budgetAmount > 0 ? (variance / budgetAmount) * 100 : 0

      return {
        name: cc.name,
        budget: budgetAmount,
        actual: actualAmount,
        variance,
        variancePercent,
      }
    }).filter(item => item.budget > 0 || item.actual > 0)

    const sovVsBudget = projectCostCodes.map(cc => {
      const budget = budgets.find(b => b.costCodeId === cc.id)
      const budgetAmount = budget?.budgetedAmount || cc.budgetAmount || 0
      const sovForCode = sovItems.filter(item => item.costCodeId === cc.id)
      const scheduled = sovForCode.reduce((sum, item) => sum + item.scheduledValue, 0)
      const billed = sovForCode.reduce((sum, item) => sum + item.currentBilling + item.previouslyBilled, 0)

      return {
        name: cc.name,
        scheduled,
        billed,
        budget: budgetAmount,
      }
    }).filter(item => item.scheduled > 0 || item.budget > 0)

    const costByCategory = projectCostCodes.reduce((acc, cc) => {
      const budget = budgets.find(b => b.costCodeId === cc.id)
      const actual = budget?.actualAmount || cc.actualAmount || 0
      const existing = acc.find(item => item.name === cc.category)
      
      if (existing) {
        existing.value += actual
      } else {
        acc.push({ name: cc.category, value: actual, percentage: 0 })
      }
      
      return acc
    }, [] as Array<{ name: string; value: number; percentage: number }>)

    const totalCost = costByCategory.reduce((sum, item) => sum + item.value, 0)
    costByCategory.forEach(item => {
      item.percentage = totalCost > 0 ? (item.value / totalCost) * 100 : 0
    })

    const expensesByMonth = expenses.reduce((acc, exp) => {
      if (exp.status === 'approved' || exp.status === 'paid') {
        const period = exp.date.substring(0, 7)
        if (!acc[period]) {
          acc[period] = { expenses: 0, income: 0 }
        }
        acc[period].expenses += exp.amount
      }
      return acc
    }, {} as Record<string, { expenses: number; income: number }>)

    const billingByMonth = sovItems.reduce((acc, item) => {
      const period = item.createdAt.substring(0, 7)
      if (!acc[period]) {
        acc[period] = { expenses: 0, income: 0 }
      }
      acc[period].income += item.currentBilling
      return acc
    }, expensesByMonth)

    const cashFlow = Object.entries(billingByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, data]) => ({
        period,
        income: data.income,
        expenses: data.expenses,
        net: data.income - data.expenses,
      }))

    const totalBudget = budgets.reduce((sum, b) => sum + b.budgetedAmount, 0)
    const totalChangeOrders = changeOrders
      .filter(co => co.status === 'approved')
      .reduce((sum, co) => sum + co.total, 0)
    
    const changeOrderImpact = [{
      name: 'Financial Impact',
      original: totalBudget,
      changes: totalChangeOrders,
      final: totalBudget + totalChangeOrders,
    }]

    setAnalysis({
      budgetVsActual,
      sovVsBudget,
      costByCategory,
      cashFlow,
      changeOrderImpact,
    })
  }, [projectId, budgets, sovItems, expenses, changeOrders, costCodes])

  const totalBudget = budgets.reduce((sum, b) => sum + b.budgetedAmount, 0)
  const totalActual = budgets.reduce((sum, b) => sum + b.actualAmount, 0)
  const totalCommitted = budgets.reduce((sum, b) => sum + b.committedAmount, 0)
  const totalSOVScheduled = sovItems.reduce((sum, item) => sum + item.scheduledValue, 0)
  const totalSOVBilled = sovItems.reduce((sum, item) => sum + item.currentBilling + item.previouslyBilled, 0)
  const totalChangeOrders = changeOrders.filter(co => co.status === 'approved').reduce((sum, co) => sum + co.total, 0)

  const budgetHealth = totalBudget > 0 ? ((totalBudget - totalActual) / totalBudget) * 100 : 0
  const sovProgress = totalSOVScheduled > 0 ? (totalSOVBilled / totalSOVScheduled) * 100 : 0
  const costAtCompletion = totalActual + totalCommitted
  const projectedVariance = totalBudget + totalChangeOrders - costAtCompletion

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">In-Depth Financial Analysis</h2>
        <p className="text-muted-foreground">Comprehensive view of budget, SOV, and cost performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CurrencyDollar className="text-primary" />
              Budget Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{budgetHealth.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              ${totalActual.toLocaleString()} spent of ${totalBudget.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ChartBar className="text-green-600" />
              SOV Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{sovProgress.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              ${totalSOVBilled.toLocaleString()} billed of ${totalSOVScheduled.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {projectedVariance >= 0 ? (
                <CheckCircle className="text-green-600" weight="fill" />
              ) : (
                <Warning className="text-red-600" weight="fill" />
              )}
              Projected Variance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${projectedVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {projectedVariance >= 0 ? '+' : ''}${projectedVariance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              At completion estimate
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="budget-vs-actual" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="budget-vs-actual">Budget vs Actual</TabsTrigger>
          <TabsTrigger value="sov-analysis">SOV Analysis</TabsTrigger>
          <TabsTrigger value="cost-breakdown">Cost Breakdown</TabsTrigger>
          <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
          <TabsTrigger value="change-orders">Change Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="budget-vs-actual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget vs Actual Costs by Cost Code</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analysis.budgetVsActual}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="budget" fill="#3b82f6" name="Budget" />
                  <Bar dataKey="actual" fill="#10b981" name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cost Code Variance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analysis.budgetVsActual.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                        <span>Budget: ${item.budget.toLocaleString()}</span>
                        <span>Actual: ${item.actual.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${item.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.variance >= 0 ? '+' : ''}${item.variance.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.variancePercent?.toFixed(1)}% variance
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sov-analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SOV vs Budget Alignment</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analysis.sovVsBudget}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="budget" fill="#3b82f6" name="Budget" />
                  <Bar dataKey="scheduled" fill="#f59e0b" name="SOV Scheduled" />
                  <Bar dataKey="billed" fill="#10b981" name="Billed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cost-breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Distribution by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analysis.costByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.percentage.toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analysis.costByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {analysis.costByCategory.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${item.value.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cash-flow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Cash Flow Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analysis.cashFlow}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="income" fill="#10b981" name="Income (SOV Billing)" />
                  <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                  <Bar dataKey="net" fill="#3b82f6" name="Net Cash Flow" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="change-orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Order Impact on Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analysis.changeOrderImpact} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="original" fill="#3b82f6" name="Original Budget" />
                  <Bar dataKey="changes" fill="#f59e0b" name="Approved Change Orders" />
                  <Bar dataKey="final" fill="#10b981" name="Revised Budget" />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Original Budget</div>
                  <div className="text-2xl font-bold">${totalBudget.toLocaleString()}</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Change Orders</div>
                  <div className="text-2xl font-bold text-orange-600">
                    +${totalChangeOrders.toLocaleString()}
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Revised Budget</div>
                  <div className="text-2xl font-bold text-green-600">
                    ${(totalBudget + totalChangeOrders).toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
