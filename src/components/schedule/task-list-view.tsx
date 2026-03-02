import { useState } from 'react'
import { PencilSimple, Trash, Clock, User } from '@phosphor-icons/react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Task } from '@/lib/types'
import { TaskFormDialog } from './task-form-dialog'
import { format } from 'date-fns'

interface TaskListViewProps {
  tasks: Task[]
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void
  onDeleteTask: (taskId: string) => void
}

export function TaskListView({ tasks, onUpdateTask, onDeleteTask }: TaskListViewProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'in-progress':
        return 'default'
      case 'not-started':
        return 'secondary'
      case 'on-hold':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
  }

  const handleUpdate = (updates: Omit<Task, 'id' | 'projectId' | 'createdAt'>) => {
    if (editingTask) {
      onUpdateTask(editingTask.id, updates)
      setEditingTask(null)
    }
  }

  const isOverdue = (task: Task) => {
    if (task.status === 'completed') return false
    return new Date(task.endDate) < new Date()
  }

  return (
    <>
      <div className="p-6">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No tasks yet</p>
            <p className="text-sm">Create your first task to get started</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map(task => (
                <TableRow key={task.id} className={isOverdue(task) ? 'bg-destructive/5' : ''}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="flex items-center gap-2">
                        {task.name}
                        {isOverdue(task) && (
                          <Badge variant="destructive" className="text-xs">Overdue</Badge>
                        )}
                      </div>
                      {task.description && (
                        <div className="text-xs text-muted-foreground mt-1">{task.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(task.status)}>
                      {task.status.replace('-', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 w-32">
                      <Progress value={task.percentComplete} className="h-2" />
                      <span className="text-xs text-muted-foreground w-10">{task.percentComplete}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(task.startDate), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(task.endDate), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    {task.assignedTo ? (
                      <div className="flex items-center gap-2 text-sm">
                        <User size={16} className="text-muted-foreground" />
                        {task.assignedTo}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(task)}
                      >
                        <PencilSimple size={16} />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash size={16} className="text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Task</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{task.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDeleteTask(task.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update task details and progress
            </DialogDescription>
          </DialogHeader>
          {editingTask && (
            <TaskFormDialog
              task={editingTask}
              onSubmit={handleUpdate}
              onCancel={() => setEditingTask(null)}
              existingTasks={tasks}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
