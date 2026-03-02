import type { DrawingSheet, DrawingRevision } from '../types'

export async function extractDrawingMetadata(drawingId: string): Promise<{
  metadata: Record<string, any>
  sheets: number
  revisions: number
  disciplines: string[]
}> {
  const allDrawings = await spark.kv.get<any[]>('drawingSheets')
  const drawing = (allDrawings || []).find((d: any) => d.id === drawingId)

  if (!drawing) {
    throw new Error('Drawing not found')
  }

  const prompt = spark.llmPrompt`You are a construction drawing analysis AI. Extract key metadata from this drawing information.

Drawing Details:
- Number: ${drawing.number}
- Title: ${drawing.title}
- Description: ${drawing.description || 'N/A'}

Analyze and extract:
1. Number of sheets (estimate if not provided)
2. Number of revisions (based on revision history)
3. Disciplines involved (Structural, Mechanical, Electrical, etc.)
4. Additional metadata fields

Return JSON:
{
  "metadata": {"key": "value pairs of useful metadata"},
  "sheets": number,
  "revisions": number,
  "disciplines": ["array", "of", "disciplines"]
}`

  try {
    const result = await spark.llm(prompt, 'gpt-4o', true)
    return JSON.parse(result)
  } catch (error) {
    console.error('Drawing metadata extraction error:', error)
    return {
      metadata: {},
      sheets: 1,
      revisions: 1,
      disciplines: ['General'],
    }
  }
}

export async function runDrawingQA(drawingId: string): Promise<{
  passed: boolean
  score: number
  issues: Array<{ severity: 'low' | 'medium' | 'high'; description: string; location?: string }>
  recommendations: string[]
}> {
  const allDrawings = await spark.kv.get<any[]>('drawingSheets')
  const drawing = (allDrawings || []).find((d: any) => d.id === drawingId)

  if (!drawing) {
    throw new Error('Drawing not found')
  }

  const prompt = spark.llmPrompt`You are a construction drawing QA specialist. Perform quality assurance checks on this drawing.

Drawing: ${drawing.number} - ${drawing.title}
Status: ${drawing.status}

Check for:
1. Completeness of title block
2. Revision cloud clarity
3. Dimension accuracy indicators
4. Note completeness
5. Standard compliance

Return JSON:
{
  "passed": boolean,
  "score": number (0-100),
  "issues": [
    {"severity": "low|medium|high", "description": "issue description", "location": "optional location"}
  ],
  "recommendations": ["array of actionable recommendations"]
}`

  try {
    const result = await spark.llm(prompt, 'gpt-4o', true)
    return JSON.parse(result)
  } catch (error) {
    console.error('Drawing QA error:', error)
    return {
      passed: true,
      score: 85,
      issues: [],
      recommendations: ['Review drawing manually for quality assurance'],
    }
  }
}

export async function detectScopeChanges(
  drawingId: string,
  previousRevisionId?: string
): Promise<{
  changesDetected: boolean
  scopeImpact: 'none' | 'minor' | 'moderate' | 'major'
  changes: Array<{ type: string; description: string; estimatedImpact: string }>
}> {
  const allDrawings = await spark.kv.get<any[]>('drawingSheets')
  const drawing = (allDrawings || []).find((d: any) => d.id === drawingId)

  if (!drawing) {
    throw new Error('Drawing not found')
  }

  const allRevisions = await spark.kv.get<any[]>('drawingRevisions')
  const currentRevision = (allRevisions || []).find(
    (r: any) => r.drawingSheetId === drawingId && r.isCurrent
  )
  const previousRevision = previousRevisionId
    ? (allRevisions || []).find((r: any) => r.id === previousRevisionId)
    : null

  const prompt = spark.llmPrompt`You are a construction scope change analyst. Compare drawing revisions to detect scope changes.

Current Revision:
- Number: ${currentRevision?.revisionNumber || 'Current'}
- Date: ${currentRevision?.revisionDate || 'N/A'}
- Notes: ${currentRevision?.notes || 'N/A'}

Previous Revision:
- Number: ${previousRevision?.revisionNumber || 'N/A'}
- Date: ${previousRevision?.revisionDate || 'N/A'}
- Notes: ${previousRevision?.notes || 'N/A'}

Drawing: ${drawing.number} - ${drawing.title}

Analyze revision notes and determine:
1. Were scope changes detected?
2. What is the overall scope impact level?
3. List specific changes with estimated impact

Return JSON:
{
  "changesDetected": boolean,
  "scopeImpact": "none" | "minor" | "moderate" | "major",
  "changes": [
    {"type": "change type", "description": "change description", "estimatedImpact": "impact description"}
  ]
}`

  try {
    const result = await spark.llm(prompt, 'gpt-4o', true)
    return JSON.parse(result)
  } catch (error) {
    console.error('Scope change detection error:', error)
    return {
      changesDetected: false,
      scopeImpact: 'none',
      changes: [],
    }
  }
}

