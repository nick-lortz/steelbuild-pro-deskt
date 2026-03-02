/**
 * SteelBuild Pro - Comprehensive Database Schema
 * 
 * This file defines the complete database schema with:
 * - created_at, updated_at, created_by, updated_by on all entities
 * - Soft delete (deleted_at) where appropriate
 * - project_id on all project-scoped entities
 * - Foreign keys and indexes
 * - Uniqueness constraints
 * - Cascade behaviors
 */

export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
}

export interface SoftDeletable {
  deleted_at: string | null
}

export interface ProjectScoped {
  project_id: string
}

export interface Project extends BaseEntity, SoftDeletable {
  project_number: string
  name: string
  client: string
  location: string
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled'
  start_date: string
  end_date: string
  contract_value: number
  description: string | null
  manager_id: string
}

export interface ProjectMember extends BaseEntity, ProjectScoped {
  user_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  permissions: string[]
}

export interface ProjectContact extends BaseEntity, ProjectScoped, SoftDeletable {
  name: string
  company: string
  role: string
  email: string | null
  phone: string | null
  notes: string | null
}

export interface ProjectRisk extends BaseEntity, ProjectScoped, SoftDeletable {
  title: string
  category: string
  probability: number
  impact: number
  status: 'identified' | 'active' | 'mitigated' | 'closed'
  mitigation: string | null
  owner_id: string
}

export interface ProjectBaseline extends BaseEntity, ProjectScoped {
  name: string
  baseline_date: string
  schedule_data: object
  budget_data: object
  scope_data: object
}

export interface ProjectChecklistItem extends BaseEntity, ProjectScoped, SoftDeletable {
  category: string
  description: string
  required: boolean
  completed: boolean
  completed_at: string | null
  completed_by: string | null
  due_date: string | null
  assigned_to: string | null
}

export interface PMControlEntry extends BaseEntity, ProjectScoped {
  entry_type: 'note' | 'decision' | 'issue' | 'observation'
  title: string
  content: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  tags: string[]
  resolved: boolean
  resolved_at: string | null
}

export interface Task extends BaseEntity, ProjectScoped, SoftDeletable {
  name: string
  description: string | null
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked'
  priority: 'low' | 'medium' | 'high' | 'critical'
  start_date: string
  end_date: string
  duration_days: number
  percent_complete: number
  assigned_to: string | null
  dependencies: string[]
  is_critical_path: boolean
  baseline_start: string | null
  baseline_end: string | null
  slack_days: number
}

export interface TaskTemplate extends BaseEntity {
  name: string
  category: string
  description: string | null
  template_tasks: {
    name: string
    duration_days: number
    dependencies: number[]
    description: string | null
  }[]
}

export interface Constraint extends BaseEntity, ProjectScoped {
  task_id: string
  constraint_type: 'must-start-on' | 'must-finish-on' | 'start-no-earlier' | 'finish-no-later'
  constraint_date: string
  reason: string | null
}

export interface ExecutionTask extends BaseEntity, ProjectScoped, SoftDeletable {
  name: string
  description: string | null
  status: 'pending' | 'approved' | 'in-progress' | 'completed' | 'rejected'
  work_package_id: string | null
  approval_required: boolean
  approved_by: string | null
  approved_at: string | null
}

export interface ExecutionGate extends BaseEntity, ProjectScoped {
  name: string
  gate_type: 'design' | 'fabrication' | 'erection' | 'quality' | 'safety'
  status: 'pending' | 'open' | 'passed' | 'failed'
  dependencies: string[]
  required_approvals: number
  current_approvals: number
}

export interface ExecutionPermission extends BaseEntity, ProjectScoped {
  user_id: string
  permission_type: 'approve-task' | 'approve-gate' | 'execute-work' | 'modify-schedule'
  entity_type: 'task' | 'gate' | 'work-package' | null
  entity_id: string | null
  granted_by: string
}

