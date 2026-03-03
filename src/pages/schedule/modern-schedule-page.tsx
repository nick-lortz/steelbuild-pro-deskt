import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, List, CalendarBlank, ChartBar, Funnel, Download, GanttChart, ArrowsClockwise } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import type { Task } from '@/lib/types'
import { TaskListView } from '@/components/schedule/task-list-view'
import { TaskCalendarView } from '@/components/schedule/task-calendar-view'
import { ModernGanttView } from '@/components/schedule/modern-gantt-view'
import { TaskFormDialog } from '@/components/schedule/task-form-dialog'
import { cn } from '@/lib/utils'

export function ModernSchedulePage() {
  const { projectId } = useParams()
  const [tasks, setTasks] = useKV<Task[]>(`schedule-tasks-${projectId}`, [])
  const [activeView, setActiveView] = useState<'gantt' | 'list' | 'calendar'>('gantt')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const handleCreateTask = (taskData: Omit<Task, 'id' | 'projectId' | 'createdAt'>) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      projectId: projectId!,
      ...taskData,
      createdAt: new Date().toISOString(),
    }

    setTasks(current => [...(current || []), newTask])
    setIsCreateOpen(false)
    toast.success('Task created successfully')
  }

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(current =>
      (current || []).map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    )
    toast.success('Task updated successfully')
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks(current => (current || []).filter(task => task.id !== taskId))
    toast.success('Task deleted successfully')
  }

  const handleAddSubtask = (parentId: string) => {
    const parentTask = tasks?.find(t => t.id === parentId)
    if (!parentTask) return

    const newTask: Task = {
      id: crypto.randomUUID(),
      projectId: projectId!,
      name: 'New Subtask',
      description: '',
      status: 'not-started',
      priority: 'medium',
      startDate: parentTask.startDate,
      endDate: parentTask.endDate,
      dependencies: [parentId],
      percentComplete: 0,
      isCriticalPath: false,
      createdAt: new Date().toISOString(),
    }

    setTasks(current => [...(current || []), newTask])
    toast.success('Subtask added successfully')
  }

  const handleAddDependency = (taskId: string, dependencyId: string) => {
    setTasks(current =>
      (current || []).map(task =>
        task.id === taskId 
          ? { ...task, dependencies: [...(task.dependencies || []), dependencyId] }
          : task
      )
    )
    toast.success('Dependency added successfully')
  }

  const calculateCriticalPath = () => {
    if (!tasks || tasks.length === 0) return

    const sortedTasks = [...tasks].sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )

    const longestPath = new Set<string>()
    
    const findLongestPath = (taskId: string, path: Set<string>): number => {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return 0

      const taskDuration = (new Date(task.endDate).getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60 * 24)
      
      const dependentTasks = tasks.filter(t => t.dependencies?.includes(taskId))
      if (dependentTasks.length === 0) {
        path.add(taskId)
        return taskDuration
      }

      let maxDuration = 0
      dependentTasks.forEach(depTask => {
        const newPath = new Set(path)
        newPath.add(taskId)
        const duration = findLongestPath(depTask.id, newPath)
        if (duration > maxDuration) {
          maxDuration = duration
          longestPath.clear()
          newPath.forEach(id => longestPath.add(id))
        }
      })

      return taskDuration + maxDuration
    }

    sortedTasks.forEach(task => {
      if (!task.dependencies || task.dependencies.length === 0) {
        findLongestPath(task.id, new Set())
      }
    })

    setTasks(current =>
      (current || []).map(task => ({
        ...task,
        isCriticalPath: longestPath.has(task.id),
      }))
    )

    toast.success(`Critical path calculated: ${longestPath.size} tasks identified`)
  }

  const stats = useMemo(() => {
    const taskList = tasks || []
    return {
      total: taskList.length,
      completed: taskList.filter(t => t.status === 'completed').length,
      inProgress: taskList.filter(t => t.status === 'in-progress').length,
      notStarted: taskList.filter(t => t.status === 'not-started').length,
      blocked: taskList.filter(t => t.status === 'blocked').length,
      overdue: taskList.filter(t => {
        if (t.status === 'completed') return false
        return new Date(t.endDate) < new Date()
      }).length,
      critical: taskList.filter(t => t.isCriticalPath).length,
    }
  }, [tasks])

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Project Schedule</h1>
            <p className="text-muted-foreground mt-1">
              WBS-style planning with dependencies, subtasks, and critical path analysis
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={calculateCriticalPath}
            >
              <ArrowsClockwise size={18} />
              Calculate Critical Path
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Funnel size={18} />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download size={18} />
              Export
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus size={18} weight="bold" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <DialogDescription>
                    Add a task to the project schedule with dependencies
                  </DialogDescription>
                </DialogHeader>
                <TaskFormDialog
                  onSubmit={handleCreateTask}
                  onCancel={() => setIsCreateOpen(false)}
                  existingTasks={tasks || []}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total Tasks</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-success">{stats.completed}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{stats.inProgress}</div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-muted-foreground">{stats.notStarted}</div>
              <div className="text-xs text-muted-foreground">Not Started</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-destructive">{stats.blocked}</div>
              <div className="text-xs text-muted-foreground">Blocked</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-warning">{stats.overdue}</div>
              <div className="text-xs text-muted-foreground">Overdue</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-destructive">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-destructive">{stats.critical}</div>
              <div className="text-xs text-muted-foreground">Critical Path</div>
            </CardContent>
          </Card>
        </div>

        {/* View Tabs */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Schedule Views</CardTitle>
              <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="w-auto">
                <TabsList>
                  <TabsTrigger value="gantt" className="gap-2">
                    <GanttChart size={18} />
                    Gantt (WBS)
                  </TabsTrigger>
                  <TabsTrigger value="list" className="gap-2">
                    <List size={18} />
                    List
                  </TabsTrigger>
                  <TabsTrigger value="calendar" className="gap-2">
                    <CalendarBlank size={18} />
                    Calendar
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {activeView === 'gantt' && (
              <ModernGanttView
                tasks={tasks || []}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onAddSubtask={handleAddSubtask}
                onAddDependency={handleAddDependency}
              />
            )}
            {activeView === 'list' && (
              <TaskListView
                tasks={tasks || []}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
              />
            )}
            {activeView === 'calendar' && (
              <TaskCalendarView
                tasks={tasks || []}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
