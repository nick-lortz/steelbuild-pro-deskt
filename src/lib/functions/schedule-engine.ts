import type { Task } from '../types'

export interface TaskDependency {
  taskId: string
  predecessorId: string
  type: 'FS' | 'SS' | 'FF' | 'SF'
  lag: number
}

export interface ScheduleComputation {
  tasks: Task[]
  criticalPath: string[]
  totalFloat: Record<string, number>
  topologicalOrder: string[]
  longestPath: number
  scheduleHealth: number
  conflicts: Array<{
    taskId: string
    type: 'circular-dependency' | 'invalid-date' | 'constraint-violation'
    message: string
  }>
}

export interface LookaheadWindow {
  startDate: string
  endDate: string
  tasks: Array<{
    task: Task
    readiness: 'ready' | 'at-risk' | 'blocked'
    blockers: string[]
    predecessorsComplete: boolean
    materialsReady: boolean
    resourcesAvailable: boolean
  }>
  milestones: Task[]
  resourceDemand: Record<string, number>
}

export function buildDependencyGraph(tasks: Task[]): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>()
  
  tasks.forEach(task => {
    if (!graph.has(task.id)) {
      graph.set(task.id, new Set())
    }
    
    if (task.dependencies && task.dependencies.length > 0) {
      task.dependencies.forEach(depId => {
        const pred = tasks.find(t => t.id === depId)
        if (pred) {
          graph.get(task.id)!.add(depId)
        }
      })
    }
  })
  
  return graph
}

export function detectCircularDependencies(graph: Map<string, Set<string>>): string[][] {
  const cycles: string[][] = []
  const visited = new Set<string>()
  const recursionStack = new Set<string>()
  const path: string[] = []
  
  function dfs(node: string): boolean {
    visited.add(node)
    recursionStack.add(node)
    path.push(node)
    
    const neighbors = graph.get(node) || new Set()
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true
      } else if (recursionStack.has(neighbor)) {
        const cycleStart = path.indexOf(neighbor)
        cycles.push([...path.slice(cycleStart)])
        return true
      }
    }
    
    path.pop()
    recursionStack.delete(node)
    return false
  }
  
  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      dfs(node)
    }
  }
  
  return cycles
}

export function topologicalSort(tasks: Task[]): string[] {
  const graph = buildDependencyGraph(tasks)
  const inDegree = new Map<string, number>()
  const result: string[] = []
  
  tasks.forEach(task => {
    inDegree.set(task.id, 0)
  })
  
  graph.forEach((predecessors, taskId) => {
    predecessors.forEach(predId => {
      inDegree.set(taskId, (inDegree.get(taskId) || 0) + 1)
    })
  })
  
  const queue: string[] = []
  inDegree.forEach((degree, taskId) => {
    if (degree === 0) {
      queue.push(taskId)
    }
  })
  
  while (queue.length > 0) {
    const current = queue.shift()!
    result.push(current)
    
    tasks.forEach(task => {
      if (task.dependencies?.includes(current)) {
        const newDegree = (inDegree.get(task.id) || 0) - 1
        inDegree.set(task.id, newDegree)
        if (newDegree === 0) {
          queue.push(task.id)
        }
      }
    })
  }
  
  return result
}

export function calculateEarliestStartFinish(tasks: Task[]): {
  earliestStart: Record<string, number>
  earliestFinish: Record<string, number>
} {
  const earliestStart: Record<string, number> = {}
  const earliestFinish: Record<string, number> = {}
  const topoOrder = topologicalSort(tasks)
  const taskMap = new Map(tasks.map(t => [t.id, t]))
  
  topoOrder.forEach(taskId => {
    const task = taskMap.get(taskId)!
    const duration = calculateBusinessDays(new Date(task.startDate), new Date(task.endDate))
    
    let maxPredFinish = 0
    if (task.dependencies && task.dependencies.length > 0) {
      task.dependencies.forEach(predId => {
        const predFinish = earliestFinish[predId] || 0
        maxPredFinish = Math.max(maxPredFinish, predFinish)
      })
    }
    
    earliestStart[taskId] = maxPredFinish
    earliestFinish[taskId] = maxPredFinish + duration
  })
  
  return { earliestStart, earliestFinish }
}

