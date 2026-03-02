# SourceMap.md
## SteelBuild Pro - Complete Repository Source Map

---

## ROUTES & PAGES

### Global Routes (Non-Project Scoped)
- `/` → DashboardPage (global portfolio overview)
- `/projects` → ProjectsListPage (all projects list)
- `/portfolio` → PortfolioPulsePage (executive rollups)
- `/equipment` → GlobalEquipmentPage (equipment registry)
- `/cost-codes` → GlobalCostCodesPage (global cost code master)
- `/audit` → AuditDashboardPage (data integrity & fixes)
- `/settings` → SettingsPage (system settings)

### Project Routes (Project-Scoped: `/projects/:projectId/...`)
**Core Project**
- `[index]` → ProjectDashboardPage (project KPIs & health)
- `settings` → ProjectSettingsPage (project config)
- `pma` → PMAPage (Project Management Assistant)

**Scheduling**
- `schedule` → SchedulePage (tasks, dependencies, critical path)
- `lookahead` → LookAheadPlanningPage (2-6 week planning)

**Financials**
- `financials` → FinancialsPage (overview)
- `budget-tracking` → BudgetTrackingPage (budget variance tracking)
- `sov-tracking` → SOVTrackingPage (schedule of values tracking)
- `reporting` → ReportingAnalyticsPage (financial reports)
- `custom-reports` → CustomReportBuilderPage (custom report builder)
- `cost-codes` → CostCodesPage (project cost codes)

**Change Management**
- `change-orders` → ChangeOrdersPage (change orders + line items)
- `contracts` → ContractsPage (contracts)

**Documents & Drawings**
- `documents` → DocumentsPage (file management)
- `drawings` → DrawingsPage (sets, sheets, revisions, QA)
- `submittals` → SubmittalsPage (submittal tracking)

**RFIs & Communications**
- `rfis` → RFIsPage (RFI list, create, edit, delete)
- `meetings` → MeetingsPage (meeting notes, action items)
- `production-notes` → ProductionNotesPage (daily production notes)

**Work Execution**
- `work-packages` → WorkPackagesPage (fab/erection packages)
- `fabrication` → FabricationTrackingPage (fabrication tracking)
- `deliveries` → DeliveriesPage (delivery tracking)

**Resources**
- `labor` → LaborPage (labor categories, entries, hours)
- `equipment` → ProjectEquipmentPage (project equipment logs)

**Project Management**
- `daily-logs` → DailyLogsPage (daily logs)
- `alerts` → AlertsPage (alerts)
- `todo` → TodoListPage (to-do items)
- `contacts` → ProjectContactsPage (project contacts)
- `job-setup` → JobSetupPage (job setup checklist)

---

## MODULES REFERENCED IN NAVIGATION

### Main Layout Navigation
- Dashboard (portfolio)
- Projects
- Portfolio Pulse
- Global Equipment
- Global Cost Codes
- Audit Dashboard
- Settings

### Project Layout Navigation (Sidebar)
- Project Dashboard
- Schedule
- Financials
  - Overview
  - Budget Tracking
  - SOV Tracking
  - Reporting
  - Custom Reports
- RFIs
- Documents
- Drawings
- Submittals
- Work Packages
- Fabrication
- Deliveries
- Labor
- Equipment
- Change Orders
- Contracts
- Cost Codes
- Daily Logs
- Meetings
- Production Notes
- Lookahead Planning
- Alerts
- To-Do List
- Contacts
- Job Setup
- PMA
- Project Settings

---

## FORMS & FIELDS

### Project Form
Fields: name, number, client, location, status, startDate, endDate, contractValue, description

### Task Form
Fields: name, description, status, priority, startDate, endDate, dependencies (multi-select), assignedTo, percentComplete

### RFI Form
Fields: number, subject, question, answer, priority, status, dueDate, submittedBy, answeredBy

### Change Order Form
Fields: number, title, description, status, requestedBy, requestedDate
LineItems: description, quantity, unit, unitPrice (computed total)

### Contract Form
Fields: contractNumber, title, contractType, value, signedDate, startDate, completionDate, retainage, terms

### Drawing Set Form
Fields: setNumber, title, discipline
Sheets: sheetNumber, title
Revisions: revision, description, date, isCurrent

### Equipment Form
Fields: name, type, model, serialNumber, status, location, assignedProjectId, lastMaintenanceDate, nextMaintenanceDate

### Equipment Log Form
Fields: equipmentId, projectId, date, type, hours, description, cost, performedBy

### Cost Code Form
Fields: code, name, category, projectId (nullable), budgetAmount, actualAmount

### Submittal Form
Fields: number, title, description, specSection, type, status, priority, submittedTo, submittedBy, submittedDate, requiredDate, responseDate, reviewedBy, reviewComments, ballInCourt, relatedDrawings, relatedCostCodes, revisionNumber

