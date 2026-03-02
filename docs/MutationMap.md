# MutationMap.md
## SteelBuild Pro - Complete Mutation Mapping

This document maps every user-facing action from UI page → form → mutation → entity → side effects.

---

## COST CODE MUTATIONS

### Cost Code Create (Global)
- **UI Page**: `/cost-codes` (GlobalCostCodesPage)
- **Form**: Cost Code Form Dialog
  - Fields: `code`, `name`, `category`, `budgetAmount` (optional)
  - `projectId`: null (global code)
- **Mutation**: `costCodesDb.create()`
- **Entity Written**: `CostCode`
  - Sets: `id`, `code`, `name`, `category`, `projectId=null`, `budgetAmount`, `actualAmount=0`, `createdAt`
- **Side Effects**: None
- **Storage Key**: `costCodes` (KV)

### Cost Code Create (Project-Scoped)
- **UI Page**: `/projects/:projectId/cost-codes` (CostCodesPage)
- **Form**: Cost Code Form Dialog
  - Fields: `code`, `name`, `category`, `budgetAmount` (optional)
  - `projectId`: from route param
- **Mutation**: `costCodesDb.create()`
- **Entity Written**: `CostCode`
  - Sets: `id`, `code`, `name`, `category`, `projectId`, `budgetAmount`, `actualAmount=0`, `createdAt`
- **Side Effects**: 
  - May create Budget record linking cost code to project
- **Storage Key**: `costCodes` (KV)

### Cost Code Update
- **UI Page**: Global or Project Cost Codes page
- **Form**: Edit Cost Code Dialog
  - Fields: `code`, `name`, `category`, `budgetAmount`
- **Mutation**: `costCodesDb.update(id, updates)`
- **Entity Written**: `CostCode`
  - Updates specified fields, sets `updatedAt` (if tracked)
- **Side Effects**:
  - Recalculate Budget variances if `budgetAmount` changed
  - Update SOV mappings if used in SOV
- **Storage Key**: `costCodes` (KV)

### Cost Code Delete
- **UI Page**: Global or Project Cost Codes page
- **Action**: Delete button → confirmation dialog
- **Mutation**: `costCodesDb.delete(id)`
- **Entity Written**: `CostCode` (deleted)
- **Side Effects**:
  - **Block** if cost code is referenced by:
    - Budget records
    - Expense records
    - LaborEntry records
    - SOVItem records
    - Fabrication records
  - **Alternative**: Set all references to "Unassigned" cost code ID
  - Update financial rollups
- **Storage Key**: `costCodes` (KV)

---

## CHANGE ORDER MUTATIONS

### Change Order Create
- **UI Page**: `/projects/:projectId/change-orders` (ChangeOrdersPage)
- **Form**: Change Order Form Dialog
  - Fields: `number`, `title`, `description`, `status='draft'`, `requestedBy` (current user), `requestedDate` (auto)
  - Line Items: array of `{ description, quantity, unit, unitPrice }`
- **Mutation**: `changeOrdersDb.create()`
- **Entity Written**: 
  - `ChangeOrder`
    - Sets: `id`, `projectId`, `number`, `title`, `description`, `status`, `requestedBy`, `requestedDate`, `lineItems` (nested), `total` (computed), `createdAt`
  - Nested: `ChangeOrderLineItem[]` (inline, not separate table)
- **Side Effects**:
  - Compute `total` = sum of all lineItems.total
  - Each lineItem.total = quantity * unitPrice
  - May trigger notification to approvers
  - May create Alert record for approval needed
- **Storage Key**: `changeOrders-${projectId}` (KV)

### Change Order Edit
- **UI Page**: ChangeOrdersPage → Edit button
- **Form**: Edit Change Order Dialog
  - Fields: all Change Order fields including line items
- **Mutation**: `changeOrdersDb.update(id, updates)`
- **Entity Written**: `ChangeOrder`
  - Updates fields, recalculates `total`
- **Side Effects**:
  - Recompute total if line items changed
  - Update status if transitioning (draft → submitted → approved)
  - Notification on status change
  - If approved: may update project contract value or budget
- **Storage Key**: `changeOrders-${projectId}` (KV)

### Change Order Delete
- **UI Page**: ChangeOrdersPage → Delete button → confirmation
- **Mutation**: `changeOrdersDb.delete(id)` or soft delete
- **Entity Written**: `ChangeOrder` (deleted or `deletedAt` set)
- **Side Effects**:
  - Cascade delete nested `ChangeOrderLineItem[]`
  - Remove references from Budget if CO was approved and integrated
  - May require admin/owner role check
- **Storage Key**: `changeOrders-${projectId}` (KV)

### Change Order Line Item Add
- **UI Page**: Change Order Form → Add Line Item button
- **Form**: Line item inline form
  - Fields: `description`, `quantity`, `unit`, `unitPrice`
