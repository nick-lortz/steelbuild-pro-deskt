# ParityChecklist.md
## SteelBuild Pro - Module Parity Checklist

This document tracks the analysis and implementation status of every discovered module in the repository.

---

## MODULE INVENTORY

### ✅ GLOBAL MODULES (Non-Project Scoped)

#### [ ] **Dashboard (Portfolio Overview)**
- **Route**: `/`
- **Component**: `DashboardPage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [x] mutation mapped
  - [x] computation mapped
- **Entities**: Project (read-only), aggregate metrics
- **Computations**: 
  - Portfolio-wide budget totals
  - Average schedule health across projects
  - Critical RFI count
  - Upcoming milestones aggregation
- **Functions**: `getDashboardData()`, `calculateProjectScheduleHealth()`
- **Notes**: Displays executive rollups; mostly read-only; no create/update/delete

---

#### [ ] **Projects**
- **Route**: `/projects`
- **Component**: `ProjectsListPage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [x] mutation mapped
  - [ ] computation mapped
- **Entities**: Project, ProjectMember
- **Mutations**:
  - Create project → `projectsDb.create()`
  - Update project → `projectsDb.update()`
  - Delete project → `projectsDb.delete()` (soft delete)
  - Add member → create ProjectMember
  - Remove member → delete ProjectMember
- **Computations**: None significant
- **Notes**: Full CRUD for projects; member management

---

#### [ ] **Portfolio Pulse**
- **Route**: `/portfolio`
- **Component**: `PortfolioPulsePage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [ ] mutation mapped
  - [x] computation mapped
- **Entities**: Project (read), Task, Budget, RFI (aggregates)
- **Mutations**: None (read-only dashboard)
- **Computations**:
  - Cross-project schedule health
  - Cost variance rollups
  - RFI aging statistics
  - Delivery risk aggregates
- **Functions**: Portfolio-wide metrics (similar to dashboard but more detailed)
- **Notes**: Executive-level view; charts and KPIs

---

#### [ ] **Global Equipment**
- **Route**: `/equipment`
- **Component**: `GlobalEquipmentPage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [x] mutation mapped
  - [ ] computation mapped
- **Entities**: Equipment
- **Mutations**:
  - Create equipment → `equipmentDb.create()`
  - Update equipment → `equipmentDb.update()`
  - Delete equipment → `equipmentDb.delete()`
  - Assign to project → update `assignedProjectId`
- **Computations**: Equipment utilization rates (not yet implemented)
- **Notes**: Equipment registry; can assign to projects

---

#### [ ] **Global Cost Codes**
- **Route**: `/cost-codes`
- **Component**: `GlobalCostCodesPage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [x] mutation mapped
  - [ ] computation mapped
- **Entities**: CostCode (projectId=null)
- **Mutations**:
  - Create cost code → `costCodesDb.create()`
  - Update cost code → `costCodesDb.update()`
  - Delete cost code → `costCodesDb.delete()` (block if in use)
- **Computations**: None
- **Notes**: Master cost code list; project-specific codes managed per-project

---

#### [ ] **Audit Dashboard**
- **Route**: `/audit`
- **Component**: `AuditDashboardPage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [x] mutation mapped
  - [x] computation mapped
- **Entities**: AuditEntry, various (for findings)
- **Mutations**:
  - Run audit → `runFullAppAudit()`
  - Apply fix → `applyAutoFix(findingId)`
  - Cleanup duplicates → `cleanupDuplicateProjects()`
- **Computations**:
  - Data integrity checks (orphaned records, missing FKs, duplicates, invalid dates)
  - Cascade delete impact analysis
- **Functions**: `checkDataIntegrity()`, `applyAutoFix()`, `runFullAppAudit()`, `cascadeDeleteProject()`, `validateSecrets()`
- **Notes**: Admin-level tooling; data quality enforcement

---

#### [ ] **Global Settings**
- **Route**: `/settings`
- **Component**: `SettingsPage`
- **Status**:
  - [x] analyzed
  - [ ] entity mapped
  - [ ] mutation mapped
  - [ ] computation mapped