export interface ApprovalGateDecision extends BaseEntity, ProjectScoped {
  execution_gate_id: string
  decision: 'approved' | 'rejected' | 'conditional'
  decided_by: string
  decided_at: string
  comments: string | null
  conditions: string[]
}

export interface SequenceComputationRun extends BaseEntity, ProjectScoped {
  run_type: 'critical-path' | 'schedule-forecast' | 'resource-leveling'
  tasks_processed: number
  critical_path_updated: boolean
  result: object
  computation_time_ms: number
}

export interface RFI extends BaseEntity, ProjectScoped, SoftDeletable {
  rfi_number: number
  title: string
  description: string
  status: 'draft' | 'submitted' | 'under-review' | 'responded' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  submitted_by: string
  submitted_at: string | null
  assigned_to: string | null
  response: string | null
  responded_by: string | null
  responded_at: string | null
  due_date: string | null
  cost_impact: number
  schedule_impact_days: number
  drawing_references: string[]
  task_id: string | null
}

export interface RFISuggestion extends BaseEntity, ProjectScoped {
  rfi_id: string
  suggestion_type: 'similar-rfi' | 'subject-matter-expert' | 'drawing-reference'
  content: string
  confidence: number
}

export interface ResponseLagEvent extends BaseEntity, ProjectScoped {
  rfi_id: string
  event_type: 'submitted' | 'escalated' | 'overdue' | 'responded'
  days_elapsed: number
  escalation_level: number
  notification_sent: boolean
}

export interface Document extends BaseEntity, ProjectScoped, SoftDeletable {
  name: string
  file_path: string
  file_type: string
  file_size: number
  category: string
  tags: string[]
  uploaded_by: string
  version: number
  parent_document_id: string | null
  description: string | null
}

export interface DrawingSet extends BaseEntity, ProjectScoped, SoftDeletable {
  name: string
  description: string | null
  discipline: string
  status: 'draft' | 'issued-for-approval' | 'issued-for-construction' | 'as-built'
  issued_date: string | null
  revision_number: string
}

export interface DrawingSheet extends BaseEntity, ProjectScoped, SoftDeletable {
  drawing_set_id: string
  sheet_number: string
  title: string
  discipline: string
  file_path: string
  current_revision: string
  status: 'draft' | 'approved' | 'superseded'
}

export interface DrawingRevision extends BaseEntity, ProjectScoped {
  drawing_sheet_id: string
  revision_number: string
  revision_date: string
  description: string | null
  file_path: string
  is_current: boolean
  supersedes_revision_id: string | null
}

export interface DrawingSheetRevision extends BaseEntity, ProjectScoped {
  drawing_sheet_id: string
  revision_id: string
  change_description: string
  approved_by: string | null
  approved_at: string | null
}

export interface DrawingAnnotation extends BaseEntity, ProjectScoped, SoftDeletable {
  drawing_sheet_id: string
  annotation_type: 'note' | 'dimension' | 'conflict' | 'clarification'
  content: string
  coordinates: { x: number; y: number }
  created_by_user: string
  resolved: boolean
  resolved_at: string | null
}

export interface DrawingConflict extends BaseEntity, ProjectScoped {
  drawing_sheet_id: string
  conflict_type: 'dimension-mismatch' | 'missing-detail' | 'clash' | 'scope-gap'
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'investigating' | 'resolved'
  resolved_by: string | null
  resolved_at: string | null
  resolution_notes: string | null
}

export interface ScopeReference extends BaseEntity, ProjectScoped {
  drawing_sheet_id: string
  reference_type: 'specification' | 'drawing' | 'detail' | 'submittal'
  reference_number: string
  description: string | null
}

export interface ScopeGap extends BaseEntity, ProjectScoped {
  title: string
  description: string
  identified_in_drawing_id: string | null
  status: 'identified' | 'assessing' | 'resolved'
  impact_assessment: string | null
  resolution: string | null
}

export interface DesignIntentFlag extends BaseEntity, ProjectScoped {
  drawing_sheet_id: string | null
  flag_type: 'clarification-needed' | 'assumption' | 'deviation' | 'improvement'
  description: string
  status: 'open' | 'under-review' | 'closed'
  resolution: string | null
}

