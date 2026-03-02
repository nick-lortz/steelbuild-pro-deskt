# SteelBuild Pro REST API Documentation

## Overview

The SteelBuild Pro API provides comprehensive endpoints for managing construction projects, including scheduling, financials, RFIs, drawings, equipment, labor, and more.

**Base URL**: `/api/v1`

## Authentication

All endpoints require authentication via the Spark user context. The API uses session-based authentication managed by the Spark runtime.

## Authorization

Project-scoped endpoints require membership in the specified project. User roles:
- `owner`: Full access to all project resources
- `admin`: Can edit and delete most resources, manage members
- `member`: Can create and edit assigned resources
- `viewer`: Read-only access

## Standard Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5,
    "hasMore": true
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Name is required",
    "field": "name",
    "details": { ... }
  }
}
```

## Error Codes

- `UNAUTHORIZED`: User is not authenticated
- `FORBIDDEN`: User lacks required permissions
- `NOT_FOUND`: Resource does not exist
- `VALIDATION_ERROR`: Input validation failed
- `DUPLICATE_ERROR`: Resource with unique constraint already exists
- `BUSINESS_RULE_ERROR`: Business rule validation failed
- `NOT_MEMBER`: User is not a member of the project
- `INTERNAL_ERROR`: Server error occurred

## Pagination

List endpoints support pagination via query parameters:
- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 20, max: 100)
- `sortBy`: Field to sort by
- `sortOrder`: `asc` or `desc` (default: `asc`)

Example: `GET /api/v1/projects/123/tasks?page=2&pageSize=50&sortBy=start_date&sortOrder=desc`

## Filtering

List endpoints support filtering via query parameters matching entity fields.

Example: `GET /api/v1/projects/123/tasks?status=in-progress&priority=high`

---

## Projects

### List Projects
`GET /api/v1/projects`

Returns all projects the current user has access to.

**Query Parameters**: Standard pagination and filtering

**Response**: Array of Project objects

### Get Project
`GET /api/v1/projects/:projectId`

Returns a single project by ID.

**Authorization**: Requires project membership

### Create Project
`POST /api/v1/projects`

Creates a new project and adds the creator as owner.

**Request Body**:
```json
{
  "project_number": "P-2024-001",
  "name": "Downtown Steel Erection",
  "client": "ABC Construction",
  "location": "123 Main St, City, State",
  "status": "planning",
  "start_date": "2024-01-01T00:00:00Z",
  "end_date": "2024-12-31T23:59:59Z",
  "contract_value": 1500000.00,
  "description": "Steel erection for 20-story building",
  "manager_id": "user-id"
}
```

**Uniqueness**: `project_number` must be unique

### Update Project
`PATCH /api/v1/projects/:projectId`

Updates an existing project.

**Authorization**: Requires owner or admin role

**Request Body**: Partial Project object

### Delete Project
`DELETE /api/v1/projects/:projectId`

Soft-deletes a project (sets `deleted_at`).

**Authorization**: Requires owner role

---

## Project Members

### List Members
`GET /api/v1/projects/:projectId/members`

Returns all members of a project.

### Add Member
`POST /api/v1/projects/:projectId/members`

Adds a user to the project with specified role and permissions.

**Authorization**: Requires owner or admin role

**Request Body**:
```json
{
  "user_id": "user-123",
  "role": "member",
  "permissions": ["tasks.create", "tasks.edit"]
}
```

### Update Member Role
`PATCH /api/v1/projects/:projectId/members/:memberId`

Updates member role or permissions.

**Authorization**: Requires owner or admin role

### Remove Member
`DELETE /api/v1/projects/:projectId/members/:memberId`

Removes a member from the project.

**Authorization**: Requires owner or admin role

**Note**: Cannot remove the last owner

---

## Tasks

### List Tasks
`GET /api/v1/projects/:projectId/tasks`

Returns all tasks for a project.

**Query Parameters**: Standard pagination, filtering, sorting

### Get Task
`GET /api/v1/projects/:projectId/tasks/:taskId`

Returns a single task with its dependencies.

### Create Task
`POST /api/v1/projects/:projectId/tasks`

Creates a new task.

**Authorization**: Requires member role or higher

**Request Body**:
```json
{
  "name": "Erect Column Grid A",
  "description": "Install columns on grid line A, floors 1-5",
  "status": "not-started",
  "priority": "high",
  "start_date": "2024-03-01T08:00:00Z",
  "end_date": "2024-03-15T17:00:00Z",
  "duration": 10,
  "assigned_to": "user-id",
  "parent_id": null,
  "wbs": "1.2.3",
  "progress": 0
}
```

### Update Task
`PATCH /api/v1/projects/:projectId/tasks/:taskId`

Updates an existing task.

**Authorization**: Requires member role or higher

### Delete Task
`DELETE /api/v1/projects/:projectId/tasks/:taskId`

Soft-deletes a task.

**Authorization**: Requires member role or higher

### Add Task Dependency
`POST /api/v1/projects/:projectId/tasks/dependencies`

Adds a dependency between two tasks.

**Request Body**:
```json
{
  "predecessor_id": "task-1",
  "successor_id": "task-2",
  "type": "FS"
}
```

**Dependency Types**: `FS` (Finish-to-Start), `SS` (Start-to-Start), `FF` (Finish-to-Finish), `SF` (Start-to-Finish)

### Compute Critical Path
`POST /api/v1/projects/:projectId/tasks/critical-path`

Computes the critical path for the project schedule.

**Response**: Array of task IDs on critical path with slack values

---

## RFIs (Requests for Information)

### List RFIs
`GET /api/v1/projects/:projectId/rfis`

Returns all RFIs for a project.

### Get RFI
`GET /api/v1/projects/:projectId/rfis/:rfiId`

Returns a single RFI with attachments.

### Create RFI
`POST /api/v1/projects/:projectId/rfis`

Creates a new RFI.

**Request Body**:
```json
{
  "rfi_number": "RFI-001",
  "title": "Connection detail clarification",
  "description": "Please clarify beam-to-column connection at grid B-3",
  "category": "structural",
  "priority": "high",
  "status": "draft",
  "submitted_by": "user-id",
  "assigned_to": "engineer-id",
  "due_date": "2024-03-20T17:00:00Z",
  "cost_impact": 5000.00,
  "schedule_impact": 3,
  "drawing_refs": ["S-201", "S-301"],
  "spec_refs": ["05120"]
}
```

**Uniqueness**: `(project_id, rfi_number)` must be unique

### Update RFI
`PATCH /api/v1/projects/:projectId/rfis/:rfiId`

Updates an RFI. Automatically sets timestamps when status changes.

### Delete RFI
`DELETE /api/v1/projects/:projectId/rfis/:rfiId`

Soft-deletes an RFI.

### Escalate RFI
`POST /api/v1/projects/:projectId/rfis/:rfiId/escalate`

Marks an RFI as escalated with reason.

**Request Body**:
```json
{
  "reason": "No response received after 10 days"
}
```

### Add RFI Attachment
`POST /api/v1/projects/:projectId/rfis/:rfiId/attachments`

Adds an attachment to an RFI.

**Request Body**:
```json
{
  "name": "connection-detail.pdf",
  "storage_key": "s3://bucket/path/to/file",
  "file_size": 2048576,
  "mime_type": "application/pdf"
}
```

---

## Documents

All document endpoints enforce project membership access control.

### List Documents
`GET /api/v1/projects/:projectId/documents`

Returns all documents for a project.

### Get Document
`GET /api/v1/projects/:projectId/documents/:documentId`

Returns document metadata.

### Upload Document
`POST /api/v1/projects/:projectId/documents`

Creates a document record after file upload.

**Request Body**:
```json
{
  "name": "Steel Shop Drawings - Package 1",
  "type": "drawing",
  "category": "shop-drawings",
  "storage_key": "s3://bucket/projects/123/docs/file.pdf",
  "file_size": 10485760,
  "mime_type": "application/pdf",
  "tags": ["shop-drawings", "package-1"],
  "version": "1.0",
  "uploaded_by": "user-id"
}
```

### Download Document
`GET /api/v1/projects/:projectId/documents/:documentId/download`

Returns document download information (storage key and metadata).

**Security**: Backend must validate project membership before serving file

### Delete Document
`DELETE /api/v1/projects/:projectId/documents/:documentId`

Soft-deletes a document.

### Update Document Metadata
`PATCH /api/v1/projects/:projectId/documents/:documentId`

Updates document tags or category.

---

## Drawings

### List Drawing Sets
`GET /api/v1/projects/:projectId/drawings/sets`

Returns all drawing sets for a project.

### Get Drawing Set
`GET /api/v1/projects/:projectId/drawings/sets/:setId`

Returns a drawing set with all sheets.

### Create Drawing Set
`POST /api/v1/projects/:projectId/drawings/sets`

Creates a new drawing set.

**Request Body**:
```json
{
  "name": "Structural Steel Package 1",
  "discipline": "structural",
  "status": "draft",
  "issue_date": null,
  "description": "Columns and beams, grids A-D"
}
```

### Create Drawing Sheet
`POST /api/v1/projects/:projectId/drawings/sheets`

Creates a sheet within a drawing set.

**Request Body**:
```json
{
  "drawing_set_id": "set-id",
  "sheet_number": "S-201",
  "title": "Second Floor Framing Plan",
  "discipline": "structural",
  "scale": "1/4\" = 1'-0\"",
  "description": "Beam and joist layout"
}
```

### Create Drawing Revision
`POST /api/v1/projects/:projectId/drawings/revisions`

Creates a new revision of a sheet. Updates sheet's `current_revision`.

**Request Body**:
```json
{
  "drawing_sheet_id": "sheet-id",
  "revision": "B",
  "issue_date": "2024-03-15T00:00:00Z",
  "description": "Modified connection at grid B-3",
  "storage_key": "s3://bucket/drawings/S-201-Rev-B.pdf",
  "file_size": 5242880,
  "issued_by": "user-id"
}
```

### Run Drawing QA
`POST /api/v1/projects/:projectId/drawings/revisions/:revisionId/qa`

Runs automated QA checks on a drawing revision.

**Response**: QA status and issues found

### Detect Scope Changes
`POST /api/v1/projects/:projectId/drawings/revisions/:revisionId/scope-changes`

Analyzes a revision for potential scope changes.

**Response**: Array of detected scope change flags

### List Drawing Conflicts
`GET /api/v1/projects/:projectId/drawings/conflicts`

Returns unresolved drawing conflicts.

### Create Drawing Annotation
`POST /api/v1/projects/:projectId/drawings/annotations`

Adds an annotation to a drawing sheet.

**Request Body**:
```json
{
  "sheet_id": "sheet-id",
  "x": 450,
  "y": 300,
  "content": "Verify clearance here",
  "type": "note"
}
```

---

## Financials

### Get Budget
`GET /api/v1/projects/:projectId/financials/budget`

Returns the project budget with line items.

### Update Budget
`PATCH /api/v1/projects/:projectId/financials/budget`

Updates budget totals or line items.

**Request Body**:
```json
{
  "total_budget": 1500000.00,
  "line_items": [
    {
      "cost_code_id": "cc-1",
      "amount": 500000.00
    }
  ]
}
```

### List Expenses
`GET /api/v1/projects/:projectId/financials/expenses`

Returns all project expenses.

### Create Expense
`POST /api/v1/projects/:projectId/financials/expenses`

Records a new expense.

**Request Body**:
```json
{
  "cost_code_id": "cc-1",
  "description": "Crane rental - Week 12",
  "amount": 8500.00,
  "date": "2024-03-15T00:00:00Z",
  "category": "equipment",
  "vendor": "ABC Crane Services",
  "receipt_url": null,
  "approved": false,
  "approved_by": null
}
```

### List Cost Codes
`GET /api/v1/projects/:projectId/financials/cost-codes`

Returns all cost codes (global + project-specific).

### Create Cost Code
`POST /api/v1/projects/:projectId/financials/cost-codes`

Creates a cost code (project-specific or global if `projectId` is null).

**Request Body**:
```json
{
  "code": "05120",
  "name": "Structural Steel",
  "category": "material",
  "type": "material",
  "budget": 750000.00,
  "description": "Wide-flange beams and columns"
}
```

**Uniqueness**: `(project_id, code)` must be unique

### Get Financial Summary
`GET /api/v1/projects/:projectId/financials/summary`

Returns budget vs actual summary with variance.

---

## Change Orders

### List Change Orders
`GET /api/v1/projects/:projectId/change-orders`

Returns all change orders for a project.

### Get Change Order
`GET /api/v1/projects/:projectId/change-orders/:coId`

Returns a change order with line items.

### Create Change Order
`POST /api/v1/projects/:projectId/change-orders`

Creates a new change order.

**Request Body**:
```json
{
  "co_number": "CO-001",
  "title": "Additional steel for mezzanine",
  "description": "Owner requested mezzanine addition",
  "status": "draft",
  "requested_by": "user-id",
  "approved_by": null,
  "request_date": "2024-03-10T00:00:00Z",
  "approval_date": null,
  "reason": "Scope addition"
}
```

### Update Change Order
`PATCH /api/v1/projects/:projectId/change-orders/:coId`

Updates a change order.

### Delete Change Order
`DELETE /api/v1/projects/:projectId/change-orders/:coId`

Soft-deletes a change order and all line items.

### Add Line Item
`POST /api/v1/projects/:projectId/change-orders/:coId/line-items`

Adds a line item to a change order. Automatically updates CO total.

**Request Body**:
```json
{
  "cost_code_id": "cc-1",
  "description": "W12x26 beams x 20 EA",
  "quantity": 20,
  "unit": "EA",
  "unit_cost": 450.00,
  "total_cost": 9000.00,
  "notes": null
}
```

### Update Line Item
`PATCH /api/v1/projects/:projectId/change-orders/:coId/line-items/:itemId`

Updates a line item.

### Delete Line Item
`DELETE /api/v1/projects/:projectId/change-orders/:coId/line-items/:itemId`

Soft-deletes a line item.

---

## Contracts

### List Contracts
`GET /api/v1/projects/:projectId/contracts`

Returns all contracts for a project.

### Get Contract
`GET /api/v1/projects/:projectId/contracts/:contractId`

Returns a single contract.

### Create Contract
`POST /api/v1/projects/:projectId/contracts`

Creates a new contract.

**Request Body**:
```json
{
  "contract_number": "CONT-2024-001",
  "title": "Steel Erection Subcontract",
  "type": "subcontract",
  "vendor": "XYZ Steel Erectors",
  "status": "active",
  "start_date": "2024-03-01T00:00:00Z",
  "end_date": "2024-09-30T23:59:59Z",
  "value": 500000.00,
  "description": "Erection of structural steel",
  "terms": "Net 30 payment terms"
}
```

### Update Contract
`PATCH /api/v1/projects/:projectId/contracts/:contractId`

Updates a contract.

### Delete Contract
`DELETE /api/v1/projects/:projectId/contracts/:contractId`

Soft-deletes a contract.

---

## Equipment

### List Equipment
`GET /api/v1/projects/:projectId/equipment`

Returns all equipment for a project.

### Get Equipment
`GET /api/v1/projects/:projectId/equipment/:equipmentId`

Returns equipment details with logs.

### Create Equipment
`POST /api/v1/projects/:projectId/equipment`

Adds equipment to a project.

**Request Body**:
```json
{
  "name": "Tower Crane #1",
  "type": "crane",
  "model": "Liebherr 630 EC-H",
  "serial_number": "12345",
  "status": "available",
  "acquisition_date": "2024-01-01T00:00:00Z",
  "cost": 250000.00,
  "location": "Site NW corner",
  "assigned_to": null
}
```

### Update Equipment
`PATCH /api/v1/projects/:projectId/equipment/:equipmentId`

Updates equipment details.

### Delete Equipment
`DELETE /api/v1/projects/:projectId/equipment/:equipmentId`

Soft-deletes equipment.

### Add Equipment Log
`POST /api/v1/projects/:projectId/equipment/:equipmentId/logs`

Records equipment usage or maintenance.

**Request Body**:
```json
{
  "type": "usage",
  "description": "Operated for steel erection",
  "hours": 8.5
}
```

---

## Labor

### List Labor Categories
`GET /api/v1/projects/:projectId/labor/categories`

Returns labor categories (global + project-specific).

### Create Labor Category
`POST /api/v1/projects/:projectId/labor/categories`

Creates a labor category.

**Request Body**:
```json
{
  "name": "Ironworker - Journeyman",
  "code": "IW-J",
  "rate": 55.00,
  "unit": "hour",
  "description": "Certified structural ironworker"
}
```

### List Labor Entries
`GET /api/v1/projects/:projectId/labor/entries`

Returns all labor entries for a project.

### Create Labor Entry
`POST /api/v1/projects/:projectId/labor/entries`

Records labor hours.

**Request Body**:
```json
{
  "category_id": "cat-1",
  "worker_name": "John Smith",
  "date": "2024-03-15T00:00:00Z",
  "hours": 8.0,
  "cost_code_id": "cc-1",
  "notes": "Grid A column erection"
}
```

### Update Labor Entry
`PATCH /api/v1/projects/:projectId/labor/entries/:entryId`

Updates a labor entry.

### Delete Labor Entry
`DELETE /api/v1/projects/:projectId/labor/entries/:entryId`

Soft-deletes a labor entry.

---

## Deliveries

### List Deliveries
`GET /api/v1/projects/:projectId/deliveries`

Returns all deliveries for a project.

### Get Delivery
`GET /api/v1/projects/:projectId/deliveries/:deliveryId`

Returns a single delivery.

### Create Delivery
`POST /api/v1/projects/:projectId/deliveries`

Creates a delivery record.

**Request Body**:
```json
{
  "delivery_number": "DEL-2024-015",
  "description": "Wide-flange beams - Package 1",
  "vendor": "ABC Steel Mill",
  "scheduled_date": "2024-03-20T08:00:00Z",
  "actual_date": null,
  "status": "scheduled",
  "items": [
    {
      "description": "W12x26 beams",
      "quantity": 20,
      "unit": "EA"
    }
  ],
  "notes": "Deliver to NW staging area"
}
```

### Update Delivery
`PATCH /api/v1/projects/:projectId/deliveries/:deliveryId`

Updates a delivery.

### Delete Delivery
`DELETE /api/v1/projects/:projectId/deliveries/:deliveryId`

Soft-deletes a delivery.

### Update Delivery Status
`POST /api/v1/projects/:projectId/deliveries/:deliveryId/status`

Changes delivery status. Automatically sets `actual_date` when marked delivered.

**Request Body**:
```json
{
  "status": "delivered"
}
```

**Statuses**: `scheduled`, `in-transit`, `delivered`, `delayed`, `cancelled`

---

## Audit

### Run Audit
`POST /api/v1/audit/run`

Runs data integrity audit (global or project-specific).

**Query Parameters**:
- `projectId` (optional): Run audit for specific project

**Response**: Audit run ID and findings

### List Audit Findings
`GET /api/v1/audit/findings`

Returns all audit findings.

**Query Parameters**:
- `projectId` (optional): Filter by project

### Apply Fix
`POST /api/v1/audit/findings/:findingId/fix`

Applies auto-fix for a specific finding.

### Apply All Fixes
`POST /api/v1/audit/fix-all`

Applies all auto-fixable findings.

**Query Parameters**:
- `projectId` (optional): Limit to specific project

---

## PMA (Project Management Assistant)

### Get Daily Brief
`GET /api/v1/projects/:projectId/pma/daily-brief`

Generates daily project brief with key metrics and alerts.

**Response**: Summary of schedule health, cost status, critical RFIs, upcoming deliveries, and action items

### List Insights
`GET /api/v1/projects/:projectId/pma/insights`

Returns AI-generated insights and recommendations.

**Query Parameters**:
- `resolved`: `true` or `false` to filter

### Generate Insights
`POST /api/v1/projects/:projectId/pma/generate-insights`

Runs insight generation for the project.

**Response**: Array of newly generated insights

### Mark Insight Resolved
`POST /api/v1/projects/:projectId/pma/insights/:insightId/resolve`

Marks an insight as resolved.

### Mark Insight Unresolved
`POST /api/v1/projects/:projectId/pma/insights/:insightId/unresolve`

Marks an insight as unresolved.

---

## File Storage

### Implementation Notes

**Local Development**: Files stored in local filesystem under `./storage/`

**Production**: Files stored in S3-compatible object storage

**Security**:
- All file downloads must validate project membership via backend
- Storage keys are never exposed directly to clients
- Download endpoints return signed URLs (S3) or stream files (local)
- Document/drawing APIs store metadata + storage key in database
- Actual file serving happens through secure download endpoint

**Storage Key Format**: `s3://bucket-name/projects/:projectId/category/:filename`

---

## Rate Limiting

Not currently implemented. Consider adding rate limiting per user/IP in production.

## Versioning

Current version: `v1`

API versioning via URL path: `/api/v1/...`

---

## Support

For API questions or issues, contact the development team or file an issue in the project repository.
