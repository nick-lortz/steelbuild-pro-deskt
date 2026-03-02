# SteelBuild Pro - SQLite Database Implementation

## Overview

SteelBuild Pro now uses SQLite as its local-first database, providing offline-capable data persistence for the desktop application. The database is the **system of record** for all project data.

## Architecture

### Database Layer Structure

```
packages/db/                    # Database schema and configuration
  ├── schema.js                 # Drizzle ORM schema definitions
  ├── index.js                  # Package exports
  ├── drizzle.config.js         # Drizzle Kit configuration
  └── package.json              # Package dependencies

electron/db/                    # Database implementation for Electron
  ├── init.js                   # Database initialization and table creation
  ├── queries.js                # CRUD operations and business logic
  └── __tests__/
      └── database.test.js      # Unit and integration tests
```

### Security Architecture

- **Renderer Process**: NEVER accesses filesystem or database directly
- **Main Process**: Owns database connection and all queries
- **IPC Layer**: Secure communication bridge via contextBridge
- **Preload Script**: Exposes safe, scoped API (`window.SBP.db`)

## Database Schema

### Core Tables

#### `projects`
- **Purpose**: Project registry and master data
- **Key Fields**: id, project_number (unique), name, status, dates, client info
- **Soft Delete**: Uses `deleted_at` timestamp

#### `rfis`
- **Purpose**: Request for Information tracking
- **Key Fields**: id, project_id (FK), rfi_number, subject, question, status, priority
- **Unique Constraint**: (project_id, rfi_number) - RFI numbers are unique within each project
- **Auto-numbering**: RFI numbers auto-increment per project starting from 1
- **Cascade**: ON DELETE CASCADE with projects

#### `equipment`
- **Purpose**: Equipment registry and tracking
- **Key Fields**: id, project_id (FK), name, type, asset_tag, status, assigned_to
- **Cascade**: ON DELETE CASCADE with projects

#### `cost_codes`
- **Purpose**: Budget and cost tracking
- **Key Fields**: id, project_id (FK), code, description, budget_amount, actual_amount
- **Unique Constraint**: (project_id, code) - Cost codes are unique within each project
- **Cascade**: ON DELETE CASCADE with projects

#### `audit_log`
- **Purpose**: Comprehensive audit trail for all data changes
- **Key Fields**: id, project_id, entity_type, entity_id, action, payload_json, user_id
- **Cascade**: ON DELETE SET NULL with projects (preserves audit history)

### Indexes

```sql
CREATE INDEX idx_rfis_project_id ON rfis(project_id);
CREATE INDEX idx_equipment_project_id ON equipment(project_id);
CREATE INDEX idx_cost_codes_project_id ON cost_codes(project_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
```

## API Reference

### IPC Handlers (Electron Main Process)

All database operations are exposed via IPC handlers in `electron/main.cjs`:

#### Database Initialization
- `db:init` - Initialize database and create tables

#### RFI Operations
- `db:createRFI` - Create new RFI (auto-assigns rfi_number)
- `db:listRFIs` - List RFIs for a project (with pagination/filtering)
- `db:updateRFI` - Update existing RFI
- `db:deleteRFI` - Soft delete RFI

#### Equipment Operations
- `db:createEquipment` - Create equipment entry
- `db:listEquipment` - List equipment for a project
- `db:updateEquipment` - Update equipment
- `db:deleteEquipment` - Soft delete equipment

#### Cost Code Operations
- `db:createCostCode` - Create cost code (enforces uniqueness)
- `db:listCostCodes` - List cost codes for a project
- `db:updateCostCode` - Update cost code
- `db:deleteCostCode` - Soft delete cost code

#### Dashboard Queries
- `db:getDashboardCounts` - Get aggregate counts and totals for project dashboard

### Renderer API (window.SBP.db)

The preload script exposes a safe API to the renderer via `window.SBP.db`:

```typescript
window.SBP.db = {
  init: () => Promise<DBResult>,
  createRFI: (data) => Promise<DBResult<RFI>>,
  listRFIs: (projectId, options?) => Promise<DBResult<RFI[]>>,
  updateRFI: (id, data) => Promise<DBResult>,
  deleteRFI: (id, userId?) => Promise<DBResult>,
  createEquipment: (data) => Promise<DBResult<Equipment>>,
  listEquipment: (projectId, options?) => Promise<DBResult<Equipment[]>>,
  updateEquipment: (id, data) => Promise<DBResult>,
  deleteEquipment: (id, userId?) => Promise<DBResult>,
  createCostCode: (data) => Promise<DBResult<CostCode>>,
  listCostCodes: (projectId, options?) => Promise<DBResult<CostCode[]>>,
  updateCostCode: (id, data) => Promise<DBResult>,
  deleteCostCode: (id, userId?) => Promise<DBResult>,
  getDashboardCounts: (projectId) => Promise<DBResult<DashboardCounts>>,
}
```

## React Hooks

### Usage in Components

```typescript
import { useRFIs, useEquipment, useCostCodes, useDashboardCounts } from '@/hooks/use-database';

function ProjectDashboard() {
  const projectId = 'some-project-id';
  const { counts, loading, error } = useDashboardCounts(projectId);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <p>RFIs: {counts.rfi_count}</p>
      <p>Equipment: {counts.equipment_count}</p>
      <p>Cost Codes: {counts.cost_code_count}</p>
      <p>Total Budget: ${counts.total_budget.toFixed(2)}</p>
      <p>Total Actual: ${counts.total_actual.toFixed(2)}</p>
    </div>
  );
}
```

### Available Hooks

#### `useDatabase()`
Returns database instance and desktop mode flag.

#### `useRFIs(projectId)`
```typescript
const { rfis, loading, error, createRFI, updateRFI, deleteRFI, reload } = useRFIs(projectId);
```

#### `useEquipment(projectId)`
```typescript
const { equipment, loading, error, createEquipment, updateEquipment, deleteEquipment, reload } = useEquipment(projectId);
```

#### `useCostCodes(projectId)`
```typescript
const { costCodes, loading, error, createCostCode, updateCostCode, deleteCostCode, reload } = useCostCodes(projectId);
```

#### `useDashboardCounts(projectId)`
```typescript
const { counts, loading, error, reload } = useDashboardCounts(projectId);
```

## Business Rules

### RFI Numbering
- RFI numbers auto-increment starting from 1 per project
- Numbering is sequential and unique within each project
- Deleted RFIs do not affect the next number calculation
- If `rfi_number` is provided explicitly, it will be used (with uniqueness validation)

```javascript
// Automatic numbering logic
const maxRfi = db
  .select({ maxNum: sql`MAX(${rfis.rfi_number})` })
  .from(rfis)
  .where(and(
    eq(rfis.project_id, data.project_id),
    isNull(rfis.deleted_at)
  ))
  .get();

data.rfi_number = (maxRfi?.maxNum || 0) + 1;
```

### Cost Code Uniqueness
- Cost codes must be unique within a project
- Same code can exist across different projects
- Attempting to create duplicate code returns error: `{ success: false, error: 'Cost code already exists for this project' }`

### Soft Delete Pattern
All entities use soft delete via `deleted_at` timestamp:
- Allows data recovery if needed
- Preserves referential integrity
- Queries filter out deleted records using `WHERE deleted_at IS NULL`

### Audit Logging
Every create, update, and delete operation is logged to `audit_log`:
```javascript
logAudit('rfi', rfiId, 'create', projectId, { subject, question }, userId);
```

## Testing

### Unit Tests
Located in `electron/db/__tests__/database.test.js`

Run tests:
```bash
npm test
```

### Test Coverage

#### RFI Numbering Logic
- ✅ Auto-assign RFI number 1 for first RFI
- ✅ Increment RFI numbers sequentially per project
- ✅ Maintain separate numbering per project
- ✅ Skip deleted RFI numbers when calculating next number

#### Uniqueness Enforcement
- ✅ Enforce unique (project_id, rfi_number) constraint
- ✅ Enforce unique (project_id, code) constraint for cost codes
- ✅ Allow same cost code in different projects
- ✅ Enforce unique project_number constraint

## Data Flow

### Create Operation Flow
1. **UI Component** calls hook method (e.g., `createRFI`)
2. **Hook** invokes `window.SBP.db.createRFI(data)`
3. **Preload** forwards to main via `ipcRenderer.invoke('db:createRFI', data)`
4. **Main Process** IPC handler calls `queries.createRFI(data)`
5. **Query Function**:
   - Generates UUID
   - Auto-assigns RFI number if needed
   - Inserts into SQLite
   - Logs to audit_log