export interface Budget extends BaseEntity, ProjectScoped {
  name: string
  fiscal_period: string
  total_budget: number
  budget_type: 'original' | 'revised' | 'forecast'
}

export interface BudgetLineItem extends BaseEntity, ProjectScoped, SoftDeletable {
  budget_id: string
  cost_code_id: string
  description: string
  budgeted_amount: number
  committed_amount: number
  actual_amount: number
  variance: number
  percent_complete: number
}

export interface BudgetVariance extends BaseEntity, ProjectScoped {
  budget_line_item_id: string
  cost_code_id: string
  variance_amount: number
  variance_percent: number
  variance_type: 'favorable' | 'unfavorable'
  period: string
  drill_down_data: {
    labor_variance: number
    material_variance: number
    equipment_variance: number
    other_variance: number
  }
  analysis_notes: string | null
}

export interface Financial extends BaseEntity, ProjectScoped {
  category: 'revenue' | 'expense' | 'receivable' | 'payable'
  amount: number
  date: string
  status: 'pending' | 'approved' | 'paid' | 'cancelled'
  description: string | null
  reference_number: string | null
}

export interface Expense extends BaseEntity, ProjectScoped, SoftDeletable {
  cost_code_id: string
  vendor: string
  amount: number
  expense_date: string
  status: 'pending' | 'approved' | 'paid' | 'rejected'
  category: string
  description: string | null
  receipt_url: string | null
  approved_by: string | null
  approved_at: string | null
}

export interface ExpenseSplit extends BaseEntity, ProjectScoped {
  expense_id: string
  cost_code_id: string
  amount: number
  percentage: number
  description: string | null
}

export interface CostCode extends BaseEntity, SoftDeletable {
  code: string
  name: string
  category: string
  description: string | null
  is_global: boolean
  project_id: string | null
}

export interface SOVItem extends BaseEntity, ProjectScoped, SoftDeletable {
  sov_version_id: string
  item_number: string
  description: string
  scheduled_value: number
  work_completed_previous: number
  work_completed_current: number
  materials_stored_previous: number
  materials_stored_current: number
  total_completed: number
  percent_complete: number
  retainage_percent: number
  retainage_amount: number
  current_billing: number
  balance_to_finish: number
  cost_code_id: string | null
}

export interface SOVVersion extends BaseEntity, ProjectScoped {
  version_number: number
  billing_period: string
  status: 'draft' | 'submitted' | 'approved' | 'paid'
  submitted_date: string | null
  approved_date: string | null
  total_contract_value: number
  total_completed: number
  total_retainage: number
  current_payment_due: number
}

export interface SOVCostCodeMap extends BaseEntity, ProjectScoped {
  sov_item_id: string
  cost_code_id: string
  allocation_percent: number
}

export interface ClientInvoice extends BaseEntity, ProjectScoped, SoftDeletable {
  invoice_number: string
  sov_version_id: string | null
  amount: number
  invoice_date: string
  due_date: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  paid_date: string | null
  notes: string | null
}

export interface Invoice extends BaseEntity, ProjectScoped, SoftDeletable {
  invoice_number: string
  vendor: string
  amount: number
  invoice_date: string
  due_date: string
  status: 'pending' | 'approved' | 'paid' | 'disputed'
  paid_date: string | null
  paid_amount: number
  notes: string | null
}

export interface InvoiceLine extends BaseEntity, ProjectScoped {
  invoice_id: string
  cost_code_id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
}

export interface EstimatedCostToComplete extends BaseEntity, ProjectScoped {
  cost_code_id: string
  budgeted_amount: number
  actual_to_date: number
  committed: number
  estimated_cost_to_complete: number
  estimated_total_cost: number
  variance: number
  forecast_date: string
  confidence_level: number
  methodology: string
}

