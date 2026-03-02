# Quick Start: Testing Equipment, Cost Codes, and Contracts in Electron

This guide will help you quickly verify that database persistence is working correctly in the Electron desktop application.

## Prerequisites

- Node.js and npm installed
- SteelBuild Pro repository cloned
- Dependencies installed (`npm install`)

## Step 1: Launch Electron Development Mode

Open your terminal in the project root and run:

```bash
npm run electron:dev
```

This will:
1. Build the application
2. Launch the Electron window
3. Connect to the SQLite database at `electron/db/steelbuild.db`

**Wait for the application to fully load** (you should see the dashboard).

## Step 2: Create or Select a Test Project

### Option A: Use Existing Project
1. Navigate to Projects from the sidebar
2. Note the Project ID of any existing project

### Option B: Create New Test Project
1. Click "Projects" in the sidebar
2. Click "New Project"
3. Fill in:
   - Project Number: `TEST-2024-001`
   - Project Name: `Database Test Project`
   - Client: `Test Client`
   - Start Date: Today's date
4. Click "Create Project"
5. Note the Project ID (visible in the URL or project card)

## Step 3: Access the Test Suite

### Method 1: Via Audit Page
1. Click "Audit" in the sidebar
2. Click "Electron Test Suite" button (top-right corner)

### Method 2: Direct Navigation
1. In the address bar, navigate to: `/electron-test`

## Step 4: Run the Tests

1. In the "Test Project ID" field, enter your project ID (e.g., `proj_123abc`)
2. Click "Run Tests" button
3. Watch the tests execute in real-time

**Expected behavior:**
- Tests will turn blue ("Running") as they execute
- Tests will turn green ("Pass") when successful
- The entire suite should complete in 5-10 seconds
- All 15 tests should pass

## Step 5: Verify Results

Check the summary at the top:
- **Total Tests**: 15
- **Passed**: 15 (should be all green)
- **Failed**: 0

Each test shows:
- ✅ Status badge
- Test message
- Details about what was tested
- Execution duration in milliseconds

## Step 6: Manual Verification (Optional)

You can manually verify the data is persisted by:

