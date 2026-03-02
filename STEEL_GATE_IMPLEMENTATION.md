# Steel Status Gate & Advanced Features Implementation

## Overview
This document details the implementation of four critical features for SteelBuild Pro:

1. **Steel Status Gate for Drawings** - Enforced lifecycle with FFF locking
2. **Live Financial Ripple Rollups** - Automatic contract value updates
3. **Automated SOV** - Field progress drives billing calculations
4. **Active PMA Risk Watchdog** - Deterministic heuristics with alerts

---

## 1. Steel Status Gate for Drawings

### Purpose
In steel fabrication, you cannot build from a sketch—you build from the **Final for Fabrication (FFF)** set. This workflow prevents costly shop-floor errors by locking drawings once they reach FFF status.

### Status Lifecycle
```
IFA (Issued for Approval) 
  → BFA (Build for Approval) 
  → OFS (Open for Shop) 
  → FFF (Final for Fabrication) ✓ LOCKED
```

### Implementation Details

#### Database Layer (`electron/db/queries.js`)

**Enhanced Functions:**
- `updateDrawingSetStatus(id, newStatus, userId, userRole)` - Lines 934-995
- `deleteDrawingSet(id, userId, userRole)` - Lines 997-1015
- `updateDrawingSheetStatus(id, newStatus, userId, userRole)` - Lines 1090-1133
- `deleteDrawingSheet(id, userId, userRole)` - Lines 1135-1159

**Key Protections:**
1. **Linear Progression**: Cannot skip statuses (e.g., IFA → FFF directly)
2. **No Backwards Movement**: Cannot move from BFA back to IFA
3. **FFF Locking**: 
   - Only Admins and Project Managers can modify/delete FFF drawings
   - Returns clear error message preventing shop-floor mistakes
   - Creates notification when drawing locked at FFF

**Example Lock Check:**
```javascript
if (existing.status === 'FFF') {
  if (userRole !== 'admin' && userRole !== 'project_manager') {
    return { 
      success: false, 
      error: 'Drawing is locked at FFF (Final for Fabrication). Only Admins can modify FFF drawings to prevent costly shop-floor errors.' 
    };
  }
}
```

### Notifications
When a drawing set reaches FFF status, the system automatically creates:
1. Standard status change notification
2. Special "locked" notification warning users of edit/delete restrictions

---

## 2. Live Financial Ripple Rollups

### Purpose
Dashboard metrics (like $8.5M Contract Value) must react to data being entered in sub-modules. When a Change Order is marked "Approved," it should automatically increment the Contract Value and adjust Margin at Risk.

### Implementation Details

#### Auto-Rollup Service (`electron/db/queries.js`)

**Enhanced Function:**
- `updateChangeOrder(id, data)` - Lines 1242-1298

**Trigger Sequence:**
```
Change Order marked "Approved" 
  → recalculateProjectBudget(projectId)
  → recalculateProjectTotals(projectId)
  → Create notification with dollar amount
  → Dashboard updates automatically
```

**What Gets Updated:**
1. `current_contract_value` = original value + approved COs
2. `total_actual_cost` = sum of all actual costs
3. `margin_at_risk` = contract value - actual cost
4. `margin_percent` = (margin / contract value) × 100

**Enhanced Features:**
- Tracks if CO was previously approved (prevents double-counting)
- Calculates total from line items automatically
- Sets approved_date timestamp
- Creates rich notification with formatted dollar amount
- Logs audit trail

**Example Notification:**
```
"💰 Change Order #CO-001 'Steel Expansion' has been APPROVED. 
Contract Value and Budget automatically updated (+$125,450.00)"
```

### Financial Summary Function
`getProjectFinancialSummary(projectId)` - Lines 1480-1531

Returns comprehensive financial picture:
```javascript
{
  original_contract_value,
  current_contract_value,
  approved_change_order_total,
  pending_change_order_total,
  potential_contract_value,
  total_budget,
  total_actual,
  approved_change_orders: [...],
  pending_change_orders: [...]
}
```

---

## 3. Automated SOV (Schedule of Values)

### Purpose
Automate billing by tying task progress to Schedule of Values. When a task (e.g., "Steel Erection") is marked 50% complete, the SOV automatically calculates billable amounts.

### Formula
```
Billable This Period = (Budget × % Complete) - Previously Billed
Net Billable = Completed to Date - Retainage
```

### Implementation Details

#### Enhanced SOV Calculation (`electron/db/queries.js`)
`calculateAutomatedSOV(projectId)` - Lines 1435-1539

**Features:**
1. **Progress-Based Calculation**:
   - Links cost codes to tasks
   - Averages percent complete across related tasks
   - Calculates work completed to date