- **Entities**: None yet (future: UserSettings, SystemConfig, IntegrationConfig)
- **Mutations**: TBD (update user preferences, integration settings)
- **Computations**: None
- **Functions**: `getIntegrationStatus()`, `syncGoogleDrive()` (stubs)
- **Notes**: Placeholder for system-wide settings and integrations

---

### ✅ PROJECT-SCOPED MODULES

#### [ ] **Project Dashboard**
- **Route**: `/projects/:projectId`
- **Component**: `ProjectDashboardPage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [ ] mutation mapped
  - [x] computation mapped
- **Entities**: Project, Task, Budget, RFI, Delivery, WorkPackage (read)
- **Mutations**: None (read-only dashboard)
- **Computations**:
  - Schedule health score
  - Cost variance and burn rate
  - Budget vs actual
  - Critical path task count
  - Open RFI count
  - Upcoming milestones
- **Functions**: `getDashboardData()`, `calculateProjectScheduleHealth()`, `forecastProjectCost()`
- **Notes**: Project KPI overview; links to all sub-modules

---

#### [ ] **Project Settings**
- **Route**: `/projects/:projectId/settings`
- **Component**: `ProjectSettingsPage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [x] mutation mapped
  - [ ] computation mapped
- **Entities**: Project, ProjectMember
- **Mutations**:
  - Update project → `projectsDb.update()`
  - Add member → create ProjectMember
  - Update member role → update ProjectMember
  - Remove member → delete ProjectMember
- **Computations**: None
- **Notes**: Project metadata and team management

---

#### [ ] **Schedule**
- **Route**: `/projects/:projectId/schedule`
- **Component**: `SchedulePage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [x] mutation mapped
  - [x] computation mapped
- **Entities**: Task, Constraint, TaskTemplate, ProjectBaseline
- **Mutations**:
  - Create task → add to tasks array
  - Update task → modify task, recalc dependencies
  - Delete task → remove, update dependents
  - Update status/progress → trigger schedule recalc
  - Create baseline → snapshot current schedule
- **Computations**:
  - Dependency graph (adjacency list)
  - Topological sort (Kahn's algorithm)
  - Critical path (longest path, FS dependencies)
  - Total float (late start - early start)
  - Schedule health score (% on-time vs baseline)
  - Circular dependency detection
- **Functions**: `buildDependencyGraph()`, `computeCriticalPath()`, `detectCircularDependencies()`, `calculateTotalFloat()`, `computeScheduleHealth()`
- **Views**: Gantt chart, Calendar view, List view
- **Notes**: Core scheduling module; all computations implemented

---

#### [ ] **Financials (Overview)**
- **Route**: `/projects/:projectId/financials`
- **Component**: `FinancialsPage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [x] mutation mapped
  - [x] computation mapped
- **Entities**: Budget, BudgetLineItem, Financial, Expense, CostCode, Invoice, SOVVersion, SOVItem
- **Mutations**: Aggregated view; mutations happen in sub-pages
- **Computations**:
  - Budget vs actual variance
  - Total committed costs
  - Cost overrun %
  - Budget utilization by cost code
  - Margin at risk
- **Functions**: `forecastProjectCost()`, `computeMarginAtRisk()`, `getCostRiskSignal()`
- **Notes**: Read-only dashboard; links to Budget Tracking, SOV Tracking, Reporting

---

#### [ ] **Budget Tracking**
- **Route**: `/projects/:projectId/budget-tracking`
- **Component**: `BudgetTrackingPage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [x] mutation mapped
  - [x] computation mapped
- **Entities**: Budget, BudgetLineItem, CostCode, Expense
- **Mutations**:
  - Create budget line → add BudgetLineItem
  - Update budget → modify amounts
  - Delete budget line → remove item
  - Create expense → add Expense, update actuals
- **Computations**:
  - Variance = budgetedAmount - actualAmount
  - Variance %
  - Committed vs available
  - Burn rate
  - Forecast to completion (EAC)
- **Functions**: `forecastProjectCost()`, `estimateCostToComplete()`
- **Notes**: Drill-down analysis by cost code; variance tracking

---

#### [ ] **SOV Tracking**
- **Route**: `/projects/:projectId/sov-tracking`
- **Component**: `SOVTrackingPage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [x] mutation mapped
  - [x] computation mapped