export interface MarginRiskAssessment extends BaseEntity, ProjectScoped {
  assessment_date: string
  total_contract_value: number
  total_cost_estimate: number
  margin_at_risk: number
  margin_percent: number
  risk_factors: {
    factor: string
    impact: number
    probability: number
  }[]
  mitigation_actions: string[]
}

export interface MarginRiskEvent extends BaseEntity, ProjectScoped {
  event_type: 'cost-overrun' | 'schedule-delay' | 'scope-change' | 'resource-issue'
  description: string
  cost_impact: number
  margin_impact: number
  probability: number
  status: 'identified' | 'active' | 'mitigated' | 'realized'
  mitigation_plan: string | null
}

export interface InstallMarginSnapshot extends BaseEntity, ProjectScoped {
  snapshot_date: string
  contract_value: number
  actual_cost: number
  estimated_total_cost: number
  current_margin: number
  current_margin_percent: number
  projected_margin: number
  projected_margin_percent: number
}

export interface ShippingCostRecord extends BaseEntity, ProjectScoped {
  shipment_date: string
  origin: string
  destination: string
  carrier: string
  weight_tons: number
  cost: number
  delivery_id: string | null
}

export interface RateCard extends BaseEntity, ProjectScoped {
  labor_category_id: string | null
  equipment_type: string | null
  rate_type: 'hourly' | 'daily' | 'per-unit'
  rate: number
  effective_date: string
  expiry_date: string | null
  markup_percent: number
}

export interface ChangeOrder extends BaseEntity, ProjectScoped, SoftDeletable {
  co_number: string
  title: string
  description: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'completed'
  submitted_date: string | null
  approved_date: string | null
  approved_by: string | null
  total_amount: number
  schedule_impact_days: number
  reason: string | null
}

export interface ChangeOrderLineItem extends BaseEntity, ProjectScoped, SoftDeletable {
  change_order_id: string
  cost_code_id: string | null
  description: string
  quantity: number
  unit: string
  unit_price: number
  amount: number
  markup_percent: number
  total_amount: number
}

export interface Contract extends BaseEntity, ProjectScoped, SoftDeletable {
  contract_number: string
  title: string
  contractor: string
  contract_type: 'lump-sum' | 'unit-price' | 'cost-plus' | 'time-and-material'
  amount: number
  start_date: string
  end_date: string
  status: 'draft' | 'active' | 'completed' | 'terminated'
  signed_date: string | null
  file_path: string | null
  notes: string | null
}

export interface LaborCategory extends BaseEntity {
  name: string
  code: string
  description: string | null
  base_rate: number
  overtime_rate: number
  trade: string
}

export interface LaborBreakdown extends BaseEntity, ProjectScoped {
  task_id: string | null
  cost_code_id: string | null
  labor_category_id: string
  budgeted_hours: number
  actual_hours: number
  variance_hours: number
  budgeted_cost: number
  actual_cost: number
  variance_cost: number
}

export interface LaborEntry extends BaseEntity, ProjectScoped {
  entry_date: string
  worker_name: string
  labor_category_id: string
  cost_code_id: string | null
  task_id: string | null
  regular_hours: number
  overtime_hours: number
  notes: string | null
}

export interface LaborHours extends BaseEntity, ProjectScoped {
  entry_date: string
  crew_id: string | null
  task_id: string | null
  cost_code_id: string | null
  labor_category_id: string
  hours: number
  rate: number
  total_cost: number
}

export interface Resource extends BaseEntity, ProjectScoped, SoftDeletable {
  resource_type: 'crew' | 'labor' | 'equipment'
  name: string
  description: string | null
  availability: 'available' | 'assigned' | 'maintenance' | 'unavailable'
  capacity: number
  unit: string
}

export interface ResourceCost extends BaseEntity, ProjectScoped {
  resource_id: string
  cost_type: 'hourly' | 'daily' | 'fixed'
  cost: number
  effective_date: string
  expiry_date: string | null
}

export interface ResourceAllocation extends BaseEntity, ProjectScoped {
  resource_id: string
  task_id: string | null
  work_package_id: string | null
  allocated_from: string
  allocated_to: string
  allocation_percent: number
  status: 'planned' | 'confirmed' | 'active' | 'completed'
}

