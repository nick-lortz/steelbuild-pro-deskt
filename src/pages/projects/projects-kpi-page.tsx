import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChartLine, TrendUp, TrendDown, Warning, CheckCircle, Clock, CurrencyDollar, CalendarBlank, Users, FunnelSimple, CaretDown, ArrowRight } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useKV } from '@github/spark/hooks'
import type { Project, Task, CostCode } from '@/lib/types'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { cn } from '@/lib/utils'

export function ProjectsKPIPage() {
  const navigate = useNavigate()
  const [projects] = useKV<Project[]>('projects', [])
  const [tasks] = useKV<Task[]>('all-tasks', [])
  const [costCodes] = useKV<CostCode[]>('global-cost-codes', [])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month')

  const filteredProjects = useMemo(() => {
    const projectList = projects || []
    if (filterStatus === 'all') return projectList
    return projectList.filter(p => p.status === filterStatus)
  }, [projects, filterStatus])

  const portfolioKPIs = useMemo(() => {
    const projectList = projects || []
    const taskList = tasks || []
    const costCodeList = costCodes || []

    const activeProjects = projectList.filter(p => p.status === 'active')
    const totalContractValue = projectList.reduce((sum, p) => sum + (p.contractValue || 0), 0)
    
    const projectHealth = projectList.map(project => {
      const projectTasks = taskList.filter(t => t.projectId === project.id)
      const completedTasks = projectTasks.filter(t => t.status === 'completed').length
      const totalTasks = projectTasks.length
      const scheduleHealth = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

      const projectCostCodes = costCodeList.filter(cc => cc.projectId === project.id)
      const budgetTotal = projectCostCodes.reduce((sum, cc) => sum + (cc.budgetAmount || 0), 0)
      const actualTotal = projectCostCodes.reduce((sum, cc) => sum + (cc.actualAmount || 0), 0)
      const financialHealth = budgetTotal > 0 ? ((budgetTotal - actualTotal) / budgetTotal) * 100 : 100

      const overdueTasks = projectTasks.filter(t => 
        t.status !== 'completed' && new Date(t.endDate) < new Date()
      ).length

      return {
        projectId: project.id,
        projectName: project.name,
        projectNumber: project.number,
        status: project.status,
        scheduleHealth,
        financialHealth,
        overdueTasks,
        totalTasks,
        completedTasks,
        budgetTotal,
        actualTotal,
        contractValue: project.contractValue || 0,
        startDate: project.startDate,
        endDate: project.endDate,
      }
    })

    const avgScheduleHealth = projectHealth.reduce((sum, p) => sum + p.scheduleHealth, 0) / projectHealth.length || 0
    const avgFinancialHealth = projectHealth.reduce((sum, p) => sum + p.financialHealth, 0) / projectHealth.length || 0
    const totalOverdue = projectHealth.reduce((sum, p) => sum + p.overdueTasks, 0)
    const atRiskProjects = projectHealth.filter(p => p.scheduleHealth < 70 || p.financialHealth < 80).length

    return {
      totalProjects: projectList.length,
      activeProjects: activeProjects.length,
      totalContractValue,
      avgScheduleHealth,
      avgFinancialHealth,
      totalOverdue,
      atRiskProjects,
      projectHealth,
    }
  }, [projects, tasks, costCodes])

  const chartData = useMemo(() => {
    const statusData = [
      { name: 'Planning', value: (projects || []).filter(p => p.status === 'planning').length, color: '#6366f1' },
      { name: 'Active', value: (projects || []).filter(p => p.status === 'active').length, color: '#10b981' },
      { name: 'On Hold', value: (projects || []).filter(p => p.status === 'onhold').length, color: '#f59e0b' },
      { name: 'Completed', value: (projects || []).filter(p => p.status === 'completed').length, color: '#8b5cf6' },
    ]

    const healthTrendData = portfolioKPIs.projectHealth.slice(0, 10).map(p => ({
      name: p.projectNumber,
      schedule: Math.round(p.scheduleHealth),
      financial: Math.round(p.financialHealth),
    }))

    const financialData = portfolioKPIs.projectHealth.map(p => ({
      name: p.projectNumber,
      budget: p.budgetTotal,
      actual: p.actualTotal,
      variance: p.budgetTotal - p.actualTotal,
    }))

    return { statusData, healthTrendData, financialData }
  }, [projects, portfolioKPIs])

  const getHealthColor = (health: number) => {
    if (health >= 80) return 'text-success'
    if (health >= 60) return 'text-warning'
    return 'text-destructive'
  }

  const getHealthBadge = (health: number) => {
    if (health >= 80) return 'default'
    if (health >= 60) return 'secondary'
    return 'destructive'
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Portfolio Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive project KPIs, health metrics, and financial tracking
            </p>
          </div>
          <Button className="gap-2" onClick={() => navigate('/projects/new')}>
            <Plus size={18} weight="bold" />
            New Project
          </Button>
        </div>

        {/* Portfolio KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">{portfolioKPIs.totalProjects}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {portfolioKPIs.activeProjects} active
                  </p>
                </div>
                <ChartLine size={32} className="text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-success">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Contract Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">
                    ${(portfolioKPIs.totalContractValue / 1000000).toFixed(1)}M
                  </div>
                  <p className="text-xs text-success flex items-center gap-1 mt-1">
                    <TrendUp size={12} weight="bold" />
                    Portfolio value
                  </p>
                </div>
                <CurrencyDollar size={32} className="text-success opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-warning">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Schedule Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className={cn("text-3xl font-bold", getHealthColor(portfolioKPIs.avgScheduleHealth))}>
                    {Math.round(portfolioKPIs.avgScheduleHealth)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {portfolioKPIs.totalOverdue} overdue tasks
                  </p>
                </div>
                <Clock size={32} className="text-warning opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-destructive">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">At Risk Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-destructive">
                    {portfolioKPIs.atRiskProjects}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Require attention
                  </p>
                </div>
                <Warning size={32} className="text-destructive opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Status Distribution</CardTitle>
              <CardDescription>Current portfolio breakdown by status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Health Comparison</CardTitle>
              <CardDescription>Schedule vs. Financial health by project</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.healthTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="schedule" name="Schedule Health %" fill="#10b981" />
                  <Bar dataKey="financial" name="Financial Health %" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Project List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Project Portfolio</CardTitle>
                <CardDescription>Detailed view of all projects with health indicators</CardDescription>
              </div>
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="onhold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredProjects.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ChartLine size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No projects found</p>
                </div>
              ) : (
                filteredProjects.map(project => {
                  const healthData = portfolioKPIs.projectHealth.find(h => h.projectId === project.id)
                  if (!healthData) return null

                  return (
                    <div
                      key={project.id}
                      className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{project.name}</h3>
                            <Badge variant={
                              project.status === 'active' ? 'default' :
                              project.status === 'completed' ? 'secondary' :
                              project.status === 'onhold' ? 'destructive' : 'outline'
                            }>
                              {project.status}
                            </Badge>
                            {(healthData.scheduleHealth < 70 || healthData.financialHealth < 80) && (
                              <Badge variant="destructive" className="gap-1">
                                <Warning size={14} weight="bold" />
                                At Risk
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {project.number} • {project.client} • {project.location}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CurrencyDollar size={14} />
                              ${(project.contractValue / 1000000).toFixed(2)}M
                            </span>
                            <span className="flex items-center gap-1">
                              <CalendarBlank size={14} />
                              {new Date(project.startDate).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users size={14} />
                              {healthData.totalTasks} tasks
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <ArrowRight size={18} />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">Schedule Health</span>
                            <span className={cn("text-xs font-bold", getHealthColor(healthData.scheduleHealth))}>
                              {Math.round(healthData.scheduleHealth)}%
                            </span>
                          </div>
                          <Progress value={healthData.scheduleHealth} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {healthData.completedTasks}/{healthData.totalTasks} tasks completed
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">Financial Health</span>
                            <span className={cn("text-xs font-bold", getHealthColor(healthData.financialHealth))}>
                              {Math.round(healthData.financialHealth)}%
                            </span>
                          </div>
                          <Progress value={healthData.financialHealth} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            ${((healthData.budgetTotal - healthData.actualTotal) / 1000).toFixed(0)}K remaining
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">Duration</span>
                            <span className="text-xs font-bold">
                              {healthData.endDate ? 
                                Math.round((new Date(healthData.endDate).getTime() - new Date(healthData.startDate).getTime()) / (1000 * 60 * 60 * 24))
                                : '—'
                              } days
                            </span>
                          </div>
                          <Progress 
                            value={healthData.endDate ? 
                              ((new Date().getTime() - new Date(healthData.startDate).getTime()) / 
                              (new Date(healthData.endDate).getTime() - new Date(healthData.startDate).getTime())) * 100
                              : 0
                            } 
                            className="h-2" 
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {healthData.overdueTasks > 0 && (
                              <span className="text-destructive">{healthData.overdueTasks} overdue</span>
                            )}
                            {healthData.overdueTasks === 0 && 'On track'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
