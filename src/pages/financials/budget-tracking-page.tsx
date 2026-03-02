import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { 
  TrendUp, 
  TrendDown, 
  CurrencyDollar, 
  ChartLine, 
  Warning,
  ArrowUp,
  ArrowDown,
  Minus
} from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useKV } from '@github/spark/hooks'
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import type { Budget, Expense, BudgetForecast, SOVItem } from '@/lib/types'
import { forecastProjectCost, calculateCostTrend, calculateBudgetHealthScore } from '@/lib/functions/budget-forecasting'

export function BudgetTrackingPage() {
  const { projectId } = useParams()
  const [budgets] = useKV<Budget[]>(`budgets-${projectId}`, [])
  const [expenses] = useKV<Expense[]>(`expenses-${projectId}`, [])
  const [sovItems] = useKV<SOVItem[]>(`sov-items-${projectId}`, [])
  const [forecasts, setForecasts] = useState<BudgetForecast[]>([])
  const [healthScore, setHealthScore] = useState<ReturnType<typeof calculateBudgetHealthScore> | null>(null)
  const [costTrend, setCostTrend] = useState<ReturnType<typeof calculateCostTrend>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function generateForecasts() {
      if (!projectId || !budgets || budgets.length === 0) {
        setLoading(false)
        return
      }

      try {
        const forecastData = await forecastProjectCost(
          projectId,
          budgets,
          expenses || [],
          sovItems || []
        )
        setForecasts(forecastData)

        const health = calculateBudgetHealthScore(budgets, forecastData)
        setHealthScore(health)

        const trend = calculateCostTrend(budgets, expenses || [])
        setCostTrend(trend)
      } catch (error) {
        console.error('Error generating forecasts:', error)
      } finally {
        setLoading(false)
      }
    }

    generateForecasts()
  }, [projectId, budgets, expenses, sovItems])

  const totalBudget = budgets?.reduce((sum, b) => sum + b.budgetedAmount, 0) || 0
  const totalActual = budgets?.reduce((sum, b) => sum + b.actualAmount, 0) || 0
  const totalCommitted = budgets?.reduce((sum, b) => sum + b.committedAmount, 0) || 0
  const totalForecast = forecasts.reduce((sum, f) => sum + f.projectedCost, 0)
  const variance = totalBudget - totalForecast
  const variancePercent = totalBudget > 0 ? ((variance / totalBudget) * 100).toFixed(1) : '0'

  const getHealthColor = (status?: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy': return 'text-accent'
      case 'warning': return 'text-orange-500'
      case 'critical': return 'text-destructive'
      default: return 'text-muted-foreground'
    }
  }

  const getConfidenceBadge = (level: BudgetForecast['confidenceLevel']) => {
    const variants: Record<typeof level, 'default' | 'secondary' | 'outline'> = {
      high: 'default',
      medium: 'secondary',
      low: 'outline',
    }
    return variants[level]
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <ChartLine size={48} className="mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Analyzing budget data and generating forecasts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-background to-orange-50">
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Budget Tracking & Forecasting</h2>
            <p className="text-muted-foreground">Real-time cost analysis and projected completion estimates</p>
          </div>
        </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Health</CardTitle>
            {healthScore?.status === 'healthy' ? (
              <TrendUp size={20} className={getHealthColor(healthScore.status)} />
            ) : (
              <TrendDown size={20} className={getHealthColor(healthScore?.status)} />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthColor(healthScore?.status)}`}>
              {healthScore?.score.toFixed(0) || 0}
            </div>
            <p className="text-xs text-muted-foreground capitalize">
              {healthScore?.status || 'calculating...'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forecast at Completion</CardTitle>
            <ChartLine size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalForecast)}</div>
            <p className="text-xs text-muted-foreground">
              vs {formatCurrency(totalBudget)} budgeted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected Variance</CardTitle>
            {variance >= 0 ? <TrendUp size={20} className="text-accent" /> : <TrendDown size={20} className="text-destructive" />}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${variance >= 0 ? 'text-accent' : 'text-destructive'}`}>
              {formatCurrency(Math.abs(variance))}
            </div>
            <p className="text-xs text-muted-foreground">
              {variance >= 0 ? 'Under' : 'Over'} by {variancePercent}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Spend</CardTitle>
            <CurrencyDollar size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalActual)}</div>
            <p className="text-xs text-muted-foreground">
              {((totalActual / totalBudget) * 100).toFixed(1)}% of budget
            </p>
          </CardContent>
        </Card>
      </div>

      {healthScore && healthScore.issues.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Warning size={20} className="text-orange-600" />
              <CardTitle className="text-orange-900">Budget Health Alerts</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {healthScore.issues.map((issue, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-orange-800">
                  <span className="text-orange-600 mt-0.5">•</span>
                  {issue}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="forecasts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="forecasts">Cost Forecasts</TabsTrigger>
          <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
          <TabsTrigger value="breakdown">Cost Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="forecasts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Code Forecasts</CardTitle>
              <CardDescription>Projected completion costs by cost code with confidence levels</CardDescription>
            </CardHeader>
            <CardContent>
              {forecasts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ChartLine size={48} className="text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No forecast data available</h3>
                  <p className="text-sm text-muted-foreground">
                    Budget data is needed to generate forecasts
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cost Code</TableHead>
                      <TableHead>Budgeted</TableHead>
                      <TableHead>Actual to Date</TableHead>
                      <TableHead>Projected Cost</TableHead>
                      <TableHead>Variance</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forecasts.map((forecast) => {
                      const budget = budgets?.find(b => b.costCodeId === forecast.costCodeId)
                      const budgetAmount = budget?.budgetedAmount || 0
                      const varianceValue = forecast.variance
                      const variancePct = budgetAmount > 0 ? (varianceValue / budgetAmount) * 100 : 0

                      return (
                        <TableRow key={forecast.id}>
                          <TableCell className="font-medium">{forecast.costCodeId}</TableCell>
                          <TableCell className="font-mono">{formatCurrency(budgetAmount)}</TableCell>
                          <TableCell className="font-mono">{formatCurrency(forecast.actualToDate)}</TableCell>
                          <TableCell className="font-mono font-semibold">{formatCurrency(forecast.projectedCost)}</TableCell>
                          <TableCell className={`font-mono ${varianceValue >= 0 ? 'text-accent' : 'text-destructive'}`}>
                            {formatCurrency(Math.abs(varianceValue))}
                            <span className="text-xs ml-1">
                              ({variancePct >= 0 ? '+' : ''}{variancePct.toFixed(1)}%)
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getConfidenceBadge(forecast.confidenceLevel)}>
                              {forecast.confidenceLevel}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground capitalize">
                            {forecast.methodology.replace('-', ' ')}
                          </TableCell>
                          <TableCell>
                            {varianceValue >= budgetAmount * 0.05 ? (
                              <ArrowUp size={16} className="text-accent" />
                            ) : varianceValue <= -budgetAmount * 0.05 ? (
                              <ArrowDown size={16} className="text-destructive" />
                            ) : (
                              <Minus size={16} className="text-muted-foreground" />
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Trend Analysis</CardTitle>
              <CardDescription>Actual vs budgeted spending over time with forecast projection</CardDescription>
            </CardHeader>
            <CardContent>
              {costTrend.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ChartLine size={48} className="text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No trend data available</h3>
                  <p className="text-sm text-muted-foreground">
                    Expense data over time is needed to show trends
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={costTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="budget" 
                      stackId="1"
                      stroke="hsl(var(--muted-foreground))" 
                      fill="hsl(var(--muted))" 
                      name="Budgeted"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="actual" 
                      stackId="2"
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.6}
                      name="Actual"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="forecast" 
                      stackId="3"
                      stroke="hsl(var(--accent))" 
                      fill="hsl(var(--accent))" 
                      fillOpacity={0.3}
                      strokeDasharray="5 5"
                      name="Forecast"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Performance by Cost Code</CardTitle>
              <CardDescription>Visual breakdown of budget utilization</CardDescription>
            </CardHeader>
            <CardContent>
              {!budgets || budgets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CurrencyDollar size={48} className="text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No budget data</h3>
                  <p className="text-sm text-muted-foreground">
                    Budget allocation is needed to show breakdown
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={budgets.map(b => ({
                    costCode: b.costCodeId,
                    budgeted: b.budgetedAmount,
                    actual: b.actualAmount,
                    committed: b.committedAmount,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="costCode" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="budgeted" fill="hsl(var(--muted))" name="Budgeted" />
                    <Bar dataKey="committed" fill="hsl(var(--secondary))" name="Committed" />
                    <Bar dataKey="actual" fill="hsl(var(--primary))" name="Actual" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
