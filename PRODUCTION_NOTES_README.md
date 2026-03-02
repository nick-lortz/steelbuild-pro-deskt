# Production Notes Module

## Overview

The Production Notes module is a fast, production-ready system for tracking fabrication and erection-impacting notes at multiple levels: project, work package, drawing set, piece mark, and field issue/RFI level.

## Features Implemented

### Core UX

✅ **Notes Dashboard**
- Default view with comprehensive filtering and search
- Split-panel layout: list on left, detail on right
- Real-time KPI cards showing critical metrics

✅ **Advanced Filtering**
- Status: open, in_progress, waiting_on, resolved, closed
- Priority: low, medium, high, critical
- Discipline: Structural, Misc Metals, Stairs, Rails, Other
- Category: Fab, Field, Detailing, QC, Safety, Coordination, Delivery, Design Intent
- Assignee filter support
- Date range filtering capability

✅ **Full-Text Search**
- Search across title, body, and tags
- Debounced for performance
- Instant results

✅ **Flexible Sorting**
- Newest first
- By priority
- By status
- By due date
- By last updated

✅ **KPI Dashboard**
- Open Notes count
- Past Due count (with red highlighting)
- High/Critical priority count
- Blockers count
- Notes by Category breakdown

### Data Model

The `ProductionNote` entity includes:

```typescript
interface ProductionNote {
  // Core fields
  id: string (uuid)
  projectId: string (required)
  title: string (required)
  body: string (rich text support)
  
  // Status & workflow
  status: 'open' | 'in_progress' | 'waiting_on' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: 'fab' | 'field' | 'detailing' | 'qc' | 'safety' | 'coordination' | 'delivery' | 'design_intent'
  discipline: 'structural' | 'misc_metals' | 'stairs' | 'rails' | 'other'
  
  // Assignment & tracking
  assignee?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  dueDate?: string
  
  // Blockers
  blocked: boolean (derived from blockers array or waiting_on status)
  blockers: Array<{ description: string; party?: string }>
  waitingOnParty?: string (required when status = waiting_on)
  resolutionSummary?: string (required when status = resolved)
  
  // Linking
  workPackageId?: string
  drawingSetId?: string
  drawingSheetId?: string
  rfiId?: string
  changeOrderId?: string
  pieceMark?: string
  
  // Metadata
  tags: string[]
  attachments: Array<{ url: string; name: string; size: number }>
  visibility: 'internal' | 'shared_with_gc'
}
```

### CRUD & Workflows

✅ **Create Note**
- Modal dialog with comprehensive form
- All required fields validated
- Tags support (comma-separated input)
- Link to related entities (RFIs, drawings, work packages, etc.)

✅ **Edit Note**
- Inline editing in detail panel
- Form validation
- Status workflow enforcement
- Automatic updatedAt timestamp

✅ **Delete Note**
- Confirmation dialog prevents accidental deletion
- Soft-delete ready (can be extended for admin restore)

✅ **Status Workflow Enforcement**
- **Moving to "resolved"**: Requires `resolutionSummary` text field
- **Moving to "waiting_on"**: 
  - Requires at least one blocker entry
  - Requires "waiting on party" field (e.g., GC/Engineer/HVAC)
  - Automatically sets `blocked = true`
- **Blockers**: Can be added/removed; automatically updates `blocked` flag

### Note List Features

✅ **Compact Row Display**
- Color-coded priority indicator (left border)
- Status icon (clock, hourglass, warning, check, X)
- Status pill badge
- Category and discipline badges
- Linked entities preview
- Last updated timestamp
- Assignee name

✅ **Visual Priority Indicators**
- Critical: Red border
- High: Orange border
- Medium: Yellow border
- Low: Blue border

✅ **Blocker Highlighting**
- "Blocked" badge for notes with blockers
- Yellow card in detail view showing all blockers
- Blocker party information

### Detail Panel Features

✅ **View Mode**
- Full note details
- Resolution summary (when resolved)
- Assignment and due date information
- Visibility status (internal vs shared with GC)
- Tags display
- Linked entities with IDs
- Blocker list with party information
- Creation and update metadata

✅ **Edit Mode**
- Inline editing of all fields
- Status dropdown with workflow enforcement
- Priority and category selection
- Add/remove blockers
- Resolution summary when status = resolved
- Waiting on party when status = waiting_on

### Bulk Actions

🔄 **Planned** (not yet implemented):
- Bulk status change
- Bulk assignment
- Bulk tag addition

### Convert Actions

🔄 **Planned** (not yet implemented):
- Convert note → RFI draft (prefill subject/body + links)
- Convert note → Field Issue (prefill)

