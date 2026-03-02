import type { WorkPackage } from '../types'

export async function evaluateExecutionReadiness(workPackageId: string): Promise<{
  ready: boolean
  score: number
  blockers: Array<{ category: string; description: string; severity: 'low' | 'medium' | 'high' }>
  recommendations: string[]
}> {
  const allPackages = await spark.kv.get<WorkPackage[]>('workPackages')
  const workPackage = (allPackages || []).find((wp) => wp.id === workPackageId)

  if (!workPackage) {
    throw new Error('Work package not found')
  }

  const prompt = spark.llmPrompt`You are a construction execution readiness specialist. Evaluate if this work package is ready for field execution.

Work Package: ${workPackage.name}
Status: ${workPackage.status}
Phase: ${workPackage.phase}
Description: ${workPackage.description || 'N/A'}

Evaluate readiness across:
1. Engineering completeness
2. Material availability
3. Labor resources
4. Equipment readiness
5. Prerequisite work completion
6. Safety preparations

Return JSON:
{
  "ready": boolean,
  "score": number (0-100),
  "blockers": [
    {"category": "blocker category", "description": "description", "severity": "low|medium|high"}
  ],
  "recommendations": ["array of actionable recommendations"]
}`

  try {
    const result = await spark.llm(prompt, 'gpt-4o', true)
    return JSON.parse(result)
  } catch (error) {
    console.error('Execution readiness evaluation error:', error)
    return {
      ready: workPackage.status === 'ready',
      score: 75,
      blockers: [],
      recommendations: ['Perform manual readiness review'],
    }
  }
}

export async function getWorkPackageExecutionState(workPackageId: string): Promise<{
  state: 'not-started' | 'in-progress' | 'blocked' | 'completed'
  progress: number
  startDate?: string
  completionDate?: string
  activeIssues: number
}> {
  const allPackages = await spark.kv.get<WorkPackage[]>('workPackages')
  const workPackage = (allPackages || []).find((wp) => wp.id === workPackageId)

  if (!workPackage) {
    throw new Error('Work package not found')
  }

  let state: 'not-started' | 'in-progress' | 'blocked' | 'completed' = 'not-started'
  
  if (workPackage.status === 'completed') {
    state = 'completed'
  } else if (workPackage.status === 'in-progress' || workPackage.status === 'active') {
    state = 'in-progress'
  }

  return {
    state,
    progress: workPackage.percentComplete || 0,
    startDate: workPackage.startDate,
    completionDate: workPackage.endDate,
    activeIssues: 0,
  }
}

export async function evaluateWorkPackageExecutionRisk(workPackageId: string): Promise<{
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  riskScore: number
  risks: Array<{ type: string; impact: string; mitigation: string }>
}> {
  const allPackages = await spark.kv.get<WorkPackage[]>('workPackages')
  const workPackage = (allPackages || []).find((wp) => wp.id === workPackageId)

  if (!workPackage) {
    throw new Error('Work package not found')
  }

  const readiness = await evaluateExecutionReadiness(workPackageId)

  const prompt = spark.llmPrompt`You are a construction risk analyst. Evaluate execution risks for this work package.

Work Package: ${workPackage.name}
Status: ${workPackage.status}
Readiness Score: ${readiness.score}
Known Blockers: ${readiness.blockers.length}

Identify risks in:
1. Schedule adherence
2. Cost control
3. Quality assurance
4. Safety concerns
5. Resource availability

Return JSON:
{
  "riskLevel": "low" | "medium" | "high" | "critical",
  "riskScore": number (0-100),
  "risks": [
    {"type": "risk type", "impact": "impact description", "mitigation": "mitigation strategy"}
  ]
}`

  try {
    const result = await spark.llm(prompt, 'gpt-4o', true)
    return JSON.parse(result)
  } catch (error) {
    console.error('Work package execution risk evaluation error:', error)
    return {
      riskLevel: readiness.score < 50 ? 'high' : 'medium',
      riskScore: 100 - readiness.score,
      risks: [],
    }
  }
}