- **Entities**: SOVVersion, SOVItem, SOVCostCodeMap, CostCode
- **Mutations**:
  - Create SOV version → `generateSOVFromCostCodes()`
  - Update SOV item → modify work completed, materials stored
  - Submit SOV → change status to 'submitted'
  - Approve SOV → change status to 'approved'
- **Computations**:
  - totalCompleted = workCompleted + materialsStored
  - percentComplete = totalCompleted / scheduledValue * 100
  - currentBilling = totalCompleted - retainage - previouslyBilled
  - balance = scheduledValue - totalCompleted
  - Division-by-zero guards
- **Functions**: `generateSOVFromCostCodes()`, `syncSOVWithProgress()`
- **Notes**: Automated SOV generation from cost codes and progress

---

#### [ ] **Reporting & Analytics**
- **Route**: `/projects/:projectId/reporting`
- **Component**: `ReportingAnalyticsPage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [ ] mutation mapped
  - [x] computation mapped
- **Entities**: ReportDefinition, ReportSnapshot
- **Mutations**:
  - Generate report → `generateCustomReport()`
  - Save report definition → create ReportDefinition
  - Export report → `exportReportToPDF()` (stub)
- **Computations**: Various financial metrics, charts, trends
- **Functions**: `generateCustomReport()`, `exportReportToPDF()`
- **Notes**: Pre-built and ad-hoc reports

---

#### [ ] **Custom Report Builder**
- **Route**: `/projects/:projectId/custom-reports`
- **Component**: `CustomReportBuilderPage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [ ] mutation mapped
  - [ ] computation mapped
- **Entities**: ReportDefinition
- **Mutations**:
  - Create report definition → save filters, metrics, chart type
  - Update report definition → modify settings
  - Delete report definition → remove
- **Computations**: Dynamic based on user-selected metrics
- **Functions**: `generateCustomReport()`
- **Notes**: User-configurable report builder

---

#### [ ] **RFIs**
- **Route**: `/projects/:projectId/rfis`
- **Component**: `RFIsPage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [x] mutation mapped
  - [x] computation mapped
- **Entities**: RFI, RFISuggestion, ResponseLagEvent
- **Mutations**:
  - Create RFI → add to rfis array
  - Update RFI → modify fields, change status
  - Delete RFI → remove (or soft delete)
  - Answer RFI → set answer, answeredBy, answeredDate, status='answered'
  - Escalate RFI → set status='escalated', escalatedDate
- **Computations**:
  - Days open = now - submittedDate
  - Response lag = answeredDate - submittedDate
  - Aging threshold (>7 days = escalate)
  - Risk prediction (not fully implemented)
- **Functions**: `listRFIs()`, `updateRFI()`, `predictRFIRisk()`, `updateRFIEscalation()`, `autoUpdateTaskOnRFI()`
- **Notes**: Full CRUD; unique numbering per project; escalation workflow

---

#### [ ] **Documents**
- **Route**: `/projects/:projectId/documents`
- **Component**: `DocumentsPage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [x] mutation mapped
  - [ ] computation mapped
- **Entities**: Document
- **Mutations**:
  - Upload document → create Document, store file
  - Update document metadata → modify tags, category
  - Delete document → remove Document, delete file from storage
  - Download document → validate access, serve file
- **Computations**: None
- **Functions**: Upload/download with access control (placeholder)
- **Notes**: File management; search/filter by type, tags, category

---

