export interface FabItem {
  id: string
  projectId: string
  workPackageId?: string
  deliveryId?: string
  pieceNumber: string
  pieceMark: string
  description: string
  drawingNumber?: string
  drawingSheetId?: string
  material: string
  materialGrade: string
  weight: number
  quantity: number
  unitOfMeasure: 'EA' | 'LF' | 'TON' | 'LBS'
  
  detailingStatus: 'not-started' | 'in-progress' | 'review' | 'approved' | 'released'
  detailingProgress: number
  detailingDueDate?: string
  detailingCompletedDate?: string
  detailingAssignedTo?: string
  detailingNotes?: string
  detailingRevision?: number
  detailingDependencies: DetailingDependency[]
  detailingBlockers: FabBlocker[]
  
  fabricationStatus: 'not-ready' | 'ready' | 'material-ordered' | 'material-received' | 'in-production' | 'qc-hold' | 'completed' | 'shipped'
  fabricationProgress: number
  fabricationStartDate?: string
  fabricationDueDate?: string
  fabricationCompletedDate?: string
  fabricationStation?: string
  fabricationAssignedTo?: string
  fabricationNotes?: string
  fabricationBlockers: FabBlocker[]
  
  deliveryRequired: boolean
  deliveryStatus?: 'not-scheduled' | 'scheduled' | 'in-transit' | 'delivered' | 'delayed'
  deliveryScheduledDate?: string
  deliveryActualDate?: string
  deliveryTruck?: string
  deliverySequence?: number
  deliveryNotes?: string
  
  qcChecks: QCCheck[]
  qcStatus: 'pending' | 'passed' | 'failed' | 'conditional'
  qcCompletedDate?: string
  qcInspector?: string
  qcNotes?: string
  
  tags: string[]
  priority: 'low' | 'normal' | 'high' | 'critical'
  criticality: 'non-critical' | 'critical-path' | 'long-lead'
  
  cost: number
  estimatedHours: number
  actualHours: number
  
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
  deletedAt?: string
}

export interface DetailingDependency {
  id: string
  dependencyType: 'drawing-approval' | 'rfi-response' | 'preceding-detail' | 'field-measurement' | 'vendor-drawing'
  description: string
  referenceId?: string
  referenceType?: 'drawing' | 'rfi' | 'fab-item' | 'submittal'
  status: 'pending' | 'resolved' | 'blocked'
  dueDate?: string
  resolvedDate?: string
  notes?: string
}

export interface FabBlocker {
  id: string
  blockerType: 'material-shortage' | 'equipment-down' | 'drawing-issue' | 'qc-issue' | 'resource-conflict' | 'other'
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  identifiedDate: string
  resolvedDate?: string
  assignedTo?: string
  impactDescription?: string
  resolution?: string
  status: 'active' | 'resolved' | 'mitigated'
}

export interface QCCheck {
  id: string
  checkType: 'dimensional' | 'welding' | 'coating' | 'material-cert' | 'visual' | 'ndt' | 'other'
  description: string
  requirement: string
  result: 'pass' | 'fail' | 'conditional' | 'pending'
  inspector?: string
  inspectionDate?: string
  notes?: string
  correctiveAction?: string
  photos?: string[]
}

export interface FabWorkPackage {
  id: string
  projectId: string
  packageNumber: string
  title: string
  description?: string
  packageType: 'fabrication' | 'erection' | 'mixed'
  
  fabItems: string[]
  totalPieces: number
  totalWeight: number
  totalCost: number
  
  detailingReadiness: FabReadinessCheck
  materialReadiness: FabReadinessCheck
  productionReadiness: FabReadinessCheck
  deliveryReadiness: FabReadinessCheck
  
  overallStatus: 'not-ready' | 'partially-ready' | 'ready' | 'in-progress' | 'completed'
  overallProgress: number
  
  scheduledStartDate?: string
  scheduledEndDate?: string
  actualStartDate?: string
  actualEndDate?: string
  
  assignedCrew?: string
  assignedStation?: string
  
  deliveryId?: string
  deliveryRequired: boolean
  
  notes?: string
  
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
}

export interface FabReadinessCheck {
  isReady: boolean
  readinessPercent: number
  requiredItems: FabReadinessItem[]
  blockers: FabBlocker[]
  lastChecked: string
  notes?: string
}

export interface FabReadinessItem {
  id: string
  category: 'detailing' | 'material' | 'equipment' | 'resources' | 'documentation'
  description: string
  required: boolean
  completed: boolean
  completedDate?: string
  completedBy?: string
  notes?: string
}

export interface FabDelivery {
  id: string
  projectId: string
  deliveryNumber: string
  description: string
  deliveryType: 'material-inbound' | 'fabricated-outbound' | 'vendor-direct'
  
  workPackageIds: string[]
  fabItemIds: string[]
  
  supplier?: string
  carrier?: string
  truckNumber?: string
  driverName?: string
  driverPhone?: string
  
  scheduledDate: string
  scheduledTime?: string
  actualDate?: string
  actualTime?: string
  
  status: 'scheduled' | 'confirmed' | 'in-transit' | 'arrived' | 'unloading' | 'completed' | 'delayed' | 'cancelled'
  
  origin: string
  destination: string
  
  totalPieces: number
  totalWeight: number
  
