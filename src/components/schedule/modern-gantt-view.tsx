import { useState, useMemo, useRef, useEffect } from 'react'
import { ChevronRight, ChevronDown, Plus, Trash, Link as LinkIcon, Calendar, Flag, Circle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Task } from '@/lib/types'

interface ModernGanttViewProps {
  tasks: Task[]
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void
  onDeleteTask: (taskId: string) => void
  onAddSubtask: (parentId: string) => void
  onAddDependency: (taskId: string, dependencyId: string) => void
}

interface TaskNode extends Task {
  children: TaskNode[]
  level: number
  parentId?: string
}

export function ModernGanttView({ 
  tasks, 
  onUpdateTask, 
  onDeleteTask,
  onAddSubtask,
  onAddDependency 
}: ModernGanttViewProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [timelineScale, setTimelineScale] = useState<'day' | 'week' | 'month'>('week')
  const [isDragging, setIsDragging] = useState(false)
  const [dragTask, setDragTask] = useState<string | null>(null)

  const taskHierarchy = useMemo(() => {
    const taskMap = new Map<string, TaskNode>()
    const rootTasks: TaskNode[] = []

    tasks.forEach(task => {
      taskMap.set(task.id, {
        ...task,
        children: [],
        level: 0,
        parentId: undefined,
      })
    })

    tasks.forEach(task => {
      const dependencies = task.dependencies || []
      dependencies.forEach(depId => {
        const parentTask = taskMap.get(depId)
        const childTask = taskMap.get(task.id)
        if (parentTask && childTask) {
          childTask.parentId = depId
          childTask.level = parentTask.level + 1
          parentTask.children.push(childTask)
        }
      })
    })

    taskMap.forEach(task => {
      if (!task.parentId) {
        rootTasks.push(task)
      }
    })

    return rootTasks
  }, [tasks])

  const timelineData = useMemo(() => {
    if (tasks.length === 0) {
      return {
        start: new Date(),
        end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        columns: [],
        totalDays: 30,
      }
    }

    const dates = tasks.flatMap(t => [new Date(t.startDate), new Date(t.endDate)])
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))

    minDate.setDate(minDate.getDate() - 3)
    maxDate.setDate(maxDate.getDate() + 3)

    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
    
    const columns: { date: Date; label: string; isWeekend: boolean }[] = []
    
    if (timelineScale === 'day') {
      for (let i = 0; i < totalDays; i++) {
        const date = new Date(minDate)
        date.setDate(date.getDate() + i)
        const day = date.getDay()
        columns.push({
          date,
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          isWeekend: day === 0 || day === 6,
        })
      }
    } else if (timelineScale === 'week') {
      const weeks = Math.ceil(totalDays / 7)
      for (let i = 0; i < weeks; i++) {
        const date = new Date(minDate)
        date.setDate(date.getDate() + (i * 7))
        columns.push({
          date,
          label: `Week ${i + 1}`,
          isWeekend: false,
        })
      }
    } else {
      const months = Math.ceil(totalDays / 30)
      for (let i = 0; i < months; i++) {
        const date = new Date(minDate)
        date.setMonth(date.getMonth() + i)
        columns.push({
          date,
          label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          isWeekend: false,
        })
      }
    }

    return { start: minDate, end: maxDate, columns, totalDays }
  }, [tasks, timelineScale])

  const toggleExpand = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  const getTaskPosition = (task: Task) => {
    const taskStart = new Date(task.startDate).getTime()
    const taskEnd = new Date(task.endDate).getTime()
    const timelineStart = timelineData.start.getTime()
    const timelineEnd = timelineData.end.getTime()
    
    const totalWidth = 100
    const left = ((taskStart - timelineStart) / (timelineEnd - timelineStart)) * totalWidth
    const width = ((taskEnd - taskStart) / (timelineEnd - timelineStart)) * totalWidth
    
    return { left: `${left}%`, width: `${width}%` }
  }

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed': return 'bg-success'
      case 'in-progress': return 'bg-primary'
      case 'blocked': return 'bg-destructive'
      default: return 'bg-muted'
    }
  }

  const renderTaskRow = (task: TaskNode, index: number): React.ReactNode[] => {
    const rows: React.ReactNode[] = []
    const hasChildren = task.children.length > 0
    const isExpanded = expandedTasks.has(task.id)
    const isSelected = selectedTask === task.id
    const position = getTaskPosition(task)

    rows.push(
      <div
        key={task.id}
        className={cn(
          "flex border-b hover:bg-accent/50 transition-colors",
          isSelected && "bg-accent"
        )}
        onClick={() => setSelectedTask(task.id)}
      >
        {/* Left panel - Task info */}
        <div className="flex-shrink-0 w-[400px] border-r p-2 flex items-center gap-2">
          <div style={{ marginLeft: `${task.level * 24}px` }} className="flex items-center gap-1">
            {hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleExpand(task.id)
                }}
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </Button>
            )}
            {!hasChildren && <div className="w-6" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">{task.name}</span>
              {task.isCriticalPath && (
                <Badge variant="destructive" className="h-5 text-xs">Critical</Badge>
              )}
              {task.dependencies && task.dependencies.length > 0 && (
                <LinkIcon size={14} className="text-muted-foreground" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="h-5 text-xs">
                {task.status}
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
              onClick={(e) => {
                e.stopPropagation()
                onAddSubtask(task.id)
              }}
            >
              <Plus size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                onDeleteTask(task.id)
              }}
            >
              <Trash size={14} />
            </Button>
          </div>
        </div>

        {/* Right panel - Timeline */}
        <div className="flex-1 relative p-2 min-h-[56px]">
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 h-8 rounded flex items-center px-2 cursor-move",
              getStatusColor(task.status),
              hasChildren && "opacity-60"
            )}
            style={position}
            draggable
            onDragStart={() => {
              setIsDragging(true)
              setDragTask(task.id)
            }}
            onDragEnd={() => {
              setIsDragging(false)
              setDragTask(null)
            }}
          >
            <div className="flex items-center gap-2 text-xs text-white font-medium">
              <span className="truncate">{task.name}</span>
            </div>
            {task.percentComplete > 0 && (
              <div 
                className="absolute bottom-0 left-0 h-1 bg-white/40 rounded"
                style={{ width: `${task.percentComplete}%` }}
              />
            )}
          </div>

          {task.dependencies?.map(depId => {
            const depTask = tasks.find(t => t.id === depId)
            if (!depTask) return null
            
            return (
              <svg
                key={`dep-${task.id}-${depId}`}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ zIndex: 1 }}
              >
                <line
                  x1="10%"
                  y1="50%"
                  x2="20%"
                  y2="50%"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-muted-foreground"
                  markerEnd="url(#arrowhead)"
                />
              </svg>
            )
          })}
        </div>
      </div>
    )

    if (hasChildren && isExpanded) {
      task.children.forEach(child => {
        rows.push(...renderTaskRow(child, index + 1))
      })
    }

    return rows
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      {/* Header */}
      <div className="flex border-b bg-muted/50">
        <div className="flex-shrink-0 w-[400px] border-r p-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">Task Name</span>
            <div className="flex gap-1">
              <Button
                variant={timelineScale === 'day' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setTimelineScale('day')}
              >
                Day
              </Button>
              <Button
                variant={timelineScale === 'week' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setTimelineScale('week')}
              >
                Week
              </Button>
              <Button
                variant={timelineScale === 'month' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setTimelineScale('month')}
              >
                Month
              </Button>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-x-auto">
          <div className="flex min-w-max">
            {timelineData.columns.map((col, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex-1 min-w-[80px] p-2 text-center text-xs font-medium border-r",
                  col.isWeekend && "bg-muted"
                )}
              >
                {col.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Task rows */}
      <div className="overflow-auto max-h-[600px]">
        {tasks.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Calendar size={48} className="mx-auto mb-4 opacity-20" />
            <p>No tasks to display</p>
            <p className="text-sm mt-1">Add tasks to see them in the Gantt chart</p>
          </div>
        ) : (
          <div>
            {taskHierarchy.map((task, index) => renderTaskRow(task, index))}
          </div>
        )}
      </div>

      {/* SVG definitions */}
      <svg className="hidden">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="currentColor" />
          </marker>
        </defs>
      </svg>
    </div>
  )
}
