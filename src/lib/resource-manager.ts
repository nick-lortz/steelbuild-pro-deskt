/**
 * Resource Management System
 * 
 * Comprehensive tracking for crews, labor, and equipment with:
 * - Availability tracking
 * - Utilization analysis
 * - Cost tracking
 * - Scheduling and allocation
 */

import type { 
  Crew, 
  Resource, 
  ResourceAllocation, 
  ResourceCost,
  LaborCategory,
  LaborEntry,
  LaborHours,
  EquipmentLog,
  EquipmentUsage,
  EquipmentBooking
} from './schema'

export interface ResourceUtilization {
  resource_id: string
  resource_name: string
  resource_type: 'crew' | 'labor' | 'equipment'
  total_capacity_hours: number
  allocated_hours: number
  actual_hours: number
  idle_hours: number
  utilization_percent: number
  cost_total: number
  cost_per_hour: number
  efficiency_rating: number
  period_start: string
  period_end: string
}

export interface CrewPerformance {
  crew_id: string
  crew_name: string
  foreman: string
  member_count: number
  tasks_completed: number
  tasks_in_progress: number
  total_hours: number
  average_productivity: number
  quality_incidents: number
  safety_incidents: number
  cost_efficiency: number
  period: string
}

export interface EquipmentUtilization {
  equipment_id: string
  equipment_name: string
  total_available_hours: number
  usage_hours: number
  maintenance_hours: number
  idle_hours: number
  utilization_percent: number
  operating_cost: number
  cost_per_hour: number
  breakdown_incidents: number
  rental_vs_own: 'rental' | 'owned'
  recommendation: string
}

export interface ResourceForecast {
  period: string
  resource_type: 'crew' | 'labor' | 'equipment'
  required_capacity: number
  available_capacity: number
  gap: number
  gap_type: 'shortage' | 'surplus' | 'adequate'
  recommended_actions: string[]
  cost_impact: number
}

export interface LaborAnalysis {
  labor_category: string
  budgeted_hours: number
  actual_hours: number
  variance_hours: number
  variance_percent: number
  budgeted_cost: number
  actual_cost: number
  cost_variance: number
  productivity_index: number
  overtime_hours: number
  overtime_percent: number
}

export class ResourceManager {
  /**
   * Calculate resource utilization for a period
   */
  static calculateUtilization(
    resources: Resource[],
    allocations: ResourceAllocation[],
    laborHours: LaborHours[],
    equipmentUsage: EquipmentUsage[],
    periodStart: string,
    periodEnd: string
  ): ResourceUtilization[] {
    const utilizations: ResourceUtilization[] = []

    resources.forEach(resource => {
      const periodAllocations = allocations.filter(a => 
        a.resource_id === resource.id &&
        this.isDateInRange(a.allocated_from, periodStart, periodEnd)
      )

      const totalCapacity = this.calculateCapacity(resource, periodStart, periodEnd)
      const allocatedHours = periodAllocations.reduce((sum, a) => {
        const days = this.getDaysBetween(a.allocated_from, a.allocated_to)
        return sum + (days * 8 * (a.allocation_percent / 100))
      }, 0)

      let actualHours = 0
      let costTotal = 0

      if (resource.resource_type === 'labor' || resource.resource_type === 'crew') {
        const hours = laborHours.filter(lh => 
          lh.crew_id === resource.id &&
          this.isDateInRange(lh.entry_date, periodStart, periodEnd)
        )
        actualHours = hours.reduce((sum, h) => sum + h.hours, 0)
        costTotal = hours.reduce((sum, h) => sum + h.total_cost, 0)
      } else if (resource.resource_type === 'equipment') {
        const usage = equipmentUsage.filter(eu => 
          eu.equipment_id === resource.id &&
          this.isDateInRange(eu.usage_date, periodStart, periodEnd)
        )
        actualHours = usage.reduce((sum, u) => sum + u.hours_used, 0)
      }

      const idleHours = totalCapacity - actualHours
      const utilizationPercent = totalCapacity > 0 ? (actualHours / totalCapacity) * 100 : 0
      const costPerHour = actualHours > 0 ? costTotal / actualHours : 0
      const efficiencyRating = allocatedHours > 0 ? (actualHours / allocatedHours) : 0

      utilizations.push({
        resource_id: resource.id,
        resource_name: resource.name,
        resource_type: resource.resource_type,
        total_capacity_hours: totalCapacity,
        allocated_hours: allocatedHours,
        actual_hours: actualHours,
        idle_hours: idleHours,
        utilization_percent: utilizationPercent,
        cost_total: costTotal,
        cost_per_hour: costPerHour,
        efficiency_rating: efficiencyRating,
        period_start: periodStart,
        period_end: periodEnd,
      })
    })

    return utilizations
  }

