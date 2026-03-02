# SteelBuild Pro - Entity System Documentation

This document describes the comprehensive entity data model for the SteelBuild Pro construction project management system. The system implements project-scoped access control and supports soft deletes for data safety.

## Core Principles

1. **Project-Scoped Access**: All project-related entities include a `projectId` field
2. **Access Control**: ProjectMember roles determine access permissions
3. **Soft Deletes**: Projects support `deletedAt` timestamp for safe deletion
4. **Audit Trail**: All mutations are logged via AuditLog
5. **Timestamps**: All entities include `createdAt`; many include `updatedAt`

## Entity Categories

### 1. Project & Access Management

#### **Project**
Core project entity representing a construction project.
- Fields: name, number, client, location, status, dates, contractValue
- Relationships: Has many ProjectMembers, Has many of all project-scoped entities
- Soft Delete: Yes (deletedAt field)

#### **ProjectMember**
Defines user access and roles within a project.
- Fields: userId, role (owner|admin|member|viewer), permissions[]
- Relationships: Belongs to Project
- Access Control: Enforces all project queries/mutations

#### **ProjectContact**
External contacts associated with project (clients, architects, etc.)
- Fields: name, company, role, email, phone
- Relationships: Belongs to Project

#### **ProjectRisk**
Risk tracking and mitigation planning.
- Fields: title, category, probability, impact, status, mitigation
- Relationships: Belongs to Project

#### **ProjectBaseline**
Snapshot of project schedule, budget, and scope at a point in time.
- Fields: name, baselineDate, schedule, budget, scope
- Relationships: Belongs to Project

#### **ProjectChecklistItem**
Project-specific setup/execution/closeout checklists.
- Fields: category, description, required, completed
- Relationships: Belongs to Project

#### **PMControlEntry**
Project manager notes, decisions, issues, observations.
- Fields: entryType, title, content, priority, tags
- Relationships: Belongs to Project

---

### 2. Scheduling & Execution

#### **Task**
Schedule tasks with dependencies and critical path tracking.
- Fields: name, status, priority, dates, dependencies[], percentComplete, isCriticalPath
- Relationships: Belongs to Project, May have Constraints

#### **TaskTemplate**
Reusable task templates for common workflows.
- Fields: name, category, tasks[] with durations and dependencies
- Relationships: None (global resource)

#### **Constraint**
Date constraints on tasks (must-start-on, finish-no-later, etc.)
- Fields: taskId, type, date, reason
- Relationships: Belongs to Project and Task

#### **ExecutionTask**
Work authorization tasks requiring approval.
- Fields: name, status (pending|approved|in-progress|completed|rejected)
- Relationships: Belongs to Project, May belong to WorkPackage

#### **ExecutionGate**
Approval gates for design, fabrication, erection milestones.
- Fields: name, gateType, status, dependencies[]
- Relationships: Belongs to Project

#### **ExecutionPermission**
User permissions to approve/execute specific tasks or gates.
- Fields: userId, permissionType, grantedBy
- Relationships: Belongs to Project, May reference Task or ExecutionGate

#### **ApprovalGateDecision**
Records of gate approval decisions.
- Fields: decision (approved|rejected|conditional), decidedBy, comments, conditions[]
- Relationships: Belongs to ExecutionGate and Project

#### **SequenceComputationRun**
Logs of critical path and scheduling computations.
- Fields: runType, tasksProcessed, criticalPathUpdated, result
- Relationships: Belongs to Project

---

### 3. RFIs (Requests for Information)

#### **RFI**
Questions/clarifications during construction.
- Fields: number, subject, question, answer, status, priority, dates
- Relationships: Belongs to Project

#### **RFISuggestion**
AI or user-suggested responses to RFIs.
- Fields: suggestion, suggestedBy (ai|user), confidence
- Relationships: Belongs to RFI and Project

#### **ResponseLagEvent**
Tracks delayed RFI responses and their impact.
- Fields: expectedResponseDate, actualResponseDate, lagDays, impact
- Relationships: Belongs to RFI and Project

---

### 4. Documents & Drawings

