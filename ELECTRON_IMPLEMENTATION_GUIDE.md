# SteelBuild Pro - Production Desktop Application Implementation Guide

## Overview

This guide documents the transformation of SteelBuild Pro from a web prototype into a production-ready, installable desktop application for Windows and macOS.

## ✅ Completed: Desktop Infrastructure

### Electron Integration
- ✅ Electron main process (`electron/main.cjs`)
- ✅ Preload script with secure IPC (`electron/preload.cjs`)
- ✅ TypeScript definitions for Electron APIs
- ✅ React hooks for Electron integration
- ✅ Vite configuration for Electron builds
- ✅ electron-builder configuration for installers

### Native Features
- ✅ Native application menus with keyboard shortcuts
- ✅ File save/open dialogs
- ✅ Window management (minimize, maximize, close)
- ✅ Cross-platform support (Windows, macOS, Linux)

### Development Workflow
- ✅ `npm run dev:electron` - Run in development mode with hot reload
- ✅ `npm run dist:win` - Build Windows installer
- ✅ `npm run dist:mac` - Build macOS DMG
- ✅ `npm run dist:linux` - Build Linux AppImage

## 🚧 Next Phase: Core CRUD & Data Persistence

### Priority 1: Cost Codes Module

**Status**: UI exists, needs full CRUD implementation

**Tasks**:
1. Implement Create operation
   - Form validation (code, description, type required)
   - Uniqueness check (project_id + code)
   - Success/error toasts
   - KV persistence

2. Implement Read operations
   - List view with pagination
   - Search/filter by code or description
   - Sort by columns
   - Empty state handling

3. Implement Update operation
   - Edit dialog with pre-filled data
   - Validation on update
   - Optimistic UI updates
   - Conflict resolution

4. Implement Delete operation
   - Confirmation dialog
   - Cascade check (warn if used in budgets/SOV)
   - Soft delete option
   - Undo capability

**Files to modify**:
- `/src/pages/cost-codes/cost-codes-page.tsx`
- `/src/lib/database.ts` (add cost code operations)
- `/src/components/cost-codes/` (create dialogs)

### Priority 2: RFIs Module

**Status**: Partially implemented, needs edit/delete

**Tasks**:
1. Fix RFI numbering
   - Auto-generate unique number per project
   - Format: `RFI-001`, `RFI-002`, etc.
   - Prevent duplicates

2. Complete edit functionality
   - Edit dialog with all fields
   - Update status workflow
   - Attachment management
   - History tracking

3. Implement delete
   - Soft delete with reason
   - Restore capability
   - Cascade to responses

4. Aging alerts
   - Highlight RFIs > 72 hours old
   - Escalation workflow
   - Notification integration

**Files to modify**:
- `/src/pages/rfis/rfis-page.tsx`
- `/src/lib/business-rules.ts` (RFI validation)
- `/src/components/rfis/` (dialogs)

### Priority 3: Equipment Module

**Status**: Crashes on load, needs complete rebuild

**Tasks**:
1. Fix crashes
   - Guard all queries with error boundaries
   - Handle empty data gracefully
   - Add loading skeletons

2. Implement equipment registry
   - Global equipment catalog
   - Equipment types (crane, welder, fabrication)
   - Maintenance schedules

3. Implement usage tracking
   - Log equipment hours per project
   - Utilization reports
   - Conflict detection

4. Inspection checklists
   - Pre-use inspections
   - Safety checks
   - Compliance tracking

**Files to modify**:
- `/src/pages/equipment/equipment-page.tsx`
- `/src/pages/global/equipment-page.tsx`
- `/src/lib/database.ts` (equipment operations)

### Priority 4: Change Orders Module

**Status**: Edit/delete broken, needs fixes

**Tasks**:
1. Fix edit functionality
   - Edit CO metadata
   - Edit line items inline
   - Recalculate totals
   - Version tracking

2. Fix delete functionality
   - Delete CO with line items
   - Confirm impact on budget
   - Audit trail
   - Restore option

3. Line item operations
   - Add/edit/delete line items
   - Cost code assignment
   - Quantity × unit price calculations
   - Tax/markup handling

4. Approval workflow
   - Status transitions (draft → submitted → approved)
   - Required approvals
   - Notification on status change
   - Digital signatures

**Files to modify**:
- `/src/pages/change-orders/change-orders-page.tsx`
- `/src/components/change-orders/` (dialogs)
- `/src/lib/business-rules.ts` (CO validation)

