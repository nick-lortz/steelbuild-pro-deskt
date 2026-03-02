# Advanced SteelBuild Pro Features - Implementation Guide

This document outlines the four advanced construction management features that have been implemented in SteelBuild Pro to prevent costly errors and automate critical workflows.

---

## 1. Ready-to-Ship (RTS) Dashboard - Quality Gatekeeper

### Purpose
Prevents Work Packages from being marked as "Shipped" until they meet all quality and engineering requirements, eliminating costly field errors from outdated or incomplete information.

### The Logic: Readiness Score Calculation

Each Work Package receives an automated "Readiness Score" based on three critical checks:

#### Detailing Check (33.3% weight)
- **Criteria**: 100% of drawing sheets must be at **FFF (Final for Fabrication)** status
- **Pass Condition**: All sheets approved and locked
- **Fail Condition**: Any sheet at IFA, BFA, OFS, or BFS status
- **Data Source**: `DrawingSheet.status` linked to `WorkPackage.drawings`

**Example Output**:
```
✅ PASS: All 12 drawing sheets at FFF status
❌ FAIL: 3 of 12 sheets not at FFF (Sheet A-101: BFA, A-102: OFS, A-105: IFA)
```

#### QC Inspection Check (33.3% weight)
- **Criteria**: All piece marks have a "Passed Inspection" timestamp
- **Pass Condition**: `PieceMark.inspectionStatus === 'Passed'` for all marks
- **Fail Condition**: Any piece mark with status "Pending", "Failed", or null
- **Data Source**: `PieceMark.inspectionStatus` and `PieceMark.inspectionTimestamp`

**Example Output**:
```
✅ PASS: All 47 piece marks passed QC inspection
❌ FAIL: 5 piece marks not inspected (Marks: C-401, C-402, C-403, C-404, C-405)
```

#### RFI Status Check (33.3% weight)
- **Criteria**: Zero open RFIs linked to the package's drawing set
- **Pass Condition**: No RFIs with `status === 'Open'` where `RFI.linkedDrawingIds` intersects `WorkPackage.drawings`
- **Fail Condition**: Any open RFI linked to drawings in the package
- **Data Source**: `RFI.status`, `RFI.linkedDrawingIds`, `WorkPackage.drawings`

**Example Output**:
```
✅ PASS: No open RFIs linked to this package
❌ FAIL: 2 open RFIs (RFI-104: Foundation bolt locations, RFI-107: Weld callout clarification)
```

### Visual Indicators

#### Green (Ready-to-Ship)
- All three checks pass
- Readiness Score: 100%
- Visual: Green checkmark icon, "RTS" badge
- Action: Package can be released to fabrication

#### Amber (Warning)
- 75-99% readiness
- Minor issues detected
- Visual: Yellow warning icon, "Review Required" badge
- Action: PM review recommended before release

#### Red (Not Ready)
- <75% readiness
- Critical issues present
- Visual: Red X icon, "HOLD" badge
- Action: Cannot ship until blockers resolved

### UI Implementation

**Location**: `/projects/{projectId}/work-packages/readiness`

**Key Components**:
- Readiness Dashboard (grid view of all packages)
- Detailed Package Inspector (shows all three checks)
- Blockers List (sortable by severity)
- Auto-refresh on data changes

### Business Rules

1. **Automatic Hold**: If a package is marked "Ready" but fails any check, it auto-moves to "Hold" status
2. **PM Override**: Only Project Managers can manually override RTS gate (with required justification)
3. **Alert Generation**: When a package fails RTS after being marked ready, PMA generates Critical alert
4. **Audit Trail**: All RTS gate passes/fails are logged with timestamp and user

---

## 2. Erection Look-Ahead Driver - Schedule-Driven Shop Priorities

### Purpose
Links the Erection/Install schedule directly to Fabrication priorities, ensuring the shop builds what the field needs when they need it.

### The Logic: Schedule Change Detection & Priority Cascading

#### Trigger Conditions