export async function computeFabReadiness(workPackageId: string): Promise<{
  ready: boolean
  fabricationScore: number
  gaps: string[]
  detailsComplete: boolean
  materialsAvailable: boolean
}> {
  const allPackages = await spark.kv.get<WorkPackage[]>('workPackages')
  const workPackage = (allPackages || []).find((wp) => wp.id === workPackageId)

  if (!workPackage) {
    throw new Error('Work package not found')
  }

  const prompt = spark.llmPrompt`You are a steel fabrication readiness specialist. Assess if this work package is ready for fabrication.

Work Package: ${workPackage.name}
Type: ${workPackage.type || 'N/A'}

Check:
1. Detailed drawings complete and approved
2. Materials ordered and available
3. Fabrication shop capacity
4. Quality control plan in place

Return JSON:
{
  "ready": boolean,
  "fabricationScore": number (0-100),
  "gaps": ["array of gaps preventing fabrication"],
  "detailsComplete": boolean,
  "materialsAvailable": boolean
}`

  try {
    const result = await spark.llm(prompt, 'gpt-4o', true)
    return JSON.parse(result)
  } catch (error) {
    console.error('Fabrication readiness computation error:', error)
    return {
      ready: false,
      fabricationScore: 50,
      gaps: ['Manual assessment required'],
      detailsComplete: false,
      materialsAvailable: false,
    }
  }
}

export async function recalculateWPInstallReadiness(workPackageId: string): Promise<{
  ready: boolean
  installScore: number
  prerequisites: Array<{ name: string; completed: boolean }>
  fieldReady: boolean
  crewAssigned: boolean
}> {
  const allPackages = await spark.kv.get<WorkPackage[]>('workPackages')
  const workPackage = (allPackages || []).find((wp) => wp.id === workPackageId)

  if (!workPackage) {
    throw new Error('Work package not found')
  }

  const fabReadiness = await computeFabReadiness(workPackageId)

  const prompt = spark.llmPrompt`You are a field installation coordinator. Assess if this work package is ready for field installation.

Work Package: ${workPackage.name}
Fabrication Ready: ${fabReadiness.ready}
Status: ${workPackage.status}

Check:
1. Fabrication complete and pieces delivered to site
2. Prerequisite work completed (foundations, access, etc.)
3. Field crew assigned and available
4. Equipment and tools ready
5. Safety plan approved

Return JSON:
{
  "ready": boolean,
  "installScore": number (0-100),
  "prerequisites": [
    {"name": "prerequisite name", "completed": boolean}
  ],
  "fieldReady": boolean,
  "crewAssigned": boolean
}`

  try {
    const result = await spark.llm(prompt, 'gpt-4o', true)
    return JSON.parse(result)
  } catch (error) {
    console.error('Install readiness recalculation error:', error)
    return {
      ready: false,
      installScore: 50,
      prerequisites: [],
      fieldReady: false,
      crewAssigned: false,
    }
  }
}

export async function propagateExecutionImpacts(
  workPackageId: string,
  impactType: 'delay' | 'cost-change' | 'scope-change'
): Promise<{
  affectedPackages: string[]
  cascadeLevel: number
  recommendations: string[]
}> {
  const allPackages = await spark.kv.get<WorkPackage[]>('workPackages')
  const workPackage = (allPackages || []).find((wp) => wp.id === workPackageId)

  if (!workPackage) {
    throw new Error('Work package not found')
  }

  const projectPackages = (allPackages || []).filter(
    (wp) => wp.projectId === workPackage.projectId
  )

  const prompt = spark.llmPrompt`You are a construction schedule analyst. Analyze impact propagation from this work package change.

Work Package: ${workPackage.name}
Impact Type: ${impactType}
Project ID: ${workPackage.projectId}

Other Work Packages in Project:
${projectPackages.slice(0, 10).map((wp) => `- ${wp.name} (${wp.status})`).join('\n')}

Determine:
1. Which other work packages will be affected
2. What is the cascade level (1-5, 5 being highest impact)
3. Recommendations to mitigate impact

Return JSON with a single property "affectedPackageNames" containing an array of work package names, plus:
{
  "affectedPackageNames": ["array of names"],
  "cascadeLevel": number (1-5),
  "recommendations": ["array of mitigation recommendations"]
}`

  try {
    const result = await spark.llm(prompt, 'gpt-4o', true)
    const parsed = JSON.parse(result)
    
    const affectedNames = parsed.affectedPackageNames || []
    const affectedPackages = projectPackages
      .filter((wp) => affectedNames.some((name: string) => wp.name.includes(name)))
      .map((wp) => wp.id)

    return {
      affectedPackages,
      cascadeLevel: parsed.cascadeLevel || 1,
      recommendations: parsed.recommendations || [],
    }
  } catch (error) {
    console.error('Impact propagation error:', error)
    return {
      affectedPackages: [],
      cascadeLevel: 1,
      recommendations: ['Manual impact analysis recommended'],
    }
  }
}
