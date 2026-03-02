export interface BudgetLineItem {
  id: string
  budgetId: string
  projectId: string
  costCodeId: string
  description: string
  amount: number
  createdAt: string
}

export interface Financial {
  id: string
  projectId: string
  type: 'revenue' | 'expense' | 'payment' | 'invoice'
  amount: number
  date: string
  category: string
  description?: string
  reference?: string
  createdAt: string
}

export interface Expense {
  id: string
  projectId: string
  date: string
  amount: number
  category: string
  vendor?: string
  description: string
  costCodeId?: string
  receiptUrl?: string
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  submittedBy: string
  approvedBy?: string
  createdAt: string
}

export interface ExpenseSplit {
  id: string
  expenseId: string
  projectId: string
  costCodeId: string
  amount: number
  percentage: number
  notes?: string
}

export interface SOVItem {
  id: string
  projectId: string
  versionId: string
  lineNumber: number
  description: string
  scheduledValue: number
  workCompleted: number
  materialsStored: number
  totalCompleted: number
  percentComplete: number
  retainage: number
  previouslyBilled: number
  currentBilling: number
  balance: number
  costCodeId?: string
  createdAt: string
  updatedAt: string
}

export interface SOVVersion {
  id: string
  projectId: string
  versionNumber: number
  periodStart: string
  periodEnd: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  submittedDate?: string
  approvedDate?: string
  submittedBy?: string
  approvedBy?: string
  notes?: string
  createdAt: string
}

export interface SOVCostCodeMap {
  id: string
  sovItemId: string
  costCodeId: string
  projectId: string
  allocatedAmount: number
  percentage: number
  createdAt: string
}

export interface ClientInvoice {
  id: string
  projectId: string
  invoiceNumber: string
  billingPeriodStart: string
  billingPeriodEnd: string
  invoiceDate: string
  dueDate: string
  sovVersionId: string
  subtotal: number
  retainagePercent: number
  retainageAmount: number
  total: number
  amountDue: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  paidDate?: string
  notes?: string
  createdAt: string
}

export interface InvoiceLine {
  id: string
  invoiceId: string
  projectId: string
  description: string
  quantity: number
  unit: string
  rate: number
  amount: number
  costCodeId?: string
  order: number
}

export interface EstimatedCostToComplete {
  id: string
  projectId: string
  costCodeId: string
  estimatedCost: number
  reasoning?: string
  confidence: 'low' | 'medium' | 'high'
  estimatedBy: string
  estimatedDate: string
  createdAt: string
}

export interface MarginRiskAssessment {
  id: string
  projectId: string
  assessmentDate: string
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical'
  projectedMargin: number
  targetMargin: number
  variance: number
  keyRisks: string[]
  mitigationPlan?: string
  assessedBy: string
  createdAt: string
}

export interface MarginRiskEvent {
  id: string
  assessmentId: string
  projectId: string
  eventType: 'cost-overrun' | 'schedule-delay' | 'scope-change' | 'resource-constraint'
  description: string
  impactAmount: number
  probability: number
  mitigated: boolean
  createdAt: string
}

export interface InstallMarginSnapshot {
  id: string
  projectId: string
  snapshotDate: string
  revenue: number
  directCosts: number
  indirectCosts: number
  grossMargin: number
  grossMarginPercent: number
  notes?: string
  createdBy: string
  createdAt: string
}

export interface ShippingCostRecord {
  id: string
  projectId: string
  deliveryId?: string
  shipDate: string
  carrier: string
  trackingNumber?: string
  origin: string
  destination: string
  weight?: number
  cost: number
  costCodeId?: string
  notes?: string
  createdAt: string
}

export interface RateCard {
  id: string
  name: string
  effectiveDate: string
  expirationDate?: string
  laborRates: Record<string, number>
  equipmentRates: Record<string, number>
  markups: {
    labor?: number
    material?: number
    equipment?: number
    subcontractor?: number
  }
  createdAt: string
}

