import type { Project, Task, RFI, Budget, WorkPackage } from '../types'
import { projectsDb } from '../db'

export interface DashboardData {
  projects: Project[]
  activeProjects: number
  totalBudget: number
  scheduleHealth: number
  criticalRFIs: number
  upcomingMilestones: Array<{
    projectId: string
    projectName: string
    taskName: string
    dueDate: string
  }>
  recentActivity: Array<{
    type: string
    description: string
    timestamp: string
    projectId?: string
  }>
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const projects = await projectsDb.getAll()
  const activeProjects = projects.filter((p) => p.status === 'active')

  const totalBudget = activeProjects.reduce(
    (sum, p) => sum + (p.contractValue || 0),
    0
  )

  const scheduleHealthPromises = activeProjects.map((p) =>
    calculateProjectScheduleHealth(p.id)
  )
  const scheduleHealthScores = await Promise.all(scheduleHealthPromises)
  const avgScheduleHealth =
    scheduleHealthScores.length > 0
      ? scheduleHealthScores.reduce((sum, score) => sum + score, 0) /
        scheduleHealthScores.length
      : 100

  const allRFIs = await spark.kv.get<RFI[]>('rfis')
  const criticalRFIs = (allRFIs || []).filter(
    (r) =>
      r.status === 'open' &&
      activeProjects.some((p) => p.id === r.projectId) &&
      new Date(r.createdAt).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000
  ).length

  const allTasks = await spark.kv.get<Task[]>('tasks')
  const upcomingTasks = (allTasks || [])
    .filter((t) => {
      const dueDate = new Date(t.dueDate)
      const now = new Date()
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      return (
        dueDate >= now &&
        dueDate <= sevenDaysFromNow &&
        t.status !== 'completed' &&
        activeProjects.some((p) => p.id === t.projectId)
      )
    })
    .slice(0, 5)
    .map((t) => {
      const project = projects.find((p) => p.id === t.projectId)
      return {
        projectId: t.projectId,
        projectName: project?.name || 'Unknown',
        taskName: t.name,
        dueDate: t.dueDate,
      }
    })

  return {
    projects,
    activeProjects: activeProjects.length,
    totalBudget,
    scheduleHealth: avgScheduleHealth,
    criticalRFIs,
    upcomingMilestones: upcomingTasks,
    recentActivity: [],
  }
}

export async function calculateProjectScheduleHealth(
  projectId: string
): Promise<number> {
  const prompt = spark.llmPrompt`You are a construction project management AI assistant. Calculate the schedule health score for project ${projectId}.

Schedule health should be a percentage from 0-100, where:
- 100 = All tasks on track, no delays
- 75-99 = Minor delays, overall healthy
- 50-74 = Moderate concerns, some critical path impact
- 25-49 = Significant delays, action required
- 0-24 = Critical delays, project at risk

Retrieve task data and analyze:
1. Percentage of tasks completed on time vs delayed
2. Critical path tasks status
3. Upcoming task deadlines
4. Dependency chain risks

Return ONLY a number between 0 and 100.`

  try {
    const result = await spark.llm(prompt, 'gpt-4o-mini')
    const score = parseFloat(result.trim())
    return isNaN(score) ? 75 : Math.max(0, Math.min(100, score))
  } catch (error) {
    console.error('Schedule health calculation error:', error)
    return 75
  }
}

