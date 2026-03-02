/**
 * Deliveries API Endpoints
 */

import type { ApiResponse, ListParams } from '../types'
import type { Delivery } from '@/lib/schema'
import { requireProjectAccess, canEdit } from '../middleware'
import { validate, deliverySchema } from '../validation'
import { createSuccessResponse, createErrorResponse, throwNotFound, throwForbidden } from '../error-handler'
import { processListQuery } from '../pagination'

export async function listDeliveries(projectId: string, params: ListParams = {}): Promise<ApiResponse> {
  try {
    await requireProjectAccess(projectId)
    
    const deliveries = await spark.kv.get<Delivery[]>('deliveries') || []
    const projectDeliveries = deliveries.filter(d => d.project_id === projectId && !d.deleted_at)
    
    const result = processListQuery(projectDeliveries, {
      page: params.page,
      pageSize: params.pageSize,
      sortBy: params.sortBy || 'scheduled_date',
      sortOrder: params.sortOrder || 'asc',
      filters: params.filters,
    })
    
    return createSuccessResponse(result.data, result.meta)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function getDelivery(projectId: string, deliveryId: string): Promise<ApiResponse> {
  try {
    await requireProjectAccess(projectId)
    
    const deliveries = await spark.kv.get<Delivery[]>('deliveries') || []
    const delivery = deliveries.find(d => d.id === deliveryId && d.project_id === projectId && !d.deleted_at)
    
    if (!delivery) {
      throwNotFound('Delivery', deliveryId)
    }
    
    return createSuccessResponse(delivery)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function createDelivery(projectId: string, data: unknown): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canEdit(context.userRole)) {
      throwForbidden('You do not have permission to create deliveries')
    }
    
    const validatedData = validate(deliverySchema, data)
    
    const deliveries = await spark.kv.get<Delivery[]>('deliveries') || []
    
    const now = new Date().toISOString()
    const newDelivery: Delivery = {
      id: crypto.randomUUID(),
      project_id: projectId,
      ...validatedData,
      created_at: now,
      updated_at: now,
      created_by: context.userId,
      updated_by: context.userId,
      deleted_at: null,
    }
    
    await spark.kv.set('deliveries', [...deliveries, newDelivery])
    
    return createSuccessResponse(newDelivery)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function updateDelivery(projectId: string, deliveryId: string, data: unknown): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canEdit(context.userRole)) {
      throwForbidden('You do not have permission to update deliveries')
    }
    
    const validatedData = validate(deliverySchema.partial(), data)
    
    const deliveries = await spark.kv.get<Delivery[]>('deliveries') || []
    const index = deliveries.findIndex(d => d.id === deliveryId && d.project_id === projectId && !d.deleted_at)
    
    if (index === -1) {
      throwNotFound('Delivery', deliveryId)
    }
    
    const existing = deliveries[index]
    const updated: Delivery = {
      ...existing,
      ...validatedData,
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    }
    
    deliveries[index] = updated
    await spark.kv.set('deliveries', deliveries)
    
    if (validatedData.status && validatedData.status !== existing.status) {
      console.log(`Delivery ${deliveryId} status changed from ${existing.status} to ${validatedData.status}`)
    }
    
    return createSuccessResponse(updated)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function deleteDelivery(projectId: string, deliveryId: string): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canEdit(context.userRole)) {
      throwForbidden('You do not have permission to delete deliveries')
    }
    
    const deliveries = await spark.kv.get<Delivery[]>('deliveries') || []
    const index = deliveries.findIndex(d => d.id === deliveryId && d.project_id === projectId && !d.deleted_at)
    
    if (index === -1) {
      throwNotFound('Delivery', deliveryId)
    }
    
    deliveries[index] = {
      ...deliveries[index],
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    }
    
    await spark.kv.set('deliveries', deliveries)
    
    return createSuccessResponse({ success: true })
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function updateDeliveryStatus(projectId: string, deliveryId: string, status: string): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canEdit(context.userRole)) {
      throwForbidden('You do not have permission to update delivery status')
    }
    
    const deliveries = await spark.kv.get<Delivery[]>('deliveries') || []
    const index = deliveries.findIndex(d => d.id === deliveryId && d.project_id === projectId && !d.deleted_at)
    
    if (index === -1) {
      throwNotFound('Delivery', deliveryId)
    }
    
    const existing = deliveries[index]
    const now = new Date().toISOString()
    
    deliveries[index] = {
      ...existing,
      status: status as any,
      actual_date: status === 'delivered' ? now : existing.actual_date,
      updated_at: now,
      updated_by: context.userId,
    }
    
    await spark.kv.set('deliveries', deliveries)
    
    return createSuccessResponse(deliveries[index])
  } catch (error) {
    return createErrorResponse(error)
  }
}
