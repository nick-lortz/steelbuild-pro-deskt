/**
 * Labor API Endpoints
 */

import type { ApiResponse, ListParams } from '../types'
import type { LaborCategory, LaborEntry } from '@/lib/schema'
import { requireProjectAccess, canEdit } from '../middleware'
import { validate, laborCategorySchema, laborEntrySchema } from '../validation'
import { createSuccessResponse, createErrorResponse, throwNotFound, throwForbidden } from '../error-handler'
import { processListQuery } from '../pagination'

export async function listLaborCategories(projectId: string | null, params: ListParams = {}): Promise<ApiResponse> {
  try {
    if (projectId) {
      await requireProjectAccess(projectId)
    }
    
    const categories = await spark.kv.get<LaborCategory[]>('labor_categories') || []
    const filtered = projectId 
      ? categories.filter(c => (c.project_id === projectId || !c.project_id) && !c.deleted_at)
      : categories.filter(c => !c.project_id && !c.deleted_at)
    
    const result = processListQuery(filtered, {
      page: params.page,
      pageSize: params.pageSize,
      sortBy: params.sortBy || 'name',
      sortOrder: params.sortOrder || 'asc',
      filters: params.filters,
    })
    
    return createSuccessResponse(result.data, result.meta)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function createLaborCategory(projectId: string | null, data: unknown): Promise<ApiResponse> {
  try {
    if (projectId) {
      const context = await requireProjectAccess(projectId)
      if (context.userRole && !canEdit(context.userRole)) {
        throwForbidden('You do not have permission to create labor categories')
      }
    }
    
    const validatedData = validate(laborCategorySchema, data)
    
    const categories = await spark.kv.get<LaborCategory[]>('labor_categories') || []
    
    const now = new Date().toISOString()
    const user = await spark.user()
    
    const newCategory: LaborCategory = {
      id: crypto.randomUUID(),
      project_id: projectId || null,
      ...validatedData,
      created_at: now,
      updated_at: now,
      created_by: user.id,
      updated_by: user.id,
      deleted_at: null,
    }
    
    await spark.kv.set('labor_categories', [...categories, newCategory])
    
    return createSuccessResponse(newCategory)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function listLaborEntries(projectId: string, params: ListParams = {}): Promise<ApiResponse> {
  try {
    await requireProjectAccess(projectId)
    
    const entries = await spark.kv.get<LaborEntry[]>('labor_entries') || []
    const projectEntries = entries.filter(e => e.project_id === projectId && !e.deleted_at)
    
    const result = processListQuery(projectEntries, {
      page: params.page,
      pageSize: params.pageSize,
      sortBy: params.sortBy || 'date',
      sortOrder: params.sortOrder || 'desc',
      filters: params.filters,
    })
    
    return createSuccessResponse(result.data, result.meta)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function createLaborEntry(projectId: string, data: unknown): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canEdit(context.userRole)) {
      throwForbidden('You do not have permission to create labor entries')
    }
    
    const validatedData = validate(laborEntrySchema, data)
    
    const entries = await spark.kv.get<LaborEntry[]>('labor_entries') || []
    
    const now = new Date().toISOString()
    const newEntry: LaborEntry = {
      id: crypto.randomUUID(),
      project_id: projectId,
      ...validatedData,
      created_at: now,
      updated_at: now,
      created_by: context.userId,
      updated_by: context.userId,
      deleted_at: null,
    }
    
    await spark.kv.set('labor_entries', [...entries, newEntry])
    
    return createSuccessResponse(newEntry)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function updateLaborEntry(projectId: string, entryId: string, data: unknown): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canEdit(context.userRole)) {
      throwForbidden('You do not have permission to update labor entries')
    }
    
    const validatedData = validate(laborEntrySchema.partial(), data)
    
    const entries = await spark.kv.get<LaborEntry[]>('labor_entries') || []
    const index = entries.findIndex(e => e.id === entryId && e.project_id === projectId && !e.deleted_at)
    
    if (index === -1) {
      throwNotFound('Labor Entry', entryId)
    }
    
    const updated: LaborEntry = {
      ...entries[index],
      ...validatedData,
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    }
    
    entries[index] = updated
    await spark.kv.set('labor_entries', entries)
    
    return createSuccessResponse(updated)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function deleteLaborEntry(projectId: string, entryId: string): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canEdit(context.userRole)) {
      throwForbidden('You do not have permission to delete labor entries')
    }
    
    const entries = await spark.kv.get<LaborEntry[]>('labor_entries') || []
    const index = entries.findIndex(e => e.id === entryId && e.project_id === projectId && !e.deleted_at)
    
    if (index === -1) {
      throwNotFound('Labor Entry', entryId)
    }
    
    entries[index] = {
      ...entries[index],
      deleted_at: new Date().toISOString(),
    }
    
    await spark.kv.set('labor_entries', entries)
    
    return createSuccessResponse({ success: true })
  } catch (error) {
    return createErrorResponse(error)
  }
}
