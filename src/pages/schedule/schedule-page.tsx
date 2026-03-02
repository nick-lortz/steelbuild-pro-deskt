import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, List, CalendarBlank, ChartBar, Funnel, Download } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import type { Task } from '@/lib/types'
import { TaskListView } from '@/components/schedule/task-list-view'
import { TaskCalendarView } from '@/components/schedule/task-calendar-view'
import { TaskGanttView } from '@/components/schedule/task-gantt-view'
import { TaskFormDialog } from '@/components/schedule/task-form-dialog'

export function SchedulePage() {
  const { projectId } = useParams()
  const [tasks, setTasks] = useKV<Task[]>(`schedule-tasks-${projectId}`, [])
  const [activeView, setActiveView] = useState<'list' | 'calendar' | 'gantt'>('gantt')
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

  const stats = useMemo(() => {
    const taskList = tasks || []
    return {
      total: taskList.length,
      completed: taskList.filter(t => t.status === 'completed').length,
      inProgress: taskList.filter(t => t.status === 'in-progress').length,
      notStarted: taskList.filter(t => t.status === 'not-started').length,
      overdue: taskList.filter(t => {
        if (t.status === 'completed') return false
        return new Date(t.endDate) < new Date()
      }).length,
    }
  }, [tasks])

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-background to-cyan-50">
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Project Schedule</h1>
            <p className="text-muted-foreground mt-1">
              Plan, track, and visualize project tasks and dependencies
            </p>
          </div>
        <div className="flex gap-2">
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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Add a task to the project schedule
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

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Not Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-muted-foreground">{stats.notStarted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{stats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <CardTitle>Schedule Views</CardTitle>
            <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
              <TabsList>
                <TabsTrigger value="gantt" className="gap-2">
                  <ChartBar size={18} />
                  <span className="hidden sm:inline">Gantt</span>
                </TabsTrigger>
                <TabsTrigger value="calendar" className="gap-2">
                  <CalendarBlank size={18} />
                  <span className="hidden sm:inline">Calendar</span>
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-2">
                  <List size={18} />
                  <span className="hidden sm:inline">List</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {activeView === 'gantt' && (
            <TaskGanttView
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
          {activeView === 'list' && (
            <TaskListView
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
