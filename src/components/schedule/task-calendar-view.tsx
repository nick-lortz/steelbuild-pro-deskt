import { useState, useMemo } from 'react'
import { CaretLeft, CaretRight, Circle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Task } from '@/lib/types'
import { TaskFormDialog } from './task-form-dialog'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isSameMonth
} from 'date-fns'

interface TaskCalendarViewProps {
  tasks: Task[]
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void
  onDeleteTask: (taskId: string) => void
}

export function TaskCalendarView({ tasks, onUpdateTask, onDeleteTask }: TaskCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart)
    const calEnd = endOfWeek(monthEnd)
    
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [currentMonth])

  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => {
      const taskStart = new Date(task.startDate)
      const taskEnd = new Date(task.endDate)
      return day >= taskStart && day <= taskEnd
    })
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

  const tasksForSelectedDate = selectedDate ? getTasksForDay(selectedDate) : []

  return (
    <>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <CaretLeft size={18} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <CaretRight size={18} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div
              key={day}
              className="bg-muted/50 p-3 text-center text-sm font-semibold"
            >
              {day}
            </div>
          ))}

          {calendarDays.map((day, index) => {
            const dayTasks = getTasksForDay(day)
            const isToday = isSameDay(day, new Date())
            const isCurrentMonth = isSameMonth(day, currentMonth)

            return (
              <div
                key={index}
                className={`
                  bg-background min-h-32 p-2 cursor-pointer transition-colors hover:bg-muted/50
                  ${!isCurrentMonth ? 'opacity-40' : ''}
                  ${isToday ? 'ring-2 ring-primary ring-inset' : ''}
                `}
                onClick={() => setSelectedDate(day)}
              >
                <div className={`text-sm font-medium mb-2 ${isToday ? 'text-primary' : ''}`}>
                  {format(day, 'd')}
                </div>

                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map(task => {
                    const isStart = isSameDay(day, new Date(task.startDate))
                    const isEnd = isSameDay(day, new Date(task.endDate))

                    return (
                      <div
                        key={task.id}
                        className={`text-xs px-1.5 py-0.5 rounded text-white truncate cursor-pointer ${getStatusColor(task.status)}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedTask(task)
                        }}
                        title={task.name}
                      >
                        {isStart && <Circle size={8} weight="fill" className="inline mr-1" />}
                        {task.name}
                      </div>
                    )
                  })}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-muted-foreground px-1.5">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Tasks for {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
            </DialogTitle>
            <DialogDescription>
              {tasksForSelectedDate.length} task(s) scheduled for this day
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {tasksForSelectedDate.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No tasks scheduled for this day
              </p>
            ) : (
              tasksForSelectedDate.map(task => {
                const isStart = selectedDate && isSameDay(selectedDate, new Date(task.startDate))
                const isEnd = selectedDate && isSameDay(selectedDate, new Date(task.endDate))

                return (
                  <div
                    key={task.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedDate(null)
                      setSelectedTask(task)
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-medium">{task.name}</div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {task.status.replace('-', ' ')}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {task.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {task.percentComplete}% complete
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {isStart && '⭐ Starts today'}
                          {isEnd && '🏁 Ends today'}
                          {!isStart && !isEnd && `${format(new Date(task.startDate), 'MMM d')} - ${format(new Date(task.endDate), 'MMM d')}`}
                        </div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status)}`} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update task details and progress
            </DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <TaskFormDialog
              task={selectedTask}
              onSubmit={(updates) => {
                onUpdateTask(selectedTask.id, updates)
                setSelectedTask(null)
              }}
              onCancel={() => setSelectedTask(null)}
              existingTasks={tasks}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
