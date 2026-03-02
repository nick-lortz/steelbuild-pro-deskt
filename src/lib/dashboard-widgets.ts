/**
 * Custom Dashboard Widgets for Executive Portfolio Insights
 * 
 * Provides configurable widgets for executive dashboards with:
 * - Portfolio health metrics
 * - Financial summaries
 * - Schedule performance
 * - Risk alerts
 * - Custom visualizations
 */

import type { DashboardWidget, Project } from './schema'

export interface PortfolioHealthMetrics {
  total_projects: number
  active_projects: number
  on_schedule: number
  schedule_at_risk: number
  schedule_delayed: number
  on_budget: number
  budget_at_risk: number
  budget_overrun: number
  total_contract_value: number
  total_actual_cost: number
  portfolio_margin: number
  portfolio_margin_percent: number
  average_schedule_health: number
  average_cost_health: number
  critical_issues: number
  high_priority_rfis: number
}

export interface ProjectHealthCard {
  project_id: string
  project_name: string
  project_number: string
  health_score: number
  health_status: 'excellent' | 'good' | 'warning' | 'critical'
  schedule_variance_days: number
  cost_variance: number
  cost_variance_percent: number
  open_issues: number
  last_updated: string
  quick_actions: {
    label: string
    url: string
    urgent: boolean
  }[]
}

export interface ExecutiveSummary {
  period: string
  generated_at: string
  highlights: {
    type: 'success' | 'warning' | 'critical' | 'info'
    title: string
    description: string
    metric?: string | number
  }[]
  key_metrics: {
    label: string
    value: number | string
    change_from_last_period: number
    change_type: 'increase' | 'decrease' | 'stable'
    status: 'good' | 'neutral' | 'bad'
  }[]
  projects_requiring_attention: ProjectHealthCard[]
  recommendations: string[]
}

export interface WidgetConfiguration {
  widget_id: string
  widget_type: 'portfolio-health' | 'cost-summary' | 'schedule-status' | 'risk-alerts' | 'custom-chart'
  title: string
  data_source: string
  filters: {
    project_status?: string[]
    date_range?: { start: string; end: string }
    cost_threshold?: number
  }
  visualization: {
    chart_type: 'bar' | 'line' | 'pie' | 'gauge' | 'table' | 'card'
    color_scheme: string[]
    show_legend: boolean
  }
  refresh_interval_minutes: number
  alert_thresholds?: {
    warning: number
    critical: number
  }
}

export class DashboardWidgetManager {
  /**
   * Calculate comprehensive portfolio health metrics
   */
  static calculatePortfolioHealth(
    projects: Project[],
    projectMetrics: Map<string, any>
  ): PortfolioHealthMetrics {
    const activeProjects = projects.filter(p => p.status === 'active')
    
    let onSchedule = 0
    let scheduleAtRisk = 0
    let scheduleDelayed = 0
    let onBudget = 0
    let budgetAtRisk = 0
    let budgetOverrun = 0
    let totalScheduleHealth = 0
    let totalCostHealth = 0
    let criticalIssues = 0
    let highPriorityRfis = 0

    const totalContractValue = activeProjects.reduce((sum, p) => sum + p.contract_value, 0)
    let totalActualCost = 0

    activeProjects.forEach(project => {
      const metrics = projectMetrics.get(project.id) || {}
      
      if (metrics.schedule_health >= 80) onSchedule++
      else if (metrics.schedule_health >= 60) scheduleAtRisk++
      else scheduleDelayed++

      if (metrics.cost_health >= 80) onBudget++
      else if (metrics.cost_health >= 60) budgetAtRisk++
      else budgetOverrun++

      totalScheduleHealth += metrics.schedule_health || 0
      totalCostHealth += metrics.cost_health || 0
      totalActualCost += metrics.actual_cost || 0
      criticalIssues += metrics.critical_issues || 0
      highPriorityRfis += metrics.high_priority_rfis || 0
    })

    const portfolioMargin = totalContractValue - totalActualCost
    const portfolioMarginPercent = totalContractValue > 0 
      ? (portfolioMargin / totalContractValue) * 100 
      : 0

    return {
      total_projects: projects.length,
      active_projects: activeProjects.length,
      on_schedule: onSchedule,
      schedule_at_risk: scheduleAtRisk,
      schedule_delayed: scheduleDelayed,
      on_budget: onBudget,
      budget_at_risk: budgetAtRisk,
      budget_overrun: budgetOverrun,
      total_contract_value: totalContractValue,
      total_actual_cost: totalActualCost,
      portfolio_margin: portfolioMargin,
      portfolio_margin_percent: portfolioMarginPercent,
      average_schedule_health: activeProjects.length > 0 ? totalScheduleHealth / activeProjects.length : 0,
      average_cost_health: activeProjects.length > 0 ? totalCostHealth / activeProjects.length : 0,
      critical_issues: criticalIssues,
      high_priority_rfis: highPriorityRfis,
    }
  }

