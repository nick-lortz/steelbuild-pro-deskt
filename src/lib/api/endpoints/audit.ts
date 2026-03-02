/**
 * Audit API Endpoints
 */

import type { ApiResponse, ListParams } from '../types'
import { requireProjectAccess, requireAuth } from '../middleware'
import { createSuccessResponse, createErrorResponse } from '../error-handler'
import { processListQuery } from '../pagination'
import { checkDataIntegrity, applyAutoFix, runFullAppAudit } from '@/lib/functions/data-integrity'

interface AuditRun {
  id: string
  project_id: string | null
  run_at: string
  findings_count: number
  fixes_applied: number
  status: 'running' | 'completed' | 'failed'
}

interface AuditFinding {
  id: string
  audit_run_id: string
  project_id: string | null
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: string
  description: string
  entity_type: string
  entity_id: string
  auto_fixable: boolean
  fixed: boolean
  fixed_at: string | null
}

export async function runAudit(projectId: string | null = null): Promise<ApiResponse> {
  try {
    if (projectId) {
      await requireProjectAccess(projectId)
    } else {
      await requireAuth()
    }
    
    const auditRuns = await spark.kv.get<AuditRun[]>('audit_runs') || []
    
    const now = new Date().toISOString()
    const newRun: AuditRun = {
      id: crypto.randomUUID(),
      project_id: projectId,
      run_at: now,
      findings_count: 0,
      fixes_applied: 0,
      status: 'running',
    }
    
    await spark.kv.set('audit_runs', [...auditRuns, newRun])
    
    const findings = projectId 
      ? await checkDataIntegrity(projectId)
      : await runFullAppAudit()
    
    const auditFindings = await spark.kv.get<AuditFinding[]>('audit_findings') || []
    const newFindings = findings.map(f => ({
      id: crypto.randomUUID(),
      audit_run_id: newRun.id,
      project_id: projectId,
      severity: f.severity,
      category: f.category,
      description: f.description,
      entity_type: f.entity_type,
      entity_id: f.entity_id,
      auto_fixable: f.auto_fixable,
      fixed: false,
      fixed_at: null,
    }))
    
    await spark.kv.set('audit_findings', [...auditFindings, ...newFindings])
    
    const runs = await spark.kv.get<AuditRun[]>('audit_runs') || []
    const runIndex = runs.findIndex(r => r.id === newRun.id)
    runs[runIndex] = {
      ...runs[runIndex],
      findings_count: newFindings.length,
      status: 'completed',
    }
    await spark.kv.set('audit_runs', runs)
    
    return createSuccessResponse({
      audit_run_id: newRun.id,
      findings_count: newFindings.length,
      findings: newFindings,
    })
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function listAuditFindings(projectId: string | null = null, params: ListParams = {}): Promise<ApiResponse> {
  try {
    if (projectId) {
      await requireProjectAccess(projectId)
    } else {
      await requireAuth()
    }
    
    const findings = await spark.kv.get<AuditFinding[]>('audit_findings') || []
    const filtered = projectId
      ? findings.filter(f => f.project_id === projectId)
      : findings
    
    const result = processListQuery(filtered, {
      page: params.page,
      pageSize: params.pageSize,
      sortBy: params.sortBy || 'severity',
      sortOrder: params.sortOrder || 'desc',
      filters: params.filters,
    })
    
    return createSuccessResponse(result.data, result.meta)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function applyFix(findingId: string): Promise<ApiResponse> {
  try {
    await requireAuth()
    
    const findings = await spark.kv.get<AuditFinding[]>('audit_findings') || []
    const index = findings.findIndex(f => f.id === findingId)
    
    if (index === -1) {
      return createErrorResponse(new Error('Finding not found'))
    }
    
    const finding = findings[index]
    
    if (!finding.auto_fixable) {
      return createErrorResponse(new Error('This finding cannot be auto-fixed'))
    }
    
    await applyAutoFix(finding.entity_type, finding.entity_id, finding.category)
    
    findings[index] = {
      ...finding,
      fixed: true,
      fixed_at: new Date().toISOString(),
    }
    
    await spark.kv.set('audit_findings', findings)
    
    return createSuccessResponse({ success: true, finding: findings[index] })
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function applyAllFixes(projectId: string | null = null): Promise<ApiResponse> {
  try {
    if (projectId) {
      await requireProjectAccess(projectId)
    } else {
      await requireAuth()
    }
    
    const findings = await spark.kv.get<AuditFinding[]>('audit_findings') || []
    const filtered = projectId
      ? findings.filter(f => f.project_id === projectId && f.auto_fixable && !f.fixed)
      : findings.filter(f => f.auto_fixable && !f.fixed)
    
    let fixedCount = 0
    const now = new Date().toISOString()
    
    for (const finding of filtered) {
      try {
        await applyAutoFix(finding.entity_type, finding.entity_id, finding.category)
        
        const index = findings.findIndex(f => f.id === finding.id)
        findings[index] = {
          ...finding,
          fixed: true,
          fixed_at: now,
        }
        
        fixedCount++
      } catch (error) {
        console.error(`Failed to fix finding ${finding.id}:`, error)
      }
    }
    
    await spark.kv.set('audit_findings', findings)
    
    return createSuccessResponse({
      success: true,
      total_fixable: filtered.length,
      fixed_count: fixedCount,
    })
  } catch (error) {
    return createErrorResponse(error)
  }
}
