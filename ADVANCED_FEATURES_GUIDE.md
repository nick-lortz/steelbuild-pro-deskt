# Advanced Features Implementation

This document describes the three advanced features implemented for SteelBuild Pro to address critical pain points in steel fabrication project management.

## 1. Amber Alert System - Proactive Risk Monitoring

### Overview
The Amber Alert System automatically monitors project data and notifies stakeholders when metrics become "dangerous," eliminating the need for users to manually check the PMA dashboard.

### Alert Types

#### Stale RFI Alert (Amber Severity)
- **Trigger**: RFI status = Open for > 72 hours
- **Action**: Pulse PMA icon Amber; list in "Critical Blockers"
- **Purpose**: Prevents costly delays from unanswered questions

#### Budget Leak Alert (Red Severity)
- **Trigger**: Actual Cost > 90% of Budget
- **Action**: Pulse PMA icon Red; link directly to Cost Codes page
- **Purpose**: Early warning system for budget overruns

#### Drawing Lag Alert (Amber Severity)
- **Trigger**: Fabrication started without FFF (For Fabrication & Field) status
- **Action**: Notification: "Potential Error: Fab started on IFA set"
- **Purpose**: Prevents expensive rework from outdated drawings

### Implementation

**Service Layer**: `/src/lib/services/critical-alerts.ts`
- `scanForCriticalAlerts()`: Scans project data for alert conditions
- `ALERT_RULES[]`: Configurable alert rule definitions
- Alert severity system: Amber, Red, Critical

**UI Component**: `/src/components/pma/critical-alert-indicator.tsx`
- **Widget Mode**: Displays in PMA sidebar with real-time counts
- **Icon Mode**: Compact notification badge
- **Auto-scan**: Configurable interval (default: 5 minutes)
- Features:
  - Pulsing animations for critical alerts
  - Quick actions (Acknowledge, Resolve)
  - Direct navigation to affected entities
  - Historical tracking (Active, Acknowledged, Resolved)

**Integration**: Added to PMA Daily Brief Page
```typescript
<CriticalAlertIndicator variant="widget" autoScan={true} scanInterval={300000} />
```

### User Workflow
1. System continuously scans project data every 5 minutes
2. When condition is met, alert is created and indicator pulses
3. User clicks indicator to see all active alerts
4. User can acknowledge (I've seen it) or resolve (it's fixed)
5. Clicking entity reference navigates directly to problem area

---

## 2. Convert to RFI - Production Note Escalation

### Overview
Saves 15-20 minutes of manual data entry by pre-populating an RFI form with a Production Note's body, attachments, and linked drawing sheets.

### Business Value
- **Time Savings**: 15-20 minutes per escalation
- **Data Accuracy**: Eliminates transcription errors
- **Context Preservation**: All attachments and references carried over
- **Audit Trail**: Links back to original production note

### Implementation

**Database Integration**: Uses existing Electron IPC handler
```typescript
window.SBP.db.convertProductionNoteToRFI(noteId, userId)
```

**Backend**: `/electron/db/production-notes.ts`
The `convertProductionNoteToRFI` function:
1. Fetches the production note with all related data
2. Determines RFI priority based on note priority
3. Creates new RFI with pre-populated fields:
   - Subject: Note title
   - Question: Note body
   - Priority: Mapped from note priority
   - Linked drawings: Carried over
4. Links the RFI ID back to the production note
5. Returns the newly created RFI

**UI Integration**: `/src/pages/production-notes/note-detail-panel.tsx`
```typescript
<Button 
  onClick={handleConvertToRFI}
  disabled={convertingToRFI}
>
  <ArrowsClockwise size={16} />
  Convert to RFI
</Button>
```

### User Workflow
1. User opens a Production Note that requires external clarification
2. Clicks "Convert to RFI" button
3. System creates RFI with all relevant data pre-filled
4. User is redirected to RFI page to review and submit
5. Production Note is linked to the new RFI for tracking

### Field Mapping
| Production Note | → | RFI |
|----------------|---|-----|
| Title | → | Subject |
| Body | → | Question |
| Priority (critical/high) | → | Priority (critical/high) |
| Drawing Sheet ID | → | Related Drawing |
| Attachments | → | Attachments |
| Due Date | → | Due Date |