  /**
   * Generate project health cards for dashboard
   */
  static generateProjectHealthCards(
    projects: Project[],
    projectMetrics: Map<string, any>
  ): ProjectHealthCard[] {
    return projects
      .filter(p => p.status === 'active')
      .map(project => {
        const metrics = projectMetrics.get(project.id) || {}
        
        const healthScore = this.calculateOverallHealthScore(metrics)
        const healthStatus = this.getHealthStatus(healthScore)

        const quickActions = this.generateQuickActions(project, metrics)

        return {
          project_id: project.id,
          project_name: project.name,
          project_number: project.project_number,
          health_score: healthScore,
          health_status: healthStatus,
          schedule_variance_days: metrics.schedule_variance_days || 0,
          cost_variance: metrics.cost_variance || 0,
          cost_variance_percent: metrics.cost_variance_percent || 0,
          open_issues: metrics.open_issues || 0,
          last_updated: new Date().toISOString(),
          quick_actions: quickActions,
        }
      })
      .sort((a, b) => a.health_score - b.health_score)
  }

  /**
   * Generate executive summary
   */
  static generateExecutiveSummary(
    projects: Project[],
    projectMetrics: Map<string, any>,
    period: string
  ): ExecutiveSummary {
    const portfolioHealth = this.calculatePortfolioHealth(projects, projectMetrics)
    const projectHealthCards = this.generateProjectHealthCards(projects, projectMetrics)

    const highlights = this.generateHighlights(portfolioHealth, projectHealthCards)
    const keyMetrics = this.generateKeyMetrics(portfolioHealth)
    const projectsRequiringAttention = projectHealthCards.filter(p => 
      p.health_status === 'warning' || p.health_status === 'critical'
    ).slice(0, 5)
    const recommendations = this.generateExecutiveRecommendations(portfolioHealth, projectHealthCards)

    return {
      period,
      generated_at: new Date().toISOString(),
      highlights,
      key_metrics: keyMetrics,
      projects_requiring_attention: projectsRequiringAttention,
      recommendations,
    }
  }

  /**
   * Create custom widget
   */
  static createWidget(
    userId: string,
    config: WidgetConfiguration
  ): DashboardWidget {
    return {
      id: `widget-${Date.now()}`,
      user_id: userId,
      widget_type: config.widget_type,
      title: config.title,
      configuration: {
        data_source: config.data_source,
        filters: config.filters,
        visualization: config.visualization,
        refresh_interval_minutes: config.refresh_interval_minutes,
        alert_thresholds: config.alert_thresholds,
      },
      position: { x: 0, y: 0, width: 4, height: 3 },
      is_global: false,
      project_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: userId,
      updated_by: userId,
    }
  }

  /**
   * Get widget data based on configuration
   */
  static async getWidgetData(
    widget: DashboardWidget,
    projects: Project[],
    projectMetrics: Map<string, any>
  ): Promise<any> {
    const config = widget.configuration as any

    switch (widget.widget_type) {
      case 'portfolio-health':
        return this.calculatePortfolioHealth(projects, projectMetrics)

      case 'cost-summary':
        return this.generateCostSummary(projects, projectMetrics, config.filters)

      case 'schedule-status':
        return this.generateScheduleStatus(projects, projectMetrics, config.filters)

      case 'risk-alerts':
        return this.generateRiskAlerts(projects, projectMetrics, config.alert_thresholds)

      case 'custom-chart':
        return this.generateCustomChartData(projects, projectMetrics, config)

      default:
        return {}
    }
  }

