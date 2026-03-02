import { ProjectsList } from '@/components/projects/projects-list'
import type { Project } from '@/lib/types'

export function ProjectsListPage() {
  const handleSelectProject = (project: Project) => {
    window.location.href = `/projects/${project.id}`
  }

  return (
    <div className="space-y-6">
      <ProjectsList onSelectProject={handleSelectProject} />
    </div>
  )
}
