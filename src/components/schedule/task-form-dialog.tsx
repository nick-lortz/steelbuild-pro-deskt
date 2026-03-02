import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import type { Task } from '@/lib/types'

interface TaskFormDialogProps {
  task?: Task
  onSubmit: (data: Omit<Task, 'id' | 'projectId' | 'createdAt'>) => void
  onCancel: () => void
  existingTasks: Task[]
}

export function TaskFormDialog({ task, onSubmit, onCancel, existingTasks }: TaskFormDialogProps) {
  const [formData, setFormData] = useState({
    name: task?.name || '',
    description: task?.description || '',
    status: task?.status || 'not-started' as Task['status'],
    priority: task?.priority || 'medium' as Task['priority'],
    startDate: task?.startDate || '',
    endDate: task?.endDate || '',
    assignedTo: task?.assignedTo || '',
    percentComplete: task?.percentComplete || 0,
    dependencies: task?.dependencies || [] as string[],
    isCriticalPath: task?.isCriticalPath || false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.startDate || !formData.endDate) {
      return
    }

    onSubmit(formData)
  }

  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: typeof formData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="task-name">Task Name *</Label>
        <Input
          id="task-name"
          value={formData.name}
          onChange={e => updateField('name', e.target.value)}
          placeholder="Enter task name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-description">Description</Label>
        <Textarea
          id="task-description"
          value={formData.description}
          onChange={e => updateField('description', e.target.value)}
          placeholder="Task details..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="task-status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => updateField('status', value as Task['status'])}
          >
            <SelectTrigger id="task-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not-started">Not Started</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="on-hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-priority">Priority</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => updateField('priority', value as Task['priority'])}
          >
            <SelectTrigger id="task-priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="task-start">Start Date *</Label>
          <Input
            id="task-start"
            type="date"
            value={formData.startDate}
            onChange={e => updateField('startDate', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-end">End Date *</Label>
          <Input
            id="task-end"
            type="date"
            value={formData.endDate}
            onChange={e => updateField('endDate', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-assigned">Assigned To</Label>
        <Input
          id="task-assigned"
          value={formData.assignedTo}
          onChange={e => updateField('assignedTo', e.target.value)}
          placeholder="Team member name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-progress">
          Progress: {formData.percentComplete}%
        </Label>
        <Slider
          id="task-progress"
          value={[formData.percentComplete]}
          onValueChange={([value]) => updateField('percentComplete', value)}
          max={100}
          step={5}
          className="mt-2"
        />
      </div>

      {existingTasks.length > 0 && !task && (
        <div className="space-y-2">
          <Label htmlFor="task-dependencies">Dependencies (Optional)</Label>
          <Select
            value=""
            onValueChange={(value) => {
              if (!formData.dependencies.includes(value)) {
                updateField('dependencies', [...formData.dependencies, value])
              }
            }}
          >
            <SelectTrigger id="task-dependencies">
              <SelectValue placeholder="Select dependent tasks..." />
            </SelectTrigger>
            <SelectContent>
              {existingTasks
                .filter(t => t.id !== task?.id)
                .map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {formData.dependencies.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.dependencies.map(depId => {
                const depTask = existingTasks.find(t => t.id === depId)
                return depTask ? (
                  <div
                    key={depId}
                    className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm flex items-center gap-2"
                  >
                    {depTask.name}
                    <button
                      type="button"
                      onClick={() => {
                        updateField(
                          'dependencies',
                          formData.dependencies.filter(id => id !== depId)
                        )
                      }}
                      className="hover:text-destructive"
                    >
                      ×
                    </button>
                  </div>
                ) : null
              })}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {task ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </form>
  )
}
