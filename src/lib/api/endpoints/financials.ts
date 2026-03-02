/**
 * Financials API Endpoints
 * Budgets, actuals, expenses, cost codes, invoices
 */

import type { ApiResponse, ListParams } from '../types'
import type { Budget, BudgetLineItem, Financial, Expense, CostCode, Invoice } from '@/lib/schema'
import { requireProjectAccess, canEdit } from '../middleware'
import { validate, costCodeSchema, expenseSchema } from '../validation'
import { createSuccessResponse, createErrorResponse, throwNotFound, throwForbidden, throwDuplicateError } from '../error-handler'
import { processListQuery } from '../pagination'

export async function getBudget(projectId: string): Promise<ApiResponse> {
  try {
    await requireProjectAccess(projectId)
    
    const budgets = await spark.kv.get<Budget[]>('budgets') || []
    const budget = budgets.find(b => b.project_id === projectId && !b.deleted_at)
    
    if (!budget) {
      throwNotFound('Budget', projectId)
    }
    
    const lineItems = await spark.kv.get<BudgetLineItem[]>('budget_line_items') || []
    const budgetLines = lineItems.filter(l => l.budget_id === budget.id && !l.deleted_at)
    
    return createSuccessResponse({ ...budget, line_items: budgetLines })
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function updateBudget(projectId: string, data: { total_budget?: number; line_items?: Array<{ cost_code_id: string; amount: number }> }): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canEdit(context.userRole)) {
      throwForbidden('You do not have permission to update budgets')
    }
    
    const budgets = await spark.kv.get<Budget[]>('budgets') || []
    let budget = budgets.find(b => b.project_id === projectId && !b.deleted_at)
    
    const now = new Date().toISOString()
    
    if (!budget) {
      budget = {
        id: crypto.randomUUID(),
        project_id: projectId,
        total_budget: data.total_budget || 0,
        total_actual: 0,
        variance: 0,
        created_at: now,
        updated_at: now,
        created_by: context.userId,
        updated_by: context.userId,
        deleted_at: null,
      }
      await spark.kv.set('budgets', [...budgets, budget])
    } else {
      const index = budgets.findIndex(b => b.id === budget!.id)
      budgets[index] = {
        ...budget,
        total_budget: data.total_budget ?? budget.total_budget,
        updated_at: now,
        updated_by: context.userId,
      }
      await spark.kv.set('budgets', budgets)
      budget = budgets[index]
    }
    
    return createSuccessResponse(budget)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function listExpenses(projectId: string, params: ListParams = {}): Promise<ApiResponse> {
  try {
    await requireProjectAccess(projectId)
    
    const expenses = await spark.kv.get<Expense[]>('expenses') || []
    const projectExpenses = expenses.filter(e => e.project_id === projectId && !e.deleted_at)
    
    const result = processListQuery(projectExpenses, {
      page: params.page,
      pageSize: params.pageSize,
      sortBy: params.sortBy || 'date',
      sortOrder: params.sortOrder || 'desc',
      filters: params.filters,
    })
    
    return createSuccessResponse(result.data, result.meta)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function createExpense(projectId: string, data: unknown): Promise<ApiResponse> {
  try {
    const context = await requireProjectAccess(projectId)
    
    if (context.userRole && !canEdit(context.userRole)) {
      throwForbidden('You do not have permission to create expenses')
    }
    
    const validatedData = validate(expenseSchema, data)
    
    const expenses = await spark.kv.get<Expense[]>('expenses') || []
    
    const now = new Date().toISOString()
    const newExpense: Expense = {
      id: crypto.randomUUID(),
      project_id: projectId,
      ...validatedData,
      created_at: now,
      updated_at: now,
      created_by: context.userId,
      updated_by: context.userId,
      deleted_at: null,
    }
    
    await spark.kv.set('expenses', [...expenses, newExpense])
    
    return createSuccessResponse(newExpense)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function listCostCodes(projectId: string, params: ListParams = {}): Promise<ApiResponse> {
  try {
    await requireProjectAccess(projectId)
    
    const codes = await spark.kv.get<CostCode[]>('cost_codes') || []
    const projectCodes = codes.filter(c => (c.project_id === projectId || !c.project_id) && !c.deleted_at)
    
    const result = processListQuery(projectCodes, {
      page: params.page,
      pageSize: params.pageSize,
      sortBy: params.sortBy || 'code',
      sortOrder: params.sortOrder || 'asc',
      filters: params.filters,
    })
    
    return createSuccessResponse(result.data, result.meta)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function createCostCode(projectId: string | null, data: unknown): Promise<ApiResponse> {
  try {
    const context = await spark.kv.get<{ userId: string }>('auth_context') || { userId: '' }
    
    if (projectId) {
      await requireProjectAccess(projectId)
    }
    
    const validatedData = validate(costCodeSchema, data)
    
    const codes = await spark.kv.get<CostCode[]>('cost_codes') || []
    
    const duplicate = codes.find(c => 
      c.code === validatedData.code && 
      (projectId ? c.project_id === projectId : !c.project_id) &&
      !c.deleted_at
    )
    
    if (duplicate) {
      throwDuplicateError('Cost Code', 'code')
    }
    
    const now = new Date().toISOString()
    const newCode: CostCode = {
      id: crypto.randomUUID(),
      project_id: projectId || null,
      ...validatedData,
      actual: 0,
      variance: validatedData.budget,
      created_at: now,
      updated_at: now,
      created_by: context.userId,
      updated_by: context.userId,
      deleted_at: null,
    }
    
    await spark.kv.set('cost_codes', [...codes, newCode])
    
    return createSuccessResponse(newCode)
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function getFinancialSummary(projectId: string): Promise<ApiResponse> {
  try {
    await requireProjectAccess(projectId)
    
    const budget = await spark.kv.get<Budget[]>('budgets') || []
    const projectBudget = budget.find(b => b.project_id === projectId && !b.deleted_at)
    
    const expenses = await spark.kv.get<Expense[]>('expenses') || []
    const projectExpenses = expenses.filter(e => e.project_id === projectId && !e.deleted_at)
    
    const totalActual = projectExpenses.reduce((sum, e) => sum + e.amount, 0)
    const totalBudget = projectBudget?.total_budget || 0
    const variance = totalBudget - totalActual
    const variancePercent = totalBudget ? (variance / totalBudget) * 100 : 0
    
    return createSuccessResponse({
      total_budget: totalBudget,
      total_actual: totalActual,
      variance,
      variance_percent: variancePercent,
      expense_count: projectExpenses.length,
    })
  } catch (error) {
    return createErrorResponse(error)
  }
}