export interface LaborBreakdown {
  id: string
  projectId: string
  laborCategoryId: string
  workPackageId?: string
  date: string
  budgetedHours: number
  actualHours: number
  variance: number
  createdAt: string
}

export interface LaborHours {
  id: string
  projectId: string
  employeeId: string
  employeeName: string
  laborCategoryId: string
  date: string
  regularHours: number
  overtimeHours: number
  doubleTimeHours: number
  totalHours: number
  costCodeId?: string
  workPackageId?: string
  description?: string
  approvedBy?: string
  createdAt: string
}

export interface Resource {
  id: string
  name: string
  type: 'labor' | 'equipment' | 'material' | 'subcontractor'
  category: string
  unitOfMeasure: string
  baseRate: number
  availability: 'available' | 'limited' | 'unavailable'
  location?: string
  createdAt: string
}

export interface ResourceCost {
  id: string
  resourceId: string
  projectId: string
  date: string
  quantity: number
  unitCost: number
  totalCost: number
  costCodeId?: string
  notes?: string
  createdAt: string
}

export interface ResourceAllocation {
  id: string
  resourceId: string
  projectId: string
  startDate: string
  endDate: string
  allocatedQuantity: number
  utilization: number
  status: 'planned' | 'allocated' | 'released'
  notes?: string
  createdAt: string
}

export interface Crew {
  id: string
  name: string
  foremanId: string
  foremanName: string
  members: Array<{
    employeeId: string
    employeeName: string
    role: string
    laborCategoryId: string
  }>
  status: 'active' | 'inactive'
  assignedProjectId?: string
  createdAt: string
}

export interface EquipmentUsage {
  id: string
  equipmentId: string
  projectId: string
  date: string
  startTime?: string
  endTime?: string
  hours: number
  operatorId?: string
  operatorName?: string
  costCodeId?: string
  workPackageId?: string
  fuelUsed?: number
  notes?: string
  createdAt: string
}

export interface EquipmentBooking {
  id: string
  equipmentId: string
  projectId: string
  requestedBy: string
  startDate: string
  endDate: string
  status: 'requested' | 'approved' | 'rejected' | 'active' | 'completed' | 'cancelled'
  purpose?: string
  approvedBy?: string
  approvedDate?: string
  createdAt: string
}

export interface InspectionChecklist {
  id: string
  equipmentId: string
  inspectionType: 'daily' | 'weekly' | 'monthly' | 'annual' | 'pre-use'
  inspectionDate: string
  inspectorId: string
  inspectorName: string
  items: Array<{
    id: string
    description: string
    passed: boolean
    notes?: string
  }>
  overallStatus: 'pass' | 'fail' | 'conditional'
  findings?: string
  actionRequired?: string
  nextInspectionDate?: string
  createdAt: string
}

export interface FabricationPackage {
  id: string
  projectId: string
  packageNumber: string
  title: string
  status: 'planning' | 'released' | 'in-progress' | 'completed'
  releaseDate?: string
  completionDate?: string
  drawings: string[]
  materialList: string[]
  crew?: string
  createdAt: string
}

export interface FabReleaseGroup {
  id: string
  projectId: string
  groupNumber: string
  description: string
  releaseDate: string
  packages: string[]
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'released' | 'completed'
  createdAt: string
}

export interface FabReadinessItem {
  id: string
  packageId: string
  projectId: string
  itemType: 'drawing' | 'material' | 'tooling' | 'approval'
  description: string
  status: 'pending' | 'ready' | 'blocked'
  dueDate?: string
  completedDate?: string
  notes?: string
  createdAt: string
}

export interface Fabrication {
  id: string
  projectId: string
  workPackageId: string
  fabricationPackageId?: string
  pieceNumber: string
  description: string
  status: 'not-started' | 'in-progress' | 'completed' | 'qa-hold' | 'rework'
  startDate?: string
  completionDate?: string
  assignedCrew?: string
  weight?: number
  notes?: string
  createdAt: string
}