---

## 3. Field-to-Finance Sync - Automated Progress Billing

### Overview
The biggest pain for steel fabricators is manual progress billing. This feature automatically populates SOV line items when field work is marked as "Erected."

### Business Value
- **Time Savings**: Eliminates hours of manual data entry each billing cycle
- **Accuracy**: Reduces billing errors and disputes
- **Cash Flow**: Faster invoicing means quicker payment
- **Real-time**: Billing reflects actual field progress instantly

### Implementation

**Service Layer**: `/src/lib/services/field-to-finance.ts`

Key Functions:
- `approveWorkPackageForBilling()`: Marks a package for billing and creates SOV line item
- `syncAllErectedPackages()`: Batch sync all erected packages
- `calculateBillingProgress()`: Returns billing metrics
- `updateFieldProgress()`: Updates work package status with auto-approval logic

**UI Widget**: `/src/components/financials/billing-sync-widget.tsx`
Features:
- Auto-sync toggle for hands-free operation
- Real-time billing progress visualization
- List of pending approvals with quick actions
- Direct link to Schedule of Values page

### Data Flow
```
Field Status Update
        ↓
Work Package Status = "Erected"
        ↓
Auto-approval (if enabled)
        ↓
Create SOV Line Item
        ↓
Link to Active SOV Version
        ↓
Ready for Invoice Generation
```

### Auto-Sync Logic
When auto-sync is enabled:
1. System watches for work package status changes
2. When status becomes "Erected" or "Completed"
3. Automatically creates SOV line item with:
   - Description: Work package name
   - Scheduled Value: Package scheduled value
   - Work Completed: % complete × scheduled value
   - Retainage: Calculated based on project retainage %
   - Current Billing: Work completed - retainage

### Manual Workflow
1. User goes to Work Packages or Schedule page
2. Marks work package status as "Erected"
3. Sees notification: "1 package ready for billing"
4. Opens Field-to-Finance widget
5. Reviews pending packages
6. Clicks "Approve" or "Approve All"
7. System creates SOV line items
8. Navigate to SOV tracking to generate invoice

### Billing Progress Metrics
- **Total Value**: Sum of all work package scheduled values
- **Billed Value**: Sum of approved packages × % complete
- **Unbilled Value**: Total - Billed
- **Percent Billed**: (Billed / Total) × 100
- **Pending Approval**: Count of erected packages not yet billed

---

## Integration Points

### Critical Alerts + PMA
- Alerts widget displays in right column of PMA Daily Brief
- Replaces reactive "check the dashboard" with proactive notifications
- Supplements AI-generated insights with rule-based monitoring

### Production Notes + RFIs
- "Convert to RFI" button appears in note detail panel
- Streamlines escalation path from internal issue to formal question
- Maintains traceability between production issues and RFIs

### Schedule/Work Packages + SOV
- Billing sync widget can be embedded in:
  - Work Packages page (primary location)
  - Schedule page (alternative location)
  - SOV Tracking page (billing review)
- Auto-sync runs in background when enabled
- Manual sync available for selective approval

---

## Configuration

### Alert Scan Intervals
Default: 5 minutes (300000ms)
Can be configured per component instance:
```typescript
<CriticalAlertIndicator scanInterval={180000} /> // 3 minutes
```

### Alert Thresholds
Modify in `/src/lib/services/critical-alerts.ts`:
- Stale RFI: 72 hours → adjustable
- Budget threshold: 90% → adjustable
- Drawing status: FFF required → adjustable

### Auto-Sync Billing
Toggle per project:
- Stored in KV store: `auto-billing-sync-${projectId}`
- Persists across sessions
- Can be disabled for manual control

---

## Testing Scenarios

### Test Stale RFI Alert
1. Create RFI with status "Open"
2. Set created_at to 4 days ago (in database)
3. Navigate to PMA page
4. Click "Run Scan" or wait for auto-scan
5. Verify amber alert appears

### Test Budget Leak Alert
1. Create Cost Code with budget $100,000
2. Set actual_amount to $95,000 (95%)
3. Navigate to PMA page
4. Run scan
5. Verify red pulsing alert appears

