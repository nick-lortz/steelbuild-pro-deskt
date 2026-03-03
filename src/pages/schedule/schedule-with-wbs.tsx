import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, List, CalendarBlank, GanttChart, ArrowsClockwise, Gear, Code } from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useKV } from '@github/spark/hooks';
import { toast } from 'sonner';
import type { TaskWithWBS, WBSCodeStructure } from '@/types/wbs';
import { createWBSGenerator } from '@/lib/wbs-utils';
import { WBSGanttView } from '@/components/schedule/wbs-gantt-view';
import { TaskFormDialog } from '@/components/schedule/task-form-dialog';

export function ScheduleWithWBSPage() {
  const { projectId } = useParams();
  const [tasks, setTasks] = useKV<TaskWithWBS[]>(`schedule-wbs-tasks-${projectId}`, []);
  const [wbsStructure, setWbsStructure] = useKV<WBSCodeStructure | null>(
    `wbs-structure-${projectId}`,
    null
  );
  const [activeView, setActiveView] = useState<'gantt' | 'list' | 'calendar'>('gantt');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<TaskWithWBS | null>(null);

  const generator = useMemo(() => {
    return wbsStructure ? createWBSGenerator(wbsStructure) : null;
  }, [wbsStructure]);

  const handleCreateTask = (
    taskData: Omit<TaskWithWBS, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'wbsCode' | 'wbsLevel'>
  ) => {
    if (!generator) {
      toast.error('WBS structure not configured');
      return;
    }

    try {
      const existingCodes = tasks?.map(t => t.wbsCode) || [];
      const wbsCode = generator.getNextCode(selectedParent?.wbsCode || null, existingCodes);
      const wbsLevel = generator.getLevel(wbsCode);

      const newTask: TaskWithWBS = {
        id: crypto.randomUUID(),
        projectId: projectId!,
        ...taskData,
        wbsCode,
        wbsLevel,
        parentWBSCode: selectedParent?.wbsCode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setTasks(current => [...(current || []), newTask]);
      setIsCreateOpen(false);
      setSelectedParent(null);
      toast.success(`Task created with WBS code: ${wbsCode}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create task');
    }
  };

  const handleUpdateTask = (taskId: string, updates: Partial<TaskWithWBS>) => {
    setTasks(current =>
      (current || []).map(task =>
        task.id === taskId
          ? { ...task, ...updates, updatedAt: new Date().toISOString() }
          : task
      )
    );
    toast.success('Task updated successfully');
  };

  const handleDeleteTask = (task: TaskWithWBS) => {
    if (!generator) return;

    const descendants = generator.getDescendants(task.wbsCode, tasks?.map(t => t.wbsCode) || []);
    
    if (descendants.length > 0) {
      const confirmDelete = window.confirm(
        `This will delete ${descendants.length} child task(s). Continue?`
      );
      if (!confirmDelete) return;
    }

    setTasks(current =>
      (current || []).filter(t => t.id !== task.id && !descendants.includes(t.wbsCode))
    );

    toast.success('Task deleted successfully');
  };

  const handleAddSubtask = (parentTask: TaskWithWBS) => {
    setSelectedParent(parentTask);
    setIsCreateOpen(true);
  };

  const handleAddDependency = (task: TaskWithWBS) => {
    toast.info('Dependency dialog coming soon');
  };

  const handleEditTask = (task: TaskWithWBS) => {
    toast.info('Edit task dialog coming soon');
  };

  const calculateCriticalPath = () => {
    if (!tasks || tasks.length === 0) return;

    const sortedTasks = [...tasks].sort((a, b) =>
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    const longestPath = new Set<string>();

    const findLongestPath = (taskId: string, path: Set<string>): number => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return 0;

      const taskDuration =
        (new Date(task.endDate).getTime() - new Date(task.startDate).getTime()) /
        (1000 * 60 * 60 * 24);

      const dependentTasks = tasks.filter(t => t.dependencies?.includes(taskId));
      if (dependentTasks.length === 0) {
        path.add(taskId);
        return taskDuration;
      }

      let maxDuration = 0;
      dependentTasks.forEach(depTask => {
        const newPath = new Set(path);
        newPath.add(taskId);
        const duration = findLongestPath(depTask.id, newPath);
        if (duration > maxDuration) {
          maxDuration = duration;
          longestPath.clear();
          newPath.forEach(id => longestPath.add(id));
        }
      });

      return taskDuration + maxDuration;
    };

    sortedTasks.forEach(task => {
      if (!task.dependencies || task.dependencies.length === 0) {
        findLongestPath(task.id, new Set());
      }
    });

    setTasks(current =>
      (current || []).map(task => ({
        ...task,
        isCriticalPath: longestPath.has(task.id),
      }))
    );

    toast.success(`Critical path calculated: ${longestPath.size} tasks identified`);
  };

  const stats = useMemo(() => {
    const taskList = tasks || [];
    return {
      total: taskList.length,
      completed: taskList.filter(t => t.status === 'completed').length,
      inProgress: taskList.filter(t => t.status === 'in-progress').length,
      notStarted: taskList.filter(t => t.status === 'not-started').length,
      blocked: taskList.filter(t => t.status === 'blocked').length,
      overdue: taskList.filter(t => {
        if (t.status === 'completed') return false;
        return new Date(t.endDate) < new Date();
      }).length,
      critical: taskList.filter(t => t.isCriticalPath).length,
    };
  }, [tasks]);

  if (!wbsStructure) {
    return (
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Project Schedule</h1>
          <p className="text-muted-foreground">
            Configure a WBS structure to enable hierarchical task organization
          </p>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
              <Code className="w-8 h-8 text-accent" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">WBS Structure Required</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Set up a Work Breakdown Structure (WBS) coding system to organize tasks hierarchically
              </p>
            </div>
            <Button size="lg" asChild>
              <Link to={`/projects/${projectId}/schedule/wbs-settings`}>
                <Gear className="mr-2" />
                Configure WBS Structure
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Project Schedule</h1>
          <p className="text-muted-foreground">
            WBS-based hierarchical task management with {wbsStructure.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={`/projects/${projectId}/schedule/wbs-settings`}>
              <Gear className="mr-2" />
              WBS Settings
            </Link>
          </Button>
          <Button variant="outline" onClick={calculateCriticalPath}>
            <ArrowsClockwise className="mr-2" />
            Calculate Critical Path
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2" />
            New Task
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.completed} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.notStarted} not started
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Path</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.critical}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Critical tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats.overdue + stats.blocked}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.overdue} overdue, {stats.blocked} blocked
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Schedule</CardTitle>
            <Tabs value={activeView} onValueChange={v => setActiveView(v as any)}>
              <TabsList>
                <TabsTrigger value="gantt">
                  <GanttChart className="mr-2 h-4 w-4" />
                  Gantt
                </TabsTrigger>
                <TabsTrigger value="list">
                  <List className="mr-2 h-4 w-4" />
                  List
                </TabsTrigger>
                <TabsTrigger value="calendar">
                  <CalendarBlank className="mr-2 h-4 w-4" />
                  Calendar
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <TabsContent value="gantt" className="mt-0">
            {tasks && tasks.length > 0 ? (
              <WBSGanttView
                tasks={tasks}
                wbsStructure={wbsStructure}
                onAddSubtask={handleAddSubtask}
                onAddDependency={handleAddDependency}
                onDeleteTask={handleDeleteTask}
                onEditTask={handleEditTask}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground mb-4">No tasks yet</p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2" />
                  Create First Task
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="list" className="mt-0">
            <div className="text-center text-muted-foreground py-8">
              List view coming soon
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="mt-0">
            <div className="text-center text-muted-foreground py-8">
              Calendar view coming soon
            </div>
          </TabsContent>
        </CardContent>
      </Card>

      {selectedParent && (
        <div className="fixed bottom-4 right-4 bg-card border rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="font-mono">{selectedParent.wbsCode}</Badge>
            <span className="text-sm">Creating subtask under:</span>
          </div>
          <div className="text-sm font-medium">{selectedParent.name}</div>
          <Button
            size="sm"
            variant="ghost"
            className="mt-2"
            onClick={() => setSelectedParent(null)}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