### Delivery Form
Fields: deliveryNumber, description, supplier, expectedDate, actualDate, status, trackingNumber, notes
Items: description, quantity, unit, received

### Labor Entry Form
Fields: categoryId, employeeName, date, regularHours, overtimeHours, costCodeId, description

### Daily Log Form
Fields: date, weather, temperature, crew (array), workPerformed, issues, safetyNotes, visitors, deliveries, photos

### Meeting Form
Fields: title, type, date, location, attendees (array), agenda, notes
ActionItems: description, assignedTo, dueDate, completed

### Alert Form
Fields: type, severity, title, message, entityType, entityId, actionRequired, actionUrl, expiresAt

### Todo Item Form
Fields: title, description, priority, status, assignedTo, dueDate, category, relatedEntity

### Production Note Form
Fields: date, shift, category, title, content, location, crew, tags, attachments, urgent, followUpRequired, followUpDate

### Fabrication Form
Fields: workPackageId, pieceNumber, description, material, weight, quantity, status, detailingProgress, fabricationProgress, drawingNumber, costCodeId, startDate, targetCompletionDate, assignedTo, notes
QCChecks: date, inspector, passed, notes

### Lookahead Plan Form
Fields: weekNumber, year, weekStart, weekEnd, status, plannedActivities (array), constraints, materialRequirements, equipmentNeeds, laborRequirements, safetyConsiderations, weatherForecast, notes

### Job Setup Item Form
Fields: category, description, required, status, assignedTo, dueDate, completedDate, completedBy, notes, dependencies, order

### SOV Version Form
Fields: versionNumber, periodStart, periodEnd, status, notes, submittedDate, submittedBy, approvedDate, approvedBy

### SOV Item Form
Fields: versionId, lineNumber, description, scheduledValue, workCompleted, materialsStored, totalCompleted, percentComplete, retainage, previouslyBilled, currentBilling, balance, costCodeId

### Budget Form
Fields: costCodeId, budgetedAmount, actualAmount, committedAmount (computed variance)

### Expense Form
Fields: date, amount, category, vendor, description, status, costCodeId, receiptUrl, submittedBy, approvedBy, approvedDate

### Checklist Form (from template)
Fields: templateId, assignedTo, dueDate, status
Items: text, completed, completedBy, completedDate, notes

### Work Package Form
Fields: packageNumber, title, type (fabrication/erection), status, startDate, completionDate, assignedCrew, drawings (array), materials (array)

### Project Contact Form
Fields: name, company, role, email, phone, notes

### Project Risk Form
Fields: title, description, category, probability, impact, status, mitigation, owner, identifiedDate

---

## ENTITIES REFERENCED

### From `src/lib/types.ts`:
- Project
- ProjectMember
- ProjectContact
- ProjectRisk
- ProjectBaseline
- ProjectChecklistItem
- PMControlEntry
- CostCode
- ChangeOrder
- ChangeOrderLineItem
- Contract
- DrawingSet
- DrawingSheet
- DrawingRevision
- Equipment
- ChecklistTemplate
- ChecklistTemplateItem
- Checklist
- ChecklistItem
- Task
- TaskTemplate
- Constraint
- ExecutionTask
- ExecutionGate
- ExecutionPermission
- ApprovalGateDecision
- Budget
- Invoice
- InvoiceLineItem
- Expense
- RFI
- RFISuggestion
- ResponseLagEvent
- Document
- WorkPackage
- Delivery
- DeliveryItem
- LaborCategory
- LaborEntry
- EquipmentLog
- DailyLog
- Meeting
- MeetingActionItem
- AuditEntry
- BudgetForecast
- ReportDefinition
- ReportSnapshot
- SOVVersion
- SOVItem
- SOVCostCodeMap
- Submittal
- Alert
- TodoItem
- ProductionNote
- Fabrication
- LookAheadPlan
- LookAheadActivity
- JobSetupItem

### From `src/lib/entities.ts` (additional/duplicate):
- BudgetLineItem
- Financial
- ExpenseSplit
- ClientInvoice

### From `src/lib/schema.ts` (DB schema with underscore naming):
All entities above with snake_case column names plus:
- BaseEntity
- SoftDeletable
- ProjectScoped interfaces

---

## DB/API MODULES

### From `src/lib/db.ts`:
- projectsDb (getAll, getById, create, update, delete)
- costCodesDb (getAll, getByProject, create, update, delete)
- changeOrdersDb (getAll, getByProject, create, update, delete)
- contractsDb (getAll, getByProject, create, update, delete)
- drawingSetsDb (getAll, getByProject, create, update, delete)
- equipmentDb (getAll, create, update, delete)
- checklistTemplatesDb (getAll, create, update, delete)
- checklistsDb (getAll, getByProject, create, update, delete)

