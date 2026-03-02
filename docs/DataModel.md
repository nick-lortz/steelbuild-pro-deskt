# DataModel.md
## SteelBuild Pro - Complete Data Model

---

## ENTITY CATALOG

### Project & Access

#### **Project**
- **Exact name**: `Project`
- **Fields**:
  - `id`: string (required, UUID)
  - `name`: string (required)
  - `number`: string (required, **MUST BE UNIQUE GLOBALLY**)
  - `client`: string (required)
  - `location`: string (required)
  - `status`: enum (required) - 'planning' | 'active' | 'onhold' | 'completed'
  - `startDate`: string (required, ISO 8601)
  - `endDate`: string (optional, ISO 8601)
  - `contractValue`: number (required)
  - `description`: string (optional)
  - `createdAt`: string (required, ISO 8601)
  - `updatedAt`: string (required, ISO 8601)
  - `deletedAt`: string (optional, ISO 8601) - soft delete
- **Relations**:
  - Has many: ProjectMember, ProjectContact, ProjectRisk, ProjectBaseline, ProjectChecklistItem, PMControlEntry, Task, RFI, Document, DrawingSet, WorkPackage, Delivery, Budget, ChangeOrder, Contract, CostCode (project-scoped), etc.
- **Uniqueness**: `number` must be unique
- **Delete behavior**: Soft delete (set deletedAt); cascade options defined in DataIntegrity module

#### **ProjectMember**
- **Exact name**: `ProjectMember`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `userId`: string (required)
  - `userName`: string (required)
  - `email`: string (required)
  - `role`: enum (required) - 'owner' | 'admin' | 'member' | 'viewer'
  - `permissions`: string[] (required, array of permission keys)
  - `joinedAt`: string (required, ISO 8601)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: Belongs to Project
- **Uniqueness**: (projectId, userId) should be unique
- **Delete behavior**: Hard delete when project deleted or member removed

#### **ProjectContact**
- **Exact name**: `ProjectContact`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `name`: string (required)
  - `company`: string (required)
  - `role`: string (required)
  - `email`: string (optional)
  - `phone`: string (optional)
  - `notes`: string (optional)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: Belongs to Project
- **Delete behavior**: Soft delete or cascade delete with project

#### **ProjectRisk**
- **Exact name**: `ProjectRisk`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `title`: string (required)
  - `description`: string (required)
  - `category`: enum (required) - 'schedule' | 'cost' | 'quality' | 'safety' | 'scope' | 'resource'
  - `probability`: enum (required) - 'low' | 'medium' | 'high'
  - `impact`: enum (required) - 'low' | 'medium' | 'high'
  - `status`: enum (required) - 'identified' | 'analyzing' | 'mitigating' | 'closed'
  - `mitigation`: string (optional)
  - `owner`: string (optional, user ID or name)
  - `identifiedDate`: string (required, ISO 8601)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: Belongs to Project
- **Delete behavior**: Cascade delete with project

#### **ProjectBaseline**
- **Exact name**: `ProjectBaseline`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `name`: string (required)
  - `description`: string (optional)
  - `baselineDate`: string (required, ISO 8601)
  - `schedule`: Record<string, unknown> (required, JSON snapshot)
  - `budget`: Record<string, unknown> (required, JSON snapshot)
  - `scope`: string[] (required, array of scope items)
  - `createdBy`: string (required, user ID)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: Belongs to Project
- **Delete behavior**: Cascade delete with project

#### **ProjectChecklistItem**
- **Exact name**: `ProjectChecklistItem`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `category`: enum (required) - 'setup' | 'execution' | 'closeout' | 'safety' | 'qa'
  - `description`: string (required)
  - `required`: boolean (required)
  - `completed`: boolean (required)
  - `completedBy`: string (optional, user ID or name)
  - `completedDate`: string (optional, ISO 8601)
  - `order`: number (required, sort order)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: Belongs to Project
- **Delete behavior**: Cascade delete with project

#### **PMControlEntry**
- **Exact name**: `PMControlEntry`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `entryType`: enum (required) - 'note' | 'decision' | 'issue' | 'observation'
  - `title`: string (required)
  - `content`: string (required)
  - `priority`: enum (optional) - 'low' | 'medium' | 'high'
  - `tags`: string[] (required, array)
  - `createdBy`: string (required, user ID or name)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: Belongs to Project
- **Delete behavior**: Cascade delete with project

---

### Scheduling

#### **Task**
- **Exact name**: `Task`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `name`: string (required)
  - `description`: string (optional)
  - `status`: enum (required) - 'not-started' | 'in-progress' | 'completed' | 'blocked'
  - `priority`: enum (required) - 'low' | 'medium' | 'high' | 'critical'
  - `startDate`: string (required, ISO 8601)
  - `endDate`: string (required, ISO 8601)
  - `dependencies`: string[] (required, array of Task IDs)
  - `assignedTo`: string (optional, user ID or name)
  - `percentComplete`: number (required, 0-100)
  - `isCriticalPath`: boolean (required, computed)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: 
  - Belongs to Project
  - Self-referential: dependencies → other Tasks
- **Delete behavior**: Cascade delete with project; remove from other tasks' dependencies
- **Computed fields**: `isCriticalPath` (from schedule engine)

#### **TaskTemplate**
- **Exact name**: `TaskTemplate`
- **Fields**:
  - `id`: string (required)
  - `name`: string (required)
  - `description`: string (optional)
  - `category`: string (required)
  - `tasks`: array of task definitions (required)
    - Each has: `name`, `description`, `estimatedDuration`, `dependencies`
  - `createdAt`: string (required, ISO 8601)