- **Mutation**: Update parent ChangeOrder, append to `lineItems` array
- **Entity Written**: `ChangeOrder.lineItems` (array mutated)
  - New item gets: `id`, `changeOrderId`, `description`, `quantity`, `unit`, `unitPrice`, `total` (computed)
- **Side Effects**:
  - Recompute ChangeOrder.total
- **Storage Key**: `changeOrders-${projectId}` (KV)

### Change Order Line Item Edit
- **UI Page**: Change Order Form → Edit line item
- **Mutation**: Update parent ChangeOrder, mutate specific line item in array
- **Entity Written**: `ChangeOrder.lineItems[index]`
- **Side Effects**:
  - Recompute line item total
  - Recompute ChangeOrder.total
- **Storage Key**: `changeOrders-${projectId}` (KV)

### Change Order Line Item Delete
- **UI Page**: Change Order Form → Delete line item button
- **Mutation**: Update parent ChangeOrder, remove from `lineItems` array
- **Entity Written**: `ChangeOrder.lineItems` (filtered)
- **Side Effects**:
  - Recompute ChangeOrder.total
- **Storage Key**: `changeOrders-${projectId}` (KV)

---

## CONTRACT MUTATIONS

### Contract Create
- **UI Page**: `/projects/:projectId/contracts` (ContractsPage)
- **Form**: Contract Form Dialog
  - Fields: `contractNumber`, `title`, `contractType`, `value`, `signedDate`, `startDate`, `completionDate`, `retainage`, `terms`
- **Mutation**: `contractsDb.create()`
- **Entity Written**: `Contract`
  - Sets: `id`, `projectId`, `contractNumber`, `title`, `contractType`, `value`, `signedDate`, `startDate`, `completionDate`, `retainage`, `terms`, `createdAt`
- **Side Effects**:
  - May update Project.contractValue if primary contract
  - May create Budget baseline from contract value
  - May trigger notification to project team
- **Storage Key**: `contracts-${projectId}` (KV)

### Contract Update
- **UI Page**: ContractsPage → Edit button
- **Form**: Edit Contract Dialog
  - Fields: all contract fields
- **Mutation**: `contractsDb.update(id, updates)`
- **Entity Written**: `Contract`
  - Updates specified fields
- **Side Effects**:
  - If `value` changed: update Project.contractValue, recalculate Budget variances
  - If `completionDate` changed: may affect schedule baseline
  - Notification on material changes
- **Storage Key**: `contracts-${projectId}` (KV)

### Contract Delete
- **UI Page**: ContractsPage → Delete button → confirmation
- **Mutation**: `contractsDb.delete(id)` or soft delete
- **Entity Written**: `Contract` (deleted or `deletedAt` set)
- **Side Effects**:
  - **Block** if contract is referenced by:
    - Active invoices
    - SOV versions
    - Change orders
  - May require admin confirmation
  - Update Project.contractValue if primary contract removed
- **Storage Key**: `contracts-${projectId}` (KV)

---

## CHECKLIST MUTATIONS

### Checklist Create (from template)
- **UI Page**: Project Dashboard or Job Setup page → Create Checklist
- **Form**: Checklist Creation Dialog
  - Fields: `templateId` (select), `assignedTo`, `dueDate`
- **Mutation**: `checklistsDb.create()`
- **Entity Written**: `Checklist`
  - Sets: `id`, `projectId`, `templateId`, `templateName`, `assignedTo`, `dueDate`, `items` (copied from template), `status='pending'`, `createdAt`
  - Nested: `ChecklistItem[]` (copied from template items, all `completed=false`)
- **Side Effects**:
  - Create notification for assignee
  - May create Alert if due date approaching
- **Storage Key**: `checklists-${projectId}` (KV)

### Checklist Item Toggle
- **UI Page**: Checklist detail view → Toggle checkbox
- **Mutation**: Update parent Checklist, mutate specific item in `items` array
- **Entity Written**: `Checklist.items[index]`
  - Sets: `completed=true/false`, `completedBy` (current user), `completedDate` (now)
- **Side Effects**:
  - If all items completed: update Checklist.status = 'completed', set `completedDate`
  - May unlock ExecutionGate if checklist was a gate requirement
  - Notification to assignee/project manager
- **Storage Key**: `checklists-${projectId}` (KV)

### Checklist Item Add Note
- **UI Page**: Checklist detail → Add note to item
- **Mutation**: Update Checklist.items[index].notes
- **Entity Written**: `ChecklistItem.notes`
- **Side Effects**: None
- **Storage Key**: `checklists-${projectId}` (KV)

### Checklist Delete
- **UI Page**: Checklist list → Delete button
- **Mutation**: `checklistsDb.delete(id)`
- **Entity Written**: `Checklist` (deleted)
- **Side Effects**:
  - Cascade delete nested items
  - Remove from JobSetupItem references if linked
- **Storage Key**: `checklists-${projectId}` (KV)

---

## EQUIPMENT MUTATIONS

