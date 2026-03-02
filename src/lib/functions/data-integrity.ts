import { projectsDb } from '../db'

export async function checkDataIntegrity(projectId?: string): Promise<{
  passed: boolean
  issues: Array<{
    entity: string
    id: string
    issue: string
    severity: 'low' | 'medium' | 'high'
    autoFixable: boolean
  }>
  summary: string
}> {
  const issues: Array<{
    entity: string
    id: string
    issue: string
    severity: 'low' | 'medium' | 'high'
    autoFixable: boolean
  }> = []

  const projects = await projectsDb.getAll()
  const targetProjects = projectId
    ? projects.filter((p) => p.id === projectId)
    : projects

  const projectNumbers = new Set()
  for (const project of targetProjects) {
    if (projectNumbers.has(project.number)) {
      issues.push({
        entity: 'Project',
        id: project.id,
        issue: `Duplicate project number: ${project.number}`,
        severity: 'high',
        autoFixable: false,
      })
    }
    projectNumbers.add(project.number)

    if (project.contractValue < 0) {
      issues.push({
        entity: 'Project',
        id: project.id,
        issue: 'Contract value is negative',
        severity: 'medium',
        autoFixable: true,
      })
    }
  }

  const rfis = await spark.kv.get<any[]>('rfis')
  if (rfis) {
    const rfiMap = new Map<string, Set<string>>()
    
    for (const rfi of rfis) {
      const key = `${rfi.projectId}-${rfi.rfiNumber}`
      if (!rfiMap.has(rfi.projectId)) {
        rfiMap.set(rfi.projectId, new Set())
      }
      if (rfiMap.get(rfi.projectId)!.has(rfi.rfiNumber)) {
        issues.push({
          entity: 'RFI',
          id: rfi.id,
          issue: `Duplicate RFI number ${rfi.rfiNumber} in project`,
          severity: 'high',
          autoFixable: false,
        })
      }
      rfiMap.get(rfi.projectId)!.add(rfi.rfiNumber)

      if (!rfi.projectId || !targetProjects.some((p) => p.id === rfi.projectId)) {
        issues.push({
          entity: 'RFI',
          id: rfi.id,
          issue: 'RFI references non-existent project',
          severity: 'high',
          autoFixable: true,
        })
      }
    }
  }

  const tasks = await spark.kv.get<any[]>('tasks')
  if (tasks) {
    for (const task of tasks) {
      if (!task.projectId || !projects.some((p) => p.id === task.projectId)) {
        issues.push({
          entity: 'Task',
          id: task.id,
          issue: 'Task references non-existent project',
          severity: 'high',
          autoFixable: true,
        })
      }

      if (task.startDate && task.dueDate && task.startDate > task.dueDate) {
        issues.push({
          entity: 'Task',
          id: task.id,
          issue: 'Start date is after due date',
          severity: 'medium',
          autoFixable: true,
        })
      }
    }
  }

  const passed = issues.filter((i) => i.severity === 'high').length === 0
  const summary = `Found ${issues.length} issue(s). ${
    issues.filter((i) => i.autoFixable).length
  } can be auto-fixed.`

  return {
    passed,
    issues,
    summary,
  }
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
