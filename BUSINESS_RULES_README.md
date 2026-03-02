# Business Rules Implementation - SteelBuild Pro

## Overview

This document describes the comprehensive business rules implementation for SteelBuild Pro, ensuring data integrity, security, and operational correctness across all modules.

## File Location

`/src/lib/business-rules.ts`

## Business Rules Categories

### 1. Uniqueness Constraints

#### Project Number Uniqueness
- **Rule**: `project_number` must be unique across all non-deleted projects
- **Implementation**: `businessRules.uniqueness.validateProjectNumber()`
- **Usage**:
```typescript
import { businessRules } from '@/lib/business-rules'

// Before creating/updating a project
await businessRules.uniqueness.validateProjectNumber(projectNumber)
// Throws BusinessRuleError if duplicate found
```

#### RFI Number Uniqueness per Project
- **Rule**: `(project_id, rfi_number)` must be unique
- **Implementation**: `businessRules.uniqueness.validateRFINumber()`
- **Usage**:
```typescript
await businessRules.uniqueness.validateRFINumber(projectId, rfiNumber)
// Throws BusinessRuleError if duplicate found in project
```

### 2. Authorization & Access Control

#### Project Member Access
- **Rule**: Users can only read/write data for projects where they are a member (unless admin)
- **Roles**: `owner`, `admin`, `member`, `viewer`
- **Hierarchy**:
  - `owner`: Full access including member management and project deletion
  - `admin`: Full access except member management and deletion
  - `member`: Create/edit most entities, view all
  - `viewer`: Read-only access

#### Access Check Methods

```typescript
// Check if user has access to project (any level)
const member = await businessRules.authorization.checkProjectAccess(
  userId,
  projectId,
  isAdmin
)

// Check read access
await businessRules.authorization.checkReadAccess({ userId, projectId, isAdmin })

// Check write access (blocks viewers)
await businessRules.authorization.checkWriteAccess({ userId, projectId, isAdmin })

// Check admin access (blocks members and viewers)
await businessRules.authorization.checkAdminAccess({ userId, projectId, isAdmin })

// Check document access with backend validation
await businessRules.authorization.checkDocumentAccess(
  { userId, projectId, isAdmin },
  documentId
)
```

#### Document Security
- **Rule**: Documents must be protected by backend file access validation
- **Implementation**: No public object access; all document URLs require authorization check
- **Pattern**:
```typescript
// Before serving document
await businessRules.authorization.checkDocumentAccess(
  { userId, projectId },
  documentId
)
// Only then return document URL or serve file
```

### 3. Scheduling Logic

#### Business Day Calculations
- **Rule**: Weekend exclusion (Saturday/Sunday)
- **Holiday Support**: Architecture ready; holidays array can be populated
- **Methods**:

```typescript
// Calculate business days between two dates
const days = businessRules.scheduling.calculateBusinessDays(
  startDate,
  endDate,
  holidays // optional
)

// Add business days to a date
const futureDate = businessRules.scheduling.addBusinessDays(
  startDate,
  10, // business days to add
  holidays // optional
)
```

#### Task Dependencies
- **Rule**: Finish-to-Start (FS) dependencies enforced
- **Implementation**: `validateDependencies()`
- **Usage**:
```typescript
const result = businessRules.scheduling.validateDependencies(tasks)
if (!result.valid) {
  console.error('Dependency errors:', result.errors)
  // errors array contains human-readable descriptions
}
```

#### Critical Path Calculation
- **Algorithm**: Identifies tasks with zero slack (cannot be delayed without affecting project completion)
- **Updates**: `isCriticalPath` flag on Task entities
- **Usage**:
```typescript
const criticalTaskIds = businessRules.scheduling.calculateCriticalPath(tasks)
// Returns array of task IDs on critical path

// Update tasks
tasks.forEach(task => {
  task.isCriticalPath = criticalTaskIds.includes(task.id)
})
```

#### Task Date Validation
```typescript
businessRules.scheduling.validateTaskDates(task)
// Throws BusinessRuleError if:
// - start date is invalid
// - end date is invalid
// - start date is after end date
```

### 4. Financial Calculation Protections

