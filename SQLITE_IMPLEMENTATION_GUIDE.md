# SQLite Database Implementation - Complete Guide

## ✅ Implementation Status

### Completed
- ✅ SQLite database layer with Drizzle ORM
- ✅ Database schema with core tables (projects, rfis, equipment, cost_codes, audit_log)
- ✅ IPC handlers in Electron main process
- ✅ Preload API exposed via window.SBP.db
- ✅ React hooks for database operations
- ✅ TypeScript type definitions
- ✅ Unit tests for RFI numbering and uniqueness
- ✅ Comprehensive documentation

### Next Steps
1. Wire database hooks to existing UI pages
2. Add Projects CRUD operations
3. Implement data seeding for development
4. Add migration system
5. Implement backup/restore

## Quick Start

### 1. Verify Installation

The following dependencies are already installed:
```json
{
  "better-sqlite3": "^11.8.1",
  "drizzle-orm": "^0.38.3",
  "drizzle-kit": "^0.30.1"
}
```

### 2. Start Desktop App

```bash
npm run desktop:dev
```

The database will automatically initialize on first launch at:
- **Windows**: `%APPDATA%/SteelBuild Pro/steelbuild.db`
- **macOS**: `~/Library/Application Support/SteelBuild Pro/steelbuild.db`
- **Linux**: `~/.config/SteelBuild Pro/steelbuild.db`

### 3. Using Database in Components

```typescript
import { useRFIs, useDashboardCounts } from '@/hooks/use-database';

function MyComponent() {
  const projectId = 'some-project-id';
  const { rfis, loading, createRFI, deleteRFI } = useRFIs(projectId);
  const { counts } = useDashboardCounts(projectId);

  const handleCreate = async () => {
    const result = await createRFI({
      subject: 'New RFI',
      question: 'What is the beam size?',
      status: 'open',
    });
    
    if (result.success) {
      console.log('Created:', result.data);
    }
  };

  return (
    <div>
      <p>Total RFIs: {counts.rfi_count}</p>
      <button onClick={handleCreate}>Create RFI</button>
    </div>
  );
}
```

## Architecture Overview

### File Structure

```
packages/db/
├── schema.js              # Database schema definitions
├── index.js               # Package exports
└── drizzle.config.js      # Drizzle configuration

electron/db/
├── init.js                # Database initialization
├── queries.js             # CRUD operations
└── __tests__/
    └── database.test.js   # Unit tests

electron/
├── main.cjs               # IPC handlers registered here
└── preload.cjs            # window.SBP.db API exposed here

src/
├── hooks/
│   └── use-database.ts    # React hooks for database
└── types/
    └── electron.d.ts      # TypeScript definitions
```

### Data Flow

```
UI Component
    ↓
React Hook (useRFIs)
    ↓
window.SBP.db.createRFI()
    ↓
IPC: 'db:createRFI'
    ↓
Main Process Handler
    ↓
queries.createRFI()
    ↓
SQLite Database
    ↓
Response flows back up
    ↓
Hook reloads data
    ↓
UI updates
```

## API Reference

### Available Hooks

#### `useDatabase()`
Returns the database API and desktop mode flag.

```typescript
const { isDesktop, db } = useDatabase();
```

#### `useRFIs(projectId)`
Manages RFI CRUD operations for a project.

```typescript
const {
  rfis,           // Array<RFI>
  loading,        // boolean
  error,          // string | null
  createRFI,      // (data: Partial<RFI>) => Promise<DBResult<RFI>>
  updateRFI,      // (id: string, data: Partial<RFI>) => Promise<DBResult>
  deleteRFI,      // (id: string) => Promise<DBResult>
  reload,         // () => Promise<void>
} = useRFIs(projectId);
```

#### `useEquipment(projectId)`
Manages equipment registry for a project.

```typescript
const {
  equipment,
  loading,
  error,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  reload,
} = useEquipment(projectId);
```

#### `useCostCodes(projectId)`
Manages cost codes and budget tracking for a project.

```typescript
const {
  costCodes,
  loading,
  error,
  createCostCode,
  updateCostCode,
  deleteCostCode,
  reload,
} = useCostCodes(projectId);
```

#### `useDashboardCounts(projectId)`
Gets aggregate counts and totals for dashboard metrics.

```typescript
const {
  counts: {
    rfi_count,
    equipment_count,
    cost_code_count,
    total_budget,
    total_actual,
  },
  loading,
  error,
  reload,
} = useDashboardCounts(projectId);
```

### Direct API (window.SBP.db)

For advanced use cases outside React hooks:

```typescript
// Initialize database
await window.SBP.db.init();

// Create RFI
const result = await window.SBP.db.createRFI({
  project_id: 'proj-123',
  subject: 'Beam Size Question',
  question: 'What is the W12 beam size on grid A1?',
  status: 'open',
  priority: 'high',
});

// List RFIs
const { data: rfis } = await window.SBP.db.listRFIs('proj-123', {
  status: 'open',
  limit: 50,
  offset: 0,
});

// Update RFI
await window.SBP.db.updateRFI('rfi-id', {
  response: 'W12x53',
  status: 'closed',
});

// Delete RFI
await window.SBP.db.deleteRFI('rfi-id', 'user-id');

// Get dashboard counts
const { data: counts } = await window.SBP.db.getDashboardCounts('proj-123');
```