- **Relations**: None (global template)
- **Delete behavior**: Soft delete or prevent if in use

#### **Constraint**
- **Exact name**: `Constraint`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `taskId`: string (required, FK → Task.id)
  - `type`: enum (required) - 'start-no-earlier' | 'finish-no-later' | 'must-start-on' | 'must-finish-on'
  - `date`: string (required, ISO 8601)
  - `reason`: string (required)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: 
  - Belongs to Project
  - Belongs to Task
- **Delete behavior**: Cascade delete with task or project

#### **ExecutionTask**
- **Exact name**: `ExecutionTask`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `workPackageId`: string (optional, FK → WorkPackage.id)
  - `name`: string (required)
  - `description`: string (optional)
  - `status`: enum (required) - 'pending' | 'approved' | 'in-progress' | 'completed' | 'rejected'
  - `startDate`: string (optional, ISO 8601)
  - `completionDate`: string (optional, ISO 8601)
  - `assignedTo`: string (optional, user ID or name)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: 
  - Belongs to Project
  - Belongs to WorkPackage (optional)
- **Delete behavior**: Cascade delete with project or work package

#### **ExecutionGate**
- **Exact name**: `ExecutionGate`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `name`: string (required)
  - `description`: string (required)
  - `gateType`: enum (required) - 'design' | 'fabrication' | 'erection' | 'approval' | 'milestone'
  - `status`: enum (required) - 'pending' | 'approved' | 'rejected'
  - `requiredBy`: string (required, ISO 8601 date or name)
  - `dependencies`: string[] (required, array of gate/task IDs)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: Belongs to Project
- **Delete behavior**: Cascade delete with project

#### **ExecutionPermission**
- **Exact name**: `ExecutionPermission`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `userId`: string (required)
  - `taskId`: string (optional, FK → Task.id or ExecutionTask.id)
  - `gateId`: string (optional, FK → ExecutionGate.id)
  - `permissionType`: enum (required) - 'approve' | 'execute' | 'review' | 'view'
  - `grantedBy`: string (required, user ID)
  - `grantedAt`: string (required, ISO 8601)
- **Relations**: 
  - Belongs to Project
  - Optionally linked to Task or Gate
- **Delete behavior**: Cascade delete with project, task, or gate

#### **ApprovalGateDecision**
- **Exact name**: `ApprovalGateDecision`
- **Fields**:
  - `id`: string (required)
  - `gateId`: string (required, FK → ExecutionGate.id)
  - `projectId`: string (required, FK → Project.id)
  - `decision`: enum (required) - 'approved' | 'rejected' | 'conditional'
  - `decidedBy`: string (required, user ID or name)
  - `decidedAt`: string (required, ISO 8601)
  - `comments`: string (optional)
  - `conditions`: string[] (optional, array)
- **Relations**: 
  - Belongs to ExecutionGate
  - Belongs to Project
- **Delete behavior**: Cascade delete with gate

---

### RFIs

#### **RFI**
- **Exact name**: `RFI`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `number`: string (required, **MUST BE UNIQUE per project: (projectId, number)**)
  - `subject`: string (required)
  - `question`: string (required)
  - `answer`: string (optional)
  - `status`: enum (required) - 'open' | 'answered' | 'closed' | 'escalated'
  - `priority`: enum (required) - 'low' | 'medium' | 'high' | 'critical'
  - `submittedBy`: string (required, user ID or name)
  - `submittedDate`: string (required, ISO 8601)
  - `answeredBy`: string (optional, user ID or name)
  - `answeredDate`: string (optional, ISO 8601)
  - `escalatedDate`: string (optional, ISO 8601)
  - `dueDate`: string (optional, ISO 8601)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: Belongs to Project
- **Uniqueness**: `(projectId, number)` must be unique
- **Delete behavior**: Soft delete or cascade delete with project

#### **RFISuggestion**
- **Exact name**: `RFISuggestion`
- **Fields**:
  - `id`: string (required)
  - `rfiId`: string (required, FK → RFI.id)
  - `projectId`: string (required, FK → Project.id)
  - `suggestion`: string (required)
  - `suggestedBy`: enum (required) - 'ai' | 'user'
  - `confidence`: number (optional, 0-1)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: Belongs to RFI and Project
- **Delete behavior**: Cascade delete with RFI

#### **ResponseLagEvent**
- **Exact name**: `ResponseLagEvent`
- **Fields**:
  - `id`: string (required)
  - `rfiId`: string (required, FK → RFI.id)
  - `projectId`: string (required, FK → Project.id)
  - `expectedResponseDate`: string (required, ISO 8601)
  - `actualResponseDate`: string (optional, ISO 8601)
  - `lagDays`: number (required)
  - `impact`: enum (required) - 'low' | 'medium' | 'high'
  - `reason`: string (optional)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: Belongs to RFI and Project
- **Delete behavior**: Cascade delete with RFI

---

### Documents & Drawings

#### **Document**
- **Exact name**: `Document`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `name`: string (required)
  - `type`: enum (required) - 'contract' | 'drawing' | 'specification' | 'photo' | 'report' | 'other'
  - `category`: string (required)
  - `url`: string (optional, storage URL or key)
  - `size`: number (required, bytes)
  - `uploadedBy`: string (required, user ID or name)
  - `uploadedDate`: string (required, ISO 8601)
  - `tags`: string[] (required, array)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: Belongs to Project
- **Delete behavior**: Cascade delete with project; remove file from storage