#### **Document**
General project documents (contracts, specs, photos, reports).
- Fields: name, type, category, url, size, tags[]
- Relationships: Belongs to Project

#### **DrawingSet**
Collection of related drawings (structural, architectural, shop).
- Fields: setNumber, title, discipline
- Relationships: Belongs to Project, Has many DrawingSheets

#### **DrawingSheet**
Individual drawing sheet.
- Fields: sheetNumber, title, currentRevision
- Relationships: Belongs to DrawingSet, Has many DrawingRevisions

#### **DrawingRevision** (existing in types.ts)
Revision history for a drawing sheet.
- Fields: revision, description, date, isCurrent
- Relationships: Belongs to DrawingSheet

#### **DrawingSheetRevision** (new in entities.ts)
Enhanced revision tracking with file URLs.
- Fields: revision, description, date, isCurrent, fileUrl
- Relationships: Belongs to DrawingSheet

#### **DrawingAnnotation**
Notes, issues, clarifications marked on drawings.
- Fields: annotationType, xPosition, yPosition, content, resolved
- Relationships: Belongs to DrawingSheet and Project

#### **DrawingConflict**
Clashes or discrepancies between drawings.
- Fields: sheet1Id, sheet2Id, conflictType, description, severity, status
- Relationships: Belongs to Project, References DrawingSheets

#### **ScopeReference**
References to contract documents, drawings, specifications.
- Fields: referenceType, referenceNumber, description, section, page, tags[]
- Relationships: Belongs to Project

#### **ScopeGap**
Missing work, unclear requirements, conflicting information.
- Fields: title, category, impact, severity, status, affectedReferences[]
- Relationships: Belongs to Project

#### **DesignIntentFlag**
Clarifications or concerns about design intent.
- Fields: flagType, description, reasoning, proposedSolution, status
- Relationships: Belongs to Project

---

### 5. Financials

#### **Budget** (existing in types.ts)
Budget tracking by cost code.
- Fields: costCodeId, budgetedAmount, actualAmount, committedAmount, variance
- Relationships: Belongs to Project and CostCode

#### **BudgetLineItem**
Detailed budget breakdown.
- Fields: budgetId, costCodeId, description, amount
- Relationships: Belongs to Budget and Project

#### **Financial**
General financial transactions.
- Fields: type (revenue|expense|payment|invoice), amount, date, category
- Relationships: Belongs to Project

#### **Expense**
Project expenses requiring approval.
- Fields: date, amount, category, vendor, status, receiptUrl
- Relationships: Belongs to Project, May reference CostCode

#### **ExpenseSplit**
Splits expenses across multiple cost codes.
- Fields: expenseId, costCodeId, amount, percentage
- Relationships: Belongs to Expense and Project

#### **CostCode** (existing in types.ts)
Cost code hierarchy for financial tracking.
- Fields: code, name, category, projectId (optional for global codes)
- Relationships: May belong to Project (project-specific) or be global

#### **SOVItem** (Schedule of Values Item)
Line items in Schedule of Values for progress billing.
- Fields: itemNumber, description, scheduledValue, completions, balance
- Relationships: Belongs to SOVVersion and Project

#### **SOVVersion**
Versions of the Schedule of Values.
- Fields: versionNumber, effectiveDate, totalValue, status
- Relationships: Belongs to Project, Has many SOVItems

#### **SOVCostCodeMap**
Maps SOV items to cost codes for integrated tracking.
- Fields: sovItemId, costCodeId, percentage
- Relationships: Belongs to SOVItem, CostCode, and Project

#### **ClientInvoice**
Invoices sent to clients for progress payments.
- Fields: invoiceNumber, billingPeriod, amounts, retainage, status
- Relationships: Belongs to Project and SOVVersion

#### **Invoice** (existing in types.ts)
General invoices.
- Fields: invoiceNumber, dates, amount, status, lineItems[]
- Relationships: Belongs to Project

#### **InvoiceLine**
Detailed invoice line items.
- Fields: description, quantity, unit, rate, amount
- Relationships: Belongs to Invoice and Project