export interface Detailing {
  id: string
  projectId: string
  detailNumber: string
  description: string
  detailer: string
  status: 'assigned' | 'in-progress' | 'review' | 'approved' | 'onhold'
  priority: 'low' | 'medium' | 'high'
  dueDate: string
  completedDate?: string
  reviewedBy?: string
  approvedDate?: string
  currentRevision: number
  createdAt: string
}

export interface DetailingRevision {
  id: string
  detailingId: string
  projectId: string
  revisionNumber: number
  description: string
  changes?: string
  submittedBy: string
  submittedDate: string
  reviewStatus: 'pending' | 'approved' | 'rejected' | 'revise'
  reviewComments?: string
  createdAt: string
}

export interface DetailingAction {
  id: string
  detailingId: string
  projectId: string
  actionType: 'note' | 'change' | 'issue' | 'approval'
  description: string
  actionBy: string
  actionDate: string
  resolved: boolean
  createdAt: string
}

export interface DetailImprovement {
  id: string
  detailingId: string
  projectId: string
  suggestion: string
  category: 'efficiency' | 'accuracy' | 'standard' | 'workflow'
  impact: 'low' | 'medium' | 'high'
  status: 'proposed' | 'approved' | 'implemented' | 'rejected'
  proposedBy: string
  createdAt: string
}

export interface ErectionIssue {
  id: string
  projectId: string
  workPackageId?: string
  issueType: 'fit' | 'missing' | 'damaged' | 'safety' | 'design' | 'coordination'
  description: string
  location: string
  reportedBy: string
  reportedDate: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'investigating' | 'resolved' | 'closed'
  resolution?: string
  resolvedBy?: string
  resolvedDate?: string
  photos?: string[]
  impactDays?: number
  createdAt: string
}

export interface ErectionReadiness {
  id: string
  projectId: string
  workPackageId: string
  checkDate: string
  checkedBy: string
  readyCriteria: Array<{
    id: string
    criteria: string
    status: 'ready' | 'not-ready' | 'partial'
    notes?: string
  }>
  overallStatus: 'ready' | 'not-ready' | 'conditional'
  estimatedStartDate?: string
  blockingIssues: string[]
  createdAt: string
}

export interface ErectionPickPlan {
  id: string
  projectId: string
  workPackageId: string
  planNumber: string
  description: string
  crane: string
  riggingPlan?: string
  safetyRequirements: string[]
  crewSize: number
  estimatedDuration: number
  weatherConstraints?: string
  status: 'draft' | 'review' | 'approved'
  approvedBy?: string
  approvedDate?: string
  createdAt: string
}

export interface FieldInstall {
  id: string
  projectId: string
  workPackageId?: string
  installNumber: string
  description: string
  location: string
  status: 'planned' | 'in-progress' | 'completed' | 'onhold'
  scheduledDate?: string
  startDate?: string
  completionDate?: string
  crew?: string
  percentComplete: number
  notes?: string
  createdAt: string
}

export interface FieldIssue {
  id: string
  projectId: string
  issueNumber: string
  issueType: 'safety' | 'quality' | 'coordination' | 'resource' | 'weather' | 'other'
  description: string
  location: string
  reportedBy: string
  reportedDate: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'investigating' | 'resolved' | 'closed'
  assignedTo?: string
  resolution?: string
  resolvedBy?: string
  resolvedDate?: string
  photos?: string[]
  createdAt: string
}

export interface PunchItem {
  id: string
  projectId: string
  itemNumber: string
  workPackageId?: string
  location: string
  description: string
  trade: string
  priority: 'low' | 'medium' | 'high'
  status: 'open' | 'in-progress' | 'completed' | 'verified' | 'closed'
  identifiedBy: string
  identifiedDate: string
  assignedTo?: string
  dueDate?: string
  completedBy?: string
  completedDate?: string
  verifiedBy?: string
  verifiedDate?: string
  photos?: string[]
  createdAt: string
}

export interface DeliveryRiskEvent {
  id: string
  deliveryId: string
  projectId: string
  riskType: 'delay' | 'damage' | 'shortage' | 'quality' | 'routing'
  description: string
  impact: 'low' | 'medium' | 'high'
  detectedDate: string
  mitigationAction?: string
  resolved: boolean
  resolvedDate?: string
  createdAt: string
}

