/**
 * Change Orders API Endpoints
 */

import type { ApiResponse, ListParams } from '../types'
import type { ChangeOrder, ChangeOrderLineItem } from '@/lib/schema'
import { requireProjectAccess, canEdit, canDelete } from '../middleware'
import { validate, changeOrderSchema, changeOrderLineItemSchema } from '../validation'
import { createSuccessResponse, createErrorResponse, throwNotFound, throwForbidden, throwDuplicateError } from '../error-handler'
import { processListQuery } from '../pagination'

export async function listChangeOrders(projectId: string, params: ListParams = {}): Promise<ApiResponse> {
  try {
    await requireProjectAccess(projectId)
    
    const cos = await spark.kv.get<ChangeOrder[]>('change_orders') || []
    const projectCOs = cos.filter(c => c.project_id === projectId && !c.deleted_at)
    
    const result = processListQuery(projectCOs, {
      page: params.page,
      pageSize: params.pageSize,
      sortBy: params.sortBy || 'request_date',
      sortOrder: params.sortOrder || 'desc',
      filters: params.filters,
    })
    
    return createSuccessResponse(result.data, result.meta)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function getChangeOrder(projectId: string, coId: string): Promise<ApiResponse> {
  try {
    await requireProjectAccess(projectId)
    
    const cos = await spark.kv.get<ChangeOrder[]>('change_orders') || []
    const co = cos.find(c => c.id === coId && c.project_id === projectId && !c.deleted_at)
    
    if (!co) {
      throwNotFound('Change Order', coId)
    }
    
    const lineItems = await spark.kv.get<ChangeOrderLineItem[]>('change_order_line_items') || []
    const coLineItems = lineItems.filter(l => l.change_order_id === coId && !l.deleted_at)
    
    return createSuccessResponse({ ...co, line_items: coLineItems })
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function createChangeOrder(projectId: string, data: unknown): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canEdit(context.userRole)) {
      throwForbidden('You do not have permission to create change orders')
    }
    
    const validatedData = validate(changeOrderSchema, data)
    
    const cos = await spark.kv.get<ChangeOrder[]>('change_orders') || []
    
    const duplicate = cos.find(c => 
      c.project_id === projectId && 
      c.co_number === validatedData.co_number && 
      !c.deleted_at
    )
    
    if (duplicate) {
      throwDuplicateError('Change Order', 'co_number')
    }
    
    const now = new Date().toISOString()
    const newCO: ChangeOrder = {
      id: crypto.randomUUID(),
      project_id: projectId,
      ...validatedData,
      total_cost: 0,
      created_at: now,
      updated_at: now,
      created_by: context.userId,
      updated_by: context.userId,
      deleted_at: null,
    }
    
    await spark.kv.set('change_orders', [...cos, newCO])
    
    return createSuccessResponse(newCO)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function updateChangeOrder(projectId: string, coId: string, data: unknown): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canEdit(context.userRole)) {
      throwForbidden('You do not have permission to update change orders')
    }
    
    const validatedData = validate(changeOrderSchema.partial(), data)
    
    const cos = await spark.kv.get<ChangeOrder[]>('change_orders') || []
    const index = cos.findIndex(c => c.id === coId && c.project_id === projectId && !c.deleted_at)
    
    if (index === -1) {
      throwNotFound('Change Order', coId)
    }
    
    const updated: ChangeOrder = {
      ...cos[index],
      ...validatedData,
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    }
    
    cos[index] = updated
    await spark.kv.set('change_orders', cos)
    
    return createSuccessResponse(updated)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function deleteChangeOrder(projectId: string, coId: string): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canDelete(context.userRole)) {
      throwForbidden('You do not have permission to delete change orders')
    }
    
    const cos = await spark.kv.get<ChangeOrder[]>('change_orders') || []
    const index = cos.findIndex(c => c.id === coId && c.project_id === projectId && !c.deleted_at)
    
    if (index === -1) {
      throwNotFound('Change Order', coId)
    }
    
    cos[index] = {
      ...cos[index],
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    }
    
    await spark.kv.set('change_orders', cos)
    
    const lineItems = await spark.kv.get<ChangeOrderLineItem[]>('change_order_line_items') || []
    const updatedItems = lineItems.map(item => 
      item.change_order_id === coId && !item.deleted_at
        ? { ...item, deleted_at: new Date().toISOString() }
        : item
    )
    await spark.kv.set('change_order_line_items', updatedItems)
    
    return createSuccessResponse({ success: true })
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function addLineItem(projectId: string, coId: string, data: unknown): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canEdit(context.userRole)) {
      throwForbidden('You do not have permission to add line items')
    }
    
    const cos = await spark.kv.get<ChangeOrder[]>('change_orders') || []
    const co = cos.find(c => c.id === coId && c.project_id === projectId && !c.deleted_at)
    
    if (!co) {
      throwNotFound('Change Order', coId)
    }
    
    const validatedData = validate(changeOrderLineItemSchema, data)
    
    const lineItems = await spark.kv.get<ChangeOrderLineItem[]>('change_order_line_items') || []
    
    const now = new Date().toISOString()
    const newItem: ChangeOrderLineItem = {
      id: crypto.randomUUID(),
      project_id: projectId,
      change_order_id: coId,
      ...validatedData,
      created_at: now,
      updated_at: now,
      created_by: context.userId,
      updated_by: context.userId,
      deleted_at: null,
    }
    
    await spark.kv.set('change_order_line_items', [...lineItems, newItem])
    
    const coLineItems = [...lineItems, newItem].filter(l => l.change_order_id === coId && !l.deleted_at)
    const totalCost = coLineItems.reduce((sum, item) => sum + item.total_cost, 0)
    
    const coIndex = cos.findIndex(c => c.id === coId)
    cos[coIndex] = { ...cos[coIndex], total_cost: totalCost, updated_at: now }
    await spark.kv.set('change_orders', cos)
    
    return createSuccessResponse(newItem)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function updateLineItem(projectId: string, coId: string, itemId: string, data: unknown): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canEdit(context.userRole)) {
      throwForbidden('You do not have permission to update line items')
    }
    
    const validatedData = validate(changeOrderLineItemSchema.partial(), data)
    
    const lineItems = await spark.kv.get<ChangeOrderLineItem[]>('change_order_line_items') || []
    const index = lineItems.findIndex(l => l.id === itemId && l.change_order_id === coId && !l.deleted_at)
    
    if (index === -1) {
      throwNotFound('Line Item', itemId)
    }
    
    const updated: ChangeOrderLineItem = {
      ...lineItems[index],
      ...validatedData,
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    }
    
    lineItems[index] = updated
    await spark.kv.set('change_order_line_items', lineItems)
    
    return createSuccessResponse(updated)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function deleteLineItem(projectId: string, coId: string, itemId: string): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canEdit(context.userRole)) {
      throwForbidden('You do not have permission to delete line items')
    }
    
    const lineItems = await spark.kv.get<ChangeOrderLineItem[]>('change_order_line_items') || []
    const index = lineItems.findIndex(l => l.id === itemId && l.change_order_id === coId && !l.deleted_at)
    
    if (index === -1) {
      throwNotFound('Line Item', itemId)
    }
    
    lineItems[index] = {
      ...lineItems[index],
      deleted_at: new Date().toISOString(),
    }
    
    await spark.kv.set('change_order_line_items', lineItems)
    
    return createSuccessResponse({ success: true })
  } catch (error) {
    return createErrorResponse(error)
  }
}