export async function forecastProjectCost(
  projectId: string,
  horizonDays: number = 90
): Promise<{
  projectedCost: number
  variance: number
  confidence: number
  breakdown: Array<{ category: string; amount: number }>
}> {
  const project = await projectsDb.getById(projectId)
  if (!project) {
    throw new Error('Project not found')
  }

  const budgets = await spark.kv.get<Budget[]>('budgets')
  const projectBudgets = (budgets || []).filter((b) => b.projectId === projectId)

  const expenses = await spark.kv.get<any[]>('expenses')
  const projectExpenses = (expenses || []).filter((e) => e.projectId === projectId)

  const totalBudget = projectBudgets.reduce((sum, b) => sum + b.totalAmount, 0)
  const totalSpent = projectExpenses.reduce((sum, e) => sum + e.amount, 0)

  const prompt = spark.llmPrompt`You are a construction cost forecasting AI. Analyze project cost trends and forecast.

Project Details:
- Contract Value: ${project.contractValue}
- Total Budget: ${totalBudget}
- Spent to Date: ${totalSpent}
- Forecast Horizon: ${horizonDays} days

Historical expense data shows current burn rate. Based on project status "${project.status}" and typical construction project patterns:

1. Calculate projected total cost at completion
2. Estimate variance from budget
3. Provide confidence level (0-100)
4. Break down by major categories

Return as JSON with format:
{
  "projectedCost": number,
  "variance": number,
  "confidence": number,
  "breakdown": [{"category": "Labor", "amount": number}, {"category": "Materials", "amount": number}, {"category": "Equipment", "amount": number}]
}`

  try {
    const result = await spark.llm(prompt, 'gpt-4o', true)
    const forecast = JSON.parse(result)
    return forecast
  } catch (error) {
    console.error('Cost forecast error:', error)
    return {
      projectedCost: totalBudget,
      variance: 0,
      confidence: 50,
      breakdown: [],
    }
  }
}

export async function computeMarginAtRisk(projectId: string): Promise<{
  marginAtRisk: number
  riskFactors: Array<{ factor: string; impact: number; description: string }>
  recommendation: string
}> {
  const project = await projectsDb.getById(projectId)
  if (!project) {
    throw new Error('Project not found')
  }

  const forecast = await forecastProjectCost(projectId)
  const marginImpact = forecast.variance

  const rfis = await spark.kv.get<RFI[]>('rfis')
  const openRFIs = (rfis || []).filter(
    (r) => r.projectId === projectId && r.status === 'open'
  )

  const risks = await spark.kv.get<any[]>('projectRisks')
  const projectRisks = (risks || []).filter((r) => r.projectId === projectId)

  const prompt = spark.llmPrompt`You are a construction financial risk analyst. Calculate margin at risk for this project.

Project: ${project.name}
Contract Value: ${project.contractValue}
Cost Variance: ${marginImpact}
Open RFIs: ${openRFIs.length}
Active Risks: ${projectRisks.length}

Analyze and return JSON:
{
  "marginAtRisk": number (dollar amount at risk),
  "riskFactors": [
    {"factor": "Cost Overruns", "impact": number, "description": "brief explanation"},
    {"factor": "Schedule Delays", "impact": number, "description": "brief explanation"}
  ],
  "recommendation": "actionable recommendation string"
}`

  try {
    const result = await spark.llm(prompt, 'gpt-4o', true)
    return JSON.parse(result)
  } catch (error) {
    console.error('Margin at risk calculation error:', error)
    return {
      marginAtRisk: 0,
      riskFactors: [],
      recommendation: 'Unable to calculate margin risk at this time',
    }
  }
}

export async function getCostRiskSignal(projectId: string): Promise<{
  signal: 'green' | 'yellow' | 'red'
  score: number
  alerts: string[]
}> {
  const marginData = await computeMarginAtRisk(projectId)
  const forecast = await forecastProjectCost(projectId)

  let signal: 'green' | 'yellow' | 'red' = 'green'
  let score = 100
  const alerts: string[] = []

  const variancePercent = Math.abs(forecast.variance / forecast.projectedCost)

  if (variancePercent > 0.15) {
    signal = 'red'
    score = 30
    alerts.push('Cost variance exceeds 15% threshold')
  } else if (variancePercent > 0.08) {
    signal = 'yellow'
    score = 60
    alerts.push('Cost variance approaching warning threshold')
  }

  if (marginData.marginAtRisk > forecast.projectedCost * 0.1) {
    signal = signal === 'green' ? 'yellow' : 'red'
    score = Math.min(score, 50)
    alerts.push('Significant margin at risk detected')
  }

  return { signal, score, alerts }
}
