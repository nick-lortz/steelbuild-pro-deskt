import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Plus, Trash, Edit, Link } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { TaskWithWBS, WBSCodeStructure } from '@/types/wbs';
import { createWBSGenerator, compareWBSCodes, getWBSDepth } from '@/lib/wbs-utils';
import { cn } from '@/lib/utils';

interface WBSGanttViewProps {
  tasks: TaskWithWBS[];
  wbsStructure: WBSCodeStructure;
  onTaskClick?: (task: TaskWithWBS) => void;
  onAddSubtask?: (parentTask: TaskWithWBS) => void;
  onAddDependency?: (task: TaskWithWBS) => void;
  onDeleteTask?: (task: TaskWithWBS) => void;
  onEditTask?: (task: TaskWithWBS) => void;
}

export function WBSGanttView({
  tasks,
  wbsStructure,
  onTaskClick,
  onAddSubtask,
  onAddDependency,
  onDeleteTask,
  onEditTask,
}: WBSGanttViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  const generator = useMemo(
    () => createWBSGenerator(wbsStructure),
    [wbsStructure]
  );

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) =>
      compareWBSCodes(a.wbsCode, b.wbsCode, wbsStructure.separator)
    );
  }, [tasks, wbsStructure.separator]);

  const taskHierarchy = useMemo(() => {
    const hierarchy = new Map<string, TaskWithWBS[]>();

    sortedTasks.forEach(task => {
      const parentCode = task.parentWBSCode || 'root';
      if (!hierarchy.has(parentCode)) {
        hierarchy.set(parentCode, []);
      }
      hierarchy.get(parentCode)!.push(task);
    });

    return hierarchy;
  }, [sortedTasks]);

  const toggleExpand = (wbsCode: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(wbsCode)) {
        next.delete(wbsCode);
      } else {
        next.add(wbsCode);
      }
      return next;
    });
  };

  const hasChildren = (wbsCode: string): boolean => {
    return taskHierarchy.has(wbsCode);
  };

  const getTimelineData = () => {
    if (tasks.length === 0) {
      return {
        minDate: new Date(),
        maxDate: new Date(),
        totalDays: 0,
      };
    }

    const dates = tasks.flatMap(t => [
      new Date(t.startDate),
      new Date(t.endDate),
    ]);

    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    const totalDays = Math.ceil(
      (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return { minDate, maxDate, totalDays };
  };

  const { minDate, maxDate, totalDays } = getTimelineData();

  const calculateBarPosition = (task: TaskWithWBS) => {
    const start = new Date(task.startDate);
    const end = new Date(task.endDate);

    const startDays = Math.floor(
      (start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const duration = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    const left = (startDays / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    return { left: `${left}%`, width: `${Math.max(width, 1)}%` };
  };

  const renderTask = (task: TaskWithWBS, depth: number = 0): JSX.Element[] => {
    const isExpanded = expandedNodes.has(task.wbsCode);
    const children = taskHierarchy.get(task.wbsCode) || [];
    const hasChildTasks = children.length > 0;
    const barPosition = calculateBarPosition(task);

    const elements: JSX.Element[] = [];

    elements.push(
      <div
        key={task.id}
        className={cn(
          'group grid grid-cols-[minmax(400px,1fr)_minmax(600px,2fr)] border-b border-border hover:bg-accent/5 transition-colors',
          hoveredTask === task.id && 'bg-accent/10'
        )}
        onMouseEnter={() => setHoveredTask(task.id)}
        onMouseLeave={() => setHoveredTask(null)}
      >
        <div className="flex items-center gap-2 p-3 border-r border-border">
          <div style={{ paddingLeft: `${depth * 24}px` }} className="flex items-center gap-2 flex-1 min-w-0">
            {hasChildTasks ? (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => toggleExpand(task.wbsCode)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <div className="w-6" />
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="font-mono text-xs shrink-0">
                    {task.wbsCode}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs space-y-1">
                    <div>Level: {getWBSDepth(task.wbsCode, wbsStructure.separator)}</div>
                    <div>Code: {task.wbsCode}</div>
                    {task.parentWBSCode && <div>Parent: {task.parentWBSCode}</div>}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{task.name}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-xs',
                    task.status === 'completed' && 'bg-success/10 text-success',
                    task.status === 'in-progress' && 'bg-accent/10 text-accent',
                    task.status === 'blocked' && 'bg-destructive/10 text-destructive'
                  )}
                >
                  {task.status}
                </Badge>
                {task.isCriticalPath && (
                  <Badge variant="destructive" className="text-xs">
                    Critical
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {task.percentComplete}%
                </span>
              </div>
            </div>
          </div>

          <div className="hidden group-hover:flex items-center gap-1 shrink-0">
            {onAddSubtask && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => onAddSubtask(task)}
                title="Add Subtask"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
            {onAddDependency && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => onAddDependency(task)}
                title="Add Dependency"
              >
                <Link className="h-4 w-4" />
              </Button>
            )}
            {onEditTask && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => onEditTask(task)}
                title="Edit Task"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDeleteTask && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={() => onDeleteTask(task)}
                title="Delete Task"
              >
                <Trash className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="relative p-3 min-h-[60px]">
          <div className="absolute top-1/2 -translate-y-1/2 h-8" style={barPosition}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'h-full rounded cursor-pointer transition-all hover:shadow-lg',
                      task.status === 'completed' && 'bg-success',
                      task.status === 'in-progress' && 'bg-accent',
                      task.status === 'not-started' && 'bg-muted',
                      task.status === 'blocked' && 'bg-destructive',
                      task.isCriticalPath && 'ring-2 ring-destructive ring-offset-1'
                    )}
                    onClick={() => onTaskClick?.(task)}
                  >
                    <div className="relative h-full w-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full bg-foreground/10"
                        style={{ width: `${task.percentComplete}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-white px-2 truncate">
                          {task.name}
                        </span>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs space-y-1">
                    <div className="font-medium">{task.name}</div>
                    <div>Start: {new Date(task.startDate).toLocaleDateString()}</div>
                    <div>End: {new Date(task.endDate).toLocaleDateString()}</div>
                    <div>Progress: {task.percentComplete}%</div>
                    {task.assignedTo && <div>Assigned: {task.assignedTo}</div>}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {task.dependencies && task.dependencies.length > 0 && (
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-accent rounded-full" />
            )}
          </div>
        </div>
      </div>
    );

    if (isExpanded && hasChildTasks) {
      children.forEach(child => {
        elements.push(...renderTask(child, depth + 1));
      });
    }

    return elements;
  };

  const renderTimeline = () => {
    const months: Date[] = [];
    const current = new Date(minDate);
    current.setDate(1);

    while (current <= maxDate) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }

    return (
      <div className="grid grid-cols-[minmax(400px,1fr)_minmax(600px,2fr)] border-b border-border bg-muted/30">
        <div className="p-3 border-r border-border font-medium text-sm">
          Task / WBS Code
        </div>
        <div className="relative p-3">
          <div className="flex">
            {months.map((month, index) => (
              <div
                key={index}
                className="text-xs font-medium text-muted-foreground"
                style={{ width: `${100 / months.length}%` }}
              >
                {month.toLocaleDateString('default', { month: 'short', year: 'numeric' })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const rootTasks = taskHierarchy.get('root') || [];

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">No tasks to display</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {renderTimeline()}
      <div className="overflow-auto max-h-[calc(100vh-300px)]">
        {rootTasks.flatMap(task => renderTask(task, 0))}
      </div>
    </div>
  );
}
