/**
 * Pagination and Filtering Utilities
 */

import type { PaginationParams, SortParams, FilterParams, ResponseMeta } from './types'

export function applyPagination<T>(
  items: T[],
  params: PaginationParams
): { data: T[]; meta: ResponseMeta } {
  const { page, pageSize } = params
  const total = items.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const end = start + pageSize
  
  return {
    data: items.slice(start, end),
    meta: {
      page,
      pageSize,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  }
}

export function applySort<T>(
  items: T[],
  params: SortParams
): T[] {
  const { sortBy, sortOrder } = params
  
  return [...items].sort((a, b) => {
    const aVal = (a as any)[sortBy]
    const bVal = (b as any)[sortBy]
    
    if (aVal === bVal) return 0
    if (aVal == null) return 1
    if (bVal == null) return -1
    
    const comparison = aVal < bVal ? -1 : 1
    return sortOrder === 'asc' ? comparison : -comparison
  })
}

export function applyFilters<T>(
  items: T[],
  filters: FilterParams
): T[] {
  return items.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === undefined || value === null) return true
      
      const itemValue = (item as any)[key]
      
      if (typeof value === 'string' && typeof itemValue === 'string') {
        return itemValue.toLowerCase().includes(value.toLowerCase())
      }
      
      return itemValue === value
    })
  })
}

export function processListQuery<T>(
  items: T[],
  params: {
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    filters?: FilterParams
  }
): { data: T[]; meta: ResponseMeta } {
  let result = items
  
  if (params.filters) {
    result = applyFilters(result, params.filters)
  }
  
  if (params.sortBy) {
    result = applySort(result, {
      sortBy: params.sortBy,
      sortOrder: params.sortOrder || 'asc',
    })
  }
  
  if (params.page && params.pageSize) {
    return applyPagination(result, {
      page: params.page,
      pageSize: params.pageSize,
    })
  }
  
  return {
    data: result,
    meta: {
      total: result.length,
    },
  }
}
