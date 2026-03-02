# Database Spine & PMA - Quick Verification Guide

## Overview
This guide helps you verify that the database spine, useDatabase hook, and PMA watchdog are all functioning correctly.

## Prerequisites
- Electron desktop app running (`npm run desktop:dev`)
- At least one project created in the system

## Verification Checklist

### ✅ 1. Database Relational Integrity

#### Test: Project Number Uniqueness
```
1. Create a new project with project_number "P-2024-001"
2. Try to create another project with same project_number
3. Expected: Error message "Project number already exists"
4. Status: [ ] PASS [ ] FAIL
```

#### Test: RFI Auto-Numbering
```
1. Navigate to a project's RFI page
2. Create first RFI (don't specify rfi_number)
3. Expected: RFI automatically assigned number 1
4. Create second RFI
5. Expected: RFI automatically assigned number 2
6. Status: [ ] PASS [ ] FAIL
```

#### Test: Cost Code Uniqueness
```
1. Navigate to project's Cost Codes page
2. Create cost code with code "050-STEEL"
3. Try to create another cost code with same code in same project
4. Expected: Error "Cost code '050-STEEL' already exists in this project"
5. Create cost code "050-STEEL" in DIFFERENT project
6. Expected: Succeeds (uniqueness is per-project)
7. Status: [ ] PASS [ ] FAIL
```

#### Test: Drawing Sheet Revision Uniqueness
```
1. Create drawing set "Structural - Phase 1"
2. Add sheet "S-101" with revision "A"
3. Try to add another sheet "S-101" with revision "A" to same set
4. Expected: Error about duplicate sheet/revision
5. Add sheet "S-101" with revision "B" to same set
6. Expected: Succeeds (different revision)
7. Status: [ ] PASS [ ] FAIL
```

### ✅ 2. Dashboard Counter Verification

#### Test: Live RFI Counter
```
1. Note current RFI count on dashboard
2. Create new RFI in any project
3. Return to dashboard
4. Expected: RFI count incremented by 1
5. Delete the RFI
6. Expected: RFI count decremented by 1
7. Status: [ ] PASS [ ] FAIL
```

#### Test: Cost Code Counter & Totals
```
1. Note current Cost Code count and budget totals
2. Create cost code with:
   - Code: "TEST-001"
   - Budget: $10,000
   - Actual: $2,500
3. Return to dashboard
4. Expected: 
   - Cost code count +1
   - Total budget increased by $10,000
   - Total actual increased by $2,500
5. Status: [ ] PASS [ ] FAIL
```

#### Test: Equipment Counter
```
1. Note current Equipment count
2. Add new equipment item
3. Return to dashboard
4. Expected: Equipment count +1
5. Status: [ ] PASS [ ] FAIL
```

### ✅ 3. Equipment Page Crash Protection

#### Test: Empty State
```
1. Create new project with zero equipment
2. Navigate to Equipment page
3. Expected: See "No Equipment Found" message with "Add First Unit" button
4. NOT expected: Blank page, error, or crash
5. Status: [ ] PASS [ ] FAIL
```

#### Test: Equipment CRUD
```
1. Click "Add First Unit" or "+ New Equipment"
2. Fill form:
   - Name: "Crane #5"
   - Type: "Mobile Crane"
   - Status: "Available"
3. Save
4. Expected: Equipment appears in list immediately
5. Edit the equipment
6. Expected: Changes persist after save
7. Delete the equipment
8. Expected: Equipment removed from list
9. Status: [ ] PASS [ ] FAIL
```

### ✅ 4. PMA Watchdog Heuristics

#### Test: Stale RFI Detection
```
SETUP:
1. Create RFI with created_at date 4 days ago
   (Manually edit database or wait 4 days)
   SQL: UPDATE rfis SET created_at = datetime('now', '-4 days') WHERE id = ?

TEST:
2. Navigate to PMA Daily Brief page
3. Click "Generate Insights" or refresh
4. Expected: Insight appears:
   - Type: "Stale RFI"
   - Title: "RFI #X is 4 days old"
   - Severity: "medium"
   - Deep link to RFI record works
5. Status: [ ] PASS [ ] FAIL
```

**Faster Test (Direct Database)**:
```sql
-- In SQLite console or DB viewer:
INSERT INTO rfis (
  id, project_id, rfi_number, subject, question, 
  status, created_at, updated_at
) VALUES (
  'test-rfi-001', 
  'your-project-id', 
  999, 
  'Test Stale RFI', 
  'This is a test RFI created 5 days ago',
  'open',
  datetime('now', '-5 days'),
  datetime('now')
);
```

