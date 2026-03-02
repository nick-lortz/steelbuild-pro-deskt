import type { DrawingSet, DrawingSheet, DrawingRevision } from '../types'
import type {
  DrawingAnnotation,
  DrawingConflict,
  ScopeChangeFlag,
  RevisionComparison,
  DrawingFileMetadata,
  DrawingQAResult,
} from '../types-drawings'

export async function uploadDrawingFile(
  projectId: string,
  sheetId: string,
  revisionId: string,
  file: { name: string; size: number; type: string }
): Promise<DrawingFileMetadata> {
  const storageKey = `drawings/${projectId}/${sheetId}/${revisionId}/${Date.now()}-${file.name}`
  
  const metadata: DrawingFileMetadata = {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    uploadedBy: 'Current User',
    uploadedAt: new Date().toISOString(),
    storageKey,
  }
  
  const revisionsMetadata = await spark.kv.get<Record<string, DrawingFileMetadata>>(
    `drawing-files-${projectId}`
  ) || {}
  
  revisionsMetadata[revisionId] = metadata
  await spark.kv.set(`drawing-files-${projectId}`, revisionsMetadata)
  
  return metadata
}

export async function getDrawingFileMetadata(
  projectId: string,
  revisionId: string
): Promise<DrawingFileMetadata | null> {
  const metadata = await spark.kv.get<Record<string, DrawingFileMetadata>>(
    `drawing-files-${projectId}`
  )
  return metadata?.[revisionId] || null
}

export async function compareRevisions(
  projectId: string,
  sheetId: string,
  oldRevisionId: string,
  newRevisionId: string
): Promise<RevisionComparison | null> {
  const sets = await spark.kv.get<DrawingSet[]>(`drawing-sets-${projectId}`) || []
  
  let sheet: DrawingSheet | null = null
  let oldRevision: DrawingRevision | null = null
  let newRevision: DrawingRevision | null = null
  
  for (const set of sets) {
    const foundSheet = set.sheets.find(s => s.id === sheetId)
    if (foundSheet) {
      sheet = foundSheet
      oldRevision = foundSheet.revisions.find(r => r.id === oldRevisionId) || null
      newRevision = foundSheet.revisions.find(r => r.id === newRevisionId) || null
      break
    }
  }
  
  if (!sheet || !oldRevision || !newRevision) return null
  
  const changes: RevisionComparison['changes'] = []
  
  if (oldRevision.description !== newRevision.description) {
    changes.push({
      type: 'metadata',
      field: 'description',
      description: 'Revision description changed',
      oldValue: oldRevision.description,
      newValue: newRevision.description,
    })
  }
  
  const annotations = await spark.kv.get<DrawingAnnotation[]>(
    `drawing-annotations-${projectId}-${sheetId}`
  ) || []
  
  const newAnnotations = annotations.filter(a => a.revisionId === newRevisionId)
  if (newAnnotations.length > 0) {
    changes.push({
      type: 'annotation',
      description: `${newAnnotations.length} new annotation(s) added`,
    })
  }
  
  const scopeChanges = await spark.kv.get<ScopeChangeFlag[]>(
    `drawing-scope-changes-${projectId}-${sheetId}`
  ) || []
  
  const revisionScopeChanges = scopeChanges.filter(sc => sc.revisionId === newRevisionId)
  
  const conflicts = await spark.kv.get<DrawingConflict[]>(
    `drawing-conflicts-${projectId}-${sheetId}`
  ) || []
  
  const revisionConflicts = conflicts.filter(c => c.revisionId === newRevisionId)
  
  return {
    sheetId,
    sheetNumber: sheet.sheetNumber,
    sheetTitle: sheet.title,
    oldRevision: {
      id: oldRevision.id,
      revision: oldRevision.revision,
      date: oldRevision.date,
    },
    newRevision: {
      id: newRevision.id,
      revision: newRevision.revision,
      date: newRevision.date,
    },
    changes,
    scopeChanges: revisionScopeChanges,
    conflicts: revisionConflicts,
  }
}

export async function createAnnotation(
  projectId: string,
  sheetId: string,
  revisionId: string,
  annotation: Omit<DrawingAnnotation, 'id' | 'sheetId' | 'revisionId' | 'createdAt' | 'createdBy'>
): Promise<DrawingAnnotation> {
  const newAnnotation: DrawingAnnotation = {
    ...annotation,
    id: crypto.randomUUID(),
    sheetId,
    revisionId,
    createdBy: 'Current User',
    createdAt: new Date().toISOString(),
  }
  
  const annotations = await spark.kv.get<DrawingAnnotation[]>(
    `drawing-annotations-${projectId}-${sheetId}`
  ) || []
  
  await spark.kv.set(`drawing-annotations-${projectId}-${sheetId}`, [...annotations, newAnnotation])
  
  return newAnnotation
}

