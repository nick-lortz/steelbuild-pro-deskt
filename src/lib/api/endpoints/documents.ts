/**
 * Documents API Endpoints
 * Secure file handling with access control
 */

import type { ApiResponse, ListParams } from '../types'
import type { Document } from '@/lib/schema'
import { requireProjectAccess, canEdit } from '../middleware'
import { validate, documentSchema } from '../validation'
import { createSuccessResponse, createErrorResponse, throwNotFound, throwForbidden } from '../error-handler'
import { processListQuery } from '../pagination'

export async function listDocuments(projectId: string, params: ListParams = {}): Promise<ApiResponse> {
  try {
    await requireProjectAccess(projectId)
    
    const documents = await spark.kv.get<Document[]>('documents') || []
    const projectDocs = documents.filter(d => d.project_id === projectId && !d.deleted_at)
    
    const result = processListQuery(projectDocs, {
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

export async function getDocument(projectId: string, documentId: string): Promise<ApiResponse> {
  try {
    await requireProjectAccess(projectId)
    
    const documents = await spark.kv.get<Document[]>('documents') || []
    const document = documents.find(d => d.id === documentId && d.project_id === projectId && !d.deleted_at)
    
    if (!document) {
      throwNotFound('Document', documentId)
    }
    
    return createSuccessResponse(document)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function uploadDocument(projectId: string, data: unknown): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canEdit(context.userRole)) {
      throwForbidden('You do not have permission to upload documents')
    }
    
    const validatedData = validate(documentSchema, data)
    
    const documents = await spark.kv.get<Document[]>('documents') || []
    
    const now = new Date().toISOString()
    const newDocument: Document = {
      id: crypto.randomUUID(),
      project_id: projectId,
      ...validatedData,
      created_at: now,
      updated_at: now,
      created_by: context.userId,
      updated_by: context.userId,
      deleted_at: null,
    }
    
    await spark.kv.set('documents', [...documents, newDocument])
    
    return createSuccessResponse(newDocument)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function downloadDocument(projectId: string, documentId: string): Promise<ApiResponse> {
  try {
    await requireProjectAccess(projectId)
    
    const documents = await spark.kv.get<Document[]>('documents') || []
    const document = documents.find(d => d.id === documentId && d.project_id === projectId && !d.deleted_at)
    
    if (!document) {
      throwNotFound('Document', documentId)
    }
    
    return createSuccessResponse({
      id: document.id,
      name: document.name,
      storage_key: document.storage_key,
      mime_type: document.mime_type,
      file_size: document.file_size,
    })
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function deleteDocument(projectId: string, documentId: string): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canEdit(context.userRole)) {
      throwForbidden('You do not have permission to delete documents')
    }
    
    const documents = await spark.kv.get<Document[]>('documents') || []
    const index = documents.findIndex(d => d.id === documentId && d.project_id === projectId && !d.deleted_at)
    
    if (index === -1) {
      throwNotFound('Document', documentId)
    }
    
    documents[index] = {
      ...documents[index],
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    }
    
    await spark.kv.set('documents', documents)
    
    return createSuccessResponse({ success: true })
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function updateDocumentMetadata(projectId: string, documentId: string, data: { tags?: string[]; category?: string }): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canEdit(context.userRole)) {
      throwForbidden('You do not have permission to update documents')
    }
    
    const documents = await spark.kv.get<Document[]>('documents') || []
    const index = documents.findIndex(d => d.id === documentId && d.project_id === projectId && !d.deleted_at)
    
    if (index === -1) {
      throwNotFound('Document', documentId)
    }
    
    const updated: Document = {
      ...documents[index],
      ...data,
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    }
    
    documents[index] = updated
    await spark.kv.set('documents', documents)
    
    return createSuccessResponse(updated)
  } catch (error) {
    return createErrorResponse(error)
  }
}