2. **Retainage Handling**:
   - Configurable retainage percentage (default 10%)
   - Calculates retainage amount
   - Provides net billable (after retainage)

3. **Previously Billed Tracking**:
   - Stores `previously_billed` on cost codes
   - Prevents double-billing
   - Shows incremental billing per period

**Output Structure:**
```javascript
{
  cost_code_id,
  cost_code,
  description,
  scheduled_value: 100000,
  percent_complete: 45.5,
  work_completed_to_date: 45500,
  previously_billed: 30000,
  billable_this_period: 15500,
  retainage_percent: 10,
  retainage_amount: 4550,
  net_billable: 40950,
  balance_to_finish: 54500,
  related_task_count: 3,
  related_tasks: [...]
}
```

**Summary Totals:**
```javascript
{
  total_scheduled_value,
  total_completed_to_date,
  total_previously_billed,
  total_billable_this_period,
  total_retainage,
  total_net_billable,
  total_balance_to_finish,
  overall_percent_complete
}
```

### Usage Example
```javascript
const result = await window.SBP.db.calculateAutomatedSOV(projectId);
const { data: sovItems, summary } = result;

// Display in UI
sovItems.forEach(item => {
  console.log(`${item.cost_code}: ${item.percent_complete}% complete`);
  console.log(`Billable this period: $${item.billable_this_period.toFixed(2)}`);
});
```

---

## 4. Active PMA Risk Watchdog

### Purpose
The PMA (Project Management Assistant) should be an active monitor that alerts users to "Red Flags" rather than just a button.

### Deterministic Heuristics

#### Enhanced RFI Aging Detection (`electron/db/queries.js`)
Lines 574-622

**Thresholds:**
- **72+ hours**: High severity (⚠️ "exceeds 72hr threshold")
- **7+ days**: High severity with CRITICAL flag
- **3-7 days**: Medium severity

**Example Insight:**
```
Title: "⚠️ RFI #104 is 85 hours old (>72hr threshold)"
Details: "RFI 'Anchor Bolt Placement' has been open for 85 hours (3 days) 
          without closure. This exceeds the 72-hour response threshold 
          and may be blocking critical work."
Deep Link: /projects/{id}/rfis?rfi={rfiId}
```

#### Budget Overage Detection
Lines 671-714

**Criteria:**
- Actual Amount > Budget Amount
- Budget Amount > 0

**Severity Levels:**
- >20% over budget: High
- >10% over budget: Medium
- >0% over budget: Low

#### Schedule Slippage Detection
Lines 623-669

**Criteria:**
- Task not completed
- End Date > Baseline End Date

**Severity:**
- >7 days behind: High
- Otherwise: Medium

#### Early Budget Variance Warning
Lines 716-761

**Advanced Heuristic:**
Flags cost codes where spending is outpacing work completion:
```
IF actual_amount > (budget_amount × 90%) 
AND percent_complete < 90%
THEN flag as high risk
```

### Daily Brief Function

#### New Function: `getPMADailyBrief(projectId)`
Lines 1995-2065

**Returns:**
```javascript
{
  summary: "⚠️ Detected 2 critical issues, 3 medium concerns requiring attention.",
  total_insights: 5,
  critical_count: 2,
  medium_count: 3,
  low_count: 0,
  aging_rfi_count: 2,
  budget_issue_count: 2,
  schedule_issue_count: 1,
  top_risks: [...top 5 insights],
  recommended_actions: [
    "📋 Follow up on RFI #104 - may be blocking critical path",
    "💰 Review Cost Code 05-300 exceeds budget - implement cost control measures",
    ...
  ],
  breakdown: {
    aging_rfis: [...],
    budget_issues: [...],
    schedule_issues: [...]
  }
}
```

### PMA Icon Behavior (Recommended UI Implementation)

**Normal State:**
- Gray/neutral icon
- No badge

**Active Alerts:**
- Amber pulse when critical_count > 0 or medium_count > 2
- Badge showing total insight count
- Clicking shows Daily Brief modal

**Deep Links:**
All insights include direct navigation:
- `/projects/{id}/rfis?highlight={rfiId}`
- `/projects/{id}/cost-codes?highlight={codeId}`
- `/projects/{id}/schedule?task={taskId}`

---

## API Integration

### Electron IPC Handlers

**Updated in `electron/main.cjs`:**
```javascript
ipcMain.handle("db:updateDrawingSetStatus", 
  async (event, id, newStatus, userId, userRole) => ...
)
ipcMain.handle("db:deleteDrawingSet", 
  async (event, id, userId, userRole) => ...
)
ipcMain.handle("db:getPMADailyBrief", 
  async (event, projectId) => ...
)
```

### Preload Bridge