#### **EstimatedCostToComplete**
Forecasting remaining costs by cost code.
- Fields: costCodeId, estimatedCost, reasoning, confidence
- Relationships: Belongs to Project and CostCode

#### **MarginRiskAssessment**
Overall project margin risk analysis.
- Fields: assessmentDate, overallRiskLevel, projectedMargin, keyRisks[]
- Relationships: Belongs to Project, Has many MarginRiskEvents

#### **MarginRiskEvent**
Specific events impacting project margin.
- Fields: eventType, description, impactAmount, probability, mitigated
- Relationships: Belongs to MarginRiskAssessment and Project

#### **InstallMarginSnapshot**
Point-in-time margin calculations.
- Fields: snapshotDate, revenue, costs, grossMargin%
- Relationships: Belongs to Project

#### **ShippingCostRecord**
Tracks shipping and logistics costs.
- Fields: shipDate, carrier, trackingNumber, origin, destination, cost
- Relationships: Belongs to Project, May reference Delivery and CostCode

#### **RateCard**
Labor and equipment rate cards with markups.
- Fields: name, effectiveDate, laborRates{}, equipmentRates{}, markups{}
- Relationships: None (global resource)

---

### 6. Change Orders & Contracts

#### **ChangeOrder** (existing in types.ts)
Contract change orders.
- Fields: number, title, status, requestedBy, dates, lineItems[], total
- Relationships: Belongs to Project, Has embedded ChangeOrderLineItems

#### **ChangeOrderLineItem** (existing in types.ts)
Line items within a change order.
- Fields: description, quantity, unit, unitPrice, total
- Relationships: Belongs to ChangeOrder

#### **Contract** (existing in types.ts)
Project contracts (lump-sum, unit-price, cost-plus, T&M).
- Fields: contractNumber, title, contractType, value, dates, retainage
- Relationships: Belongs to Project

---

### 7. Labor, Equipment & Resources

#### **LaborCategory** (existing in types.ts)
Labor classifications with rates.
- Fields: name, code, baseRate, overtimeRate
- Relationships: None (global resource)

#### **LaborEntry** (existing in types.ts)
Daily labor time entries.
- Fields: categoryId, employeeName, date, hours (regular/OT), costCodeId
- Relationships: Belongs to Project, References LaborCategory and CostCode

#### **LaborBreakdown**
Labor hour budgets vs actuals by category.
- Fields: laborCategoryId, date, budgetedHours, actualHours, variance
- Relationships: Belongs to Project and LaborCategory

#### **LaborHours**
Detailed labor hour tracking with approvals.
- Fields: employeeId, laborCategoryId, date, hours (regular/OT/double), approvedBy
- Relationships: Belongs to Project, References LaborCategory and CostCode

#### **Resource**
General resources (labor, equipment, material, subcontractor).
- Fields: name, type, category, unitOfMeasure, baseRate, availability
- Relationships: None (global resource)

#### **ResourceCost**
Actual resource costs incurred.
- Fields: resourceId, projectId, date, quantity, unitCost, totalCost
- Relationships: Belongs to Resource and Project

#### **ResourceAllocation**
Resource assignments to projects.
- Fields: resourceId, dates, allocatedQuantity, utilization, status
- Relationships: Belongs to Resource and Project

#### **Crew**
Work crews with foreman and members.
- Fields: name, foremanId, members[], status, assignedProjectId
- Relationships: May be assigned to Project

#### **Equipment** (existing in types.ts)
Equipment inventory.
- Fields: name, type, model, serialNumber, status, location, maintenanceDates
- Relationships: May be assigned to Project

#### **EquipmentLog** (existing in types.ts)
Equipment usage, maintenance, inspection, repair logs.
- Fields: equipmentId, projectId, date, type, hours, description, cost
- Relationships: Belongs to Equipment, May belong to Project

#### **EquipmentUsage**
Detailed equipment usage tracking.
- Fields: equipmentId, projectId, date, times, hours, operatorId, costCodeId
- Relationships: Belongs to Equipment and Project

#### **EquipmentBooking**
Equipment reservation/booking system.
- Fields: equipmentId, projectId, requestedBy, dates, status, purpose
- Relationships: Belongs to Equipment and Project

