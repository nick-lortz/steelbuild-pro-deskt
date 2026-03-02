export interface Project {
  id: string
  name: string
  number: string
  client: string
  location: string
  status: 'planning' | 'active' | 'onhold' | 'completed'
  startDate: string
  endDate?: string
  contractValue: number
  description?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface ProjectMember {
  id: string
  projectId: string
  userId: string
  userName: string
  email: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  permissions: string[]
  joinedAt: string
  createdAt: string
}

export interface ProjectContact {
  id: string
  projectId: string
  name: string
  company: string
  role: string
  email?: string
  phone?: string
  notes?: string
  createdAt: string
}

export interface ProjectRisk {
  id: string
  projectId: string
  title: string
  description: string
  category: 'schedule' | 'cost' | 'quality' | 'safety' | 'scope' | 'resource'
  probability: 'low' | 'medium' | 'high'
  impact: 'low' | 'medium' | 'high'
  status: 'identified' | 'analyzing' | 'mitigating' | 'closed'
  mitigation?: string
  owner?: string
  identifiedDate: string
  createdAt: string
}

export interface ProjectBaseline {
  id: string
  projectId: string
  name: string
  description?: string
  baselineDate: string
  schedule: Record<string, unknown>
  budget: Record<string, unknown>
  scope: string[]
  createdBy: string
  createdAt: string
}

export interface ProjectChecklistItem {
  id: string
  projectId: string
  category: 'setup' | 'execution' | 'closeout' | 'safety' | 'qa'
  description: string
  required: boolean
  completed: boolean
  completedBy?: string
  completedDate?: string
  order: number
  createdAt: string
}

export interface PMControlEntry {
  id: string
  projectId: string
  entryType: 'note' | 'decision' | 'issue' | 'observation'
  title: string
  content: string
  priority?: 'low' | 'medium' | 'high'
  tags: string[]
  createdBy: string
  createdAt: string
}

export interface CostCode {
  id: string
  code: string
  name: string
  category: 'labor' | 'material' | 'equipment' | 'subcontractor' | 'other'
  projectId?: string
  budgetAmount?: number
  actualAmount?: number
  createdAt: string
}

export interface ChangeOrder {
  id: string
  projectId: string
  number: string
  title: string
  description?: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  requestedBy: string
  requestedDate: string
  approvedDate?: string
  lineItems: ChangeOrderLineItem[]
  total: number
  createdAt: string
}

export interface ChangeOrderLineItem {
  id: string
  changeOrderId: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  total: number
}

export interface Contract {
  id: string
  projectId: string
  contractNumber: string
  title: string
  contractType: 'lump-sum' | 'unit-price' | 'cost-plus' | 'time-and-materials'
  value: number
  signedDate: string
  startDate: string
  completionDate?: string
  retainage: number
  terms?: string
  createdAt: string
}

export interface DrawingSet {
  id: string
  projectId: string
  setNumber: string
  title: string
  discipline: 'structural' | 'architectural' | 'mechanical' | 'electrical' | 'shop'
  sheets: DrawingSheet[]
  createdAt: string
}

export interface DrawingSheet {
  id: string
  setId: string
  sheetNumber: string
  title: string
  currentRevision?: string
  revisions: DrawingRevision[]
  createdAt: string
}

export interface DrawingRevision {
  id: string
  sheetId: string
  revision: string
  description: string
  date: string
  isCurrent: boolean
  uploadedBy: string
}

export interface Equipment {
  id: string
  name: string
  type: 'crane' | 'welder' | 'lift' | 'tool' | 'vehicle' | 'other'
  model?: string
  serialNumber?: string
  status: 'available' | 'in-use' | 'maintenance' | 'retired'
  location?: string
  assignedProjectId?: string
  lastMaintenanceDate?: string
  nextMaintenanceDate?: string
  createdAt: string
}

export interface ChecklistTemplate {
  id: string
  name: string
  category: 'safety' | 'quality' | 'pre-erection' | 'inspection' | 'other'
  items: ChecklistTemplateItem[]
  createdAt: string
}

export interface ChecklistTemplateItem {
  id: string
  text: string
  order: number
  required: boolean
}

export interface Checklist {
  id: string
  projectId: string
  templateId: string
  templateName: string
  assignedTo?: string
  dueDate?: string
  completedDate?: string
  items: ChecklistItem[]
  status: 'pending' | 'in-progress' | 'completed'
  createdAt: string
}

export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
  completedBy?: string
  completedDate?: string
  notes?: string
  order: number
}

export interface Task {
  id: string
  projectId: string
  name: string
  description?: string
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked'
  priority: 'low' | 'medium' | 'high' | 'critical'
  startDate: string
  endDate: string
  dependencies: string[]
  assignedTo?: string
  percentComplete: number
  isCriticalPath: boolean
  createdAt: string
}

export interface TaskTemplate {
  id: string
  name: string
  description?: string
  category: string
  tasks: Array<{
    name: string
    description?: string
    estimatedDuration: number
    dependencies: string[]
  }>
  createdAt: string
}

export interface Constraint {
  id: string
  projectId: string
  taskId: string
  type: 'start-no-earlier' | 'finish-no-later' | 'must-start-on' | 'must-finish-on'
  date: string
  reason: string
  createdAt: string
}