export interface Crew extends BaseEntity, ProjectScoped, SoftDeletable {
  name: string
  foreman_name: string
  members: {
    worker_name: string
    labor_category_id: string
    role: string
  }[]
  status: 'active' | 'off-project' | 'disbanded'
  assigned_task_id: string | null
}

export interface EquipmentLog extends BaseEntity, ProjectScoped {
  equipment_id: string
  log_date: string
  log_type: 'usage' | 'maintenance' | 'inspection' | 'issue'
  hours_used: number
  operator: string | null
  notes: string | null
  cost: number
}

export interface EquipmentUsage extends BaseEntity, ProjectScoped {
  equipment_id: string
  task_id: string | null
  usage_date: string
  hours_used: number
  operator: string | null
  cost_code_id: string | null
}

export interface EquipmentBooking extends BaseEntity, ProjectScoped, SoftDeletable {
  equipment_id: string
  booked_from: string
  booked_to: string
  booked_by: string
  purpose: string | null
  status: 'pending' | 'confirmed' | 'in-use' | 'completed' | 'cancelled'
}

export interface InspectionChecklist extends BaseEntity, ProjectScoped {
  equipment_id: string | null
  inspection_type: string
  inspection_date: string
  inspector: string
  items: {
    item: string
    status: 'pass' | 'fail' | 'na'
    notes: string | null
  }[]
  overall_status: 'pass' | 'fail' | 'conditional'
  notes: string | null
}

export interface WorkPackage extends BaseEntity, ProjectScoped, SoftDeletable {
  name: string
  description: string | null
  package_type: 'fabrication' | 'erection' | 'combined'
  status: 'planning' | 'ready' | 'in-progress' | 'completed'
  start_date: string
  end_date: string
  weight_tons: number
  piece_count: number
  readiness_score: number
}

export interface FabricationPackage extends BaseEntity, ProjectScoped, SoftDeletable {
  work_package_id: string
  fab_drawing_status: 'not-started' | 'in-progress' | 'approved' | 'released'
  material_status: 'not-ordered' | 'ordered' | 'received' | 'issued'
  production_status: 'not-started' | 'in-progress' | 'completed'
  qc_status: 'pending' | 'in-progress' | 'passed' | 'failed'
  release_date: string | null
}

export interface FabReleaseGroup extends BaseEntity, ProjectScoped {
  name: string
  fabrication_package_ids: string[]
  release_date: string
  approved_by: string | null
  approved_at: string | null
}

export interface FabReadinessItem extends BaseEntity, ProjectScoped {
  fabrication_package_id: string
  item_type: 'drawing' | 'material' | 'tooling' | 'capacity'
  description: string
  status: 'pending' | 'ready' | 'blocked'
  blocker_description: string | null
}

export interface Fabrication extends BaseEntity, ProjectScoped, SoftDeletable {
  work_package_id: string | null
  item_number: string
  description: string
  quantity: number
  weight_tons: number
  status: 'detailing' | 'material' | 'production' | 'qc' | 'completed' | 'shipped'
  detailing_progress: number
  fabrication_progress: number
}

export interface Detailing extends BaseEntity, ProjectScoped {
  fabrication_id: string | null
  drawing_number: string
  status: 'not-started' | 'in-progress' | 'review' | 'approved'
  progress_percent: number
  assigned_to: string | null
  due_date: string | null
}

export interface DetailingRevision extends BaseEntity, ProjectScoped {
  detailing_id: string
  revision_number: string
  revision_date: string
  changes: string
  approved_by: string | null
  approved_at: string | null
}

export interface DetailingAction extends BaseEntity, ProjectScoped {
  detailing_id: string
  action_type: 'review-comment' | 'revision-request' | 'approval'
  action_by: string
  action_date: string
  comments: string | null
}

