export type DrawingStatus = 'IFA' | 'BFA' | 'OFS' | 'BFS' | 'FFF'

const STATUS_SEQUENCE: DrawingStatus[] = ['IFA', 'BFA', 'OFS', 'BFS', 'FFF']

export const STATUS_LABELS: Record<DrawingStatus, string> = {
  'IFA': 'Issued for Approval',
  'BFA': 'Back from Approval',
  'OFS': 'Out for Signature', 
  'BFS': 'Back from Signature',
  'FFF': 'Final for Fabrication',
}

export const STATUS_DESCRIPTIONS: Record<DrawingStatus, string> = {
  'IFA': 'Drawing issued to client/engineer for review and approval',
  'BFA': 'Drawing returned with comments or approval',
  'OFS': 'Approved drawing sent for final signatures',
  'BFS': 'Drawing returned with all required signatures',
  'FFF': 'Final approved drawing ready for fabrication (locked)',
}

export interface DrawingStatusTransition {
  canTransition: boolean
  reason?: string
  nextAvailableStatuses: DrawingStatus[]
}

export function canTransitionToStatus(
  currentStatus: DrawingStatus,
  targetStatus: DrawingStatus
): DrawingStatusTransition {
  const currentIndex = STATUS_SEQUENCE.indexOf(currentStatus)
  const targetIndex = STATUS_SEQUENCE.indexOf(targetStatus)
  
  if (currentStatus === 'FFF') {
    return {
      canTransition: false,
      reason: 'Drawing is FFF (Final for Fabrication) and locked to prevent shop-floor errors',
      nextAvailableStatuses: [],
    }
  }
  
  if (targetIndex <= currentIndex) {
    return {
      canTransition: false,
      reason: `Cannot move backwards from ${STATUS_LABELS[currentStatus]} to ${STATUS_LABELS[targetStatus]}`,
      nextAvailableStatuses: getNextAvailableStatuses(currentStatus),
    }
  }
  
  if (targetIndex > currentIndex + 1) {
    return {
      canTransition: false,
      reason: `Cannot skip status. Must progress linearly through: ${STATUS_SEQUENCE.slice(currentIndex, targetIndex + 1).map(s => STATUS_LABELS[s]).join(' → ')}`,
      nextAvailableStatuses: getNextAvailableStatuses(currentStatus),
    }
  }
  
  return {
    canTransition: true,
    nextAvailableStatuses: getNextAvailableStatuses(targetStatus),
  }
}

export function getNextAvailableStatuses(currentStatus: DrawingStatus): DrawingStatus[] {
  if (currentStatus === 'FFF') {
    return []
  }
  
  const currentIndex = STATUS_SEQUENCE.indexOf(currentStatus)
  if (currentIndex === -1 || currentIndex === STATUS_SEQUENCE.length - 1) {
    return []
  }
  
  return [STATUS_SEQUENCE[currentIndex + 1]]
}

export function canEdit(status: DrawingStatus, userRole: string = 'user'): boolean {
  if (status === 'FFF') {
    return userRole === 'project_manager' || userRole === 'admin'
  }
  return true
}

export function canDelete(status: DrawingStatus, userRole: string = 'user'): boolean {
  if (status === 'FFF') {
    return userRole === 'project_manager' || userRole === 'admin'
  }
  return true
}

export interface StatusValidationResult {
  isValid: boolean
  error?: string
  warning?: string
}

export function validateStatusTransition(
  currentStatus: DrawingStatus,
  targetStatus: DrawingStatus,
  userRole: string = 'user'
): StatusValidationResult {
  const transition = canTransitionToStatus(currentStatus, targetStatus)
  
  if (!transition.canTransition) {
    return {
      isValid: false,
      error: transition.reason,
    }
  }
  
  if (targetStatus === 'FFF' && userRole !== 'project_manager' && userRole !== 'admin') {
    return {
      isValid: false,
      error: 'Only Project Managers can mark drawings as FFF (Final for Fabrication)',
    }
  }
  
  if (targetStatus === 'FFF') {
    return {
      isValid: true,
      warning: 'Once marked FFF, this drawing will be locked to prevent accidental changes',
    }
  }
  
  return { isValid: true }
}

export function getStatusProgress(status: DrawingStatus): number {
  const index = STATUS_SEQUENCE.indexOf(status)
  return ((index + 1) / STATUS_SEQUENCE.length) * 100
}

export function getStatusColor(status: DrawingStatus): string {
  switch (status) {
    case 'IFA':
      return 'bg-blue-500'
    case 'BFA':
      return 'bg-purple-500'
    case 'OFS':
      return 'bg-yellow-500'
    case 'BFS':
      return 'bg-orange-500'
    case 'FFF':
      return 'bg-green-500'
    default:
      return 'bg-gray-500'
  }
}

export function isDrawingLocked(status: DrawingStatus): boolean {
  return status === 'FFF'
}

export function generateDrawingStatusEvent(
  drawingId: string,
  fromStatus: DrawingStatus,
  toStatus: DrawingStatus,
  userId: string
): {
  type: string
  description: string
  timestamp: string
  metadata: Record<string, any>
} {
  return {
    type: 'drawing_status_change',
    description: `Drawing status changed from ${STATUS_LABELS[fromStatus]} to ${STATUS_LABELS[toStatus]}`,
    timestamp: new Date().toISOString(),
    metadata: {
      drawingId,
      fromStatus,
      toStatus,
      userId,
      isLocked: toStatus === 'FFF',
    },
  }
}