### From `src/lib/api/endpoints/`:
- projects.ts (endpoints for project CRUD)
- members.ts (project member management)
- tasks.ts (task CRUD + dependencies)
- rfis.ts (RFI CRUD + escalation)
- documents.ts (upload, download, list)
- drawings.ts (sets, sheets, revisions + QA)
- financials.ts (budgets, actuals, expenses, cost codes, invoices)
- change-orders.ts (CO CRUD + line items)
- contracts.ts (contract CRUD)
- equipment.ts (equipment CRUD + logs + inspections)
- labor.ts (categories + entries)
- deliveries.ts (delivery CRUD + status changes)
- audit.ts (run audit, list findings, apply fixes)
- pma.ts (generate daily brief, list insights)

---

## BACKEND FUNCTIONS (from `src/lib/functions/`)

### dashboard.ts
- `getDashboardData(userId)` → returns DashboardData
- `calculateProjectScheduleHealth(projectId)` → returns health score
- Referenced by: DashboardPage

### schedule-engine.ts
- `buildDependencyGraph(tasks)` → returns graph
- `computeCriticalPath(tasks)` → returns criticalPath array
- `detectCircularDependencies(tasks)` → returns conflicts
- `calculateTotalFloat(tasks)` → returns float map
- `computeScheduleHealth(tasks, baseline)` → returns health score
- `generateLookaheadWindow(projectId, startDate, weeks)` → returns LookaheadWindow
- Referenced by: SchedulePage, LookAheadPlanningPage

### budget-forecasting.ts
- `forecastProjectCost(projectId)` → returns BudgetForecast[]
- `computeMarginAtRisk(projectId)` → returns margin risk assessment
- `getCostRiskSignal(projectId, costCodeId)` → returns risk score
- `estimateCostToComplete(projectId, costCodeId)` → returns ETC
- Referenced by: FinancialsPage, BudgetTrackingPage

### rfi.ts
- `listRFIs(projectId, filters)` → returns RFI[]
- `updateRFI(rfiId, updates)` → updates RFI
- `predictRFIRisk(rfiId)` → returns risk assessment
- `updateRFIEscalation(rfiId)` → escalates if threshold met
- `autoUpdateTaskOnRFI(rfiId)` → links RFI to task
- Referenced by: RFIsPage, PMAPage

### drawings.ts / drawings-enhanced.ts
- `extractDrawingMetadata(file)` → returns metadata
- `runDrawingQA(sheetId, revisionId)` → returns QA report
- `detectScopeChanges(oldRevision, newRevision)` → returns scope flags
- `detectRevisionClouds(revisionFile)` → returns cloud locations
- `analyzeDrawingSetAI(setId)` → returns AI insights
- Referenced by: DrawingsPage

### work-packages.ts
- `evaluateExecutionReadiness(workPackageId)` → returns readiness state
- `getWorkPackageExecutionState(workPackageId)` → returns execution state
- `evaluateWorkPackageExecutionRisk(workPackageId)` → returns risk score
- `computeFabReadiness(workPackageId)` → returns fabrication readiness
- `recalculateWPInstallReadiness(workPackageId)` → returns erection readiness
- `propagateExecutionImpacts(workPackageId, change)` → updates dependents
- Referenced by: WorkPackagesPage, FabricationTrackingPage

### pma.ts / pma-heuristics.ts
- `generateDailyBrief(projectId)` → returns DailyBriefing
- `detectScheduleRisks(projectId)` → returns schedule risk array
- `detectCostRisks(projectId)` → returns cost risk array
- `detectRFIRisks(projectId)` → returns RFI aging risks
- `detectDeliveryRisks(projectId)` → returns delivery risks
- `generateActionableRecommendations(risks)` → returns action array with deep links
- Referenced by: PMAPage, ProjectDashboardPage

### data-integrity.ts
- `checkDataIntegrity(projectId?)` → returns findings array
- `applyAutoFix(findingId)` → applies safe fix
- `runFullAppAudit()` → returns comprehensive audit
- `cascadeDeleteProject(projectId)` → deletes project + all scoped data
- `cleanupDuplicateProjects()` → removes duplicates
- `validateSecrets()` → checks env vars
- Referenced by: AuditDashboardPage

### notifications.ts
- `generateNotifications(projectId, event)` → creates notification records
- `notifyDeliveryStatusChange(deliveryId)` → sends delivery notification
- Referenced by: DeliveriesPage, multiple pages

### integrations.ts
- `syncGoogleDrive(projectId)` → syncs documents (stub)
- `getIntegrationStatus(integration)` → returns status
- Referenced by: SettingsPage, DocumentsPage

