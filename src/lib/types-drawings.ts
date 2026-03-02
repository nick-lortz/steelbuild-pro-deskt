export interface DrawingAnnotation {
  id: string
  sheetId: string
  revisionId: string
  type: 'note' | 'dimension' | 'issue' | 'scope-change'
  x: number
  y: number
  content: string
  status: 'open' | 'resolved' | 'deferred'
  createdBy: string
  createdAt: string
  resolvedBy?: string
  resolvedAt?: string
}

export interface DrawingConflict {
  id: string
  sheetId: string
  revisionId: string
  type: 'dimension-mismatch' | 'missing-detail' | 'coordination-clash' | 'spec-violation'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  location?: string
  status: 'open' | 'investigating' | 'resolved' | 'wont-fix'
  assignedTo?: string
  resolutionNotes?: string
  createdAt: string
  resolvedAt?: string
}

export interface ScopeChangeFlag {
  id: string
  sheetId: string
  revisionId: string
  title: string
  description: string
  impactType: 'cost' | 'schedule' | 'design' | 'fabrication' | 'erection'
  estimatedImpact?: string
  status: 'flagged' | 'reviewing' | 'approved' | 'rejected'
  rfiLinked?: string
  changeOrderLinked?: string
  createdBy: string
  createdAt: string
}

export interface RevisionComparison {
  sheetId: string
  sheetNumber: string
  sheetTitle: string
  oldRevision: {
    id: string
    revision: string
    date: string
  }
  newRevision: {
    id: string
    revision: string
    date: string
  }
  changes: Array<{
    type: 'metadata' | 'content' | 'annotation'
    field?: string
    description: string
    oldValue?: string
    newValue?: string
  }>
  scopeChanges: ScopeChangeFlag[]
  conflicts: DrawingConflict[]
}

export interface DrawingUploadMetadata {
  fileName: string
  fileSize: number
  fileType: string
  uploadedBy: string
  uploadedAt: string
  storageKey: string
  checksum?: string
}

export interface DrawingFileMetadata extends DrawingUploadMetadata {
  sheetCount?: number
  dimensions?: {
    width: number
    height: number
  }
  extractedText?: string
  revisionClouds?: Array<{
    location: string
    description: string
  }>
}

export interface DrawingQAResult {
  sheetId: string
  revisionId: string
  checks: Array<{
    type: 'title-block' | 'revision-cloud' | 'scale' | 'dimensions' | 'notes' | 'completeness'
    status: 'pass' | 'warning' | 'fail'
    message: string
    details?: string
  }>
  overallStatus: 'pass' | 'warning' | 'fail'
  runAt: string
}
