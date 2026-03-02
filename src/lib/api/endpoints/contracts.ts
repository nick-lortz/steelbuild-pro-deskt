/**
 * Contracts API Endpoints
 */

import type { ApiResponse, ListParams } from '../types'
import type { Contract } from '@/lib/schema'
import { requireProjectAccess, canEdit, canDelete } from '../middleware'
import { validate, contractSchema } from '../validation'
import { createSuccessResponse, createErrorResponse, throwNotFound, throwForbidden, throwDuplicateError } from '../error-handler'
import { processListQuery } from '../pagination'

export async function listContracts(projectId: string, params: ListParams = {}): Promise<ApiResponse> {
  try {
    await requireProjectAccess(projectId)
    
    const contracts = await spark.kv.get<Contract[]>('contracts') || []
    const projectContracts = contracts.filter(c => c.project_id === projectId && !c.deleted_at)
    
    const result = processListQuery(projectContracts, {
      page: params.page,
      pageSize: params.pageSize,
      sortBy: params.sortBy || 'start_date',
      sortOrder: params.sortOrder || 'desc',
      filters: params.filters,
    })
    
    return createSuccessResponse(result.data, result.meta)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function getContract(projectId: string, contractId: string): Promise<ApiResponse> {
  try {
    await requireProjectAccess(projectId)
    
    const contracts = await spark.kv.get<Contract[]>('contracts') || []
    const contract = contracts.find(c => c.id === contractId && c.project_id === projectId && !c.deleted_at)
    
    if (!contract) {
      throwNotFound('Contract', contractId)
    }
    
    return createSuccessResponse(contract)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function createContract(projectId: string, data: unknown): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canEdit(context.userRole)) {
      throwForbidden('You do not have permission to create contracts')
    }
    
    const validatedData = validate(contractSchema, data)
    
    const contracts = await spark.kv.get<Contract[]>('contracts') || []
    
    const duplicate = contracts.find(c => 
      c.project_id === projectId && 
      c.contract_number === validatedData.contract_number && 
      !c.deleted_at
    )
    
    if (duplicate) {
      throwDuplicateError('Contract', 'contract_number')
    }
    
    const now = new Date().toISOString()
    const newContract: Contract = {
      id: crypto.randomUUID(),
      project_id: projectId,
      ...validatedData,
      created_at: now,
      updated_at: now,
      created_by: context.userId,
      updated_by: context.userId,
      deleted_at: null,
    }
    
    await spark.kv.set('contracts', [...contracts, newContract])
    
    return createSuccessResponse(newContract)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function updateContract(projectId: string, contractId: string, data: unknown): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canEdit(context.userRole)) {
      throwForbidden('You do not have permission to update contracts')
    }
    
    const validatedData = validate(contractSchema.partial(), data)
    
    const contracts = await spark.kv.get<Contract[]>('contracts') || []
    const index = contracts.findIndex(c => c.id === contractId && c.project_id === projectId && !c.deleted_at)
    
    if (index === -1) {
      throwNotFound('Contract', contractId)
    }
    
    const updated: Contract = {
      ...contracts[index],
      ...validatedData,
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    }
    
    contracts[index] = updated
    await spark.kv.set('contracts', contracts)
    
    return createSuccessResponse(updated)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function deleteContract(projectId: string, contractId: string): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canDelete(context.userRole)) {
      throwForbidden('You do not have permission to delete contracts')
    }
    
    const contracts = await spark.kv.get<Contract[]>('contracts') || []
    const index = contracts.findIndex(c => c.id === contractId && c.project_id === projectId && !c.deleted_at)
    
    if (index === -1) {
      throwNotFound('Contract', contractId)
    }
    
    contracts[index] = {
      ...contracts[index],
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    }
    
    await spark.kv.set('contracts', contracts)
    
    return createSuccessResponse({ success: true })
  } catch (error) {
    return createErrorResponse(error)
  }
}
