/**
 * Project Members API Endpoints
 */

import type { ApiResponse, ListParams } from '../types'
import { requireProjectAccess, requireProjectRole, canManageMembers } from '../middleware'
import { validate, memberSchema } from '../validation'
import { createSuccessResponse, createErrorResponse, throwNotFound, throwForbidden } from '../error-handler'
import { processListQuery } from '../pagination'

interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: string
  permissions: string[]
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
}

export async function listMembers(projectId: string, params: ListParams = {}): Promise<ApiResponse> {
  try {
    await requireProjectAccess(projectId)
    
    const members = await spark.kv.get<ProjectMember[]>('project_members') || []
    const projectMembers = members.filter(m => m.project_id === projectId)
    
    const result = processListQuery(projectMembers, {
      page: params.page,
      pageSize: params.pageSize,
      sortBy: params.sortBy || 'created_at',
      sortOrder: params.sortOrder || 'asc',
      filters: params.filters,
    })
    
    return createSuccessResponse(result.data, result.meta)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function addMember(projectId: string, data: unknown): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canManageMembers(context.userRole)) {
      throwForbidden('Only owners and admins can add members')
    }
    
    const validatedData = validate(memberSchema, data)
    
    const members = await spark.kv.get<ProjectMember[]>('project_members') || []
    
    const existing = members.find(m => 
      m.project_id === projectId && 
      m.user_id === validatedData.user_id
    )
    
    if (existing) {
      throwForbidden('User is already a member of this project')
    }
    
    const now = new Date().toISOString()
    const newMember: ProjectMember = {
      id: crypto.randomUUID(),
      project_id: projectId,
      user_id: validatedData.user_id,
      role: validatedData.role,
      permissions: validatedData.permissions,
      created_at: now,
      updated_at: now,
      created_by: context.userId,
      updated_by: context.userId,
    }
    
    await spark.kv.set('project_members', [...members, newMember])
    
    return createSuccessResponse(newMember)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function updateMemberRole(projectId: string, memberId: string, data: unknown): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canManageMembers(context.userRole)) {
      throwForbidden('Only owners and admins can update member roles')
    }
    
    const validatedData = validate(memberSchema.partial(), data)
    
    const members = await spark.kv.get<ProjectMember[]>('project_members') || []
    const index = members.findIndex(m => m.id === memberId && m.project_id === projectId)
    
    if (index === -1) {
      throwNotFound('Member', memberId)
    }
    
    const updated: ProjectMember = {
      ...members[index],
      ...validatedData,
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    }
    
    members[index] = updated
    await spark.kv.set('project_members', members)
    
    return createSuccessResponse(updated)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function removeMember(projectId: string, memberId: string): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canManageMembers(context.userRole)) {
      throwForbidden('Only owners and admins can remove members')
    }
    
    const members = await spark.kv.get<ProjectMember[]>('project_members') || []
    const member = members.find(m => m.id === memberId && m.project_id === projectId)
    
    if (!member) {
      throwNotFound('Member', memberId)
    }
    
    if (member.role === 'owner') {
      const ownerCount = members.filter(m => m.project_id === projectId && m.role === 'owner').length
      if (ownerCount === 1) {
        throwForbidden('Cannot remove the last owner of a project')
      }
    }
    
    await spark.kv.set('project_members', members.filter(m => m.id !== memberId))
    
    return createSuccessResponse({ success: true })
  } catch (error) {
    return createErrorResponse(error)
  }
}