#### Division by Zero Protection
- **Rule**: All division operations protected
- **Implementation**: `safeDivide()` method returns defaultValue (0) when denominator is zero or non-finite
- **Usage**:
```typescript
const utilizationPercent = businessRules.financial.safeDivide(
  actualHours,
  budgetedHours,
  0 // default value if division fails
)
// Never throws; always returns a safe number
```

#### Budget vs Actual Rollups
- **Rule**: Consistent calculations across cost codes and SOV
- **Validations**:

```typescript
// Validate budget variance calculations
const budgetResult = businessRules.financial.validateBudgetRollup(
  budgets,
  costCodes
)
if (!budgetResult.valid) {
  console.error('Budget issues:', budgetResult.errors)
}

// Validate SOV vs Budget consistency
const sovResult = businessRules.financial.validateSOVBudgetConsistency(
  sovItems,
  budgets
)
if (!sovResult.valid) {
  console.error('SOV/Budget mismatch:', sovResult.errors)
}
```

#### Variance Calculations
```typescript
// Calculate dollar variance
const variance = businessRules.financial.calculateVariance(
  budgeted,
  actual
)

// Calculate percentage variance
const variancePercent = businessRules.financial.calculateVariancePercentage(
  budgeted,
  actual
)
// Uses safeDivide internally
```

#### Project Margin Calculation
```typescript
const { margin, marginPercent } = businessRules.financial.calculateProjectMargin(
  revenue,
  costs
)
// marginPercent uses safeDivide for safety
```

#### Change Order Validation
```typescript
businessRules.financial.validateChangeOrderTotal(changeOrder)
// Throws BusinessRuleError if line item totals don't match CO total
// Allows 0.01 tolerance for rounding
```

### 5. Drawing Management Logic

#### Drawing Sets, Sheets & Revisions
- **Structure**:
  - `DrawingSet` contains multiple `DrawingSheet`s
  - Each `DrawingSheet` has multiple `DrawingRevision`s
  - Only one revision can be marked `isCurrent` per sheet

#### Revision Validation
```typescript
await businessRules.drawings.validateDrawingRevision(
  sheetId,
  newRevision,
  existingRevisions
)
// Throws BusinessRuleError if:
// - Duplicate revision number for sheet
// - Attempting to mark multiple revisions as current
```

#### Current Revision Management
```typescript
// Get current revision
const current = businessRules.drawings.getCurrentRevision(sheet)

// Mark a revision as current (unmarks others)
const updatedSheet = await businessRules.drawings.markRevisionAsCurrent(
  sheet,
  revisionId
)
```

#### Conflict Detection
```typescript
const conflicts = businessRules.drawings.detectDrawingConflicts(sheets)
// Returns array of conflicts with:
// - sheet1, sheet2: Conflicting sheets
// - reason: Description (e.g., "Large revision date gap: 120 days")
```

#### Scope Change Flagging
```typescript
const hasScope Change = businessRules.drawings.flagScopeChanges(
  oldRevision,
  newRevision
)
// Returns true if description contains scope keywords:
// 'added', 'removed', 'relocated', 'revised', 'deleted', 'new', 'modified'
```

### 6. Project Management Assistant (PMA)

The PMA must produce daily briefs, detect risks, and generate actionable recommendations.

#### Daily Brief Generation
```typescript
const dailyBrief = await businessRules.pma.generateDailyBrief(projectId)
// Returns AI-generated summary covering:
// - Schedule status (tasks, critical path, overdue)
// - Cost status (budget, actual, over-budget codes)
// - RFI status (open, aging, overdue)
// - Top 5 risks
// - 3-5 actionable recommendations with app links
```

#### Schedule Risk Detection
```typescript
const scheduleRisks = businessRules.pma.detectScheduleRisks(tasks)
// Returns:
// {
//   criticalPathCount: number
//   overdueTasks: Task[]
//   atRiskTasks: Task[] // <7 days remaining, <50% complete
//   topRisks: string[] // Human-readable risk descriptions
// }
```

#### Cost Risk Detection
```typescript
const costRisks = businessRules.pma.detectCostRisks(budgets)
// Returns:
// {
//   overBudgetCodes: Budget[] // actual + committed > budgeted
//   topRisks: string[] // Human-readable cost issues
// }
```

