import { useState, useEffect } from 'react'
import { Plus, Buildings } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { projectsDb } from '@/lib/db'
import type { Project } from '@/lib/types'
import { ProjectFormDialog } from './project-form-dialog'

interface ProjectsListProps {
  onSelectProject: (project: Project) => void
}

export function ProjectsList({ onSelectProject }: ProjectsListProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const loadProjects = async () => {
    try {
      const data = await projectsDb.getAll()
      setProjects(data)
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">Projects</h2>
          <p className="text-muted-foreground mt-2 text-base">
            Manage your steel fabrication and erection projects
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="lg" className="gap-2 shadow-md hover:shadow-lg transition-shadow">
          <Plus size={20} weight="bold" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <Buildings size={48} weight="duotone" className="text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">No projects yet</h3>
            <p className="text-muted-foreground text-center mb-8 max-w-md leading-relaxed">
              Get started by creating your first steel fabrication or erection project
            </p>
            <Button onClick={() => setDialogOpen(true)} size="lg" className="gap-2 shadow-md hover:shadow-lg transition-shadow">
              <Plus size={20} weight="bold" />
              Create First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 group overflow-hidden border-border/50"
              onClick={() => onSelectProject(project)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg mb-1.5 group-hover:text-primary transition-colors truncate">{project.name}</CardTitle>
                    <CardDescription className="font-mono text-xs">
                      {project.number}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(project.status)} variant="secondary">
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground font-medium min-w-[60px]">Client:</span>
                  <span className="font-medium truncate">{project.client}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground font-medium min-w-[60px]">Location:</span>
                  <span className="truncate">{project.location}</span>
                </div>
                <div className="pt-2 border-t border-border/50">
                  <span className="text-lg font-bold text-primary">
                    ${project.contractValue.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ProjectFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          setDialogOpen(false)
          loadProjects()
        }}
      />
    </div>
  )
}
