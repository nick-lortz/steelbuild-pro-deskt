import { useState, useEffect, useMemo } from 'react'
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
  ArrowRight,
  Gauge,
  Package,
  FileText,
  ArrowsClockwise,
  FunnelSimple,
  Funnel,
  CaretDown,
  Target,
  ChartLineUp,
  Shield,
  ListChecks,
  Plus,
  Coins,
  Wrench,
  HardHat,
  ChartBar,
  CalendarCheck,
  Truck,
  ClipboardText,
  Laptop,
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
import { projectsDb, rfisDb } from '@/lib/db'
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
  AreaChart,
  Area,
  Scatter,
  ScatterChart,
  ZAxis,
  ComposedChart,
} from 'recharts'
import type { Project, Task, RFI, CostCode, ChangeOrder, Submittal, WorkPackage, LaborEntry, DailyLog, Equipment, Invoice, Expense } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PortfolioMetrics {
  totalProjects: number
  activeProjects: number
  planningProjects: number
  completedProjects: number
  totalValue: number
  totalSpent: number
  totalMargin: number
  marginPercent: number
  atRiskProjects: number
  criticalProjects: number
  warningProjects: number
  healthyProjects: number
  onScheduleProjects: number
  underBudgetProjects: number
  avgScheduleHealth: number
  totalOverdueTasks: number
  totalActiveTasks: number
  totalOpenRFIs: number
  totalAgingRFIs: number
  totalPendingSubmittals: number
  totalActivePackages: number
  totalOverBudgetCodes: number
  utilizationRate: number
  avgMarginPercent: number
  
  cv: number
  cpi: number
  eac: number
  pendingCOValue: number
  approvedCOValue: number
  unpricedWorkValue: number
  budgetedLaborHours: number
  actualLaborHours: number
  productivityRate: number
  overtimePercentage: number
  crewUtilization: number
  sv: number
  spi: number
  criticalPathTasksCount: number
  procurementLeadTimeDays: number
  rfiTurnaroundDays: number
  billingsTotal: number
  earnedRevenueTotal: number
  arAgingOver30: number
  arAgingOver60: number
  arAgingOver90: number
  cashFlowForecast30Days: number
  cashFlowForecast60Days: number
  cashFlowForecast90Days: number
  reworkHours: number
  safetyIncidents: number
  emrImpact: number
  punchListVolume: number
  submittalLogHealth: number
  drawingRevisionImpact: number
  equipmentUtilization: number
  grossMarginByCostCode: Record<string, { margin: number; marginPercent: number }>
}

interface ProjectHealth {
  project_id: string
  project_number: string
  project_name: string
  client: string
  status: 'planning' | 'active' | 'onhold' | 'completed'
  contract_value: number
  actual_cost: number
  margin: number
  margin_percent: number
  budget_total: number
  approved_change_orders: number
  change_order_total: number
  open_rfis: number
  aging_rfis: number
  over_budget_cost_codes: number
  total_tasks: number
  completed_tasks: number
  overdue_tasks: number
  schedule_health: number
  pending_submittals: number
  active_packages: number
  health_status: 'healthy' | 'warning' | 'critical'
  health_score: number
  risk_level: 'low' | 'medium' | 'high'
}