### Equipment Create (Global)
- **UI Page**: `/equipment` (GlobalEquipmentPage)
- **Form**: Equipment Form Dialog
  - Fields: `name`, `type`, `model`, `serialNumber`, `status`, `location`
- **Mutation**: `equipmentDb.create()`
- **Entity Written**: `Equipment`
  - Sets: `id`, `name`, `type`, `model`, `serialNumber`, `status`, `location`, `assignedProjectId=null`, `createdAt`
- **Side Effects**: None
- **Storage Key**: `equipment` (KV)

### Equipment Assign to Project
- **UI Page**: GlobalEquipmentPage or ProjectEquipmentPage → Assign button
- **Mutation**: `equipmentDb.update(id, { assignedProjectId })`
- **Entity Written**: `Equipment.assignedProjectId`
- **Side Effects**:
  - Update Equipment.status to 'in-use'
  - Create notification to project team
  - May create Alert if maintenance due soon
- **Storage Key**: `equipment` (KV)

### Equipment Log Create
- **UI Page**: `/projects/:projectId/equipment` (ProjectEquipmentPage) → Log Entry
- **Form**: Equipment Log Dialog
  - Fields: `equipmentId` (select), `date`, `type`, `hours`, `description`, `cost`, `performedBy` (current user)
- **Mutation**: `equipmentLogsDb.create()`
- **Entity Written**: `EquipmentLog`
  - Sets: `id`, `equipmentId`, `projectId`, `date`, `type`, `hours`, `description`, `cost`, `performedBy`, `createdAt`
- **Side Effects**:
  - If type='maintenance': update Equipment.lastMaintenanceDate, compute next maintenance date
  - If type='inspection' and failed: create Alert
  - Add to project cost actuals if cost > 0
- **Storage Key**: `equipmentLogs-${projectId}` (KV)

### Equipment Log Delete
- **UI Page**: ProjectEquipmentPage → Delete log entry
- **Mutation**: Delete from logs array or KV
- **Entity Written**: `EquipmentLog` (deleted)
- **Side Effects**:
  - Recalculate Equipment maintenance dates if maintenance log deleted
  - Adjust project actuals if cost was included
- **Storage Key**: `equipmentLogs-${projectId}` (KV)

---

## PMA (PROJECT MANAGEMENT ASSISTANT) MUTATIONS

### PMA Daily Brief Generation
- **UI Page**: `/projects/:projectId/pma` (PMAPage) → Generate Brief button
- **Action**: Click "Generate Daily Brief"
- **Function Call**: `generateDailyBrief(projectId)`
- **Entities Read**:
  - Project, Task, RFI, Budget, CostCode, Delivery, WorkPackage
- **Computation**:
  - Schedule health score
  - Cost variance and burn rate
  - RFI aging analysis
  - Delivery risk assessment
  - Generate actionable recommendations with deep links
- **Entity Written**: None directly (brief is computed on-demand)
  - **Alternative**: Write to `PMAInsight` or `PMControlEntry` entity for history
- **Side Effects**:
  - May create Alert records for high-priority risks
  - Cache brief result for performance
- **Output**: Returns `DailyBriefing` object to UI

### PMA Insight Dismiss/Resolve
- **UI Page**: PMAPage → Dismiss insight button
- **Mutation**: Update PMAInsight record (if persisted)
- **Entity Written**: `PMAInsight` (add resolved flag, resolvedBy, resolvedAt)
- **Side Effects**:
  - Remove from active risks list
  - Update dashboard KPIs
- **Storage Key**: `pmaInsights-${projectId}` (KV, if implemented)

---

## DRAWING MUTATIONS

### Drawing Set Create
- **UI Page**: `/projects/:projectId/drawings` (DrawingsPage) → Create Set
- **Form**: Drawing Set Form
  - Fields: `setNumber`, `title`, `discipline`
- **Mutation**: `drawingSetsDb.create()`
- **Entity Written**: `DrawingSet`
  - Sets: `id`, `projectId`, `setNumber`, `title`, `discipline`, `sheets=[]`, `createdAt`
- **Side Effects**: None
- **Storage Key**: `drawingSets-${projectId}` (KV)

### Drawing Set Delete
- **UI Page**: DrawingsPage → Delete Set button → confirmation
- **Mutation**: `drawingSetsDb.delete(id)`
- **Entity Written**: `DrawingSet` (deleted)
- **Side Effects**:
  - **Cascade delete** all DrawingSheet records in set
  - For each sheet, cascade delete all DrawingRevision records
  - Remove file storage for all revisions
  - Remove references from Submittal.relatedDrawings
- **Storage Key**: `drawingSets-${projectId}` (KV)

### Drawing Sheet Create
- **UI Page**: DrawingsPage → Expand set → Add Sheet
- **Form**: Drawing Sheet Form
  - Fields: `sheetNumber`, `title`
- **Mutation**: Update DrawingSet, append to `sheets` array
- **Entity Written**: `DrawingSet.sheets[]`
  - New sheet gets: `id`, `setId`, `sheetNumber`, `title`, `currentRevision=null`, `revisions=[]`, `createdAt`
