/**
 * Automated Schedule Conflict Detection and Resolution
 * 
 * Detects and resolves scheduling conflicts including:
 * - Resource over-allocation
 * - Dependency violations
 * - Constraint violations
 * - Milestone risks
 */

import type { Task, ResourceAllocation, Resource, ScheduleConflict, Constraint } from './schema'

export interface ConflictDetectionResult {
  conflicts: DetectedConflict[]
  warnings: ScheduleWarning[]
  critical_path_affected: boolean
  recommended_actions: RecommendedAction[]
  auto_resolvable: number
  manual_review_required: number
}

export interface DetectedConflict {
  id: string
  conflict_type: 'resource' | 'dependency' | 'constraint' | 'milestone'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  affected_tasks: string[]
  affected_resources: string[]
  detected_at: string
  impact: {
    schedule_delay_days: number
    cost_impact: number
    critical_path: boolean
  }
  resolution_options: ResolutionOption[]
  auto_resolvable: boolean
}

export interface ScheduleWarning {
  type: 'tight-dependency' | 'resource-constraint' | 'unrealistic-duration' | 'milestone-risk'
  description: string
  task_ids: string[]
  severity: 'info' | 'warning'
}

export interface ResolutionOption {
  strategy: 'reschedule' | 'reallocate-resource' | 'split-task' | 'add-resource' | 'remove-constraint'
  description: string
  impact: {
    schedule_change_days: number
    cost_change: number
    feasibility: number
  }
  steps: string[]
  auto_applicable: boolean
}

export interface RecommendedAction {
  priority: number
  action: string
  rationale: string
  estimated_effort: 'low' | 'medium' | 'high'
}

export class ScheduleConflictDetector {
  /**
   * Run comprehensive conflict detection on project schedule
   */
  static async detectConflicts(
    projectId: string,
    tasks: Task[],
    resourceAllocations: ResourceAllocation[],
    resources: Resource[],
    constraints: Constraint[]
  ): Promise<ConflictDetectionResult> {
    const conflicts: DetectedConflict[] = []
    const warnings: ScheduleWarning[] = []

    const resourceConflicts = this.detectResourceConflicts(tasks, resourceAllocations, resources)
    const dependencyConflicts = this.detectDependencyConflicts(tasks)
    const constraintConflicts = this.detectConstraintViolations(tasks, constraints)
    const milestoneRisks = this.detectMilestoneRisks(tasks)

    conflicts.push(...resourceConflicts, ...dependencyConflicts, ...constraintConflicts, ...milestoneRisks)

    const additionalWarnings = this.generateWarnings(tasks, resourceAllocations)
    warnings.push(...additionalWarnings)

    const criticalPathAffected = conflicts.some(c => c.impact.critical_path)
    const autoResolvable = conflicts.filter(c => c.auto_resolvable).length
    const manualReviewRequired = conflicts.length - autoResolvable

    const recommendedActions = this.generateRecommendedActions(conflicts, warnings)

    return {
      conflicts,
      warnings,
      critical_path_affected: criticalPathAffected,
      recommended_actions: recommendedActions,
      auto_resolvable: autoResolvable,
      manual_review_required: manualReviewRequired,
    }
  }

