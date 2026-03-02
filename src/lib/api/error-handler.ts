/**
 * API Error Handler
 * Standard error shape returned to frontend
 */

import type { ApiResponse, ApiError, ErrorCode } from './types'
import { ERROR_CODES } from './types'

export class ApiException extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: Record<string, unknown>,
    public field?: string
  ) {
    super(message)
    this.name = 'ApiException'
  }
}

export function createErrorResponse(error: unknown): ApiResponse {
  if (error instanceof ApiException) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        field: error.field,
      },
    }
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: error.message,
      },
    }
  }

  return {
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'An unknown error occurred',
    },
  }
}

export function createSuccessResponse<T>(data: T, meta?: ApiResponse['meta']): ApiResponse<T> {
  return {
    success: true,
    data,
    meta,
  }
}

export function throwUnauthorized(message = 'Unauthorized'): never {
  throw new ApiException(ERROR_CODES.UNAUTHORIZED, message)
}

export function throwForbidden(message = 'Forbidden'): never {
  throw new ApiException(ERROR_CODES.FORBIDDEN, message)
}

export function throwNotFound(resource: string, id?: string): never {
  throw new ApiException(
    ERROR_CODES.NOT_FOUND,
    id ? `${resource} with id ${id} not found` : `${resource} not found`
  )
}

export function throwValidationError(message: string, field?: string, details?: Record<string, unknown>): never {
  throw new ApiException(ERROR_CODES.VALIDATION_ERROR, message, details, field)
}

export function throwDuplicateError(resource: string, field: string): never {
  throw new ApiException(
    ERROR_CODES.DUPLICATE_ERROR,
    `${resource} with this ${field} already exists`,
    { field }
  )
}

export function throwBusinessRuleError(message: string, details?: Record<string, unknown>): never {
  throw new ApiException(ERROR_CODES.BUSINESS_RULE_ERROR, message, details)
}

export function throwNotMember(projectId: string): never {
  throw new ApiException(
    ERROR_CODES.NOT_MEMBER,
    `You are not a member of project ${projectId}`,
    { projectId }
  )
}