#### **InspectionChecklist**
Equipment inspection records.
- Fields: equipmentId, inspectionType, date, inspectorId, items[], overallStatus
- Relationships: Belongs to Equipment

---

### 8. Work Packages & Execution Readiness

#### **WorkPackage** (existing in types.ts)
Fabrication or erection work packages.
- Fields: packageNumber, title, type, status, dates, drawings[], materials[]
- Relationships: Belongs to Project

#### **FabricationPackage**
Fabrication-specific packages.
- Fields: packageNumber, title, status, releaseDate, drawings[], materialList[]
- Relationships: Belongs to Project

#### **FabReleaseGroup**
Groups of fabrication packages released together.
- Fields: groupNumber, description, releaseDate, packages[], priority
- Relationships: Belongs to Project

#### **FabReadinessItem**
Checklist items for fabrication readiness (drawings, materials, tooling).
- Fields: packageId, itemType, description, status, dueDate
- Relationships: Belongs to FabricationPackage and Project

#### **Fabrication**
Individual fabricated pieces/assemblies.
- Fields: pieceNumber, description, status, dates, weight
- Relationships: Belongs to Project and WorkPackage

#### **Detailing**
Shop detailing assignments.
- Fields: detailNumber, description, detailer, status, priority, dueDate
- Relationships: Belongs to Project

#### **DetailingRevision**
Revisions of shop details.
- Fields: detailingId, revisionNumber, changes, reviewStatus
- Relationships: Belongs to Detailing and Project

#### **DetailingAction**
Actions taken on detailing (notes, changes, issues, approvals).
- Fields: detailingId, actionType, description, resolved
- Relationships: Belongs to Detailing and Project

#### **DetailImprovement**
Suggested improvements to detailing process.
- Fields: detailingId, suggestion, category, impact, status
- Relationships: Belongs to Detailing and Project

#### **ErectionIssue**
Issues encountered during erection.
- Fields: issueType (fit|missing|damaged|safety|design), location, priority, status
- Relationships: Belongs to Project, May reference WorkPackage

#### **ErectionReadiness**
Readiness checks before erection starts.
- Fields: workPackageId, checkDate, readyCriteria[], overallStatus, blockingIssues[]
- Relationships: Belongs to WorkPackage and Project

#### **ErectionPickPlan**
Crane pick plans for erection.
- Fields: workPackageId, planNumber, crane, riggingPlan, safetyRequirements[], status
- Relationships: Belongs to WorkPackage and Project

#### **FieldInstall**
Field installation tracking.
- Fields: installNumber, location, status, dates, crew, percentComplete
- Relationships: Belongs to Project, May reference WorkPackage

#### **FieldIssue**
General field issues.
- Fields: issueNumber, issueType, location, severity, status, resolution
- Relationships: Belongs to Project

#### **PunchItem**
Punch list items for project closeout.
- Fields: itemNumber, location, description, trade, priority, status, dates
- Relationships: Belongs to Project, May reference WorkPackage

#### **Delivery** (existing in types.ts)
Material/equipment deliveries.
- Fields: deliveryNumber, description, supplier, dates, status, trackingNumber, items[]
- Relationships: Belongs to Project, Has embedded DeliveryItems

#### **DeliveryItem** (existing in types.ts)
Items within a delivery.
- Fields: description, quantity, unit, received
- Relationships: Belongs to Delivery

#### **DeliveryRiskEvent**
Delivery-related risks (delays, damage, shortages).
- Fields: deliveryId, riskType, description, impact, mitigation
- Relationships: Belongs to Delivery and Project

---

### 9. Collaboration & Communications

#### **Message**
Inter-user messaging with threading.
- Fields: threadId, senderId, recipients[], subject, content, readBy[]
- Relationships: May belong to Project

#### **Notification**
User notifications (alerts, reminders, updates, approvals).
- Fields: userId, type, title, message, link, priority, read
- Relationships: May reference Project and Entity

