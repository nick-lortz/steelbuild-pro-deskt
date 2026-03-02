import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Buildings, CurrencyDollar, Wrench, ListChecks, Plus } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { projectsDb, equipmentDb, checklistsDb } from '@/lib/db'
import type { Project, Equipment, Checklist } from '@/lib/types'

export function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [checklists, setChecklists] = useState<Checklist[]>([])

  useEffect(() => {
    const loadData = async () => {
      const [p, e, c] = await Promise.all([
        projectsDb.getAll(),
        equipmentDb.getAll(),
        checklistsDb.getAll(),
      ])
      setProjects(p)
      setEquipment(e)
      setChecklists(c)
    }
    loadData()
  }, [])

  const activeProjects = projects.filter((p) => p.status === 'active')
  const totalContractValue = projects.reduce((sum, p) => sum + p.contractValue, 0)
  const pendingChecklists = checklists.filter((c) => c.status !== 'completed')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your steel fabrication projects and operations
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Buildings size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contract Value</CardTitle>
            <CurrencyDollar size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(totalContractValue / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipment</CardTitle>
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and operations</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link to="/projects">
            <Button className="gap-2">
              <Plus size={18} />
              New Project
            </Button>
          </Link>
          <Link to="/cost-codes">
            <Button variant="outline" className="gap-2">
              <CurrencyDollar size={18} />
              Manage Cost Codes
            </Button>
          </Link>
          <Link to="/equipment">
            <Button variant="outline" className="gap-2">
              <Wrench size={18} />
              View Equipment
            </Button>
          </Link>
        </CardContent>
      </Card>

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
