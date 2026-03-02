# Test Suite Quick Start Guide

## 🚀 Quick Start (2 minutes)

### Step 1: Launch Electron
```bash
npm run electron:dev
```

### Step 2: Navigate to Test Suite
**App Menu: Audit → Test Suite**

### Step 3: Run Tests
1. Enter a project ID (any valid UUID)
2. Click **"Run Tests"**
3. Watch the results in real-time

## 📊 What Gets Tested

### ✅ RFI Persistence (5 tests)
- Create, read, update, delete RFIs
- Auto-numbering validation

### ✅ Drawing Sets (5 tests)
- Full CRUD operations
- Status workflow: IFA → BFA → OFS → BFS → FFF

### ✅ Drawing Sheets (5 tests)
- Sheet management within sets
- Independent status gates

### ✅ Equipment (5 tests)
- Fleet management CRUD
- Status transitions

### ✅ Cost Codes (5 tests)
- Financial tracking
- Budget calculations

### ✅ Contracts (5 tests)
- Contract management
- Value aggregations

**Total: 30 automated tests**

## 🎯 Success Indicators

| Badge | Meaning |
|-------|---------|
| 🔵 Blue | Test is running |
| ✅ Green | Test passed |
| ❌ Red | Test failed |
| ⏱️ Gray | Test pending |

## 🐛 Common Issues

### "Desktop Mode Required"
**Fix**: Must run in Electron: `npm run electron:dev`

### "Enter test project ID"
**Fix**: Create a test project first or use existing project UUID

### Tests Failing
**Fix**: Initialize database: `npm run electron:init-db`

## 📝 Test Coverage

```
RFIs                 ██████████ 100%
Drawing Sets         ██████████ 100%
Drawing Sheets       ██████████ 100%
Equipment            ██████████ 100%
Cost Codes           ██████████ 100%
Contracts            ██████████ 100%
```

## 🔗 Key Features Validated

✓ SQLite persistence  
✓ Electron IPC communication  
✓ Auto-numbering (RFIs per project)  
✓ Status workflow gates  
✓ Cascade deletes  
✓ Aggregate calculations  
✓ CRUD completeness  

## 📖 Full Documentation

See `TEST_SUITE_IMPLEMENTATION.md` for complete details.

---

**Need Help?** Check console logs or review the technical documentation.