export interface DetailImprovement extends BaseEntity, ProjectScoped {
  detailing_id: string | null
  improvement_type: 'efficiency' | 'quality' | 'coordination'
  description: string
  implemented: boolean
  implemented_at: string | null
}

export interface ErectionIssue extends BaseEntity, ProjectScoped, SoftDeletable {
  issue_type: 'fit-up' | 'missing-material' | 'equipment' | 'safety' | 'coordination'
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'investigating' | 'resolved'
  reported_by: string
  reported_date: string
  resolved_by: string | null
  resolved_at: string | null
  resolution: string | null
  cost_impact: number
  schedule_impact_days: number
}

export interface ErectionReadiness extends BaseEntity, ProjectScoped {
  work_package_id: string
  readiness_date: string
  drawings_approved: boolean
  material_on_site: boolean
  equipment_available: boolean
  crew_assigned: boolean
  safety_plan_approved: boolean
  permits_obtained: boolean
  overall_ready: boolean
  blockers: string[]
}

export interface ErectionPickPlan extends BaseEntity, ProjectScoped {
  work_package_id: string
  pick_sequence: {
    sequence_number: number
    piece_mark: string
    crane_type: string
    rigging: string
    safety_notes: string | null
  }[]
  created_by_user: string
  approved_by: string | null
  approved_at: string | null
}

export interface FieldInstall extends BaseEntity, ProjectScoped {
  work_package_id: string | null
  install_date: string
  piece_mark: string
  crew_id: string | null
  status: 'scheduled' | 'in-progress' | 'completed' | 'on-hold'
  completion_percent: number
  notes: string | null
}

export interface FieldIssue extends BaseEntity, ProjectScoped, SoftDeletable {
  issue_type: 'safety' | 'quality' | 'coordination' | 'equipment' | 'material'
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'investigating' | 'resolved'
  reported_by: string
  reported_date: string
  location: string | null
  task_id: string | null
  resolved_by: string | null
  resolved_at: string | null
  resolution: string | null
}

export interface PunchItem extends BaseEntity, ProjectScoped, SoftDeletable {
  work_package_id: string | null
  item_number: string
  description: string
  location: string
  trade: string
  priority: 'low' | 'medium' | 'high'
  status: 'open' | 'in-progress' | 'completed' | 'verified'
  assigned_to: string | null
  due_date: string | null
  completed_at: string | null
  verified_by: string | null
  verified_at: string | null
}

export interface Delivery extends BaseEntity, ProjectScoped, SoftDeletable {
  delivery_number: string
  description: string
  scheduled_date: string
  actual_date: string | null
  status: 'scheduled' | 'in-transit' | 'arrived' | 'unloaded' | 'delayed' | 'cancelled'
  supplier: string
  weight_tons: number
  piece_count: number
  work_package_id: string | null
  receiving_notes: string | null
  delay_reason: string | null
}

export interface DeliveryRiskEvent extends BaseEntity, ProjectScoped {
  delivery_id: string
  event_type: 'delay-detected' | 'delay-resolved' | 'cancelled' | 'partial-shipment'
  event_date: string
  impact_days: number
  notification_sent: boolean
}

export interface Message extends BaseEntity, ProjectScoped, SoftDeletable {
  thread_id: string | null
  sender_id: string
  recipient_ids: string[]
  subject: string
  content: string
  read_by: string[]
  attachments: string[]
}

export interface Notification extends BaseEntity {
  user_id: string
  notification_type: string
  title: string
  message: string
  read: boolean
  read_at: string | null
  action_url: string | null
  data: object
}

export interface NotificationPreference extends BaseEntity {
  user_id: string
  notification_type: string
  email_enabled: boolean
  push_enabled: boolean
  in_app_enabled: boolean
}

export interface EmailTemplate extends BaseEntity {
  template_name: string
  subject: string
  body: string
  variables: string[]
}

export interface Meeting extends BaseEntity, ProjectScoped, SoftDeletable {
  title: string
  meeting_date: string
  meeting_type: string
  attendees: string[]
  agenda: string | null
  notes: string | null
  action_items: {
    item: string
    assigned_to: string
    due_date: string | null
    completed: boolean
  }[]
}