export async function getAnnotations(
  projectId: string,
  sheetId: string,
  revisionId?: string
): Promise<DrawingAnnotation[]> {
  const annotations = await spark.kv.get<DrawingAnnotation[]>(
    `drawing-annotations-${projectId}-${sheetId}`
  ) || []
  
  if (revisionId) {
    return annotations.filter(a => a.revisionId === revisionId)
  }
  
  return annotations
}

export async function resolveAnnotation(
  projectId: string,
  sheetId: string,
  annotationId: string
): Promise<void> {
  const annotations = await spark.kv.get<DrawingAnnotation[]>(
    `drawing-annotations-${projectId}-${sheetId}`
  ) || []
  
  const updated = annotations.map(a =>
    a.id === annotationId
      ? {
          ...a,
          status: 'resolved' as const,
          resolvedBy: 'Current User',
          resolvedAt: new Date().toISOString(),
        }
      : a
  )
  
  await spark.kv.set(`drawing-annotations-${projectId}-${sheetId}`, updated)
}

export async function createConflict(
  projectId: string,
  sheetId: string,
  revisionId: string,
  conflict: Omit<DrawingConflict, 'id' | 'sheetId' | 'revisionId' | 'createdAt'>
): Promise<DrawingConflict> {
  const newConflict: DrawingConflict = {
    ...conflict,
    id: crypto.randomUUID(),
    sheetId,
    revisionId,
    createdAt: new Date().toISOString(),
  }
  
  const conflicts = await spark.kv.get<DrawingConflict[]>(
    `drawing-conflicts-${projectId}-${sheetId}`
  ) || []
  
  await spark.kv.set(`drawing-conflicts-${projectId}-${sheetId}`, [...conflicts, newConflict])
  
  return newConflict
}

export async function getConflicts(
  projectId: string,
  sheetId?: string,
  status?: DrawingConflict['status']
): Promise<DrawingConflict[]> {
  if (sheetId) {
    const conflicts = await spark.kv.get<DrawingConflict[]>(
      `drawing-conflicts-${projectId}-${sheetId}`
    ) || []
    
    if (status) {
      return conflicts.filter(c => c.status === status)
    }
    
    return conflicts
  }
  
  const sets = await spark.kv.get<DrawingSet[]>(`drawing-sets-${projectId}`) || []
  const allConflicts: DrawingConflict[] = []
  
  for (const set of sets) {
    for (const sheet of set.sheets) {
      const conflicts = await spark.kv.get<DrawingConflict[]>(
        `drawing-conflicts-${projectId}-${sheet.id}`
      ) || []
      allConflicts.push(...conflicts)
    }
  }
  
  if (status) {
    return allConflicts.filter(c => c.status === status)
  }
  
  return allConflicts
}

export async function resolveConflict(
  projectId: string,
  sheetId: string,
  conflictId: string,
  resolutionNotes: string
): Promise<void> {
  const conflicts = await spark.kv.get<DrawingConflict[]>(
    `drawing-conflicts-${projectId}-${sheetId}`
  ) || []
  
  const updated = conflicts.map(c =>
    c.id === conflictId
      ? {
          ...c,
          status: 'resolved' as const,
          resolutionNotes,
          resolvedAt: new Date().toISOString(),
        }
      : c
  )
  
  await spark.kv.set(`drawing-conflicts-${projectId}-${sheetId}`, updated)
}

export async function createScopeChangeFlag(
  projectId: string,
  sheetId: string,
  revisionId: string,
  scopeChange: Omit<ScopeChangeFlag, 'id' | 'sheetId' | 'revisionId' | 'createdAt' | 'createdBy'>
): Promise<ScopeChangeFlag> {
  const newScopeChange: ScopeChangeFlag = {
    ...scopeChange,
    id: crypto.randomUUID(),
    sheetId,
    revisionId,
    createdBy: 'Current User',
    createdAt: new Date().toISOString(),
  }
  
  const scopeChanges = await spark.kv.get<ScopeChangeFlag[]>(
    `drawing-scope-changes-${projectId}-${sheetId}`
  ) || []
  
  await spark.kv.set(`drawing-scope-changes-${projectId}-${sheetId}`, [...scopeChanges, newScopeChange])
  
  return newScopeChange
}

export async function getScopeChanges(
  projectId: string,
  sheetId?: string,
  status?: ScopeChangeFlag['status']
): Promise<ScopeChangeFlag[]> {
  if (sheetId) {
    const scopeChanges = await spark.kv.get<ScopeChangeFlag[]>(
      `drawing-scope-changes-${projectId}-${sheetId}`
    ) || []
    
    if (status) {
      return scopeChanges.filter(sc => sc.status === status)
    }
    
    return scopeChanges
  }
  
  const sets = await spark.kv.get<DrawingSet[]>(`drawing-sets-${projectId}`) || []
  const allScopeChanges: ScopeChangeFlag[] = []
  
  for (const set of sets) {
    for (const sheet of set.sheets) {
      const scopeChanges = await spark.kv.get<ScopeChangeFlag[]>(
        `drawing-scope-changes-${projectId}-${sheet.id}`
      ) || []
      allScopeChanges.push(...scopeChanges)
    }
  }
  
  if (status) {
    return allScopeChanges.filter(sc => sc.status === status)
  }
  
  return allScopeChanges
}