export interface DrawingSheetRevision {
  id: string
  sheetId: string
  revision: string
  description: string
  date: string
  isCurrent: boolean
  uploadedBy: string
  fileUrl?: string
  createdAt: string
}

export interface DrawingAnnotation {
  id: string
  sheetId: string
  projectId: string
  annotationType: 'note' | 'issue' | 'clarification' | 'change'
  xPosition: number
  yPosition: number
  content: string
  createdBy: string
  createdAt: string
  resolved: boolean
  resolvedBy?: string
  resolvedDate?: string
}

export interface DrawingConflict {
  id: string
  projectId: string
  sheet1Id: string
  sheet2Id?: string
  conflictType: 'clash' | 'dimension' | 'missing' | 'discrepancy'
  description: string
  severity: 'low' | 'medium' | 'high'
  status: 'identified' | 'investigating' | 'resolved'
  identifiedBy: string
  identifiedDate: string
  resolution?: string
  resolvedBy?: string
  resolvedDate?: string
  createdAt: string
}

export interface ScopeReference {
  id: string
  projectId: string
  documentId?: string
  sheetId?: string
  referenceType: 'contract' | 'drawing' | 'specification' | 'submittal'
  referenceNumber: string
  description: string
  section?: string
  page?: number
  notes?: string
  tags: string[]
  createdAt: string
}

export interface ScopeGap {
  id: string
  projectId: string
  title: string
  description: string
  category: 'missing-work' | 'unclear-requirement' | 'conflicting-info' | 'out-of-scope'
  impact: 'schedule' | 'cost' | 'quality' | 'safety'
  severity: 'low' | 'medium' | 'high'
  status: 'identified' | 'clarifying' | 'resolved' | 'escalated'
  identifiedBy: string
  identifiedDate: string
  affectedReferences: string[]
  resolution?: string
  resolvedBy?: string
  resolvedDate?: string
  createdAt: string
}

export interface DesignIntentFlag {
  id: string
  projectId: string
  documentId?: string
  sheetId?: string
  flagType: 'clarification' | 'concern' | 'suggestion' | 'error'
  description: string
  reasoning: string
  proposedSolution?: string
  raisedBy: string
  raisedDate: string
  status: 'open' | 'under-review' | 'accepted' | 'rejected' | 'resolved'
  response?: string
  respondedBy?: string
  respondedDate?: string
  createdAt: string
}

export interface Message {
  id: string
  projectId?: string
  threadId?: string
  senderId: string
  senderName: string
  recipients: string[]
  subject?: string
  content: string
  attachments?: string[]
  sentAt: string
  readBy: Array<{ userId: string; readAt: string }>
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  type: 'alert' | 'reminder' | 'update' | 'approval' | 'message'
  title: string
  message: string
  link?: string
  entityType?: string
  entityId?: string
  projectId?: string
  read: boolean
  readAt?: string
  priority: 'low' | 'normal' | 'high'
  createdAt: string
}

export interface NotificationPreference {
  id: string
  userId: string
  channel: 'email' | 'push' | 'in-app'
  notificationType: string
  enabled: boolean
  frequency?: 'immediate' | 'daily' | 'weekly'
  updatedAt: string
}

export interface EmailTemplate {
  id: string
  name: string
  category: 'rfi' | 'change-order' | 'invoice' | 'notification' | 'report'
  subject: string
  body: string
  variables: string[]
  createdAt: string
  updatedAt: string
}

export interface ProductionNote {
  id: string
  projectId: string
  noteType: 'general' | 'fabrication' | 'erection' | 'coordination' | 'issue'
  subject: string
  content: string
  attachments?: string[]
  tags: string[]
  createdBy: string
  createdAt: string
  pinnedUntil?: string
}

export interface CollaborationSession {
  id: string
  projectId: string
  sessionType: 'review' | 'coordination' | 'planning' | 'troubleshooting'
  title: string
  participants: string[]
  startTime: string
  endTime?: string
  status: 'active' | 'completed'
  notes?: string
  decisions: string[]
  actionItems: string[]
  createdAt: string
}