#### **DrawingSet**
- **Exact name**: `DrawingSet`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `setNumber`: string (required)
  - `title`: string (required)
  - `discipline`: enum (required) - 'structural' | 'architectural' | 'mechanical' | 'electrical' | 'shop'
  - `sheets`: DrawingSheet[] (required, nested array)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: 
  - Belongs to Project
  - Has many DrawingSheet (nested)
- **Delete behavior**: Cascade delete sheets and revisions when set deleted

#### **DrawingSheet**
- **Exact name**: `DrawingSheet`
- **Fields**:
  - `id`: string (required)
  - `setId`: string (required, FK → DrawingSet.id)
  - `sheetNumber`: string (required)
  - `title`: string (required)
  - `currentRevision`: string (optional, revision code)
  - `revisions`: DrawingRevision[] (required, nested array)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: 
  - Belongs to DrawingSet
  - Has many DrawingRevision (nested)
- **Delete behavior**: Cascade delete revisions when sheet deleted

#### **DrawingRevision**
- **Exact name**: `DrawingRevision`
- **Fields**:
  - `id`: string (required)
  - `sheetId`: string (required, FK → DrawingSheet.id)
  - `revision`: string (required)
  - `description`: string (required)
  - `date`: string (required, ISO 8601)
  - `isCurrent`: boolean (required)
  - `uploadedBy`: string (required, user ID or name)
- **Relations**: Belongs to DrawingSheet
- **Delete behavior**: Soft delete or prevent if current

---

### Financials

#### **CostCode**
- **Exact name**: `CostCode`
- **Fields**:
  - `id`: string (required)
  - `code`: string (required, **MUST BE UNIQUE per scope**)
  - `name`: string (required)
  - `category`: enum (required) - 'labor' | 'material' | 'equipment' | 'subcontractor' | 'other'
  - `projectId`: string (optional, FK → Project.id) - null = global
  - `budgetAmount`: number (optional)
  - `actualAmount`: number (optional)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: 
  - Optionally belongs to Project (if projectId set)
  - Referenced by Budget, Expense, LaborEntry, SOVItem, etc.
- **Uniqueness**: 
  - If projectId is null: `code` must be unique globally
  - If projectId is set: `(projectId, code)` should be unique
- **Delete behavior**: Prevent delete if in use; or cascade updates to reference "Unassigned"

#### **Budget**
- **Exact name**: `Budget`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `costCodeId`: string (required, FK → CostCode.id)
  - `budgetedAmount`: number (required)
  - `actualAmount`: number (required)
  - `committedAmount`: number (required)
  - `variance`: number (required, computed: budgetedAmount - actualAmount)
  - `createdAt`: string (required, ISO 8601)
  - `updatedAt`: string (required, ISO 8601)
- **Relations**: 
  - Belongs to Project
  - References CostCode
- **Delete behavior**: Cascade delete with project

#### **BudgetLineItem**
- **Exact name**: `BudgetLineItem`
- **Fields**:
  - `id`: string (required)
  - `budgetId`: string (required, FK → Budget.id)
  - `projectId`: string (required, FK → Project.id)
  - `costCodeId`: string (required, FK → CostCode.id)
  - `description`: string (required)
  - `amount`: number (required)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: 
  - Belongs to Budget
  - Belongs to Project
  - References CostCode
- **Delete behavior**: Cascade delete with budget

#### **Financial**
- **Exact name**: `Financial`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `type`: enum (required) - 'revenue' | 'expense' | 'payment' | 'invoice'
  - `amount`: number (required)
  - `date`: string (required, ISO 8601)
  - `category`: string (required)
  - `description`: string (optional)
  - `reference`: string (optional)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: Belongs to Project
- **Delete behavior**: Cascade delete with project

#### **Expense**
- **Exact name**: `Expense`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `date`: string (required, ISO 8601)
  - `amount`: number (required)
  - `category`: string (required)
  - `vendor`: string (optional)
  - `description`: string (required)
  - `costCodeId`: string (optional, FK → CostCode.id)
  - `receiptUrl`: string (optional)
  - `status`: enum (required) - 'pending' | 'approved' | 'rejected' | 'paid'
  - `submittedBy`: string (required, user ID or name)
  - `approvedBy`: string (optional, user ID or name)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: 
  - Belongs to Project
  - Optionally references CostCode
- **Delete behavior**: Cascade delete with project

#### **ExpenseSplit**
- **Exact name**: `ExpenseSplit`
- **Fields**:
  - `id`: string (required)
  - `expenseId`: string (required, FK → Expense.id)
  - `projectId`: string (required, FK → Project.id)
  - `costCodeId`: string (required, FK → CostCode.id)
  - `amount`: number (required)
  - `percentage`: number (required, 0-100)
  - `notes`: string (optional)
- **Relations**: 
  - Belongs to Expense
  - Belongs to Project
  - References CostCode
- **Delete behavior**: Cascade delete with expense

#### **SOVVersion**
- **Exact name**: `SOVVersion`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `versionNumber`: number (required)
  - `periodStart`: string (required, ISO 8601)
  - `periodEnd`: string (required, ISO 8601)
  - `status`: enum (required) - 'draft' | 'submitted' | 'approved' | 'rejected'
  - `submittedDate`: string (optional, ISO 8601)
  - `approvedDate`: string (optional, ISO 8601)
  - `submittedBy`: string (optional, user ID or name)
  - `approvedBy`: string (optional, user ID or name)
  - `notes`: string (optional)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: 
  - Belongs to Project
  - Has many SOVItem