#### RFI Aging Risk Detection
```typescript
const rfiRisks = businessRules.pma.detectRFIAgingRisks(rfis)
// Returns:
// {
//   agingRFIs: RFI[] // >14 days old
//   overdueRFIs: RFI[] // past due date
//   topRisks: string[]
// }
```

#### Actionable Recommendations
```typescript
const recommendations = await businessRules.pma.generateActionableRecommendations(
  projectId,
  { schedule: scheduleRisks, cost: costRisks, rfi: rfiRisks }
)
// Returns array of:
// {
//   action: string // Description of recommended action
//   link: string // Deep link into app (e.g., "/projects/123/schedule")
//   priority: 'high' | 'medium' | 'low'
// }
```

## Error Handling

### BusinessRuleError Class
Custom error class for business rule violations:

```typescript
try {
  await businessRules.uniqueness.validateProjectNumber(projectNumber)
} catch (error) {
  if (error instanceof BusinessRuleError) {
    console.error('Business rule violated:', error.message)
    console.error('Error code:', error.code)
    console.error('Affected field:', error.field)
  }
}
```

### Common Error Codes
- `DUPLICATE_PROJECT_NUMBER`
- `DUPLICATE_RFI_NUMBER`
- `PROJECT_NOT_FOUND`
- `ACCESS_DENIED`
- `INSUFFICIENT_PERMISSIONS`
- `DOCUMENT_NOT_FOUND`
- `INVALID_START_DATE`
- `INVALID_END_DATE`
- `INVALID_DATE_RANGE`
- `CO_TOTAL_MISMATCH`
- `DUPLICATE_REVISION`
- `MULTIPLE_CURRENT_REVISIONS`

## Integration Patterns

### In CRUD Operations
```typescript
// CREATE Project
async function createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) {
  // 1. Validate uniqueness
  await businessRules.uniqueness.validateProjectNumber(data.number)
  
  // 2. Create project
  const project = await db.projects.create(data)
  
  // 3. Return
  return project
}

// UPDATE RFI
async function updateRFI(projectId: string, rfiId: string, updates: Partial<RFI>, userId: string) {
  // 1. Check access
  await businessRules.authorization.checkWriteAccess({ userId, projectId })
  
  // 2. Validate uniqueness if number changed
  if (updates.number) {
    await businessRules.uniqueness.validateRFINumber(projectId, updates.number, rfiId)
  }
  
  // 3. Update
  const rfi = await db.rfis.update(rfiId, updates)
  
  // 4. Return
  return rfi
}
```

### In Schedule Computation
```typescript
async function recomputeSchedule(projectId: string, userId: string) {
  // 1. Check access
  await businessRules.authorization.checkWriteAccess({ userId, projectId })
  
  // 2. Load tasks
  const tasks = await db.tasks.getByProject(projectId)
  
  // 3. Validate dependencies
  const depResult = businessRules.scheduling.validateDependencies(tasks)
  if (!depResult.valid) {
    throw new Error(`Invalid dependencies: ${depResult.errors.join(', ')}`)
  }
  
  // 4. Calculate critical path
  const criticalTaskIds = businessRules.scheduling.calculateCriticalPath(tasks)
  
  // 5. Update tasks
  for (const task of tasks) {
    task.isCriticalPath = criticalTaskIds.includes(task.id)
    await db.tasks.update(task.id, { isCriticalPath: task.isCriticalPath })
  }
  
  // 6. Log computation
  await db.sequenceComputations.create({
    projectId,
    runType: 'manual',
    tasksProcessed: tasks.length,
    criticalPathUpdated: true,
    result: { criticalTaskCount: criticalTaskIds.length }
  })
}
```