### sov-generation.ts
- `generateSOVFromCostCodes(projectId)` → auto-generates SOV
- `syncSOVWithProgress(projectId, versionId)` → updates SOV items
- Referenced by: SOVTrackingPage

### reporting.ts
- `generateCustomReport(reportDefinition)` → returns report data
- `exportReportToPDF(reportSnapshot)` → exports PDF (stub)
- Referenced by: ReportingAnalyticsPage, CustomReportBuilderPage

---

## COMPUTATIONS IMPLEMENTED

### Schedule Computations (`schedule-engine.ts`)
- Dependency graph building (adjacency list)
- Topological sort (Kahn's algorithm)
- Critical path (longest path through FS dependencies)
- Total float calculation (late start - early start)
- Circular dependency detection
- Schedule health score (% on-time vs baseline)
- Lookahead window (2-week, 6-week planning)
- Resource demand aggregation
- Constraint violation detection

### Financial Rollups (`budget-forecasting.ts`)
- Budget vs actual variance (budgeted - actual)
- Cost forecasting (linear regression, earned value methods)
- Margin at risk computation (EAC - contract value)
- Burn rate calculation (actual / elapsed time)
- Cost-to-complete estimation (EAC - actual to date)
- SOV line item calculations (work + materials - retainage)
- Division-by-zero guards on all calculations

### Risk/Margin Calculations (`pma-heuristics.ts`, `budget-forecasting.ts`)
- Schedule risk score (overdue tasks, critical path slippage)
- Cost risk score (variance % thresholds)
- RFI aging risk (days open > threshold)
- Delivery risk (days late, status)
- Margin erosion rate (variance trend)
- Confidence levels (low/medium/high based on data completeness)

### PMA Logic (`pma.ts`, `pma-heuristics.ts`)
Deterministic heuristics (rule-based):
- RFI aging threshold: > 7 days open = escalate
- Task slip threshold: > 2 days late = flag
- Delivery risk threshold: status "delayed" or > 3 days past expected
- Budget variance threshold: > 10% over budget = alert
- Critical path task behind schedule = high priority action

Insight generation:
- Daily briefing summary (text generation can use LLM behind feature flag)
- Top actions ranked by impact (schedule, cost, RFI response)
- Risk categorization (schedule, cost, RFI, delivery, quality)
- Severity scoring (high/medium/low)
- Deep links generated to specific pages/entities

### Drawing QA (`drawings-enhanced.ts`)
- Metadata extraction (title block parsing)
- Revision cloud detection (image processing placeholder)
- Scope change detection (diff between revisions)
- Drawing set completeness check
- Sheet numbering validation
- Current revision flagging

### Audit/Data Integrity (`data-integrity.ts`)
- Orphaned records detection (foreign key validation)
- Duplicate detection (project_number uniqueness)
- Missing required fields
- Invalid date ranges (start > end)
- Cost code allocation mismatches
- Cascade delete impact analysis
- Auto-fix safe operations (e.g., set default values, link orphans)

---

## QUERY/MUTATION HOOKS (Inferred from KV usage in pages)

### Common Pattern:
Pages use `useKV` hook directly:
```typescript
const [items, setItems] = useKV<T[]>(`key-${projectId}`, [])
```

### Keys used across pages:
- `projects`
- `costCodes` / `costCodes-${projectId}`
- `changeOrders` / `changeOrders-${projectId}`
- `contracts` / `contracts-${projectId}`
- `drawingSets` / `drawingSets-${projectId}`
- `equipment`
- `rfis-${projectId}`
- `tasks-${projectId}`
- `deliveries-${projectId}`
- `submittals-${projectId}`
- `checklists-${projectId}`
- `workPackages-${projectId}`
- `fabrication-${projectId}`
- `laborEntries-${projectId}`
- `equipmentLogs-${projectId}`
- `dailyLogs-${projectId}`
- `meetings-${projectId}`
- `alerts` / `alerts-${projectId}`
- `todos` / `todos-${projectId}`
- `productionNotes-${projectId}`
- `lookaheadPlans-${projectId}`
- `jobSetupItems-${projectId}`
- `sovVersions-${projectId}`
- `sovItems-${projectId}`
- `budgets-${projectId}`
- `expenses-${projectId}`

Mutations are functional updates:
- Create: `setItems(current => [...current, newItem])`
- Update: `setItems(current => current.map(i => i.id === id ? updated : i))`
- Delete: `setItems(current => current.filter(i => i.id !== id))`

---

## NOTES
- All timestamps use ISO 8601 strings
- UUIDs generated via `crypto.randomUUID()`
- Current user context from `spark.user()` or hardcoded "Current User"
- Authorization checks not yet enforced (project membership not validated)
- File storage uses placeholder URLs (no actual S3/storage implementation)
- No real backend API yet; all data in KV store (client-side persistence)
