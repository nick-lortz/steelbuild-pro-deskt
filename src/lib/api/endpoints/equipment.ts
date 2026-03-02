/**
 * Equipment API Endpoints
 */

import type { ApiResponse, ListParams } from '../types'
import type { Equipment, EquipmentLog } from '@/lib/schema'
import { requireProjectAccess, canEdit } from '../middleware'
import { validate, equipmentSchema } from '../validation'
import { createSuccessResponse, createErrorResponse, throwNotFound, throwForbidden } from '../error-handler'
import { processListQuery } from '../pagination'

export async function listEquipment(projectId: string, params: ListParams = {}): Promise<ApiResponse> {
  try {
    await requireProjectAccess(projectId)
    
    const equipment = await spark.kv.get<Equipment[]>('equipment') || []
    const projectEquipment = equipment.filter(e => e.project_id === projectId && !e.deleted_at)
    
    const result = processListQuery(projectEquipment, {
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

export async function getEquipment(projectId: string, equipmentId: string): Promise<ApiResponse> {
  try {
    await requireProjectAccess(projectId)
    
    const equipment = await spark.kv.get<Equipment[]>('equipment') || []
    const item = equipment.find(e => e.id === equipmentId && e.project_id === projectId && !e.deleted_at)
    
    if (!item) {
      throwNotFound('Equipment', equipmentId)
    }
    
    const logs = await spark.kv.get<EquipmentLog[]>('equipment_logs') || []
    const equipmentLogs = logs.filter(l => l.equipment_id === equipmentId)
    
    return createSuccessResponse({ ...item, logs: equipmentLogs })
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function createEquipment(projectId: string, data: unknown): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canEdit(context.userRole)) {
      throwForbidden('You do not have permission to create equipment')
    }
    
    const validatedData = validate(equipmentSchema, data)
    
    const equipment = await spark.kv.get<Equipment[]>('equipment') || []
    
    const now = new Date().toISOString()
    const newEquipment: Equipment = {
      id: crypto.randomUUID(),
      project_id: projectId,
      ...validatedData,
      created_at: now,
      updated_at: now,
      created_by: context.userId,
      updated_by: context.userId,
      deleted_at: null,
    }
    
    await spark.kv.set('equipment', [...equipment, newEquipment])
    
    return createSuccessResponse(newEquipment)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function updateEquipment(projectId: string, equipmentId: string, data: unknown): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canEdit(context.userRole)) {
      throwForbidden('You do not have permission to update equipment')
    }
    
    const validatedData = validate(equipmentSchema.partial(), data)
    
    const equipment = await spark.kv.get<Equipment[]>('equipment') || []
    const index = equipment.findIndex(e => e.id === equipmentId && e.project_id === projectId && !e.deleted_at)
    
    if (index === -1) {
      throwNotFound('Equipment', equipmentId)
    }
    
    const updated: Equipment = {
      ...equipment[index],
      ...validatedData,
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    }
    
    equipment[index] = updated
    await spark.kv.set('equipment', equipment)
    
    return createSuccessResponse(updated)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function deleteEquipment(projectId: string, equipmentId: string): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canEdit(context.userRole)) {
      throwForbidden('You do not have permission to delete equipment')
    }
    
    const equipment = await spark.kv.get<Equipment[]>('equipment') || []
    const index = equipment.findIndex(e => e.id === equipmentId && e.project_id === projectId && !e.deleted_at)
    
    if (index === -1) {
      throwNotFound('Equipment', equipmentId)
    }
    
    equipment[index] = {
      ...equipment[index],
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    }
    
    await spark.kv.set('equipment', equipment)
    
    return createSuccessResponse({ success: true })
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function addEquipmentLog(projectId: string, equipmentId: string, data: { type: string; description: string; hours?: number }): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    const equipment = await spark.kv.get<Equipment[]>('equipment') || []
    const item = equipment.find(e => e.id === equipmentId && e.project_id === projectId && !e.deleted_at)
    
    if (!item) {
      throwNotFound('Equipment', equipmentId)
    }
    
    const logs = await spark.kv.get<EquipmentLog[]>('equipment_logs') || []
    
    const now = new Date().toISOString()
    const newLog: EquipmentLog = {
      id: crypto.randomUUID(),
      project_id: projectId,
      equipment_id: equipmentId,
      type: data.type as any,
      description: data.description,
      hours: data.hours || null,
      date: now,
      performed_by: context.userId,
      created_at: now,
      updated_at: now,
      created_by: context.userId,
      updated_by: context.userId,
    }
    
    await spark.kv.set('equipment_logs', [...logs, newLog])
    
    return createSuccessResponse(newLog)
  } catch (error) {
    return createErrorResponse(error)
  }
}