### Test Drawing Lag Alert
1. Create Drawing Set with status "IFA"
2. Create Production Note in "fab" category referencing that drawing
3. Navigate to PMA page
4. Run scan
5. Verify amber alert appears

### Test Convert to RFI
1. Create Production Note with rich content, attachments, drawing links
2. Open note detail panel
3. Click "Convert to RFI"
4. Verify RFI is created with all data
5. Check production note has rfi_id linked

### Test Field-to-Finance Sync
1. Create Work Package with scheduled value $50,000
2. Set status to "Erected" and percent complete to 100%
3. Enable auto-sync in widget
4. Verify SOV line item created
5. Check SOV page shows new line item

---

## Performance Considerations

### Alert Scanning
- Scans run in background, non-blocking
- Debounced to prevent duplicate scans
- Caches results to minimize re-computation
- Filters out already-acknowledged alerts

### Billing Sync
- Batch operations to minimize KV reads/writes
- Uses functional updates to prevent race conditions
- Creates SOV version on-demand if none exists
- Idempotent: safe to run multiple times

### Database Queries
- All data fetched via indexed queries (if using Electron DB)
- KV operations are async and non-blocking
- Paginated results for large datasets
- Lazy loading for detailed views

---

## Future Enhancements

### Alerts
- [ ] Email/SMS notifications for critical alerts
- [ ] Custom alert rules per project
- [ ] Machine learning for prediction (e.g., "RFI likely to exceed 72hrs based on sender")
- [ ] Alert trends and analytics
- [ ] Slack/Teams integration

### RFI Conversion
- [ ] Bulk convert multiple notes to single RFI
- [ ] Template selection for different RFI types
- [ ] AI-suggested question rephrasing for clarity
- [ ] Automatic assignment based on note category

### Field-to-Finance
- [ ] Photo evidence requirement before approval
- [ ] QC checklist integration
- [ ] Change order detection (over/under billed)
- [ ] Multi-approval workflow for large packages
- [ ] AIA G702/G703 direct export
- [ ] Integration with accounting systems (QuickBooks, Sage, Foundation)

---

## Support & Troubleshooting

### Alerts Not Appearing
1. Check browser console for errors
2. Verify project has data (RFIs, cost codes, drawings)
3. Check alert threshold settings
4. Clear KV cache: `spark.kv.delete('critical-alerts-${projectId}')`

### Convert to RFI Failing
1. Verify Electron IPC connection: `window.SBP?.db`
2. Check database permissions
3. Review production note has valid data
4. Check console for conversion errors

### Billing Sync Not Working
1. Verify work packages have scheduledValue set
2. Check status is exactly "erected" or "completed"
3. Ensure auto-sync is enabled (if using auto mode)
4. Clear and rebuild SOV: manually delete SOV items and re-sync

### Performance Issues
1. Reduce alert scan frequency
2. Disable auto-sync and use manual mode
3. Archive old/resolved alerts periodically
4. Paginate work package lists for large projects

---

## API Reference

### Critical Alerts Service

```typescript
// Scan for all alert conditions
const alerts = await scanForCriticalAlerts(projectId: string)

// Sort alerts by severity
const sorted = sortAlertsBySeverity(alerts: CriticalAlert[])

// Get icon for severity level
const icon = getAlertIcon(severity: AlertSeverity)
```

### Field-to-Finance Service

```typescript
// Approve single package
const result = await approveWorkPackageForBilling(
  projectId: string,
  workPackageId: string,
  approvedBy: string
)

// Bulk sync all erected packages
const result = await syncAllErectedPackages(projectId: string)

// Calculate billing metrics
const progress = calculateBillingProgress(workPackages: ExtendedWorkPackage[])
```

### Production Note Conversion

```typescript
// Convert note to RFI (Electron/Desktop only)
const result = await window.SBP.db.convertProductionNoteToRFI(
  noteId: string,
  userId: string
)
```

---

## Changelog

### Version 1.0 (Current)
- Initial implementation of all three features
- Critical Alert System with 3 alert types
- Convert to RFI with full data mapping
- Field-to-Finance sync with auto and manual modes

---

## License & Credits

Part of SteelBuild Pro - Construction Project Management Platform
Developed for steel fabricators to streamline project delivery and billing