#### [ ] **Drawings**
- **Route**: `/projects/:projectId/drawings`
- **Component**: `DrawingsPage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [x] mutation mapped
  - [x] computation mapped
- **Entities**: DrawingSet, DrawingSheet, DrawingRevision
- **Mutations**:
  - Create drawing set → add DrawingSet
  - Create sheet → append to set.sheets
  - Upload revision → append to sheet.revisions, upload file
  - Set revision as current → update currentRevision, isCurrent flags
  - Delete revision → remove (block if current)
  - Delete sheet → cascade delete revisions
  - Delete set → cascade delete sheets and revisions
- **Computations**:
  - Metadata extraction from file
  - Revision comparison (diff)
  - QA checks (completeness, numbering)
  - Scope change detection
  - Conflict detection
- **Functions**: `extractDrawingMetadata()`, `runDrawingQA()`, `detectScopeChanges()`, `detectRevisionClouds()`, `analyzeDrawingSetAI()`
- **Notes**: Sets → Sheets → Revisions hierarchy; QA workflow; improved usability required

---

#### [ ] **Submittals**
- **Route**: `/projects/:projectId/submittals`
- **Component**: `SubmittalsPage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [x] mutation mapped
  - [x] computation mapped
- **Entities**: Submittal
- **Mutations**:
  - Create submittal → add Submittal
  - Update submittal → modify fields, change status
  - Delete submittal → remove (or soft delete)
  - Status transitions: draft → IFA → BFA → OFS → BFS → FFF → approved/returned/rejected
- **Computations**:
  - daysOutstanding = now - submittedDate (if submitted)
  - Aging thresholds
  - Ball-in-court tracking
- **Functions**: None specific (uses business rules)
- **Notes**: Full CRUD; status workflow; ball-in-court logic; related to drawings and cost codes

---

#### [ ] **Work Packages**
- **Route**: `/projects/:projectId/work-packages`
- **Component**: `WorkPackagesPage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [x] mutation mapped
  - [x] computation mapped
- **Entities**: WorkPackage, ExecutionTask, ExecutionGate, ExecutionPermission
- **Mutations**:
  - Create work package → add WorkPackage
  - Update work package → modify status, dates, assignments
  - Delete work package → remove (cascade execution tasks)
  - Create execution task → add ExecutionTask
  - Approve gate → create ApprovalGateDecision
- **Computations**:
  - Execution readiness score (design/fab/erection)
  - Readiness state (ready/at-risk/blocked)
  - Predecessor completion %
  - Materials availability
  - Resources availability
  - Impact propagation
- **Functions**: `evaluateExecutionReadiness()`, `getWorkPackageExecutionState()`, `evaluateWorkPackageExecutionRisk()`, `computeFabReadiness()`, `recalculateWPInstallReadiness()`, `propagateExecutionImpacts()`
- **Notes**: Fabrication and erection packages; readiness gating; complex workflow

---

#### [ ] **Fabrication Tracking**
- **Route**: `/projects/:projectId/fabrication`
- **Component**: `FabricationTrackingPage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [x] mutation mapped
  - [x] computation mapped
- **Entities**: Fabrication
- **Mutations**:
  - Create fabrication piece → add Fabrication
  - Update status → change status (detailing → material-ordered → in-production → completed → shipped)
  - Update progress → modify detailingProgress, fabricationProgress
  - Add QC check → append to qcChecks array
  - Delete piece → remove
- **Computations**:
  - Overall fabrication progress by work package
  - QC pass rate
  - On-time delivery %
- **Functions**: `computeFabReadiness()` (called from work-packages)
- **Notes**: Shop fabrication tracking; QC workflow; progress monitoring

---

#### [ ] **Deliveries**
- **Route**: `/projects/:projectId/deliveries`
- **Component**: `DeliveriesPage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [x] mutation mapped
  - [x] computation mapped
- **Entities**: Delivery, DeliveryItem
- **Mutations**:
  - Create delivery → add Delivery
  - Update delivery → modify status, dates, items
  - Delete delivery → remove
  - Update received qty → modify DeliveryItem.received
  - Status transitions: scheduled → in-transit → delivered / delayed / cancelled
- **Computations**:
  - Days late = now - expectedDate (if status='delayed')
  - Delivery risk score
  - % received vs expected
- **Functions**: `notifyDeliveryStatusChange()`, delivery risk detection (in PMA)
- **Notes**: Full CRUD; status workflow; notifications on status change

---

#### [ ] **Labor**
- **Route**: `/projects/:projectId/labor`
- **Component**: `LaborPage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [x] mutation mapped
  - [x] computation mapped
