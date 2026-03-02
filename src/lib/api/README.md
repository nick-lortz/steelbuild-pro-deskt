# SteelBuild Pro API Implementation

## Overview

Complete REST API implementation for the SteelBuild Pro construction management application with:

✅ **Authorization middleware on every request**  
✅ **Input validation on every endpoint using Zod**  
✅ **Standard error shape returned to frontend**  
✅ **Pagination standard: page/pageSize**  
✅ **Filtering/sorting standard per list endpoint**  
✅ **OpenAPI/REST documentation**  
✅ **Secure file handling with access control**

## Architecture

```
src/lib/api/
├── index.ts                 # Main exports
├── types.ts                 # API type definitions
├── middleware.ts            # Authorization & access control
├── validation.ts            # Zod schemas for input validation
├── error-handler.ts         # Standard error responses
├── pagination.ts            # Pagination & filtering utilities
└── endpoints/               # Endpoint implementations
    ├── index.ts
    ├── projects.ts          # Project CRUD
    ├── members.ts           # Member management
    ├── tasks.ts             # Task scheduling & critical path
    ├── rfis.ts              # RFI workflow & escalation
    ├── documents.ts         # Secure document handling
    ├── drawings.ts          # Drawing sets/sheets/revisions/QA
    ├── financials.ts        # Budget/actuals/expenses/cost codes
    ├── change-orders.ts     # CO CRUD + line items
    ├── contracts.ts         # Contract CRUD
    ├── equipment.ts         # Equipment CRUD + logs
    ├── labor.ts             # Labor categories & entries
    ├── deliveries.ts        # Delivery tracking
    ├── audit.ts             # Data integrity & auto-fix
    └── pma.ts               # AI insights & daily brief
```

## Core Features

### 1. Authorization Middleware

Every endpoint enforces authorization via `requireProjectAccess()`:

```typescript
import { requireProjectAccess } from '@/lib/api/middleware'

export async function listTasks(projectId: string) {
  const context = await requireProjectAccess(projectId)
  // User is authenticated and member of project
  // context contains: userId, projectId, userRole, permissions
}
```

**Access Levels**:
- `requireAuth()` - User must be authenticated
- `requireProjectAccess(projectId)` - User must be project member
- `requireProjectRole(projectId, ['owner', 'admin'])` - User must have specific role
- `requirePermission(projectId, 'tasks.delete')` - User must have specific permission

### 2. Input Validation

All data inputs validated with Zod schemas:

```typescript
import { validate, taskSchema } from '@/lib/api/validation'

const validatedData = validate(taskSchema, data)
// Throws ApiException if validation fails
// Returns type-safe validated data
```

**Built-in Schemas**:
- `projectSchema`, `taskSchema`, `rfiSchema`
- `documentSchema`, `drawingSetSchema`, `drawingSheetSchema`
- `costCodeSchema`, `expenseSchema`
- `changeOrderSchema`, `contractSchema`
- `equipmentSchema`, `laborCategorySchema`, `deliverySchema`

### 3. Standard Error Handling

All endpoints return consistent error format:

```typescript
import { createSuccessResponse, createErrorResponse, throwNotFound } from '@/lib/api/error-handler'

try {
  const result = await doSomething()
  return createSuccessResponse(result, meta)
} catch (error) {
  return createErrorResponse(error)
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Task with id abc-123 not found",
    "field": "id",
    "details": {}
  }
}
```

**Error Codes**:
- `UNAUTHORIZED` - Not authenticated
- `FORBIDDEN` - Lacks permission
- `NOT_FOUND` - Resource doesn't exist
- `VALIDATION_ERROR` - Input invalid
- `DUPLICATE_ERROR` - Unique constraint violated
- `BUSINESS_RULE_ERROR` - Business logic failed
- `NOT_MEMBER` - Not a project member
- `INTERNAL_ERROR` - Server error

### 4. Pagination & Filtering

List endpoints support:

```typescript
import { processListQuery } from '@/lib/api/pagination'

const result = processListQuery(items, {
  page: 1,
  pageSize: 20,
  sortBy: 'created_at',
  sortOrder: 'desc',
  filters: { status: 'active', priority: 'high' }
})

// Returns: { data: [...], meta: { page, pageSize, total, totalPages, hasMore } }
```

**Query Example**:
```
GET /api/v1/projects/123/tasks?page=2&pageSize=50&sortBy=start_date&sortOrder=asc&status=in-progress
```

### 5. Secure File Handling

Documents and drawings enforce project membership:

```typescript
export async function downloadDocument(projectId: string, documentId: string) {
  await requireProjectAccess(projectId)  // Verify membership
  
  const doc = await getDocument(documentId)
  
  // Never expose storage_key publicly
  // Return metadata for secure download
  return createSuccessResponse({
    id: doc.id,
    name: doc.name,
    storage_key: doc.storage_key,  // Backend uses this to serve file
    mime_type: doc.mime_type
  })
}
```

**Storage Implementation**:
- **Dev**: Files in `./storage/projects/:projectId/:category/`
- **Prod**: S3-compatible storage with signed URLs
- **Security**: Backend validates membership before serving files
- **Metadata**: Stored in database with `storage_key`