export function calculateLatestStartFinish(
  tasks: Task[],
  earliestFinish: Record<string, number>
): {
  latestStart: Record<string, number>
  latestFinish: Record<string, number>
} {
  const latestStart: Record<string, number> = {}
  const latestFinish: Record<string, number> = {}
  const topoOrder = topologicalSort(tasks).reverse()
  const taskMap = new Map(tasks.map(t => [t.id, t]))
  
  const projectEnd = Math.max(...Object.values(earliestFinish))
  
  topoOrder.forEach(taskId => {
    const task = taskMap.get(taskId)!
    const duration = calculateBusinessDays(new Date(task.startDate), new Date(task.endDate))
    
    const successors = tasks.filter(t => t.dependencies?.includes(taskId))
    
    let minSuccStart = projectEnd
    if (successors.length > 0) {
      successors.forEach(succ => {
        const succStart = latestStart[succ.id]
        if (succStart !== undefined) {
          minSuccStart = Math.min(minSuccStart, succStart)
        }
      })
    }
    
    latestFinish[taskId] = minSuccStart
    latestStart[taskId] = minSuccStart - duration
  })
  
  return { latestStart, latestFinish }
}

export function calculateTotalFloat(
  earliestStart: Record<string, number>,
  latestStart: Record<string, number>
): Record<string, number> {
  const totalFloat: Record<string, number> = {}
  
  Object.keys(earliestStart).forEach(taskId => {
    totalFloat[taskId] = latestStart[taskId] - earliestStart[taskId]
  })
  
  return totalFloat
}

export function findCriticalPath(tasks: Task[]): string[] {
  const { earliestStart, earliestFinish } = calculateEarliestStartFinish(tasks)
  const { latestStart } = calculateLatestStartFinish(tasks, earliestFinish)
  const totalFloat = calculateTotalFloat(earliestStart, latestStart)
  
  const criticalTasks = Object.entries(totalFloat)
    .filter(([_, float]) => Math.abs(float) < 0.001)
    .map(([taskId]) => taskId)
  
  return criticalTasks
}

export function calculateBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0
  const current = new Date(startDate)
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++
    }
    current.setDate(current.getDate() + 1)
  }
  
  return count
}

export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date)
  let remaining = days
  
  while (remaining > 0) {
    result.setDate(result.getDate() + 1)
    const dayOfWeek = result.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      remaining--
    }
  }
  
  return result
}

export function computeSchedule(tasks: Task[]): ScheduleComputation {
  const graph = buildDependencyGraph(tasks)
  const cycles = detectCircularDependencies(graph)
  const conflicts: ScheduleComputation['conflicts'] = []
  
  cycles.forEach(cycle => {
    cycle.forEach(taskId => {
      conflicts.push({
        taskId,
        type: 'circular-dependency',
        message: `Task is part of circular dependency: ${cycle.join(' → ')}`,
      })
    })
  })
  
  tasks.forEach(task => {
    const startDate = new Date(task.startDate)
    const endDate = new Date(task.endDate)
    
    if (startDate > endDate) {
      conflicts.push({
        taskId: task.id,
        type: 'invalid-date',
        message: 'Start date is after end date',
      })
    }
    
    if (task.dependencies && task.dependencies.length > 0) {
      task.dependencies.forEach(depId => {
        const predecessor = tasks.find(t => t.id === depId)
        if (predecessor) {
          const predEnd = new Date(predecessor.endDate)
          if (predEnd > startDate) {
            conflicts.push({
              taskId: task.id,
              type: 'constraint-violation',
              message: `Start date violates finish-to-start dependency with ${predecessor.name}`,
            })
          }
        }
      })
    }
  })
  
  const criticalPath = findCriticalPath(tasks)
  const { earliestStart, earliestFinish } = calculateEarliestStartFinish(tasks)
  const { latestStart } = calculateLatestStartFinish(tasks, earliestFinish)
  const totalFloat = calculateTotalFloat(earliestStart, latestStart)
  const topologicalOrder = topologicalSort(tasks)
  
  const longestPath = Math.max(...Object.values(earliestFinish))
  
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const totalTasks = tasks.length
  const tasksOnTime = tasks.filter(t => {
    if (t.status !== 'completed') return true
    const endDate = new Date(t.endDate)
    return endDate >= new Date()
  }).length
  
  const scheduleHealth = totalTasks > 0 ? ((tasksOnTime / totalTasks) * 100) : 100
  
  return {
    tasks: tasks.map(task => ({
      ...task,
      isCriticalPath: criticalPath.includes(task.id),
      totalFloat: totalFloat[task.id] || 0,
      earliestStart: earliestStart[task.id] || 0,
      earliestFinish: earliestFinish[task.id] || 0,
      latestStart: latestStart[task.id] || 0,
    })),
    criticalPath,
    totalFloat,
    topologicalOrder,
    longestPath,
    scheduleHealth,
    conflicts,
  }
}