  /**
   * Detect resource over-allocation conflicts
   */
  private static detectResourceConflicts(
    tasks: Task[],
    resourceAllocations: ResourceAllocation[],
    resources: Resource[]
  ): DetectedConflict[] {
    const conflicts: DetectedConflict[] = []
    const resourceAllocationMap = new Map<string, Map<string, number>>()

    resourceAllocations.forEach(allocation => {
      const taskStart = tasks.find(t => t.id === allocation.task_id)?.start_date
      const taskEnd = tasks.find(t => t.id === allocation.task_id)?.end_date

      if (!taskStart || !taskEnd) return

      const dateRange = this.getDateRange(taskStart, taskEnd)
      
      dateRange.forEach(date => {
        if (!resourceAllocationMap.has(allocation.resource_id)) {
          resourceAllocationMap.set(allocation.resource_id, new Map())
        }
        
        const dateMap = resourceAllocationMap.get(allocation.resource_id)!
        const currentAllocation = dateMap.get(date) || 0
        dateMap.set(date, currentAllocation + allocation.allocation_percent)
      })
    })

    resourceAllocationMap.forEach((dateMap, resourceId) => {
      const resource = resources.find(r => r.id === resourceId)
      if (!resource) return

      const overallocatedDates: string[] = []
      dateMap.forEach((allocation, date) => {
        if (allocation > 100) {
          overallocatedDates.push(date)
        }
      })

      if (overallocatedDates.length > 0) {
        const affectedTasks = resourceAllocations
          .filter(ra => ra.resource_id === resourceId)
          .map(ra => ra.task_id || '')
          .filter(Boolean)

        const affectedTaskData = tasks.filter(t => affectedTasks.includes(t.id))
        const criticalPathAffected = affectedTaskData.some(t => t.is_critical_path)

        conflicts.push({
          id: `resource-conflict-${resourceId}-${Date.now()}`,
          conflict_type: 'resource',
          severity: criticalPathAffected ? 'critical' : 'high',
          description: `Resource "${resource.name}" over-allocated on ${overallocatedDates.length} days`,
          affected_tasks: affectedTasks,
          affected_resources: [resourceId],
          detected_at: new Date().toISOString(),
          impact: {
            schedule_delay_days: overallocatedDates.length,
            cost_impact: 0,
            critical_path: criticalPathAffected,
          },
          resolution_options: this.generateResourceResolutionOptions(resource, affectedTaskData),
          auto_resolvable: false,
        })
      }
    })

    return conflicts
  }

  /**
   * Detect dependency logic conflicts
   */
  private static detectDependencyConflicts(tasks: Task[]): DetectedConflict[] {
    const conflicts: DetectedConflict[] = []

    tasks.forEach(task => {
      task.dependencies.forEach(depId => {
        const predecessor = tasks.find(t => t.id === depId)
        if (!predecessor) return

        const taskStart = new Date(task.start_date)
        const predEnd = new Date(predecessor.end_date)

        if (taskStart < predEnd) {
          conflicts.push({
            id: `dependency-conflict-${task.id}-${depId}`,
            conflict_type: 'dependency',
            severity: task.is_critical_path ? 'critical' : 'high',
            description: `Task "${task.name}" starts before predecessor "${predecessor.name}" finishes`,
            affected_tasks: [task.id, depId],
            affected_resources: [],
            detected_at: new Date().toISOString(),
            impact: {
              schedule_delay_days: Math.ceil((predEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)),
              cost_impact: 0,
              critical_path: task.is_critical_path,
            },
            resolution_options: [
              {
                strategy: 'reschedule',
                description: `Reschedule "${task.name}" to start after "${predecessor.name}" completes`,
                impact: {
                  schedule_change_days: Math.ceil((predEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)),
                  cost_change: 0,
                  feasibility: 0.9,
                },
                steps: [
                  `Update start date of "${task.name}" to ${predEnd.toISOString().split('T')[0]}`,
                  'Recalculate dependent task dates',
                  'Update resource allocations',
                ],
                auto_applicable: true,
              },
            ],
            auto_resolvable: true,
          })
        }
      })
    })

    const circularDeps = this.detectCircularDependencies(tasks)
    circularDeps.forEach(cycle => {
      conflicts.push({
        id: `circular-dep-${cycle.join('-')}`,
        conflict_type: 'dependency',
        severity: 'critical',
        description: `Circular dependency detected: ${cycle.map(id => tasks.find(t => t.id === id)?.name).join(' → ')}`,
        affected_tasks: cycle,
        affected_resources: [],
        detected_at: new Date().toISOString(),
        impact: {
          schedule_delay_days: 0,
          cost_impact: 0,
          critical_path: true,
        },
        resolution_options: [
          {
            strategy: 'remove-constraint',
            description: 'Break circular dependency by removing one link',
            impact: {
              schedule_change_days: 0,
              cost_change: 0,
              feasibility: 0.7,
            },
            steps: [
              'Identify weakest dependency link',
              'Remove or replace with lag constraint',
              'Validate schedule logic',
            ],
            auto_applicable: false,
          },
        ],
        auto_resolvable: false,
      })
    })

    return conflicts
  }