  private static calculateOverallHealthScore(metrics: any): number {
    const scheduleWeight = 0.4
    const costWeight = 0.4
    const qualityWeight = 0.2

    const scheduleScore = metrics.schedule_health || 0
    const costScore = metrics.cost_health || 0
    const qualityScore = 100 - (metrics.open_issues || 0) * 5

    return (scheduleScore * scheduleWeight) + 
           (costScore * costWeight) + 
           (qualityScore * qualityWeight)
  }

  private static getHealthStatus(score: number): 'excellent' | 'good' | 'warning' | 'critical' {
    if (score >= 90) return 'excellent'
    if (score >= 75) return 'good'
    if (score >= 60) return 'warning'
    return 'critical'
  }

  private static generateQuickActions(project: Project, metrics: any): any[] {
    const actions: any[] = []

    if (metrics.schedule_health < 70) {
      actions.push({
        label: 'Review Schedule',
        url: `/projects/${project.id}/schedule`,
        urgent: metrics.schedule_health < 50,
      })
    }

    if (metrics.cost_health < 70) {
      actions.push({
        label: 'Review Budget',
        url: `/projects/${project.id}/budget-tracking`,
        urgent: metrics.cost_health < 50,
      })
    }

    if (metrics.high_priority_rfis > 0) {
      actions.push({
        label: `${metrics.high_priority_rfis} High Priority RFIs`,
        url: `/projects/${project.id}/rfis`,
        urgent: true,
      })
    }

    return actions
  }

  private static generateHighlights(
    portfolioHealth: PortfolioHealthMetrics,
    projectHealthCards: ProjectHealthCard[]
  ): any[] {
    const highlights: any[] = []

    if (portfolioHealth.portfolio_margin_percent > 15) {
      highlights.push({
        type: 'success',
        title: 'Strong Portfolio Margin',
        description: 'Portfolio margin exceeds target',
        metric: `${portfolioHealth.portfolio_margin_percent.toFixed(1)}%`,
      })
    }

    if (portfolioHealth.schedule_delayed > 0) {
      highlights.push({
        type: 'warning',
        title: 'Schedule Delays',
        description: `${portfolioHealth.schedule_delayed} projects behind schedule`,
        metric: portfolioHealth.schedule_delayed,
      })
    }

    if (portfolioHealth.critical_issues > 5) {
      highlights.push({
        type: 'critical',
        title: 'Critical Issues',
        description: 'Multiple critical issues requiring immediate attention',
        metric: portfolioHealth.critical_issues,
      })
    }

    const excellentProjects = projectHealthCards.filter(p => p.health_status === 'excellent').length
    if (excellentProjects > 0) {
      highlights.push({
        type: 'success',
        title: 'Excellent Performance',
        description: `${excellentProjects} projects performing excellently`,
        metric: excellentProjects,
      })
    }

    return highlights
  }

  private static generateKeyMetrics(portfolioHealth: PortfolioHealthMetrics): any[] {
    return [
      {
        label: 'Total Contract Value',
        value: `$${(portfolioHealth.total_contract_value / 1_000_000).toFixed(1)}M`,
        change_from_last_period: 5.2,
        change_type: 'increase' as const,
        status: 'good' as const,
      },
      {
        label: 'Portfolio Margin',
        value: `${portfolioHealth.portfolio_margin_percent.toFixed(1)}%`,
        change_from_last_period: -1.5,
        change_type: 'decrease' as const,
        status: portfolioHealth.portfolio_margin_percent > 10 ? 'good' as const : 'neutral' as const,
      },
      {
        label: 'Projects On Schedule',
        value: `${portfolioHealth.on_schedule}/${portfolioHealth.active_projects}`,
        change_from_last_period: 0,
        change_type: 'stable' as const,
        status: portfolioHealth.on_schedule >= portfolioHealth.active_projects * 0.8 ? 'good' as const : 'bad' as const,
      },
      {
        label: 'Projects On Budget',
        value: `${portfolioHealth.on_budget}/${portfolioHealth.active_projects}`,
        change_from_last_period: 1,
        change_type: 'increase' as const,
        status: portfolioHealth.on_budget >= portfolioHealth.active_projects * 0.8 ? 'good' as const : 'bad' as const,
      },
    ]
  }