### Verify Equipment
1. Navigate to Projects → [Your Test Project] → Equipment
2. You should NOT see test equipment (it's cleaned up automatically)
3. Click "Add Equipment" and create a real equipment item
4. Refresh the page or restart Electron
5. Verify the equipment is still there (persistence confirmed)

### Verify Cost Codes
1. Navigate to Projects → [Your Test Project] → Cost Codes
2. You should NOT see test cost codes (cleaned up automatically)
3. Click "New Cost Code" and create a real cost code
4. Refresh the page or restart Electron
5. Verify the cost code is still there (persistence confirmed)

### Verify Contracts
1. Navigate to Projects → [Your Test Project] → Contracts
2. You should NOT see test contracts (cleaned up automatically)
3. Click "New Contract" and create a real contract
4. Refresh the page or restart Electron
5. Verify the contract is still there (persistence confirmed)

## Common Issues and Solutions

### Issue: "Desktop Mode Required" Warning

**Cause**: You're running in web mode (`npm run dev`) instead of Electron mode

**Solution**:
```bash
# Stop the web server (Ctrl+C)
# Start Electron mode
npm run electron:dev
```

### Issue: Test Fails with "Failed to create equipment"

**Possible Causes**:
1. Invalid project ID
2. Database connection issue
3. Missing database tables

**Solutions**:
1. Verify the project ID exists
2. Check Electron console for errors (View → Toggle Developer Tools)
3. Reinitialize the database:
   ```bash
   # Delete the old database
   rm electron/db/steelbuild.db
   # Restart Electron - it will recreate tables
   npm run electron:dev
   ```

### Issue: Tests Never Complete (Stuck on "Running")

**Cause**: JavaScript error or database hang

**Solution**:
1. Open Developer Tools (View → Toggle Developer Tools)
2. Check Console tab for errors
3. Restart Electron application
4. Try running tests again

### Issue: "Project ID required" Error

**Cause**: No project ID entered in the test configuration

**Solution**: Enter a valid project ID in the "Test Project ID" field before clicking "Run Tests"

## Expected Test Results

When all tests pass, you should see:

```
Equipment Persistence
  ✅ Create Equipment - Equipment created successfully (ID: eq_xxxxx) - 150ms
  ✅ Read Equipment - Equipment read successfully (Found 1 equipment items) - 45ms
  ✅ Update Equipment - Equipment updated successfully (Status changed to in-use) - 120ms
  ✅ Delete Equipment - Equipment deleted successfully (Equipment removed from database) - 80ms
  ✅ Equipment Status Changes - Status changes persisted (Tested 4 status transitions) - 450ms

Cost Codes Persistence
  ✅ Create Cost Code - Cost code created successfully (Code: TEST-001, Budget: $10,000) - 130ms
  ✅ Read Cost Code - Cost code read successfully (Found 1 cost codes) - 40ms
  ✅ Update Cost Code - Cost code updated successfully (Actual amount updated to $5,000) - 110ms
  ✅ Delete Cost Code - Cost code deleted successfully (Cost code removed from database) - 75ms
  ✅ Budget Calculations - Budget calculations correct (Budget: $25,000, Actual: $20,000) - 380ms

Contracts Persistence
  ✅ Create Contract - Contract created successfully (Contract: TEST-CONTRACT-001, Value: $500,000) - 140ms
  ✅ Read Contract - Contract read successfully (Found 1 contracts) - 42ms
  ✅ Update Contract - Contract updated successfully (Value updated to $550,000) - 115ms
  ✅ Delete Contract - Contract deleted successfully (Contract removed from database) - 78ms
  ✅ Contract Value Calculations - Contract value calculations correct (Total value: $600,000) - 390ms
```

## What This Confirms

If all tests pass, you've verified that:

✅ **SQLite Database**: Is properly initialized and accessible
✅ **Create Operations**: New records are saved to the database
✅ **Read Operations**: Saved records can be retrieved
✅ **Update Operations**: Changes to records are persisted
✅ **Delete Operations**: Records can be removed completely
✅ **Calculations**: Aggregations (totals, sums) work correctly
✅ **Data Integrity**: Foreign keys and relationships are maintained
✅ **Electron IPC**: Communication between renderer and main process works

## Next Steps

After confirming persistence works:

1. **Test in Production Build**:
   ```bash
   npm run electron:build
   # Test the packaged application
   ```

2. **Test with Real Data**: Create actual projects, equipment, cost codes, and contracts

3. **Test Data Survival**: Close and reopen Electron multiple times to ensure data persists

4. **Test Concurrent Operations**: Open multiple windows and verify data stays synchronized

5. **Backup Testing**: Test the database backup and restore functionality

## Getting Help

If tests continue to fail:

1. Check `electron/db/steelbuild.db` exists
2. Review Electron main process logs
3. Check browser console for errors
4. Verify Node.js and npm versions match requirements
5. Try deleting `node_modules` and running `npm install` again

## Database Location

The SQLite database file is located at:
```
electron/db/steelbuild.db
```

You can inspect it directly using:
```bash
sqlite3 electron/db/steelbuild.db
.tables
.schema equipment
SELECT * FROM equipment LIMIT 5;
```

## Test Cleanup

The test suite automatically cleans up all test data. If you need to manually clean up:

```sql
-- Open database
sqlite3 electron/db/steelbuild.db

-- Delete test equipment
DELETE FROM equipment WHERE name LIKE '%Test%';

-- Delete test cost codes
DELETE FROM cost_codes WHERE code LIKE 'TEST%' OR code LIKE 'CALC%';

-- Delete test contracts
DELETE FROM contracts WHERE contract_number LIKE 'TEST%' OR contract_number LIKE 'VAL%';
```

---

**Congratulations!** If you've completed these steps and all tests pass, your Electron database persistence is working correctly. 🎉