  /**
   * Detect constraint violations
   */
  private static detectConstraintViolations(tasks: Task[], constraints: Constraint[]): DetectedConflict[] {
    const conflicts: DetectedConflict[] = []

    constraints.forEach(constraint => {
      const task = tasks.find(t => t.id === constraint.task_id)
      if (!task) return

      const taskStart = new Date(task.start_date)
      const taskEnd = new Date(task.end_date)
      const constraintDate = new Date(constraint.constraint_date)

      let violated = false
      let description = ''

      switch (constraint.constraint_type) {
        case 'must-start-on':
          if (taskStart.getTime() !== constraintDate.getTime()) {
            violated = true
            description = `Task "${task.name}" must start on ${constraint.constraint_date} but starts on ${task.start_date}`
          }
          break
        case 'must-finish-on':
          if (taskEnd.getTime() !== constraintDate.getTime()) {
            violated = true
            description = `Task "${task.name}" must finish on ${constraint.constraint_date} but finishes on ${task.end_date}`
          }
          break
        case 'start-no-earlier':
          if (taskStart < constraintDate) {
            violated = true
            description = `Task "${task.name}" cannot start before ${constraint.constraint_date} but starts on ${task.start_date}`
          }
          break
        case 'finish-no-later':
          if (taskEnd > constraintDate) {
            violated = true
            description = `Task "${task.name}" must finish by ${constraint.constraint_date} but finishes on ${task.end_date}`
          }
          break
      }

      if (violated) {
        conflicts.push({
          id: `constraint-violation-${constraint.id}`,
          conflict_type: 'constraint',
          severity: task.is_critical_path ? 'critical' : 'high',
          description,
          affected_tasks: [task.id],
          affected_resources: [],
          detected_at: new Date().toISOString(),
          impact: {
            schedule_delay_days: Math.ceil(Math.abs(taskEnd.getTime() - constraintDate.getTime()) / (1000 * 60 * 60 * 24)),
            cost_impact: 0,
            critical_path: task.is_critical_path,
          },
          resolution_options: [
            {
              strategy: 'reschedule',
              description: 'Adjust task dates to meet constraint',
              impact: {
                schedule_change_days: Math.ceil(Math.abs(taskEnd.getTime() - constraintDate.getTime()) / (1000 * 60 * 60 * 24)),
                cost_change: 0,
                feasibility: 0.8,
              },
              steps: [
                'Calculate required date adjustment',
                'Update task dates',
                'Verify constraint satisfaction',
              ],
              auto_applicable: true,
            },
            {
              strategy: 'remove-constraint',
              description: 'Remove or modify constraint if no longer valid',
              impact: {
                schedule_change_days: 0,
                cost_change: 0,
                feasibility: 0.6,
              },
              steps: [
                'Review constraint reason',
                'Obtain approval to remove',
                'Delete or modify constraint',
              ],
              auto_applicable: false,
            },
          ],
          auto_resolvable: false,
        })
      }
    })

    return conflicts
  }