  private static generateExecutiveRecommendations(
    portfolioHealth: PortfolioHealthMetrics,
    projectHealthCards: ProjectHealthCard[]
  ): string[] {
    const recommendations: string[] = []

    if (portfolioHealth.budget_overrun > 0) {
      recommendations.push(
        `Review ${portfolioHealth.budget_overrun} projects with budget overruns for corrective action`
      )
    }

    if (portfolioHealth.schedule_delayed > 0) {
      recommendations.push(
        `Implement recovery plans for ${portfolioHealth.schedule_delayed} delayed projects`
      )
    }

    const criticalProjects = projectHealthCards.filter(p => p.health_status === 'critical').length
    if (criticalProjects > 0) {
      recommendations.push(
        `Schedule executive review for ${criticalProjects} projects in critical status`
      )
    }

    if (portfolioHealth.high_priority_rfis > 5) {
      recommendations.push(
        'Expedite responses to high-priority RFIs to avoid schedule impacts'
      )
    }

    if (portfolioHealth.portfolio_margin_percent < 10) {
      recommendations.push(
        'Portfolio margin below target - review pricing and cost control measures'
      )
    }

    return recommendations
  }

  private static generateCostSummary(
    projects: Project[],
    projectMetrics: Map<string, any>,
    filters: any
  ): any {
    const activeProjects = projects.filter(p => p.status === 'active')
    
    return {
      total_budget: activeProjects.reduce((sum, p) => sum + p.contract_value, 0),
      total_actual: activeProjects.reduce((sum, p) => {
        const metrics = projectMetrics.get(p.id) || {}
        return sum + (metrics.actual_cost || 0)
      }, 0),
      variance: 0,
      by_project: activeProjects.map(p => ({
        project_name: p.name,
        budget: p.contract_value,
        actual: projectMetrics.get(p.id)?.actual_cost || 0,
      })),
    }
  }

  private static generateScheduleStatus(
    projects: Project[],
    projectMetrics: Map<string, any>,
    filters: any
  ): any {
    return {
      on_schedule: projects.filter(p => {
        const metrics = projectMetrics.get(p.id) || {}
        return metrics.schedule_health >= 80
      }).length,
      at_risk: projects.filter(p => {
        const metrics = projectMetrics.get(p.id) || {}
        return metrics.schedule_health >= 60 && metrics.schedule_health < 80
      }).length,
      delayed: projects.filter(p => {
        const metrics = projectMetrics.get(p.id) || {}
        return metrics.schedule_health < 60
      }).length,
    }
  }

  private static generateRiskAlerts(
    projects: Project[],
    projectMetrics: Map<string, any>,
    thresholds: any
  ): any[] {
    const alerts: any[] = []

    projects.forEach(project => {
      const metrics = projectMetrics.get(project.id) || {}
      
      if (metrics.cost_variance_percent < -10) {
        alerts.push({
          severity: 'critical',
          project: project.name,
          type: 'budget',
          message: `Budget overrun: ${metrics.cost_variance_percent.toFixed(1)}%`,
        })
      }

      if (metrics.schedule_variance_days < -5) {
        alerts.push({
          severity: 'warning',
          project: project.name,
          type: 'schedule',
          message: `Schedule delay: ${Math.abs(metrics.schedule_variance_days)} days`,
        })
      }
    })

    return alerts
  }

  private static generateCustomChartData(
    projects: Project[],
    projectMetrics: Map<string, any>,
    config: any
  ): any {
    return {
      labels: projects.map(p => p.name),
      datasets: [
        {
          label: 'Health Score',
          data: projects.map(p => {
            const metrics = projectMetrics.get(p.id) || {}
            return this.calculateOverallHealthScore(metrics)
          }),
        },
      ],
    }
  }
}