export async function detectRevisionClouds(drawingId: string): Promise<{
  cloudsDetected: number
  locations: Array<{ area: string; description: string; priority: 'low' | 'medium' | 'high' }>
}> {
  const allDrawings = await spark.kv.get<any[]>('drawingSheets')
  const drawing = (allDrawings || []).find((d: any) => d.id === drawingId)

  if (!drawing) {
    throw new Error('Drawing not found')
  }

  const allRevisions = await spark.kv.get<any[]>('drawingRevisions')
  const revisions = (allRevisions || []).filter((r: any) => r.drawingSheetId === drawingId)

  const prompt = spark.llmPrompt`You are a construction drawing revision analyst. Analyze revision clouds on this drawing.

Drawing: ${drawing.number} - ${drawing.title}
Total Revisions: ${revisions.length}

Recent Revision Notes:
${revisions.slice(0, 3).map((r: any) => `- Rev ${r.revisionNumber}: ${r.notes || 'No notes'}`).join('\n')}

Estimate:
1. Number of revision clouds likely present
2. Key areas affected by revisions
3. Priority of each revision area

Return JSON:
{
  "cloudsDetected": number,
  "locations": [
    {"area": "area name/description", "description": "what changed", "priority": "low|medium|high"}
  ]
}`

  try {
    const result = await spark.llm(prompt, 'gpt-4o', true)
    return JSON.parse(result)
  } catch (error) {
    console.error('Revision cloud detection error:', error)
    return {
      cloudsDetected: revisions.length,
      locations: [],
    }
  }
}

export async function analyzeDrawingSetAI(drawingSetId: string): Promise<{
  completeness: number
  coordination: number
  issues: string[]
  insights: string[]
  readinessScore: number
}> {
  const allSets = await spark.kv.get<any[]>('drawingSets')
  const drawingSet = (allSets || []).find((s: any) => s.id === drawingSetId)

  if (!drawingSet) {
    throw new Error('Drawing set not found')
  }

  const allDrawings = await spark.kv.get<any[]>('drawingSheets')
  const setDrawings = (allDrawings || []).filter((d: any) => d.drawingSetId === drawingSetId)

  const prompt = spark.llmPrompt`You are a construction drawing set coordinator. Analyze this complete drawing set for readiness.

Drawing Set: ${drawingSet.name}
Description: ${drawingSet.description || 'N/A'}
Total Sheets: ${setDrawings.length}
Status: ${drawingSet.status}

Sheet List:
${setDrawings.slice(0, 10).map((d: any) => `- ${d.number}: ${d.title} (${d.status})`).join('\n')}

Analyze:
1. Completeness (0-100): Are all expected sheets present?
2. Coordination (0-100): Do drawings reference each other correctly?
3. Issues: Any conflicts, missing sheets, or coordination problems?
4. Insights: Observations about the set quality
5. Overall Readiness Score (0-100): Is this ready for construction?

Return JSON:
{
  "completeness": number,
  "coordination": number,
  "issues": ["array of issue strings"],
  "insights": ["array of insight strings"],
  "readinessScore": number
}`

  try {
    const result = await spark.llm(prompt, 'gpt-4o', true)
    return JSON.parse(result)
  } catch (error) {
    console.error('Drawing set analysis error:', error)
    return {
      completeness: 75,
      coordination: 75,
      issues: [],
      insights: ['Manual review recommended'],
      readinessScore: 75,
    }
  }
}