- **Side Effects**: None
- **Storage Key**: `drawingSets-${projectId}` (KV)

### Drawing Revision Create (Upload)
- **UI Page**: DrawingsPage → Sheet detail → Upload Revision
- **Form**: Revision Upload Dialog
  - Fields: `revision` (code), `description`, file upload
- **Function Call**: `extractDrawingMetadata(file)`, then create revision
- **Mutation**: Update DrawingSheet, append to `revisions` array
- **Entity Written**: `DrawingSheet.revisions[]`
  - New revision gets: `id`, `sheetId`, `revision`, `description`, `date` (now), `isCurrent=false`, `uploadedBy` (current user)
- **Side Effects**:
  - Upload file to storage, get URL/key
  - Run `runDrawingQA(sheetId, revisionId)` asynchronously
  - If `isCurrent=true`: update `currentRevision` field, set previous revision `isCurrent=false`
  - May detect scope changes via `detectScopeChanges()`
  - Create notification to project team
  - May create Alert if conflicts detected
- **Storage Key**: `drawingSets-${projectId}` (KV)

### Drawing Revision Set as Current
- **UI Page**: DrawingsPage → Revision list → Set as Current button
- **Mutation**: Update DrawingSheet.revisions array
- **Entity Written**: `DrawingSheet.currentRevision`, `DrawingRevision.isCurrent`
  - Sets selected revision `isCurrent=true`, all others `isCurrent=false`
  - Updates `currentRevision` field with revision code
- **Side Effects**:
  - Notification to team of new current revision
  - May trigger WorkPackage readiness re-evaluation if drawing was blocking
- **Storage Key**: `drawingSets-${projectId}` (KV)

### Drawing Revision Delete
- **UI Page**: DrawingsPage → Delete revision button
- **Mutation**: Update DrawingSheet, remove from `revisions` array
- **Entity Written**: `DrawingSheet.revisions[]` (filtered)
- **Side Effects**:
  - **Block** if revision is current
  - Remove file from storage
  - Remove QA results linked to revision
- **Storage Key**: `drawingSets-${projectId}` (KV)

---

## RFI MUTATIONS

### RFI Create
- **UI Page**: `/projects/:projectId/rfis` (RFIsPage) → Create RFI
- **Form**: RFI Form Dialog
  - Fields: `number`, `subject`, `question`, `priority`, `dueDate`
- **Mutation**: Create RFI via `useKV` functional update
- **Entity Written**: `RFI`
  - Sets: `id`, `projectId`, `number` (unique per project), `subject`, `question`, `answer=null`, `status='open'`, `priority`, `submittedBy` (current user), `submittedDate` (now), `dueDate`, `createdAt`
- **Side Effects**:
  - **Enforce uniqueness**: (projectId, number)
  - Auto-generate number if not provided (e.g., "RFI-001")
  - Create notification to RFI coordinator
  - May link to related Task or Drawing
  - Start ResponseLagEvent tracking
- **Storage Key**: `rfis-${projectId}` (KV)

### RFI Edit
- **UI Page**: RFIsPage → Edit button
- **Form**: Edit RFI Dialog
  - Fields: all RFI fields
- **Mutation**: `setRfis(current => current.map(...))`
- **Entity Written**: `RFI` (updated)
- **Side Effects**:
  - If status changed to 'answered': set `answeredDate`, `answeredBy`
  - If status changed to 'escalated': set `escalatedDate`, create Alert
  - Call `updateRFIEscalation(rfiId)` if aging threshold met
  - Notification to submitter if answered
  - May call `autoUpdateTaskOnRFI(rfiId)` to unblock related task
- **Storage Key**: `rfis-${projectId}` (KV)

### RFI Delete
- **UI Page**: RFIsPage → Delete button → confirmation
- **Mutation**: `setRfis(current => current.filter(...))`
- **Entity Written**: `RFI` (deleted)
- **Side Effects**:
  - **Consider soft delete** instead (set deletedAt)
  - Cascade delete RFISuggestion, ResponseLagEvent
  - Remove from PMA risk calculations
  - Notification to stakeholders
- **Storage Key**: `rfis-${projectId}` (KV)

### RFI Answer
- **UI Page**: RFIsPage → RFI detail → Answer button
- **Form**: Answer field in Edit dialog
  - Fields: `answer`, `answeredBy` (current user), `answeredDate` (auto)
- **Mutation**: Update RFI, set status='answered'
- **Entity Written**: `RFI`
  - Sets: `answer`, `answeredBy`, `answeredDate`, `status='answered'`
- **Side Effects**:
  - Create ResponseLagEvent if response was late
  - Calculate lagDays = answeredDate - submittedDate
  - Notification to submitter
  - May unblock related Task if RFI was blocking
  - Update PMA metrics
- **Storage Key**: `rfis-${projectId}` (KV)

---

## TASK MUTATIONS