export interface ExecutionTask {
  id: string
  projectId: string
  workPackageId?: string
  name: string
  description?: string
  status: 'pending' | 'approved' | 'in-progress' | 'completed' | 'rejected'
  startDate?: string
  completionDate?: string
  assignedTo?: string
  createdAt: string
}

export interface ExecutionGate {
  id: string
  projectId: string
  name: string
  description: string
  gateType: 'design' | 'fabrication' | 'erection' | 'approval' | 'milestone'
  status: 'pending' | 'approved' | 'rejected'
  requiredBy: string
  dependencies: string[]
  createdAt: string
}

export interface ExecutionPermission {
  id: string
  projectId: string
  userId: string
  taskId?: string
  gateId?: string
  permissionType: 'approve' | 'execute' | 'review' | 'view'
  grantedBy: string
  grantedAt: string
}

export interface ApprovalGateDecision {
  id: string
  gateId: string
  projectId: string
  decision: 'approved' | 'rejected' | 'conditional'
  decidedBy: string
  decidedAt: string
  comments?: string
  conditions?: string[]
}

export interface Budget {
  id: string
  projectId: string
  costCodeId: string
  budgetedAmount: number
  actualAmount: number
  committedAmount: number
  variance: number
  createdAt: string
  updatedAt: string
}

export interface Invoice {
  id: string
  projectId: string
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  amount: number
  paidAmount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  lineItems: InvoiceLineItem[]
  createdAt: string
}

export interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

export interface RFI {
  id: string
  projectId: string
  number: string
  subject: string
  question: string
  answer?: string
  status: 'open' | 'answered' | 'closed' | 'escalated'
  priority: 'low' | 'medium' | 'high' | 'critical'
  submittedBy: string
  submittedDate: string
  answeredBy?: string
  answeredDate?: string
  escalatedDate?: string
  dueDate?: string
  createdAt: string
}

export interface RFISuggestion {
  id: string
  rfiId: string
  projectId: string
  suggestion: string
  suggestedBy: 'ai' | 'user'
  confidence?: number
  createdAt: string
}

export interface ResponseLagEvent {
  id: string
  rfiId: string
  projectId: string
  expectedResponseDate: string
  actualResponseDate?: string
  lagDays: number
  impact: 'low' | 'medium' | 'high'
  reason?: string
  createdAt: string
}

export interface Document {
  id: string
  projectId: string
  name: string
  type: 'contract' | 'drawing' | 'specification' | 'photo' | 'report' | 'other'
  category: string
  url?: string
  size: number
  uploadedBy: string
  uploadedDate: string
  tags: string[]
  createdAt: string
}

export interface WorkPackage {
  id: string
  projectId: string
  packageNumber: string
  title: string
  type: 'fabrication' | 'erection'
  status: 'planning' | 'ready' | 'in-progress' | 'completed'
  startDate?: string
  completionDate?: string
  assignedCrew?: string
  drawings: string[]
  materials: string[]
  createdAt: string
}

export interface Delivery {
  id: string
  projectId: string
  deliveryNumber: string
  description: string
  supplier: string
  expectedDate: string
  actualDate?: string
  status: 'scheduled' | 'in-transit' | 'delivered' | 'delayed' | 'cancelled'
  trackingNumber?: string
  items: DeliveryItem[]
  notes?: string
  createdAt: string
}

export interface DeliveryItem {
  id: string
  description: string
  quantity: number
  unit: string
  received: number
}

export interface LaborCategory {
  id: string
  name: string
  code: string
  baseRate: number
  overtimeRate: number
  createdAt: string
}

export interface LaborEntry {
  id: string
  projectId: string
  categoryId: string
  employeeName: string
  date: string
  regularHours: number
  overtimeHours: number
  totalHours: number
  costCodeId?: string
  description?: string
  createdAt: string
}

export interface EquipmentLog {
  id: string
  equipmentId: string
  projectId?: string
  date: string
  type: 'usage' | 'maintenance' | 'inspection' | 'repair'
  hours?: number
  description: string
  cost?: number
  performedBy: string
  createdAt: string
}

export interface DailyLog {
  id: string
  projectId: string
  date: string
  weather: string
  temperature?: number
  crew: Array<{ name: string; hours: number }>
  workPerformed: string
  issues?: string
  safetyNotes?: string
  visitors?: string[]
  deliveries?: string[]
  photos?: string[]
  createdBy: string
  createdAt: string
}

export interface Meeting {
  id: string
  projectId: string
  title: string
  type: 'coordination' | 'safety' | 'progress' | 'client' | 'other'
  date: string
  location?: string
  attendees: string[]
  agenda?: string
  notes: string
  actionItems: MeetingActionItem[]
  createdBy: string
  createdAt: string
}

export interface MeetingActionItem {
  id: string
  description: string
  assignedTo: string
  dueDate?: string
  completed: boolean
}

export interface AuditEntry {
  id: string
  entityType: string
  entityId: string
  action: 'create' | 'update' | 'delete'
  userId: string
  timestamp: string
  changes: Record<string, { old: unknown; new: unknown }>
  projectId?: string
}