#### Test: Schedule Slippage Detection
```
SETUP:
1. Create task with:
   - Name: "Test Task"
   - Baseline End Date: 2024-01-01
   - Current End Date: 2024-01-10 (9 days later)
   - Status: "in-progress"

TEST:
2. Navigate to PMA Daily Brief
3. Generate insights
4. Expected: Insight appears:
   - Type: "Schedule Slippage"
   - Title: "Task 'Test Task' is 9 days behind baseline"
   - Severity: "high" (>7 days)
   - Deep link to schedule works
5. Status: [ ] PASS [ ] FAIL
```

#### Test: Budget Overage Detection
```
SETUP:
1. Create or edit cost code:
   - Code: "TEST-OVER"
   - Budget: $10,000
   - Actual: $12,500 (25% over)

TEST:
2. Navigate to PMA Daily Brief
3. Generate insights
4. Expected: Insight appears:
   - Type: "Budget Overage"
   - Title: "Cost Code TEST-OVER is over budget by 25%"
   - Severity: "high" (>20%)
   - Shows overage amount: $2,500
   - Deep link to cost code works
5. Status: [ ] PASS [ ] FAIL
```

#### Test: Early Budget Variance
```
SETUP:
1. Create cost code linked to task:
   - Code: "TEST-VAR"
   - Budget: $20,000
   - Actual: $19,000 (95% spent)
   - Linked task percent_complete: 50%

TEST:
2. Navigate to PMA Daily Brief
3. Generate insights
4. Expected: Insight appears:
   - Type: "Early Budget Variance"
   - Title: "Cost Code TEST-VAR is 95% spent but only 50% complete"
   - Severity: "high"
   - Deep link works
5. Status: [ ] PASS [ ] FAIL
```

### ✅ 5. PMA Actions (Resolve/Dismiss)

#### Test: Resolve Insight
```
1. Generate insights (ensure at least one exists)
2. Click "Resolve" on any insight
3. Expected: 
   - Insight status changes to "resolved"
   - resolved_at timestamp populated
   - Insight no longer shows in "Open" filter
4. Status: [ ] PASS [ ] FAIL
```

#### Test: Dismiss Insight
```
1. Generate insights
2. Click "Dismiss" on any insight
3. Enter reason: "Acceptable variance approved by client"
4. Expected:
   - Insight status changes to "dismissed"
   - dismissed_at timestamp populated
   - Dismiss reason stored
   - Insight no longer shows in "Open" filter
5. Status: [ ] PASS [ ] FAIL
```

### ✅ 6. Cascade Delete Protection

#### Test: Project Cascade
```
1. Create test project "Delete Test"
2. Add to project:
   - 2 RFIs
   - 3 Cost Codes
   - 1 Equipment item
   - 1 Drawing Set
3. Delete the project
4. Verify in database:
   - All RFIs deleted (or soft-deleted with deleted_at)
   - All Cost Codes deleted
   - All Equipment deleted
   - All Drawing Sets and Sheets deleted
5. Status: [ ] PASS [ ] FAIL
```

#### Test: Drawing Set Cascade
```
1. Create drawing set with 3 sheets
2. Delete the drawing set
3. Expected: All 3 sheets also deleted
4. Status: [ ] PASS [ ] FAIL
```

### ✅ 7. Deep Links Verification

#### Test: RFI Deep Link
```
1. Generate PMA insight for aging RFI
2. Click the deep link in insight
3. Expected: Navigate to RFI page with specific RFI highlighted or selected
4. Status: [ ] PASS [ ] FAIL
```

#### Test: Cost Code Deep Link
```
1. Generate budget overage insight
2. Click deep link
3. Expected: Navigate to Cost Codes page with specific code highlighted
4. Status: [ ] PASS [ ] FAIL
```

#### Test: Schedule Deep Link
```
1. Generate schedule slippage insight
2. Click deep link
3. Expected: Navigate to Schedule page with specific task selected
4. Status: [ ] PASS [ ] FAIL
```

## Quick SQL Verification Queries

### Check RFI Uniqueness Constraint
```sql
SELECT project_id, rfi_number, COUNT(*) as count
FROM rfis
WHERE deleted_at IS NULL
GROUP BY project_id, rfi_number
HAVING count > 1;

-- Expected: No results (no duplicates)
```

### Check Cost Code Uniqueness
```sql
SELECT project_id, code, COUNT(*) as count
FROM cost_codes
WHERE deleted_at IS NULL
GROUP BY project_id, code
HAVING count > 1;

-- Expected: No results
```

### Verify Foreign Key Constraints
```sql
-- This should fail (no parent project):
INSERT INTO rfis (id, project_id, rfi_number, subject, question)
VALUES ('test', 'nonexistent-project-id', 1, 'Test', 'Test');

-- Expected: Foreign key constraint error
```