A **Schedule Priority Change** is triggered when:
1. An Erection/Install task start date is moved **2+ days** earlier or later
2. The task has linked Fabrication batches
3. The task is on the Critical Path (optional filter)

#### Automatic Actions

When triggered, the system automatically:

1. **Updates Fabrication Priority**:
   - Task moved **>5 days earlier** → Fabrication priority set to **Critical**
   - Task moved **2-5 days earlier** → Fabrication priority set to **High**
   - Task moved **>5 days later** → Fabrication priority set to **Low** (allows resequencing)

2. **Sends PMA Alert**:
   ```
   Title: "Schedule Change Detected: Tier 2 Columns"
   Message: "Erection moved up 3 days. Fabrication priority updated to HIGH."
   Severity: High
   Assigned To: Shop Foreman
   Deep Link: /projects/{id}/fab-tracking?batch={batchId}
   ```

3. **Creates Notification**:
   - In-app notification to Shop Foreman
   - Toast notification with "View Fab Tracking" action
   - Email notification (if enabled)

#### Priority Calculation Formula

```typescript
function calculateFabricationPriority(
  daysDelta: number,
  daysUntilErection: number
): 'critical' | 'high' | 'normal' | 'low' {
  
  if (daysDelta < -5 || daysUntilErection < 7) {
    return 'critical' // Rush needed
  }
  
  if (daysDelta < -2 || daysUntilErection < 14) {
    return 'high' // Expedite
  }
  
  if (daysDelta > 5) {
    return 'low' // Can delay/resequence
  }
  
  return 'normal'
}
```

### Critical Path Integration

The PMA "Critical Path Watchdog" enhances this by detecting:
- Detailing for Critical Path tasks behind schedule
- Less than 14 days until Erection start
- Automatic **Critical Alert** generation

**Example Alert**:
```
⚠️ CRITICAL: Sequence 3 At Risk
Detailing 65% complete with 10 days until field erection.
Action: Prioritize detailing completion or delay erection start.
```

### UI Implementation

**Location**: Multiple touch points
1. Schedule Page: Visual indicator when changes affect fabrication
2. Fabrication Tracking: Priority badges update in real-time
3. PMA Daily Brief: Schedule sync insights shown
4. Lookahead Planning: Dependency visualization

**Visual Indicators**:
- **Critical**: Red badge + pulsing alert icon
- **High**: Orange badge + "Expedite" label
- **Normal**: Blue badge
- **Low**: Gray badge + "Can Delay" label

---

## 3. Automated Revenue Recognition (Earned Value)

### Purpose
Eliminates manual progress billing by automatically calculating earned value when field crews mark sequences as "Erected".

### The Formula: Industry-Standard Earned Value

```
Earned Value = (Tons Erected / Total Project Tonnage) × Contract Value
```

**Refined per sequence**:
```
Billable This Period = (Earned Value) - (Previously Billed)
```

### The Workflow

#### Step 1: Field Update
Foreman uses mobile app or desktop to mark sequence as "Erected"
- Updates `FieldInstall.status` to "Erected"
- Records `FieldInstall.tonnage` (actual tons installed)
- Records `FieldInstall.completedDate`

#### Step 2: Automatic Calculation
System immediately calculates:

```typescript
interface EarnedValueCalc {
  sequenceId: string
  sequenceName: string
  tonnageErected: 45.5        // Sum of all Erected field installs
  totalTonnage: 120.0         // Total planned for sequence
  percentComplete: 37.9       // (45.5 / 120.0) × 100
  budgetedValue: 485000       // SOV line item value
  earnedValue: 183815         // 37.9% × $485,000
  previouslyBilled: 95000     // Prior invoices for this sequence
  billableThisPeriod: 88815   // $183,815 - $95,000
}
```

#### Step 3: Draft Invoice Line Item Creation
System auto-generates G702 Application line:

| Description | Scheduled Value | Work Previous | Work This Period | Total Completed | % | Balance to Finish |
|-------------|----------------|---------------|------------------|-----------------|---|-------------------|
| Seq 3: Tier 2 Columns | $485,000 | $95,000 | **$88,815** | $183,815 | 37.9% | $301,185 |

