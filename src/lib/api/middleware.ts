/**
 * Authorization Middleware
 * Validates user access on every request
 */

import type { RequestContext } from './types'
import { throwUnauthorized, throwNotMember, throwForbidden } from './error-handler'

export async function getCurrentUser(): Promise<{ id: string; login: string; email: string; isOwner: boolean }> {
  try {
    const user = await spark.user()
    return {
      id: user.id,
      login: user.login,
      email: user.email,
      isOwner: user.isOwner,
    }
  } catch {
    throwUnauthorized('Failed to authenticate user')
  }
}

export async function getProjectMembership(projectId: string, userId: string): Promise<{ role: string; permissions: string[] } | null> {
  const members = await spark.kv.get<Array<{ project_id: string; user_id: string; role: string; permissions: string[] }>>('project_members') || []
  const member = members.find(m => m.project_id === projectId && m.user_id === userId)
  
  if (!member) return null
  
  return {
    role: member.role,
    permissions: member.permissions || [],
  }
}

export async function requireAuth(): Promise<RequestContext> {
  const user = await getCurrentUser()
  return {
    userId: user.id,
  }
}

export async function requireProjectAccess(projectId: string): Promise<RequestContext> {
  const user = await getCurrentUser()
  
  if (user.isOwner) {
    return {
      userId: user.id,
      projectId,
      userRole: 'owner',
      permissions: ['*'],
    }
  }
  
  const membership = await getProjectMembership(projectId, user.id)
  
  if (!membership) {
    throwNotMember(projectId)
  }
  
  return {
    userId: user.id,
    projectId,
    userRole: membership.role,
    permissions: membership.permissions,
  }
}

export async function requireProjectRole(projectId: string, allowedRoles: string[]): Promise<RequestContext> {
  const context = await requireProjectAccess(projectId)
  
  if (context.userRole && !allowedRoles.includes(context.userRole)) {
    throwForbidden(`This action requires one of these roles: ${allowedRoles.join(', ')}`)
  }
  
  return context
}

export async function requirePermission(projectId: string, permission: string): Promise<RequestContext> {
  const context = await requireProjectAccess(projectId)
  
  if (context.permissions?.includes('*')) {
    return context
  }
  
  if (!context.permissions?.includes(permission)) {
    throwForbidden(`This action requires permission: ${permission}`)
  }
  
  return context
}

export function canEdit(role: string): boolean {
  return ['owner', 'admin', 'member'].includes(role)
}

export function canDelete(role: string): boolean {
  return ['owner', 'admin'].includes(role)
}

export function canManageMembers(role: string): boolean {
  return ['owner', 'admin'].includes(role)
}
