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
  TrendUp,
  ChartLine,
  ListChecks,
  Robot,
  Note,
  Hammer,
  Factory,
  HardHat,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { projectsDb } from '@/lib/db'
import { PMAPanel } from '@/components/pma/pma-panel'
import { PMANotificationBadge } from '@/components/pma/pma-notification-badge'
import { PageTransition } from '@/components/shared/page-transition'
import type { Project } from '@/lib/types'

export function ProjectLayout() {
  const { projectId } = useParams<{ projectId: string }>()
  const location = useLocation()
  const [project, setProject] = useState<Project | null>(null)
  const [pmaOpen, setPmaOpen] = useState(false)

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
            <Button variant="ghost" size="sm" className="gap-2 hover:bg-accent/10 transition-colors">
              <ArrowLeft size={18} />
              Back to Projects
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-3xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground font-mono text-sm">
              {project.number} • {project.client}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PMANotificationBadge projectId={projectId} onOpen={() => setPmaOpen(true)} />
          <Button variant="default" size="sm" className="gap-2 shadow-sm hover:shadow-md transition-all dark:welder-glow" onClick={() => setPmaOpen(true)}>
            <Robot size={18} weight="duotone" />
            PMA
          </Button>
          <Link to={`/projects/${projectId}/settings`}>
            <Button variant="outline" size="sm" className="gap-2 hover:border-accent/50 transition-colors">
              <Gear size={18} />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-9 gap-1 bg-secondary/50 p-1.5 rounded-lg">
          <Link to={`/projects/${projectId}`}>
            <TabsTrigger value="overview" className="w-full gap-1.5 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground transition-all">
              <ChartBar size={16} />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
          </Link>
          <Link to={`/projects/${projectId}/work-packages`}>
            <TabsTrigger value="work-packages" className="w-full gap-1.5">
              <Package size={16} />
              <span className="hidden sm:inline">Work Packages</span>
            </TabsTrigger>
          </Link>
          <Link to={`/projects/${projectId}/drawings`}>
            <TabsTrigger value="drawings" className="w-full gap-1.5">
              <Stack size={16} />
              <span className="hidden sm:inline">Detailing</span>
            </TabsTrigger>
          </Link>
          <Link to={`/projects/${projectId}/fab-tracking`}>
            <TabsTrigger value="fab-tracking" className="w-full gap-1.5">
              <Factory size={16} />
              <span className="hidden sm:inline">Fabrication</span>
            </TabsTrigger>
          </Link>
          <Link to={`/projects/${projectId}/deliveries`}>
            <TabsTrigger value="deliveries" className="w-full gap-1.5">
              <Truck size={16} />
              <span className="hidden sm:inline">Deliveries</span>
            </TabsTrigger>
          </Link>
          <Link to={`/projects/${projectId}/lookahead`}>
            <TabsTrigger value="lookahead" className="w-full gap-1.5">
              <HardHat size={16} />
              <span className="hidden sm:inline">Install/Erection</span>
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
        </TabsList>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <Link to={`/projects/${projectId}/documents`}>
            <Button variant={activeTab === 'documents' ? 'secondary' : 'outline'} size="sm" className="gap-2">
              <FileText size={16} />
              Documents
            </Button>
          </Link>
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
          <Link to={`/projects/${projectId}/production-notes`}>
            <Button variant={activeTab === 'production-notes' ? 'secondary' : 'outline'} size="sm" className="gap-2">
              <Note size={16} />
              Production Notes
            </Button>
          </Link>
        </div>

        <PageTransition>
          <Outlet />
        </PageTransition>
      </Tabs>

      <PMAPanel open={pmaOpen} onOpenChange={setPmaOpen} projectId={projectId} />
    </div>
  )
}
