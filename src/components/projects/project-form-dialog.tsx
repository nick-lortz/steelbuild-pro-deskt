import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { projectsDb } from '@/lib/db'
import { businessRules, BusinessRuleError } from '@/lib/business-rules'
import type { Project } from '@/lib/types'
import { InlineGradientSuggestions } from '@/components/shared/auto-gradient-suggestions'
import { useProjectGradient } from '@/hooks/use-gradient'

interface ProjectFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  project?: Project
}

export function ProjectFormDialog({
  open,
  onOpenChange,
  onSuccess,
  project,
}: ProjectFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [selectedGradientId, setSelectedGradientId] = useState<string | undefined>()
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: project || {
      name: '',
      number: '',
      client: '',
      location: '',
      status: 'planning' as const,
      contractValue: 0,
      startDate: new Date().toISOString().split('T')[0],
      description: '',
      type: '',
    },
  })

  const watchedName = watch('name')
  const watchedClient = watch('client')
  const watchedType = watch('type')

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      await businessRules.uniqueness.validateProjectNumber(
        data.number,
        project?.id
      )

      let projectId: string
      if (project) {
        await projectsDb.update(project.id, data)
        projectId = project.id
        toast.success('Project updated successfully')
      } else {
        const newProject = await projectsDb.create(data)
        projectId = newProject.id
        
        if (selectedGradientId) {
          const { setProjectGradient } = useProjectGradient(projectId)
          setProjectGradient(selectedGradientId)
        }
        
        toast.success('Project created successfully')
      }
      onSuccess()
    } catch (error) {
      if (error instanceof BusinessRuleError) {
        toast.error(error.message)
      } else {
        toast.error('Failed to save project')
      }
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? 'Edit' : 'Create'} Project</DialogTitle>
          <DialogDescription>
            Enter the details for your steel fabrication or erection project
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input id="name" {...register('name', { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="number">Project Number *</Label>
              <Input id="number" {...register('number', { required: true })} className="font-mono" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client">Client *</Label>
              <Input id="client" {...register('client', { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input id="location" {...register('location', { required: true })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Project Type</Label>
            <Select
              defaultValue={watch('type')}
              onValueChange={(value) => setValue('type', value)}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select project type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Structural Steel">Structural Steel</SelectItem>
                <SelectItem value="Steel Fabrication">Steel Fabrication</SelectItem>
                <SelectItem value="Steel Erection">Steel Erection</SelectItem>
                <SelectItem value="Commercial">Commercial</SelectItem>
                <SelectItem value="Industrial">Industrial</SelectItem>
                <SelectItem value="Bridge">Bridge</SelectItem>
                <SelectItem value="High-Rise">High-Rise</SelectItem>
                <SelectItem value="Residential">Residential</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!project && (watchedName || watchedClient || watchedType) && (
            <InlineGradientSuggestions
              projectType={watchedType}
              projectName={watchedName}
              client={watchedClient}
              onSelect={(presetId) => setSelectedGradientId(presetId)}
            />
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                defaultValue={watch('status')}
                onValueChange={(value) => setValue('status', value)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="onhold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractValue">Contract Value</Label>
              <Input
                id="contractValue"
                type="number"
                step="0.01"
                {...register('contractValue', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" {...register('startDate')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : project ? 'Update' : 'Create'} Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