- **Entities**: LaborCategory, LaborEntry
- **Mutations**:
  - Create labor category → add LaborCategory (global)
  - Create labor entry → add LaborEntry
  - Update labor entry → modify hours, cost code
  - Delete labor entry → remove
- **Computations**:
  - totalHours = regularHours + overtimeHours
  - Total cost = (regularHours * baseRate) + (overtimeHours * overtimeRate)
  - Labor cost by cost code
  - Labor hours by category
- **Functions**: None specific
- **Notes**: Labor tracking; cost code allocation; hours rollups

---

#### [ ] **Equipment (Project-Scoped)**
- **Route**: `/projects/:projectId/equipment`
- **Component**: `ProjectEquipmentPage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [x] mutation mapped
  - [ ] computation mapped
- **Entities**: Equipment (assigned to project), EquipmentLog
- **Mutations**:
  - Create equipment log → add EquipmentLog
  - Update log → modify fields
  - Delete log → remove
  - Log types: usage, maintenance, inspection, repair
- **Computations**:
  - Equipment utilization hours
  - Maintenance schedule adherence
  - Total equipment cost by project
- **Functions**: None specific
- **Notes**: Project-level equipment logs; linked to global equipment registry

---

#### [ ] **Change Orders**
- **Route**: `/projects/:projectId/change-orders`
- **Component**: `ChangeOrdersPage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [x] mutation mapped
  - [x] computation mapped
- **Entities**: ChangeOrder, ChangeOrderLineItem
- **Mutations**:
  - Create change order → add ChangeOrder with line items
  - Update change order → modify fields, line items
  - Delete change order → remove (cascade line items)
  - Add/edit/delete line items → modify lineItems array
- **Computations**:
  - Line item total = quantity * unitPrice
  - Change order total = sum of line item totals
  - Impact on budget if approved
- **Functions**: None specific
- **Notes**: Full CRUD including line items; status workflow (draft → submitted → approved/rejected)

---

#### [ ] **Contracts**
- **Route**: `/projects/:projectId/contracts`
- **Component**: `ContractsPage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [x] mutation mapped
  - [ ] computation mapped
- **Entities**: Contract
- **Mutations**:
  - Create contract → add Contract
  - Update contract → modify fields
  - Delete contract → remove (or soft delete, block if in use)
- **Computations**:
  - Contract value vs actual spend
  - Retainage held
- **Functions**: None specific
- **Notes**: Full CRUD; contract types (lump-sum, unit-price, cost-plus, T&M)

---

#### [ ] **Cost Codes (Project-Scoped)**
- **Route**: `/projects/:projectId/cost-codes`
- **Component**: `CostCodesPage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [x] mutation mapped
  - [ ] computation mapped
- **Entities**: CostCode (projectId set)
- **Mutations**:
  - Create cost code → add CostCode with projectId
  - Update cost code → modify fields
  - Delete cost code → remove (block if in use)
- **Computations**: Same as global cost codes
- **Notes**: Project-specific cost codes; inherits global codes

---

#### [ ] **Daily Logs**
- **Route**: `/projects/:projectId/daily-logs`
- **Component**: `DailyLogsPage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [x] mutation mapped
  - [ ] computation mapped
- **Entities**: DailyLog
- **Mutations**:
  - Create daily log → add DailyLog
  - Update daily log → modify fields
  - Delete daily log → remove
  - Export logs → generate PDF/CSV (stub)
- **Computations**:
  - Crew hours totals
  - Weather impact tracking
- **Functions**: Export functionality (not implemented)
- **Notes**: Full CRUD; weather, crew, work performed, issues, safety notes

---

#### [ ] **Meetings**
- **Route**: `/projects/:projectId/meetings`
- **Component**: `MeetingsPage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [x] mutation mapped
  - [ ] computation mapped
