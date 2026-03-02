/**
 * PMA (Project Management Assistant) API Endpoints
 */

import type { ApiResponse } from '../types'
import { requireProjectAccess } from '../middleware'
import { createSuccessResponse, createErrorResponse } from '../error-handler'
import { generateDailyBrief, generateInsights } from '@/lib/functions/pma'

interface PMAInsight {
  id: string
  project_id: string
  type: 'risk' | 'opportunity' | 'warning' | 'recommendation'
  category: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  action_items: string[]
  deep_link: string | null
  created_at: string
  resolved: boolean
  resolved_at: string | null
}

export async function getDailyBrief(projectId: string): Promise<ApiResponse> {
  try {
    await requireProjectAccess(projectId)
    
    const brief = await generateDailyBrief(projectId)
    
    return createSuccessResponse(brief)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function listInsights(projectId: string, params: { resolved?: boolean } = {}): Promise<ApiResponse> {
  try {
    await requireProjectAccess(projectId)
    
    const insights = await spark.kv.get<PMAInsight[]>('pma_insights') || []
    let filtered = insights.filter(i => i.project_id === projectId)
    
    if (params.resolved !== undefined) {
      filtered = filtered.filter(i => i.resolved === params.resolved)
    }
    
    filtered.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      const aPriority = priorityOrder[a.priority]
      const bPriority = priorityOrder[b.priority]
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }
      
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    
    return createSuccessResponse(filtered)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function generateProjectInsights(projectId: string): Promise<ApiResponse> {
  try {
    await requireProjectAccess(projectId)
    
    const insights = await generateInsights(projectId)
    
    const existingInsights = await spark.kv.get<PMAInsight[]>('pma_insights') || []
    
    const now = new Date().toISOString()
    const newInsights: PMAInsight[] = insights.map(i => ({
      id: crypto.randomUUID(),
      project_id: projectId,
      type: i.type,
      category: i.category,
      title: i.title,
      description: i.description,
      priority: i.priority,
      action_items: i.action_items,
      deep_link: i.deep_link || null,
      created_at: now,
      resolved: false,
      resolved_at: null,
    }))
    
    await spark.kv.set('pma_insights', [...existingInsights, ...newInsights])
    
    return createSuccessResponse(newInsights)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function markInsightResolved(projectId: string, insightId: string): Promise<ApiResponse> {
  try {
    await requireProjectAccess(projectId)
    
    const insights = await spark.kv.get<PMAInsight[]>('pma_insights') || []
    const index = insights.findIndex(i => i.id === insightId && i.project_id === projectId)
    
    if (index === -1) {
      return createErrorResponse(new Error('Insight not found'))
    }
    
    insights[index] = {
      ...insights[index],
      resolved: true,
      resolved_at: new Date().toISOString(),
    }
    
    await spark.kv.set('pma_insights', insights)
    
    return createSuccessResponse(insights[index])
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function markInsightUnresolved(projectId: string, insightId: string): Promise<ApiResponse> {
  try {
    await requireProjectAccess(projectId)
    
    const insights = await spark.kv.get<PMAInsight[]>('pma_insights') || []
    const index = insights.findIndex(i => i.id === insightId && i.project_id === projectId)
    
    if (index === -1) {
      return createErrorResponse(new Error('Insight not found'))
    }
    
    insights[index] = {
      ...insights[index],
      resolved: false,
      resolved_at: null,
    }
    
    await spark.kv.set('pma_insights', insights)
    
    return createSuccessResponse(insights[index])
  } catch (error) {
    return createErrorResponse(error)
  }
}