  items: DeliveryItem[]
  
  trackingNumber?: string
  bolNumber?: string
  invoiceNumber?: string
  
  receivedBy?: string
  receivedDate?: string
  receivedNotes?: string
  
  delays: DeliveryDelay[]
  
  notifications: DeliveryNotification[]
  
  photos?: string[]
  documents?: string[]
  
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
}

export interface DeliveryItem {
  id: string
  fabItemId?: string
  description: string
  quantity: number
  quantityReceived?: number
  unit: string
  weight: number
  pieceNumbers: string[]
  status: 'pending' | 'loaded' | 'in-transit' | 'delivered' | 'missing' | 'damaged'
  condition?: 'good' | 'damaged' | 'incomplete'
  conditionNotes?: string
}

export interface DeliveryDelay {
  id: string
  delayType: 'weather' | 'traffic' | 'mechanical' | 'site-access' | 'loading' | 'other'
  description: string
  duration: number
  impactLevel: 'low' | 'medium' | 'high'
  reportedDate: string
  reportedBy?: string
}

export interface DeliveryNotification {
  id: string
  notificationType: 'scheduled' | 'en-route' | 'eta-update' | 'arrived' | 'delayed' | 'completed'
  message: string
  sentTo: string[]
  sentAt: string
  method: 'email' | 'sms' | 'in-app'
}

export interface FabSchedule {
  id: string
  projectId: string
  workPackageId?: string
  
  scheduleName: string
  scheduleType: 'master' | 'weekly' | 'daily'
  
  startDate: string
  endDate: string
  
  fabItems: FabScheduleItem[]
  
  resources: FabResource[]
  
  conflicts: ScheduleConflict[]
  
  createdAt: string
  updatedAt: string
}

export interface FabScheduleItem {
  fabItemId: string
  pieceNumber: string
  sequenceNumber: number
  scheduledStartDate: string
  scheduledEndDate: string
  actualStartDate?: string
  actualEndDate?: string
  station?: string
  assignedCrew?: string
  estimatedHours: number
  actualHours?: number
  status: 'scheduled' | 'in-progress' | 'completed' | 'delayed'
  dependencies: string[]
  predecessors: string[]
  successors: string[]
}

export interface FabResource {
  id: string
  resourceType: 'crew' | 'equipment' | 'station' | 'crane' | 'welder'
  name: string
  available: boolean
  capacity: number
  utilization: number
  schedule: ResourceScheduleSlot[]
}

export interface ResourceScheduleSlot {
  startTime: string
  endTime: string
  fabItemId?: string
  workPackageId?: string
  status: 'available' | 'allocated' | 'in-use' | 'maintenance'
}

export interface ScheduleConflict {
  id: string
  conflictType: 'resource-overallocation' | 'dependency-violation' | 'date-overlap' | 'capacity-exceeded'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  affectedItems: string[]
  detectedDate: string
  resolvedDate?: string
  resolution?: string
  status: 'active' | 'resolved' | 'ignored'
}

export interface FabMetrics {
  projectId: string
  workPackageId?: string
  period: 'daily' | 'weekly' | 'monthly' | 'project-to-date'
  startDate: string
  endDate: string
  
  totalPieces: number
  piecesCompleted: number
  piecesInProgress: number
  piecesNotStarted: number
  
  totalWeight: number
  weightCompleted: number
  
  plannedHours: number
  actualHours: number
  efficiency: number
  
  detailingComplete: number
  detailingTotal: number
  detailingProgress: number
  
  fabricationComplete: number
  fabricationTotal: number
  fabricationProgress: number
  
  qcPassRate: number
  qcInspections: number
  qcPassed: number
  qcFailed: number
  
  deliveriesScheduled: number
  deliveriesCompleted: number
  deliveryOnTimeRate: number
  
  activeBlockers: number
  resolvedBlockers: number
  criticalBlockers: number
  
  scheduleVariance: number
  costVariance: number
  
  calculatedAt: string
}

export interface DetailingTask {
  id: string
  projectId: string
  fabItemId?: string
  workPackageId?: string
  
  taskNumber: string
  title: string
  description?: string
  
  taskType: 'connection' | 'member' | 'assembly' | 'anchor-plan' | 'erection-drawing' | 'shop-drawing'
  
  assignedTo?: string
  status: 'not-started' | 'in-progress' | 'review' | 'revision' | 'approved' | 'released'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  
  drawingNumber?: string
  revision: number
  
  dependencies: DetailingDependency[]
  blockers: FabBlocker[]
  
  estimatedHours: number
  actualHours: number
  
  dueDate?: string
  startDate?: string
  completedDate?: string
  approvedDate?: string
  releasedDate?: string
  
  reviewComments?: string
  revisionNotes?: string
  
  files: string[]
  
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
}

export interface FabReport {
  id: string
  reportType: 'daily' | 'weekly' | 'project-summary' | 'work-package' | 'delivery'
  projectId: string
  workPackageId?: string
  deliveryId?: string
  
  reportDate: string
  reportPeriodStart: string
  reportPeriodEnd: string
  
  title: string
  
  metrics: FabMetrics
  
  highlights: string[]
  issues: FabBlocker[]
  completedItems: string[]
  upcomingItems: string[]
  
  recommendations: string[]
  
  generatedBy?: string
  generatedAt: string
}