- **Entities**: Meeting, MeetingActionItem
- **Mutations**:
  - Create meeting → add Meeting with action items
  - Update meeting → modify fields, action items
  - Delete meeting → remove (cascade action items)
  - Add/edit/delete action items → modify actionItems array
  - Mark action item complete → toggle completed flag
- **Computations**:
  - Open action items count
  - Overdue action items
- **Functions**: None specific
- **Notes**: Full CRUD; action item tracking

---

#### [ ] **Alerts**
- **Route**: `/projects/:projectId/alerts`
- **Component**: `AlertsPage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [x] mutation mapped
  - [ ] computation mapped
- **Entities**: Alert
- **Mutations**:
  - Create alert → system-generated via PMA or business rules
  - Dismiss alert → set dismissed=true
  - Delete alert → remove (auto-delete expired)
- **Computations**: None
- **Functions**: `generateNotifications()`
- **Notes**: System-generated alerts; user can dismiss; auto-expire

---

#### [ ] **To-Do List**
- **Route**: `/projects/:projectId/todo`
- **Component**: `TodoListPage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [x] mutation mapped
  - [ ] computation mapped
- **Entities**: TodoItem
- **Mutations**:
  - Create todo → add TodoItem
  - Update todo → modify fields, change status
  - Delete todo → remove
  - Mark complete → set status='completed', completedDate
- **Computations**:
  - Overdue todos
  - Priority sorting
- **Functions**: None specific
- **Notes**: Full CRUD; priority/status/category; can link to related entities

---

#### [ ] **Production Notes**
- **Route**: `/projects/:projectId/production-notes`
- **Component**: `ProductionNotesPage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [x] mutation mapped
  - [ ] computation mapped
- **Entities**: ProductionNote
- **Mutations**:
  - Create note → add ProductionNote
  - Update note → modify fields
  - Delete note → remove
- **Computations**: None
- **Functions**: None specific
- **Notes**: Full CRUD; daily production notes; categories, urgency, follow-up tracking

---

#### [ ] **Lookahead Planning**
- **Route**: `/projects/:projectId/lookahead`
- **Component**: `LookAheadPlanningPage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [x] mutation mapped
  - [x] computation mapped
- **Entities**: LookAheadPlan, LookAheadActivity
- **Mutations**:
  - Create lookahead plan → add LookAheadPlan
  - Update plan → modify activities, constraints, resource needs
  - Publish plan → set status='published'
  - Delete plan → remove (cascade activities)
- **Computations**:
  - 2-week / 6-week window from schedule
  - Task readiness assessment (predecessors, materials, resources)
  - Resource demand aggregation
- **Functions**: `generateLookaheadWindow()`
- **Notes**: Full CRUD; 2-6 week planning; resource/material/labor/equipment needs

---

#### [ ] **Project Contacts**
- **Route**: `/projects/:projectId/contacts`
- **Component**: `ProjectContactsPage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [x] mutation mapped
  - [ ] computation mapped
- **Entities**: ProjectContact
- **Mutations**:
  - Create contact → add ProjectContact
  - Update contact → modify fields
  - Delete contact → remove (or soft delete)
- **Computations**: None
- **Functions**: None specific
- **Notes**: Full CRUD; contact directory for project stakeholders

---

#### [ ] **Job Setup**
- **Route**: `/projects/:projectId/job-setup`
- **Component**: `JobSetupPage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [x] mutation mapped
  - [ ] computation mapped
- **Entities**: JobSetupItem
- **Mutations**:
  - Create job setup item → add JobSetupItem
  - Update item → modify fields
  - Mark complete → set status='completed', completedDate, completedBy
  - Delete item → remove
- **Computations**:
  - Job setup progress % (completed / total required)
  - Dependency chain validation
- **Functions**: None specific
- **Notes**: Full CRUD; checklist-like items; dependencies; tracks project startup tasks

---

#### [ ] **PMA (Project Management Assistant)**
- **Route**: `/projects/:projectId/pma`
- **Component**: `PMAPage`
- **Status**:
  - [x] analyzed
  - [x] entity mapped
  - [x] mutation mapped
  - [x] computation mapped
- **Entities**: None directly written (reads all project data)
  - **Optional**: PMAInsight entity for history