export function PortfolioPulsePage() {
  const navigate = useNavigate()
  const { isDesktop, db } = useDatabase()
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [allRFIs, setAllRFIs] = useState<RFI[]>([])
  const [allTasks] = useKV<Task[]>('all-tasks', [])
  const [allCostCodes] = useKV<CostCode[]>('global-cost-codes', [])
  const [allChangeOrders] = useKV<ChangeOrder[]>('change-orders', [])
  const [allSubmittals] = useKV<Submittal[]>('submittals', [])
  const [allWorkPackages] = useKV<WorkPackage[]>('work-packages', [])
  const [allLaborEntries] = useKV<LaborEntry[]>('labor-entries', [])
  const [allDailyLogs] = useKV<DailyLog[]>('daily-logs', [])
  const [allEquipment] = useKV<Equipment[]>('equipment', [])
  const [allInvoices] = useKV<Invoice[]>('invoices', [])
  const [allExpenses] = useKV<Expense[]>('expenses', [])
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null)
  const [projectHealthData, setProjectHealthData] = useState<ProjectHealth[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [healthFilter, setHealthFilter] = useState<string>('all')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    async function loadData() {
      setSyncing(true)
      try {
        const [projectsData, rfisData] = await Promise.all([
          projectsDb.getAll(),
          rfisDb.getAll(),
        ])
        setAllProjects(projectsData)
        setAllRFIs(rfisData)
      } finally {
        setSyncing(false)
      }
    }
    loadData()
  }, [refreshKey])

  useEffect(() => {
    const handleDataChange = () => {
      setRefreshKey(prev => prev + 1)
    }
    window.addEventListener('dataUpdated', handleDataChange)
    return () => window.removeEventListener('dataUpdated', handleDataChange)
  }, [])

  useEffect(() => {
    async function calculatePortfolioMetrics() {
      if (!allProjects || allProjects.length === 0) {
        setLoading(false)
        return
      }

      const healthData: ProjectHealth[] = allProjects.map(project => {
        const projectTasks = (allTasks || []).filter(t => t.projectId === project.id)
        const projectRFIs = allRFIs.filter(r => r.projectId === project.id)
        const projectCostCodes = (allCostCodes || []).filter(cc => cc.projectId === project.id)
        const projectChangeOrders = (allChangeOrders || []).filter(co => co.projectId === project.id && co.status === 'approved')
        const projectSubmittals = (allSubmittals || []).filter(s => s.projectId === project.id)
        const projectPackages = (allWorkPackages || []).filter(wp => wp.projectId === project.id)

        const totalTasks = projectTasks.length
        const completedTasks = projectTasks.filter(t => t.status === 'completed').length
        const overdueTasks = projectTasks.filter(t => 
          t.status !== 'completed' && t.endDate && new Date(t.endDate) < new Date()
        ).length

        const openRFIs = projectRFIs.filter(r => r.status === 'open').length
        const agingRFIs = projectRFIs.filter(r => {
          if (r.status !== 'open') return false
          const age = Date.now() - new Date(r.createdAt).getTime()
          return age > 72 * 60 * 60 * 1000
        }).length

        const budgetTotal = projectCostCodes.reduce((sum, cc) => sum + (cc.budgetAmount || 0), 0)
        const actualTotal = projectCostCodes.reduce((sum, cc) => sum + (cc.actualAmount || 0), 0)
        const overBudgetCodes = projectCostCodes.filter(cc => 
          cc.actualAmount && cc.budgetAmount && cc.actualAmount > cc.budgetAmount
        ).length

        const changeOrderTotal = projectChangeOrders.reduce((sum, co) => sum + (co.total || 0), 0)
        const contractValue = project.contractValue + changeOrderTotal
        const margin = contractValue - actualTotal
        const marginPercent = contractValue > 0 ? (margin / contractValue) * 100 : 0

        const scheduleHealth = totalTasks > 0 ? ((totalTasks - overdueTasks) / totalTasks) * 100 : 100

        const pendingSubmittals = projectSubmittals.filter(s => 
          s.status === 'submitted' || s.status === 'IFA' || s.status === 'BFA'
        ).length

        const activePackages = projectPackages.filter(wp => 
          wp.status === 'fabrication' || wp.status === 'ready'
        ).length

        let healthScore = 100
        if (overdueTasks > 0) healthScore -= overdueTasks * 5
        if (overBudgetCodes > 0) healthScore -= overBudgetCodes * 10
        if (agingRFIs > 0) healthScore -= agingRFIs * 8
        if (marginPercent < 0) healthScore -= 20

        const healthStatus: 'healthy' | 'warning' | 'critical' = 
          healthScore >= 70 ? 'healthy' : healthScore >= 40 ? 'warning' : 'critical'

        const riskLevel: 'low' | 'medium' | 'high' = 
          healthScore >= 70 ? 'low' : healthScore >= 40 ? 'medium' : 'high'

        return {
          project_id: project.id,
          project_number: project.number,
          project_name: project.name,
          client: project.client,
          status: project.status,
          contract_value: contractValue,
          actual_cost: actualTotal,
          margin,
          margin_percent: marginPercent,
          budget_total: budgetTotal,
          approved_change_orders: projectChangeOrders.length,
          change_order_total: changeOrderTotal,
          open_rfis: openRFIs,
          aging_rfis: agingRFIs,
          over_budget_cost_codes: overBudgetCodes,
          total_tasks: totalTasks,
          completed_tasks: completedTasks,
          overdue_tasks: overdueTasks,
          schedule_health: scheduleHealth,
          pending_submittals: pendingSubmittals,
          active_packages: activePackages,
          health_status: healthStatus,
          health_score: Math.max(0, healthScore),
          risk_level: riskLevel,
        }
      })

      setProjectHealthData(healthData)

      const activeProjects = healthData.filter(p => p.status === 'active')
      const totalValue = healthData.reduce((sum, p) => sum + p.contract_value, 0)
      const totalSpent = healthData.reduce((sum, p) => sum + p.actual_cost, 0)
      const totalMargin = totalValue - totalSpent
      const marginPercent = totalValue > 0 ? (totalMargin / totalValue) * 100 : 0

      const earnedValue = healthData.reduce((sum, p) => {
        const earned = p.budget_total * (p.completed_tasks / (p.total_tasks || 1))
        return sum + earned
      }, 0)
      const cv = earnedValue - totalSpent
      const cpi = totalSpent > 0 ? earnedValue / totalSpent : 1
      const eac = cpi > 0 ? totalValue / cpi : totalValue
      
      const pendingCOs = (allChangeOrders || []).filter(co => co.status === 'submitted')
      const approvedCOs = (allChangeOrders || []).filter(co => co.status === 'approved')
      const pendingCOValue = pendingCOs.reduce((sum, co) => sum + (co.total || 0), 0)
      const approvedCOValue = approvedCOs.reduce((sum, co) => sum + (co.total || 0), 0)
      const unpricedWorkValue = pendingCOs.filter(co => !co.total || co.total === 0).length * 50000

      const laborEntries = allLaborEntries || []
      const budgetedLaborHours = (allCostCodes || [])
        .filter(cc => cc.category === 'labor')
        .reduce((sum, cc) => sum + ((cc.budgetAmount || 0) / 75), 0)
      const actualLaborHours = laborEntries.reduce((sum, le) => sum + (le.totalHours || 0), 0)
      const overtimeHours = laborEntries.reduce((sum, le) => sum + (le.overtimeHours || 0), 0)
      const productivityRate = budgetedLaborHours > 0 ? actualLaborHours / budgetedLaborHours : 1
      const overtimePercentage = actualLaborHours > 0 ? (overtimeHours / actualLaborHours) * 100 : 0
      
      const dailyLogs = allDailyLogs || []
      const totalCrewDays = dailyLogs.reduce((sum, log) => sum + (log.crewCount || 0), 0)
      const crewUtilization = totalCrewDays > 0 ? (actualLaborHours / (totalCrewDays * 8)) * 100 : 0

      const plannedValue = healthData.reduce((sum, p) => sum + p.budget_total, 0)
      const sv = earnedValue - plannedValue
      const spi = plannedValue > 0 ? earnedValue / plannedValue : 1
      
      const criticalPathTasks = (allTasks || []).filter(t => t.isCriticalPath)
      const criticalPathTasksCount = criticalPathTasks.length

      const avgProcurementLead = 45
      const avgRFITurnaround = allRFIs.filter(r => r.status === 'answered' && r.answeredDate).reduce((sum, r) => {
        const days = (new Date(r.answeredDate!).getTime() - new Date(r.submittedDate).getTime()) / (1000 * 60 * 60 * 24)
        return sum + days
      }, 0) / (allRFIs.filter(r => r.status === 'answered').length || 1)

      const invoices = allInvoices || []
      const billingsTotal = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
      const earnedRevenueTotal = earnedValue
      
      const now = Date.now()
      const arAgingOver30 = invoices.filter(inv => {
        const age = (now - new Date(inv.invoiceDate).getTime()) / (1000 * 60 * 60 * 24)
        return inv.status !== 'paid' && age > 30
      }).reduce((sum, inv) => sum + (inv.amount - inv.paidAmount), 0)
      
      const arAgingOver60 = invoices.filter(inv => {
        const age = (now - new Date(inv.invoiceDate).getTime()) / (1000 * 60 * 60 * 24)
        return inv.status !== 'paid' && age > 60
      }).reduce((sum, inv) => sum + (inv.amount - inv.paidAmount), 0)
      
      const arAgingOver90 = invoices.filter(inv => {
        const age = (now - new Date(inv.invoiceDate).getTime()) / (1000 * 60 * 60 * 24)
        return inv.status !== 'paid' && age > 90
      }).reduce((sum, inv) => sum + (inv.amount - inv.paidAmount), 0)

      const cashFlowForecast30Days = earnedRevenueTotal * 0.3
      const cashFlowForecast60Days = earnedRevenueTotal * 0.5
      const cashFlowForecast90Days = earnedRevenueTotal * 0.7

      const reworkHours = laborEntries.filter(le => le.description?.toLowerCase().includes('rework')).reduce((sum, le) => sum + le.totalHours, 0)
      const safetyIncidents = dailyLogs.filter(log => log.safetyNotes && log.safetyNotes.toLowerCase().includes('incident')).length
      const emrImpact = safetyIncidents * 0.05
      const punchListVolume = 0

      const submittals = allSubmittals || []
      const submittalsPending = submittals.filter(s => s.status === 'submitted' || s.status === 'IFA').length
      const submittalsTotal = submittals.length
      const submittalLogHealth = submittalsTotal > 0 ? ((submittalsTotal - submittalsPending) / submittalsTotal) * 100 : 100

      const drawingRevisionImpact = 0
      
      const equipment = allEquipment || []
      const equipmentInUse = equipment.filter(eq => eq.status === 'in-use').length
      const equipmentTotal = equipment.length
      const equipmentUtilization = equipmentTotal > 0 ? (equipmentInUse / equipmentTotal) * 100 : 0

      const grossMarginByCostCode: Record<string, { margin: number; marginPercent: number }> = {}
      ;(allCostCodes || []).forEach(cc => {
        const budget = cc.budgetAmount || 0
        const actual = cc.actualAmount || 0
        const margin = budget - actual
        const marginPct = budget > 0 ? (margin / budget) * 100 : 0
        grossMarginByCostCode[cc.code] = { margin, marginPercent: marginPct }
      })

      setMetrics({
        totalProjects: allProjects.length,
        activeProjects: activeProjects.length,
        planningProjects: allProjects.filter(p => p.status === 'planning').length,
        completedProjects: allProjects.filter(p => p.status === 'completed').length,
        totalValue,
        totalSpent,
        totalMargin,
        marginPercent,
        atRiskProjects: healthData.filter(p => p.health_status === 'warning' || p.health_status === 'critical').length,
        criticalProjects: healthData.filter(p => p.health_status === 'critical').length,
        warningProjects: healthData.filter(p => p.health_status === 'warning').length,
        healthyProjects: healthData.filter(p => p.health_status === 'healthy').length,
        onScheduleProjects: healthData.filter(p => p.overdue_tasks === 0).length,
        underBudgetProjects: healthData.filter(p => p.over_budget_cost_codes === 0).length,
        avgScheduleHealth: healthData.length > 0 ? healthData.reduce((sum, p) => sum + p.schedule_health, 0) / healthData.length : 100,
        totalOverdueTasks: healthData.reduce((sum, p) => sum + p.overdue_tasks, 0),
        totalActiveTasks: healthData.reduce((sum, p) => sum + (p.total_tasks - p.completed_tasks), 0),
        totalOpenRFIs: healthData.reduce((sum, p) => sum + p.open_rfis, 0),
        totalAgingRFIs: healthData.reduce((sum, p) => sum + p.aging_rfis, 0),
        totalPendingSubmittals: healthData.reduce((sum, p) => sum + p.pending_submittals, 0),
        totalActivePackages: healthData.reduce((sum, p) => sum + p.active_packages, 0),
        totalOverBudgetCodes: healthData.reduce((sum, p) => sum + p.over_budget_cost_codes, 0),
        utilizationRate: allProjects.length > 0 ? (activeProjects.length / allProjects.length) * 100 : 0,
        avgMarginPercent: healthData.length > 0 ? healthData.reduce((sum, p) => sum + p.margin_percent, 0) / healthData.length : 0,
        cv,
        cpi,
        eac,
        pendingCOValue,
        approvedCOValue,
        unpricedWorkValue,
        budgetedLaborHours,
        actualLaborHours,
        productivityRate,
        overtimePercentage,
        crewUtilization,
        sv,
        spi,
        criticalPathTasksCount,
        procurementLeadTimeDays: avgProcurementLead,
        rfiTurnaroundDays: avgRFITurnaround,
        billingsTotal,
        earnedRevenueTotal,
        arAgingOver30,
        arAgingOver60,
        arAgingOver90,
        cashFlowForecast30Days,
        cashFlowForecast60Days,
        cashFlowForecast90Days,
        reworkHours,
        safetyIncidents,
        emrImpact,
        punchListVolume,
        submittalLogHealth,
        drawingRevisionImpact,
        equipmentUtilization,
        grossMarginByCostCode,
      })

      setLoading(false)
    }

    calculatePortfolioMetrics()
  }, [allProjects, allRFIs, allTasks, allCostCodes, allChangeOrders, allSubmittals, allWorkPackages, allLaborEntries, allDailyLogs, allEquipment, allInvoices, allExpenses])

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
      healthy: { variant: 'default' as const, label: 'Healthy', icon: <CheckCircle size={14} weight="fill" /> },
      warning: { variant: 'secondary' as const, label: 'Warning', icon: <Warning size={14} weight="fill" /> },
      critical: { variant: 'destructive' as const, label: 'Critical', icon: <Warning size={14} weight="fill" /> },
    }
    return config[status]
  }

  const projectsByStatus = allProjects ? [
    { name: 'Active', value: allProjects.filter(p => p.status === 'active').length, color: '#10b981' },
    { name: 'Planning', value: allProjects.filter(p => p.status === 'planning').length, color: '#6366f1' },
    { name: 'On Hold', value: allProjects.filter(p => p.status === 'onhold').length, color: '#f59e0b' },
    { name: 'Completed', value: allProjects.filter(p => p.status === 'completed').length, color: '#8b5cf6' },
  ].filter(item => item.value > 0) : []

  const projectsByHealth = projectHealthData ? [
    { name: 'Healthy', value: projectHealthData.filter(p => p.health_status === 'healthy').length, color: '#10b981' },
    { name: 'Warning', value: projectHealthData.filter(p => p.health_status === 'warning').length, color: '#f59e0b' },
    { name: 'Critical', value: projectHealthData.filter(p => p.health_status === 'critical').length, color: '#ef4444' },
  ].filter(item => item.value > 0) : []

  const filteredHealthData = projectHealthData.filter(h => {
    if (statusFilter !== 'all' && h.status !== statusFilter) return false
    if (healthFilter !== 'all' && h.health_status !== healthFilter) return false
    return true
  })

  const sortedProjects = [...filteredHealthData].sort((a, b) => b.health_score - a.health_score)


  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 animate-in">
        <div className="text-center">
          <Buildings size={48} className="mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading portfolio data...</p>
        </div>
      </div>
    )
  }

  if (!metrics || !allProjects || allProjects.length === 0) {
    return (
      <div className="space-y-6 p-6 animate-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-4xl font-bold tracking-tight">Portfolio Pulse</h2>
            <p className="text-muted-foreground mt-2">Cross-project health analytics</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Buildings size={56} className="text-muted-foreground mb-4" weight="duotone" />
            <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              Create your first project to unlock portfolio-wide insights and cross-project analytics
            </p>
            <Button onClick={() => navigate('/projects')} className="gap-2">
              <Plus size={18} weight="bold" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 animate-in">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-4xl font-bold tracking-tight">Portfolio Pulse</h2>
          <p className="text-muted-foreground mt-2">Cross-project health analytics and live metrics</p>
        </div>
        <div className="flex items-center gap-3">
          {syncing && (
            <Badge variant="secondary" className="gap-2 animate-pulse">
              <ArrowsClockwise className="w-3.5 h-3.5 animate-spin" />
              Syncing...
            </Badge>
          )}
          <Button variant="outline" onClick={() => navigate('/projects')} className="gap-2">
            View All Projects
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-primary cursor-pointer" onClick={() => navigate('/projects')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Projects</CardTitle>
            <Buildings size={20} className="text-primary" weight="duotone" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-3xl font-bold tracking-tight">{metrics.totalProjects}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.activeProjects} active • {metrics.planningProjects} planning
            </p>
            <Progress value={metrics.utilizationRate} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-success cursor-pointer" onClick={() => navigate('/financials')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Portfolio Value</CardTitle>
            <CurrencyDollar size={20} className="text-success" weight="duotone" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-3xl font-bold tracking-tight">{formatCurrency(metrics.totalValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(metrics.totalSpent)} spent
            </p>
            <div className={cn("mt-3 flex items-center gap-1.5 text-xs font-medium", 
              metrics.marginPercent >= 0 ? "text-success" : "text-destructive"
            )}>
              {metrics.marginPercent >= 0 ? <TrendUp className="w-3.5 h-3.5" weight="bold" /> : <TrendDown className="w-3.5 h-3.5" weight="bold" />}
              <span>{Math.abs(metrics.marginPercent).toFixed(1)}% margin</span>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4",
          metrics.criticalProjects > 0 ? "border-l-destructive" : "border-l-warning"
        )}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">At Risk</CardTitle>
            <Warning size={20} className={metrics.criticalProjects > 0 ? 'text-destructive' : 'text-warning'} weight="duotone" />
          </CardHeader>
          <CardContent>
            <div className={cn("font-mono text-3xl font-bold tracking-tight", 
              metrics.criticalProjects > 0 ? 'text-destructive' : metrics.atRiskProjects > 0 ? 'text-warning' : 'text-success'
            )}>
              {metrics.atRiskProjects}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.criticalProjects} critical • {metrics.warningProjects} warning
            </p>
            {metrics.atRiskProjects === 0 && (
              <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-success">
                <CheckCircle className="w-3.5 h-3.5" weight="fill" />
                <span>All healthy</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-accent cursor-pointer" onClick={() => navigate('/schedule')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Schedule Health</CardTitle>
            <Clock size={20} className="text-accent" weight="duotone" />
          </CardHeader>
          <CardContent>
            <div className={cn("font-mono text-3xl font-bold tracking-tight",
              metrics.avgScheduleHealth >= 80 ? "text-success" : 
              metrics.avgScheduleHealth >= 60 ? "text-warning" : "text-destructive"
            )}>
              {Math.round(metrics.avgScheduleHealth)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.totalOverdueTasks} overdue of {metrics.totalActiveTasks} active
            </p>
            <Progress value={metrics.avgScheduleHealth} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-warning cursor-pointer" onClick={() => navigate('/rfis')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Open RFIs</CardTitle>
            <FileText size={20} className="text-warning" weight="duotone" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-3xl font-bold tracking-tight text-warning">{metrics.totalOpenRFIs}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.totalAgingRFIs} aging ({'>'} 72hrs)
            </p>
            {metrics.totalOpenRFIs === 0 && (
              <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-success">
                <CheckCircle className="w-3.5 h-3.5" weight="fill" />
                <span>All clear</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="health" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="health">Project Health</TabsTrigger>
            <TabsTrigger value="financial">Financial Controls</TabsTrigger>
            <TabsTrigger value="labor">Labor & Productivity</TabsTrigger>
            <TabsTrigger value="schedule">Schedule Controls</TabsTrigger>
            <TabsTrigger value="risk">Risk & Quality</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="onhold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Project Health Overview</CardTitle>
                  <CardDescription>Cross-project health metrics and risk indicators</CardDescription>
                </div>
                <Badge variant="secondary" className="ml-auto">{filteredHealthData.length} Projects</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {filteredHealthData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Buildings size={48} className="text-muted-foreground mb-4" weight="duotone" />
                  <h3 className="text-lg font-semibold mb-2">No projects match filters</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Try adjusting your filters to see more projects
                  </p>
                  <Button variant="outline" onClick={() => { setStatusFilter('all'); setHealthFilter('all') }}>
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Contract Value</TableHead>
                      <TableHead className="text-right">Margin %</TableHead>
                      <TableHead className="text-center">Schedule</TableHead>
                      <TableHead className="text-center">Open RFIs</TableHead>
                      <TableHead className="text-center">Overdue</TableHead>
                      <TableHead className="text-center">Health</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedProjects.map((health) => {
                      const statusBadge = getStatusBadge(health.health_status)
                      const marginColor = health.margin_percent >= 15 ? 'text-success' : 
                                        health.margin_percent >= 10 ? 'text-accent' : 
                                        health.margin_percent >= 5 ? 'text-warning' : 
                                        'text-destructive'
                      return (
                        <TableRow 
                          key={health.project_id} 
                          className={cn(
                            "cursor-pointer transition-colors hover:bg-muted/50",
                            health.health_status === 'critical' && 'bg-destructive/5 hover:bg-destructive/10'
                          )}
                          onClick={() => navigate(`/projects/${health.project_id}`)}
                        >
                          <TableCell>
                            <div>
                              <div className="font-semibold text-base flex items-center gap-2">
                                {health.project_name}
                              </div>
                              <div className="text-xs text-muted-foreground font-mono">{health.project_number} • {health.client}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize text-xs">
                              {health.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm font-semibold">
                            {formatCurrency(health.contract_value)}
                          </TableCell>
                          <TableCell className={cn("text-right font-mono text-sm font-bold", marginColor)}>
                            {health.margin_percent >= 0 ? '+' : ''}{health.margin_percent.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Progress value={health.schedule_health} className="w-16 h-2" />
                              <span className="text-xs font-mono">{Math.round(health.schedule_health)}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {health.open_rfis > 0 ? (
                              <Badge variant={health.aging_rfis > 0 ? "destructive" : "secondary"} className="text-xs">
                                {health.open_rfis}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">0</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {health.overdue_tasks > 0 ? (
                              <Badge variant="destructive" className="text-xs">
                                {health.overdue_tasks}
                              </Badge>
                            ) : (
                              <CheckCircle size={18} className="text-success inline" weight="fill" />
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={statusBadge.variant} className="gap-1.5">
                              {statusBadge.icon}
                              {statusBadge.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="gap-2"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/projects/${health.project_id}`)
                              }}
                            >
                              View
                              <ArrowRight size={14} />
                            </Button>
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

        <TabsContent value="financial" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Coins size={16} className="text-accent" />
                  Cost Variance (CV)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn("font-mono text-2xl font-bold", metrics.cv >= 0 ? "text-success" : "text-destructive")}>
                  {formatCurrency(metrics.cv)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Earned - Actual Cost</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ChartBar size={16} className="text-accent" />
                  Cost Performance Index
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn("font-mono text-2xl font-bold", metrics.cpi >= 1 ? "text-success" : "text-destructive")}>
                  {metrics.cpi.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{metrics.cpi >= 1 ? 'Under budget' : 'Over budget'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target size={16} className="text-warning" />
                  Estimate at Completion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-2xl font-bold">{formatCurrency(metrics.eac)}</div>
                <p className="text-xs text-muted-foreground mt-1">Projected final cost</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CurrencyDollar size={16} className="text-success" />
                  Approved COs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-2xl font-bold text-success">{formatCurrency(metrics.approvedCOValue)}</div>
                <p className="text-xs text-muted-foreground mt-1">Change order value</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock size={16} className="text-warning" />
                  Pending COs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-2xl font-bold text-warning">{formatCurrency(metrics.pendingCOValue)}</div>
                <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Warning size={16} className="text-destructive" />
                  Unpriced Work
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-2xl font-bold text-destructive">{formatCurrency(metrics.unpricedWorkValue)}</div>
                <p className="text-xs text-muted-foreground mt-1">Field work exposure</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Gross Margin by Cost Code (Top 10)</CardTitle>
              <CardDescription>Cost code performance analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cost Code</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                    <TableHead className="text-right">Margin %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(metrics.grossMarginByCostCode).slice(0, 10).map(([code, data]) => (
                    <TableRow key={code}>
                      <TableCell className="font-mono text-sm">{code}</TableCell>
                      <TableCell className={cn("text-right font-mono text-sm", data.margin >= 0 ? "text-success" : "text-destructive")}>
                        {formatCurrency(data.margin)}
                      </TableCell>
                      <TableCell className={cn("text-right font-mono text-sm font-semibold", 
                        data.marginPercent >= 15 ? "text-success" : data.marginPercent >= 5 ? "text-warning" : "text-destructive"
                      )}>
                        {data.marginPercent.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="labor" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <HardHat size={16} className="text-primary" />
                  Budgeted Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-2xl font-bold">{Math.round(metrics.budgetedLaborHours).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Total budgeted</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock size={16} className="text-accent" />
                  Actual Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-2xl font-bold">{Math.round(metrics.actualLaborHours).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Hours worked</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Gauge size={16} className={metrics.productivityRate <= 1 ? "text-success" : "text-warning"} />
                  Productivity Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn("font-mono text-2xl font-bold", metrics.productivityRate <= 1 ? "text-success" : "text-warning")}>
                  {metrics.productivityRate.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{metrics.productivityRate <= 1 ? 'Efficient' : 'Over budget'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendUp size={16} className="text-warning" />
                  Overtime %
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn("font-mono text-2xl font-bold", metrics.overtimePercentage < 10 ? "text-success" : "text-warning")}>
                  {metrics.overtimePercentage.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Of total hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User size={16} className="text-success" />
                  Crew Utilization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-2xl font-bold">{Math.round(metrics.crewUtilization)}%</div>
                <p className="text-xs text-muted-foreground mt-1">Average utilization</p>
                <Progress value={metrics.crewUtilization} className="mt-2 h-2" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ChartLine size={16} className={metrics.sv >= 0 ? "text-success" : "text-destructive"} />
                  Schedule Variance (SV)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn("font-mono text-2xl font-bold", metrics.sv >= 0 ? "text-success" : "text-destructive")}>
                  {formatCurrency(metrics.sv)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Earned vs Planned</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Gauge size={16} className={metrics.spi >= 1 ? "text-success" : "text-destructive"} />
                  Schedule Performance Index
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn("font-mono text-2xl font-bold", metrics.spi >= 1 ? "text-success" : "text-destructive")}>
                  {metrics.spi.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{metrics.spi >= 1 ? 'On schedule' : 'Behind schedule'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target size={16} className="text-destructive" />
                  Critical Path Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-2xl font-bold text-destructive">{metrics.criticalPathTasksCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Require attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Truck size={16} className="text-accent" />
                  Procurement Lead Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-2xl font-bold">{Math.round(metrics.procurementLeadTimeDays)}</div>
                <p className="text-xs text-muted-foreground mt-1">Days average</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText size={16} className="text-warning" />
                  RFI Turnaround
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn("font-mono text-2xl font-bold", metrics.rfiTurnaroundDays < 5 ? "text-success" : "text-warning")}>
                  {metrics.rfiTurnaroundDays.toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Days average</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow & Billing</CardTitle>
                <CardDescription>Financial flow metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm font-medium">Total Billings</span>
                  <span className="font-mono font-bold">{formatCurrency(metrics.billingsTotal)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm font-medium">Earned Revenue</span>
                  <span className="font-mono font-bold">{formatCurrency(metrics.earnedRevenueTotal)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10">
                  <span className="text-sm font-medium">AR Aging {'>'} 30 Days</span>
                  <span className="font-mono font-bold text-destructive">{formatCurrency(metrics.arAgingOver30)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10">
                  <span className="text-sm font-medium">AR Aging {'>'} 60 Days</span>
                  <span className="font-mono font-bold text-destructive">{formatCurrency(metrics.arAgingOver60)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10">
                  <span className="text-sm font-medium">AR Aging {'>'} 90 Days</span>
                  <span className="font-mono font-bold text-destructive">{formatCurrency(metrics.arAgingOver90)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Forecast</CardTitle>
                <CardDescription>Projected cash flow</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-success/10">
                  <span className="text-sm font-medium">30-Day Forecast</span>
                  <span className="font-mono font-bold text-success">{formatCurrency(metrics.cashFlowForecast30Days)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-success/10">
                  <span className="text-sm font-medium">60-Day Forecast</span>
                  <span className="font-mono font-bold text-success">{formatCurrency(metrics.cashFlowForecast60Days)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-success/10">
                  <span className="text-sm font-medium">90-Day Forecast</span>
                  <span className="font-mono font-bold text-success">{formatCurrency(metrics.cashFlowForecast90Days)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Wrench size={16} className="text-warning" />
                  Rework Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-2xl font-bold text-warning">{Math.round(metrics.reworkHours)}</div>
                <p className="text-xs text-muted-foreground mt-1">Total rework time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield size={16} className="text-destructive" />
                  Safety Incidents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-2xl font-bold text-destructive">{metrics.safetyIncidents}</div>
                <p className="text-xs text-muted-foreground mt-1">Reported incidents</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ChartLineUp size={16} className="text-warning" />
                  EMR Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-2xl font-bold text-warning">{metrics.emrImpact.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Rate impact</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ListChecks size={16} className="text-accent" />
                  Punch List Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-2xl font-bold">{metrics.punchListVolume}</div>
                <p className="text-xs text-muted-foreground mt-1">Open items</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ClipboardText size={16} className="text-success" />
                  Submittal Log Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn("font-mono text-2xl font-bold", metrics.submittalLogHealth >= 80 ? "text-success" : "text-warning")}>
                  {Math.round(metrics.submittalLogHealth)}%
                </div>
                <Progress value={metrics.submittalLogHealth} className="mt-2 h-2" />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Operational Controls</CardTitle>
                <CardDescription>Process health indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Laptop size={20} className="text-accent" />
                    <span className="text-sm font-medium">Equipment Utilization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={metrics.equipmentUtilization} className="w-24 h-2" />
                    <span className="font-mono font-bold text-sm">{Math.round(metrics.equipmentUtilization)}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-warning" />
                    <span className="text-sm font-medium">Drawing Revision Impact</span>
                  </div>
                  <span className="font-mono font-bold">{metrics.drawingRevisionImpact}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Project Distribution</CardTitle>
                <CardDescription>Projects by status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={projectsByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {projectsByStatus.map((entry, index) => (
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
                <CardTitle>Health Distribution</CardTitle>
                <CardDescription>Projects by health status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={projectsByHealth}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {projectsByHealth.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Portfolio Performance Matrix</CardTitle>
              <CardDescription>Budget utilization vs schedule performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="schedule_health" 
                    name="Schedule Health" 
                    unit="%" 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    label={{ value: 'Schedule Health %', position: 'bottom' }}
                  />
                  <YAxis 
                    dataKey="margin_percent" 
                    name="Margin" 
                    unit="%" 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    label={{ value: 'Margin %', angle: -90, position: 'insideLeft' }}
                  />
                  <ZAxis dataKey="contract_value" range={[100, 1000]} name="Contract Value" />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-card p-3 border rounded-lg shadow-lg">
                            <p className="font-semibold">{data.project_name}</p>
                            <p className="text-sm text-muted-foreground">{data.project_number}</p>
                            <div className="mt-2 space-y-1">
                              <p className="text-sm">Schedule: {Math.round(data.schedule_health)}%</p>
                              <p className="text-sm">Margin: {data.margin_percent.toFixed(1)}%</p>
                              <p className="text-sm">Value: {formatCurrency(data.contract_value)}</p>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Scatter 
                    data={projectHealthData} 
                    fill="#6366f1"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => setHealthFilter('critical')}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Critical Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-3xl font-bold text-destructive">{metrics.criticalProjects}</div>
                <p className="text-xs text-muted-foreground mt-1">Immediate action required</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => setHealthFilter('warning')}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Warning Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-3xl font-bold text-warning">{metrics.warningProjects}</div>
                <p className="text-xs text-muted-foreground mt-1">Monitor closely</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => setHealthFilter('healthy')}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Healthy Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-3xl font-bold text-success">{metrics.healthyProjects}</div>
                <p className="text-xs text-muted-foreground mt-1">On track</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Key Metrics Summary</CardTitle>
                <CardDescription>Portfolio-wide operational indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Package size={20} className="text-accent" />
                    <span className="text-sm font-medium">Active Work Packages</span>
                  </div>
                  <span className="font-mono font-bold text-lg">{metrics.totalActivePackages}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-warning" />
                    <span className="text-sm font-medium">Pending Submittals</span>
                  </div>
                  <span className="font-mono font-bold text-lg">{metrics.totalPendingSubmittals}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <CurrencyDollar size={20} className="text-destructive" />
                    <span className="text-sm font-medium">Over-Budget Cost Codes</span>
                  </div>
                  <span className="font-mono font-bold text-lg text-destructive">{metrics.totalOverBudgetCodes}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <ListChecks size={20} className="text-success" />
                    <span className="text-sm font-medium">Active Tasks</span>
                  </div>
                  <span className="font-mono font-bold text-lg">{metrics.totalActiveTasks}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
                <CardDescription>Aggregated financial metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/30">
                  <div className="text-sm text-muted-foreground mb-1">Total Portfolio Value</div>
                  <div className="font-mono text-2xl font-bold">{formatCurrency(metrics.totalValue)}</div>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <div className="text-sm text-muted-foreground mb-1">Total Spent</div>
                  <div className="font-mono text-2xl font-bold">{formatCurrency(metrics.totalSpent)}</div>
                  <Progress value={(metrics.totalSpent / metrics.totalValue) * 100} className="mt-2 h-2" />
                </div>
                <div className={cn("p-4 rounded-lg", metrics.totalMargin >= 0 ? "bg-success/10" : "bg-destructive/10")}>
                  <div className="text-sm text-muted-foreground mb-1">Total Margin</div>
                  <div className={cn("font-mono text-2xl font-bold", 
                    metrics.totalMargin >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {formatCurrency(metrics.totalMargin)}
                  </div>
                  <div className="text-sm font-medium mt-1">
                    {metrics.marginPercent.toFixed(1)}% margin
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