export function generateLookahead(
  tasks: Task[],
  weekCount: 2 | 6 = 2
): LookaheadWindow {
  const now = new Date()
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + (weekCount * 7))
  
  const lookaheadTasks = tasks.filter(task => {
    const taskStart = new Date(task.startDate)
    const taskEnd = new Date(task.endDate)
    return (taskStart >= now && taskStart <= endDate) || 
           (taskEnd >= now && taskEnd <= endDate) ||
           (taskStart <= now && taskEnd >= endDate)
  })
  
  const milestones = lookaheadTasks.filter(task => task.type === 'milestone')
  
  const tasksWithReadiness = lookaheadTasks.map(task => {
    const blockers: string[] = []
    let predecessorsComplete = true
    
    if (task.dependencies && task.dependencies.length > 0) {
      task.dependencies.forEach(depId => {
        const predecessor = tasks.find(t => t.id === depId)
        if (predecessor && predecessor.status !== 'completed') {
          predecessorsComplete = false
          blockers.push(`Waiting for: ${predecessor.name}`)
        }
      })
    }
    
    const materialsReady = true
    const resourcesAvailable = true
    
    let readiness: 'ready' | 'at-risk' | 'blocked'
    if (!predecessorsComplete || blockers.length > 0) {
      readiness = 'blocked'
    } else if (!materialsReady || !resourcesAvailable) {
      readiness = 'at-risk'
    } else {
      readiness = 'ready'
    }
    
    return {
      task,
      readiness,
      blockers,
      predecessorsComplete,
      materialsReady,
      resourcesAvailable,
    }
  })
  
  const resourceDemand: Record<string, number> = {}
  
  return {
    startDate: now.toISOString(),
    endDate: endDate.toISOString(),
    tasks: tasksWithReadiness,
    milestones,
    resourceDemand,
  }
}

export interface BaselineComparison {
  task: Task
  variance: {
    startDays: number
    endDays: number
    durationDays: number
  }
  status: 'on-track' | 'ahead' | 'behind'
}

export function compareToBaseline(tasks: Task[]): BaselineComparison[] {
  return tasks
    .filter(task => task.baselineStartDate && task.baselineEndDate)
    .map(task => {
      const currentStart = new Date(task.startDate)
      const baselineStart = new Date(task.baselineStartDate!)
      const currentEnd = new Date(task.endDate)
      const baselineEnd = new Date(task.baselineEndDate!)
      
      const startVarianceDays = (currentStart.getTime() - baselineStart.getTime()) / (1000 * 60 * 60 * 24)
      const endVarianceDays = (currentEnd.getTime() - baselineEnd.getTime()) / (1000 * 60 * 60 * 24)
      
      const currentDuration = calculateBusinessDays(currentStart, currentEnd)
      const baselineDuration = calculateBusinessDays(baselineStart, baselineEnd)
      const durationVariance = currentDuration - baselineDuration
      
      let status: 'on-track' | 'ahead' | 'behind'
      if (Math.abs(endVarianceDays) <= 1) {
        status = 'on-track'
      } else if (endVarianceDays < 0) {
        status = 'ahead'
      } else {
        status = 'behind'
      }
      
      return {
        task,
        variance: {
          startDays: startVarianceDays,
          endDays: endVarianceDays,
          durationDays: durationVariance,
        },
        status,
      }
    })
}

export async function createScheduleBaseline(
  projectId: string,
  name: string,
  description?: string
): Promise<void> {
  const tasks = await spark.kv.get<Task[]>(`schedule-tasks-${projectId}`) || []
  
  const baseline = {
    id: crypto.randomUUID(),
    projectId,
    name,
    description: description || '',
    baselineDate: new Date().toISOString(),
    tasks: tasks.map(task => ({
      id: task.id,
      name: task.name,
      startDate: task.startDate,
      endDate: task.endDate,
      status: task.status,
      dependencies: task.dependencies || [],
    })),
    createdAt: new Date().toISOString(),
  }
  
  const baselines = await spark.kv.get<any[]>(`schedule-baselines-${projectId}`) || []
  await spark.kv.set(`schedule-baselines-${projectId}`, [...baselines, baseline])
  
  const updatedTasks = tasks.map(task => ({
    ...task,
    baselineStartDate: task.startDate,
    baselineEndDate: task.endDate,
  }))
  await spark.kv.set(`schedule-tasks-${projectId}`, updatedTasks)
}