  /**
   * Detect milestone risks
   */
  private static detectMilestoneRisks(tasks: Task[]): DetectedConflict[] {
    const conflicts: DetectedConflict[] = []
    const milestones = tasks.filter(t => t.duration_days === 0)

    milestones.forEach(milestone => {
      const predecessors = tasks.filter(t => milestone.dependencies.includes(t.id))
      const atRiskPredecessors = predecessors.filter(p => {
        const daysToMilestone = Math.ceil(
          (new Date(milestone.start_date).getTime() - new Date(p.end_date).getTime()) / (1000 * 60 * 60 * 24)
        )
        return daysToMilestone < p.slack_days / 2
      })

      if (atRiskPredecessors.length > 0) {
        conflicts.push({
          id: `milestone-risk-${milestone.id}`,
          conflict_type: 'milestone',
          severity: 'high',
          description: `Milestone "${milestone.name}" at risk - ${atRiskPredecessors.length} predecessors have insufficient slack`,
          affected_tasks: [milestone.id, ...atRiskPredecessors.map(p => p.id)],
          affected_resources: [],
          detected_at: new Date().toISOString(),
          impact: {
            schedule_delay_days: Math.max(...atRiskPredecessors.map(p => p.duration_days - p.slack_days)),
            cost_impact: 0,
            critical_path: true,
          },
          resolution_options: [
            {
              strategy: 'add-resource',
              description: 'Add resources to at-risk predecessors to accelerate',
              impact: {
                schedule_change_days: 0,
                cost_change: 5000,
                feasibility: 0.7,
              },
              steps: [
                'Identify tasks that can be accelerated',
                'Calculate resource requirements',
                'Allocate additional resources',
              ],
              auto_applicable: false,
            },
          ],
          auto_resolvable: false,
        })
      }
    })

    return conflicts
  }

  /**
   * Generate resolution options for resource conflicts
   */
  private static generateResourceResolutionOptions(
    resource: Resource,
    affectedTasks: Task[]
  ): ResolutionOption[] {
    return [
      {
        strategy: 'reschedule',
        description: 'Stagger task start dates to prevent overlap',
        impact: {
          schedule_change_days: affectedTasks.length,
          cost_change: 0,
          feasibility: 0.8,
        },
        steps: [
          'Identify non-critical tasks',
          'Delay lower-priority tasks',
          'Recalculate schedule',
        ],
        auto_applicable: false,
      },
      {
        strategy: 'reallocate-resource',
        description: 'Find alternative resource for some tasks',
        impact: {
          schedule_change_days: 0,
          cost_change: 1000,
          feasibility: 0.6,
        },
        steps: [
          'Identify tasks with flexible resource requirements',
          'Find available alternative resources',
          'Update resource allocations',
        ],
        auto_applicable: false,
      },
      {
        strategy: 'add-resource',
        description: `Add second ${resource.resource_type} to increase capacity`,
        impact: {
          schedule_change_days: 0,
          cost_change: 5000,
          feasibility: 0.5,
        },
        steps: [
          'Calculate additional capacity needed',
          'Source and onboard new resource',
          'Redistribute work',
        ],
        auto_applicable: false,
      },
    ]
  }

  /**
   * Generate warnings for potential issues
   */
  private static generateWarnings(tasks: Task[], resourceAllocations: ResourceAllocation[]): ScheduleWarning[] {
    const warnings: ScheduleWarning[] = []

    tasks.forEach(task => {
      if (task.slack_days < 2 && !task.is_critical_path) {
        warnings.push({
          type: 'tight-dependency',
          description: `Task "${task.name}" has only ${task.slack_days} days of slack - at risk of becoming critical`,
          task_ids: [task.id],
          severity: 'warning',
        })
      }

      if (task.duration_days < 1 && task.duration_days > 0) {
        warnings.push({
          type: 'unrealistic-duration',
          description: `Task "${task.name}" has unusually short duration (${task.duration_days} days)`,
          task_ids: [task.id],
          severity: 'info',
        })
      }
    })

    return warnings
  }