### Task Create
- **UI Page**: `/projects/:projectId/schedule` (SchedulePage) → Add Task
- **Form**: Task Form Dialog
  - Fields: `name`, `description`, `status`, `priority`, `startDate`, `endDate`, `dependencies` (multi-select), `assignedTo`, `percentComplete`
- **Mutation**: `setTasks(current => [...current, newTask])`
- **Entity Written**: `Task`
  - Sets: `id`, `projectId`, `name`, `description`, `status`, `priority`, `startDate`, `endDate`, `dependencies=[]`, `assignedTo`, `percentComplete=0`, `isCriticalPath=false` (computed later), `createdAt`
- **Side Effects**:
  - Validate no circular dependencies via `detectCircularDependencies()`
  - Recompute critical path via `computeCriticalPath()`
  - Update `isCriticalPath` flag for all tasks
  - Update schedule health score
  - Notification to assignee
- **Storage Key**: `tasks-${projectId}` (KV)

### Task Edit
- **UI Page**: SchedulePage → Edit Task button
- **Form**: Edit Task Dialog
  - Fields: all task fields including dependencies
- **Mutation**: `setTasks(current => current.map(...))`
- **Entity Written**: `Task` (updated)
- **Side Effects**:
  - Validate dependencies not circular
  - Recompute critical path if dependencies or dates changed
  - Recompute schedule health
  - Notification if assignee changed or dates slipped
  - May trigger PMA risk if task slips beyond baseline
- **Storage Key**: `tasks-${projectId}` (KV)

### Task Delete
- **UI Page**: SchedulePage → Delete Task button → confirmation
- **Mutation**: `setTasks(current => current.filter(...))`
- **Entity Written**: `Task` (deleted)
- **Side Effects**:
  - Remove task ID from `dependencies` array of all other tasks
  - Cascade delete Constraint records linked to task
  - Recompute critical path
  - Recompute schedule health
  - May orphan WorkPackage or ExecutionTask if linked
- **Storage Key**: `tasks-${projectId}` (KV)

### Task Update Status
- **UI Page**: SchedulePage → Status dropdown or inline edit
- **Mutation**: Update Task.status, Task.percentComplete
- **Entity Written**: `Task`
  - Sets: `status`, optionally `percentComplete=100` if status='completed'
- **Side Effects**:
  - If status='completed': unlock dependent tasks, recalc critical path
  - Update schedule health
  - Notification to project manager
  - May update WorkPackage progress if task is part of package
- **Storage Key**: `tasks-${projectId}` (KV)

---

## DELIVERY MUTATIONS

### Delivery Create
- **UI Page**: `/projects/:projectId/deliveries` (DeliveriesPage) → Create Delivery
- **Form**: Delivery Form Dialog
  - Fields: `deliveryNumber`, `description`, `supplier`, `expectedDate`, `status='scheduled'`, `trackingNumber`, `notes`
  - Items: array of `{ description, quantity, unit, received=0 }`
- **Mutation**: `setDeliveries(current => [...current, newDelivery])`
- **Entity Written**: `Delivery`
  - Sets: `id`, `projectId`, `deliveryNumber`, `description`, `supplier`, `expectedDate`, `actualDate=null`, `status`, `trackingNumber`, `items[]`, `notes`, `createdAt`
- **Side Effects**:
  - Create notification to receiving team
  - May create Alert if expected date is soon
  - Link to WorkPackage if delivery is for specific package materials
- **Storage Key**: `deliveries-${projectId}` (KV)

### Delivery Edit
- **UI Page**: DeliveriesPage → Edit button
- **Form**: Edit Delivery Dialog
  - Fields: all delivery fields
- **Mutation**: `setDeliveries(current => current.map(...))`
- **Entity Written**: `Delivery` (updated)
- **Side Effects**:
  - If status changed: call `notifyDeliveryStatusChange(deliveryId)`
  - If status='delivered': set `actualDate` (now), update items.received
  - If status='delayed': create Alert, compute lagDays, may trigger PMA risk
  - Update WorkPackage readiness if delivery was blocking
  - Notification to project team
- **Storage Key**: `deliveries-${projectId}` (KV)

### Delivery Delete
- **UI Page**: DeliveriesPage → Delete button → confirmation
- **Mutation**: `setDeliveries(current => current.filter(...))`
- **Entity Written**: `Delivery` (deleted)
- **Side Effects**:
  - Cascade delete nested items
  - Remove from WorkPackage material requirements if linked
  - Update PMA metrics
- **Storage Key**: `deliveries-${projectId}` (KV)

### Delivery Item Received Update
- **UI Page**: DeliveriesPage → Delivery detail → Update received quantity
- **Mutation**: Update Delivery.items[index].received
- **Entity Written**: `DeliveryItem.received`
- **Side Effects**:
  - If all items fully received: update Delivery.status = 'delivered'
  - Notification if partial delivery
  - Update WorkPackage material readiness
