import { projectsDb } from '../db'

export interface IntegrityFinding {
  id: string
  entityType: string
  entityId: string
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  autoFixable: boolean
  createdAt: string
}

interface DataIntegrityParams {
  projects: any[]
  rfis: any[]
  tasks: any[]
  budgets: any[]
  costCodes: any[]
  sovItems: any[]
}

export async function checkDataIntegrity(params: DataIntegrityParams): Promise<IntegrityFinding[]> {
  const findings: IntegrityFinding[] = []
  const { projects, rfis, tasks, budgets, costCodes, sovItems } = params

  const projectNumbers = new Set()
  for (const project of projects) {
    if (projectNumbers.has(project.number)) {
      findings.push({
        id: crypto.randomUUID(),
        entityType: 'Project',
        entityId: project.id,
        title: 'Duplicate Project Number',
        description: `Project number ${project.number} is used by multiple projects`,
        severity: 'critical',
        autoFixable: false,
        createdAt: new Date().toISOString(),
      })
    }
    projectNumbers.add(project.number)

    if (project.contractValue < 0) {
      findings.push({
        id: crypto.randomUUID(),
        entityType: 'Project',
        entityId: project.id,
        title: 'Negative Contract Value',
        description: `Project ${project.name} has a negative contract value`,
        severity: 'medium',
        autoFixable: true,
        createdAt: new Date().toISOString(),
      })
    }

    if (!project.startDate) {
      findings.push({
        id: crypto.randomUUID(),
        entityType: 'Project',
        entityId: project.id,
        title: 'Missing Start Date',
        description: `Project ${project.name} is missing a start date`,
        severity: 'low',
        autoFixable: false,
        createdAt: new Date().toISOString(),
      })
    }
  }

  const rfiMap = new Map<string, Set<string>>()
  for (const rfi of rfis) {
    if (!rfiMap.has(rfi.projectId)) {
      rfiMap.set(rfi.projectId, new Set())
    }
    if (rfiMap.get(rfi.projectId)!.has(rfi.number)) {
      findings.push({
        id: crypto.randomUUID(),
        entityType: 'RFI',
        entityId: rfi.id,
        title: 'Duplicate RFI Number',
        description: `RFI number ${rfi.number} is duplicated in project`,
        severity: 'high',
        autoFixable: false,
        createdAt: new Date().toISOString(),
      })
    }
    rfiMap.get(rfi.projectId)!.add(rfi.number)

    if (!rfi.projectId || !projects.some((p) => p.id === rfi.projectId)) {
      findings.push({
        id: crypto.randomUUID(),
        entityType: 'RFI',
        entityId: rfi.id,
        title: 'Orphaned RFI',
        description: 'RFI references a non-existent project',
        severity: 'high',
        autoFixable: true,
        createdAt: new Date().toISOString(),
      })
    }
  }

  for (const task of tasks) {
    if (!task.projectId || !projects.some((p) => p.id === task.projectId)) {
      findings.push({
        id: crypto.randomUUID(),
        entityType: 'Task',
        entityId: task.id,
        title: 'Orphaned Task',
        description: 'Task references a non-existent project',
        severity: 'high',
        autoFixable: true,
        createdAt: new Date().toISOString(),
      })
    }

    if (task.startDate && task.endDate && task.startDate > task.endDate) {
      findings.push({
        id: crypto.randomUUID(),
        entityType: 'Task',
        entityId: task.id,
        title: 'Invalid Date Range',
        description: 'Task start date is after end date',
        severity: 'medium',
        autoFixable: true,
        createdAt: new Date().toISOString(),
      })
    }

    if (task.dependencies && task.dependencies.length > 0) {
      for (const depId of task.dependencies) {
        if (!tasks.some((t) => t.id === depId)) {
          findings.push({
            id: crypto.randomUUID(),
            entityType: 'Task',
            entityId: task.id,
            title: 'Broken Task Dependency',
            description: 'Task has dependency on non-existent task',
            severity: 'high',
            autoFixable: true,
            createdAt: new Date().toISOString(),
          })
        }
      }
    }
  }

  for (const budget of budgets) {
    if (!budget.projectId || !projects.some((p) => p.id === budget.projectId)) {
      findings.push({
        id: crypto.randomUUID(),
        entityType: 'Budget',
        entityId: budget.id,
        title: 'Orphaned Budget',
        description: 'Budget references a non-existent project',
        severity: 'high',
        autoFixable: true,
        createdAt: new Date().toISOString(),
      })
    }

    if (budget.costCodeId && !costCodes.some((c) => c.id === budget.costCodeId)) {
      findings.push({
        id: crypto.randomUUID(),
        entityType: 'Budget',
        entityId: budget.id,
        title: 'Invalid Cost Code Reference',
        description: 'Budget references a non-existent cost code',
        severity: 'medium',
        autoFixable: false,
        createdAt: new Date().toISOString(),
      })
    }
  }

  for (const sovItem of sovItems) {
    if (!sovItem.projectId || !projects.some((p) => p.id === sovItem.projectId)) {
      findings.push({
        id: crypto.randomUUID(),
        entityType: 'SOV',
        entityId: sovItem.id,
        title: 'Orphaned SOV Item',
        description: 'SOV item references a non-existent project',
        severity: 'high',
        autoFixable: true,
        createdAt: new Date().toISOString(),
      })
    }

    if (sovItem.percentComplete < 0 || sovItem.percentComplete > 100) {
      findings.push({
        id: crypto.randomUUID(),
        entityType: 'SOV',
        entityId: sovItem.id,
        title: 'Invalid Percent Complete',
        description: `SOV item has invalid percent complete: ${sovItem.percentComplete}%`,
        severity: 'low',
        autoFixable: true,
        createdAt: new Date().toISOString(),
      })
    }
  }

  return findings
}

