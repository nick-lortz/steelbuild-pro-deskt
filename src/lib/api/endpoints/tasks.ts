/**
 * Tasks API Endpoints
 */

import type { ApiResponse, ListParams } from '../types'
import type { Task, TaskDependency } from '@/lib/schema'
import { requireProjectAccess, canEdit } from '../middleware'
import { validate, taskSchema, taskUpdateSchema } from '../validation'
import { createSuccessResponse, createErrorResponse, throwNotFound, throwForbidden } from '../error-handler'
import { processListQuery } from '../pagination'
import { computeCriticalPath } from '@/lib/functions/dashboard'

export async function listTasks(projectId: string, params: ListParams = {}): Promise<ApiResponse> {
  try {
    await requireProjectAccess(projectId)
    
    const tasks = await spark.kv.get<Task[]>('tasks') || []
    const projectTasks = tasks.filter(t => t.project_id === projectId && !t.deleted_at)
    
    const result = processListQuery(projectTasks, {
      page: params.page,
      pageSize: params.pageSize,
      sortBy: params.sortBy || 'start_date',
      sortOrder: params.sortOrder || 'asc',
      filters: params.filters,
    })
    
    return createSuccessResponse(result.data, result.meta)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function getTask(projectId: string, taskId: string): Promise<ApiResponse> {
  try {
    await requireProjectAccess(projectId)
    
    const tasks = await spark.kv.get<Task[]>('tasks') || []
    const task = tasks.find(t => t.id === taskId && t.project_id === projectId && !t.deleted_at)
    
    if (!task) {
      throwNotFound('Task', taskId)
    }
    
    const dependencies = await spark.kv.get<TaskDependency[]>('task_dependencies') || []
    const taskDeps = dependencies.filter(d => d.successor_id === taskId || d.predecessor_id === taskId)
    
    return createSuccessResponse({ ...task, dependencies: taskDeps })
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function createTask(projectId: string, data: unknown): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canEdit(context.userRole)) {
      throwForbidden('You do not have permission to create tasks')
    }
    
    const validatedData = validate(taskSchema, data)
    
    const tasks = await spark.kv.get<Task[]>('tasks') || []
    
    const now = new Date().toISOString()
    const newTask: Task = {
      id: crypto.randomUUID(),
      project_id: projectId,
      ...validatedData,
      created_at: now,
      updated_at: now,
      created_by: context.userId,
      updated_by: context.userId,
      deleted_at: null,
    }
    
    await spark.kv.set('tasks', [...tasks, newTask])
    
    return createSuccessResponse(newTask)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function updateTask(projectId: string, taskId: string, data: unknown): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canEdit(context.userRole)) {
      throwForbidden('You do not have permission to update tasks')
    }
    
    const validatedData = validate(taskUpdateSchema, data)
    
    const tasks = await spark.kv.get<Task[]>('tasks') || []
    const index = tasks.findIndex(t => t.id === taskId && t.project_id === projectId && !t.deleted_at)
    
    if (index === -1) {
      throwNotFound('Task', taskId)
    }
    
    const updated: Task = {
      ...tasks[index],
      ...validatedData,
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    }
    
    tasks[index] = updated
    await spark.kv.set('tasks', tasks)
    
    return createSuccessResponse(updated)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function deleteTask(projectId: string, taskId: string): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canEdit(context.userRole)) {
      throwForbidden('You do not have permission to delete tasks')
    }
    
    const tasks = await spark.kv.get<Task[]>('tasks') || []
    const index = tasks.findIndex(t => t.id === taskId && t.project_id === projectId && !t.deleted_at)
    
    if (index === -1) {
      throwNotFound('Task', taskId)
    }
    
    tasks[index] = {
      ...tasks[index],
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: context.userId,
    }
    
    await spark.kv.set('tasks', tasks)
    
    return createSuccessResponse({ success: true })
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function addTaskDependency(projectId: string, data: { predecessor_id: string; successor_id: string; type: string }): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canEdit(context.userRole)) {
      throwForbidden('You do not have permission to add dependencies')
    }
    
    const tasks = await spark.kv.get<Task[]>('tasks') || []
    const predecessor = tasks.find(t => t.id === data.predecessor_id && t.project_id === projectId)
    const successor = tasks.find(t => t.id === data.successor_id && t.project_id === projectId)
    
    if (!predecessor || !successor) {
      throwNotFound('Task', 'Predecessor or successor task not found')
    }
    
    const dependencies = await spark.kv.get<TaskDependency[]>('task_dependencies') || []
    
    const now = new Date().toISOString()
    const newDep: TaskDependency = {
      id: crypto.randomUUID(),
      project_id: projectId,
      predecessor_id: data.predecessor_id,
      successor_id: data.successor_id,
      type: data.type as any,
      lag: 0,
      created_at: now,
      updated_at: now,
      created_by: context.userId,
      updated_by: context.userId,
    }
    
    await spark.kv.set('task_dependencies', [...dependencies, newDep])
    
    return createSuccessResponse(newDep)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function computeProjectCriticalPath(projectId: string): Promise<ApiResponse> {
  try {
    await requireProjectAccess(projectId)
    
    const result = await computeCriticalPath(projectId)
    
    return createSuccessResponse(result)
  } catch (error) {
    return createErrorResponse(error)
  }
}