### In Financial Reports
```typescript
async function generateFinancialReport(projectId: string, userId: string) {
  // 1. Check access
  await businessRules.authorization.checkReadAccess({ userId, projectId })
  
  // 2. Load data
  const [budgets, costCodes, sovItems] = await Promise.all([
    db.budgets.getByProject(projectId),
    db.costCodes.getByProject(projectId),
    db.sovItems.getByProject(projectId)
  ])
  
  // 3. Validate consistency
  const budgetResult = businessRules.financial.validateBudgetRollup(budgets, costCodes)
  const sovResult = businessRules.financial.validateSOVBudgetConsistency(sovItems, budgets)
  
  // 4. Calculate metrics with protection
  const metrics = budgets.map(budget => ({
    costCode: costCodes.find(c => c.id === budget.costCodeId)?.code,
    budgeted: budget.budgetedAmount,
    actual: budget.actualAmount,
    variance: businessRules.financial.calculateVariance(
      budget.budgetedAmount,
      budget.actualAmount
    ),
    variancePercent: businessRules.financial.calculateVariancePercentage(
      budget.budgetedAmount,
      budget.actualAmount
    ),
    utilization: businessRules.financial.safeDivide(
      budget.actualAmount,
      budget.budgetedAmount,
      0
    ) * 100
  }))
  
  // 5. Return report
  return {
    metrics,
    warnings: [...budgetResult.errors, ...sovResult.errors]
  }
}
```

### In PMA Dashboard
```typescript
async function loadPMADashboard(projectId: string, userId: string) {
  // 1. Check access
  await businessRules.authorization.checkReadAccess({ userId, projectId })
  
  // 2. Load data
  const [tasks, budgets, rfis] = await Promise.all([
    db.tasks.getByProject(projectId),
    db.budgets.getByProject(projectId),
    db.rfis.getByProject(projectId)
  ])
  
  // 3. Detect risks
  const scheduleRisks = businessRules.pma.detectScheduleRisks(tasks)
  const costRisks = businessRules.pma.detectCostRisks(budgets)
  const rfiRisks = businessRules.pma.detectRFIAgingRisks(rfis)
  
  // 4. Generate recommendations
  const recommendations = await businessRules.pma.generateActionableRecommendations(
    projectId,
    { schedule: scheduleRisks, cost: costRisks, rfi: rfiRisks }
  )
  
  // 5. Generate daily brief (optional, cached)
  const dailyBrief = await businessRules.pma.generateDailyBrief(projectId)
  
  // 6. Return dashboard data
  return {
    risks: {
      schedule: scheduleRisks,
      cost: costRisks,
      rfi: rfiRisks
    },
    recommendations,
    dailyBrief
  }
}
```

## Testing Business Rules

### Unit Test Examples

```typescript
import { businessRules, BusinessRuleError } from '@/lib/business-rules'

describe('Uniqueness Rules', () => {
  it('should reject duplicate project numbers', async () => {
    await expect(
      businessRules.uniqueness.validateProjectNumber('PROJ-001')
    ).rejects.toThrow(BusinessRuleError)
  })
})

describe('Financial Calculations', () => {
  it('should protect against division by zero', () => {
    const result = businessRules.financial.safeDivide(100, 0, 0)
    expect(result).toBe(0)
  })
  
  it('should calculate variance correctly', () => {
    const variance = businessRules.financial.calculateVariance(1000, 800)
    expect(variance).toBe(200)
  })
})

describe('Scheduling Logic', () => {
  it('should exclude weekends from business days', () => {
    const start = new Date('2024-01-08') // Monday
    const end = new Date('2024-01-12') // Friday
    const days = businessRules.scheduling.calculateBusinessDays(start, end)
    expect(days).toBe(5)
  })
})
```

## Performance Considerations

1. **Caching**: Daily briefs and risk calculations can be cached with 1-hour TTL
2. **Batch Operations**: When updating multiple tasks, run critical path calculation once
3. **Lazy Loading**: Load entities only when needed for validation
4. **Indexing**: Ensure KV keys are structured for efficient lookups

## Future Enhancements

1. **Holiday Calendar**: Populate holiday array from company/region settings
2. **Custom Dependency Types**: Add Start-to-Start, Finish-to-Finish, Start-to-Finish
3. **Lead/Lag**: Support lead and lag times on dependencies
4. **Resource Leveling**: Balance resource allocation across tasks
5. **What-If Scenarios**: Test schedule/cost changes without committing
6. **ML Risk Prediction**: Train models on historical project data

## Conclusion

The business rules implementation provides a robust, type-safe foundation for enforcing critical project management logic across SteelBuild Pro. All rules are centralized, testable, and consistently applied throughout the application.