Status: **Draft** (PM must review and approve)

#### Step 4: PM Notification
PMA generates insight:
```
💰 Revenue Recognition Updated: Tier 2 Columns
45.5 tons erected, 37.9% complete
+$88,815 added to billable value
Action: Review draft invoice line item
```

### Business Rules

1. **No Overbilling Protection**: Total billed cannot exceed budgeted value
2. **Tonnage Validation**: System warns if tonnage > planned tonnage
3. **Approval Required**: Draft lines must be PM-approved before invoicing
4. **Audit Trail**: All calculations logged with inputs and timestamps
5. **Retainage**: Automatically calculates retainage per contract terms (typically 10%)

### Integration with SOV

The system links:
- `SOVItem.linkedSequenceId` → `ErectionSequence.id`
- `ErectionSequence.id` → `FieldInstall.sequenceId`
- `FieldInstall.tonnage` → Earned Value calc

This creates a **fully automated billing pipeline**:
```
Field Install → Tonnage Update → EV Calc → SOV Update → Draft Invoice → PM Approval → G702 Export
```

### UI Implementation

**Location**: `/projects/{projectId}/financials`

**Dashboard Widgets**:
- "Work in Place This Period" (shows sum of all billable amounts)
- "Percent Collected" progress bar (automatically updates)
- "Draft Invoice Items" count (links to review page)

**SOV Tracking Page**:
- Real-time "Billable This Period" column
- "Approve for Billing" bulk action
- Export to G702/G703 format

---

## 4. Revision & Change Order Linkage - Preventing Back-Charges

### Purpose
Automatically detects when new drawing revisions are uploaded and places affected Work Packages on HOLD until conflicts are resolved or Change Orders are issued.

### The Trigger: New Revision Upload

When a new drawing revision is uploaded to the system:

```typescript
// Triggered on: DrawingRevision.create()
async function onRevisionUpload(
  projectId: string,
  sheetId: string,
  newRevision: string
) {
  // 1. Find all Work Packages containing this sheet
  const affectedPackages = await getWorkPackagesUsingSheet(sheetId)
  
  // 2. For each package in 'ready' or 'in-progress' status
  for (const pkg of affectedPackages) {
    if (pkg.status === 'ready' || pkg.status === 'in-progress') {
      
      // 3. Move package to HOLD
      await movePackageToHold(pkg.id, {
        reason: 'Drawing revision uploaded',
        severity: 'high'
      })
      
      // 4. Create Revision Conflict record
      await createRevisionConflict({
        workPackageId: pkg.id,
        sheetId: sheetId,
        oldRevision: pkg.currentRevision,
        newRevision: newRevision,
        conflictType: determineConflictType(newRevision),
        recommendedAction: generateRecommendedAction(pkg.status)
      })
      
      // 5. Send critical alert to PM
      await sendPMAlert({
        title: `Revision Conflict: ${pkg.packageNumber}`,
        severity: 'critical',
        message: `Drawing ${sheetNumber} updated. Package moved to HOLD.`
      })
    }
  }
}
```

### Conflict Classification

The system classifies revision conflicts by type:

#### Major Change (Severity: Critical)
- **Detection**: Revision number jumps >1 (e.g., REV 2 → REV 4)
- **Implication**: Significant design changes
- **Required Action**: PM must review and approve before release
- **Estimated Impact**: 5-10 day delay, potential rework costs

#### Scope Change (Severity: High)
- **Detection**: Revision notes contain keywords: "scope", "addition", "new", "modify"
- **Implication**: Work scope may have changed
- **Required Action**: Compare against original scope, may require CO
- **Estimated Impact**: 2-5 day delay, potential cost increase

#### Pending Change Order (Severity: Critical)
- **Detection**: Revision number contains "CO" or "PCO" (e.g., REV 3-CO)
- **Implication**: Change Order work included
- **Required Action**: **Must issue Change Order** before work can proceed
- **Block Release**: Package cannot be released until CO is approved