- **Delete behavior**: Cascade delete SOVItem when version deleted

#### **SOVItem**
- **Exact name**: `SOVItem`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `versionId`: string (required, FK → SOVVersion.id)
  - `lineNumber`: number (required)
  - `description`: string (required)
  - `scheduledValue`: number (required)
  - `workCompleted`: number (required)
  - `materialsStored`: number (required)
  - `totalCompleted`: number (required, computed: workCompleted + materialsStored)
  - `percentComplete`: number (required, computed: totalCompleted / scheduledValue * 100)
  - `retainage`: number (required)
  - `previouslyBilled`: number (required)
  - `currentBilling`: number (required, computed: totalCompleted - retainage - previouslyBilled)
  - `balance`: number (required, computed: scheduledValue - totalCompleted)
  - `costCodeId`: string (optional, FK → CostCode.id)
  - `createdAt`: string (required, ISO 8601)
  - `updatedAt`: string (required, ISO 8601)
- **Relations**: 
  - Belongs to SOVVersion
  - Belongs to Project
  - Optionally references CostCode
- **Delete behavior**: Cascade delete with version

#### **SOVCostCodeMap**
- **Exact name**: `SOVCostCodeMap`
- **Fields**:
  - `id`: string (required)
  - `sovItemId`: string (required, FK → SOVItem.id)
  - `costCodeId`: string (required, FK → CostCode.id)
  - `projectId`: string (required, FK → Project.id)
  - `allocatedAmount`: number (required)
  - `percentage`: number (required, 0-100)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: 
  - Belongs to SOVItem
  - Belongs to Project
  - References CostCode
- **Delete behavior**: Cascade delete with SOVItem

#### **ClientInvoice**
- **Exact name**: `ClientInvoice`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `invoiceNumber`: string (required)
  - `billingPeriodStart`: string (required, ISO 8601)
  - `billingPeriodEnd`: string (required, ISO 8601)
  - `invoiceDate`: string (required, ISO 8601)
  - `dueDate`: string (required, ISO 8601)
  - `amount`: number (required)
  - `paidAmount`: number (required)
  - `status`: enum (required) - 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  - `createdAt`: string (required, ISO 8601)
- **Relations**: Belongs to Project
- **Delete behavior**: Soft delete

#### **Invoice**
- **Exact name**: `Invoice`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `invoiceNumber`: string (required)
  - `invoiceDate`: string (required, ISO 8601)
  - `dueDate`: string (required, ISO 8601)
  - `amount`: number (required)
  - `paidAmount`: number (required)
  - `status`: enum (required) - 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  - `lineItems`: InvoiceLineItem[] (required, nested array)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: 
  - Belongs to Project
  - Has many InvoiceLineItem (nested)
- **Delete behavior**: Soft delete

#### **InvoiceLineItem**
- **Exact name**: `InvoiceLineItem`
- **Fields**:
  - `id`: string (required)
  - `description`: string (required)
  - `quantity`: number (required)
  - `rate`: number (required)
  - `amount`: number (required, computed: quantity * rate)
- **Relations**: Belongs to Invoice (nested)
- **Delete behavior**: Cascade delete with invoice

#### **BudgetForecast**
- **Exact name**: `BudgetForecast`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `forecastDate`: string (required, ISO 8601)
  - `forecastMonth`: string (required, YYYY-MM)
  - `costCodeId`: string (required, FK → CostCode.id)
  - `projectedCost`: number (required)
  - `actualToDate`: number (required)
  - `estimatedCompletion`: number (required)
  - `variance`: number (required, computed)
  - `confidenceLevel`: enum (required) - 'low' | 'medium' | 'high'
  - `methodology`: enum (required) - 'historical' | 'regression' | 'earned-value' | 'manual'
  - `notes`: string (optional)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: 
  - Belongs to Project
  - References CostCode
- **Delete behavior**: Cascade delete with project

---

### Change Orders & Contracts

#### **ChangeOrder**
- **Exact name**: `ChangeOrder`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `number`: string (required, unique per project)
  - `title`: string (required)
  - `description`: string (optional)
  - `status`: enum (required) - 'draft' | 'submitted' | 'approved' | 'rejected'
  - `requestedBy`: string (required, user ID or name)
  - `requestedDate`: string (required, ISO 8601)
  - `approvedDate`: string (optional, ISO 8601)
  - `lineItems`: ChangeOrderLineItem[] (required, nested array)
  - `total`: number (required, computed sum of line items)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: 
  - Belongs to Project
  - Has many ChangeOrderLineItem (nested)
- **Delete behavior**: Cascade delete line items; soft delete CO

#### **ChangeOrderLineItem**
- **Exact name**: `ChangeOrderLineItem`
- **Fields**:
  - `id`: string (required)
  - `changeOrderId`: string (required, FK → ChangeOrder.id)
  - `description`: string (required)
  - `quantity`: number (required)
  - `unit`: string (required)
  - `unitPrice`: number (required)
  - `total`: number (required, computed: quantity * unitPrice)
- **Relations**: Belongs to ChangeOrder (nested)
- **Delete behavior**: Cascade delete with change order

#### **Contract**
- **Exact name**: `Contract`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `contractNumber`: string (required)
  - `title`: string (required)
  - `contractType`: enum (required) - 'lump-sum' | 'unit-price' | 'cost-plus' | 'time-and-materials'
  - `value`: number (required)
  - `signedDate`: string (required, ISO 8601)
  - `startDate`: string (required, ISO 8601)
  - `completionDate`: string (optional, ISO 8601)
  - `retainage`: number (required, percentage)
  - `terms`: string (optional)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: Belongs to Project