**Updated in `electron/preload.cjs`:**
```javascript
window.SBP.db = {
  updateDrawingSetStatus: (id, newStatus, userId, userRole) => ...,
  deleteDrawingSet: (id, userId, userRole) => ...,
  getPMADailyBrief: (projectId) => ...,
  calculateAutomatedSOV: (projectId) => ...,
  // ... other functions
}
```

### React Hook

**Available in `src/hooks/use-database.ts`:**
```javascript
const { db } = useDatabase();

// Drawing status with role check
await db.updateDrawingSetStatus(setId, 'FFF', userId, 'user');

// Get daily brief
const brief = await db.getPMADailyBrief(projectId);

// Calculate SOV
const sov = await db.calculateAutomatedSOV(projectId);
```

---

## Usage Examples

### 1. Updating Drawing Status with Lock Check

```typescript
import { useDatabase } from '@/hooks/use-database';
import { toast } from 'sonner';

const { db } = useDatabase();
const userRole = 'user'; // or 'project_manager', 'admin'

const handleStatusChange = async (setId: string, newStatus: string) => {
  const result = await db.updateDrawingSetStatus(
    setId, 
    newStatus, 
    currentUserId,
    userRole
  );
  
  if (!result.success) {
    toast.error(result.error); // Shows FFF lock message if applicable
    return;
  }
  
  toast.success(`Drawing set moved to ${newStatus}`);
  
  // Refresh drawing list
  await loadDrawingSets();
};
```

### 2. Monitoring Financial Rollups

```typescript
import { useEffect, useState } from 'react';

const [financialSummary, setFinancialSummary] = useState(null);

useEffect(() => {
  const loadFinancials = async () => {
    const result = await db.getProjectFinancialSummary(projectId);
    if (result.success) {
      setFinancialSummary(result.data);
    }
  };
  
  loadFinancials();
  
  // Listen for financial updates
  const handleFinancialUpdate = () => loadFinancials();
  window.addEventListener('financialRollupComplete', handleFinancialUpdate);
  
  return () => {
    window.removeEventListener('financialRollupComplete', handleFinancialUpdate);
  };
}, [projectId]);

// Display on dashboard
{financialSummary && (
  <div className="metrics">
    <MetricCard 
      label="Contract Value"
      value={formatCurrency(financialSummary.current_contract_value)}
    />
    <MetricCard 
      label="Approved COs"
      value={formatCurrency(financialSummary.approved_change_order_total)}
    />
  </div>
)}
```

### 3. Displaying Automated SOV

```typescript
const SOVTrackingPage = () => {
  const [sovData, setSOVData] = useState(null);
  const { db } = useDatabase();
  
  useEffect(() => {
    const loadSOV = async () => {
      const result = await db.calculateAutomatedSOV(projectId);
      if (result.success) {
        setSOVData(result);
      }
    };
    loadSOV();
  }, [projectId]);
  
  if (!sovData) return <Loading />;
  
  return (
    <div>
      <h1>Schedule of Values</h1>
      
      <SummaryCards>
        <Card>
          <CardTitle>Overall Progress</CardTitle>
          <CardValue>{sovData.summary.overall_percent_complete}%</CardValue>
        </Card>
        <Card>
          <CardTitle>Billable This Period</CardTitle>
          <CardValue>
            {formatCurrency(sovData.summary.total_billable_this_period)}
          </CardValue>
        </Card>
        <Card>
          <CardTitle>Retainage Held</CardTitle>
          <CardValue>
            {formatCurrency(sovData.summary.total_retainage)}
          </CardValue>
        </Card>
      </SummaryCards>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cost Code</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>% Complete</TableHead>
            <TableHead>Scheduled Value</TableHead>
            <TableHead>Completed to Date</TableHead>
            <TableHead>Billable This Period</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sovData.data.map(item => (
            <TableRow key={item.cost_code_id}>
              <TableCell>{item.cost_code}</TableCell>
              <TableCell>{item.description}</TableCell>
              <TableCell>{item.percent_complete}%</TableCell>
              <TableCell>{formatCurrency(item.scheduled_value)}</TableCell>
              <TableCell>{formatCurrency(item.work_completed_to_date)}</TableCell>
              <TableCell className="font-semibold">
                {formatCurrency(item.billable_this_period)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
```

### 4. PMA Daily Brief Component

