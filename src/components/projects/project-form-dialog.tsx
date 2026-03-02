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
import type { Project } from '@/lib/types'

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
    },
  })

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      if (project) {
        await projectsDb.update(project.id, data)
        toast.success('Project updated successfully')
      } else {
        await projectsDb.create(data)
        toast.success('Project created successfully')
      }
      onSuccess()
    } catch (error) {
      toast.error('Failed to save project')
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