## Business Rules Implementation

### RFI Auto-Numbering

RFI numbers are automatically assigned per project starting from 1:

```javascript
// Logic in queries.js
if (!data.rfi_number) {
  const maxRfi = db
    .select({ maxNum: sql`MAX(${rfis.rfi_number})` })
    .from(rfis)
    .where(and(
      eq(rfis.project_id, data.project_id),
      isNull(rfis.deleted_at)
    ))
    .get();
  
  data.rfi_number = (maxRfi?.maxNum || 0) + 1;
}
```

**Rules:**
- First RFI in project gets number 1
- Each subsequent RFI increments the number
- Deleted RFIs don't affect next number
- Numbers are unique within each project
- Different projects have independent numbering

### Cost Code Uniqueness

Cost codes must be unique within each project:

```javascript
const existing = db
  .select()
  .from(cost_codes)
  .where(and(
    eq(cost_codes.project_id, data.project_id),
    eq(cost_codes.code, data.code),
    isNull(cost_codes.deleted_at)
  ))
  .get();

if (existing) {
  return { success: false, error: 'Cost code already exists for this project' };
}
```

**Rules:**
- Same code cannot exist twice in one project
- Same code can exist in different projects
- Deleted cost codes don't count toward uniqueness

### Soft Delete Pattern

All entities use soft delete:

```javascript
// Delete operation
db.update(rfis)
  .set({ deleted_at: now })
  .where(eq(rfis.id, id))
  .run();

// Query excludes deleted
db.select()
  .from(rfis)
  .where(and(
    eq(rfis.project_id, projectId),
    isNull(rfis.deleted_at)  // ← Important!
  ));
```

**Benefits:**
- Data recovery possible
- Audit trail preserved
- Referential integrity maintained
- Can implement "restore" feature later

### Audit Logging

Every operation is logged:

```javascript
function logAudit(entityType, entityId, action, projectId, payload, userId) {
  db.insert(audit_log).values({
    id: uuidv4(),
    entity_type: entityType,
    entity_id: entityId,
    action: action,
    project_id: projectId,
    payload_json: payload ? JSON.stringify(payload) : null,
    user_id: userId,
    created_at: new Date().toISOString(),
  }).run();
}
```

**Usage:**
```javascript
logAudit('rfi', rfiId, 'create', projectId, { subject, question }, userId);
logAudit('cost_code', codeId, 'update', projectId, { budget_amount: 50000 }, userId);
logAudit('equipment', equipmentId, 'delete', projectId, null, userId);
```

## Integration Guide

### Step 1: Update Existing Pages

Replace placeholder data with real database queries. Example for RFI page:

```typescript
// Before (placeholder)
const [rfis, setRfis] = useState([]);

// After (real database)
import { useRFIs } from '@/hooks/use-database';
const { rfis, loading, createRFI, updateRFI, deleteRFI } = useRFIs(projectId);
```

### Step 2: Wire Dashboard Counters

```typescript
import { useDashboardCounts } from '@/hooks/use-database';

function ProjectDashboard() {
  const { counts, loading } = useDashboardCounts(projectId);
  
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle>RFIs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? '--' : counts.rfi_count}
        </CardContent>
      </Card>
      {/* ... more cards */}
    </div>
  );
}
```

### Step 3: Handle Create Operations

```typescript
const handleCreateRFI = async (formData) => {
  const result = await createRFI({
    subject: formData.subject,
    question: formData.question,
    status: 'open',
    priority: formData.priority || 'medium',
    due_date: formData.dueDate,
  });

  if (result.success) {
    toast.success('RFI created successfully');
    closeDialog();
  } else {
    toast.error(result.error || 'Failed to create RFI');
  }
};
```

### Step 4: Handle Update Operations

```typescript
const handleUpdateRFI = async (id, changes) => {
  const result = await updateRFI(id, changes);

  if (result.success) {
    toast.success('RFI updated');
  } else {
    toast.error(result.error || 'Update failed');
  }
};
```

### Step 5: Handle Delete Operations

```typescript
const handleDeleteRFI = async (id) => {
  if (!confirm('Are you sure you want to delete this RFI?')) {
    return;
  }

  const result = await deleteRFI(id);

  if (result.success) {
    toast.success('RFI deleted');
  } else {
    toast.error(result.error || 'Delete failed');
  }
};
```

## Testing

### Run Unit Tests

```bash
npm test electron/db/__tests__/database.test.js
```

### Manual Testing Checklist

