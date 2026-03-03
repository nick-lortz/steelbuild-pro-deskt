import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Buildings, 
  CurrencyDollar, 
  Wrench, 
  ListChecks, 
  Plus, 
  Warning, 
  FileText, 
  Calendar, 
  TrendUp, 
  TrendDown,
  CheckCircle, 
  ArrowsClockwise,
  ChartLine,
  Package,
  Truck,
  HardHat,
  Clock,
  ArrowRight,
  Gauge,
  UsersFour,
  Hammer
} from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { projectsDb, equipmentDb, checklistsDb, rfisDb } from '@/lib/db'
import { useKV } from '@github/spark/hooks'
import { useDatabase } from '@/hooks/use-database'
import type { Project, Equipment, Checklist, RFI, Task, Alert as AlertType, Submittal, WorkPackage, Delivery, CostCode } from '@/lib/types'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell } from 'recharts'
import { cn } from '@/lib/utils'

export function DashboardPage() {
  const navigate = useNavigate()
  const { isDesktop, db } = useDatabase()
  const [projects, setProjects] = useState<Project[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [rfis, setRfis] = useState<RFI[]>([])
  const [allTasks] = useKV<Task[]>('tasks', [])
  const [alerts] = useKV<AlertType[]>('alerts', [])
  const [submittals] = useKV<Submittal[]>('submittals', [])
  const [workPackages] = useKV<WorkPackage[]>('work-packages', [])
  const [deliveries] = useKV<Delivery[]>('deliveries', [])
  const [costCodes] = useKV<CostCode[]>('global-cost-codes', [])
  const [refreshKey, setRefreshKey] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [portfolioHealthData, setPortfolioHealthData] = useState<any[]>([])
  const [financialSummary, setFinancialSummary] = useState<{
    totalContractValue: number
    totalBudget: number
    totalActual: number
    margin: number
  } | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setSyncing(true)
      try {
        const [p, e, c, r] = await Promise.all([
          projectsDb.getAll(),
          equipmentDb.getAll(),
          checklistsDb.getAll(),
          rfisDb.getAll(),
        ])
        setProjects(p)
        setEquipment(e)
        setChecklists(c)
        setRfis(r)

        if (isDesktop && p.length > 0) {
          const projectIds = p.map(proj => proj.id)
          const healthResult = await db.computePortfolioMarginAtRisk(projectIds)
          if (healthResult.success && healthResult.data) {
            setPortfolioHealthData(healthResult.data)
            
            const totalValue = healthResult.data.reduce((sum: number, proj: any) => sum + proj.contract_value, 0)
            const totalActual = healthResult.data.reduce((sum: number, proj: any) => sum + proj.actual_cost, 0)
            const totalMargin = totalValue - totalActual
            
            setFinancialSummary({
              totalContractValue: totalValue,
              totalBudget: totalValue,
              totalActual,
              margin: totalMargin
            })
          } else {
            const totalResult = await db.recalculateProjectTotals(p[0].id)
            if (totalResult.success && totalResult.data) {
              setFinancialSummary(totalResult.data)
            }
          }
        }
      } finally {
        setTimeout(() => setSyncing(false), 500)
      }
    }
    loadData()
  }, [refreshKey, isDesktop, db])

  useEffect(() => {
    const handleDataChange = () => {
      setRefreshKey(prev => prev + 1)
    }

    window.addEventListener('dataUpdated', handleDataChange)
    return () => window.removeEventListener('dataUpdated', handleDataChange)
  }, [])

  const kpiMetrics = useMemo(() => {
    const activeProjects = projects.filter((p) => p.status === 'active')
    const totalContractValue = financialSummary?.totalContractValue ?? projects.reduce((sum, p) => sum + p.contractValue, 0)
    const totalActual = financialSummary?.totalActual ?? 0
    const margin = financialSummary?.margin ?? 0
    const marginPercent = totalContractValue > 0 ? (margin / totalContractValue) * 100 : 0
    
    const pendingChecklists = checklists.filter((c) => c.status !== 'completed')
    const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.dismissed).length
    const openRFIs = rfis.filter(r => r.status === 'open').length
    const agingRFIs = rfis.filter(r => {
      if (r.status !== 'open') return false
      const age = Date.now() - new Date(r.createdAt).getTime()
      return age > 72 * 60 * 60 * 1000
    }).length
    
    const overdueTasks = allTasks.filter(t => {
      if (t.status === 'completed') return false
      if (!t.endDate) return false
      return new Date(t.endDate) < new Date()
    }).length
    
    const totalActiveTasks = allTasks.filter(t => t.status !== 'completed').length
    const completedTasks = allTasks.filter(t => t.status === 'completed').length
    const scheduleHealthPercent = allTasks.length > 0 ? ((allTasks.length - overdueTasks) / allTasks.length) * 100 : 100
    
    const pendingSubmittals = submittals.filter(s => 
      s.status === 'submitted' || s.status === 'IFA' || s.status === 'BFA'
    ).length
    
    const activePackages = workPackages.filter(wp => 
      wp.status === 'fabrication' || wp.status === 'ready'
    ).length
    
    const pendingDeliveries = deliveries.filter(d => 
      d.status === 'scheduled' || d.status === 'in_transit'
    ).length
    
    const overBudgetCodes = costCodes.filter(cc => 
      cc.actualAmount && cc.budgetAmount && cc.actualAmount > cc.budgetAmount
    ).length
    
    const criticalProjects = portfolioHealthData.filter((p: any) => 
      p.health_status === 'critical'
    ).length
    
    const warningProjects = portfolioHealthData.filter((p: any) => 
      p.health_status === 'warning'
    ).length

    return {
      activeProjects: activeProjects.length,
      totalProjects: projects.length,
      totalContractValue,
      totalActual,
      margin,
      marginPercent,
      pendingChecklists: pendingChecklists.length,
      criticalAlerts,
      openRFIs,
      agingRFIs,
      overdueTasks,
      totalActiveTasks,
      completedTasks,
      scheduleHealthPercent,
      pendingSubmittals,
      activePackages,
      pendingDeliveries,
      overBudgetCodes,
      criticalProjects,
      warningProjects,
      equipmentCount: equipment.length,
    }
  }, [projects, equipment, checklists, rfis, allTasks, alerts, submittals, workPackages, deliveries, costCodes, financialSummary, portfolioHealthData])

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        tasks: Math.floor(Math.random() * 15) + 5,
        rfis: Math.floor(Math.random() * 5) + 1,
        deliveries: Math.floor(Math.random() * 3) + 1,
      }
    })

    const projectsByStatus = [
      { name: 'Active', value: projects.filter(p => p.status === 'active').length, fill: '#10b981' },
      { name: 'Planning', value: projects.filter(p => p.status === 'planning').length, fill: '#6366f1' },
      { name: 'On Hold', value: projects.filter(p => p.status === 'onhold').length, fill: '#f59e0b' },
      { name: 'Completed', value: projects.filter(p => p.status === 'completed').length, fill: '#8b5cf6' },
    ]

    const financialTrend = [
      { month: 'Jan', budget: 1200, actual: 1100 },
      { month: 'Feb', budget: 1300, actual: 1250 },
      { month: 'Mar', budget: 1400, actual: 1380 },
      { month: 'Apr', budget: 1500, actual: 1520 },
      { month: 'May', budget: 1600, actual: 1580 },
      { month: 'Jun', budget: 1700, actual: 1650 },
    ]

    return { last7Days, projectsByStatus, financialTrend }
  }, [projects])

  return (
    <div className="space-y-6 animate-in p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-4xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-2 text-base">
            Real-time overview of your steel fabrication operations and project health
          </p>
        </div>
        <div className="flex items-center gap-3">
          {syncing && (
            <Badge variant="secondary" className="gap-2 animate-pulse">
              <ArrowsClockwise className="w-3.5 h-3.5 animate-spin" />
              Syncing...
            </Badge>
          )}
          <Button className="gap-2" onClick={() => navigate('/projects/new')}>
            <Plus size={18} weight="bold" />
            New Project
          </Button>
        </div>
      </div>

      {kpiMetrics.criticalAlerts > 0 && (
        <Card className="border-destructive/50 bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/10 rounded-full blur-3xl" />
          <CardHeader className="pb-3 relative">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <Warning className="w-5 h-5 text-destructive" weight="fill" />
              </div>
              <CardTitle className="text-destructive">Critical Alerts</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-center justify-between">
              <p className="text-sm text-foreground/80">
                You have <span className="font-semibold text-destructive">{kpiMetrics.criticalAlerts}</span> critical alert{kpiMetrics.criticalAlerts !== 1 ? 's' : ''} requiring immediate attention.
              </p>
              <Link to="/alerts">
                <Button variant="destructive" size="sm" className="shadow-md hover:shadow-lg transition-shadow">
                  View Alerts
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Primary KPIs */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-accent cursor-pointer" onClick={() => navigate('/projects')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Active Projects</CardTitle>
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Buildings size={20} className="text-accent" weight="duotone" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-3xl font-bold tracking-tight">{kpiMetrics.activeProjects}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  of {kpiMetrics.totalProjects} total projects
                </p>
                <Progress value={(kpiMetrics.activeProjects / Math.max(kpiMetrics.totalProjects, 1)) * 100} className="mt-3 h-2" />
              </CardContent>
            </Card>

            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-success cursor-pointer" onClick={() => navigate('/financials')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Contract Value</CardTitle>
                <div className="p-2 bg-success/10 rounded-lg">
                  <CurrencyDollar size={20} className="text-success" weight="duotone" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-3xl font-bold tracking-tight">
                  ${(kpiMetrics.totalContractValue / 1000000).toFixed(1)}M
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ${(kpiMetrics.totalActual / 1000000).toFixed(1)}M spent
                </p>
                <div className={cn("mt-3 flex items-center gap-1.5 text-xs font-medium", kpiMetrics.marginPercent >= 0 ? "text-success" : "text-destructive")}>
                  {kpiMetrics.marginPercent >= 0 ? <TrendUp className="w-3.5 h-3.5" weight="bold" /> : <TrendDown className="w-3.5 h-3.5" weight="bold" />}
                  <span>{Math.abs(kpiMetrics.marginPercent).toFixed(1)}% margin</span>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-warning cursor-pointer" onClick={() => navigate('/schedule')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Schedule Health</CardTitle>
                <div className="p-2 bg-warning/10 rounded-lg">
                  <Clock size={20} className="text-warning" weight="duotone" />
                </div>
              </CardHeader>
              <CardContent>
                <div className={cn("font-mono text-3xl font-bold tracking-tight", 
                  kpiMetrics.scheduleHealthPercent >= 80 ? "text-success" : 
                  kpiMetrics.scheduleHealthPercent >= 60 ? "text-warning" : "text-destructive"
                )}>
                  {Math.round(kpiMetrics.scheduleHealthPercent)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {kpiMetrics.overdueTasks} overdue of {kpiMetrics.totalActiveTasks} active
                </p>
                <Progress value={kpiMetrics.scheduleHealthPercent} className="mt-3 h-2" />
              </CardContent>
            </Card>

            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-destructive cursor-pointer" onClick={() => navigate('/rfis')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Open RFIs</CardTitle>
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <FileText size={20} className="text-destructive" weight="duotone" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-3xl font-bold tracking-tight text-destructive">{kpiMetrics.openRFIs}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {kpiMetrics.agingRFIs} aging ({'>'} 72hrs)
                </p>
                {kpiMetrics.openRFIs > 5 && (
                  <Badge variant="destructive" className="mt-3 shadow-sm">Action needed</Badge>
                )}
                {kpiMetrics.openRFIs === 0 && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-success">
                    <CheckCircle className="w-3.5 h-3.5" weight="fill" />
                    <span>All clear</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Trend</CardTitle>
                <CardDescription>Last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData.last7Days}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Legend />
                    <Area type="monotone" dataKey="tasks" name="Tasks" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                    <Area type="monotone" dataKey="rfis" name="RFIs" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                    <Area type="monotone" dataKey="deliveries" name="Deliveries" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Distribution</CardTitle>
                <CardDescription>Projects by status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={chartData.projectsByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {chartData.projectsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Projects</CardTitle>
                  <CardDescription>Your most recently updated projects</CardDescription>
                </div>
                <Link to="/projects">
                  <Button variant="outline" size="sm" className="gap-2">
                    View All
                    <ArrowRight size={16} />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
                    <Buildings size={32} className="text-muted-foreground" weight="duotone" />
                  </div>
                  <p className="text-muted-foreground mb-4">No projects yet</p>
                  <Link to="/projects">
                    <Button variant="outline" size="sm">
                      Create your first project
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.slice(0, 5).map((project) => (
                    <Link
                      key={project.id}
                      to={`/projects/${project.id}`}
                      className="block rounded-lg border border-border/50 p-4 transition-all hover:border-border hover:shadow-md hover:bg-muted/30"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-base">{project.name}</h3>
                            <Badge variant="secondary" className="capitalize text-xs">
                              {project.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground font-mono mt-1">
                            {project.number} • {project.client}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-bold text-lg">
                            ${(project.contractValue / 1000).toFixed(0)}K
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-primary cursor-pointer" onClick={() => navigate('/work-packages')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Active Packages</CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package size={20} className="text-primary" weight="duotone" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-3xl font-bold tracking-tight">{kpiMetrics.activePackages}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  In fabrication or ready
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-accent cursor-pointer" onClick={() => navigate('/deliveries')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Pending Deliveries</CardTitle>
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Truck size={20} className="text-accent" weight="duotone" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-3xl font-bold tracking-tight">{kpiMetrics.pendingDeliveries}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Scheduled or in transit
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-success cursor-pointer" onClick={() => navigate('/equipment')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Equipment Fleet</CardTitle>
                <div className="p-2 bg-success/10 rounded-lg">
                  <Wrench size={20} className="text-success" weight="duotone" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-3xl font-bold tracking-tight">{kpiMetrics.equipmentCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Units in fleet
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-warning cursor-pointer" onClick={() => navigate('/submittals')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Pending Submittals</CardTitle>
                <div className="p-2 bg-warning/10 rounded-lg">
                  <FileText size={20} className="text-warning" weight="duotone" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-3xl font-bold tracking-tight">{kpiMetrics.pendingSubmittals}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  In review
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:shadow-lg transition-all duration-300 hover:border-accent/50 cursor-pointer" onClick={() => navigate('/work-packages')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package size={20} className="text-accent" />
                  Work Packages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Track fabrication progress and readiness</p>
                <Button variant="outline" size="sm" className="w-full">Manage Packages</Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 hover:border-accent/50 cursor-pointer" onClick={() => navigate('/detailing')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hammer size={20} className="text-accent" />
                  Detailing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Review and approve shop drawings</p>
                <Button variant="outline" size="sm" className="w-full">View Drawings</Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 hover:border-accent/50 cursor-pointer" onClick={() => navigate('/fabrication')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardHat size={20} className="text-accent" />
                  Fabrication
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Monitor shop floor production status</p>
                <Button variant="outline" size="sm" className="w-full">View Status</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-destructive">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Critical Projects</CardTitle>
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <Warning size={20} className="text-destructive" weight="duotone" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-3xl font-bold tracking-tight text-destructive">{kpiMetrics.criticalProjects}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Require immediate action
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-warning">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Warning Projects</CardTitle>
                <div className="p-2 bg-warning/10 rounded-lg">
                  <Warning size={20} className="text-warning" weight="duotone" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-3xl font-bold tracking-tight text-warning">{kpiMetrics.warningProjects}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Need attention
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-destructive">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Over Budget</CardTitle>
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <CurrencyDollar size={20} className="text-destructive" weight="duotone" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-3xl font-bold tracking-tight text-destructive">{kpiMetrics.overBudgetCodes}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Cost codes exceeding budget
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-warning">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Aging RFIs</CardTitle>
                <div className="p-2 bg-warning/10 rounded-lg">
                  <Clock size={20} className="text-warning" weight="duotone" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-3xl font-bold tracking-tight text-warning">{kpiMetrics.agingRFIs}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Open for more than 72 hours
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Financial Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Trend</CardTitle>
              <CardDescription>Budget vs Actual over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.financialTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Legend />
                  <Line type="monotone" dataKey="budget" name="Budget ($K)" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="actual" name="Actual ($K)" stroke="#6366f1" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Overall status indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <span className="text-sm font-medium">Projects</span>
                <Badge variant={kpiMetrics.activeProjects > 0 ? 'default' : 'secondary'}>
                  {kpiMetrics.activeProjects > 0 ? `${kpiMetrics.activeProjects} Active` : 'None'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <span className="text-sm font-medium">RFIs</span>
                <Badge variant={kpiMetrics.openRFIs === 0 ? 'default' : kpiMetrics.openRFIs < 5 ? 'secondary' : 'destructive'}>
                  {kpiMetrics.openRFIs === 0 ? 'All clear' : `${kpiMetrics.openRFIs} open`}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <span className="text-sm font-medium">Schedule</span>
                <Badge variant={kpiMetrics.overdueTasks === 0 ? 'default' : 'destructive'}>
                  {kpiMetrics.overdueTasks === 0 ? 'On track' : `${kpiMetrics.overdueTasks} overdue`}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <span className="text-sm font-medium">Alerts</span>
                <Badge variant={kpiMetrics.criticalAlerts === 0 ? 'default' : 'destructive'}>
                  {kpiMetrics.criticalAlerts === 0 ? 'None' : `${kpiMetrics.criticalAlerts} critical`}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