- **Storage Key**: `deliveries-${projectId}` (KV)

---

## SUBMITTAL MUTATIONS

### Submittal Create
- **UI Page**: `/projects/:projectId/submittals` (SubmittalsPage) → Create Submittal
- **Form**: Submittal Form Dialog
  - Fields: `number`, `title`, `description`, `specSection`, `type`, `status='draft'`, `priority`, `submittedTo`, `requiredDate`, `ballInCourt='contractor'`, `relatedDrawings`, `relatedCostCodes`
- **Mutation**: `setSubmittals(current => [...current, newSubmittal])`
- **Entity Written**: `Submittal`
  - Sets: `id`, `projectId`, `number`, `title`, `description`, `specSection`, `type`, `status`, `priority`, `submittedTo`, `submittedBy=null`, `submittedDate=null`, `requiredDate`, `responseDate=null`, `reviewedBy=null`, `reviewComments=null`, `ballInCourt`, `daysOutstanding=0`, `relatedDrawings=[]`, `relatedCostCodes=[]`, `revisionNumber=0`, `createdAt`, `updatedAt`
- **Side Effects**:
  - Auto-generate number if not provided
  - Create notification to submittal coordinator
  - May create Alert if requiredDate is approaching
- **Storage Key**: `submittals-${projectId}` (KV)

### Submittal Edit/Update Status
- **UI Page**: SubmittalsPage → Edit or Status update
- **Form**: Edit Submittal Dialog
  - Fields: all submittal fields including status transitions (IFA, BFA, OFS, BFS, FFF, approved, returned, etc.)
- **Mutation**: `setSubmittals(current => current.map(...))`
- **Entity Written**: `Submittal` (updated)
  - Sets: updated fields, `updatedAt`
  - If status='submitted': set `submittedDate`, `submittedBy`
  - If status='approved' or similar: set `responseDate`, `reviewedBy`, update `ballInCourt`
  - Compute `daysOutstanding` = now - submittedDate
- **Side Effects**:
  - Notification on status change
  - Update `ballInCourt` based on status (contractor → architect → contractor, etc.)
  - If approved: may unlock WorkPackage or Task
  - If returned: create Alert, may delay schedule
  - Update PMA metrics (submittal aging)
- **Storage Key**: `submittals-${projectId}` (KV)

### Submittal Delete
- **UI Page**: SubmittalsPage → Delete button → confirmation
- **Mutation**: `setSubmittals(current => current.filter(...))`
- **Entity Written**: `Submittal` (deleted)
- **Side Effects**:
  - Consider soft delete instead
  - Remove from related drawing references
  - Update WorkPackage if submittal was blocking
- **Storage Key**: `submittals-${projectId}` (KV)

---

## ALERT MUTATIONS

### Alert Create (System-Generated)
- **Trigger**: Various system events (RFI aging, budget overrun, delivery delay, etc.)
- **Function**: PMA or business rule detects condition, calls `generateNotifications()`
- **Entity Written**: `Alert`
  - Sets: `id`, `projectId` (or null for global), `type`, `severity`, `title`, `message`, `entityType`, `entityId`, `actionRequired=true`, `actionUrl`, `dismissed=false`, `createdAt`, `expiresAt`
- **Side Effects**:
  - Display in Alerts page and dashboard widget
  - May send email notification (future)
- **Storage Key**: `alerts` or `alerts-${projectId}` (KV)

### Alert Dismiss
- **UI Page**: AlertsPage → Dismiss button
- **Mutation**: Update Alert, set dismissed=true
- **Entity Written**: `Alert`
  - Sets: `dismissed=true`, `dismissedBy` (current user ID), `dismissedAt` (now)
- **Side Effects**:
  - Remove from active alerts list
  - Update dashboard alert count
- **Storage Key**: `alerts` or `alerts-${projectId}` (KV)

### Alert Delete (Expired)
- **Trigger**: Background cleanup or manual action
- **Mutation**: Filter out alerts where `expiresAt < now` or `dismissed=true` and old
- **Entity Written**: `Alert` (deleted)
- **Side Effects**: None
- **Storage Key**: `alerts` or `alerts-${projectId}` (KV)

---

## TODO ITEM MUTATIONS

### Todo Create
- **UI Page**: `/projects/:projectId/todo` (TodoListPage) or Dashboard → Add Todo
- **Form**: Todo Form Dialog
  - Fields: `title`, `description`, `priority`, `status='pending'`, `assignedTo`, `dueDate`, `category`, `relatedEntity` (optional link)
- **Mutation**: `setTodos(current => [...current, newTodo])`
- **Entity Written**: `TodoItem`
  - Sets: `id`, `projectId` (or null for global), `title`, `description`, `priority`, `status`, `assignedTo`, `dueDate`, `completedDate=null`, `category`, `relatedEntity`, `createdBy` (current user), `createdAt`, `updatedAt`
- **Side Effects**:
  - Notification to assignee
  - May create Alert if due date approaching