### Recommended Actions by Package Status

| Package Status | Recommended Action | Priority |
|---------------|-------------------|----------|
| **Ready** | HOLD shipment immediately. Review changes before proceeding. PM must approve release. | P1 |
| **In-Progress** | STOP fabrication. Assess work completed against new revision. Determine if rework required. | P1 |
| **Planning** | Update package with new revision before starting work. | P2 |

### PM Workflow

When a revision conflict is detected, PM must:

1. **Review Drawing Changes**
   - Compare old vs. new revision
   - Identify scope/design changes
   - Assess impact on in-progress work

2. **Decision Point**:
   
   **Option A: Approve & Release**
   - No significant changes
   - Work can proceed with new revision
   - Click "Approve Revision" button
   - Package moves from "Hold" → "Ready"
   
   **Option B: Require Change Order**
   - Scope or cost impact detected
   - Click "Require Change Order" button
   - System auto-creates CO draft with:
     - Linked drawing revision
     - Affected work packages
     - Estimated cost/schedule impact
   - Package remains "Hold" until CO approved
   
   **Option C: Assess Rework**
   - Work already in progress
   - Determine if rework required
   - Calculate rework cost
   - Either absorb cost or issue back-charge to design team

3. **Document Decision**
   - Required justification field
   - Audit trail logged
   - All stakeholders notified

### Cost Impact Calculation

The system estimates financial impact:

```typescript
interface RevisionImpact {
  affectedPackages: string[]
  affectedTasks: string[]
  estimatedDelay: number        // Business days
  costImpact: number            // Estimated $ impact
  requiresChangeOrder: boolean  // true if >$5,000 or >5 days
}
```

**Example Output**:
```
Revision Impact Assessment: Drawing A-101 REV 4

Affected Packages: 2 (WP-001, WP-003)
Estimated Delay: 7 business days
Cost Impact: $18,500
Requires Change Order: YES

Breakdown:
- Rework for in-progress work: $12,000
- Additional material costs: $4,500
- Schedule acceleration: $2,000
```

### UI Implementation

**Location**: Multiple touch points

1. **Drawings Page**: Upload triggers conflict detection
2. **Work Packages Page**: "HOLD" badge appears automatically
3. **PMA Daily Brief**: Revision conflicts shown as Critical insights
4. **Workflow Dashboard**: Visual flow showing blocked packages

**Revision Conflict Detail View**:
```
⚠️ CRITICAL: Revision Conflict Detected

Drawing: A-101
Old Revision: REV 2 | New Revision: REV 4
Package: WP-001 (Tier 2 Columns)
Status: Moved to HOLD

Recommended Action:
STOP fabrication. Assess work completed against new 
revision. Determine if rework is required.

Estimated Impact:
• Delay: 7 days
• Cost: $18,500
• Requires CO: YES

[View Drawing Comparison] [Require Change Order] [Approve & Release]
```

---

## Integration Architecture

All four features are integrated into the **Advanced PMA Engine**, which:

1. **Runs automated scans** (every 15 minutes or on-demand)
2. **Generates structured insights** with severity, impact, and actions
3. **Provides deep links** to affected entities
4. **Tracks resolution** with audit trail
5. **Surfaces in Daily Brief** sorted by priority

### PMA Daily Brief Output

```
📊 Daily Brief - ASM Garage Project
Generated: December 19, 2024 7:30 AM

Summary:
• 7 Total Insights
• 2 Critical
• 3 High Priority
• 1 Warning
• 1 Info

Critical Issues:
1. [Revision Conflict] Drawing A-101 REV 4 uploaded
   → WP-001 moved to HOLD. Review required.
   
2. [RTS Gate] WP-003 marked ready but does not meet criteria
   → 3 drawings not at FFF. 5 piece marks not inspected.

High Priority:
3. [Erection Sync] Tier 2 Columns moved up 3 days
   → Fabrication priority updated to HIGH. Alert shop foreman.
   
4. [Erection Sync] Foundation bolts moved back 5 days
   → Fabrication priority reduced to LOW. Can resequence.
   
5. [RTS Gate] WP-005 has 2 open RFIs
   → RFI-104 and RFI-107 blocking package release.

Info:
6. [Earned Value] Tier 1 Beams 42% complete
   → $95,250 added to billable value. Draft invoice created.

Recommendations:
• Address 2 critical issues immediately
• Review 2 work packages not meeting RTS criteria
• Coordinate with shop foreman on 2 schedule changes
• Approve draft invoice items for next billing cycle
```

