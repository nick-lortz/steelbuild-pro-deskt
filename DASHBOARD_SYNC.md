# Dashboard Live Counter Updates

## Overview
The dashboard counters now update in real-time when creating, updating, or deleting RFIs, Cost Codes, or Equipment.

## Implementation

### Event-Based Refresh System
All create/update/delete operations in the following modules now emit a `dataUpdated` custom event:

1. **RFIs** (`src/pages/rfis/rfis-page.tsx`)
2. **Equipment** (`src/pages/equipment/equipment-page.tsx`)
3. **Cost Codes** (`src/pages/cost-codes/cost-codes-page.tsx`)

### Dashboard Listener
The dashboard (`src/pages/dashboard.tsx`) listens for `dataUpdated` events and automatically refreshes all counters when data changes.

## How It Works

### Module Pages (RFIs, Equipment, Cost Codes)
When any CRUD operation completes successfully, the page dispatches an event:

```typescript
window.dispatchEvent(new CustomEvent('dataUpdated', { 
  detail: { type: 'rfi', action: 'create' } 
}))
```

### Dashboard
The dashboard listens for these events and triggers a data reload:

```typescript
useEffect(() => {
  const handleDataChange = () => {
    setRefreshKey(prev => prev + 1)
  }

  window.addEventListener('dataUpdated', handleDataChange)
  return () => window.removeEventListener('dataUpdated', handleDataChange)
}, [])
```

## Data Flow

1. User creates/updates/deletes an item in RFIs, Equipment, or Cost Codes
2. The module page saves the data to `spark.kv` storage
3. The module page emits a `dataUpdated` event
4. Dashboard receives the event and increments its `refreshKey`
5. Dashboard's `useEffect` re-runs due to `refreshKey` change
6. Dashboard reloads all data from `spark.kv`
7. Counters update with the latest values

## Storage Layer

All modules use the KV storage layer (`src/lib/db.ts`) which wraps `spark.kv`:

- **RFIs**: `rfisDb.create()`, `rfisDb.update()`, `rfisDb.delete()`
- **Equipment**: `equipmentDb.create()`, `equipmentDb.update()`, `equipmentDb.delete()`
- **Cost Codes**: `costCodesDb.create()`, `costCodesDb.update()`, `costCodesDb.delete()`

## Testing

To verify the live updates work:

1. Navigate to the Dashboard
2. Note the current counters (Open RFIs, Equipment Fleet, etc.)
3. Navigate to RFIs and create a new RFI
4. Return to Dashboard
5. Verify the "Open RFIs" counter has incremented
6. Repeat for Equipment and Cost Codes

## Notes

- The dashboard refresh is automatic and requires no manual page reload
- All counters update together when any data changes
- The system uses browser events for communication between pages
- Data persists using Spark's KV storage API
