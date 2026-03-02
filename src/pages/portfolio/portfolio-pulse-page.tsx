import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Buildings,
  ChartLine,
  CurrencyDollar,
  Warning,
  CheckCircle,
  Clock,
  TrendUp,
  TrendDown,
  User,
  Calendar,
} from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useKV } from '@github/spark/hooks'
import { useDatabase } from '@/hooks/use-database'
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
} from 'recharts'
import type { Project, Budget, Task, RFI, ProjectRisk } from '@/lib/types'

interface PortfolioMetrics {
  totalProjects: number
  activeProjects: number
  totalValue: number
  atRiskProjects: number
  onScheduleProjects: number
  underBudgetProjects: number
  totalBudget: number
  totalSpent: number
  utilizationRate: number
  avgScheduleHealth: number
  totalRisks: number
  highRisks: number
}

interface ProjectHealth {
  project_id: string
  project_number: string
  project_name: string
  status: string
  contract_value: number
  actual_cost: number
  margin: number
  margin_percent: number
  approved_change_orders: number
  change_order_total: number
  open_rfis: number
  aging_rfis: number
  over_budget_cost_codes: number
  slipping_tasks: number
  total_risk_flags: number
  health_status: 'healthy' | 'warning' | 'critical'
}

export function PortfolioPulsePage() {
  const navigate = useNavigate()
  const { isDesktop, db } = useDatabase()
  const [projects] = useKV<Project[]>('projects', [])
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null)
  const [projectHealthData, setProjectHealthData] = useState<ProjectHealth[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [healthFilter, setHealthFilter] = useState<string>('all')

  useEffect(() => {
    async function calculatePortfolioMetrics() {
      if (!projects || projects.length === 0) {
        setLoading(false)
        return
      }

      if (isDesktop && projects.length > 0) {
        const projectIds = projects.map(p => p.id)
        const result = await db.computePortfolioMarginAtRisk(projectIds)
        
        if (result.success && result.data) {
          setProjectHealthData(result.data)
          
          const activeProjects = result.data.filter(p => p.status === 'active')
          const totalValue = result.data.reduce((sum, p) => sum + p.contract_value, 0)
          const totalSpent = result.data.reduce((sum, p) => sum + p.actual_cost, 0)
          const atRiskProjects = result.data.filter(p => p.health_status === 'critical' || p.health_status === 'warning').length
          const onScheduleProjects = result.data.filter(p => p.slipping_tasks === 0).length
          const underBudgetProjects = result.data.filter(p => p.over_budget_cost_codes === 0).length
          const totalRiskFlags = result.data.reduce((sum, p) => sum + p.total_risk_flags, 0)
          const highRisks = result.data.filter(p => p.health_status === 'critical').length
          
          setMetrics({
            totalProjects: projects.length,
            activeProjects: activeProjects.length,
            totalValue,
            atRiskProjects,
            onScheduleProjects,
            underBudgetProjects,
            totalBudget: totalValue,
            totalSpent,
            utilizationRate: (activeProjects.length / Math.max(projects.length, 1)) * 100,
            avgScheduleHealth: result.data.length > 0 
              ? result.data.reduce((sum, p) => sum + (100 - (p.slipping_tasks * 10)), 0) / result.data.length
              : 0,
            totalRisks: totalRiskFlags,
            highRisks,
          })
        }
      } else {
        setMetrics({
          totalProjects: projects.length,
          activeProjects: projects.filter(p => p.status === 'active').length,
          totalValue: projects.reduce((sum, p) => sum + (p.contractValue || 0), 0),
          atRiskProjects: 0,
          onScheduleProjects: 0,
          underBudgetProjects: 0,
          totalBudget: 0,
          totalSpent: 0,
          utilizationRate: 0,
          avgScheduleHealth: 0,
          totalRisks: 0,
          highRisks: 0,
        })
        setProjectHealthData([])
      }

      setLoading(false)
    }

    calculatePortfolioMetrics()
  }, [projects, isDesktop, db])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getStatusBadge = (status: ProjectHealth['health_status']) => {
    const config = {
      healthy: { variant: 'default' as const, label: 'Healthy', icon: <CheckCircle size={14} /> },
      warning: { variant: 'secondary' as const, label: 'Warning', icon: <Warning size={14} /> },
      critical: { variant: 'destructive' as const, label: 'Critical', icon: <Warning size={14} /> },
    }
    return config[status]
  }

  const projectsByStatus = projects ? [
    { name: 'Active', value: projects.filter(p => p.status === 'active').length, color: 'hsl(var(--primary))' },
    { name: 'Planning', value: projects.filter(p => p.status === 'planning').length, color: 'hsl(var(--accent))' },
    { name: 'On Hold', value: projects.filter(p => p.status === 'onhold').length, color: 'hsl(var(--muted))' },
    { name: 'Completed', value: projects.filter(p => p.status === 'completed').length, color: 'hsl(var(--secondary))' },
  ].filter(item => item.value > 0) : []

  const filteredHealthData = projectHealthData.filter(h => {
    if (statusFilter !== 'all' && h.status !== statusFilter) return false
    if (healthFilter !== 'all' && h.health_status !== healthFilter) return false
    return true
  })

  const budgetPerformance = filteredHealthData.map(h => ({
    name: h.project_name.substring(0, 15),
    health: Math.round(h.margin_percent),
  }))

  const marginAtRiskData = filteredHealthData.slice(0, 10).map(h => ({
    name: h.project_name.substring(0, 20),
    margin: Math.round(h.margin),
    marginPercent: parseFloat(h.margin_percent.toFixed(1)),
    status: h.health_status
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Buildings size={48} className="mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading portfolio data...</p>
        </div>
      </div>
    )
  }

  if (!metrics || !projects || projects.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Portfolio Pulse</h2>
            <p className="text-muted-foreground">Portfolio-wide metrics and insights</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Buildings size={48} className="text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first project to see portfolio metrics
            </p>
            <Button onClick={() => navigate('/projects')}>
              Go to Projects
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Portfolio Pulse</h2>
          <p className="text-muted-foreground">Portfolio-wide metrics and project health</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/projects')}>
          View All Projects
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Buildings size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeProjects} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <CurrencyDollar size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              Total contract value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Margin</CardTitle>
            {metrics.totalSpent <= metrics.totalValue ? (
              <TrendUp size={20} className="text-accent" />
            ) : (
              <TrendDown size={20} className="text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.totalSpent <= metrics.totalValue ? 'text-accent' : 'text-destructive'}`}>
              {formatCurrency(metrics.totalValue - metrics.totalSpent)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalValue > 0 ? (((metrics.totalValue - metrics.totalSpent) / metrics.totalValue) * 100).toFixed(1) : 0}% margin
            </p>
          </CardContent>
        </Card>

        <Card className={metrics.atRiskProjects > 0 ? 'border-destructive bg-destructive/5' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Risk</CardTitle>
            <Warning size={20} className={metrics.atRiskProjects > 0 ? 'text-destructive animate-pulse' : 'text-muted-foreground'} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.atRiskProjects > 0 ? 'text-destructive' : 'text-accent'}`}>
              {metrics.atRiskProjects}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.highRisks} critical projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Risks</CardTitle>
            <ChartLine size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalRisks}</div>
            <p className="text-xs text-muted-foreground">
              Total risk flags
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="health" className="space-y-4">
        <TabsList>
          <TabsTrigger value="health">Project Health</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Margin at Risk Analysis</CardTitle>
                  <CardDescription>Critical projects sorted by financial risk and margin erosion</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="onhold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={healthFilter} onValueChange={setHealthFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Health</SelectItem>
                      <SelectItem value="healthy">Healthy</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredHealthData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Buildings size={48} className="text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No projects match filters</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Try adjusting your filters or create a new project
                  </p>
                  <Button variant="outline" onClick={() => { setStatusFilter('all'); setHealthFilter('all') }}>
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Showing {filteredHealthData.length} of {projectHealthData.length} projects (sorted by risk priority)</span>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Health Status</TableHead>
                        <TableHead className="text-right">Contract Value</TableHead>
                        <TableHead className="text-right">Actual Cost</TableHead>
                        <TableHead className="text-right">Margin $</TableHead>
                        <TableHead className="text-right">Margin %</TableHead>
                        <TableHead className="text-center">Risk Flags</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHealthData.map((health) => {
                      const statusBadge = getStatusBadge(health.health_status)
                      const marginColor = health.margin_percent >= 15 ? 'text-accent' : 
                                        health.margin_percent >= 10 ? 'text-warning' : 
                                        health.margin_percent >= 5 ? 'text-destructive/80' : 
                                        'text-destructive'
                      return (
                        <TableRow key={health.project_id} className={health.health_status === 'critical' ? 'bg-destructive/5' : ''}>
                          <TableCell>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {health.project_name}
                                {health.health_status === 'critical' && (
                                  <Badge variant="destructive" className="text-xs">
                                    <Warning size={12} className="mr-1" />
                                    Critical
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">{health.project_number}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadge.variant}>
                              <span className="mr-1">{statusBadge.icon}</span>
                              {statusBadge.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {formatCurrency(health.contract_value)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {formatCurrency(health.actual_cost)}
                          </TableCell>
                          <TableCell className={`text-right font-mono text-sm font-semibold ${marginColor}`}>
                            {formatCurrency(health.margin)}
                          </TableCell>
                          <TableCell className={`text-right font-mono text-sm font-bold ${marginColor}`}>
                            {health.margin_percent.toFixed(1)}%
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              {health.aging_rfis > 0 && (
                                <Badge variant="destructive" className="text-xs" title={`${health.aging_rfis} aging RFI(s)`}>
                                  <Clock size={12} className="mr-1" />
                                  {health.aging_rfis}
                                </Badge>
                              )}
                              {health.over_budget_cost_codes > 0 && (
                                <Badge variant="destructive" className="text-xs" title={`${health.over_budget_cost_codes} over-budget cost code(s)`}>
                                  <CurrencyDollar size={12} className="mr-1" />
                                  {health.over_budget_cost_codes}
                                </Badge>
                              )}
                              {health.slipping_tasks > 0 && (
                                <Badge variant="secondary" className="text-xs" title={`${health.slipping_tasks} slipping task(s)`}>
                                  <TrendDown size={12} className="mr-1" />
                                  {health.slipping_tasks}
                                </Badge>
                              )}
                              {health.total_risk_flags === 0 && (
                                <span className="text-muted-foreground text-xs">None</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant={health.health_status === 'critical' ? 'default' : 'outline'}
                              onClick={() => navigate(`/projects/${health.project_id}`)}
                            >
                              {health.health_status === 'critical' ? 'Review Now' : 'View'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {filteredHealthData.filter(h => h.health_status === 'critical').length > 0 && (
            <Card className="border-destructive bg-destructive/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Warning size={24} />
                  Critical Projects Requiring Immediate Attention
                </CardTitle>
                <CardDescription>
                  These projects have margin below 5% or multiple active risk flags
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredHealthData
                  .filter(h => h.health_status === 'critical')
                  .map((health) => (
                    <div key={health.project_id} className="bg-background p-4 rounded-lg border border-destructive">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">{health.project_name}</h4>
                          <p className="text-sm text-muted-foreground">{health.project_number}</p>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => navigate(`/projects/${health.project_id}/pma`)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          View Insights
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Margin at Risk</div>
                          <div className={`text-lg font-bold ${health.margin_percent < 5 ? 'text-destructive' : 'text-warning'}`}>
                            {health.margin_percent.toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">{formatCurrency(health.margin)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Aging RFIs</div>
                          <div className="text-lg font-bold text-destructive">{health.aging_rfis}</div>
                          <div className="text-xs text-muted-foreground">of {health.open_rfis} open</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Over Budget</div>
                          <div className="text-lg font-bold text-destructive">{health.over_budget_cost_codes}</div>
                          <div className="text-xs text-muted-foreground">cost codes</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Schedule Slip</div>
                          <div className="text-lg font-bold text-warning">{health.slipping_tasks}</div>
                          <div className="text-xs text-muted-foreground">tasks behind</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Badge variant="outline" className="text-xs">
                          <CurrencyDollar size={12} className="mr-1" />
                          {formatCurrency(health.contract_value)} Contract
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <TrendDown size={12} className="mr-1" />
                          {formatCurrency(health.actual_cost)} Spent
                        </Badge>
                        {health.change_order_total > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            +{formatCurrency(health.change_order_total)} in COs
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Margin at Risk by Project</CardTitle>
                <CardDescription>Top 10 projects ranked by margin percentage</CardDescription>
              </CardHeader>
              <CardContent>
                {marginAtRiskData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ChartLine size={48} className="text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No data</h3>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={marginAtRiskData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        label={{ value: 'Margin %', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '0.5rem',
                        }}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Margin']}
                      />
                      <Bar 
                        dataKey="marginPercent" 
                        fill="hsl(var(--primary))"
                        label={{ 
                          position: 'top', 
                          formatter: (value: number) => `${value}%`,
                          fontSize: 10
                        }}
                      >
                        {marginAtRiskData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={
                              entry.status === 'critical' ? 'hsl(var(--destructive))' :
                              entry.status === 'warning' ? 'hsl(var(--warning))' :
                              'hsl(var(--accent))'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Projects by Status</CardTitle>
                <CardDescription>Portfolio distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={projectsByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {projectsByStatus.map((entry, index) => (
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
              <CardTitle>Risk Distribution Summary</CardTitle>
              <CardDescription>Overview of financial and operational risk across portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Critical Projects</div>
                  <div className="text-3xl font-bold text-destructive">
                    {projectHealthData.filter(p => p.health_status === 'critical').length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Margin below 5%
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Warning Projects</div>
                  <div className="text-3xl font-bold text-warning">
                    {projectHealthData.filter(p => p.health_status === 'warning').length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Margin 5-10%
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Healthy Projects</div>
                  <div className="text-3xl font-bold text-accent">
                    {projectHealthData.filter(p => p.health_status === 'healthy').length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Margin above 10%
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Total Risk Flags</div>
                  <div className="text-3xl font-bold">
                    {projectHealthData.reduce((sum, p) => sum + p.total_risk_flags, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Across all projects
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Utilization Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.utilizationRate.toFixed(1)}%</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Active project ratio
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Avg Schedule Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${metrics.avgScheduleHealth >= 80 ? 'text-accent' : 'text-destructive'}`}>
                  {metrics.avgScheduleHealth.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {metrics.onScheduleProjects}/{metrics.activeProjects} on schedule
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Budget Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent">
                  {metrics.underBudgetProjects}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Projects under budget
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects?.filter(p => p.status === 'active' || p.status === 'planning').map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <Badge variant="outline">{project.status}</Badge>
                  </div>
                  <CardDescription>{project.client}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Contract Value</span>
                      <span className="font-semibold">{formatCurrency(project.contractValue || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar size={14} />
                        Start Date
                      </span>
                      <span>{new Date(project.startDate).toLocaleDateString()}</span>
                    </div>
                    {project.endDate && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Calendar size={14} />
                          End Date
                        </span>
                        <span>{new Date(project.endDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
