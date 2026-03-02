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
  project: Project
  scheduleHealth: number
  budgetHealth: number
  rfiCount: number
  overdueTasks: number
  risks: number
  status: 'healthy' | 'warning' | 'critical'
}

export function PortfolioPulsePage() {
  const navigate = useNavigate()
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

      const activeProjects = projects.filter(p => p.status === 'active')
      let totalBudget = 0
      let totalSpent = 0
      let onScheduleCount = 0
      let underBudgetCount = 0
      let atRiskCount = 0
      let totalRiskCount = 0
      let highRiskCount = 0

      const healthData: ProjectHealth[] = []

      for (const project of projects) {
        const budgets = await spark.kv.get<Budget[]>(`budgets-${project.id}`) || []
        const tasks = await spark.kv.get<Task[]>(`tasks-${project.id}`) || []
        const rfis = await spark.kv.get<RFI[]>(`rfis-${project.id}`) || []
        const risks = await spark.kv.get<ProjectRisk[]>(`risks-${project.id}`) || []

        const projectBudget = budgets.reduce((sum, b) => sum + b.budgetedAmount, 0)
        const projectSpent = budgets.reduce((sum, b) => sum + b.actualAmount, 0)
        totalBudget += projectBudget
        totalSpent += projectSpent

        const completedTasks = tasks.filter(t => t.status === 'completed').length
        const scheduleHealth = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0
        const budgetHealth = projectBudget > 0 ? ((projectBudget - projectSpent) / projectBudget) * 100 : 0
        const overdueTasks = tasks.filter(t => 
          t.status !== 'completed' && new Date(t.endDate) < new Date()
        ).length

        if (scheduleHealth >= 80) onScheduleCount++
        if (budgetHealth >= 0) underBudgetCount++

        const projectRiskCount = risks.length
        const projectHighRisks = risks.filter(r => 
          r.probability === 'high' || r.impact === 'high'
        ).length

        totalRiskCount += projectRiskCount
        highRiskCount += projectHighRisks

        const status: 'healthy' | 'warning' | 'critical' = 
          budgetHealth < -10 || scheduleHealth < 50 || projectHighRisks > 3 ? 'critical' :
          budgetHealth < 0 || scheduleHealth < 80 || projectHighRisks > 0 ? 'warning' :
          'healthy'

        if (status === 'critical' || status === 'warning') atRiskCount++

        if (project.status === 'active' || project.status === 'planning') {
          healthData.push({
            project,
            scheduleHealth,
            budgetHealth,
            rfiCount: rfis.filter(r => r.status === 'open' || r.status === 'escalated').length,
            overdueTasks,
            risks: projectRiskCount,
            status,
          })
        }
      }

      healthData.sort((a, b) => {
        const statusOrder = { critical: 0, warning: 1, healthy: 2 }
        return statusOrder[a.status] - statusOrder[b.status]
      })

      const utilizationRate = projects.filter(p => p.status === 'active').length / Math.max(projects.length, 1) * 100
      const avgScheduleHealth = healthData.length > 0 
        ? healthData.reduce((sum, h) => sum + h.scheduleHealth, 0) / healthData.length 
        : 0

      setMetrics({
        totalProjects: projects.length,
        activeProjects: activeProjects.length,
        totalValue: projects.reduce((sum, p) => sum + (p.contractValue || 0), 0),
        atRiskProjects: atRiskCount,
        onScheduleProjects: onScheduleCount,
        underBudgetProjects: underBudgetCount,
        totalBudget,
        totalSpent,
        utilizationRate,
        avgScheduleHealth,
        totalRisks: totalRiskCount,
        highRisks: highRiskCount,
      })
      setProjectHealthData(healthData)
      setLoading(false)
    }

    calculatePortfolioMetrics()
  }, [projects])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getStatusBadge = (status: ProjectHealth['status']) => {
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
    if (statusFilter !== 'all' && h.project.status !== statusFilter) return false
    if (healthFilter !== 'all' && h.status !== healthFilter) return false
    return true
  })

  const budgetPerformance = filteredHealthData.map(h => ({
    name: h.project.name.substring(0, 15),
    health: Math.round(h.budgetHealth),
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">Budget Performance</CardTitle>
            {metrics.totalSpent <= metrics.totalBudget ? (
              <TrendUp size={20} className="text-accent" />
            ) : (
              <TrendDown size={20} className="text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.totalSpent <= metrics.totalBudget ? 'text-accent' : 'text-destructive'}`}>
              {((metrics.totalSpent / metrics.totalBudget) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(metrics.totalSpent)} / {formatCurrency(metrics.totalBudget)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <Warning size={20} className={metrics.atRiskProjects > 0 ? 'text-destructive' : 'text-muted-foreground'} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.atRiskProjects > 0 ? 'text-destructive' : 'text-accent'}`}>
              {metrics.atRiskProjects}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.highRisks} high-priority risks
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
                  <CardTitle>Project Health Dashboard</CardTitle>
                  <CardDescription>Real-time status of all active projects</CardDescription>
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
                    <span>Showing {filteredHealthData.length} of {projectHealthData.length} projects</span>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Schedule</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Open RFIs</TableHead>
                        <TableHead>Overdue Tasks</TableHead>
                        <TableHead>Risks</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHealthData.map((health) => {
                      const statusBadge = getStatusBadge(health.status)
                      return (
                        <TableRow key={health.project.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{health.project.name}</div>
                              <div className="text-xs text-muted-foreground">{health.project.client}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadge.variant}>
                              <span className="mr-1">{statusBadge.icon}</span>
                              {statusBadge.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={health.scheduleHealth} className="w-16 h-2" />
                              <span className="text-sm font-medium">{Math.round(health.scheduleHealth)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`text-sm font-medium ${health.budgetHealth >= 0 ? 'text-accent' : 'text-destructive'}`}>
                              {health.budgetHealth >= 0 ? '+' : ''}{Math.round(health.budgetHealth)}%
                            </span>
                          </TableCell>
                          <TableCell>
                            {health.rfiCount > 0 ? (
                              <Badge variant="secondary">{health.rfiCount}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {health.overdueTasks > 0 ? (
                              <Badge variant="destructive">{health.overdueTasks}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {health.risks > 0 ? (
                              <Badge variant="outline">{health.risks}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/projects/${health.project.id}`)}
                            >
                              View
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
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Budget Performance by Project</CardTitle>
                <CardDescription>Budget health across portfolio</CardDescription>
              </CardHeader>
              <CardContent>
                {budgetPerformance.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ChartLine size={48} className="text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No data</h3>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={budgetPerformance}>
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
                        label={{ value: 'Budget Health (%)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '0.5rem',
                        }}
                      />
                      <Bar dataKey="health" fill="hsl(var(--primary))" />
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
