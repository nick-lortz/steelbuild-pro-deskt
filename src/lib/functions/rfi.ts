import type { RFI, Task } from '../types'

export async function listRFIs(projectId: string): Promise<RFI[]> {
  const allRFIs = await spark.kv.get<RFI[]>('rfis')
  return (allRFIs || []).filter((r) => r.projectId === projectId)
}

export async function updateRFI(
  rfiId: string,
  updates: Partial<RFI>
): Promise<RFI> {
  const allRFIs = await spark.kv.get<RFI[]>('rfis')
  const rfis = allRFIs || []
  const index = rfis.findIndex((r) => r.id === rfiId)
  
  if (index === -1) {
    throw new Error('RFI not found')
  }

  const updated: RFI = {
    ...rfis[index],
    ...updates,
    id: rfiId,
    updatedAt: new Date().toISOString(),
  }

  rfis[index] = updated
  await spark.kv.set('rfis', rfis)

  return updated
}

export async function predictRFIRisk(rfiId: string): Promise<{
  riskLevel: 'low' | 'medium' | 'high'
  riskScore: number
  factors: Array<{ name: string; weight: number; description: string }>
  recommendation: string
}> {
  const allRFIs = await spark.kv.get<RFI[]>('rfis')
  const rfi = (allRFIs || []).find((r) => r.id === rfiId)

  if (!rfi) {
    throw new Error('RFI not found')
  }

  const ageInDays =
    (Date.now() - new Date(rfi.createdAt).getTime()) / (1000 * 60 * 60 * 24)

  const prompt = spark.llmPrompt`You are a construction RFI risk analyst. Analyze this RFI for potential project impact risks.

RFI Details:
- Subject: ${rfi.subject}
- Status: ${rfi.status}
- Priority: ${rfi.priority}
- Age: ${Math.floor(ageInDays)} days
- Description: ${rfi.description || 'N/A'}

Consider:
1. How long the RFI has been open (aging risk)
2. Priority level indicated
3. Current status and resolution likelihood
4. Typical construction RFI patterns

Return JSON:
{
  "riskLevel": "low" | "medium" | "high",
  "riskScore": number (0-100),
  "factors": [
    {"name": "Aging", "weight": 0-1, "description": "brief explanation"},
    {"name": "Priority Impact", "weight": 0-1, "description": "brief explanation"}
  ],
  "recommendation": "actionable recommendation string"
}`

  try {
    const result = await spark.llm(prompt, 'gpt-4o', true)
    return JSON.parse(result)
  } catch (error) {
    console.error('RFI risk prediction error:', error)
    
    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    let riskScore = 20
    
    if (ageInDays > 14 || rfi.priority === 'high') {
      riskLevel = 'high'
      riskScore = 85
    } else if (ageInDays > 7 || rfi.priority === 'medium') {
      riskLevel = 'medium'
      riskScore = 55
    }

    return {
      riskLevel,
      riskScore,
      factors: [
        { name: 'Aging', weight: ageInDays / 30, description: `RFI is ${Math.floor(ageInDays)} days old` },
        { name: 'Priority', weight: rfi.priority === 'high' ? 0.8 : 0.4, description: `Priority level: ${rfi.priority}` },
      ],
      recommendation: 'Review RFI status and expedite response if needed',
    }
  }
}

export async function updateRFIEscalation(
  rfiId: string,
  escalate: boolean
): Promise<RFI> {
  const riskAssessment = await predictRFIRisk(rfiId)
  
  const updates: Partial<RFI> = {
    escalated: escalate,
    escalatedAt: escalate ? new Date().toISOString() : undefined,
  }

  if (riskAssessment.riskLevel === 'high' && !escalate) {
    updates.escalated = true
    updates.escalatedAt = new Date().toISOString()
  }

  return updateRFI(rfiId, updates)
}

export async function autoUpdateTaskOnRFI(
  rfiId: string,
  action: 'block' | 'unblock' | 'link'
): Promise<void> {
  const allRFIs = await spark.kv.get<RFI[]>('rfis')
  const rfi = (allRFIs || []).find((r) => r.id === rfiId)

  if (!rfi) {
    throw new Error('RFI not found')
  }

  const allTasks = await spark.kv.get<Task[]>('tasks')
  const projectTasks = (allTasks || []).filter((t) => t.projectId === rfi.projectId)

  const prompt = spark.llmPrompt`You are a construction scheduling assistant. Determine which tasks should be affected by this RFI.

RFI: ${rfi.subject}
Description: ${rfi.description || 'N/A'}
Action: ${action}

Available Tasks in Project:
${projectTasks.map((t) => `- ${t.name} (ID: ${t.id})`).join('\n')}

Based on the RFI subject and description, identify which task IDs should be ${action === 'block' ? 'blocked' : action === 'unblock' ? 'unblocked' : 'linked'}.

Return JSON with a single property "taskIds" containing an array of task ID strings:
{
  "taskIds": ["task-id-1", "task-id-2"]
}`

  try {
    const result = await spark.llm(prompt, 'gpt-4o', true)
    const { taskIds } = JSON.parse(result)

    if (Array.isArray(taskIds) && taskIds.length > 0) {
      const updatedTasks = projectTasks.map((task) => {
        if (taskIds.includes(task.id)) {
          if (action === 'block') {
            return {
              ...task,
              blocked: true,
              blockedBy: rfiId,
              blockedReason: `Blocked by RFI: ${rfi.subject}`,
            }
          } else if (action === 'unblock') {
            return {
              ...task,
              blocked: false,
              blockedBy: undefined,
              blockedReason: undefined,
            }
          } else {
            return {
              ...task,
              linkedRFIs: [...(task.linkedRFIs || []), rfiId],
            }
          }
        }
        return task
      })

      const otherTasks = (allTasks || []).filter((t) => t.projectId !== rfi.projectId)
      await spark.kv.set('tasks', [...otherTasks, ...updatedTasks])
    }
  } catch (error) {
    console.error('Auto-update task on RFI error:', error)
  }
}