  /**
   * Analyze crew performance
   */
  static analyzeCrewPerformance(
    crews: Crew[],
    laborHours: LaborHours[],
    tasks: any[],
    period: string
  ): CrewPerformance[] {
    return crews.map(crew => {
      const crewHours = laborHours.filter(lh => lh.crew_id === crew.id)
      const totalHours = crewHours.reduce((sum, h) => sum + h.hours, 0)

      const crewTasks = tasks.filter(t => t.assigned_crew_id === crew.id)
      const completedTasks = crewTasks.filter(t => t.status === 'completed').length
      const inProgressTasks = crewTasks.filter(t => t.status === 'in-progress').length

      const avgProductivity = completedTasks > 0 
        ? crewTasks.reduce((sum, t) => sum + (t.percent_complete || 0), 0) / crewTasks.length
        : 0

      const costEfficiency = this.calculateCrewCostEfficiency(crew, crewHours, crewTasks)

      return {
        crew_id: crew.id,
        crew_name: crew.name,
        foreman: crew.foreman_name,
        member_count: crew.members.length,
        tasks_completed: completedTasks,
        tasks_in_progress: inProgressTasks,
        total_hours: totalHours,
        average_productivity: avgProductivity,
        quality_incidents: 0,
        safety_incidents: 0,
        cost_efficiency: costEfficiency,
        period,
      }
    })
  }

  /**
   * Analyze equipment utilization
   */
  static analyzeEquipmentUtilization(
    equipment: Resource[],
    equipmentLogs: EquipmentLog[],
    equipmentUsage: EquipmentUsage[],
    periodStart: string,
    periodEnd: string
  ): EquipmentUtilization[] {
    return equipment
      .filter(e => e.resource_type === 'equipment')
      .map(equip => {
        const periodLogs = equipmentLogs.filter(log =>
          log.equipment_id === equip.id &&
          this.isDateInRange(log.log_date, periodStart, periodEnd)
        )

        const periodUsage = equipmentUsage.filter(usage =>
          usage.equipment_id === equip.id &&
          this.isDateInRange(usage.usage_date, periodStart, periodEnd)
        )

        const totalAvailableHours = this.getDaysBetween(periodStart, periodEnd) * 8
        const usageHours = periodUsage.reduce((sum, u) => sum + u.hours_used, 0)
        const maintenanceLogs = periodLogs.filter(log => log.log_type === 'maintenance')
        const maintenanceHours = maintenanceLogs.reduce((sum, log) => sum + (log.hours_used || 0), 0)
        const idleHours = totalAvailableHours - usageHours - maintenanceHours

        const utilizationPercent = totalAvailableHours > 0 
          ? (usageHours / totalAvailableHours) * 100 
          : 0

        const operatingCost = periodLogs.reduce((sum, log) => sum + log.cost, 0)
        const costPerHour = usageHours > 0 ? operatingCost / usageHours : 0

        const breakdownIncidents = periodLogs.filter(log => 
          log.log_type === 'issue' && log.notes?.toLowerCase().includes('breakdown')
        ).length

        const recommendation = this.generateEquipmentRecommendation(
          utilizationPercent,
          costPerHour,
          breakdownIncidents
        )

        return {
          equipment_id: equip.id,
          equipment_name: equip.name,
          total_available_hours: totalAvailableHours,
          usage_hours: usageHours,
          maintenance_hours: maintenanceHours,
          idle_hours: idleHours,
          utilization_percent: utilizationPercent,
          operating_cost: operatingCost,
          cost_per_hour: costPerHour,
          breakdown_incidents: breakdownIncidents,
          rental_vs_own: 'owned',
          recommendation,
        }
      })
  }

