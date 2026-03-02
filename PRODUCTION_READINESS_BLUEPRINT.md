# SteelBuild Pro - Production Readiness Blueprint

## Executive Summary
This document outlines the transition from "visual prototype" stage to a production-ready construction management application. The focus is on implementing functional core logic that handles construction data, financial integrity, and project risk.

## Phase 1: Single Source of Truth (Data Layer) ✅

### Status: IMPLEMENTED
- ✅ useDatabase hook across all modules
- ✅ SQLite/IndexedDB tables for persistent storage
- ✅ Real-time dashboard updates
- ✅ Cost Code changes flow to Financial Dashboard automatically

### Implementation Details:
- **Database**: SQLite with Drizzle ORM
- **Tables**: projects, rfis, equipment, cost_codes, tasks, pma_insights, drawing_sets, drawing_sheets, notifications, change_orders, contracts
- **Hooks**: useRFIs, useEquipment, useCostCodes, useDashboardCounts, usePMAInsights, useChangeOrders, useContracts

## Phase 2: Gated Drawing Workflow

### Status: PARTIALLY IMPLEMENTED - NEEDS ENHANCEMENT
Current: Basic status tracking with IFA, BFA, OFS, BFS, FFF
Needed: 
- ✅ Status sequence enforcement
- ⚠️ Locking mechanism for FFF drawings
- ⚠️ Notification system on status change
- ⚠️ Integration with useDatabase (currently using useKV)

### Required Enhancements:
1. **Move Drawing Sets to SQLite**
   - Migrate from useKV to useDatabase hook
   - Enforce status-gating at database level
   - Add read-only flag for FFF status

2. **Drawing Status Rules**
   ```javascript
   IFA → BFA → OFS → BFS → FFF
   - Once FFF: locked from editing
   - Notification on each transition
   - Audit trail of all status changes
   ```

3. **Implementation Tasks**:
   - [ ] Create useDrawingSets hook
   - [ ] Create useDrawingSheets hook
   - [ ] Add status transition validation
   - [ ] Add FFF locking mechanism
   - [ ] Generate notifications on status change
   - [ ] Update DrawingsDBPage to use database hooks

## Phase 3: Active PMA (Project Management Assistant)

### Status: IMPLEMENTED - NEEDS EXPANSION
Current: Basic heuristic detection for RFI aging
Needed: Comprehensive risk detection across all modules

### Heuristic Rules to Implement:

#### 1. Stale RFIs ✅
- **Rule**: Flag any RFI open for >72 hours
- **Status**: IMPLEMENTED
- **Location**: electron/db/queries.js - generatePMAInsights()

#### 2. Budget Variance ⚠️ NEEDS ENHANCEMENT
- **Rule**: Flag any project where Actual Costs > 90% of Budget before task is 90% complete
- **Current**: Basic budget overage detection
- **Needed**: Task completion % correlation
- **Implementation**:
  ```sql
  SELECT cc.*, t.percent_complete
  FROM cost_codes cc
  JOIN tasks t ON cc.cost_code_id = t.id
  WHERE cc.actual_amount > (cc.budget_amount * 0.90)
    AND t.percent_complete < 90
    AND cc.project_id = ?
  ```

#### 3. Schedule Slip ⚠️ NEEDS ENHANCEMENT
- **Rule**: Flag tasks where Current End Date > Baseline End Date
- **Current**: Basic detection implemented
- **Needed**: Critical path impact analysis
- **Implementation**:
  - Calculate schedule variance (days)
  - Identify if task is on critical path
  - Estimate project delay impact

#### 4. Critical Path RFI ⚠️ NEW
- **Rule**: Flag RFIs tied to critical path tasks
- **Status**: NOT IMPLEMENTED
- **Priority**: HIGH
- **Implementation**:
  - Identify critical path tasks
  - Cross-reference with open RFIs
  - Calculate potential delay impact

#### 5. Delivery Risk ⚠️ NEW
- **Rule**: Flag deliveries past due or high risk
- **Status**: NOT IMPLEMENTED
- **Priority**: MEDIUM
- **Implementation**:
  - Check delivery expected dates
  - Flag overdue deliveries
  - Identify upcoming critical deliveries

### PMA Output Requirements:
- ✅ Deep links to underlying items
- ✅ Reasoning inputs (age, variance, etc.)
- ✅ Resolve/dismiss workflow
- ⚠️ Severity ranking algorithm needs refinement
- ⚠️ Action recommendations need to be more specific

## Phase 4: Financial Auto-Rollup & Automated SOV

### Status: PARTIALLY IMPLEMENTED - NEEDS INTEGRATION

### Current State:
- ✅ Cost codes track budget vs actual
- ✅ Tasks track percent complete
- ✅ SOV tracking page exists
- ⚠️ Manual linkage between task progress and SOV

### Required Implementation:

#### 1. Task-to-SOV Mapping
```javascript
// Create cost_code → task mapping
// When task.percent_complete updates:
// 1. Calculate billable amount
// 2. Update SOV item
// 3. Generate invoice line if billing period

calculateBillableAmount(costCode, task) {
  const sovItem = getSOVItemByCostCode(costCode.id);
  const previouslyBilled = sovItem.billed_to_date || 0;
  const contractValue = sovItem.contract_value;
  
  const currentEarned = (task.percent_complete / 100) * contractValue;
  const thisPeriodBillable = currentEarned - previouslyBilled;
  
  // Protect against overbilling
  if ((previouslyBilled + thisPeriodBillable) > contractValue) {
    return contractValue - previouslyBilled;
  }
  
  return thisPeriodBillable;
}
```

#### 2. SOV Calculation Engine
- **Input**: Task percent complete update
- **Process**:
  1. Find linked cost code
  2. Find linked SOV item
  3. Calculate work in place
  4. Apply retainage rules
  5. Calculate billable amount
- **Output**: Updated SOV with audit trail

#### 3. Implementation Tasks:
- [ ] Add `sov_items` table
- [ ] Add `task_cost_code_mapping` table
- [ ] Create `calculateAutomatedSOV` function
- [ ] Add task progress → SOV trigger
- [ ] Create SOV version snapshots
- [ ] Add billing period tracking
- [ ] Generate invoice drafts from SOV

### Automated SOV Schema:
```sql
CREATE TABLE sov_items (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  cost_code_id TEXT,
  item_number TEXT NOT NULL,
  description TEXT NOT NULL,
  contract_value REAL NOT NULL,
  billed_to_date REAL DEFAULT 0,
  this_period_amount REAL DEFAULT 0,
  retainage_percent REAL DEFAULT 10,
  retainage_held REAL DEFAULT 0,
  work_completed_percent REAL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (cost_code_id) REFERENCES cost_codes(id)
);

CREATE TABLE sov_versions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  billing_period TEXT NOT NULL,
  total_contract REAL NOT NULL,
  total_work_completed REAL NOT NULL,
  total_retainage REAL NOT NULL,
  total_due_this_period REAL NOT NULL,
  snapshot_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

## Phase 5: Implementation Priority Matrix

### CRITICAL (Implement First)
1. **Drawing Set Database Migration**
   - Risk: Data loss with useKV approach
   - Impact: High - affects shop floor operations
   - Effort: Medium (4-6 hours)

2. **Enhanced PMA Budget Variance**
   - Risk: Budget overruns go undetected
   - Impact: High - financial risk
   - Effort: Low (2-3 hours)

3. **Schedule Slip Critical Path Analysis**
   - Risk: Project delays cascade
   - Impact: High - schedule integrity
   - Effort: Medium (4-6 hours)

### HIGH (Implement Second)
4. **Automated SOV Calculation**
   - Risk: Manual billing errors
   - Impact: High - revenue recognition
   - Effort: High (8-12 hours)

5. **Drawing FFF Locking**
   - Risk: Accidental changes to fabrication documents
   - Impact: High - shop floor safety
   - Effort: Low (2-3 hours)

### MEDIUM (Implement Third)
6. **Critical Path RFI Detection**
   - Risk: Schedule impacts from RFIs
   - Impact: Medium - schedule management
   - Effort: Medium (4-6 hours)

7. **Delivery Risk Tracking**
   - Risk: Material delays
   - Impact: Medium - schedule management
   - Effort: Medium (4-6 hours)

## Phase 6: Testing & Validation

### Unit Tests Required:
- [ ] RFI numbering increment logic
- [ ] Status transition validation
- [ ] SOV calculation accuracy
- [ ] Budget variance detection
- [ ] Schedule slip detection
- [ ] Critical path calculation

### Integration Tests Required:
- [ ] Task update → SOV recalculation
- [ ] Cost code update → Dashboard refresh
- [ ] Drawing status change → Notification generation
- [ ] PMA scan → Insight generation

### User Acceptance Tests:
- [ ] Create cost code → appears in financial dashboard
- [ ] Update task progress → SOV updates automatically
- [ ] Drawing reaches FFF → cannot be edited
- [ ] RFI aging > 72 hours → PMA flags it

## Phase 7: Deployment Readiness

### Pre-Deployment Checklist:
- [ ] All database migrations tested
- [ ] Data integrity checks pass
- [ ] Audit trail functional
- [ ] Error handling comprehensive
- [ ] Loading states on all queries
- [ ] Empty states on all pages
- [ ] Confirm dialogs on destructive actions
- [ ] Toast notifications on all mutations
- [ ] Electron build tested (Windows + macOS)
- [ ] Offline mode tested
- [ ] Database backup/restore tested

### Performance Targets:
- Dashboard load: < 500ms
- Cost code query: < 200ms
- PMA scan: < 2s for 100 records
- SOV calculation: < 1s for 50 line items
- Drawing list: < 300ms

## Next Steps

### Immediate Actions (This Session):
1. ✅ Review current implementation
2. ✅ Create this blueprint document
3. ⏭️ Implement Drawing Set database migration
4. ⏭️ Enhance PMA heuristics
5. ⏭️ Create Automated SOV calculation engine
6. ⏭️ Add FFF drawing locking
7. ⏭️ Test end-to-end workflows

### Follow-up Session:
1. Integration testing
2. User acceptance testing
3. Performance optimization
4. Documentation finalization
5. Deployment preparation

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Status**: Active Development  
**Owner**: SteelBuild Pro Development Team
