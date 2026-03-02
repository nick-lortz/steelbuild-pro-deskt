# Business Rules Integration - Implementation Guide

## Overview

This document describes how business rules from `/src/lib/business-rules.ts` have been integrated into the CRUD operations and forms throughout the SteelBuild Pro application.

## Integration Status

### ✅ Completed Integrations

#### 1. Project Management

**File**: `/src/components/projects/project-form-dialog.tsx`

**Business Rules Applied**:
- ✅ **Uniqueness**: Project number validation before create/update
- ✅ **Error Handling**: BusinessRuleError caught and displayed to users

**Implementation**:
```typescript
// In onSubmit handler
await businessRules.uniqueness.validateProjectNumber(
  data.number,
  project?.id
)
```

**User Experience**:
- User attempts to create/update project with duplicate number
- Form submission blocked with user-friendly error message
- Toast notification displays the specific validation error

---

#### 2. RFI Management

**File**: `/src/components/rfis/rfi-form-dialog.tsx`

**Business Rules Applied**:
- ✅ **Uniqueness**: (projectId, rfiNumber) validation
- ✅ **Data Persistence**: useKV for project-scoped storage
- ✅ **Error Handling**: BusinessRuleError caught and displayed

**Implementation**:
```typescript
// Validate RFI number uniqueness within project
await businessRules.uniqueness.validateRFINumber(
  projectId,
  data.number,
  rfi?.id
)

// Store using useKV for persistence
const [rfis, setRfis] = useKV<RFI[]>(`project:${projectId}:rfis`, [])

// Functional updates for data safety
setRfis((current) => [...(current || []), newRFI])
```

**User Experience**:
- User attempts to create RFI with duplicate number in project
- Validation runs before data is saved
- Clear error message if duplicate found
- Success notification on successful creation

---

## Business Rules Reference

### 1. Uniqueness Constraints

#### Project Number Uniqueness
```typescript
businessRules.uniqueness.validateProjectNumber(projectNumber, excludeId?)
```
- Ensures project numbers are globally unique
- Excludes current project when updating
- Throws `DUPLICATE_PROJECT_NUMBER` error if violated

#### RFI Number Uniqueness
```typescript
businessRules.uniqueness.validateRFINumber(projectId, rfiNumber, excludeId?)
```
- Ensures RFI numbers are unique within a project
- Excludes current RFI when updating
- Throws `DUPLICATE_RFI_NUMBER` error if violated

### 2. Authorization & Access Control

#### Check Project Access
```typescript
businessRules.authorization.checkProjectAccess(userId, projectId, isAdmin?)
```
- Verifies user is ProjectMember
- Returns member with role information
- Throws `ACCESS_DENIED` if no access

#### Check Write Access
```typescript
businessRules.authorization.checkWriteAccess({ userId, projectId, isAdmin })
```
- Blocks viewer role from mutations
- Allows member, admin, owner roles
- Throws `INSUFFICIENT_PERMISSIONS` if denied

#### Check Document Access
```typescript
businessRules.authorization.checkDocumentAccess({ userId, projectId }, documentId)
```
- Validates project access first
- Verifies document exists in project
- Ensures backend file access protection

### 3. Scheduling Logic

#### Business Day Calculations
```typescript
businessRules.scheduling.calculateBusinessDays(startDate, endDate, holidays?)
```
- Excludes weekends (Saturday/Sunday)
- Optional holiday exclusion
- Returns count of business days

#### Validate Dependencies
```typescript
businessRules.scheduling.validateDependencies(tasks)
```
- Checks Finish-to-Start (FS) dependencies
- Detects circular dependencies
- Returns validation result with errors array

#### Calculate Critical Path
```typescript
businessRules.scheduling.calculateCriticalPath(tasks)
```
- Identifies tasks with zero slack
- Returns array of critical task IDs
- Use to mark `isCriticalPath` flag

### 4. Financial Calculations

#### Safe Division
```typescript
businessRules.financial.safeDivide(numerator, denominator, defaultValue?)
```
- Returns defaultValue (0) when denominator is zero
- Protects against division by zero errors
- Use for all percentage calculations

#### Calculate Variance
```typescript
businessRules.financial.calculateVariance(budgeted, actual)
```
- Returns dollar variance (budgeted - actual)
- Positive = under budget
- Negative = over budget

#### Calculate Variance Percentage
```typescript
businessRules.financial.calculateVariancePercentage(budgeted, actual)
```
- Returns percentage variance
- Uses safeDivide internally
- Safe for zero budgeted amounts

