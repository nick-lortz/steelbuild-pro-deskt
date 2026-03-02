import { Outlet, Link, useParams, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ChartBar,
  Calendar,
  CurrencyDollar,
  Question,
  FileText,
  Stack,
  Package,
  Truck,
  Users,
  Wrench,
  Receipt,
  Notebook,
  UsersFour,
  Gear,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { projectsDb } from '@/lib/db'
import type { Project } from '@/lib/types'

export function ProjectLayout() {
  const { projectId } = useParams<{ projectId: string }>()
  const location = useLocation()
  const [project, setProject] = useState<Project | null>(null)

  useEffect(() => {
    const loadProject = async () => {
      if (projectId) {
        const p = await projectsDb.getById(projectId)
        if (p) setProject(p)
      }
    }
    loadProject()
  }, [projectId])

  const getActivePath = () => {
    const parts = location.pathname.split('/')
    if (parts.length <= 3) return 'overview'
    return parts[3]
  }

  const activeTab = getActivePath()

  if (!project) {
    return <div>Loading project...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/projects">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft size={18} />
              Back to Projects
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground">
              {project.number} • {project.client}
            </p>
          </div>
        </div>
        <Link to={`/projects/${projectId}/settings`}>
          <Button variant="outline" size="sm" className="gap-2">
            <Gear size={18} />
            Settings
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-1">
          <Link to={`/projects/${projectId}`}>
            <TabsTrigger value="overview" className="w-full gap-1.5">
              <ChartBar size={16} />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
          </Link>
          <Link to={`/projects/${projectId}/schedule`}>
            <TabsTrigger value="schedule" className="w-full gap-1.5">
              <Calendar size={16} />
              <span className="hidden sm:inline">Schedule</span>
            </TabsTrigger>
          </Link>
          <Link to={`/projects/${projectId}/financials`}>
            <TabsTrigger value="financials" className="w-full gap-1.5">
              <CurrencyDollar size={16} />
              <span className="hidden sm:inline">Financials</span>
            </TabsTrigger>
          </Link>
          <Link to={`/projects/${projectId}/rfis`}>
            <TabsTrigger value="rfis" className="w-full gap-1.5">
              <Question size={16} />
              <span className="hidden sm:inline">RFIs</span>
            </TabsTrigger>
          </Link>
          <Link to={`/projects/${projectId}/documents`}>
            <TabsTrigger value="documents" className="w-full gap-1.5">
              <FileText size={16} />
              <span className="hidden sm:inline">Docs</span>
            </TabsTrigger>
          </Link>
          <Link to={`/projects/${projectId}/drawings`}>
            <TabsTrigger value="drawings" className="w-full gap-1.5">
              <Stack size={16} />
              <span className="hidden sm:inline">Drawings</span>
            </TabsTrigger>
          </Link>
          <Link to={`/projects/${projectId}/work-packages`}>
            <TabsTrigger value="work-packages" className="w-full gap-1.5">
              <Package size={16} />
              <span className="hidden sm:inline">Packages</span>
            </TabsTrigger>
          </Link>
          <Link to={`/projects/${projectId}/deliveries`}>
            <TabsTrigger value="deliveries" className="w-full gap-1.5">
              <Truck size={16} />
              <span className="hidden sm:inline">Deliveries</span>
            </TabsTrigger>
          </Link>
        </TabsList>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <Link to={`/projects/${projectId}/labor`}>
            <Button variant={activeTab === 'labor' ? 'secondary' : 'outline'} size="sm" className="gap-2">
              <Users size={16} />
              Labor
            </Button>
          </Link>
          <Link to={`/projects/${projectId}/equipment`}>
            <Button variant={activeTab === 'equipment' ? 'secondary' : 'outline'} size="sm" className="gap-2">
              <Wrench size={16} />
              Equipment
            </Button>
          </Link>
          <Link to={`/projects/${projectId}/change-orders`}>
            <Button variant={activeTab === 'change-orders' ? 'secondary' : 'outline'} size="sm" className="gap-2">
              <Receipt size={16} />
              Change Orders
            </Button>
          </Link>
          <Link to={`/projects/${projectId}/contracts`}>
            <Button variant={activeTab === 'contracts' ? 'secondary' : 'outline'} size="sm" className="gap-2">
              <FileText size={16} />
              Contracts
            </Button>
          </Link>
          <Link to={`/projects/${projectId}/cost-codes`}>
            <Button variant={activeTab === 'cost-codes' ? 'secondary' : 'outline'} size="sm" className="gap-2">
              <CurrencyDollar size={16} />
              Cost Codes
            </Button>
          </Link>
          <Link to={`/projects/${projectId}/daily-logs`}>
            <Button variant={activeTab === 'daily-logs' ? 'secondary' : 'outline'} size="sm" className="gap-2">
              <Notebook size={16} />
              Daily Logs
            </Button>
          </Link>
          <Link to={`/projects/${projectId}/meetings`}>
            <Button variant={activeTab === 'meetings' ? 'secondary' : 'outline'} size="sm" className="gap-2">
              <UsersFour size={16} />
              Meetings
            </Button>
          </Link>
        </div>

        <Outlet />
      </Tabs>
    </div>
  )
}
