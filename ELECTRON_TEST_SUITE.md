# Electron Database Test Suite

## Overview

The Electron Database Test Suite is a comprehensive testing tool that validates the persistence layer of SteelBuild Pro. It ensures that Equipment, Cost Codes, and Contracts data is properly saved, retrieved, updated, and deleted in the SQLite database running in the Electron environment.

## Accessing the Test Suite

### From the Application

1. **Via Audit Dashboard**: Navigate to the Audit page and click the "Electron Test Suite" button in the top-right corner.
2. **Direct URL**: Navigate to `/electron-test` in the application.

### Prerequisites

- **Electron Desktop Mode**: The test suite only works when running in Electron desktop mode
- **Valid Project ID**: You need an existing project ID to run the tests against

## Running in Electron

To test the application in Electron mode:

```bash
# Start the Electron development environment
npm run electron:dev
```

This will launch the application in an Electron window with full SQLite database access.

## Test Suites

### 1. Equipment Persistence Tests

Tests the full CRUD cycle for equipment resources:

- **Create Equipment**: Creates a test crane with all required fields
- **Read Equipment**: Verifies the equipment can be retrieved from the database
- **Update Equipment**: Changes equipment status and verifies persistence
- **Delete Equipment**: Removes equipment and verifies deletion
- **Equipment Status Changes**: Tests all status transitions (available → in-use → maintenance → retired)

### 2. Cost Codes Persistence Tests

Tests financial tracking and cost code management:

- **Create Cost Code**: Creates a test cost code with budget allocation
- **Read Cost Code**: Verifies the cost code can be retrieved
- **Update Cost Code**: Updates actual costs and verifies persistence
- **Delete Cost Code**: Removes cost code and verifies deletion
- **Budget Calculations**: Validates that total budget and actual amounts are calculated correctly across multiple cost codes

### 3. Contracts Persistence Tests

Tests contract management and value tracking:

- **Create Contract**: Creates a test contract with all required fields
- **Read Contract**: Verifies the contract can be retrieved
- **Update Contract**: Changes contract value and verifies persistence
- **Delete Contract**: Removes contract and verifies deletion
- **Contract Value Calculations**: Validates that contract values are totaled correctly

## Using the Test Suite

### Step 1: Enter Test Project ID

In the "Test Configuration" section, enter a valid project ID. You can:
- Use an existing project from your projects list
- Create a new test project specifically for testing

### Step 2: Run Tests

Click the "Run Tests" button to execute the full test suite. The suite will:
1. Run all Equipment tests sequentially
2. Run all Cost Code tests sequentially
3. Run all Contract tests sequentially

Each test creates temporary data, validates it, and cleans up after itself.

### Step 3: Review Results

Each test displays:
- **Status Badge**: Pass (green), Fail (red), Running (blue), or Pending (gray)
- **Message**: Brief description of the test result
- **Details**: Additional information about what was tested
- **Duration**: Time taken to execute the test in milliseconds

### Interpreting Results

**✅ Pass**: The test completed successfully and all assertions passed
**❌ Fail**: The test encountered an error or assertion failure
**⏰ Running**: The test is currently executing
**⏸ Pending**: The test has not started yet

## What Each Test Validates

### Data Persistence
- Data written to SQLite is immediately available on read
- Updates modify existing records correctly
- Deletes remove records completely

### Data Integrity
- Required fields are enforced
- Foreign key relationships (project_id) are maintained
- Status fields accept valid values

### Calculations
- Budget totals are calculated correctly
- Actual vs. budget comparisons work
- Contract value summations are accurate

### Error Handling
- Invalid data is rejected
- Missing required fields trigger errors
- Non-existent records return appropriate errors

## Troubleshooting

### "Desktop Mode Required" Error
**Cause**: The application is running in web mode, not Electron
**Solution**: Launch with `npm run electron:dev` instead of `npm run dev`

### "Please enter a test project ID" Error
**Cause**: No project ID was provided
**Solution**: Enter a valid project ID in the configuration field

### "Failed to create [entity]" Errors
**Possible Causes**:
1. Database connection issues
2. Missing required fields
3. Permission issues with SQLite database file

**Solutions**:
- Check the Electron console for detailed error messages
- Verify the database file exists in `electron/db/steelbuild.db`
- Ensure you have write permissions to the database directory

### Tests Fail After Passing Previously
**Possible Causes**:
1. Database corruption
2. Stale data from previous test runs
3. Schema changes

**Solutions**:
- Delete the SQLite database file and reinitialize
- Restart the Electron application
- Check for console errors indicating schema mismatches

## Test Data Cleanup

The test suite automatically cleans up test data after each test. Test entities are created with identifiable names:
- Equipment: `Test Crane TC-001`, `Status Test Equipment`
- Cost Codes: `TEST-001`, `CALC-001`, `CALC-002`
- Contracts: `TEST-CONTRACT-001`, `VAL-001`, `VAL-002`

If tests fail mid-execution, some test data may remain in the database. You can manually delete these records using the respective pages in the application.

## Performance Benchmarks

Expected execution times (on standard hardware):

| Test Suite | Expected Duration |
|-----------|------------------|
| Equipment Persistence | 1.5 - 2.5 seconds |
| Cost Codes Persistence | 1.5 - 2.5 seconds |
| Contracts Persistence | 1.5 - 2.5 seconds |
| **Total Suite** | **4.5 - 7.5 seconds** |

Significantly longer times may indicate:
- Database performance issues
- I/O bottlenecks
- System resource constraints

## Integration with CI/CD

The test suite can be automated in CI/CD pipelines:

```bash
# Example CI script
npm run electron:build
npm run electron:test -- --project-id=test-project-123
```

## Database Verification

After running tests, you can manually verify the database state:

```bash
# Open the SQLite database
sqlite3 electron/db/steelbuild.db

# Check equipment table
SELECT * FROM equipment WHERE project_id = 'your-test-project-id';

# Check cost codes table
SELECT * FROM cost_codes WHERE project_id = 'your-test-project-id';

# Check contracts table
SELECT * FROM contracts WHERE project_id = 'your-test-project-id';
```

All test data should be cleaned up, leaving no test entities.

## Extending the Test Suite

To add additional tests:

1. Add a new test suite to the `testSuites` array in `electron-test-suite.tsx`
2. Create a test runner function (e.g., `runNewEntityTests`)
3. Implement CRUD operations for the new entity
4. Call the runner in the `runAllTests` function

Example structure:
```typescript
const runNewEntityTests = async (projectId: string) => {
  const suiteIndex = 3; // Next available index
  
  // Create test
  updateTestStatus(suiteIndex, 0, { status: 'running' });
  // ... test logic ...
  updateTestStatus(suiteIndex, 0, { status: 'pass', message: 'Success' });
  
  // Read test
  // Update test
  // Delete test
  // Calculation test
}
```

## Support

For issues with the test suite:
1. Check the browser console for detailed error messages
2. Check the Electron main process console
3. Review the SQLite database logs
4. Verify database schema matches expected structure

## Version History

- **v1.0.0** (Current): Initial test suite with Equipment, Cost Codes, and Contracts