#### **NotificationPreference**
User preferences for notification delivery.
- Fields: userId, channel (email|push|in-app), notificationType, enabled, frequency
- Relationships: Belongs to User

#### **EmailTemplate**
Reusable email templates.
- Fields: name, category, subject, body, variables[]
- Relationships: None (global resource)

#### **Meeting** (existing in types.ts)
Project meetings with notes and action items.
- Fields: projectId, title, type, date, attendees[], agenda, notes, actionItems[]
- Relationships: Belongs to Project

#### **ProductionNote**
Important notes for production (fab/erection).
- Fields: projectId, noteType, subject, content, tags[], pinnedUntil
- Relationships: Belongs to Project

#### **CollaborationSession**
Real-time collaboration sessions (reviews, coordination).
- Fields: projectId, sessionType, title, participants[], times, decisions[], actionItems[]
- Relationships: Belongs to Project

#### **CollaborationMessage**
Messages within a collaboration session.
- Fields: sessionId, senderId, message, timestamp
- Relationships: Belongs to CollaborationSession and Project

#### **Feedback**
User feedback on the system.
- Fields: category (bug|feature|improvement), title, description, status
- Relationships: May belong to Project

#### **AIInsight**
AI-generated insights (risks, opportunities, predictions).
- Fields: insightType, title, description, confidence, recommendation, reviewed
- Relationships: Belongs to Project

#### **Alert**
System alerts for critical conditions.
- Fields: alertType, category, title, severity, triggered/acknowledged/resolved
- Relationships: May belong to Project and Entity

---

### 10. Audit & QA

#### **QAConfig**
Quality assurance rule definitions.
- Fields: name, ruleType, entityType, ruleDefinition, severity, enabled
- Relationships: May be project-specific or global

#### **AuditRun**
QA audit execution logs.
- Fields: auditType, times, status, findingsCounts, runBy
- Relationships: May belong to Project

#### **AuditFinding**
Issues found during audits.
- Fields: auditRunId, qaConfigId, entityType, entityId, severity, message, status
- Relationships: Belongs to AuditRun, May belong to Project

#### **AuditFixTask**
Tasks to remediate audit findings.
- Fields: findingId, title, priority, status, assignedTo, resolution
- Relationships: Belongs to AuditFinding, May belong to Project

#### **AuditLog** (also exists as AuditEntry in types.ts)
Comprehensive audit trail of all data changes.
- Fields: entityType, entityId, action (create|update|delete), userId, timestamp, changes{}
- Relationships: May belong to Project

#### **Report**
Scheduled/ad-hoc report definitions.
- Fields: name, reportType, parameters, schedule, recipients[], format
- Relationships: May belong to Project

---

## Entity Relationships Summary

### Parent-Child Hierarchies
```
Project
├── ProjectMembers (access control)
├── ProjectContacts
├── ProjectRisks
├── ProjectBaselines
├── ProjectChecklistItems
├── PMControlEntries
├── Tasks
│   └── Constraints
├── ExecutionTasks
├── ExecutionGates
│   └── ApprovalGateDecisions
├── RFIs
│   ├── RFISuggestions
│   └── ResponseLagEvents
├── DrawingSets
│   └── DrawingSheets
│       ├── DrawingRevisions
│       ├── DrawingAnnotations
│       └── DrawingConflicts
├── Documents
├── ScopeReferences
├── ScopeGaps
├── DesignIntentFlags
├── Budgets
│   └── BudgetLineItems
├── Financials
├── Expenses
│   └── ExpenseSplits
├── SOVVersions
│   └── SOVItems
│       └── SOVCostCodeMaps
├── ClientInvoices
├── Invoices
│   └── InvoiceLines
├── EstimatedCostToCompletes
├── MarginRiskAssessments
│   └── MarginRiskEvents
├── InstallMarginSnapshots
├── ShippingCostRecords
├── ChangeOrders
│   └── ChangeOrderLineItems
├── Contracts
├── LaborEntries
├── LaborBreakdowns
├── LaborHours
├── ResourceCosts
├── ResourceAllocations
├── EquipmentUsage
├── EquipmentBookings
├── WorkPackages
│   ├── ExecutionTasks
│   ├── FabricationPackages
│   │   └── FabReadinessItems
│   ├── Fabrications
│   ├── ErectionReadiness
│   ├── ErectionPickPlans
│   └── FieldInstalls
├── FabReleaseGroups
├── Detailings
│   ├── DetailingRevisions
│   ├── DetailingActions
│   └── DetailImprovements
├── ErectionIssues
├── FieldIssues
├── PunchItems
├── Deliveries
│   ├── DeliveryItems
│   └── DeliveryRiskEvents
├── Messages
├── Notifications
├── Meetings
├── ProductionNotes
├── CollaborationSessions
│   └── CollaborationMessages
├── AIInsights
├── Alerts
├── QAConfigs
├── AuditRuns
│   └── AuditFindings
│       └── AuditFixTasks
├── Reports
└── SequenceComputationRuns
```