- [ ] Create first RFI - should get number 1
- [ ] Create second RFI - should get number 2
- [ ] Delete RFI 1, create new - should get number 3
- [ ] Dashboard counts update immediately after create
- [ ] Dashboard counts persist after app restart
- [ ] Duplicate cost code is rejected with error message
- [ ] Same cost code works in different projects
- [ ] Edit operations save and reflect in UI
- [ ] Delete operations remove items and update counts
- [ ] Empty states display when no data exists

### Testing Database Directly

```bash
# macOS/Linux
sqlite3 ~/Library/Application\ Support/SteelBuild\ Pro/steelbuild.db

# Windows
sqlite3 %APPDATA%\SteelBuild Pro\steelbuild.db

# SQL Commands
.tables                          # List all tables
.schema rfis                     # Show table structure
SELECT * FROM rfis;              # View all RFIs
SELECT * FROM audit_log;         # View audit history
```

## Troubleshooting

### Issue: Database not initializing

**Check:**
1. User data directory exists and is writable
2. Console shows "Database initialized" message
3. `steelbuild.db` file exists in user data directory

**Solution:**
```javascript
// In main.cjs, verify this runs
app.whenReady().then(() => {
  const userDataPath = app.getPath("userData");
  console.log('Initializing database at:', userDataPath);
  initDatabase(userDataPath);
});
```

### Issue: "Database not initialized" error

**Cause:** Query attempted before database ready

**Solution:** Ensure `initDatabase()` runs in `app.whenReady()` before any queries.

### Issue: RFI numbers not incrementing

**Check:**
1. Query filters deleted records: `isNull(rfis.deleted_at)`
2. MAX query works correctly
3. Auto-increment logic executes

**Debug:**
```javascript
const maxRfi = db.prepare(`
  SELECT MAX(rfi_number) as maxNum 
  FROM rfis 
  WHERE project_id = ? AND deleted_at IS NULL
`).get(projectId);
console.log('Max RFI number:', maxRfi?.maxNum);
```

### Issue: Unique constraint violations

**Cause:** Attempting to insert duplicate (project_id, rfi_number) or (project_id, code)

**Solution:** Queries handle this correctly. If error occurs, check:
1. Application logic honors uniqueness before insert
2. Error message returned to UI: `{ success: false, error: '...' }`

## Performance Considerations

### Current Optimizations
- WAL mode enabled for better concurrency
- Foreign key indexes automatically created
- Pagination support (limit/offset) in list queries

### Recommended Practices
1. **Use pagination**: Always set `limit` when listing large datasets
2. **Debounce searches**: Don't query on every keystroke
3. **Cache counts**: Dashboard counts don't need real-time updates
4. **Batch operations**: Group multiple inserts when importing data

### Future Optimizations
- [ ] Add full-text search indexes
- [ ] Implement query result caching in renderer
- [ ] Add virtual scrolling for large lists
- [ ] Optimize dashboard query (single JOIN instead of multiple)

## Security Checklist

✅ **Implemented:**
- Context isolation enabled
- Node integration disabled
- Renderer cannot access filesystem
- All database access via IPC
- File paths validated in main process
- SQL injection prevented (parameterized queries)

⚠️ **Not Yet Implemented:**
- User authentication
- Row-level security (project access control)
- Database encryption (SQLCipher)
- Backup encryption

## Next Implementation Phases

### Phase 1: Projects CRUD ✅ Ready to Implement
Add Projects table CRUD operations to complete the database foundation.

**Tasks:**
1. Add `createProject`, `listProjects`, `updateProject`, `deleteProject` to queries.js
2. Add IPC handlers in main.cjs
3. Add `useProjects()` hook
4. Wire to Projects List page
5. Test project creation and dashboard access

### Phase 2: Migration System
Replace manual table creation with proper migration management.

**Tasks:**
1. Generate initial migration: `npx drizzle-kit generate:sqlite`
2. Create migration runner
3. Add migration status tracking table
4. Test migration rollback

### Phase 3: Data Seeding (Development)
Create sample data for development and testing.

**Tasks:**
1. Create seed.js with sample projects
2. Add `db:seed` IPC handler (dev only)
3. Add seed button in dev tools or settings
4. Document seed data structure

### Phase 4: Backup/Restore
Allow users to backup and restore their data.

**Tasks:**
1. Add export database function
2. Add import database function
3. Add backup/restore UI in settings
4. Implement backup encryption
5. Add automatic backup on app update

## Resources

- **Drizzle ORM Docs**: https://orm.drizzle.team/docs/overview
- **Better SQLite3 Docs**: https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md
- **Electron IPC Guide**: https://www.electronjs.org/docs/latest/tutorial/ipc

## Support

For issues or questions:
1. Check `DATABASE_IMPLEMENTATION.md` for detailed documentation
2. Review example component in `src/components/examples/database-integration-example.tsx`
3. Run unit tests to verify database behavior
4. Check console logs for IPC communication errors

---

**Implementation Complete**: Core database layer with RFIs, Equipment, Cost Codes ✅  
**Status**: Ready for UI integration  
**Next**: Wire existing pages to database hooks
