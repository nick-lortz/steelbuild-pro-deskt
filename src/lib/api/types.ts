/**
 * API Type Definitions
 */

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: ApiError
  meta?: ResponseMeta
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
  field?: string
}

export interface ResponseMeta {
  page?: number
  pageSize?: number
  total?: number
  totalPages?: number
  hasMore?: boolean
}

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface SortParams {
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export interface FilterParams {
  [key: string]: string | number | boolean | null | undefined
}

export interface ListParams extends Partial<PaginationParams>, Partial<SortParams> {
  filters?: FilterParams
}

export interface RequestContext {
  userId: string
  projectId?: string
  userRole?: string
  permissions?: string[]
}

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_ERROR: 'DUPLICATE_ERROR',
  BUSINESS_RULE_ERROR: 'BUSINESS_RULE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_MEMBER: 'NOT_MEMBER',
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]