export interface CollaborationMessage {
  id: string
  sessionId: string
  projectId: string
  senderId: string
  senderName: string
  message: string
  timestamp: string
  attachments?: string[]
}

export interface Feedback {
  id: string
  projectId?: string
  category: 'bug' | 'feature' | 'improvement' | 'question'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  status: 'submitted' | 'reviewing' | 'planned' | 'in-progress' | 'completed' | 'declined'
  submittedBy: string
  submittedAt: string
  responseText?: string
  respondedBy?: string
  respondedAt?: string
  createdAt: string
}

export interface AIInsight {
  id: string
  projectId: string
  insightType: 'risk' | 'opportunity' | 'optimization' | 'prediction' | 'anomaly'
  title: string
  description: string
  confidence: number
  dataSource: string[]
  recommendation?: string
  impactEstimate?: string
  generatedAt: string
  reviewed: boolean
  reviewedBy?: string
  reviewedAt?: string
  actionTaken?: string
  createdAt: string
}

export interface Alert {
  id: string
  projectId?: string
  alertType: 'warning' | 'error' | 'info' | 'success'
  category: 'schedule' | 'cost' | 'quality' | 'safety' | 'resource' | 'system'
  title: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  entityType?: string
  entityId?: string
  triggeredAt: string
  acknowledgedBy?: string
  acknowledgedAt?: string
  resolved: boolean
  resolvedBy?: string
  resolvedAt?: string
  createdAt: string
}

export interface QAConfig {
  id: string
  projectId?: string
  name: string
  description?: string
  ruleType: 'validation' | 'consistency' | 'completeness' | 'threshold'
  entityType: string
  ruleDefinition: Record<string, unknown>
  severity: 'info' | 'warning' | 'error'
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface AuditRun {
  id: string
  projectId?: string
  auditType: 'scheduled' | 'manual' | 'triggered'
  startTime: string
  endTime?: string
  status: 'running' | 'completed' | 'failed'
  entitiesChecked: number
  findingsCount: number
  errorCount: number
  warningCount: number
  infoCount: number
  runBy: string
  createdAt: string
}

export interface AuditFinding {
  id: string
  auditRunId: string
  projectId?: string
  qaConfigId: string
  findingType: string
  entityType: string
  entityId: string
  severity: 'info' | 'warning' | 'error'
  message: string
  details?: Record<string, unknown>
  status: 'open' | 'acknowledged' | 'fixed' | 'ignored'
  acknowledgedBy?: string
  acknowledgedAt?: string
  createdAt: string
}

export interface AuditFixTask {
  id: string
  findingId: string
  projectId?: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  assignedTo?: string
  dueDate?: string
  completedBy?: string
  completedAt?: string
  resolution?: string
  createdAt: string
}

export interface AuditLog {
  id: string
  entityType: string
  entityId: string
  action: 'create' | 'update' | 'delete'
  userId: string
  userName: string
  timestamp: string
  changes: Record<string, { old: unknown; new: unknown }>
  projectId?: string
  ipAddress?: string
  userAgent?: string
}

export interface Report {
  id: string
  projectId?: string
  name: string
  reportType: 'financial' | 'schedule' | 'production' | 'custom'
  description?: string
  parameters: Record<string, unknown>
  schedule?: 'daily' | 'weekly' | 'monthly' | 'none'
  recipients: string[]
  format: 'pdf' | 'excel' | 'csv' | 'html'
  lastRunAt?: string
  nextRunAt?: string
  createdBy: string
  createdAt: string
}

export interface SequenceComputationRun {
  id: string
  projectId: string
  runType: 'manual' | 'scheduled' | 'triggered'
  startTime: string
  endTime?: string
  status: 'running' | 'completed' | 'failed'
  tasksProcessed: number
  criticalPathUpdated: boolean
  constraintsApplied: number
  errors?: string[]
  result?: Record<string, unknown>
  runBy: string
  createdAt: string
}