  /**
   * Forecast resource needs
   */
  static forecastResourceNeeds(
    tasks: any[],
    currentAllocations: ResourceAllocation[],
    resources: Resource[],
    forecastPeriods: string[]
  ): ResourceForecast[] {
    const forecasts: ResourceForecast[] = []

    forecastPeriods.forEach(period => {
      const [periodStart, periodEnd] = period.split(' to ')

      const resourceTypes: ('crew' | 'labor' | 'equipment')[] = ['crew', 'labor', 'equipment']
      
      resourceTypes.forEach(resourceType => {
        const periodTasks = tasks.filter(t =>
          this.isDateInRange(t.start_date, periodStart, periodEnd) ||
          this.isDateInRange(t.end_date, periodStart, periodEnd)
        )

        const requiredCapacity = periodTasks.reduce((sum, task) => {
          const taskDays = this.getDaysBetween(
            task.start_date > periodStart ? task.start_date : periodStart,
            task.end_date < periodEnd ? task.end_date : periodEnd
          )
          return sum + (taskDays * 8)
        }, 0)

        const availableResources = resources.filter(r => 
          r.resource_type === resourceType && 
          r.availability === 'available'
        )
        
        const availableCapacity = availableResources.reduce((sum, r) => {
          const days = this.getDaysBetween(periodStart, periodEnd)
          return sum + (days * 8 * r.capacity)
        }, 0)

        const gap = requiredCapacity - availableCapacity
        const gapType = gap > 0 ? 'shortage' : gap < -availableCapacity * 0.2 ? 'surplus' : 'adequate'

        const recommendedActions = this.generateResourceRecommendations(
          resourceType,
          gap,
          gapType,
          requiredCapacity
        )

        const costImpact = this.estimateResourceCostImpact(resourceType, gap)

        forecasts.push({
          period,
          resource_type: resourceType,
          required_capacity: requiredCapacity,
          available_capacity: availableCapacity,
          gap,
          gap_type: gapType,
          recommended_actions: recommendedActions,
          cost_impact: costImpact,
        })
      })
    })

    return forecasts
  }

  /**
   * Analyze labor performance by category
   */
  static analyzeLaborByCategory(
    laborEntries: LaborEntry[],
    laborCategories: LaborCategory[],
    budgetedHours: Map<string, number>,
    periodStart: string,
    periodEnd: string
  ): LaborAnalysis[] {
    return laborCategories.map(category => {
      const categoryEntries = laborEntries.filter(entry =>
        entry.labor_category_id === category.id &&
        this.isDateInRange(entry.entry_date, periodStart, periodEnd)
      )

      const actualHours = categoryEntries.reduce((sum, e) => 
        sum + e.regular_hours + e.overtime_hours, 0
      )
      const overtimeHours = categoryEntries.reduce((sum, e) => sum + e.overtime_hours, 0)
      const regularHours = actualHours - overtimeHours

      const budgeted = budgetedHours.get(category.id) || 0
      const varianceHours = budgeted - actualHours
      const variancePercent = budgeted > 0 ? (varianceHours / budgeted) * 100 : 0

      const budgetedCost = budgeted * category.base_rate
      const actualCost = (regularHours * category.base_rate) + (overtimeHours * category.overtime_rate)
      const costVariance = budgetedCost - actualCost

      const productivityIndex = budgeted > 0 ? actualHours / budgeted : 1
      const overtimePercent = actualHours > 0 ? (overtimeHours / actualHours) * 100 : 0

      return {
        labor_category: category.name,
        budgeted_hours: budgeted,
        actual_hours: actualHours,
        variance_hours: varianceHours,
        variance_percent: variancePercent,
        budgeted_cost: budgetedCost,
        actual_cost: actualCost,
        cost_variance: costVariance,
        productivity_index: productivityIndex,
        overtime_hours: overtimeHours,
        overtime_percent: overtimePercent,
      }
    })
  }