- **Storage Key**: `todos-${projectId}` or `todos` (KV)

### Todo Update
- **UI Page**: TodoListPage → Edit or Status change
- **Mutation**: `setTodos(current => current.map(...))`
- **Entity Written**: `TodoItem` (updated)
  - If status='completed': set `completedDate` (now)
- **Side Effects**:
  - Notification on status change or reassignment
  - Remove from active todos if completed
- **Storage Key**: `todos-${projectId}` (KV)

### Todo Delete
- **UI Page**: TodoListPage → Delete button
- **Mutation**: `setTodos(current => current.filter(...))`
- **Entity Written**: `TodoItem` (deleted)
- **Side Effects**: None
- **Storage Key**: `todos-${projectId}` (KV)

---

## PRODUCTION NOTE MUTATIONS

### Production Note Create
- **UI Page**: `/projects/:projectId/production-notes` (ProductionNotesPage) → Add Note
- **Form**: Production Note Form Dialog
  - Fields: `date`, `shift`, `category`, `title`, `content`, `location`, `crew`, `tags`, `attachments`, `urgent`, `followUpRequired`, `followUpDate`
- **Mutation**: `setNotes(current => [...current, newNote])`
- **Entity Written**: `ProductionNote`
  - Sets: `id`, `projectId`, `date`, `shift`, `category`, `title`, `content`, `location`, `crew`, `tags=[]`, `attachments=[]`, `urgent`, `followUpRequired`, `followUpDate`, `createdBy` (current user), `createdAt`
- **Side Effects**:
  - Upload attachments to storage if provided
  - If urgent=true: create Alert
  - Notification to project manager
  - Link to related Task or WorkPackage if mentioned
- **Storage Key**: `productionNotes-${projectId}` (KV)

### Production Note Edit
- **UI Page**: ProductionNotesPage → Edit button
- **Mutation**: Update note
- **Entity Written**: `ProductionNote` (updated)
- **Side Effects**: None significant
- **Storage Key**: `productionNotes-${projectId}` (KV)

### Production Note Delete
- **UI Page**: ProductionNotesPage → Delete button
- **Mutation**: Delete note
- **Entity Written**: `ProductionNote` (deleted)
- **Side Effects**:
  - Remove attachments from storage
- **Storage Key**: `productionNotes-${projectId}` (KV)

---

## FABRICATION TRACKING MUTATIONS

### Fabrication Piece Create
- **UI Page**: `/projects/:projectId/fabrication` (FabricationTrackingPage) → Add Piece
- **Form**: Fabrication Form Dialog
  - Fields: `workPackageId`, `pieceNumber`, `description`, `material`, `weight`, `quantity`, `status='not-started'`, `drawingNumber`, `costCodeId`, `startDate`, `targetCompletionDate`, `assignedTo`, `notes`
- **Mutation**: `setFabrication(current => [...current, newPiece])`
- **Entity Written**: `Fabrication`
  - Sets: `id`, `projectId`, `workPackageId`, `pieceNumber`, `description`, `material`, `weight`, `quantity`, `status`, `detailingProgress=0`, `fabricationProgress=0`, `drawingNumber`, `costCodeId`, `startDate`, `targetCompletionDate`, `actualCompletionDate=null`, `assignedTo`, `notes`, `qcChecks=[]`, `createdAt`, `updatedAt`
- **Side Effects**:
  - Link to WorkPackage if specified
  - Update WorkPackage fabrication readiness
  - Create notification to shop team
- **Storage Key**: `fabrication-${projectId}` (KV)

### Fabrication Piece Update Status/Progress
- **UI Page**: FabricationTrackingPage → Update status or progress bars
- **Mutation**: Update piece
- **Entity Written**: `Fabrication`
  - Sets: `status`, `detailingProgress`, `fabricationProgress`, `actualCompletionDate` (if status='completed')
- **Side Effects**:
  - If status='completed': set actualCompletionDate, notify project team
  - Update WorkPackage fabrication progress rollup
  - May trigger delivery creation if status='shipped'
  - Update PMA metrics
- **Storage Key**: `fabrication-${projectId}` (KV)

### Fabrication QC Check Add
- **UI Page**: FabricationTrackingPage → Piece detail → Add QC Check
- **Form**: QC Check inline form
  - Fields: `date`, `inspector`, `passed`, `notes`
- **Mutation**: Update Fabrication, append to `qcChecks` array
- **Entity Written**: `Fabrication.qcChecks[]`
- **Side Effects**:
  - If QC check failed: create Alert, may block shipment
  - Notification to supervisor
- **Storage Key**: `fabrication-${projectId}` (KV)

### Fabrication Delete
- **UI Page**: FabricationTrackingPage → Delete piece
- **Mutation**: Delete piece
- **Entity Written**: `Fabrication` (deleted)
- **Side Effects**:
  - Update WorkPackage fabrication readiness
  - Adjust project actuals if costs were tracked
- **Storage Key**: `fabrication-${projectId}` (KV)