```typescript
const PMADailyBrief = ({ projectId }: { projectId: string }) => {
  const [brief, setBrief] = useState(null);
  const { db } = useDatabase();
  
  useEffect(() => {
    const loadBrief = async () => {
      // Generate fresh insights
      await db.generatePMAInsights(projectId);
      
      // Get daily brief
      const result = await db.getPMADailyBrief(projectId);
      if (result.success) {
        setBrief(result.data);
      }
    };
    
    loadBrief();
    
    // Refresh every 5 minutes
    const interval = setInterval(loadBrief, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [projectId]);
  
  if (!brief) return <Loading />;
  
  return (
    <div className="pma-daily-brief">
      <header>
        <h1>Daily Brief</h1>
        <p className="text-muted-foreground">{brief.summary}</p>
      </header>
      
      <div className="metrics-grid">
        <MetricCard 
          label="Critical Issues" 
          value={brief.critical_count}
          variant="destructive"
        />
        <MetricCard 
          label="Medium Concerns" 
          value={brief.medium_count}
          variant="warning"
        />
        <MetricCard 
          label="Aging RFIs" 
          value={brief.aging_rfi_count}
          variant="info"
        />
      </div>
      
      <section className="top-risks">
        <h2>Top Risks</h2>
        {brief.top_risks.map(risk => (
          <Alert key={risk.id} variant={risk.severity === 'high' ? 'destructive' : 'default'}>
            <AlertTitle>{risk.title}</AlertTitle>
            <AlertDescription>{risk.details}</AlertDescription>
            <div className="mt-2">
              {risk.entity_refs.map(ref => (
                <Button
                  key={ref.entity_id}
                  variant="link"
                  onClick={() => navigate(ref.link)}
                >
                  View {ref.label} →
                </Button>
              ))}
            </div>
          </Alert>
        ))}
      </section>
      
      <section className="recommended-actions">
        <h2>Recommended Actions</h2>
        <ul>
          {brief.recommended_actions.map((action, i) => (
            <li key={i}>{action}</li>
          ))}
        </ul>
      </section>
    </div>
  );
};
```

---

## Testing Checklist

### 1. Steel Status Gate
- [ ] Can progress IFA → BFA → OFS → FFF
- [ ] Cannot skip statuses (IFA → FFF blocked)
- [ ] Cannot move backwards (BFA → IFA blocked)
- [ ] FFF drawings block edit for non-admins
- [ ] FFF drawings block delete for non-admins
- [ ] Admins can modify FFF drawings
- [ ] Clear error messages displayed
- [ ] Notifications created at each status change
- [ ] Special notification when reaching FFF

### 2. Financial Rollups
- [ ] Approving CO triggers recalculateProjectBudget
- [ ] Approving CO triggers recalculateProjectTotals
- [ ] Notification created with correct dollar amount
- [ ] Dashboard contract value updates immediately
- [ ] Margin at risk recalculates
- [ ] Margin percent updates
- [ ] Previously approved COs don't double-count
- [ ] Audit log captures all changes

### 3. Automated SOV
- [ ] Cost codes link to tasks correctly
- [ ] Percent complete averages across related tasks
- [ ] Work completed calculates correctly
- [ ] Previously billed amount tracked
- [ ] Billable this period = (complete - previous)
- [ ] Retainage calculates correctly
- [ ] Net billable = completed - retainage
- [ ] Summary totals match line item sums
- [ ] Overall percent complete accurate

### 4. PMA Risk Watchdog
- [ ] RFIs >72 hours flagged as high severity
- [ ] RFIs >7 days flagged as critical
- [ ] Budget overages detected correctly
- [ ] Schedule slippages identified
- [ ] Early variance warnings trigger
- [ ] Daily brief shows correct counts
- [ ] Top 5 risks sorted by severity
- [ ] Deep links navigate to correct pages
- [ ] Recommended actions are actionable
- [ ] Insights can be resolved/dismissed

---

## Performance Considerations

1. **PMA Scanning**: Run `generatePMAInsights` on a schedule (e.g., every 30 minutes) rather than on every page load
2. **SOV Calculation**: Cache results for 5-10 minutes since task progress doesn't change constantly
3. **Financial Rollups**: Already optimized to only run when COs are approved/deleted
4. **Drawing Status**: Status checks are O(1) database queries

---

## Future Enhancements

1. **Drawing Status Gate**:
   - Add revision comparison for FFF → new IFA workflow
   - Implement markup/annotation tools
   - Add PDF stamping for FFF drawings

2. **Financial Rollups**:
   - Real-time WebSocket updates for multi-user scenarios
   - Export financial summary to Excel/PDF
   - Forecast future margin based on trends

3. **Automated SOV**:
   - G702/G703 form generation
   - Integration with accounting systems
   - Materials stored on-site tracking
   - Automated retainage release

4. **PMA Risk Watchdog**:
   - Machine learning for risk prediction
   - Slack/email notifications for critical risks
   - Configurable thresholds per project
   - Risk trend analysis over time

---

## Support

For questions or issues with these features, refer to:
- Main documentation: `/README.md`
- Database schema: `/electron/db/schema.sql`
- API documentation: `/API_DOCUMENTATION.md`
- Business rules: `/BUSINESS_RULES_INTEGRATION.md`