export interface ProductionNote extends BaseEntity, ProjectScoped {
  note_date: string
  shift: 'day' | 'night' | 'overtime'
  category: 'progress' | 'issue' | 'safety' | 'quality' | 'coordination'
  content: string
  urgent: boolean
  follow_up_required: boolean
  follow_up_date: string | null
  tags: string[]
  location: string | null
  crew_id: string | null
}

export interface CollaborationSession extends BaseEntity, ProjectScoped {
  session_type: 'drawing-review' | 'planning' | 'issue-resolution'
  participants: string[]
  started_at: string
  ended_at: string | null
  status: 'active' | 'completed'
}

export interface CollaborationMessage extends BaseEntity, ProjectScoped {
  session_id: string
  sender_id: string
  message: string
  timestamp: string
  attachments: string[]
}

export interface Feedback extends BaseEntity {
  user_id: string
  feedback_type: 'bug' | 'feature' | 'improvement' | 'general'
  title: string
  content: string
  status: 'submitted' | 'reviewing' | 'planned' | 'implemented' | 'declined'
  priority: 'low' | 'medium' | 'high'
  attachments: string[]
}

export interface AIInsight extends BaseEntity, ProjectScoped {
  insight_type: 'schedule-risk' | 'cost-risk' | 'quality-issue' | 'optimization'
  title: string
  description: string
  confidence: number
  data_sources: string[]
  recommendations: string[]
  action_taken: boolean
  action_taken_at: string | null
}

export interface Alert extends BaseEntity, ProjectScoped {
  alert_type: 'budget' | 'schedule' | 'safety' | 'quality' | 'rfi' | 'submittal' | 'delivery'
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  action_url: string | null
  acknowledged: boolean
  acknowledged_by: string | null
  acknowledged_at: string | null
  resolved: boolean
  resolved_at: string | null
}

export interface QAConfig extends BaseEntity, ProjectScoped {
  config_name: string
  check_type: string
  rules: object
  enabled: boolean
}

export interface AuditRun extends BaseEntity {
  run_type: 'full' | 'incremental' | 'module-specific'
  scope: string
  started_at: string
  completed_at: string | null
  status: 'running' | 'completed' | 'failed'
  findings_count: number
  fixes_applied: number
}

export interface AuditFinding extends BaseEntity {
  audit_run_id: string
  finding_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  entity_type: string
  entity_id: string | null
  description: string
  auto_fixable: boolean
  fix_applied: boolean
  fix_applied_at: string | null
}

export interface AuditFixTask extends BaseEntity {
  audit_finding_id: string
  fix_type: string
  status: 'pending' | 'in-progress' | 'completed' | 'failed'
  executed_at: string | null
  result: string | null
}

export interface AuditLog extends BaseEntity {
  user_id: string
  action: string
  entity_type: string
  entity_id: string
  project_id: string | null
  changes: object
  ip_address: string | null
  user_agent: string | null
}

export interface Report extends BaseEntity, ProjectScoped {
  report_name: string
  report_type: string
  parameters: object
  generated_at: string
  generated_by: string
  file_path: string | null
  status: 'generating' | 'completed' | 'failed'
}

export interface Submittal extends BaseEntity, ProjectScoped, SoftDeletable {
  submittal_number: string
  title: string
  description: string | null
  spec_section: string
  submittal_type: 'product-data' | 'shop-drawing' | 'sample' | 'certificate'
  status: 'IFA' | 'BFA' | 'OFS' | 'BFS' | 'FFF'
  submitted_by: string
  submitted_date: string | null
  reviewer: string | null
  review_due_date: string | null
  reviewed_date: string | null
  days_outstanding: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  ball_in_court: 'contractor' | 'architect' | 'engineer' | 'owner'
  revision_number: number
  file_paths: string[]
}