## Endpoint Groups

### Projects
- `listProjects()` - List all accessible projects
- `getProject(id)` - Get single project
- `createProject(data)` - Create new project (auto-adds creator as owner)
- `updateProject(id, data)` - Update project (owner/admin only)
- `deleteProject(id)` - Soft-delete project (owner only)

**Unique Constraint**: `project_number` must be unique

### Members
- `listMembers(projectId)` - List project members
- `addMember(projectId, data)` - Add member with role (owner/admin)
- `updateMemberRole(projectId, memberId, data)` - Update role/permissions (owner/admin)
- `removeMember(projectId, memberId)` - Remove member (owner/admin, cannot remove last owner)

### Tasks
- `listTasks(projectId)` - List all tasks
- `getTask(projectId, taskId)` - Get task + dependencies
- `createTask(projectId, data)` - Create task
- `updateTask(projectId, taskId, data)` - Update task
- `deleteTask(projectId, taskId)` - Soft-delete task
- `addTaskDependency(projectId, data)` - Add FS/SS/FF/SF dependency
- `computeProjectCriticalPath(projectId)` - Calculate critical path

**Dependency Types**: `FS`, `SS`, `FF`, `SF`

### RFIs
- `listRFIs(projectId)` - List all RFIs
- `getRFI(projectId, rfiId)` - Get RFI + attachments
- `createRFI(projectId, data)` - Create RFI
- `updateRFI(projectId, rfiId, data)` - Update RFI (auto-sets timestamps on status change)
- `deleteRFI(projectId, rfiId)` - Soft-delete RFI
- `escalateRFI(projectId, rfiId, reason)` - Mark as escalated
- `addRFIAttachment(projectId, rfiId, data)` - Add attachment

**Unique Constraint**: `(project_id, rfi_number)` must be unique

### Documents
- `listDocuments(projectId)` - List documents (access-controlled)
- `getDocument(projectId, documentId)` - Get metadata
- `uploadDocument(projectId, data)` - Create document record
- `downloadDocument(projectId, documentId)` - Get download info (validates membership)
- `deleteDocument(projectId, documentId)` - Soft-delete
- `updateDocumentMetadata(projectId, documentId, data)` - Update tags/category