---

## Database Schema Requirements

### New Tables

```sql
-- Revision Conflicts
CREATE TABLE revision_conflicts (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  work_package_id UUID NOT NULL,
  drawing_sheet_id UUID NOT NULL,
  old_revision VARCHAR(50),
  new_revision VARCHAR(50),
  conflict_type VARCHAR(50), -- 'major_change', 'scope_change', 'pending_co'
  severity VARCHAR(20),
  recommended_action TEXT,
  status VARCHAR(20), -- 'open', 'resolved', 'change_order_required'
  cost_impact DECIMAL(12,2),
  estimated_delay INT, -- days
  resolved_at TIMESTAMP,
  resolved_by UUID,
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Earned Value Calculations
CREATE TABLE earned_value_calculations (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  sequence_id UUID NOT NULL,
  calculation_date TIMESTAMP,
  tonnage_erected DECIMAL(10,2),
  total_tonnage DECIMAL(10,2),
  percent_complete DECIMAL(5,2),
  budgeted_value DECIMAL(12,2),
  earned_value DECIMAL(12,2),
  previously_billed DECIMAL(12,2),
  billable_this_period DECIMAL(12,2),
  draft_invoice_line_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Schedule Change Impacts
CREATE TABLE schedule_change_impacts (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  task_id UUID NOT NULL,
  original_date DATE,
  new_date DATE,
  days_delta INT,
  affected_fab_batches JSONB, -- array of batch IDs
  priority_update VARCHAR(20), -- 'critical', 'high', 'normal', 'low'
  notification_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Work Package Readiness Scores
CREATE TABLE work_package_readiness_scores (
  id UUID PRIMARY KEY,
  work_package_id UUID NOT NULL,
  scan_timestamp TIMESTAMP,
  overall_score INT,
  is_ready_to_ship BOOLEAN,
  detailing_status VARCHAR(20),
  detailing_percent INT,
  qc_status VARCHAR(20),
  qc_percent INT,
  rfi_status VARCHAR(20),
  rfi_open_count INT,
  blockers JSONB, -- array of blocker objects
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Enhanced Tables

```sql
-- Add to existing WorkPackage table
ALTER TABLE work_packages ADD COLUMN readiness_score INT DEFAULT 0;
ALTER TABLE work_packages ADD COLUMN is_rts BOOLEAN DEFAULT FALSE;
ALTER TABLE work_packages ADD COLUMN last_readiness_check TIMESTAMP;

-- Add to existing DrawingSheet table
ALTER TABLE drawing_sheets ADD COLUMN current_revision VARCHAR(50);
ALTER TABLE drawing_sheets ADD COLUMN revision_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE drawing_sheets ADD COLUMN locked_at TIMESTAMP;

-- Add to existing FabricationBatch table
ALTER TABLE fabrication_batches ADD COLUMN priority VARCHAR(20) DEFAULT 'normal';
ALTER TABLE fabrication_batches ADD COLUMN priority_reason TEXT;
ALTER TABLE fabrication_batches ADD COLUMN linked_task_ids JSONB;