### Priority 5: Contracts Module

**Status**: Won't save, needs persistence layer

**Tasks**:
1. Implement save operation
   - Form validation
   - KV persistence
   - Link to project
   - Success feedback

2. Contract types
   - Lump sum
   - Unit price
   - Cost plus
   - Time & materials

3. Payment terms
   - Retainage percentage
   - Payment schedule
   - Invoice tracking
   - Milestone-based payments

4. Document attachments
   - Upload signed contract
   - Addenda
   - Change orders
   - Correspondence

**Files to modify**:
- `/src/pages/contracts/contracts-page.tsx`
- `/src/lib/database.ts` (contract operations)

## 🎯 Next Phase: Steel-Specific Workflows

### Drawing Workflow Enhancement

**Current State**: Exists but "terrible" (per requirements)

**Improvements Needed**:
1. Drawing status workflow
   - **IFA** (Issued for Approval)
   - **BFA** (Back from Approval)
   - **OFS** (Out for Signatures)
   - **BFS** (Back from Signatures)
   - **FFF** (Fabrication / Field / Final)

2. Revision management
   - Automatic revision numbering
   - Revision cloud detection
   - Comparison view (side-by-side)
   - Superseded tracking

3. Conflict detection
   - Scope change flags
   - Gap analysis
   - Design intent validation
   - AI-powered QA

4. Distribution tracking
   - Who received which revision
   - Read receipts
   - Download logs
   - Access control

**Files to modify**:
- `/src/pages/drawings/drawings-page.tsx`
- `/src/components/drawings/` (viewers, workflows)
- `/src/lib/server-functions.ts` (drawing QA)

### Automated SOV Generation

**Goal**: Link field progress to billing automatically

**Implementation**:
1. Cost code → SOV mapping
   - Map each cost code to SOV line items
   - Define % complete calculation rules
   - Handle retainage automatically

2. Progress tracking
   - Field install completion
   - Fabrication progress
   - Delivery milestones
   - QC sign-offs

3. SOV version generation
   - Monthly billing periods
   - Calculate current % complete
   - Previous vs current comparison
   - Export to Excel/PDF

4. Approval workflow
   - Internal review
   - Client approval
   - Payment application
   - Lien release tracking

**Files to modify**:
- `/src/pages/financials/sov-tracking-page.tsx`
- `/src/lib/business-rules.ts` (SOV calculations)
- `/src/lib/server-functions.ts` (SOV generation)

## 🤖 PMA Engine (Project Management Assistant)

**Current State**: Partially implemented, needs production logic

**Requirements**:
1. **Not a chat wrapper** - Must pull real project data
2. Deterministic heuristics first, LLM enhancement optional
3. Structured insights stored in database
4. Actionable recommendations with deep links

### Detection Heuristics

**RFI Aging** (Priority: High)
```typescript
// Detect RFIs older than 72 hours
const agedRFIs = rfis.filter(rfi => {
  const age = Date.now() - rfi.created_at;
  return age > 72 * 60 * 60 * 1000 && rfi.status === 'open';
});
```

**Schedule Variance** (Priority: High)
```typescript
// Compare actual vs baseline dates
const slippingTasks = tasks.filter(task => {
  if (!task.baseline_finish || !task.actual_finish) return false;
  return task.actual_finish > task.baseline_finish;
});
```

**Budget Overages** (Priority: Critical)
```typescript
// Cost code level budget tracking
const overageCostCodes = costCodes.filter(cc => {
  const actual = cc.actual_cost || 0;
  const budget = cc.budget_amount || 0;
  return actual > budget * 1.1; // 10% threshold
});
```

**Delivery Risks** (Priority: Medium)
```typescript
// Deliveries past due or high risk
const riskyDeliveries = deliveries.filter(d => {
  return d.status === 'delayed' || 
         (d.expected_date && d.expected_date < Date.now());
});
```

### Daily Brief Generation

**Output Structure**:
```typescript
interface DailyBrief {
  date: string;
  project_id: string;
  summary: string;
  risks: Array<{
    type: 'rfi' | 'schedule' | 'cost' | 'delivery';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    entity_id: string; // for deep linking
    recommendation: string;
  }>;
  metrics: {
    schedule_health: number; // 0-100
    cost_health: number;
    overall_health: number;
  };
}
```

**Files to implement**:
- `/src/lib/pma-engine.ts` (core detection logic)
- `/src/pages/projects/pma-page.tsx` (UI updates)
- `/src/components/pma/daily-brief.tsx` (new component)