---

## LOOKAHEAD PLANNING MUTATIONS

### Lookahead Plan Create
- **UI Page**: `/projects/:projectId/lookahead` (LookAheadPlanningPage) → Create Plan
- **Form**: Lookahead Plan Form Dialog
  - Fields: `weekNumber`, `year`, `weekStart`, `weekEnd`, `status='draft'`, `plannedActivities`, `constraints`, `materialRequirements`, `equipmentNeeds`, `laborRequirements`, `safetyConsiderations`, `weatherForecast`, `notes`
- **Mutation**: `setPlans(current => [...current, newPlan])`
- **Entity Written**: `LookAheadPlan`
  - Sets: `id`, `projectId`, `weekNumber`, `year`, `weekStart`, `weekEnd`, `status`, `plannedActivities=[]`, `constraints=[]`, `materialRequirements=[]`, `equipmentNeeds=[]`, `laborRequirements=[]`, `safetyConsiderations=[]`, `weatherForecast`, `notes`, `createdBy`, `createdAt`, `updatedAt`
- **Side Effects**:
  - Auto-compute weekStart/weekEnd from weekNumber/year if not provided
  - Call `generateLookaheadWindow()` to populate activities from schedule
  - Create notification to project team
- **Storage Key**: `lookaheadPlans-${projectId}` (KV)

### Lookahead Plan Publish
- **UI Page**: LookAheadPlanningPage → Publish button
- **Mutation**: Update plan, set status='published'
- **Entity Written**: `LookAheadPlan.status`
- **Side Effects**:
  - Notification to all project team members
  - Lock plan from further edits (optional)
  - Export to PDF or print view (optional)
- **Storage Key**: `lookaheadPlans-${projectId}` (KV)

### Lookahead Activity Update
- **UI Page**: LookAheadPlanningPage → Activity inline edit
- **Mutation**: Update LookAheadPlan.plannedActivities[index]
- **Entity Written**: `LookAheadActivity`
  - Sets: `description`, `location`, `crew`, `estimatedDuration`, `dependencies`, `status`, `progress`, `constraints`
- **Side Effects**:
  - Recalculate resource demand
  - Update schedule if activity linked to Task
- **Storage Key**: `lookaheadPlans-${projectId}` (KV)

### Lookahead Plan Delete
- **UI Page**: LookAheadPlanningPage → Delete plan
- **Mutation**: Delete plan
- **Entity Written**: `LookAheadPlan` (deleted)
- **Side Effects**:
  - Cascade delete nested activities
- **Storage Key**: `lookaheadPlans-${projectId}` (KV)

---

## JOB SETUP MUTATIONS

### Job Setup Item Create
- **UI Page**: `/projects/:projectId/job-setup` (JobSetupPage) → Add Item
- **Form**: Job Setup Item Form
  - Fields: `category`, `description`, `required`, `status='not-started'`, `assignedTo`, `dueDate`, `notes`, `dependencies`, `order`
- **Mutation**: `setItems(current => [...current, newItem])`
- **Entity Written**: `JobSetupItem`
  - Sets: `id`, `projectId`, `category`, `description`, `required`, `status`, `assignedTo`, `dueDate`, `completedDate=null`, `completedBy=null`, `notes`, `dependencies=[]`, `order`, `createdAt`, `updatedAt`
- **Side Effects**:
  - Auto-assign order if not provided (max + 1)
  - Notification to assignee
  - May create Alert if required and not completed by due date
- **Storage Key**: `jobSetupItems-${projectId}` (KV)

### Job Setup Item Complete
- **UI Page**: JobSetupPage → Mark complete checkbox
- **Mutation**: Update item, set status='completed'
- **Entity Written**: `JobSetupItem`
  - Sets: `status='completed'`, `completedDate` (now), `completedBy` (current user)
- **Side Effects**:
  - Unlock dependent items (check dependencies)
  - Notification to project manager
  - Update job setup progress % on dashboard
- **Storage Key**: `jobSetupItems-${projectId}` (KV)

### Job Setup Item Delete
- **UI Page**: JobSetupPage → Delete item
- **Mutation**: Delete item
- **Entity Written**: `JobSetupItem` (deleted)
- **Side Effects**:
  - Remove from other items' dependencies arrays
- **Storage Key**: `jobSetupItems-${projectId}` (KV)

---

## NOTES

- All mutations using `useKV` follow functional update pattern: `set(current => ...)`
- Computed fields (totals, percentages, etc.) are recalculated on every mutation
- Side effects often include:
  - Notifications (create Alert or send email)
  - Recompute derived metrics (schedule health, budget variance, etc.)
  - Cascade updates to related entities
  - Authorization checks (ProjectMember validation)
- All timestamps use `new Date().toISOString()`
- All IDs use `crypto.randomUUID()`
- No real backend API yet; all persistence via `spark.kv` (client-side)
- Future: replace `useKV` with API endpoints for server-side validation and authorization