### Global Resources (Not Project-Scoped)
- TaskTemplate
- LaborCategory
- Resource
- Crew (unless assigned to project)
- Equipment (unless assigned to project)
- RateCard
- EmailTemplate

### Cross-Entity References
- CostCode: Referenced by Budgets, Expenses, LaborEntries, SOVCostCodeMaps, InvoiceLines
- WorkPackage: Referenced by ExecutionTasks, Fabrications, ErectionReadiness, FieldInstalls
- DrawingSheet: Referenced by DrawingAnnotations, DrawingConflicts
- ExecutionGate: Referenced by ExecutionPermissions, ApprovalGateDecisions
- Task: Referenced by Constraints, ExecutionPermissions

---

## Access Control Implementation

### ProjectMember Roles
- **owner**: Full access, can manage members, delete project
- **admin**: Full access except member management and project deletion
- **member**: Can create/edit most entities, view all
- **viewer**: Read-only access

### Permission Enforcement
Every query and mutation for project-scoped entities must:
1. Verify user is a ProjectMember of the project
2. Check role permissions for the requested operation
3. Log the action in AuditLog

### Example Permission Check
```typescript
async function checkProjectAccess(
  userId: string,
  projectId: string,
  requiredPermission: string
): Promise<boolean> {
  const member = await ProjectMember.find({ userId, projectId })
  if (!member) return false
  
  if (member.role === 'owner') return true
  if (member.role === 'admin' && requiredPermission !== 'manage-members') return true
  if (member.role === 'member' && !['manage-members', 'delete-project'].includes(requiredPermission)) return true
  if (member.role === 'viewer' && requiredPermission === 'read') return true
  
  return member.permissions.includes(requiredPermission)
}
```

---

## Cascade Delete Strategy

### Soft Delete (Recommended)
Projects should implement soft delete via `deletedAt` timestamp:
- Preserves audit trail and historical data
- Allows for data recovery
- Maintains referential integrity

### Cascade Rules
When a project is deleted (soft or hard):
1. **Keep**: Global resources (CostCodes without projectId, Equipment, LaborCategories)
2. **Delete/Hide**: All project-scoped entities
3. **Archive**: AuditLog entries (never delete)

---

## Database Implementation Notes

All entities are stored in Spark KV store using these key patterns:
- `projects` - Array of all projects
- `project:{projectId}:members` - Array of project members
- `project:{projectId}:tasks` - Array of project tasks
- `project:{projectId}:{entityType}` - Array of project-scoped entities
- `global:{entityType}` - Array of global resources

Example DB access patterns in `src/lib/db.ts`.

---

## Next Steps

1. **Implement DB Layer**: Create CRUD operations for each entity type in `src/lib/db.ts`
2. **Add Access Control**: Implement ProjectMember permission checks
3. **Create UI Components**: Build forms and views for each entity
4. **Seed Data**: Generate realistic sample data for development
5. **API Integration**: Connect entities to backend services if needed

---

## File Locations

- **Entity Types**: `/src/lib/types.ts` (existing entities)
- **New Entity Types**: `/src/lib/entities.ts` (extended entities)
- **Database Layer**: `/src/lib/db.ts` (CRUD operations)
- **This Documentation**: `/ENTITIES_README.md`