export async function applyAutoFix(issueEntity: string, issueId: string, issueType: string): Promise<{
  fixed: boolean
  message: string
}> {
  try {
    if (issueEntity === 'Project' && issueType === 'Contract value is negative') {
      const projects = await projectsDb.getAll()
      const project = projects.find((p) => p.id === issueId)
      if (project) {
        await projectsDb.update(issueId, { contractValue: 0 })
        return { fixed: true, message: 'Set contract value to 0' }
      }
    }

    if (issueEntity === 'RFI' && issueType.includes('non-existent project')) {
      const rfis = await spark.kv.get<any[]>('rfis')
      if (rfis) {
        const updated = rfis.filter((r) => r.id !== issueId)
        await spark.kv.set('rfis', updated)
        return { fixed: true, message: 'Removed orphaned RFI' }
      }
    }

    if (issueEntity === 'Task' && issueType.includes('non-existent project')) {
      const tasks = await spark.kv.get<any[]>('tasks')
      if (tasks) {
        const updated = tasks.filter((t) => t.id !== issueId)
        await spark.kv.set('tasks', updated)
        return { fixed: true, message: 'Removed orphaned task' }
      }
    }

    if (issueEntity === 'Task' && issueType.includes('Start date is after due date')) {
      const tasks = await spark.kv.get<any[]>('tasks')
      if (tasks) {
        const task = tasks.find((t) => t.id === issueId)
        if (task) {
          const updatedTasks = tasks.map((t) =>
            t.id === issueId ? { ...t, startDate: t.dueDate } : t
          )
          await spark.kv.set('tasks', updatedTasks)
          return { fixed: true, message: 'Set start date equal to due date' }
        }
      }
    }

    return { fixed: false, message: 'No auto-fix available for this issue type' }
  } catch (error) {
    console.error('Auto-fix error:', error)
    return { fixed: false, message: 'Auto-fix failed due to error' }
  }
}

export async function runFullAppAudit(): Promise<{
  timestamp: string
  projectsChecked: number
  totalIssues: number
  criticalIssues: number
  recommendations: string[]
}> {
  const integrityCheck = await checkDataIntegrity()
  const projects = await projectsDb.getAll()

  const criticalIssues = integrityCheck.issues.filter((i) => i.severity === 'high').length

  const recommendations: string[] = []
  
  if (criticalIssues > 0) {
    recommendations.push('Address critical data integrity issues immediately')
  }

  if (integrityCheck.issues.filter((i) => i.autoFixable).length > 5) {
    recommendations.push('Run auto-fix for fixable issues to clean up data')
  }

  const orphanedCount = integrityCheck.issues.filter((i) =>
    i.issue.includes('non-existent project')
  ).length
  if (orphanedCount > 0) {
    recommendations.push(`${orphanedCount} orphaned records detected - consider cleanup`)
  }

  return {
    timestamp: new Date().toISOString(),
    projectsChecked: projects.length,
    totalIssues: integrityCheck.issues.length,
    criticalIssues,
    recommendations,
  }
}

export async function cascadeDeleteProject(projectId: string): Promise<{
  deleted: boolean
  entitiesRemoved: Record<string, number>
}> {
  const entitiesRemoved: Record<string, number> = {}

  const entities = [
    'rfis',
    'tasks',
    'budgets',
    'expenses',
    'workPackages',
    'drawingSets',
    'drawingSheets',
    'changeOrders',
    'projectRisks',
    'projectMembers',
  ]

  for (const entityKey of entities) {
    const data = await spark.kv.get<any[]>(entityKey)
    if (data) {
      const filtered = data.filter((item) => item.projectId !== projectId)
      entitiesRemoved[entityKey] = data.length - filtered.length
      await spark.kv.set(entityKey, filtered)
    }
  }

  await projectsDb.delete(projectId)
  entitiesRemoved.project = 1

  return {
    deleted: true,
    entitiesRemoved,
  }
}

export async function cleanupDuplicateProjects(): Promise<{
  duplicatesFound: number
  duplicatesRemoved: number
  keptProjects: string[]
}> {
  const projects = await projectsDb.getAll()
  const numberMap = new Map<string, any[]>()

  for (const project of projects) {
    if (!numberMap.has(project.number)) {
      numberMap.set(project.number, [])
    }
    numberMap.get(project.number)!.push(project)
  }

  let duplicatesFound = 0
  let duplicatesRemoved = 0
  const keptProjects: string[] = []

  for (const [number, projectList] of numberMap.entries()) {
    if (projectList.length > 1) {
      duplicatesFound += projectList.length - 1

      projectList.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      const keepProject = projectList[0]
      keptProjects.push(keepProject.id)

      for (let i = 1; i < projectList.length; i++) {
        await cascadeDeleteProject(projectList[i].id)
        duplicatesRemoved++
      }
    }
  }

  return {
    duplicatesFound,
    duplicatesRemoved,
    keptProjects,
  }
}

export async function validateSecrets(): Promise<{
  valid: boolean
  missingSecrets: string[]
  recommendations: string[]
}> {
  const requiredSecrets = [
    'OPENAI_API_KEY',
    'DATABASE_URL',
    'SESSION_SECRET',
  ]

  const missingSecrets: string[] = []
  const recommendations: string[] = []

  for (const secret of requiredSecrets) {
    if (!process.env[secret]) {
      missingSecrets.push(secret)
    }
  }

  if (missingSecrets.length > 0) {
    recommendations.push('Set missing environment variables in your deployment configuration')
    recommendations.push('Verify secrets are not exposed in client-side code')
  }

  return {
    valid: missingSecrets.length === 0,
    missingSecrets,
    recommendations,
  }
}