#### Validate Budget Rollup
```typescript
businessRules.financial.validateBudgetRollup(budgets, costCodes)
```
- Ensures budgets reference valid cost codes
- Validates consistency across rollups
- Returns validation result with warnings

#### Validate Change Order Total
```typescript
businessRules.financial.validateChangeOrderTotal(changeOrder)
```
- Verifies line items sum to total
- Allows 0.01 tolerance for rounding
- Throws `CO_TOTAL_MISMATCH` if invalid

### 5. Drawing Management

#### Validate Drawing Revision
```typescript
businessRules.drawings.validateDrawingRevision(sheetId, revision, existingRevisions)
```
- Prevents duplicate revision numbers
- Ensures only one current revision per sheet
- Throws `DUPLICATE_REVISION` if violated

#### Detect Drawing Conflicts
```typescript
businessRules.drawings.detectDrawingConflicts(sheets)
```
- Identifies conflicting revisions
- Detects large revision date gaps
- Returns array of conflicts with reasons

#### Flag Scope Changes
```typescript
businessRules.drawings.flagScopeChanges(oldRevision, newRevision)
```
- Detects scope keywords in descriptions
- Returns true if scope change detected
- Keywords: added, removed, relocated, revised, deleted, new, modified

### 6. PMA (Project Management Assistant)

#### Detect Schedule Risks
```typescript
businessRules.pma.detectScheduleRisks(tasks)
```
- Identifies critical path tasks
- Finds overdue tasks
- Detects at-risk tasks (<7 days, <50% complete)
- Returns risk summary with top risks

#### Detect Cost Risks
```typescript
businessRules.pma.detectCostRisks(budgets)
```
- Finds over-budget cost codes
- Calculates actual + committed vs budgeted
- Returns cost risk summary

#### Detect RFI Aging Risks
```typescript
businessRules.pma.detectRFIAgingRisks(rfis)
```
- Identifies aging RFIs (>14 days)
- Finds overdue RFIs (past due date)
- Returns RFI risk summary

#### Generate Daily Brief
```typescript
businessRules.pma.generateDailyBrief(projectId)
```
- AI-generated project status summary
- Covers schedule, cost, RFI status
- Includes top risks and recommendations

---

## Integration Patterns

### Pattern 1: Form Validation (Projects, RFIs)

```typescript
const onSubmit = async (data: any) => {
  setLoading(true)
  try {
    // 1. Validate business rules BEFORE saving
    await businessRules.uniqueness.validateProjectNumber(
      data.number,
      existingId
    )

    // 2. Perform save operation
    if (existing) {
      await update(data)
    } else {
      await create(data)
    }

    // 3. Show success
    toast.success('Saved successfully')
    onSuccess()
  } catch (error) {
    // 4. Handle business rule errors
    if (error instanceof BusinessRuleError) {
      toast.error(error.message)
    } else {
      toast.error('Failed to save')
    }
    console.error(error)
  } finally {
    setLoading(false)
  }
}
```

### Pattern 2: Access Control (Queries and Mutations)

```typescript
// In query handler
async function getRFIs(projectId: string, userId: string) {
  // 1. Check read access
  await businessRules.authorization.checkReadAccess({ userId, projectId })

  // 2. Fetch data
  const rfis = await spark.kv.get<RFI[]>(`project:${projectId}:rfis`)

  // 3. Return
  return rfis || []
}

// In mutation handler
async function updateRFI(projectId: string, rfiId: string, updates: Partial<RFI>, userId: string) {
  // 1. Check write access
  await businessRules.authorization.checkWriteAccess({ userId, projectId })

  // 2. Validate uniqueness if number changed
  if (updates.number) {
    await businessRules.uniqueness.validateRFINumber(projectId, updates.number, rfiId)
  }

  // 3. Perform update
  const rfis = await spark.kv.get<RFI[]>(`project:${projectId}:rfis`)
  const updated = rfis.map(r => r.id === rfiId ? { ...r, ...updates } : r)
  await spark.kv.set(`project:${projectId}:rfis`, updated)

  // 4. Return
  return updated.find(r => r.id === rfiId)
}
```

### Pattern 3: Financial Reports (Safe Calculations)

```typescript
async function generateFinancialReport(projectId: string) {
  const budgets = await getBudgets(projectId)

  const metrics = budgets.map(budget => ({
    costCode: budget.costCodeId,
    budgeted: budget.budgetedAmount,
    actual: budget.actualAmount,

    // Safe calculations
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

  return metrics
}
```

### Pattern 4: Schedule Computation

