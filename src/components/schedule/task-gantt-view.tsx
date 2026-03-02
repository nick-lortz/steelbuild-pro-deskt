import { useState, useMemo } from 'react'
import { PencilSimple, Trash } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import type { Task } from '@/lib/types'
import { TaskFormDialog } from './task-form-dialog'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, differenceInDays, addMonths } from 'date-fns'

interface TaskGanttViewProps {
  tasks: Task[]
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void
  onDeleteTask: (taskId: string) => void
}

export function TaskGanttView({ tasks, onUpdateTask, onDeleteTask }: TaskGanttViewProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const timeRange = useMemo(() => {
    if (tasks.length === 0) {
      const start = startOfMonth(currentMonth)
      const end = endOfMonth(addMonths(currentMonth, 2))
      return { start, end, days: eachDayOfInterval({ start, end }) }
    }

    const dates = tasks.flatMap(t => [new Date(t.startDate), new Date(t.endDate)])
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))

    const start = startOfMonth(minDate)
    const end = endOfMonth(maxDate)
    const days = eachDayOfInterval({ start, end })

    return { start, end, days }
  }, [tasks, currentMonth])

  const getTaskPosition = (task: Task) => {
    const taskStart = new Date(task.startDate)
    const taskEnd = new Date(task.endDate)

    const daysFromStart = differenceInDays(taskStart, timeRange.start)
    const duration = differenceInDays(taskEnd, taskStart) + 1

    const leftPercent = (daysFromStart / timeRange.days.length) * 100
    const widthPercent = (duration / timeRange.days.length) * 100

    return { left: `${leftPercent}%`, width: `${widthPercent}%` }
  }

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'in-progress':
        return 'bg-blue-500'
      case 'not-started':
        return 'bg-gray-400'
      case 'on-hold':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-400'
    }
  }

  const dayWidth = 40
  const rowHeight = 56

  return (
    <>
      <div className="p-6 overflow-x-auto">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium">No tasks to display</p>
            <p className="text-sm">Create tasks to see them on the Gantt chart</p>
          </div>
        ) : (
          <div className="min-w-max">
            <div className="flex border-b sticky top-0 bg-background z-10">
              <div className="w-64 flex-shrink-0 font-medium p-4 border-r bg-muted/30">
                Task Name
              </div>
              <div className="flex">
                {timeRange.days.map((day, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center justify-center border-r"
                    style={{ width: dayWidth }}
                  >
                    <div className="text-xs font-medium">{format(day, 'MMM')}</div>
                    <div className="text-xs text-muted-foreground">{format(day, 'd')}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              {tasks.map((task, index) => {
                const position = getTaskPosition(task)
                const isOverdue = task.status !== 'completed' && new Date(task.endDate) < new Date()

                return (
                  <div
                    key={task.id}
                    className="flex border-b hover:bg-muted/30 transition-colors"
                    style={{ height: rowHeight }}
                  >
                    <div className="w-64 flex-shrink-0 p-4 border-r flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-sm">{task.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {task.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {task.percentComplete}%
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => setEditingTask(task)}
                        >
                          <PencilSimple size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => setDeleteTaskId(task.id)}
                        >
                          <Trash size={14} className="text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex-1 relative" style={{ minWidth: timeRange.days.length * dayWidth }}>
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 h-8 rounded-md flex items-center px-2 text-white text-xs font-medium shadow-sm ${getStatusColor(task.status)} ${isOverdue ? 'ring-2 ring-destructive' : ''}`}
                        style={{ ...position }}
                        title={`${task.name}: ${format(new Date(task.startDate), 'MMM d')} - ${format(new Date(task.endDate), 'MMM d')}`}
                      >
                        <div className="truncate">
                          {task.name}
                        </div>
                      </div>

                      {task.dependencies && task.dependencies.length > 0 && (
                        <div className="absolute top-0 left-0 text-xs text-blue-600">
                          ↖
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              <div
                className="absolute top-0 bottom-0 w-0.5 bg-destructive/40 pointer-events-none z-20"
                style={{
                  left: `${(differenceInDays(new Date(), timeRange.start) / timeRange.days.length) * 100}%`,
                }}
                title="Today"
              />
            </div>
          </div>
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
              onSubmit={(updates) => {
                onUpdateTask(editingTask.id, updates)
                setEditingTask(null)
              }}
              onCancel={() => setEditingTask(null)}
              existingTasks={tasks}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTaskId} onOpenChange={(open) => !open && setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTaskId) {
                  onDeleteTask(deleteTaskId)
                  setDeleteTaskId(null)
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