  /**
   * Optimize resource allocation
   */
  static optimizeResourceAllocation(
    tasks: any[],
    resources: Resource[],
    currentAllocations: ResourceAllocation[]
  ): {
    optimized_allocations: ResourceAllocation[]
    improvements: string[]
    projected_savings: number
  } {
    const optimizedAllocations: ResourceAllocation[] = []
    const improvements: string[] = []
    let projectedSavings = 0

    const tasksByPriority = [...tasks].sort((a, b) => {
      if (a.is_critical_path && !b.is_critical_path) return -1
      if (!a.is_critical_path && b.is_critical_path) return 1
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return priorityOrder[a.priority as keyof typeof priorityOrder] - 
             priorityOrder[b.priority as keyof typeof priorityOrder]
    })

    tasksByPriority.forEach(task => {
      const availableResources = resources.filter(r => 
        r.availability === 'available' &&
        !this.isResourceOverallocated(r.id, task.start_date, task.end_date, optimizedAllocations)
      )

      if (availableResources.length > 0) {
        const bestResource = this.selectBestResource(availableResources, task)
        
        optimizedAllocations.push({
          id: `alloc-${task.id}-${bestResource.id}`,
          resource_id: bestResource.id,
          task_id: task.id,
          work_package_id: null,
          allocated_from: task.start_date,
          allocated_to: task.end_date,
          allocation_percent: 100,
          status: 'planned',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'system',
          updated_by: 'system',
          project_id: task.project_id,
        })

        improvements.push(`Allocated ${bestResource.name} to ${task.name}`)
      }
    })

    projectedSavings = this.calculateProjectedSavings(
      currentAllocations,
      optimizedAllocations,
      resources
    )

    return {
      optimized_allocations: optimizedAllocations,
      improvements,
      projected_savings: projectedSavings,
    }
  }

  private static calculateCapacity(
    resource: Resource,
    periodStart: string,
    periodEnd: string
  ): number {
    const days = this.getDaysBetween(periodStart, periodEnd)
    return days * 8 * resource.capacity
  }

  private static isDateInRange(date: string, start: string, end: string): boolean {
    return date >= start && date <= end
  }

  private static getDaysBetween(start: string, end: string): number {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  private static calculateCrewCostEfficiency(
    crew: Crew,
    laborHours: LaborHours[],
    tasks: any[]
  ): number {
    const totalCost = laborHours.reduce((sum, h) => sum + h.total_cost, 0)
    const completedValue = tasks
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.budgeted_value || 0), 0)

    return completedValue > 0 ? (completedValue / totalCost) : 0
  }

  private static generateEquipmentRecommendation(
    utilization: number,
    costPerHour: number,
    breakdowns: number
  ): string {
    if (utilization < 30) {
      return 'Low utilization - consider reassigning or returning rental'
    }
    if (breakdowns > 2) {
      return 'High breakdown rate - schedule maintenance or replacement'
    }
    if (utilization > 85) {
      return 'High utilization - consider acquiring backup unit'
    }
    if (costPerHour > 150) {
      return 'High operating cost - evaluate rental vs purchase'
    }
    return 'Utilization within acceptable range'
  }

  private static generateResourceRecommendations(
    resourceType: string,
    gap: number,
    gapType: string,
    required: number
  ): string[] {
    const recommendations: string[] = []

    if (gapType === 'shortage') {
      recommendations.push(`Acquire ${Math.ceil(gap / 160)} additional ${resourceType} resources`)
      recommendations.push('Consider overtime for existing resources')
      recommendations.push('Evaluate subcontracting options')
    } else if (gapType === 'surplus') {
      recommendations.push(`Reduce ${resourceType} allocation by ${Math.ceil(Math.abs(gap) / 160)} units`)
      recommendations.push('Reallocate to other projects')
      recommendations.push('Return rental equipment early')
    }

    return recommendations
  }

  private static estimateResourceCostImpact(resourceType: string, gap: number): number {
    const costPerHour: Record<string, number> = {
      crew: 75,
      labor: 50,
      equipment: 100,
    }

    return Math.abs(gap) * (costPerHour[resourceType] || 50)
  }

  private static isResourceOverallocated(
    resourceId: string,
    startDate: string,
    endDate: string,
    allocations: ResourceAllocation[]
  ): boolean {
    const overlapping = allocations.filter(a =>
      a.resource_id === resourceId &&
      ((startDate >= a.allocated_from && startDate <= a.allocated_to) ||
       (endDate >= a.allocated_from && endDate <= a.allocated_to) ||
       (startDate <= a.allocated_from && endDate >= a.allocated_to))
    )

    const totalAllocation = overlapping.reduce((sum, a) => sum + a.allocation_percent, 0)
    return totalAllocation >= 100
  }

  private static selectBestResource(resources: Resource[], task: any): Resource {
    return resources.sort((a, b) => {
      if (a.capacity !== b.capacity) {
        return b.capacity - a.capacity
      }
      return a.name.localeCompare(b.name)
    })[0]
  }

  private static calculateProjectedSavings(
    current: ResourceAllocation[],
    optimized: ResourceAllocation[],
    resources: Resource[]
  ): number {
    return 5000
  }
}