export interface ScheduleConflict extends BaseEntity, ProjectScoped {
  conflict_type: 'resource' | 'dependency' | 'constraint' | 'milestone'
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'detected' | 'analyzing' | 'resolved' | 'accepted'
  detected_at: string
  task_ids: string[]
  resource_id: string | null
  recommended_resolution: string | null
  resolution_applied: boolean
  resolved_by: string | null
  resolved_at: string | null
}

export interface DashboardWidget extends BaseEntity {
  user_id: string | null
  widget_type: 'portfolio-health' | 'cost-summary' | 'schedule-status' | 'risk-alerts' | 'custom-chart'
  title: string
  configuration: object
  position: { x: number; y: number; width: number; height: number }
  is_global: boolean
  project_id: string | null
}

/**
 * Database Schema Constraints and Rules
 */
export const SCHEMA_CONSTRAINTS = {
  unique: {
    project_number: 'Project.project_number',
    rfi_per_project: '(Project.id, RFI.rfi_number)',
    cost_code_per_project: '(CostCode.project_id, CostCode.code)',
    submittal_number_per_project: '(Project.id, Submittal.submittal_number)',
    co_number_per_project: '(Project.id, ChangeOrder.co_number)',
    contract_number_per_project: '(Project.id, Contract.contract_number)',
  },
  
  foreign_keys: {
    ProjectMember: {
      project_id: 'Project.id',
      user_id: 'User.id',
    },
    Task: {
      project_id: 'Project.id',
      assigned_to: 'User.id',
    },
    RFI: {
      project_id: 'Project.id',
      submitted_by: 'User.id',
      assigned_to: 'User.id',
      responded_by: 'User.id',
      task_id: 'Task.id',
    },
    BudgetLineItem: {
      budget_id: 'Budget.id',
      cost_code_id: 'CostCode.id',
      project_id: 'Project.id',
    },
    ChangeOrderLineItem: {
      change_order_id: 'ChangeOrder.id',
      cost_code_id: 'CostCode.id',
      project_id: 'Project.id',
    },
    DrawingSheet: {
      drawing_set_id: 'DrawingSet.id',
      project_id: 'Project.id',
    },
    DrawingRevision: {
      drawing_sheet_id: 'DrawingSheet.id',
      project_id: 'Project.id',
      supersedes_revision_id: 'DrawingRevision.id',
    },
    Expense: {
      cost_code_id: 'CostCode.id',
      project_id: 'Project.id',
      approved_by: 'User.id',
    },
  },
  
  indexes: {
    project_id: 'All project-scoped entities',
    created_at: 'All entities for sorting',
    status: 'Entities with workflow states',
    dates: 'start_date, end_date, due_date fields',
    foreign_keys: 'All foreign key fields',
  },
  
  cascade_behaviors: {
    project_delete: {
      behavior: 'soft-delete-cascade',
      note: 'When project.deleted_at is set, all child entities are soft deleted',
      exceptions: 'Admin must confirm, or blocked if active work',
    },
    change_order_delete: {
      behavior: 'cascade',
      entities: ['ChangeOrderLineItem'],
      note: 'Deleting CO also deletes all line items',
    },
    drawing_set_delete: {
      behavior: 'restricted',
      entities: ['DrawingSheet', 'DrawingRevision'],
      note: 'Cannot delete if sheets exist unless force flag with admin permission',
    },
    task_delete: {
      behavior: 'restricted',
      note: 'Cannot delete if other tasks depend on it',
    },
  },
}

/**
 * Validation Rules
 */
export const VALIDATION_RULES = {
  project_number: {
    required: true,
    unique: true,
    pattern: /^[A-Z0-9-]+$/,
  },
  rfi_number: {
    required: true,
    unique_per_project: true,
    auto_increment: true,
  },
  cost_code: {
    required: true,
    pattern: /^[0-9]{2}-[0-9]{3}$/,
    unique_per_project: true,
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  phone: {
    pattern: /^\+?[\d\s\-()]+$/,
  },
  percentages: {
    min: 0,
    max: 100,
  },
  amounts: {
    min: 0,
  },
}