  /**
   * Generate prioritized recommended actions
   */
  private static generateRecommendedActions(
    conflicts: DetectedConflict[],
    warnings: ScheduleWarning[]
  ): RecommendedAction[] {
    const actions: RecommendedAction[] = []

    const criticalConflicts = conflicts.filter(c => c.severity === 'critical')
    if (criticalConflicts.length > 0) {
      actions.push({
        priority: 1,
        action: `Resolve ${criticalConflicts.length} critical conflicts immediately`,
        rationale: 'Critical path affected - project delivery at risk',
        estimated_effort: 'high',
      })
    }

    const autoResolvable = conflicts.filter(c => c.auto_resolvable)
    if (autoResolvable.length > 0) {
      actions.push({
        priority: 2,
        action: `Apply auto-resolution to ${autoResolvable.length} conflicts`,
        rationale: 'Quick wins - conflicts can be resolved automatically',
        estimated_effort: 'low',
      })
    }

    const resourceConflicts = conflicts.filter(c => c.conflict_type === 'resource')
    if (resourceConflicts.length > 3) {
      actions.push({
        priority: 3,
        action: 'Review resource capacity planning',
        rationale: 'Multiple resource conflicts indicate capacity issues',
        estimated_effort: 'medium',
      })
    }

    return actions.sort((a, b) => a.priority - b.priority)
  }

  /**
   * Detect circular dependencies using DFS
   */
  private static detectCircularDependencies(tasks: Task[]): string[][] {
    const cycles: string[][] = []
    const visited = new Set<string>()
    const recStack = new Set<string>()

    const dfs = (taskId: string, path: string[]) => {
      visited.add(taskId)
      recStack.add(taskId)
      path.push(taskId)

      const task = tasks.find(t => t.id === taskId)
      if (task) {
        for (const depId of task.dependencies) {
          if (!visited.has(depId)) {
            dfs(depId, [...path])
          } else if (recStack.has(depId)) {
            const cycleStart = path.indexOf(depId)
            cycles.push(path.slice(cycleStart))
          }
        }
      }

      recStack.delete(taskId)
    }

    tasks.forEach(task => {
      if (!visited.has(task.id)) {
        dfs(task.id, [])
      }
    })

    return cycles
  }

  /**
   * Get date range between two dates
   */
  private static getDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = []
    const current = new Date(startDate)
    const end = new Date(endDate)

    while (current <= end) {
      dates.push(current.toISOString().split('T')[0])
      current.setDate(current.getDate() + 1)
    }

    return dates
  }

  /**
   * Auto-resolve conflicts where possible
   */
  static async autoResolveConflicts(
    conflicts: DetectedConflict[],
    tasks: Task[]
  ): Promise<{ resolved: DetectedConflict[]; failed: DetectedConflict[] }> {
    const resolved: DetectedConflict[] = []
    const failed: DetectedConflict[] = []

    for (const conflict of conflicts) {
      if (!conflict.auto_resolvable) {
        failed.push(conflict)
        continue
      }

      const autoOption = conflict.resolution_options.find(opt => opt.auto_applicable)
      if (!autoOption) {
        failed.push(conflict)
        continue
      }

      try {
        await this.applyResolution(conflict, autoOption, tasks)
        resolved.push(conflict)
      } catch (error) {
        failed.push(conflict)
      }
    }

    return { resolved, failed }
  }

  /**
   * Apply resolution strategy
   */
  private static async applyResolution(
    conflict: DetectedConflict,
    resolution: ResolutionOption,
    tasks: Task[]
  ): Promise<void> {
    switch (resolution.strategy) {
      case 'reschedule':
        if (conflict.conflict_type === 'dependency') {
          const task = tasks.find(t => t.id === conflict.affected_tasks[0])
          const predecessor = tasks.find(t => t.id === conflict.affected_tasks[1])
          
          if (task && predecessor) {
            const newStartDate = new Date(predecessor.end_date)
            newStartDate.setDate(newStartDate.getDate() + 1)
            
            task.start_date = newStartDate.toISOString().split('T')[0]
            const newEndDate = new Date(newStartDate)
            newEndDate.setDate(newEndDate.getDate() + task.duration_days)
            task.end_date = newEndDate.toISOString().split('T')[0]
          }
        }
        break

      default:
        break
    }
  }
}
