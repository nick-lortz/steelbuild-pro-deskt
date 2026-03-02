/**
 * Drawings API Endpoints
 * Handles drawing sets, sheets, revisions, QA, conflicts, and annotations
 */

import type { ApiResponse, ListParams } from '../types'
import type { DrawingSet, DrawingSheet, DrawingRevision, DrawingAnnotation, DrawingConflict } from '@/lib/schema'
import { requireProjectAccess, canEdit } from '../middleware'
import { validate, drawingSetSchema, drawingSheetSchema, drawingRevisionSchema } from '../validation'
import { createSuccessResponse, createErrorResponse, throwNotFound, throwForbidden } from '../error-handler'
import { processListQuery } from '../pagination'
import { runDrawingQA, detectScopeChanges } from '@/lib/functions/drawings'

export async function listDrawingSets(projectId: string, params: ListParams = {}): Promise<ApiResponse> {
  try {
    await requireProjectAccess(projectId)
    
    const sets = await spark.kv.get<DrawingSet[]>('drawing_sets') || []
    const projectSets = sets.filter(s => s.project_id === projectId && !s.deleted_at)
    
    const result = processListQuery(projectSets, {
      page: params.page,
      pageSize: params.pageSize,
      sortBy: params.sortBy || 'created_at',
      sortOrder: params.sortOrder || 'desc',
      filters: params.filters,
    })
    
    return createSuccessResponse(result.data, result.meta)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function getDrawingSet(projectId: string, setId: string): Promise<ApiResponse> {
  try {
    await requireProjectAccess(projectId)
    
    const sets = await spark.kv.get<DrawingSet[]>('drawing_sets') || []
    const set = sets.find(s => s.id === setId && s.project_id === projectId && !s.deleted_at)
    
    if (!set) {
      throwNotFound('Drawing Set', setId)
    }
    
    const sheets = await spark.kv.get<DrawingSheet[]>('drawing_sheets') || []
    const setSheets = sheets.filter(sh => sh.drawing_set_id === setId && !sh.deleted_at)
    
    return createSuccessResponse({ ...set, sheets: setSheets })
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function createDrawingSet(projectId: string, data: unknown): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canEdit(context.userRole)) {
      throwForbidden('You do not have permission to create drawing sets')
    }
    
    const validatedData = validate(drawingSetSchema, data)
    
    const sets = await spark.kv.get<DrawingSet[]>('drawing_sets') || []
    
    const now = new Date().toISOString()
    const newSet: DrawingSet = {
      id: crypto.randomUUID(),
      project_id: projectId,
      ...validatedData,
      created_at: now,
      updated_at: now,
      created_by: context.userId,
      updated_by: context.userId,
      deleted_at: null,
    }
    
    await spark.kv.set('drawing_sets', [...sets, newSet])
    
    return createSuccessResponse(newSet)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function createDrawingSheet(projectId: string, data: unknown): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canEdit(context.userRole)) {
      throwForbidden('You do not have permission to create drawing sheets')
    }
    
    const validatedData = validate(drawingSheetSchema, data)
    
    const sets = await spark.kv.get<DrawingSet[]>('drawing_sets') || []
    const set = sets.find(s => s.id === validatedData.drawing_set_id && s.project_id === projectId)
    
    if (!set) {
      throwNotFound('Drawing Set', validatedData.drawing_set_id)
    }
    
    const sheets = await spark.kv.get<DrawingSheet[]>('drawing_sheets') || []
    
    const now = new Date().toISOString()
    const newSheet: DrawingSheet = {
      id: crypto.randomUUID(),
      project_id: projectId,
      ...validatedData,
      current_revision: null,
      created_at: now,
      updated_at: now,
      created_by: context.userId,
      updated_by: context.userId,
      deleted_at: null,
    }
    
    await spark.kv.set('drawing_sheets', [...sheets, newSheet])
    
    return createSuccessResponse(newSheet)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function createDrawingRevision(projectId: string, data: unknown): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canEdit(context.userRole)) {
      throwForbidden('You do not have permission to create drawing revisions')
    }
    
    const validatedData = validate(drawingRevisionSchema, data)
    
    const sheets = await spark.kv.get<DrawingSheet[]>('drawing_sheets') || []
    const sheet = sheets.find(s => s.id === validatedData.drawing_sheet_id && s.project_id === projectId)
    
    if (!sheet) {
      throwNotFound('Drawing Sheet', validatedData.drawing_sheet_id)
    }
    
    const revisions = await spark.kv.get<DrawingRevision[]>('drawing_revisions') || []
    
    const now = new Date().toISOString()
    const newRevision: DrawingRevision = {
      id: crypto.randomUUID(),
      project_id: projectId,
      ...validatedData,
      qa_status: 'pending',
      qa_issues: [],
      created_at: now,
      updated_at: now,
      created_by: context.userId,
      updated_by: context.userId,
    }
    
    await spark.kv.set('drawing_revisions', [...revisions, newRevision])
    
    const sheetIndex = sheets.findIndex(s => s.id === validatedData.drawing_sheet_id)
    sheets[sheetIndex] = {
      ...sheets[sheetIndex],
      current_revision: validatedData.revision,
      updated_at: now,
      updated_by: context.userId,
    }
    await spark.kv.set('drawing_sheets', sheets)
    
    return createSuccessResponse(newRevision)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function runDrawingQACheck(projectId: string, revisionId: string): Promise<ApiResponse> {
  try {
    await requireProjectAccess(projectId)
    
    const result = await runDrawingQA(projectId, revisionId)
    
    return createSuccessResponse(result)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function detectDrawingScopeChanges(projectId: string, revisionId: string): Promise<ApiResponse> {
  try {
    await requireProjectAccess(projectId)
    
    const result = await detectScopeChanges(projectId, revisionId)
    
    return createSuccessResponse(result)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function listDrawingConflicts(projectId: string, params: ListParams = {}): Promise<ApiResponse> {
  try {
    await requireProjectAccess(projectId)
    
    const conflicts = await spark.kv.get<DrawingConflict[]>('drawing_conflicts') || []
    const projectConflicts = conflicts.filter(c => c.project_id === projectId && !c.resolved_at)
    
    const result = processListQuery(projectConflicts, {
      page: params.page,
      pageSize: params.pageSize,
      sortBy: params.sortBy || 'severity',
      sortOrder: params.sortOrder || 'desc',
      filters: params.filters,
    })
    
    return createSuccessResponse(result.data, result.meta)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function createDrawingAnnotation(projectId: string, data: { sheet_id: string; x: number; y: number; content: string; type: string }): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    const annotations = await spark.kv.get<DrawingAnnotation[]>('drawing_annotations') || []
    
    const now = new Date().toISOString()
    const newAnnotation: DrawingAnnotation = {
      id: crypto.randomUUID(),
      project_id: projectId,
      drawing_sheet_id: data.sheet_id,
      x: data.x,
      y: data.y,
      content: data.content,
      type: data.type as any,
      created_at: now,
      updated_at: now,
      created_by: context.userId,
      updated_by: context.userId,
    }
    
    await spark.kv.set('drawing_annotations', [...annotations, newAnnotation])
    
    return createSuccessResponse(newAnnotation)
  } catch (error) {
    return createErrorResponse(error)
  }
}
