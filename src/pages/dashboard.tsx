import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Buildings, CurrencyDollar, Wrench, ListChecks, Plus, Warning, FileText, Calendar, TrendUp, CheckCircle } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { projectsDb, equipmentDb, checklistsDb, rfisDb } from '@/lib/db'
import { useKV } from '@github/spark/hooks'
import type { Project, Equipment, Checklist, RFI, Task, Alert as AlertType, Submittal } from '@/lib/types'

export function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [rfis, setRfis] = useState<RFI[]>([])
  const [allTasks] = useKV<Task[]>('tasks', [])
  const [alerts] = useKV<AlertType[]>('alerts', [])
  const [submittals] = useKV<Submittal[]>('submittals', [])

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
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your steel fabrication projects and operations
        </p>
      </div>

      {criticalAlerts > 0 && (
        <Card className="border-destructive bg-destructive/10">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Warning className="w-5 h-5 text-destructive" weight="fill" />
              <CardTitle className="text-destructive">Critical Alerts</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              You have {criticalAlerts} critical alert{criticalAlerts !== 1 ? 's' : ''} requiring immediate attention.
            </p>
            <Link to="/alerts">
              <Button variant="destructive" size="sm" className="mt-3">
                View Alerts
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Buildings size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects.length}</div>
            <p className="text-xs text-muted-foreground">
              of {projects.length} total projects
            </p>
            <Progress value={(activeProjects.length / Math.max(projects.length, 1)) * 100} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contract Value</CardTitle>
            <CurrencyDollar size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(totalContractValue / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
            <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
              <TrendUp className="w-3 h-3" />
              <span>Portfolio health</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open RFIs</CardTitle>
            <FileText size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openRFIs}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting response
            </p>
            {openRFIs > 5 && (
              <Badge variant="destructive" className="mt-2">Action needed</Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <Calendar size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueTasks}</div>
            <p className="text-xs text-muted-foreground">
              Behind schedule
            </p>
            {overdueTasks === 0 && (
              <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                <CheckCircle className="w-3 h-3" weight="fill" />
                <span>On track</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipment Fleet</CardTitle>
            <Wrench size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipment.length}</div>
            <p className="text-xs text-muted-foreground">
              Units in fleet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Checklists</CardTitle>
            <ListChecks size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingChecklists.length}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Submittals</CardTitle>
            <FileText size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSubmittals}</div>
            <p className="text-xs text-muted-foreground">
              In review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <Warning size={20} className="text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Immediate action
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and operations</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Link to="/projects">
              <Button className="w-full justify-start gap-2">
                <Plus size={18} />
                New Project
              </Button>
            </Link>
            <Link to="/cost-codes">
              <Button variant="outline" className="w-full justify-start gap-2">
                <CurrencyDollar size={18} />
                Cost Codes
              </Button>
            </Link>
            <Link to="/equipment">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Wrench size={18} />
                Equipment
              </Button>
            </Link>
            <Link to="/audit">
              <Button variant="outline" className="w-full justify-start gap-2">
                <CheckCircle size={18} />
                Data Audit
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Overall status indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Projects</span>
              <Badge variant={activeProjects.length > 0 ? 'default' : 'secondary'}>
                {activeProjects.length > 0 ? 'Active' : 'None'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">RFIs</span>
              <Badge variant={openRFIs === 0 ? 'default' : openRFIs < 5 ? 'secondary' : 'destructive'}>
                {openRFIs === 0 ? 'All clear' : `${openRFIs} open`}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Schedule</span>
              <Badge variant={overdueTasks === 0 ? 'default' : 'destructive'}>
                {overdueTasks === 0 ? 'On track' : `${overdueTasks} overdue`}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Alerts</span>
              <Badge variant={criticalAlerts === 0 ? 'default' : 'destructive'}>
                {criticalAlerts === 0 ? 'None' : `${criticalAlerts} critical`}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
          <CardDescription>Your most recently updated projects</CardDescription>
        </CardHeader>
        <CardContent>
          {activeProjects.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Buildings size={48} className="mx-auto mb-4 opacity-50" />
              <p>No active projects yet</p>
              <Link to="/projects">
                <Button variant="outline" size="sm" className="mt-4">
                  Create your first project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {activeProjects.slice(0, 5).map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{project.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {project.number} • {project.client}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${(project.contractValue / 1000).toFixed(0)}K
                      </p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {project.status}
                      </p>
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
