import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Calendar, Warning, CheckCircle, Clock } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import type { Task } from '@/lib/types'

export function SchedulePage() {
  const { projectId } = useParams()
  const [tasks, setTasks] = useKV<Task[]>(`schedule-tasks-${projectId}`, [])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'not-started' as Task['status'],
    priority: 'medium' as Task['priority'],
    startDate: '',
    endDate: '',
    assignedTo: '',
    percentComplete: 0,
  })

  const handleCreate = () => {
    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast.error('Please fill in required fields')
      return
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      projectId: projectId!,
      ...formData,
      dependencies: [],
      isCriticalPath: false,
      createdAt: new Date().toISOString(),
    }

    setTasks(current => [...current, newTask])
    setIsCreateOpen(false)
    setFormData({
      name: '',
      description: '',
      status: 'not-started',
      priority: 'medium',
      startDate: '',
      endDate: '',
      assignedTo: '',
      percentComplete: 0,
    })
    toast.success('Task created successfully')
  }

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    setTasks(current =>
      current.map(task =>
        task.id === taskId
          ? { ...task, status: newStatus, percentComplete: newStatus === 'completed' ? 100 : task.percentComplete }
          : task
      )
    )
    toast.success('Task status updated')
  }

  const getStatusBadge = (status: Task['status']) => {
    const variants: Record<Task['status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: React.ReactNode }> = {
      'not-started': { variant: 'outline', icon: <Clock size={14} /> },
      'in-progress': { variant: 'default', icon: <Clock size={14} /> },
      'completed': { variant: 'secondary', icon: <CheckCircle size={14} /> },
      'blocked': { variant: 'destructive', icon: <Warning size={14} /> },
    }
    return variants[status]
  }

  const getPriorityBadge = (priority: Task['priority']) => {
    const colors: Record<Task['priority'], string> = {
      low: 'bg-secondary text-secondary-foreground',
      medium: 'bg-primary text-primary-foreground',
      high: 'bg-accent text-accent-foreground',
      critical: 'bg-destructive text-destructive-foreground',
    }
    return colors[priority]
  }

  const criticalPathTasks = tasks.filter(t => t.isCriticalPath)
  const completedTasks = tasks.filter(t => t.status === 'completed')
  const blockedTasks = tasks.filter(t => t.status === 'blocked')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Schedule</h2>
          <p className="text-muted-foreground">Manage project tasks and timeline</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} className="mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>Add a new task to the project schedule</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="task-name">Task Name *</Label>
                <Input
                  id="task-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter task name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="task-description">Description</Label>
                <Textarea
                  id="task-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Task description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="task-status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: Task['status']) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger id="task-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-started">Not Started</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="task-priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value: Task['priority']) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger id="task-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="task-start">Start Date *</Label>
                  <Input
                    id="task-start"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="task-end">End Date *</Label>
                  <Input
                    id="task-end"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="task-assigned">Assigned To</Label>
                <Input
                  id="task-assigned"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  placeholder="Person or crew name"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create Task</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Calendar size={20} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedTasks.length} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Path</CardTitle>
            <Warning size={20} className="text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criticalPathTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              High priority items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Tasks</CardTitle>
            <Warning size={20} className="text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blockedTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task List</CardTitle>
          <CardDescription>All scheduled tasks for this project</CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar size={48} className="text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tasks scheduled</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first task to start building the project schedule
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus size={16} className="mr-2" />
                Add Task
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => {
                  const statusBadge = getStatusBadge(task.status)
                  return (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div className="font-medium">{task.name}</div>
                        {task.description && (
                          <div className="text-sm text-muted-foreground">{task.description}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityBadge(task.priority)}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadge.variant} className="gap-1">
                          {statusBadge.icon}
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(task.startDate).toLocaleDateString()} - {new Date(task.endDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>{task.assignedTo || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${task.percentComplete}%` }}
                            />
                          </div>
                          <span className="text-sm font-mono">{task.percentComplete}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select value={task.status} onValueChange={(value: Task['status']) => handleStatusChange(task.id, value)}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not-started">Not Started</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="blocked">Blocked</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