- **Delete behavior**: Soft delete

---

### Work Packages & Execution

#### **WorkPackage**
- **Exact name**: `WorkPackage`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `packageNumber`: string (required)
  - `title`: string (required)
  - `type`: enum (required) - 'fabrication' | 'erection'
  - `status`: enum (required) - 'planning' | 'ready' | 'in-progress' | 'completed'
  - `startDate`: string (optional, ISO 8601)
  - `completionDate`: string (optional, ISO 8601)
  - `assignedCrew`: string (optional)
  - `drawings`: string[] (required, array of drawing IDs or refs)
  - `materials`: string[] (required, array of material refs)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: 
  - Belongs to Project
  - May have ExecutionTask children
- **Delete behavior**: Cascade delete execution tasks

#### **Fabrication**
- **Exact name**: `Fabrication`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `workPackageId`: string (optional, FK → WorkPackage.id)
  - `pieceNumber`: string (required)
  - `description`: string (required)
  - `material`: string (required)
  - `weight`: number (required)
  - `quantity`: number (required)
  - `status`: enum (required) - 'not-started' | 'detailing' | 'material-ordered' | 'material-received' | 'in-production' | 'completed' | 'shipped'
  - `detailingProgress`: number (required, 0-100)
  - `fabricationProgress`: number (required, 0-100)
  - `drawingNumber`: string (optional)
  - `costCodeId`: string (optional, FK → CostCode.id)
  - `startDate`: string (optional, ISO 8601)
  - `targetCompletionDate`: string (optional, ISO 8601)
  - `actualCompletionDate`: string (optional, ISO 8601)
  - `assignedTo`: string (optional)
  - `notes`: string (optional)
  - `qcChecks`: array of QC check records (required)
    - Each has: `date`, `inspector`, `passed`, `notes`
  - `createdAt`: string (required, ISO 8601)
  - `updatedAt`: string (required, ISO 8601)
- **Relations**: 
  - Belongs to Project
  - Optionally belongs to WorkPackage
  - Optionally references CostCode
- **Delete behavior**: Cascade delete with project or work package

---

### Deliveries

#### **Delivery**
- **Exact name**: `Delivery`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `deliveryNumber`: string (required)
  - `description`: string (required)
  - `supplier`: string (required)
  - `expectedDate`: string (required, ISO 8601)
  - `actualDate`: string (optional, ISO 8601)
  - `status`: enum (required) - 'scheduled' | 'in-transit' | 'delivered' | 'delayed' | 'cancelled'
  - `trackingNumber`: string (optional)
  - `items`: DeliveryItem[] (required, nested array)
  - `notes`: string (optional)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: 
  - Belongs to Project
  - Has many DeliveryItem (nested)
- **Delete behavior**: Cascade delete with project

#### **DeliveryItem**
- **Exact name**: `DeliveryItem`
- **Fields**:
  - `id`: string (required)
  - `description`: string (required)
  - `quantity`: number (required)
  - `unit`: string (required)
  - `received`: number (required)
- **Relations**: Belongs to Delivery (nested)
- **Delete behavior**: Cascade delete with delivery

---

### Labor & Equipment

#### **LaborCategory**
- **Exact name**: `LaborCategory`
- **Fields**:
  - `id`: string (required)
  - `name`: string (required)
  - `code`: string (required)
  - `baseRate`: number (required)
  - `overtimeRate`: number (required)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: Global (not project-scoped)
- **Delete behavior**: Prevent if in use

#### **LaborEntry**
- **Exact name**: `LaborEntry`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `categoryId`: string (required, FK → LaborCategory.id)
  - `employeeName`: string (required)
  - `date`: string (required, ISO 8601)
  - `regularHours`: number (required)
  - `overtimeHours`: number (required)
  - `totalHours`: number (required, computed: regularHours + overtimeHours)
  - `costCodeId`: string (optional, FK → CostCode.id)
  - `description`: string (optional)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: 
  - Belongs to Project
  - References LaborCategory
  - Optionally references CostCode
- **Delete behavior**: Cascade delete with project

#### **Equipment**
- **Exact name**: `Equipment`
- **Fields**:
  - `id`: string (required)
  - `name`: string (required)
  - `type`: enum (required) - 'crane' | 'welder' | 'lift' | 'tool' | 'vehicle' | 'other'
  - `model`: string (optional)
  - `serialNumber`: string (optional)
  - `status`: enum (required) - 'available' | 'in-use' | 'maintenance' | 'retired'
  - `location`: string (optional)
  - `assignedProjectId`: string (optional, FK → Project.id)
  - `lastMaintenanceDate`: string (optional, ISO 8601)
  - `nextMaintenanceDate`: string (optional, ISO 8601)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: Optionally assigned to Project
- **Delete behavior**: Unassign from project or soft delete

#### **EquipmentLog**
- **Exact name**: `EquipmentLog`
- **Fields**:
  - `id`: string (required)
  - `equipmentId`: string (required, FK → Equipment.id)
  - `projectId`: string (optional, FK → Project.id)
  - `date`: string (required, ISO 8601)
  - `type`: enum (required) - 'usage' | 'maintenance' | 'inspection' | 'repair'
  - `hours`: number (optional)
  - `description`: string (required)
  - `cost`: number (optional)
  - `performedBy`: string (required, user ID or name)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: 
  - Belongs to Equipment
  - Optionally belongs to Project