## 🔐 Data Integrity & Security

### Authorization Middleware

**All operations must check**:
```typescript
// User is member of project
const isMember = await checkProjectMembership(user_id, project_id);
if (!isMember) throw new Error('Unauthorized');

// User has required role
const hasPermission = await checkRole(user_id, project_id, 'editor');
if (!hasPermission) throw new Error('Forbidden');
```

### Zero-Division Protections

**All financial calculations**:
```typescript
// Safe division helper
function safeDivide(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return numerator / denominator;
}

// Usage in metrics
const budgetUtilization = safeDivide(actualCost, budgetAmount);
const percentComplete = safeDivide(completedTasks, totalTasks);
```

### Data Validation

**All mutations must validate**:
```typescript
import { z } from 'zod';

const CostCodeSchema = z.object({
  code: z.string().min(1).max(20),
  description: z.string().min(1),
  type: z.enum(['labor', 'material', 'equipment', 'subcontractor']),
  project_id: z.string().uuid(),
});

// In mutation handler
const validated = CostCodeSchema.parse(input);
```

## 📦 Offline Support Strategy

### Tier 1: Always Available Offline
- Project list
- Project dashboard
- Cost codes
- Drawings (cached)
- Daily logs
- Equipment registry

### Tier 2: Sync When Online
- RFIs (create offline, sync on connect)
- Tasks (updates queue and sync)
- Labor entries
- Equipment logs

### Tier 3: Requires Connection
- Document uploads
- Drawing uploads
- PMA insights (requires LLM)
- Portfolio reports

### Implementation

```typescript
// Use KV for offline storage
import { useKV } from '@github/spark/hooks';

const [projects, setProjects] = useKV('projects', []);
const [offlineQueue, setOfflineQueue] = useKV('offline-queue', []);

// Queue operations when offline
function queueOperation(operation) {
  if (!navigator.onLine) {
    setOfflineQueue(queue => [...queue, operation]);
    return;
  }
  // Execute immediately
  executeOperation(operation);
}

// Sync queue when online
useEffect(() => {
  window.addEventListener('online', async () => {
    for (const op of offlineQueue) {
      await executeOperation(op);
    }
    setOfflineQueue([]);
  });
}, []);
```

## 📊 Testing & Quality Assurance

### Critical Test Scenarios

1. **Create Project → Add Cost Code → See in Dashboard**
   - End-to-end smoke test
   - Validates core data flow
   - Must work offline

2. **Create RFI → Age 72hrs → Appears in PMA**
   - Tests aging detection
   - Tests PMA engine
   - Tests deep linking

3. **Add Change Order → Budget Updates**
   - Tests cascade calculations
   - Tests financial integrity
   - Tests zero-division protection

4. **Upload Drawing → Track Revisions → Mark Current**
   - Tests drawing workflow
   - Tests file handling
   - Tests revision logic

5. **Go Offline → Create Entry → Sync Online**
   - Tests offline queue
   - Tests sync mechanism
   - Tests conflict resolution

## 🚀 Build & Distribution

### Pre-Release Checklist

- [ ] All CRUD operations work for core modules
- [ ] No crashes in any module
- [ ] PMA generates meaningful insights
- [ ] Drawing workflow is usable
- [ ] SOV auto-generation works
- [ ] Offline mode functions correctly
- [ ] All financial calculations protected
- [ ] Authorization checks in place
- [ ] Application icons added
- [ ] Code signing configured
- [ ] Installer tested on target platforms

### Distribution Strategy

**Internal Alpha**:
- Build: `npm run dist:win` / `npm run dist:mac`
- Distribute via direct download
- Collect feedback on core workflows

**Beta Release**:
- Set up auto-updates (electron-updater)
- Add crash reporting (Sentry)
- Implement analytics (opt-in)
- Extended testing with pilot customers

**Production Release**:
- Submit to Microsoft Store (Windows)
- Notarize for macOS App Store
- Set up license management
- Documentation and training materials

## 📝 Next Immediate Actions

1. **Start with Cost Codes** - Simplest module, validates pattern
2. **Fix Equipment Crashes** - High priority user-facing issue  
3. **Implement RFI Edit/Delete** - High usage feature
4. **Build PMA Detection Logic** - Core differentiator
5. **Test Electron Build** - Validate desktop packaging

---

**Definition of Done**: User can install the app, create a project, add a cost code, create an RFI, and see cost code reflected in Portfolio Pulse dashboard - all while offline.
