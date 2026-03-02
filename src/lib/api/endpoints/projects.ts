/**
 * Projects API Endpoints
 */

import type { ApiResponse, ListParams } from '../types'
import type { Project } from '@/lib/schema'
import { requireAuth, requireProjectAccess, requireProjectRole, canDelete } from '../middleware'
import { validate, projectSchema, projectUpdateSchema, paginationSchema } from '../validation'
import { createSuccessResponse, createErrorResponse, throwNotFound, throwDuplicateError, throwForbidden } from '../error-handler'
import { processListQuery } from '../pagination'

export async function listProjects(params: ListParams = {}): Promise<ApiResponse> {
  try {
    await requireAuth()
    
    const validatedParams = validate(paginationSchema.partial(), params)
    
    const projects = await spark.kv.get<Project[]>('projects') || []
    
    const activeProjects = projects.filter(p => !p.deleted_at)
    
    const result = processListQuery(activeProjects, {
      page: validatedParams.page,
      pageSize: validatedParams.pageSize,
      sortBy: params.sortBy || 'created_at',
      sortOrder: params.sortOrder || 'desc',
      filters: params.filters,
    })
    
    return createSuccessResponse(result.data, result.meta)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function getProject(id: string): Promise<ApiResponse> {
  try {
    await requireProjectAccess(id)
    
    const projects = await spark.kv.get<Project[]>('projects') || []
    const project = projects.find(p => p.id === id && !p.deleted_at)
    
    if (!project) {
      throwNotFound('Project', id)
    }
    
    return createSuccessResponse(project)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function createProject(data: unknown): Promise<ApiResponse> {
  try {
    const context = await requireAuth()
    
    const validatedData = validate(projectSchema, data)
    
    const projects = await spark.kv.get<Project[]>('projects') || []
    
    const duplicate = projects.find(p => p.project_number === validatedData.project_number && !p.deleted_at)
    if (duplicate) {
      throwDuplicateError('Project', 'project_number')
    }
    
    const now = new Date().toISOString()
    const newProject: Project = {
      id: crypto.randomUUID(),
      ...validatedData,
      created_at: now,
      updated_at: now,
      created_by: context.userId,
      updated_by: context.userId,
      deleted_at: null,
    }
    
    await spark.kv.set('projects', [...projects, newProject])
    
    const members = await spark.kv.get<any[]>('project_members') || []
    await spark.kv.set('project_members', [
      ...members,
      {
        id: crypto.randomUUID(),
        project_id: newProject.id,
        user_id: context.userId,
        role: 'owner',
        permissions: ['*'],
        created_at: now,
        updated_at: now,
        created_by: context.userId,
        updated_by: context.userId,
      },
    ])
    
    return createSuccessResponse(newProject)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function updateProject(id: string, data: unknown): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(id)
    
    if (context.userRole && !canDelete(context.userRole)) {
      throwForbidden('Only owners and admins can update projects')
    }
    
    const validatedData = validate(projectUpdateSchema, data)
    
    const projects = await spark.kv.get<Project[]>('projects') || []
    const index = projects.findIndex(p => p.id === id && !p.deleted_at)
    
    if (index === -1) {
      throwNotFound('Project', id)
    }
    
    if (validatedData.project_number) {
      const duplicate = projects.find(p => 
        p.project_number === validatedData.project_number && 
        p.id !== id && 
        !p.deleted_at
      )
      if (duplicate) {
        throwDuplicateError('Project', 'project_number')
      }
    }
    
    const updated: Project = {
      ...projects[index],
      ...validatedData,
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    }
    
    projects[index] = updated
    await spark.kv.set('projects', projects)
    
    return createSuccessResponse(updated)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function deleteProject(id: string): Promise<ApiResponse> {
  try {
    const context = await requireProjectRole(id, ['owner'])
    
    const projects = await spark.kv.get<Project[]>('projects') || []
    const index = projects.findIndex(p => p.id === id && !p.deleted_at)
    
    if (index === -1) {
      throwNotFound('Project', id)
    }
    
    projects[index] = {
      ...projects[index],
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    }
    
    await spark.kv.set('projects', projects)
    
    return createSuccessResponse({ success: true })
  } catch (error) {
    return createErrorResponse(error)
  }
}