- **Delete behavior**: Cascade delete with equipment

---

### Checklists

#### **ChecklistTemplate**
- **Exact name**: `ChecklistTemplate`
- **Fields**:
  - `id`: string (required)
  - `name`: string (required)
  - `category`: enum (required) - 'safety' | 'quality' | 'pre-erection' | 'inspection' | 'other'
  - `items`: ChecklistTemplateItem[] (required, nested array)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: Global (not project-scoped)
- **Delete behavior**: Soft delete

#### **ChecklistTemplateItem**
- **Exact name**: `ChecklistTemplateItem`
- **Fields**:
  - `id`: string (required)
  - `text`: string (required)
  - `order`: number (required)
  - `required`: boolean (required)
- **Relations**: Belongs to ChecklistTemplate (nested)
- **Delete behavior**: Cascade delete with template

#### **Checklist**
- **Exact name**: `Checklist`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `templateId`: string (required, FK → ChecklistTemplate.id)
  - `templateName`: string (required)
  - `assignedTo`: string (optional, user ID or name)
  - `dueDate`: string (optional, ISO 8601)
  - `completedDate`: string (optional, ISO 8601)
  - `items`: ChecklistItem[] (required, nested array)
  - `status`: enum (required) - 'pending' | 'in-progress' | 'completed'
  - `createdAt`: string (required, ISO 8601)
- **Relations**: 
  - Belongs to Project
  - References ChecklistTemplate
- **Delete behavior**: Cascade delete with project

#### **ChecklistItem**
- **Exact name**: `ChecklistItem`
- **Fields**:
  - `id`: string (required)
  - `text`: string (required)
  - `completed`: boolean (required)
  - `completedBy`: string (optional, user ID or name)
  - `completedDate`: string (optional, ISO 8601)
  - `notes`: string (optional)
  - `order`: number (required)
- **Relations**: Belongs to Checklist (nested)
- **Delete behavior**: Cascade delete with checklist

---

### Other Modules

#### **DailyLog**
- **Exact name**: `DailyLog`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `date`: string (required, ISO 8601)
  - `weather`: string (required)
  - `temperature`: number (optional)
  - `crew`: array of crew records (required)
    - Each has: `name`, `hours`
  - `workPerformed`: string (required)
  - `issues`: string (optional)
  - `safetyNotes`: string (optional)
  - `visitors`: string[] (optional)
  - `deliveries`: string[] (optional)
  - `photos`: string[] (optional, storage URLs)
  - `createdBy`: string (required, user ID or name)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: Belongs to Project
- **Delete behavior**: Cascade delete with project

#### **Meeting**
- **Exact name**: `Meeting`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `title`: string (required)
  - `type`: enum (required) - 'coordination' | 'safety' | 'progress' | 'client' | 'other'
  - `date`: string (required, ISO 8601)
  - `location`: string (optional)
  - `attendees`: string[] (required, array)
  - `agenda`: string (optional)
  - `notes`: string (required)
  - `actionItems`: MeetingActionItem[] (required, nested array)
  - `createdBy`: string (required, user ID or name)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: 
  - Belongs to Project
  - Has many MeetingActionItem (nested)
- **Delete behavior**: Cascade delete with project

#### **MeetingActionItem**
- **Exact name**: `MeetingActionItem`
- **Fields**:
  - `id`: string (required)
  - `description`: string (required)
  - `assignedTo`: string (required)
  - `dueDate`: string (optional, ISO 8601)
  - `completed`: boolean (required)
- **Relations**: Belongs to Meeting (nested)
- **Delete behavior**: Cascade delete with meeting

#### **Submittal**
- **Exact name**: `Submittal`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `number`: string (required)
  - `title`: string (required)
  - `description`: string (optional)
  - `specSection`: string (required)
  - `type`: enum (required) - 'shop-drawing' | 'product-data' | 'sample' | 'design-data' | 'test-report' | 'other'
  - `status`: enum (required) - 'draft' | 'IFA' | 'BFA' | 'OFS' | 'BFS' | 'FFF' | 'submitted' | 'returned' | 'approved' | 'rejected' | 'approved-as-noted'
  - `priority`: enum (required) - 'low' | 'medium' | 'high' | 'critical'
  - `submittedTo`: string (required)
  - `submittedBy`: string (optional)
  - `submittedDate`: string (optional, ISO 8601)
  - `requiredDate`: string (optional, ISO 8601)
  - `responseDate`: string (optional, ISO 8601)
  - `reviewedBy`: string (optional)
  - `reviewComments`: string (optional)
  - `ballInCourt`: enum (required) - 'contractor' | 'architect' | 'engineer' | 'owner' | 'supplier'
  - `daysOutstanding`: number (required, computed)
  - `relatedDrawings`: string[] (required, array of drawing IDs)
  - `relatedCostCodes`: string[] (required, array of cost code IDs)
  - `revisionNumber`: number (optional)
  - `createdAt`: string (required, ISO 8601)
  - `updatedAt`: string (required, ISO 8601)
- **Relations**: 
  - Belongs to Project
  - References Drawings
  - References CostCodes
- **Delete behavior**: Soft delete

#### **Alert**
- **Exact name**: `Alert`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (optional, FK → Project.id) - null = global
  - `type`: enum (required) - 'budget' | 'schedule' | 'rfi' | 'submittal' | 'delivery' | 'safety' | 'quality' | 'system'
  - `severity`: enum (required) - 'info' | 'warning' | 'critical'
  - `title`: string (required)
  - `message`: string (required)
  - `entityType`: string (optional)
  - `entityId`: string (optional)
  - `actionRequired`: boolean (required)
  - `actionUrl`: string (optional)
  - `dismissed`: boolean (required)
  - `dismissedBy`: string (optional, user ID)
  - `dismissedAt`: string (optional, ISO 8601)
  - `createdAt`: string (required, ISO 8601)
  - `expiresAt`: string (optional, ISO 8601)
