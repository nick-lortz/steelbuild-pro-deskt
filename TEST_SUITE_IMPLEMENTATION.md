# Automated Test Suite Implementation

## Overview

This document describes the comprehensive automated test suite for SteelBuild Pro's persistence layer, with special focus on Drawing Sets and RFI functionality as requested.

## Test Suite Location

**File:** `/src/pages/audit/electron-test-suite.tsx`

**Navigation:** Open SteelBuild Pro → Navigate to "Audit" → "Test Suite"

## Test Coverage

The automated test suite now covers **6 major persistence modules** with **30 total tests**:

### 1. RFI Persistence (5 tests)
Tests the Request for Information (RFI) workflow and database persistence:

- **Create RFI**: Validates RFI creation with subject, question, status, and priority
- **Read RFI**: Verifies RFI retrieval from database by project ID
- **Update RFI**: Tests status changes and response updates
- **Delete RFI**: Confirms soft-delete or hard-delete functionality
- **RFI Auto-Numbering**: Validates sequential numbering per project (critical business rule)

### 2. Drawing Sets Persistence (5 tests)
Tests the Drawing Set entity and status workflow:

- **Create Drawing Set**: Creates a set with name, discipline, and initial status
- **Read Drawing Set**: Retrieves all sets for a project
- **Update Drawing Set Status**: Tests status transitions
- **Delete Drawing Set**: Validates cascade deletion of dependent sheets
- **Drawing Set Status Workflow**: Tests all 5 status gates: IFA → BFA → OFS → BFS → FFF

### 3. Drawing Sheets Persistence (5 tests)
Tests individual sheet management within sets:

- **Create Drawing Sheet**: Creates a sheet within a parent set
- **Read Drawing Sheets**: Retrieves all sheets for a specific set
- **Update Sheet Status**: Changes individual sheet status independently
- **Delete Drawing Sheet**: Removes sheet without affecting parent set
- **Sheet Status Gates**: Tests all status transitions: IFA, BFA, OFS, BFS, FFF

### 4. Equipment Persistence (5 tests)
Tests equipment fleet management:

- **Create Equipment**: Adds equipment with name, type, asset tag, status
- **Read Equipment**: Lists all equipment for a project
- **Update Equipment**: Modifies equipment properties and assignment
- **Delete Equipment**: Removes equipment from fleet
- **Equipment Status Changes**: Tests status transitions (available, in-use, maintenance, retired)

### 5. Cost Codes Persistence (5 tests)
Tests financial cost code tracking:

- **Create Cost Code**: Creates cost code with budget and actual amounts
- **Read Cost Code**: Retrieves cost codes by project
- **Update Cost Code**: Updates budget/actual amounts
- **Delete Cost Code**: Removes cost code
- **Budget Calculations**: Validates aggregate budget vs. actual rollup calculations

### 6. Contracts Persistence (5 tests)
Tests contract management:

- **Create Contract**: Creates contract with number, type, value, dates
- **Read Contract**: Lists contracts for a project
- **Update Contract**: Updates contract value and details
- **Delete Contract**: Removes contract
- **Contract Value Calculations**: Tests total contract value aggregation

## Status Gate Workflow (Drawing Sets & Sheets)

The test suite validates the steel fabrication status workflow:

```
IFA  →  BFA  →  OFS  →  BFS  →  FFF
```

- **IFA** (Issued for Approval): Initial drawing submission
- **BFA** (Build for Approval): Approved for fabrication planning
- **OFS** (Open for Shop): Released to shop floor
- **BFS** (Build for Shop): Active fabrication
- **FFF** (Final for Fabrication): Final approved version

Each test ensures:
1. Status can transition to any valid state
2. Updates persist correctly to SQLite database
3. Status is retrievable and matches the last update

## Running the Test Suite

### Prerequisites
- Must be running in Electron desktop mode
- SQLite database must be initialized
- Valid test project ID required

### Steps
1. Launch SteelBuild Pro in Electron:
   ```bash
   npm run electron:dev
   ```

2. Navigate to **Audit → Test Suite**

3. Enter a **Test Project ID** (can be an existing project or test project ID)

4. Click **"Run Tests"**

5. Monitor progress in real-time:
   - 🔵 Blue badge = Running
   - ✅ Green badge = Pass
   - ❌ Red badge = Fail
   - ⏱️ Gray badge = Pending

### Test Results
Each test displays:
- **Status Badge**: Visual indicator of test outcome
- **Message**: Human-readable result description
- **Details**: Technical information about the test
- **Duration**: Execution time in milliseconds

### Summary Metrics
At the top of the test configuration card:
- **Total Tests**: 30
- **Passed**: Count of successful tests
- **Failed**: Count of failed tests

## Test Implementation Details

### Test Architecture
Each test suite follows this pattern:

```typescript
const runTestSuite = async (projectId: string) => {
  // 1. Create test entity
  const createResult = await db.createEntity(...)
  
  // 2. Verify creation
  const readResult = await db.listEntities(projectId)
  const found = readResult.data?.find(...)
  
  // 3. Update entity
  const updateResult = await db.updateEntity(id, newData)
  
  // 4. Verify update persisted
  const verifyResult = await db.listEntities(projectId)
  
  // 5. Delete entity
  const deleteResult = await db.deleteEntity(id)
  
  // 6. Verify deletion
  const finalCheck = await db.listEntities(projectId)
}
```

### Database Operations Tested
- **Create**: Insert new records with validation
- **Read**: Query by project_id with proper filtering
- **Update**: Modify existing records and verify persistence
- **Delete**: Remove records (soft or hard delete)
- **Aggregations**: Sum, count, and calculated fields

### Error Handling
Each test includes try-catch blocks that:
- Capture error messages
- Display technical details
- Mark test as failed
- Clean up test data where possible

## Key Business Rules Validated

### RFI Auto-Numbering
- RFIs must be numbered sequentially per project
- Each project has independent numbering: RFI #1, #2, #3...
- Test creates 2 RFIs and validates `rfi_number` increments by 1

### Drawing Set Cascade
- Deleting a Drawing Set should handle dependent sheets
- Test validates orphan prevention or cascade delete

### Cost Code Totals
- Budget and actual amounts must aggregate correctly
- Test creates multiple cost codes and validates dashboard totals

### Contract Value Aggregation
- Multiple contracts should sum correctly
- Test creates contracts with different values and validates total

## Integration with Electron IPC

The test suite uses the `window.SBP.db` API exposed via Electron IPC:

```typescript
const db = window.SBP!.db

// All operations are async and return DBResult<T>
interface DBResult<T> {
  success: boolean
  data?: T
  error?: string
}
```

### Tested IPC Channels
- `db.createRFI` / `db.listRFIs` / `db.updateRFI` / `db.deleteRFI`
- `db.createDrawingSet` / `db.listDrawingSets` / `db.updateDrawingSetStatus` / `db.deleteDrawingSet`
- `db.createDrawingSheet` / `db.listDrawingSheets` / `db.updateDrawingSheetStatus` / `db.deleteDrawingSheet`
- `db.createEquipment` / `db.listEquipment` / `db.updateEquipment` / `db.deleteEquipment`
- `db.createCostCode` / `db.listCostCodes` / `db.updateCostCode` / `db.deleteCostCode`
- `db.createContract` / `db.listContracts` / `db.updateContract` / `db.deleteContract`

## Troubleshooting

### "Desktop Mode Required" Error
- **Cause**: Running in browser instead of Electron
- **Solution**: Start app with `npm run electron:dev`

### "Please enter a test project ID" Error
- **Cause**: No project ID provided
- **Solution**: Enter any valid project UUID in the input field

### Tests Failing
- Check SQLite database is initialized: `npm run electron:init-db`
- Verify Electron IPC channels are registered
- Check `electron/database.cjs` for SQL query errors
- Review console logs for detailed error messages

### Cleanup After Tests
The test suite attempts to clean up test data, but some records may persist:
- RFIs with subjects starting with "Test RFI"
- Drawing sets with names like "Test Drawing Set", "Workflow Test Set"
- Equipment with names like "Test Crane", "Status Test Equipment"
- Cost codes with codes like "TEST-001", "CALC-001"
- Contracts with numbers like "TEST-CONTRACT-001"

You can manually delete these from the respective management pages.

## Future Enhancements

Potential additions to the test suite:

1. **Performance Tests**: Measure query performance with large datasets
2. **Concurrency Tests**: Test simultaneous operations
3. **Validation Tests**: Test constraint violations (unique keys, required fields)
4. **Authorization Tests**: Verify project-level access control
5. **Migration Tests**: Test database schema migrations
6. **Export/Import Tests**: Test data export and re-import integrity
7. **PMA Integration**: Test PMA insight generation triggers

## Continuous Integration

To integrate with CI/CD:

1. Create headless Electron test runner
2. Export test results to JSON
3. Generate JUnit-compatible report
4. Add to GitHub Actions workflow

Example:
```yaml
- name: Run Test Suite
  run: npm run electron:test
- name: Upload Results
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: test-results.json
```

## Related Documentation

- **Electron Implementation**: `ELECTRON_IMPLEMENTATION_GUIDE.md`
- **Database Schema**: `DATABASE_IMPLEMENTATION.md`
- **Drawing Workflow**: `DRAWING_FILE_UPLOAD_IMPLEMENTATION.md`
- **Business Rules**: `BUSINESS_RULES_INTEGRATION.md`

## Success Criteria

The test suite is successful when:
- ✅ All 30 tests pass in under 30 seconds
- ✅ No database connection errors
- ✅ All CRUD operations persist correctly
- ✅ Status workflows transition through all gates
- ✅ Business rules (auto-numbering, aggregations) validate
- ✅ No test data remains after cleanup

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Maintainer**: SteelBuild Pro Development Team