-- Add to existing FieldInstall table
ALTER TABLE field_installs ADD COLUMN tonnage DECIMAL(10,2);
ALTER TABLE field_installs ADD COLUMN ev_calculated BOOLEAN DEFAULT FALSE;
ALTER TABLE field_installs ADD COLUMN ev_calculation_id UUID;
```

---

## Configuration & Settings

### PMA Scan Intervals
```typescript
{
  rtsGateScan: '*/15 * * * *',      // Every 15 minutes
  erectionSyncScan: '*/5 * * * *',   // Every 5 minutes (schedule changes)
  earnedValueScan: '0 * * * *',      // Every hour
  revisionConflictScan: '* * * * *'  // Every minute (immediate)
}
```

### Thresholds (Configurable per project)
```typescript
{
  rtsGate: {
    detailingRequirement: 100,  // % of sheets at FFF
    qcRequirement: 100,         // % of piece marks inspected
    rfiRequirement: 0           // max open RFIs
  },
  erectionSync: {
    minDaysDelta: 2,            // trigger threshold
    criticalDaysUntil: 7,       // days until erection for critical
    highDaysUntil: 14           // days until erection for high
  },
  earnedValue: {
    minimumBillable: 1000,      // min $ to create draft line
    retainagePercent: 10        // default retainage %
  },
  revisionConflict: {
    autoHoldStatuses: ['ready', 'in-progress'], // auto-HOLD these
    requireCOThreshold: 5000,   // $ threshold for required CO
    requireCODelayDays: 5       // delay threshold for required CO
  }
}
```

---

## Testing Scenarios

### Test 1: RTS Gate
1. Create work package with 10 drawings
2. Set 8 drawings to FFF, 2 to BFA
3. Mark package as "Ready"
4. **Expected**: Package auto-moves to "Hold", PMA critical alert generated

### Test 2: Erection Sync
1. Create erection task "Tier 2 Columns" scheduled for Jan 15
2. Link to fabrication batch "FAB-001"
3. Move task start date to Jan 10 (5 days earlier)
4. **Expected**: FAB-001 priority updates to "Critical", alert sent to shop foreman

### Test 3: Earned Value
1. Create SOV item for "Sequence 3" with value $500,000
2. Mark field install as "Erected" with 50 tons
3. Set sequence total tonnage as 100 tons
4. **Expected**: Draft invoice line created for $250,000, PMA insight generated

### Test 4: Revision Conflict
1. Create work package "WP-001" with status "Ready"
2. Link drawing sheet A-101 REV 2
3. Upload new revision A-101 REV 4
4. **Expected**: WP-001 moves to "Hold", conflict record created, PM alert sent

---

## Performance Considerations

- **Readiness Scans**: Indexed queries on `work_packages.status` and `drawing_sheets.status`
- **Schedule Changes**: Database trigger on `tasks.start_date` updates
- **Earned Value**: Asynchronous calculation via background job queue
- **Revision Conflicts**: Immediate processing, indexed on `drawing_sheets.id`

---

## Reporting & Analytics

### KPIs to Track
1. **RTS Gate Effectiveness**: % of packages that pass RTS on first attempt
2. **Schedule Sync Impact**: Average days saved by priority updates
3. **Billing Accuracy**: % variance between earned value and manual calc
4. **Revision Conflict Resolution Time**: Average hours from conflict to resolution

### Dashboards
1. Executive Dashboard: High-level metrics across all four features
2. PM Dashboard: Actionable insights requiring attention
3. Shop Dashboard: Current fabrication priorities with reasons
4. Finance Dashboard: Earned value trends and billing pipeline

---

## Next Steps for Full Implementation

1. **Database Migration**: Run schema updates
2. **Service Layer**: Wire up all detection logic with real data
3. **UI Components**: Build detailed views for each feature
4. **Testing**: Execute all test scenarios
5. **Training**: PM and shop foreman training on new workflows
6. **Rollout**: Pilot on one project, then expand

---

## Support & Maintenance

- **PMA Scan Failures**: Monitored via health check endpoint
- **Alert Delivery**: Retry logic for failed notifications
- **Audit Trail**: All automated actions logged for compliance
- **Manual Override**: PM can override any automated decision with justification

---

*This implementation transforms SteelBuild Pro from a tracking tool into an intelligent project assistant that actively prevents errors and optimizes workflows.*