- **Relations**: Optionally belongs to Project
- **Delete behavior**: Hard delete after expiration

#### **TodoItem**
- **Exact name**: `TodoItem`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (optional, FK → Project.id) - null = global
  - `title`: string (required)
  - `description`: string (optional)
  - `priority`: enum (required) - 'low' | 'medium' | 'high' | 'critical'
  - `status`: enum (required) - 'pending' | 'in-progress' | 'completed' | 'cancelled'
  - `assignedTo`: string (optional, user ID or name)
  - `dueDate`: string (optional, ISO 8601)
  - `completedDate`: string (optional, ISO 8601)
  - `category`: enum (required) - 'admin' | 'technical' | 'procurement' | 'coordination' | 'submittal' | 'rfi' | 'other'
  - `relatedEntity`: object (optional) - `{ type: string, id: string }`
  - `createdBy`: string (required, user ID or name)
  - `createdAt`: string (required, ISO 8601)
  - `updatedAt`: string (required, ISO 8601)
- **Relations**: Optionally belongs to Project
- **Delete behavior**: Soft delete

#### **ProductionNote**
- **Exact name**: `ProductionNote`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `date`: string (required, ISO 8601)
  - `shift`: enum (optional) - 'day' | 'night'
  - `category`: enum (required) - 'progress' | 'issue' | 'quality' | 'safety' | 'equipment' | 'material' | 'general'
  - `title`: string (required)
  - `content`: string (required)
  - `location`: string (optional)
  - `crew`: string (optional)
  - `tags`: string[] (required, array)
  - `attachments`: string[] (optional, storage URLs)
  - `urgent`: boolean (required)
  - `followUpRequired`: boolean (required)
  - `followUpDate`: string (optional, ISO 8601)
  - `createdBy`: string (required, user ID or name)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: Belongs to Project
- **Delete behavior**: Soft delete

#### **LookAheadPlan**
- **Exact name**: `LookAheadPlan`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `weekNumber`: number (required)
  - `year`: number (required)
  - `weekStart`: string (required, ISO 8601)
  - `weekEnd`: string (required, ISO 8601)
  - `status`: enum (required) - 'draft' | 'published' | 'completed'
  - `plannedActivities`: LookAheadActivity[] (required, nested array)
  - `constraints`: string[] (required, array)
  - `materialRequirements`: array of material records (required)
  - `equipmentNeeds`: array of equipment records (required)
  - `laborRequirements`: array of labor records (required)
  - `safetyConsiderations`: string[] (required, array)
  - `weatherForecast`: string (optional)
  - `notes`: string (optional)
  - `createdBy`: string (required, user ID or name)
  - `createdAt`: string (required, ISO 8601)
  - `updatedAt`: string (required, ISO 8601)
- **Relations**: 
  - Belongs to Project
  - Has many LookAheadActivity (nested)
- **Delete behavior**: Cascade delete with project

#### **LookAheadActivity**
- **Exact name**: `LookAheadActivity`
- **Fields**:
  - `id`: string (required)
  - `description`: string (required)
  - `location`: string (required)
  - `crew`: string (optional)
  - `estimatedDuration`: number (required)
  - `dependencies`: string[] (required, array)
  - `status`: enum (required) - 'planned' | 'in-progress' | 'completed' | 'delayed'
  - `progress`: number (required, 0-100)
  - `constraints`: string[] (optional, array)
- **Relations**: Belongs to LookAheadPlan (nested)
- **Delete behavior**: Cascade delete with plan

#### **JobSetupItem**
- **Exact name**: `JobSetupItem`
- **Fields**:
  - `id`: string (required)
  - `projectId`: string (required, FK → Project.id)
  - `category`: enum (required) - 'contracts' | 'insurance' | 'permits' | 'submittals' | 'logistics' | 'safety' | 'qc' | 'coordination' | 'other'
  - `description`: string (required)
  - `required`: boolean (required)
  - `status`: enum (required) - 'not-started' | 'in-progress' | 'completed' | 'blocked'
  - `assignedTo`: string (optional, user ID or name)
  - `dueDate`: string (optional, ISO 8601)
  - `completedDate`: string (optional, ISO 8601)
  - `completedBy`: string (optional, user ID or name)
  - `notes`: string (optional)
  - `dependencies`: string[] (required, array of JobSetupItem IDs)
  - `order`: number (required, sort order)
  - `createdAt`: string (required, ISO 8601)
  - `updatedAt`: string (required, ISO 8601)
- **Relations**: 
  - Belongs to Project
  - Self-referential dependencies
- **Delete behavior**: Cascade delete with project

#### **AuditEntry**
- **Exact name**: `AuditEntry`
- **Fields**:
  - `id`: string (required)
  - `entityType`: string (required)
  - `entityId`: string (required)
  - `action`: enum (required) - 'create' | 'update' | 'delete'
  - `userId`: string (required)
  - `timestamp`: string (required, ISO 8601)
  - `changes`: Record<string, { old: unknown; new: unknown }> (required, JSON)
  - `projectId`: string (optional, FK → Project.id)
- **Relations**: Optionally belongs to Project
- **Delete behavior**: Retain indefinitely for compliance

