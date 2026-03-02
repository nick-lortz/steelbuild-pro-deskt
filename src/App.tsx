import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Buildings, CurrencyDollar, FileText, Stack, Crane, ListChecks, Robot, Plus } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProjectsList } from '@/components/projects/projects-list'
import { ProjectDetail } from '@/components/projects/project-detail'
import { CostCodesPage } from '@/components/cost-codes/cost-codes-page'
import { EquipmentPage } from '@/components/equipment/equipment-page'
import { ChecklistsPage } from '@/components/checklists/checklists-page'
import { PMAPanel } from '@/components/pma/pma-panel'
import type { Project } from '@/lib/types'

function App() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [pmaOpen, setPmaOpen] = useState(false)

  const handleProjectSelect = (project: Project) => {
    setSelectedProjectId(project.id)
    setActiveTab('project')
  }

  const handleBackToProjects = () => {
    setSelectedProjectId(null)
    setActiveTab('projects')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Buildings size={32} weight="duotone" className="text-primary" />
            <div>
              <h1 className="text-xl font-bold leading-none">SteelBuild Pro</h1>
              <p className="text-xs text-muted-foreground">Construction Management</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPmaOpen(true)}
              className="gap-2"
            >
              <Robot size={18} />
              PMA
            </Button>
          </div>
        </div>
      </header>

      <div className="container px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-3xl grid-cols-5">
            <TabsTrigger value="dashboard" className="gap-2">
              <Buildings size={18} />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="projects" className="gap-2">
              <Buildings size={18} />
              Projects
            </TabsTrigger>
            <TabsTrigger value="cost-codes" className="gap-2">
              <CurrencyDollar size={18} />
              Cost Codes
            </TabsTrigger>
            <TabsTrigger value="equipment" className="gap-2">
              <Crane size={18} />
              Equipment
            </TabsTrigger>
            <TabsTrigger value="checklists" className="gap-2">
              <ListChecks size={18} />
              Checklists
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
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
                  <div className="text-2xl font-bold">—</div>
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
                  <div className="text-2xl font-bold">—</div>
                  <p className="text-xs text-muted-foreground">
                    Across all projects
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Equipment</CardTitle>
                  <Crane size={20} className="text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">—</div>
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
                  <div className="text-2xl font-bold">—</div>
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
                <Button onClick={() => setActiveTab('projects')} className="gap-2">
                  <Plus size={18} />
                  New Project
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('cost-codes')} className="gap-2">
                  <CurrencyDollar size={18} />
                  Manage Cost Codes
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('equipment')} className="gap-2">
                  <Crane size={18} />
                  View Equipment
                </Button>
                <Button variant="outline" onClick={() => setPmaOpen(true)} className="gap-2">
                  <Robot size={18} />
                  Ask PMA
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            {selectedProjectId ? (
              <ProjectDetail projectId={selectedProjectId} onBack={handleBackToProjects} />
            ) : (
              <ProjectsList onSelectProject={handleProjectSelect} />
            )}
          </TabsContent>

          <TabsContent value="project" className="space-y-6">
            {selectedProjectId && (
              <ProjectDetail projectId={selectedProjectId} onBack={handleBackToProjects} />
            )}
          </TabsContent>

          <TabsContent value="cost-codes">
            <CostCodesPage />
          </TabsContent>

          <TabsContent value="equipment">
            <EquipmentPage />
          </TabsContent>

          <TabsContent value="checklists">
            <ChecklistsPage />
          </TabsContent>
        </Tabs>
      </div>

      <PMAPanel open={pmaOpen} onOpenChange={setPmaOpen} />
    </div>
  )
}

export default App
