import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  Gear, 
  FloppyDisk, 
  ArrowLeft,
  Calendar,
  CurrencyDollar,
  MapPin,
  User,
  WarningCircle
} from '@phosphor-icons/react'
import { projectsDb } from '@/lib/db'
import type { Project } from '@/lib/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export function ProjectSettingsPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    number: '',
    client: '',
    location: '',
    status: 'planning' as Project['status'],
    startDate: '',
    endDate: '',
    contractValue: 0,
    description: '',
  })

  useEffect(() => {
    if (!projectId) return

    const loadProject = async () => {
      setLoading(true)
      try {
        const proj = await projectsDb.getById(projectId)
        if (proj) {
          setProject(proj)
          setFormData({
            name: proj.name,
            number: proj.number,
            client: proj.client,
            location: proj.location,
            status: proj.status,
            startDate: proj.startDate,
            endDate: proj.endDate || '',
            contractValue: proj.contractValue,
            description: proj.description || '',
          })
        }
      } catch (error) {
        console.error('Failed to load project:', error)
        toast.error('Failed to load project settings')
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [projectId])

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!projectId || !project) return

    setSaving(true)
    try {
      const updated = await projectsDb.update(projectId, {
        name: formData.name,
        number: formData.number,
        client: formData.client,
        location: formData.location,
        status: formData.status,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        contractValue: formData.contractValue,
        description: formData.description || undefined,
      })
      
      setProject(updated)
      setHasChanges(false)
      toast.success('Project settings saved successfully')
    } catch (error) {
      console.error('Failed to save project:', error)
      toast.error('Failed to save project settings')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!projectId) return

    try {
      await projectsDb.delete(projectId)
      toast.success('Project deleted successfully')
      navigate('/projects')
    } catch (error) {
      console.error('Failed to delete project:', error)
      toast.error('Failed to delete project')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Gear size={48} className="mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading project settings...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <WarningCircle size={48} className="mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Project not found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The project you're looking for doesn't exist
            </p>
            <Button onClick={() => navigate('/projects')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusColor = (status: Project['status']) => {
    const colors = {
      planning: 'bg-blue-500/10 text-blue-500',
      active: 'bg-green-500/10 text-green-500',
      onhold: 'bg-yellow-500/10 text-yellow-500',
      completed: 'bg-gray-500/10 text-gray-500',
    }
    return colors[status]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/projects/${projectId}`)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Gear size={32} weight="duotone" className="text-primary" />
              Project Settings
            </h2>
            <p className="text-muted-foreground">
              Configure project details and status
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Badge variant="outline" className="px-3 py-1">
              Unsaved Changes
            </Badge>
          )}
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || saving}
          >
            <FloppyDisk className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Essential project details and identification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">
                  Project Name *
                </Label>
                <Input
                  id="project-name"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="Steel Warehouse Expansion"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-number">
                  Project Number *
                </Label>
                <Input
                  id="project-number"
                  value={formData.number}
                  onChange={(e) => handleFieldChange('number', e.target.value)}
                  placeholder="PRJ-2024-001"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client" className="flex items-center gap-2">
                  <User size={16} />
                  Client *
                </Label>
                <Input
                  id="client"
                  value={formData.client}
                  onChange={(e) => handleFieldChange('client', e.target.value)}
                  placeholder="Acme Steel Corp"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin size={16} />
                  Location
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleFieldChange('location', e.target.value)}
                  placeholder="Chicago, IL"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Project description and scope details..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Status & Timeline</CardTitle>
            <CardDescription>
              Current project status and key dates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Project Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleFieldChange('status', value)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      Planning
                    </div>
                  </SelectItem>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      Active
                    </div>
                  </SelectItem>
                  <SelectItem value="onhold">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      On Hold
                    </div>
                  </SelectItem>
                  <SelectItem value="completed">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-500" />
                      Completed
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Current: <span className={`px-2 py-0.5 rounded-full ${getStatusColor(formData.status)}`}>
                  {formData.status.charAt(0).toUpperCase() + formData.status.slice(1).replace('onhold', 'On Hold')}
                </span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="flex items-center gap-2">
                  <Calendar size={16} />
                  Start Date *
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleFieldChange('startDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date" className="flex items-center gap-2">
                  <Calendar size={16} />
                  End Date
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleFieldChange('endDate', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Information</CardTitle>
            <CardDescription>
              Contract value and budget details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contract-value" className="flex items-center gap-2">
                <CurrencyDollar size={16} />
                Contract Value
              </Label>
              <Input
                id="contract-value"
                type="number"
                value={formData.contractValue}
                onChange={(e) => handleFieldChange('contractValue', parseFloat(e.target.value) || 0)}
                placeholder="0"
                min="0"
                step="0.01"
              />
              <p className="text-xs text-muted-foreground">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(formData.contractValue)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions that permanently affect this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delete Project</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this project and all associated data
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    Delete Project
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the project
                      "{project.name}" and remove all associated data including tasks, RFIs,
                      drawings, and financial records.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Project
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