export async function updateScopeChangeStatus(
  projectId: string,
  sheetId: string,
  scopeChangeId: string,
  status: ScopeChangeFlag['status'],
  rfiLinked?: string,
  changeOrderLinked?: string
): Promise<void> {
  const scopeChanges = await spark.kv.get<ScopeChangeFlag[]>(
    `drawing-scope-changes-${projectId}-${sheetId}`
  ) || []
  
  const updated = scopeChanges.map(sc =>
    sc.id === scopeChangeId
      ? {
          ...sc,
          status,
          ...(rfiLinked && { rfiLinked }),
          ...(changeOrderLinked && { changeOrderLinked }),
        }
      : sc
  )
  
  await spark.kv.set(`drawing-scope-changes-${projectId}-${sheetId}`, updated)
}

export async function runDrawingQA(
  projectId: string,
  sheetId: string,
  revisionId: string
): Promise<DrawingQAResult> {
  const checks: DrawingQAResult['checks'] = []
  
  const sets = await spark.kv.get<DrawingSet[]>(`drawing-sets-${projectId}`) || []
  let sheet: DrawingSheet | null = null
  let revision: DrawingRevision | null = null
  
  for (const set of sets) {
    const foundSheet = set.sheets.find(s => s.id === sheetId)
    if (foundSheet) {
      sheet = foundSheet
      revision = foundSheet.revisions.find(r => r.id === revisionId) || null
      break
    }
  }
  
  if (!sheet || !revision) {
    throw new Error('Sheet or revision not found')
  }
  
  if (!revision.description || revision.description.trim().length === 0) {
    checks.push({
      type: 'title-block',
      status: 'warning',
      message: 'Revision description is empty',
      details: 'Consider adding a description of the changes in this revision',
    })
  } else {
    checks.push({
      type: 'title-block',
      status: 'pass',
      message: 'Revision description provided',
    })
  }
  
  if (!revision.revision || revision.revision.trim().length === 0) {
    checks.push({
      type: 'title-block',
      status: 'fail',
      message: 'Revision number is missing',
      details: 'Revision number is required',
    })
  } else {
    checks.push({
      type: 'title-block',
      status: 'pass',
      message: 'Revision number provided',
    })
  }
  
  const conflicts = await spark.kv.get<DrawingConflict[]>(
    `drawing-conflicts-${projectId}-${sheetId}`
  ) || []
  
  const openConflicts = conflicts.filter(
    c => c.revisionId === revisionId && c.status === 'open'
  )
  
  if (openConflicts.length > 0) {
    const criticalConflicts = openConflicts.filter(c => c.severity === 'critical')
    if (criticalConflicts.length > 0) {
      checks.push({
        type: 'completeness',
        status: 'fail',
        message: `${criticalConflicts.length} critical conflict(s) unresolved`,
        details: 'Critical conflicts must be resolved before distribution',
      })
    } else {
      checks.push({
        type: 'completeness',
        status: 'warning',
        message: `${openConflicts.length} conflict(s) unresolved`,
        details: 'Consider resolving all conflicts before distribution',
      })
    }
  } else {
    checks.push({
      type: 'completeness',
      status: 'pass',
      message: 'No unresolved conflicts',
    })
  }
  
  const annotations = await spark.kv.get<DrawingAnnotation[]>(
    `drawing-annotations-${projectId}-${sheetId}`
  ) || []
  
  const revisionAnnotations = annotations.filter(a => a.revisionId === revisionId)
  checks.push({
    type: 'notes',
    status: 'pass',
    message: `${revisionAnnotations.length} annotation(s) attached`,
  })
  
  const failCount = checks.filter(c => c.status === 'fail').length
  const warningCount = checks.filter(c => c.status === 'warning').length
  
  let overallStatus: DrawingQAResult['overallStatus'] = 'pass'
  if (failCount > 0) {
    overallStatus = 'fail'
  } else if (warningCount > 0) {
    overallStatus = 'warning'
  }
  
  const result: DrawingQAResult = {
    sheetId,
    revisionId,
    checks,
    overallStatus,
    runAt: new Date().toISOString(),
  }
  
  const qaResults = await spark.kv.get<Record<string, DrawingQAResult>>(
    `drawing-qa-results-${projectId}`
  ) || {}
  
  qaResults[revisionId] = result
  await spark.kv.set(`drawing-qa-results-${projectId}`, qaResults)
  
  return result
}

export async function getDrawingQAResult(
  projectId: string,
  revisionId: string
): Promise<DrawingQAResult | null> {
  const qaResults = await spark.kv.get<Record<string, DrawingQAResult>>(
    `drawing-qa-results-${projectId}`
  )
  return qaResults?.[revisionId] || null
}