### Auto-linking

🔄 **Planned** (not yet implemented):
- Detect references like "404E101", sheet numbers, piece marks in body
- Suggest links (non-blocking)

## Permissions

⚠️ **To Be Implemented** (currently uses client-side only):
- Project-scoped access (users see notes only for assigned projects)
- Role-based actions:
  - Admin: full control including restore
  - PM/Lead: create/edit/assign/close
  - General user: create/edit own notes, comment
- Audit trail for status changes, assignments, edits

## Comments & Mentions

🔄 **Planned** (not yet implemented):
- Threaded comments on each note
- @mentions with user notifications

## Notifications

🔄 **Planned** (not yet implemented):
- Notify assignee on:
  - Assignment
  - Status change to waiting_on/critical
  - Due date approaching (3 days)
  - Overdue (daily until changed)
- In-app notifications panel

## Performance

✅ **Current Implementation**:
- Client-side filtering and search (fast for <1000 notes)
- Memoized computations using React useMemo
- Optimistic updates with functional state updates

🔄 **Future Enhancements** (for 5,000+ notes):
- Server-side pagination
- Infinite scroll
- Debounced search (already implemented)
- Optimistic updates with rollback on failure

## UI Polish

✅ **Implemented**:
- Clean, production-ready interface
- Empty states with actionable CTAs
- Loading states
- Error handling with user-friendly messages
- Responsive layout

🔄 **Planned**:
- "Show Guidance Hints" toggle (explain why blocked, next action)
- "What's blocking this?" card in detail view
- Export filtered notes to CSV
- Print-friendly view

## Data Persistence

**Current**: Uses Spark's `useKV` hook for local-first, persistent storage
- Data survives page refreshes
- Per-user storage
- Key: `production-notes-v2`

**Future**: Can be migrated to SQL database for:
- Server-side filtering
- Advanced querying
- Audit trail
- Multi-user collaboration

## File Structure

```
src/pages/production-notes/
├── production-notes-page.tsx          # Main entry point
├── production-notes-dashboard.tsx     # Dashboard with filters and KPIs
├── create-note-dialog.tsx             # Create note modal
└── note-detail-panel.tsx              # Detail view with edit capability
```

## Usage

### Creating a Note

1. Navigate to a project
2. Click "Production Notes" in the secondary navigation
3. Click "New Note" button
4. Fill in required fields (title, description, priority, category, discipline)
5. Optionally add assignee, due date, tags, piece mark, links
6. Click "Create Note"

### Editing a Note

1. Select a note from the list
2. Click "Edit" in the detail panel
3. Modify fields as needed
4. Click "Save" to persist changes

### Managing Blockers

1. Edit a note
2. Change status to "Waiting On"
3. Enter waiting on party (e.g., "GC", "Structural Engineer")
4. Add blocker description
5. Save note - it will automatically be marked as blocked

### Resolving a Note

1. Edit a note
2. Change status to "Resolved"
3. Enter resolution summary (required)
4. Save note

## Testing Checklist

- [x] Create note with all fields
- [x] Create note with only required fields
- [x] Edit note and change status
- [x] Add blockers to note
- [x] Change status to waiting_on (requires blocker and party)
- [x] Change status to resolved (requires resolution summary)
- [x] Delete note with confirmation
- [x] Search notes by title, body, tags
- [x] Filter by status, priority, discipline, category
- [x] Sort by all sort options
- [x] KPIs update correctly
- [x] Past due highlighting works
- [x] Priority color indicators
- [x] Status icons display correctly
- [ ] Permissions enforcement (future)
- [ ] Comments and mentions (future)
- [ ] Notifications (future)
- [ ] Bulk actions (future)
- [ ] Convert to RFI/Field Issue (future)
- [ ] Auto-linking (future)
- [ ] Export to CSV (future)

## Next Steps

1. **Server-side storage**: Migrate to SQL database for production use
2. **Permissions**: Implement project-scoped access and role-based actions
3. **Audit trail**: Track all changes with who/when/what
4. **Comments**: Add threaded comments with @mentions
5. **Notifications**: Implement notification system
6. **Bulk actions**: Add bulk status change, assignment, tagging
7. **Export**: CSV export and print view
8. **Auto-linking**: Detect and suggest entity links in note body
9. **Convert actions**: Convert notes to RFIs or Field Issues
10. **Tests**: Add unit and integration tests

## Notes

- All dates use ISO 8601 format for consistency
- Tags are stored as string arrays for flexibility
- Blocked status is derived from blockers array or waiting_on status
- Attachments structure is ready but upload functionality needs implementation
- Visibility setting allows sharing with General Contractor when needed