### Check PMA Insights Generation
```sql
-- Manually verify stale RFI query:
SELECT * FROM rfis 
WHERE status != 'closed' 
  AND deleted_at IS NULL
  AND julianday('now') - julianday(created_at) > 3;

-- These RFIs should appear as PMA insights
```

### Verify Cascade Delete
```sql
-- Before deleting project, count children:
SELECT 
  (SELECT COUNT(*) FROM rfis WHERE project_id = 'test-project-id') as rfi_count,
  (SELECT COUNT(*) FROM cost_codes WHERE project_id = 'test-project-id') as cc_count,
  (SELECT COUNT(*) FROM equipment WHERE project_id = 'test-project-id') as eq_count;

-- Delete project:
DELETE FROM projects WHERE id = 'test-project-id';

-- Verify counts now zero:
SELECT 
  (SELECT COUNT(*) FROM rfis WHERE project_id = 'test-project-id') as rfi_count,
  (SELECT COUNT(*) FROM cost_codes WHERE project_id = 'test-project-id') as cc_count,
  (SELECT COUNT(*) FROM equipment WHERE project_id = 'test-project-id') as eq_count;

-- Expected: All zeros
```

## Performance Verification

### Check Index Usage
```sql
-- Verify indexes exist:
SELECT name, sql FROM sqlite_master 
WHERE type = 'index' AND tbl_name IN ('rfis', 'cost_codes', 'drawing_sets', 'drawing_sheets');

-- Expected indexes:
-- idx_rfis_project
-- idx_rfis_status
-- idx_rfis_created
-- idx_cost_codes_project
-- idx_cost_codes_code
-- idx_drawing_sets_project
-- idx_drawing_sets_status
-- idx_drawing_sheets_set
-- idx_drawing_sheets_status
```

### Query Performance Test
```sql
-- Test RFI lookup by project (should use index):
EXPLAIN QUERY PLAN
SELECT * FROM rfis WHERE project_id = 'test' AND deleted_at IS NULL;

-- Expected: "SEARCH TABLE rfis USING INDEX idx_rfis_project"
```

## Troubleshooting

### If Dashboard Counters Don't Update
1. Check if running in desktop mode: `window.SBP?.db` should exist
2. Verify IPC handlers registered in electron/main.cjs
3. Check browser console for IPC errors
4. Verify useDashboardCounts hook is being called with valid projectId

### If PMA Insights Don't Generate
1. Verify data exists that meets heuristic criteria
2. Check electron console for SQL errors
3. Verify generatePMAInsights IPC handler is registered
4. Test direct SQL queries in DB viewer

### If Equipment Page Crashes
1. Check for null/undefined checks before .map()
2. Verify useEquipment hook returns loading/error states
3. Check for empty array handling
4. Verify ErrorBoundary is in place

### If Uniqueness Constraints Don't Fire
1. Verify constraint exists: `PRAGMA table_info(rfis);`
2. Check if using soft delete (deleted_at) - may need application-level check
3. Verify IPC handler returns error to UI
4. Check for try/catch blocks swallowing errors

## Success Criteria

All tests pass when:
- ✅ No duplicate project numbers possible
- ✅ RFI auto-numbering works per project
- ✅ Cost code uniqueness enforced per project
- ✅ Drawing sheet/revision uniqueness enforced
- ✅ Dashboard counters update instantly after CRUD
- ✅ Equipment page never crashes on empty data
- ✅ PMA generates insights for all 4 heuristics
- ✅ Deep links navigate to correct records
- ✅ Resolve/dismiss workflows update status
- ✅ Cascade deletes work without orphaned records

---

## Summary Report Template

After completing verification:

```
SteelBuild Pro - Database Spine Verification Report
Date: ___________
Tester: ___________

Database Integrity:        [ ] PASS [ ] FAIL
Dashboard Counters:        [ ] PASS [ ] FAIL
Equipment Page Guards:     [ ] PASS [ ] FAIL
PMA Stale RFI Heuristic:  [ ] PASS [ ] FAIL
PMA Schedule Slippage:     [ ] PASS [ ] FAIL
PMA Budget Overage:        [ ] PASS [ ] FAIL
Deep Links:                [ ] PASS [ ] FAIL
Resolve/Dismiss Actions:   [ ] PASS [ ] FAIL
Cascade Deletes:           [ ] PASS [ ] FAIL

Notes:
_____________________________________________
_____________________________________________
_____________________________________________

Overall Status: [ ] READY FOR PRODUCTION [ ] NEEDS FIXES
```

---

**The database spine and PMA watchdog are production-ready when all verification tests pass.**
