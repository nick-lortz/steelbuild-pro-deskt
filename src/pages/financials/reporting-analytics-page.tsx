import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { 
  ChartBar, 
  TrendUp, 
  Warning, 
  CheckCircle,
  Clock,
  Users,
  CurrencyDollar,
  ListChecks
} from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useKV } from '@github/spark/hooks'
import { 
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import type { 
  Project, 
  Budget, 
  Task, 
  RFI, 
  ChangeOrder, 
  Expense,
  LaborEntry
} from '@/lib/types'
import { generateProjectMetrics, type ProjectMetrics } from '@/lib/functions/reporting'

export function ReportingAnalyticsPage() {
  const { projectId } = useParams()
  const [projects] = useKV<Project[]>('projects', [])
  const [budgets] = useKV<Budget[]>(`budgets-${projectId}`, [])
  const [tasks] = useKV<Task[]>(`tasks-${projectId}`, [])
  const [rfis] = useKV<RFI[]>(`rfis-${projectId}`, [])
  const [changeOrders] = useKV<ChangeOrder[]>(`change-orders-${projectId}`, [])
  const [expenses] = useKV<Expense[]>(`expenses-${projectId}`, [])
  const [laborEntries] = useKV<LaborEntry[]>(`labor-entries-${projectId}`, [])
  
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  const project = projects?.find(p => p.id === projectId)

  useEffect(() => {
    async function calculateMetrics() {
      if (!project) {
        setLoading(false)
        return
      }

      try {
        const projectMetrics = generateProjectMetrics(
          project,
          budgets || [],
          tasks || [],
          rfis || [],
          changeOrders || [],
          expenses || [],
          laborEntries || []
        )
        setMetrics(projectMetrics)
      } catch (error) {
        console.error('Error calculating metrics:', error)
      } finally {
        setLoading(false)
      }
    }

    calculateMetrics()
  }, [project, budgets, tasks, rfis, changeOrders, expenses, laborEntries])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--accent))',
    'hsl(var(--secondary))',
    'hsl(var(--muted))',
    'hsl(var(--destructive))',
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <ChartBar size={48} className="mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Generating analytics report...</p>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <ChartBar size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No data available</h3>
          <p className="text-muted-foreground">Start adding project data to generate reports</p>
        </div>
      </div>
    )
  }

  const costByCategory = (budgets || []).map(budget => ({
    name: budget.costCodeId,
    budgeted: budget.budgetedAmount,
    actual: budget.actualAmount,
    variance: budget.budgetedAmount - budget.actualAmount,
  }))

  const scheduleData = [
    { name: 'Completed', value: metrics.schedule.completedTasks, color: COLORS[0] },
    { name: 'In Progress', value: metrics.schedule.totalTasks - metrics.schedule.completedTasks - metrics.schedule.delayedTasks, color: COLORS[1] },
    { name: 'Delayed', value: metrics.schedule.delayedTasks, color: COLORS[4] },
  ].filter(item => item.value > 0)

  const performanceRadar = [
    {
      metric: 'Cost Performance',
      value: Math.min(metrics.financial.costPerformanceIndex * 100, 150),
      fullMark: 150,
    },
    {
      metric: 'Schedule Performance',
      value: Math.min(metrics.schedule.schedulePerformanceIndex * 100, 150),
      fullMark: 150,
    },
    {
      metric: 'Quality (RFI)',
      value: Math.max(0, 100 - (metrics.quality.overdueRFIs * 10)),
      fullMark: 150,
    },
    {
      metric: 'Productivity',
      value: metrics.productivity.productivityTrend === 'improving' ? 120 : metrics.productivity.productivityTrend === 'stable' ? 100 : 80,
      fullMark: 150,
    },
    {
      metric: 'Budget Health',
      value: Math.max(0, 100 - Math.abs(metrics.financial.variancePercent)),
      fullMark: 150,
    },
  ]

  const laborCostTrend = (laborEntries || [])
    .reduce((acc, entry) => {
      const month = entry.date.substring(0, 7)
      const existing = acc.find(item => item.month === month)
      if (existing) {
        existing.hours += entry.totalHours
      } else {
        acc.push({ month, hours: entry.totalHours })
      }
      return acc
    }, [] as Array<{ month: string; hours: number }>)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12)

  const rfiTrend = (rfis || [])
    .reduce((acc, rfi) => {
      const month = rfi.submittedDate.substring(0, 7)
      const existing = acc.find(item => item.month === month)
      if (existing) {
        existing.total += 1
        if (rfi.status === 'closed' || rfi.status === 'answered') existing.closed += 1
        if (rfi.status === 'open' || rfi.status === 'escalated') existing.open += 1
      } else {
        acc.push({
          month,
          total: 1,
          closed: (rfi.status === 'closed' || rfi.status === 'answered') ? 1 : 0,
          open: (rfi.status === 'open' || rfi.status === 'escalated') ? 1 : 0,
        })
      }
      return acc
    }, [] as Array<{ month: string; total: number; closed: number; open: number }>)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reporting & Analytics</h2>
          <p className="text-muted-foreground">Comprehensive project performance dashboard</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Performance Index</CardTitle>
            {metrics.financial.costPerformanceIndex >= 1 ? (
              <TrendUp size={20} className="text-accent" />
            ) : (
              <Warning size={20} className="text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.financial.costPerformanceIndex >= 0.95 ? 'text-accent' : metrics.financial.costPerformanceIndex >= 0.85 ? 'text-orange-500' : 'text-destructive'}`}>
              {metrics.financial.costPerformanceIndex.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.financial.costPerformanceIndex >= 1 ? 'Under budget' : 'Over budget'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Schedule Performance</CardTitle>
            {metrics.schedule.schedulePerformanceIndex >= 1 ? (
              <CheckCircle size={20} className="text-accent" />
            ) : (
              <Clock size={20} className="text-orange-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.schedule.schedulePerformanceIndex >= 0.95 ? 'text-accent' : metrics.schedule.schedulePerformanceIndex >= 0.85 ? 'text-orange-500' : 'text-destructive'}`}>
              {metrics.schedule.schedulePerformanceIndex.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.schedule.completedTasks}/{metrics.schedule.totalTasks} tasks complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RFI Status</CardTitle>
            <ListChecks size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.quality.openRFIs}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.quality.overdueRFIs} overdue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Labor Productivity</CardTitle>
            <Users size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{metrics.productivity.productivityTrend}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(metrics.productivity.costPerLaborHour)}/hour
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Project Performance Radar</CardTitle>
                <CardDescription>Multi-dimensional performance view</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={performanceRadar}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis 
                      dataKey="metric" 
                      tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 150]}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Radar 
                      name="Performance" 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.6} 
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Schedule Distribution</CardTitle>
                <CardDescription>Task completion status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={scheduleData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {scheduleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Key Performance Indicators</CardTitle>
              <CardDescription>Critical project metrics summary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Estimate at Completion</span>
                    <CurrencyDollar size={16} className="text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">{formatCurrency(metrics.financial.estimateAtCompletion)}</div>
                  <div className="text-xs text-muted-foreground">
                    vs {formatCurrency(metrics.financial.totalBudget)} budgeted
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Days Remaining</span>
                    <Clock size={16} className="text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">{metrics.schedule.daysRemaining}</div>
                  <div className="text-xs text-muted-foreground">
                    {metrics.schedule.criticalPathTasks} critical path tasks
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Change Order Impact</span>
                    <ChartBar size={16} className="text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">{metrics.quality.changeOrderImpactPercent.toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(metrics.quality.changeOrderValue)} total
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Performance by Category</CardTitle>
              <CardDescription>Budget vs actual by cost code</CardDescription>
            </CardHeader>
            <CardContent>
              {costByCategory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CurrencyDollar size={48} className="text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No cost data</h3>
                  <p className="text-sm text-muted-foreground">Budget data needed for analysis</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={costByCategory}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
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
                    <Bar dataKey="actual" fill="hsl(var(--primary))" name="Actual" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Budget Variance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${metrics.financial.variance >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  {formatCurrency(Math.abs(metrics.financial.variance))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {metrics.financial.variance >= 0 ? 'Under' : 'Over'} budget by {Math.abs(metrics.financial.variancePercent).toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Committed Costs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(metrics.financial.totalCommitted)}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  {((metrics.financial.totalCommitted / metrics.financial.totalBudget) * 100).toFixed(1)}% of budget
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Remaining Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatCurrency(metrics.financial.totalBudget - metrics.financial.totalActual)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Available to spend
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Task Completion Progress</CardTitle>
                <CardDescription>Overall schedule status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-sm font-semibold">{metrics.schedule.percentComplete.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3">
                      <div
                        className="bg-primary h-3 rounded-full transition-all"
                        style={{ width: `${metrics.schedule.percentComplete}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div>
                      <div className="text-2xl font-bold text-accent">{metrics.schedule.completedTasks}</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-destructive">{metrics.schedule.delayedTasks}</div>
                      <div className="text-xs text-muted-foreground">Delayed</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Schedule Health</CardTitle>
                <CardDescription>Performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Schedule Performance Index</span>
                    <Badge variant={metrics.schedule.schedulePerformanceIndex >= 0.95 ? 'default' : 'destructive'}>
                      {metrics.schedule.schedulePerformanceIndex.toFixed(2)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Critical Path Tasks</span>
                    <Badge variant="outline">{metrics.schedule.criticalPathTasks}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Days Remaining</span>
                    <Badge variant="secondary">{metrics.schedule.daysRemaining}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Delayed Tasks</span>
                    <Badge variant={metrics.schedule.delayedTasks > 0 ? 'destructive' : 'default'}>
                      {metrics.schedule.delayedTasks}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>RFI Activity Trend</CardTitle>
              <CardDescription>Monthly RFI volume and resolution</CardDescription>
            </CardHeader>
            <CardContent>
              {rfiTrend.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ListChecks size={48} className="text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No RFI data</h3>
                  <p className="text-sm text-muted-foreground">RFI activity will appear here</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={rfiTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" name="Total RFIs" />
                    <Line type="monotone" dataKey="closed" stroke="hsl(var(--accent))" name="Closed" />
                    <Line type="monotone" dataKey="open" stroke="hsl(var(--destructive))" name="Open" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Labor Hours Trend</CardTitle>
              <CardDescription>Monthly labor hours logged</CardDescription>
            </CardHeader>
            <CardContent>
              {laborCostTrend.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users size={48} className="text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No labor data</h3>
                  <p className="text-sm text-muted-foreground">Labor hours will be tracked here</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={laborCostTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                      }}
                    />
                    <Bar dataKey="hours" fill="hsl(var(--primary))" name="Labor Hours" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