#### **ReportDefinition**
- **Exact name**: `ReportDefinition`
- **Fields**:
  - `id`: string (required)
  - `name`: string (required)
  - `type`: enum (required) - 'cost' | 'schedule' | 'productivity' | 'safety' | 'quality' | 'executive'
  - `description`: string (optional)
  - `filters`: Record<string, unknown> (required, JSON)
  - `metrics`: string[] (required, array)
  - `chartType`: enum (optional) - 'line' | 'bar' | 'pie' | 'area' | 'scatter'
  - `refreshInterval`: number (optional, minutes)
  - `recipients`: string[] (optional, array of emails)
  - `createdBy`: string (required, user ID)
  - `createdAt`: string (required, ISO 8601)
- **Relations**: None (global)
- **Delete behavior**: Soft delete

#### **ReportSnapshot**
- **Exact name**: `ReportSnapshot`
- **Fields**:
  - `id`: string (required)
  - `reportId`: string (required, FK → ReportDefinition.id)
  - `projectId`: string (optional, FK → Project.id)
  - `generatedDate`: string (required, ISO 8601)
  - `data`: Record<string, unknown> (required, JSON)
  - `summary`: string (required)
  - `trends`: array of trend records (required)
    - Each has: `metric`, `direction`, `value`
  - `createdAt`: string (required, ISO 8601)
- **Relations**: 
  - Belongs to ReportDefinition
  - Optionally belongs to Project
- **Delete behavior**: Retain for history; auto-prune old snapshots

---

## UNIQUENESS CONSTRAINTS

1. **Project.number** → MUST BE GLOBALLY UNIQUE
2. **(RFI.projectId, RFI.number)** → MUST BE UNIQUE per project
3. **(CostCode.projectId, CostCode.code)** → MUST BE UNIQUE per project scope
   - If `projectId` is null (global cost code): `code` must be globally unique
   - If `projectId` is set (project-specific): `(projectId, code)` composite unique
4. **(ProjectMember.projectId, ProjectMember.userId)** → SHOULD BE UNIQUE
5. **Contract.contractNumber** → SHOULD BE UNIQUE per project (implied)
6. **ChangeOrder.number** → SHOULD BE UNIQUE per project (implied)
7. **Equipment.serialNumber** → SHOULD BE UNIQUE globally (if provided)

---

## CASCADE DELETE EXPECTATIONS

### When Project is deleted:
- **Soft delete Project** (set `deletedAt`)
- **Options**:
  - Hard cascade: delete all project-scoped entities
  - Soft cascade: set `deletedAt` on all project-scoped entities
  - Block: prevent deletion if critical data exists (invoices, contracts)
- **Project-scoped entities** (all contain `projectId`):
  - ProjectMember, ProjectContact, ProjectRisk, ProjectBaseline, ProjectChecklistItem, PMControlEntry
  - Task, Constraint, ExecutionTask, ExecutionGate, ExecutionPermission, ApprovalGateDecision
  - RFI, RFISuggestion, ResponseLagEvent
  - Document (also remove files from storage)
  - DrawingSet → DrawingSheet → DrawingRevision (nested cascade)
  - WorkPackage, Fabrication, ExecutionTask
  - Delivery, DeliveryItem
  - LaborEntry, EquipmentLog (if project-scoped)
  - Budget, BudgetLineItem, Financial, Expense, ExpenseSplit
  - SOVVersion → SOVItem, SOVCostCodeMap
  - ClientInvoice, Invoice
  - ChangeOrder → ChangeOrderLineItem
  - Contract
  - CostCode (if project-scoped; global cost codes remain)
  - Checklist, DailyLog, Meeting, Submittal, Alert (project-scoped), TodoItem (project-scoped), ProductionNote, LookAheadPlan, JobSetupItem
  - AuditEntry (project-scoped; may retain for compliance)

### When ChangeOrder is deleted:
- **Cascade delete** all ChangeOrderLineItem (nested)
- **Soft delete** ChangeOrder itself (set `deletedAt`)

### When DrawingSet is deleted:
- **Cascade delete** all DrawingSheet (nested)
  - For each sheet, cascade delete all DrawingRevision (nested)

### When Contract is deleted:
- **Soft delete** (set `deletedAt`)
- **Block** if referenced by active invoices or SOV

### When Task is deleted:
- **Remove** task ID from `dependencies` array of other tasks
- **Cascade delete** Constraint records referencing the task
- **Soft delete** task itself

### When CostCode is deleted:
- **Block** if referenced by Budget, Expense, LaborEntry, SOVItem, etc.
- **Alternative**: set references to "Unassigned" cost code

### When Equipment is deleted:
- **Soft delete** equipment
- **Cascade delete** all EquipmentLog records

### When Checklist is deleted:
- **Cascade delete** all nested ChecklistItem records

### When ChecklistTemplate is deleted:
- **Block** if active Checklist instances exist referencing it
- **Soft delete** template

---

## NOTES
- All entities use **camelCase** field names in TypeScript interfaces
- Database schema (if SQL) would use **snake_case** column names
- All timestamps are **ISO 8601 strings**
- All IDs are **UUIDs** generated via `crypto.randomUUID()`
- **Soft delete** pattern: add `deletedAt` field (nullable), filter out records where `deletedAt IS NOT NULL`
- **Project-scoped** entities MUST include `projectId` field
- **Authorization**: all project-scoped queries MUST validate user has ProjectMember record for that project
- **No cross-project data leakage**: enforce project membership checks at API/function layer