6. **Response** flows back through IPC to UI
7. **Hook** reloads data to reflect changes

### Update Operation Flow
1. Component calls `updateRFI(id, changes)`
2. IPC → Main → Query function
3. Query function:
   - Validates record exists
   - Updates with new `updated_at` timestamp
   - Logs to audit_log
4. Hook reloads data

### Dashboard Counts Query
```sql
-- RFI Count
SELECT COUNT(*) FROM rfis 
WHERE project_id = ? AND deleted_at IS NULL

-- Cost Code Totals
SELECT 
  SUM(budget_amount) as totalBudget,
  SUM(actual_amount) as totalActual
FROM cost_codes
WHERE project_id = ? AND deleted_at IS NULL
```

## Database Location

The SQLite database file is stored in the Electron user data directory:

- **Windows**: `%APPDATA%/SteelBuild Pro/steelbuild.db`
- **macOS**: `~/Library/Application Support/SteelBuild Pro/steelbuild.db`
- **Linux**: `~/.config/SteelBuild Pro/steelbuild.db`

Access path programmatically:
```javascript
const userDataPath = app.getPath("userData");
const dbPath = path.join(userDataPath, 'steelbuild.db');
```

## Migration Strategy (Future)

Currently, tables are created via `createTablesIfNotExists()`. For production, implement proper migrations:

```bash
# Generate migration
npx drizzle-kit generate:sqlite

# Apply migration
npx drizzle-kit push:sqlite
```

## Error Handling

All database operations return a standardized result:

```typescript
interface DBResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
```

### Error Examples

```javascript
// Success
{ success: true, data: { id: '...', subject: 'New RFI', ... } }

// Validation Error
{ success: false, error: 'Cost code already exists for this project' }

// Not Found
{ success: false, error: 'RFI not found' }

// Database Error
{ success: false, error: 'UNIQUE constraint failed: rfis.project_id, rfis.rfi_number' }
```

## Web Mode Fallback

When running in browser (not Electron), hooks return empty data and disabled state:

```typescript
const { isDesktop } = useDatabase();

if (!isDesktop) {
  // Show message: "Database features require desktop app"
  // Or: Use alternative web-based storage (future)
}
```

## Security Considerations

### ✅ Implemented
- Context isolation enabled
- Node integration disabled
- Renderer cannot access filesystem
- All database access via IPC
- File path validation in main process

### 🔒 Future Enhancements
- User authentication/authorization
- Row-level security per project member
- Encrypted database (using SQLCipher)
- Backup and restore functionality

## Performance Optimizations

### Current
- Indexes on foreign keys and frequently queried columns
- WAL mode for better concurrency
- Pagination support in list queries (limit/offset)

### Future
- Query result caching in renderer
- Debounced/throttled updates
- Virtual scrolling for large lists
- Batch operations for bulk inserts

## Troubleshooting

### Database locked error
- Ensure only one Electron instance is running
- Check WAL mode is enabled: `PRAGMA journal_mode = WAL;`

### Tables not created
- Check database initialization in app.whenReady()
- Verify user data directory permissions
- Check console for SQL errors

### RFI numbers not incrementing
- Verify soft delete query excludes `deleted_at IS NOT NULL`
- Check audit logs for previous operations
- Manually inspect database with SQLite browser

## Development Commands

```bash
# Start desktop app with database
npm run desktop:dev

# Run database tests
npm test electron/db/__tests__

# Build production with database
npm run desktop:build

# Inspect database (requires sqlite3)
sqlite3 ~/Library/Application\ Support/SteelBuild\ Pro/steelbuild.db
```

## Next Steps

1. ✅ SQLite schema and initialization
2. ✅ IPC handlers for CRUD operations
3. ✅ React hooks for UI integration
4. ✅ Unit tests for business logic
5. ⏳ Wire hooks to existing UI components
6. ⏳ Add Projects CRUD
7. ⏳ Implement proper migration system
8. ⏳ Add data export/import
9. ⏳ Implement backup/restore
10. ⏳ Add sync capability (future)

---

**Documentation Version**: 1.0  
**Last Updated**: 2025-01-XX  
**Implementation Status**: Core CRUD Complete ✅
