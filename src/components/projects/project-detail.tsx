import { useState, useEffect } from 'react'
import { ArrowLeft, FileText, Stack, Crane, ListChecks, ArrowsClockwise } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { projectsDb, contractsDb, changeOrdersDb, drawingSetsDb, checklistsDb } from '@/lib/db'
import type { Project } from '@/lib/types'

interface ProjectDetailProps {
  projectId: string
  onBack: () => void
}

export function ProjectDetail({ projectId, onBack }: ProjectDetailProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProject = async () => {
      try {
        const data = await projectsDb.getById(projectId)
        setProject(data || null)
      } catch (error) {
        console.error('Failed to load project:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProject()
  }, [projectId])

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading project...</div>
  }

  if (!project) {
    return <div className="text-center py-12 text-muted-foreground">Project not found</div>
  }

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'planning':
        return 'bg-blue-100 text-blue-800'
      case 'onhold':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-4 gap-2"
        >
          <ArrowLeft size={18} />
          Back to Projects
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{project.name}</h2>
            <p className="text-muted-foreground font-mono text-sm">{project.number}</p>
          </div>
          <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Client</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{project.client}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Location</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{project.location}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Contract Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${project.contractValue.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contracts">
            <FileText size={16} className="mr-2" />
            Contracts
          </TabsTrigger>
          <TabsTrigger value="change-orders">
            <ArrowsClockwise size={16} className="mr-2" />
            Change Orders
          </TabsTrigger>
          <TabsTrigger value="drawings">
            <Stack size={16} className="mr-2" />
            Drawings
          </TabsTrigger>
          <TabsTrigger value="checklists">
            <ListChecks size={16} className="mr-2" />
            Checklists
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="mt-1">{project.description || 'No description provided'}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                  <p className="mt-1">{new Date(project.startDate).toLocaleDateString()}</p>
                </div>
                {project.endDate && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">End Date</p>
                    <p className="mt-1">{new Date(project.endDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts">
          <Card>
            <CardContent className="py-16 text-center">
              <FileText size={64} weight="duotone" className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Contracts module coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="change-orders">
          <Card>
            <CardContent className="py-16 text-center">
              <ArrowsClockwise size={64} weight="duotone" className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Change Orders module coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drawings">
          <Card>
            <CardContent className="py-16 text-center">
              <Stack size={64} weight="duotone" className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Drawings module coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklists">
          <Card>
            <CardContent className="py-16 text-center">
              <ListChecks size={64} weight="duotone" className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Checklists module coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