```typescript
async function recomputeSchedule(projectId: string) {
  // 1. Load tasks
  const tasks = await getTasks(projectId)

  // 2. Validate dependencies
  const depResult = businessRules.scheduling.validateDependencies(tasks)
  if (!depResult.valid) {
    throw new Error(`Invalid dependencies: ${depResult.errors.join(', ')}`)
  }

  // 3. Calculate critical path
  const criticalTaskIds = businessRules.scheduling.calculateCriticalPath(tasks)

  // 4. Update task flags
  for (const task of tasks) {
    task.isCriticalPath = criticalTaskIds.includes(task.id)
  }

  // 5. Save updated tasks
  await saveTasks(projectId, tasks)

  return { criticalTaskCount: criticalTaskIds.length }
}
```

---

## Next Steps for Additional Integrations

### High Priority

1. **Schedule Page** - Integrate dependency validation and critical path calculation
2. **Financials Page** - Use safe division and variance calculations everywhere
3. **Change Orders Page** - Validate line item totals match change order total
4. **Drawings Page** - Validate revisions and detect conflicts
5. **Budget Forms** - Validate budget rollup consistency

### Medium Priority

6. **Task Forms** - Validate task dates and dependencies on create/update
7. **Document Access** - Implement document access validation before serving files
8. **Work Package Forms** - Integrate business day calculations for scheduling
9. **Labor Entry Forms** - Use safe division for utilization calculations
10. **Equipment Booking** - Check availability using business day calculations

### Low Priority (Future Enhancements)

11. **PMA Dashboard** - Display daily brief, risk detection, and recommendations
12. **Audit System** - Log all business rule violations for compliance
13. **Notification System** - Alert users of aging RFIs and approaching due dates
14. **Reporting** - Use business rules for consistent financial reporting
15. **API Layer** - Enforce business rules at API boundaries

---

## Testing Business Rules

### Unit Test Example

```typescript
import { businessRules, BusinessRuleError } from '@/lib/business-rules'

describe('RFI Number Uniqueness', () => {
  beforeEach(async () => {
    // Setup test data
    const testRFIs: RFI[] = [
      {
        id: '1',
        projectId: 'proj-1',
        number: 'RFI-001',
        // ... other fields
      }
    ]
    await spark.kv.set('project:proj-1:rfis', testRFIs)
  })

  it('should reject duplicate RFI number in same project', async () => {
    await expect(
      businessRules.uniqueness.validateRFINumber('proj-1', 'RFI-001')
    ).rejects.toThrow(BusinessRuleError)
  })

  it('should allow same RFI number in different project', async () => {
    await expect(
      businessRules.uniqueness.validateRFINumber('proj-2', 'RFI-001')
    ).resolves.not.toThrow()
  })

  it('should allow updating existing RFI with same number', async () => {
    await expect(
      businessRules.uniqueness.validateRFINumber('proj-1', 'RFI-001', '1')
    ).resolves.not.toThrow()
  })
})
```

---

## Error Codes Reference

| Error Code | Message | Resolution |
|------------|---------|------------|
| `DUPLICATE_PROJECT_NUMBER` | Project number already exists | Choose a different project number |
| `DUPLICATE_RFI_NUMBER` | RFI number already exists in project | Choose a different RFI number for this project |
| `PROJECT_NOT_FOUND` | Project not found | Verify project ID is correct |
| `ACCESS_DENIED` | User does not have access to project | Request project access from owner |
| `INSUFFICIENT_PERMISSIONS` | Operation requires higher permissions | Contact project admin |
| `DOCUMENT_NOT_FOUND` | Document not found or access denied | Verify document exists and user has access |
| `INVALID_START_DATE` | Start date is invalid | Provide valid start date |
| `INVALID_END_DATE` | End date is invalid | Provide valid end date |
| `INVALID_DATE_RANGE` | Start date must be before end date | Adjust date range |
| `CO_TOTAL_MISMATCH` | Line items don't match change order total | Verify line item calculations |
| `DUPLICATE_REVISION` | Revision number already exists for sheet | Use next revision number |
| `MULTIPLE_CURRENT_REVISIONS` | Only one revision can be current | Mark other revisions as not current |

---

## Performance Considerations

1. **Caching**: Business rule results can be cached with appropriate TTLs
2. **Batch Operations**: Run validations once for batch updates
3. **Lazy Loading**: Load entities only when needed for validation
4. **Debouncing**: Debounce real-time validations in forms
5. **Async Validation**: Use async validation for uniqueness checks

---

## Conclusion

The business rules system provides a centralized, testable, and consistent way to enforce critical project management logic across SteelBuild Pro. All forms and CRUD operations should integrate these rules to ensure data integrity, security, and operational correctness.

For questions or to report issues with business rule integrations, contact the development team.