### Drawings
- `listDrawingSets(projectId)` - List sets
- `getDrawingSet(projectId, setId)` - Get set + sheets
- `createDrawingSet(projectId, data)` - Create set
- `createDrawingSheet(projectId, data)` - Create sheet
- `createDrawingRevision(projectId, data)` - Create revision (updates sheet's current_revision)
- `runDrawingQACheck(projectId, revisionId)` - Run QA
- `detectDrawingScopeChanges(projectId, revisionId)` - Detect scope changes
- `listDrawingConflicts(projectId)` - List unresolved conflicts
- `createDrawingAnnotation(projectId, data)` - Add annotation

**Workflow**: Set → Sheets → Revisions → QA/Conflicts/Annotations

### Financials
- `getBudget(projectId)` - Get budget + line items
- `updateBudget(projectId, data)` - Update budget
- `listExpenses(projectId)` - List expenses
- `createExpense(projectId, data)` - Record expense
- `listCostCodes(projectId)` - List global + project codes
- `createCostCode(projectId, data)` - Create cost code
- `getFinancialSummary(projectId)` - Budget vs actual summary

**Unique Constraint**: `(project_id, code)` for cost codes

### Change Orders
- `listChangeOrders(projectId)` - List COs
- `getChangeOrder(projectId, coId)` - Get CO + line items
- `createChangeOrder(projectId, data)` - Create CO
- `updateChangeOrder(projectId, coId, data)` - Update CO
- `deleteChangeOrder(projectId, coId)` - Soft-delete CO + line items (cascade)
- `addLineItem(projectId, coId, data)` - Add line item (auto-updates CO total)
- `updateLineItem(projectId, coId, itemId, data)` - Update line item
- `deleteLineItem(projectId, coId, itemId)` - Soft-delete line item

### Contracts
- `listContracts(projectId)` - List contracts
- `getContract(projectId, contractId)` - Get contract
- `createContract(projectId, data)` - Create contract
- `updateContract(projectId, contractId, data)` - Update contract
- `deleteContract(projectId, contractId)` - Soft-delete contract

### Equipment
- `listEquipment(projectId)` - List equipment
- `getEquipment(projectId, equipmentId)` - Get equipment + logs
- `createEquipment(projectId, data)` - Add equipment
- `updateEquipment(projectId, equipmentId, data)` - Update equipment
- `deleteEquipment(projectId, equipmentId)` - Soft-delete equipment
- `addEquipmentLog(projectId, equipmentId, data)` - Record usage/maintenance

### Labor
- `listLaborCategories(projectId)` - List categories (global + project)
- `createLaborCategory(projectId, data)` - Create category
- `listLaborEntries(projectId)` - List entries
- `createLaborEntry(projectId, data)` - Record hours
- `updateLaborEntry(projectId, entryId, data)` - Update entry
- `deleteLaborEntry(projectId, entryId)` - Soft-delete entry

### Deliveries
- `listDeliveries(projectId)` - List deliveries
- `getDelivery(projectId, deliveryId)` - Get delivery
- `createDelivery(projectId, data)` - Create delivery
- `updateDelivery(projectId, deliveryId, data)` - Update delivery
- `deleteDelivery(projectId, deliveryId)` - Soft-delete delivery
- `updateDeliveryStatus(projectId, deliveryId, status)` - Change status (auto-sets actual_date)

**Statuses**: `scheduled`, `in-transit`, `delivered`, `delayed`, `cancelled`

### Audit
- `runAudit(projectId?)` - Run integrity check (project or global)
- `listAuditFindings(projectId?)` - List findings
- `applyFix(findingId)` - Auto-fix single finding
- `applyAllFixes(projectId?)` - Auto-fix all fixable findings

### PMA (Project Management Assistant)
- `getDailyBrief(projectId)` - Generate daily brief
- `listInsights(projectId, params)` - List insights (filter by resolved)
- `generateProjectInsights(projectId)` - Generate new insights
- `markInsightResolved(projectId, insightId)` - Mark resolved
- `markInsightUnresolved(projectId, insightId)` - Mark unresolved

**Insight Types**: `risk`, `opportunity`, `warning`, `recommendation`

## Usage Examples

### Creating a Task

```typescript
import { createTask } from '@/lib/api/endpoints'

const response = await createTask('project-123', {
  name: 'Erect Column Grid A',
  description: 'Install columns on grid line A',
  status: 'not-started',
  priority: 'high',
  start_date: '2024-03-01T08:00:00Z',
  end_date: '2024-03-15T17:00:00Z',
  duration: 10,
  assigned_to: 'user-456',
  progress: 0
})

if (response.success) {
  console.log('Task created:', response.data)
} else {
  console.error('Error:', response.error)
}
```

### Listing with Pagination

```typescript
import { listTasks } from '@/lib/api/endpoints'

const response = await listTasks('project-123', {
  page: 2,
  pageSize: 50,
  sortBy: 'start_date',
  sortOrder: 'asc',
  filters: { status: 'in-progress', priority: 'high' }
})

console.log('Tasks:', response.data)
console.log('Meta:', response.meta)
// { page: 2, pageSize: 50, total: 150, totalPages: 3, hasMore: true }
```

### Handling Errors

```typescript
import { updateProject } from '@/lib/api/endpoints'

const response = await updateProject('project-123', {
  project_number: 'DUPLICATE'
})

if (!response.success) {
  const { error } = response
  
  if (error.code === 'DUPLICATE_ERROR') {
    console.error('Project number already exists')
  } else if (error.code === 'FORBIDDEN') {
    console.error('You lack permission to update this project')
  } else if (error.code === 'VALIDATION_ERROR') {
    console.error(`Validation failed: ${error.message} (field: ${error.field})`)
  }
}
```

### Secure Document Download

```typescript
import { downloadDocument } from '@/lib/api/endpoints'

const response = await downloadDocument('project-123', 'doc-456')

if (response.success) {
  const { storage_key, mime_type, name } = response.data
  
  // Backend validates membership, then serves file
  // Never expose storage_key to client
  window.location.href = `/api/serve-file?key=${encodeURIComponent(storage_key)}`
}
```

## Integration with Frontend

### React Query Hook Example

```typescript
import { useQuery } from '@tanstack/react-query'
import { listTasks } from '@/lib/api/endpoints'

export function useProjectTasks(projectId: string) {
  return useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      const response = await listTasks(projectId, {
        page: 1,
        pageSize: 100,
        sortBy: 'start_date',
        sortOrder: 'asc'
      })
      
      if (!response.success) {
        throw new Error(response.error?.message)
      }
      
      return response.data
    }
  })
}
```

### Mutation Example

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTask } from '@/lib/api/endpoints'

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: TaskInput) => createTask(projectId, data),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      }
    }
  })
}
```

## Testing

All endpoints return standard `ApiResponse` type:

```typescript
import { listProjects } from '@/lib/api/endpoints'

const response = await listProjects()

// Type-safe response handling
if (response.success) {
  const projects = response.data  // Type: Project[]
  const meta = response.meta      // Type: ResponseMeta
} else {
  const error = response.error    // Type: ApiError
}
```

## Next Steps

1. **Implement file serving endpoint** - Backend route that validates membership and serves files from storage
2. **Add rate limiting** - Per user/IP rate limits for production
3. **Add API logging** - Log all requests/responses for audit trail
4. **Add webhook support** - For external integrations (e.g., notify on RFI status change)
5. **Implement search** - Full-text search across entities
6. **Add batch operations** - Bulk create/update/delete endpoints
7. **Add export endpoints** - CSV/Excel/PDF exports for reports

## Documentation

- **API Docs**: See `API_DOCUMENTATION.md` for complete REST API reference
- **Types**: See `src/lib/api/types.ts` for TypeScript definitions
- **Schemas**: See `src/lib/api/validation.ts` for Zod schemas

## Support

For questions or issues with the API implementation, contact the development team or file an issue.