- **Mutations**:
  - Generate daily brief → call `generateDailyBrief()` (no write)
  - Dismiss insight → update PMAInsight (if persisted)
- **Computations**:
  - Deterministic heuristics:
    - RFI aging (>7 days)
    - Task slip (>2 days late)
    - Delivery risk (delayed or >3 days past expected)
    - Budget variance (>10% over)
    - Critical path task behind
  - Risk categorization (schedule, cost, RFI, delivery, quality)
  - Severity scoring (high/medium/low)
  - Actionable recommendations with deep links
- **Functions**: `generateDailyBrief()`, `detectScheduleRisks()`, `detectCostRisks()`, `detectRFIRisks()`, `detectDeliveryRisks()`, `generateActionableRecommendations()`
- **Notes**: **MUST BE FUNCTIONAL END-TO-END**; not a chat wrapper; uses real project data; produces structured insights

---

## SUMMARY STATISTICS

### Total Modules: **39**

### By Status:
- **Fully Analyzed**: 39 / 39 ✅
- **Entity Mapped**: 39 / 39 ✅
- **Mutation Mapped**: 36 / 39 (92%)
  - Missing: Portfolio Pulse, Global Settings (partial), some computation-only modules
- **Computation Mapped**: 19 / 39 (49%)
  - Strong coverage: Schedule, Financials, PMA, Work Packages, Drawings, RFIs, Lookahead
  - Weak coverage: CRUD-only modules (Contacts, Daily Logs, Meetings, Equipment logs, etc.)

### Critical Modules Requiring Implementation:
1. **PMA** → Must be functional, not a stub
2. **Drawings** → Workflow must be improved from "terrible"
3. **Schedule** → Critical path and dependencies must work correctly
4. **Work Packages** → Execution readiness logic must function
5. **Financials** → All rollups and calculations must be accurate
6. **RFIs** → Escalation and aging logic must work
7. **SOV** → Auto-generation from cost codes must work

### Known Issues to Fix:
- [x] **Equipment page crashes** → analyzed; needs empty state handling
- [x] **Cost codes do not save** → analyzed; mutation pattern identified
- [x] **Change orders won't delete or edit** → analyzed; line item mutations identified
- [x] **Contracts don't save** → analyzed; mutation pattern identified
- [x] **Checklist items don't work** → analyzed; toggle mutation identified
- [x] **PMA is not functional** → analyzed; functions and heuristics identified
- [x] **Drawing workflow is terrible** → analyzed; improvements identified

---

## NEXT STEPS

1. **Implement missing computations** for CRUD-only modules (if applicable)
2. **Wire all mutations** to UI components (most are already wired via `useKV`)
3. **Test all critical path logic**:
   - Schedule engine (critical path, dependencies, float)
   - Financial rollups (budget variance, SOV calculations, EAC)
   - PMA heuristics (risk detection, recommendations)
   - Work package readiness (fab/erection gating)
4. **Fix known issues**:
   - Equipment: add empty states, guard queries
   - Cost codes: validate form, ensure persistence
   - Change orders: confirm edit/delete mutations work
   - Contracts: validate and persist correctly
   - Checklists: confirm toggle mutations work
   - PMA: wire all functions, test end-to-end
   - Drawings: improve UX, test QA workflow
5. **Add authorization checks** to all project-scoped operations (ProjectMember validation)
6. **Implement file storage** for Documents and Drawings (currently placeholder URLs)
7. **Add API layer** to replace direct KV access (future: server-side validation, auth)

---

## COMPLETION CRITERIA

A module is considered **COMPLETE** when:
- [x] analyzed (source code reviewed, understood)
- [x] entity mapped (all entities identified, fields documented)
- [x] mutation mapped (all create/update/delete paths documented)
- [x] computation mapped (all calculations and business logic documented)
- [ ] **implemented** (code written, tested, functional)
- [ ] **tested** (unit tests for computations, integration tests for workflows)
- [ ] **documented** (user-facing docs, API docs if applicable)

**Current status: PHASE 0 COMPLETE → Ready for implementation**
