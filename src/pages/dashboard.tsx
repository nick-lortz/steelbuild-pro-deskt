import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Buildings, CurrencyDollar, Wrench, ListChecks, Plus, Warning, FileText, Calendar, TrendUp, CheckCircle } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { projectsDb, equipmentDb, checklistsDb, rfisDb } from '@/lib/db'
import { useKV } from '@github/spark/hooks'
import { useDatabase } from '@/hooks/use-database'
import type { Project, Equipment, Checklist, RFI, Task, Alert as AlertType, Submittal } from '@/lib/types'

export function DashboardPage() {
  const { isDesktop } = useDatabase()
  const [projects, setProjects] = useState<Project[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [rfis, setRfis] = useState<RFI[]>([])
  const [allTasks] = useKV<Task[]>('tasks', [])
  const [alerts] = useKV<AlertType[]>('alerts', [])
  const [submittals] = useKV<Submittal[]>('submittals', [])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const loadData = async () => {
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

  const activeProjects = projects.filter((p) => p.status === 'active')
  const totalContractValue = projects.reduce((sum, p) => sum + p.contractValue, 0)
  const pendingChecklists = checklists.filter((c) => c.status !== 'completed')
  
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.dismissed).length
  const openRFIs = rfis.filter(r => r.status === 'open').length
  const overdueTasks = allTasks.filter(t => {
    if (t.status === 'completed') return false
    if (!t.endDate) return false
    return new Date(t.endDate) < new Date()
  }).length
  const pendingSubmittals = submittals.filter(s => 
    s.status === 'submitted' || s.status === 'IFA' || s.status === 'BFA'
  ).length

  return (
    <div className="space-y-8 animate-in">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">Dashboard</h2>
          <p className="text-muted-foreground mt-2 text-base">
            Overview of your steel fabrication projects and operations
          </p>
        </div>
      </div>

      {criticalAlerts > 0 && (
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
            <p className="text-sm text-foreground/80">
              You have <span className="font-semibold text-destructive">{criticalAlerts}</span> critical alert{criticalAlerts !== 1 ? 's' : ''} requiring immediate attention.
            </p>
            <Link to="/alerts">
              <Button variant="destructive" size="sm" className="mt-4 shadow-md hover:shadow-lg transition-shadow">
                View Alerts
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Active Projects</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Buildings size={20} className="text-primary" weight="duotone" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{activeProjects.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              of {projects.length} total projects
            </p>
            <Progress value={(activeProjects.length / Math.max(projects.length, 1)) * 100} className="mt-3 h-1.5" />
          </CardContent>
        </Card>

        <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Contract Value</CardTitle>
            <div className="p-2 bg-success/10 rounded-lg">
              <CurrencyDollar size={20} className="text-success" weight="duotone" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">
              ${(totalContractValue / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all projects
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-success">
              <TrendUp className="w-3.5 h-3.5" weight="bold" />
              <span>Portfolio health</span>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Open RFIs</CardTitle>
            <div className="p-2 bg-warning/10 rounded-lg">
              <FileText size={20} className="text-warning" weight="duotone" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{openRFIs}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting response
            </p>
            {openRFIs > 5 && (
              <Badge variant="destructive" className="mt-3 shadow-sm">Action needed</Badge>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Overdue Tasks</CardTitle>
            <div className="p-2 bg-destructive/10 rounded-lg">
              <Calendar size={20} className="text-destructive" weight="duotone" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-destructive">{overdueTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Behind schedule
            </p>
            {overdueTasks === 0 && (
              <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-success">
                <CheckCircle className="w-3.5 h-3.5" weight="fill" />
                <span>On track</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Equipment Fleet</CardTitle>
            <div className="p-2 bg-accent/10 rounded-lg">
              <Wrench size={20} className="text-accent" weight="duotone" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{equipment.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Units in fleet
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Pending Checklists</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <ListChecks size={20} className="text-primary" weight="duotone" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{pendingChecklists.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Pending Submittals</CardTitle>
            <div className="p-2 bg-warning/10 rounded-lg">
              <FileText size={20} className="text-warning" weight="duotone" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{pendingSubmittals}</div>
            <p className="text-xs text-muted-foreground mt-1">
              In review
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border-border/50 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Critical Alerts</CardTitle>
            <div className="p-2 bg-destructive/10 rounded-lg">
              <Warning size={20} className="text-destructive" weight="duotone" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-destructive">{criticalAlerts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Immediate action
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="overflow-hidden border-border/50 hover:border-border transition-colors">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Quick Actions</CardTitle>
            <CardDescription>Common tasks and operations</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Link to="/projects">
              <Button className="w-full justify-start gap-2 shadow-sm hover:shadow-md transition-shadow">
                <Plus size={18} weight="bold" />
                New Project
              </Button>
            </Link>
            <Link to="/cost-codes">
              <Button variant="outline" className="w-full justify-start gap-2 hover:bg-secondary/50 transition-colors">
                <CurrencyDollar size={18} weight="duotone" />
                Cost Codes
              </Button>
            </Link>
            <Link to="/equipment">
              <Button variant="outline" className="w-full justify-start gap-2 hover:bg-secondary/50 transition-colors">
                <Wrench size={18} weight="duotone" />
                Equipment
              </Button>
            </Link>
            <Link to="/audit">
              <Button variant="outline" className="w-full justify-start gap-2 hover:bg-secondary/50 transition-colors">
                <CheckCircle size={18} weight="duotone" />
                Data Audit
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border/50 hover:border-border transition-colors">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">System Health</CardTitle>
            <CardDescription>Overall status indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-sm font-medium">Projects</span>
              <Badge variant={activeProjects.length > 0 ? 'default' : 'secondary'} className="shadow-sm">
                {activeProjects.length > 0 ? 'Active' : 'None'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-sm font-medium">RFIs</span>
              <Badge variant={openRFIs === 0 ? 'default' : openRFIs < 5 ? 'secondary' : 'destructive'} className="shadow-sm">
                {openRFIs === 0 ? 'All clear' : `${openRFIs} open`}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-sm font-medium">Schedule</span>
              <Badge variant={overdueTasks === 0 ? 'default' : 'destructive'} className="shadow-sm">
                {overdueTasks === 0 ? 'On track' : `${overdueTasks} overdue`}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-sm font-medium">Alerts</span>
              <Badge variant={criticalAlerts === 0 ? 'default' : 'destructive'} className="shadow-sm">
                {criticalAlerts === 0 ? 'None' : `${criticalAlerts} critical`}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-border/50 hover:border-border transition-colors">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Recent Projects</CardTitle>
          <CardDescription>Your most recently updated projects</CardDescription>
        </CardHeader>
        <CardContent>
          {activeProjects.length === 0 ? (
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
                <Buildings size={32} className="text-muted-foreground" weight="duotone" />
              </div>
              <p className="text-muted-foreground mb-4">No active projects yet</p>
              <Link to="/projects">
                <Button variant="outline" size="sm" className="shadow-sm hover:shadow-md transition-shadow">
                  Create your first project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeProjects.slice(0, 5).map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="block rounded-lg border border-border/50 p-4 transition-all hover:border-border hover:shadow-md hover:bg-muted/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base mb-1">{project.name}</h3>
                      <p className="text-sm text-muted-foreground font-mono">
                        {project.number} • {project.client}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold text-lg">
                        ${(project.contractValue / 1000).toFixed(0)}K
                      </p>
                      <Badge variant="secondary" className="capitalize text-xs mt-1">
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
