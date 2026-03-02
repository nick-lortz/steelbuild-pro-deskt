/**
 * RFIs API Endpoints
 */

import type { ApiResponse, ListParams } from '../types'
import type { RFI } from '@/lib/schema'
import { requireProjectAccess, canEdit } from '../middleware'
import { validate, rfiSchema, rfiUpdateSchema } from '../validation'
import { createSuccessResponse, createErrorResponse, throwNotFound, throwForbidden, throwDuplicateError } from '../error-handler'
import { processListQuery } from '../pagination'

export async function listRFIs(projectId: string, params: ListParams = {}): Promise<ApiResponse> {
  try {
    await requireProjectAccess(projectId)
    
    const rfis = await spark.kv.get<RFI[]>('rfis') || []
    const projectRFIs = rfis.filter(r => r.project_id === projectId && !r.deleted_at)
    
    const result = processListQuery(projectRFIs, {
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

export async function getRFI(projectId: string, rfiId: string): Promise<ApiResponse> {
  try {
    await requireProjectAccess(projectId)
    
    const rfis = await spark.kv.get<RFI[]>('rfis') || []
    const rfi = rfis.find(r => r.id === rfiId && r.project_id === projectId && !r.deleted_at)
    
    if (!rfi) {
      throwNotFound('RFI', rfiId)
    }
    
    const attachments = await spark.kv.get<any[]>('rfi_attachments') || []
    const rfiAttachments = attachments.filter(a => a.rfi_id === rfiId)
    
    return createSuccessResponse({ ...rfi, attachments: rfiAttachments })
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function createRFI(projectId: string, data: unknown): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canEdit(context.userRole)) {
      throwForbidden('You do not have permission to create RFIs')
    }
    
    const validatedData = validate(rfiSchema, data)
    
    const rfis = await spark.kv.get<RFI[]>('rfis') || []
    
    const duplicate = rfis.find(r => 
      r.project_id === projectId && 
      r.rfi_number === validatedData.rfi_number && 
      !r.deleted_at
    )
    
    if (duplicate) {
      throwDuplicateError('RFI', 'rfi_number')
    }
    
    const now = new Date().toISOString()
    const newRFI: RFI = {
      id: crypto.randomUUID(),
      project_id: projectId,
      ...validatedData,
      submitted_at: validatedData.status === 'submitted' ? now : null,
      answered_at: null,
      closed_at: null,
      response: null,
      response_by: null,
      escalated: false,
      escalation_reason: null,
      created_at: now,
      updated_at: now,
      created_by: context.userId,
      updated_by: context.userId,
      deleted_at: null,
    }
    
    await spark.kv.set('rfis', [...rfis, newRFI])
    
    return createSuccessResponse(newRFI)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function updateRFI(projectId: string, rfiId: string, data: unknown): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canEdit(context.userRole)) {
      throwForbidden('You do not have permission to update RFIs')
    }
    
    const validatedData = validate(rfiUpdateSchema, data)
    
    const rfis = await spark.kv.get<RFI[]>('rfis') || []
    const index = rfis.findIndex(r => r.id === rfiId && r.project_id === projectId && !r.deleted_at)
    
    if (index === -1) {
      throwNotFound('RFI', rfiId)
    }
    
    const existing = rfis[index]
    const now = new Date().toISOString()
    
    const updates: Partial<RFI> = {
      ...validatedData,
      updated_at: now,
      updated_by: context.userId,
    }
    
    if (validatedData.status === 'submitted' && existing.status !== 'submitted') {
      updates.submitted_at = now
    }
    
    if (validatedData.status === 'answered' && existing.status !== 'answered') {
      updates.answered_at = now
    }
    
    if (validatedData.status === 'closed' && existing.status !== 'closed') {
      updates.closed_at = now
    }
    
    const updated: RFI = {
      ...existing,
      ...updates,
    }
    
    rfis[index] = updated
    await spark.kv.set('rfis', rfis)
    
    return createSuccessResponse(updated)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function deleteRFI(projectId: string, rfiId: string): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canEdit(context.userRole)) {
      throwForbidden('You do not have permission to delete RFIs')
    }
    
    const rfis = await spark.kv.get<RFI[]>('rfis') || []
    const index = rfis.findIndex(r => r.id === rfiId && r.project_id === projectId && !r.deleted_at)
    
    if (index === -1) {
      throwNotFound('RFI', rfiId)
    }
    
    rfis[index] = {
      ...rfis[index],
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    }
    
    await spark.kv.set('rfis', rfis)
    
    return createSuccessResponse({ success: true })
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function escalateRFI(projectId: string, rfiId: string, reason: string): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    const rfis = await spark.kv.get<RFI[]>('rfis') || []
    const index = rfis.findIndex(r => r.id === rfiId && r.project_id === projectId && !r.deleted_at)
    
    if (index === -1) {
      throwNotFound('RFI', rfiId)
    }
    
    rfis[index] = {
      ...rfis[index],
      escalated: true,
      escalation_reason: reason,
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    }
    
    await spark.kv.set('rfis', rfis)
    
    return createSuccessResponse(rfis[index])
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function addRFIAttachment(projectId: string, rfiId: string, data: { name: string; storage_key: string; file_size: number; mime_type: string }): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    const rfis = await spark.kv.get<RFI[]>('rfis') || []
    const rfi = rfis.find(r => r.id === rfiId && r.project_id === projectId && !r.deleted_at)
    
    if (!rfi) {
      throwNotFound('RFI', rfiId)
    }
    
    const attachments = await spark.kv.get<any[]>('rfi_attachments') || []
    
    const now = new Date().toISOString()
    const newAttachment = {
      id: crypto.randomUUID(),
      rfi_id: rfiId,
      name: data.name,
      storage_key: data.storage_key,
      file_size: data.file_size,
      mime_type: data.mime_type,
      uploaded_by: context.userId,
      created_at: now,
    }
    
    await spark.kv.set('rfi_attachments', [...attachments, newAttachment])
    
    return createSuccessResponse(newAttachment)
  } catch (error) {
    return createErrorResponse(error)
  }
}
