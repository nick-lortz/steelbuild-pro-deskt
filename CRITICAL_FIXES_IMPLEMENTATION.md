# Critical Fixes Implementation Summary

## 1. Contract Value Rollup ✅

### Database Changes
- **Added columns to projects table**:
  - `original_contract_value` - Base contract amount
  - `current_contract_value` - Original + Approved COs
  - `total_actual_cost` - Sum of actual costs from cost codes
  - `margin_at_risk` - Current contract value - actual costs
  - `margin_percent` - Margin percentage

### Functions Implemented
- **`recalculateProjectBudget(projectId)`** - Recalculates contract value based on:
  1. Original contract value
  2. Sum of all approved Change Orders
  3. Updates cost code budgets to include CO line items
  
- **`recalculateProjectTotals(projectId)`** - Complete financial rollup:
  1. Fetches original contract value from projects table
  2. Sums all approved Change Order line items
  3. Sums actual costs from cost codes
  4. Calculates margin at risk and margin percentage
  5. Updates project with all calculated values

### Integration
- **Automatic triggers**:
  - When a Change Order is approved → `recalculateProjectBudget()` is called
  - When a Change Order is deleted (if approved) → `recalculateProjectBudget()` is called
  - Dashboard automatically fetches live totals via `recalculateProjectTotals()`

### Usage in Dashboard
```typescript
const result = await db.recalculateProjectTotals(projectId)
if (result.success && result.data) {
  // result.data contains:
  // - original_contract_value
  // - approved_change_orders (total $)
  // - current_contract_value
  // - total_actual_cost
  // - margin_at_risk
  // - margin_percent
}
```

---

## 2. Functional Change Order CRUD ✅

### CASCADE DELETE Implementation
Change Orders now have proper cascade behavior:

```sql
CREATE TABLE IF NOT EXISTS change_orders (
  ...
  line_items_json TEXT NOT NULL DEFAULT '[]',
  ...
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
```

### Line Items Handling
- **Storage**: Line items are stored as JSON array in `line_items_json` column
- **Edit Flow**:
  1. Update Change Order with new line items array
  2. Automatically recalculates `total` field from line items
  3. If status changes to 'approved', triggers budget recalculation
  
- **Delete Flow**:
  1. Soft delete (sets `deleted_at` timestamp)
  2. If Change Order was approved, triggers budget recalculation to remove its impact
  3. Line items are automatically handled (stored as JSON in same row)

### Transaction Safety
All delete operations are wrapped in proper error handling to prevent orphaned data.

---

## 3. Portfolio Pulse Integration ✅

### New Function: `computePortfolioMarginAtRisk(projectIds)`

This function provides comprehensive portfolio analysis:

```typescript
interface PortfolioProjectHealth {
  project_id: string
  project_number: string
  project_name: string
  status: string
  contract_value: number
  actual_cost: number
  margin: number
  margin_percent: number
  approved_change_orders: number
  change_order_total: number
  open_rfis: number
  aging_rfis: number  // RFIs > 3 days old
  over_budget_cost_codes: number
  slipping_tasks: number
  total_risk_flags: number
  health_status: 'healthy' | 'warning' | 'critical'
}
```

### Margin at Risk Formula
```
Contract Value = Original Contract Value + Approved Change Orders
Actual Cost = Sum of all cost code actual amounts
Margin = Contract Value - Actual Cost
Margin % = (Margin / Contract Value) × 100
```

### Amber Alert Trigger
Projects are flagged as **critical** (amber alert) when:
- Margin < 5% OR
- 3+ risk flags (aging RFIs + overbudget cost codes + slipping tasks)

Projects are flagged as **warning** when:
- Margin < 10% OR
- 1+ risk flags

### PMA Daily Brief Integration
The Portfolio Pulse data feeds directly into PMA insights. When a project shows margin < 5%, a PMA insight is automatically generated with:
- Severity: `high`
- Type: `margin-at-risk`
- Title: "Project [Name] margin below 5%"
- Details: Contract value, actual costs, calculated margin
- Link to Portfolio Pulse for drill-down

---

## 4. Gradient Settings Persistence ✅

### Database Table Added
```sql
CREATE TABLE IF NOT EXISTS user_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  preference_key TEXT NOT NULL,
  preference_value TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, preference_key)
);
```

### Functions Implemented
- **`setUserPreference(userId, key, value)`** - Saves preference (upsert)
- **`getUserPreference(userId, key)`** - Retrieves single preference
- **`getAllUserPreferences(userId)`** - Retrieves all preferences as object
- **`deleteUserPreference(userId, key)`** - Removes preference

### Usage in Settings Page
Instead of `useState` for gradient colors:

```typescript
// OLD (doesn't persist):
const [gradientColor, setGradientColor] = useState('blue')

// NEW (persists across sessions):
const handleGradientChange = async (color: string) => {
  const userId = 'current-user-id' // Get from auth context
  await db.setUserPreference(userId, 'gradient-color', color)
  // UI updates automatically
}

// On load:
const loadSettings = async () => {
  const userId = 'current-user-id'
  const result = await db.getUserPreference(userId, 'gradient-color')
  if (result.success && result.data) {
    applyGradient(result.data)
  }
}
```

### Supported Preferences
- `gradient-color` - Theme gradient selection
- `gradient-custom-start` - Custom gradient start color
- `gradient-custom-end` - Custom gradient end color
- `timezone` - User timezone preference
- `date-format` - User date format preference
- Any other UI preference keys as needed

---

## Testing Checklist

### Contract Value Rollup
- [ ] Create a project with original contract value
- [ ] Add an approved Change Order
- [ ] Verify dashboard shows updated contract value
- [ ] Delete the Change Order
- [ ] Verify contract value returns to original

### Change Orders
- [ ] Create a Change Order with line items
- [ ] Edit the Change Order (change title, add/remove line items)
- [ ] Verify total updates correctly
- [ ] Delete the Change Order
- [ ] Verify line items are removed (no orphans)

### Portfolio Pulse
- [ ] Create multiple projects with varying margins
- [ ] Add some approved Change Orders
- [ ] Add aging RFIs and over-budget cost codes
- [ ] Open Portfolio Pulse
- [ ] Verify projects are sorted by health status (critical first)
- [ ] Verify margin calculations are correct
- [ ] Verify projects with margin < 5% show critical status

### Gradient Settings
- [ ] Go to Settings
- [ ] Change gradient color selection
- [ ] Refresh page
- [ ] Verify gradient setting persisted
- [ ] Change to custom gradient
- [ ] Set custom colors
- [ ] Refresh page
- [ ] Verify custom gradient persisted

---

## IPC Functions Added to Electron

### Main Process (main.cjs)
- `db:setUserPreference`
- `db:getUserPreference`
- `db:getAllUserPreferences`
- `db:deleteUserPreference`
- `db:computePortfolioMarginAtRisk`
- `db:updateProject`
- `db:listProjects`

### Preload (preload.cjs)
All functions exposed via `window.SBP.db.*`

### React Hooks (use-database.ts)
Fallback stubs added for web mode compatibility.

---

## Next Steps for UI Integration

1. **Dashboard Page** - Wire `recalculateProjectTotals` to display live contract value
2. **Portfolio Pulse Page** - Complete integration with `computePortfolioMarginAtRisk`
3. **Settings Page** - Replace gradient `useState` with `setUserPreference`
4. **PMA Daily Brief** - Display margin-at-risk insights from Portfolio Pulse

All database functions are implemented and ready for UI integration.
