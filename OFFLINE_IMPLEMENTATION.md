# Offline-First Implementation Guide

## Overview

SteelBuild Pro now includes a comprehensive local-first storage system using IndexedDB that enables the dashboard and key features to work offline. This guide explains how the offline system works and how to integrate it with your data flows.

## Architecture

### Components

1. **IndexedDB Layer** (`src/lib/storage/db.ts`)
   - Uses Dexie.js for type-safe IndexedDB access
   - Stores cached snapshots of all major entities
   - Tracks sync metadata (last sync time, status, errors)

2. **Sync Strategy** (`src/lib/storage/sync.ts`)
   - Implements fetch-cache-fallback pattern
   - Detects online/offline status
   - Gracefully degrades to cached data when network fails

3. **Offline Detection** (`src/hooks/use-online-status.ts`)
   - Monitors `navigator.onLine` API
   - Provides real-time online/offline status to React components

4. **UI Indicator** (`src/components/shared/offline-indicator.tsx`)
   - Displays current connection status
   - Shows last successful sync time
   - Provides user feedback about offline mode

## Database Schema

The IndexedDB database (`SteelBuildProDB`) contains the following tables:

### Cache Tables
- `cachedDashboards`: Dashboard data per project
- `cachedProjects`: Project list and details
- `cachedCounts`: Count metrics (RFIs, tasks, etc.)
- `cachedRFIs`: RFI records per project
- `cachedCostCodes`: Cost codes (global and per-project)
- `cachedEquipment`: Equipment resources
- `cachedChangeOrders`: Change orders per project
- `cachedContracts`: Contracts per project
- `cachedDrawings`: Drawing sets, sheets, and revisions
- `cachedDeliveries`: Delivery tracking records
- `cachedTasks`: Schedule tasks per project
- `cachedLabor`: Labor entries and hours
- `cachedWorkPackages`: Work packages per project

### Metadata Table
- `syncMetadata`: Tracks last sync time and status for each cache key

## Usage

### Basic Sync Pattern

```typescript
import { syncProjects } from '@/lib/storage/sync'
import { offlineCache } from '@/lib/storage/db'

async function loadProjects() {
  const result = await syncProjects()
  
  if (result.isFromCache) {
    console.log('Loaded from cache, last sync:', result.lastSyncAt)
  }
  
  return result.data
}
```

### Manual Cache Management

```typescript
import { offlineCache } from '@/lib/storage/db'

// Cache data manually
await offlineCache.cacheProjects(projects)
await offlineCache.cacheDashboard(projectId, dashboardData)

// Retrieve cached data
const projects = await offlineCache.getProjects()
const dashboard = await offlineCache.getDashboard(projectId)

// Clear all caches
await offlineCache.clearCache()
```

### Online Status Detection

```typescript
import { useOnlineStatus } from '@/hooks/use-online-status'

function MyComponent() {
  const isOnline = useOnlineStatus()
  
  return (
    <div>
      {isOnline ? 'Connected' : 'Offline - showing cached data'}
    </div>
  )
}
```

## Integration with Existing Code

### Step 1: Wrap API Calls

Replace direct API calls with sync functions:

**Before:**
```typescript
const projects = await fetchProjects()
```

**After:**
```typescript
import { syncProjects } from '@/lib/storage/sync'

const result = await syncProjects()
const projects = result.data || []
```

### Step 2: Update Sync Functions

Modify the sync functions in `src/lib/storage/sync.ts` to call your actual API:

```typescript
export async function syncProjects(): Promise<SyncResult<any[]>> {
  return syncData({
    cacheKey: 'projects',
    fetchFn: async () => {
      // Replace with your actual API call
      return await projectsDb.getAll()
    },
    cacheFn: async (data) => {
      await offlineCache.cacheProjects(data)
    },
    getCachedFn: async () => {
      return await offlineCache.getProjects()
    },
  })
}
```

### Step 3: Handle Cache in Components

Update components to handle cached data gracefully:

```typescript
function ProjectDashboard({ projectId }: { projectId: string }) {
  const [data, setData] = useState<any>(null)
  const [isFromCache, setIsFromCache] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const result = await syncDashboard(projectId)
      setData(result.data)
      setIsFromCache(result.isFromCache)
      setLastSync(result.lastSyncAt || null)
    }
    load()
  }, [projectId])

  if (!data) return <div>Loading...</div>

  return (
    <div>
      {isFromCache && (
        <Alert>
          Showing cached data from {lastSync}
        </Alert>
      )}
      <DashboardContent data={data} />
    </div>
  )
}
```

## Offline Behavior

### When Online
1. Fetch data from API
2. Store successful response in IndexedDB
3. Update sync metadata with current timestamp
4. Return fresh data to UI

### When Offline
1. Detect network unavailability
2. Retrieve last cached snapshot from IndexedDB
3. Return cached data with metadata (last sync time, cache status)
4. Display offline indicator to user

### On Reconnection
1. Automatically detect online status
2. Retry failed syncs
3. Update UI indicator to show online status

## Best Practices

### 1. Cache Strategic Data
Cache data that users need to access offline:
- Dashboard summaries
- Project lists and details
- Recent RFIs, tasks, deliveries
- Cost codes and equipment lists

### 2. Handle Cache Staleness
Show users when data is stale:
```typescript
const isStale = lastSync && 
  (Date.now() - new Date(lastSync).getTime() > 3600000) // 1 hour

{isStale && <Warning>Data may be outdated</Warning>}
```

### 3. Implement Smart Refresh
Refresh cached data when:
- User explicitly requests refresh
- App comes back online after being offline
- Significant time has passed since last sync

### 4. Queue Write Operations
For mutations (create/update/delete) while offline:
- Store operations in a queue
- Replay when connection restored
- Handle conflicts appropriately

## Current Limitations

1. **Write Operations**: The current implementation focuses on read operations (fetching and caching data). Write operations (create, update, delete) while offline are not yet queued for sync.

2. **Conflict Resolution**: When multiple devices make changes offline, there's no automatic conflict resolution.

3. **Selective Sync**: All data for a module is cached together. There's no granular control over what gets cached.

## Future Enhancements

1. **Offline Write Queue**: Implement a mutation queue that stores write operations performed offline and replays them when online.

2. **Differential Sync**: Only sync changed records instead of full data sets.

3. **Background Sync**: Use Service Workers to sync in the background when connection is available.

4. **Cache Pruning**: Automatically remove old cached data to manage storage size.

5. **Optimistic UI Updates**: Show changes immediately while queuing for background sync.

## Testing Offline Mode

### In Desktop App
1. Run `npm run dev:electron`
2. Open DevTools (View → Toggle DevTools)
3. Go to Network tab
4. Set throttling to "Offline"
5. Navigate the app - should load cached data
6. Check offline indicator in header

### In Browser
1. Run `npm run dev`
2. Open browser DevTools (F12)
3. Go to Network tab
4. Check "Offline" checkbox
5. Reload page
6. Verify cached data loads

### Verify IndexedDB
1. Open DevTools → Application tab (Chrome) or Storage tab (Firefox)
2. Expand IndexedDB → SteelBuildProDB
3. Inspect tables and cached records
4. Verify sync metadata timestamps

## API Reference

### `offlineCache` Object

#### Methods

**`cacheDashboard(projectId, data)`**
Cache dashboard data for a project.

**`getDashboard(projectId)`**
Retrieve cached dashboard data.

**`cacheProjects(projects)`**
Cache array of project records.

**`getProjects()`**
Retrieve all cached projects.

**`cacheProject(project)`**
Cache a single project record.

**`getProject(id)`**
Retrieve a specific cached project.

**`cacheCounts(projectId, counts)`**
Cache count metrics.

**`getCounts(projectId)`**
Retrieve cached counts.

**`cacheRFIs(projectId, rfis)`**
Cache RFI records for a project.

**`getRFIs(projectId)`**
Retrieve cached RFIs for a project.

**`cacheCostCodes(projectId, codes)`**
Cache cost codes (global or per-project).

**`getCostCodes(projectId)`**
Retrieve cached cost codes.

**`cacheEquipment(projectId, equipment)`**
Cache equipment records.

**`getEquipment(projectId)`**
Retrieve cached equipment.

**`cacheChangeOrders(projectId, changeOrders)`**
Cache change orders for a project.

**`getChangeOrders(projectId)`**
Retrieve cached change orders.

**`cacheContracts(projectId, contracts)`**
Cache contracts for a project.

**`getContracts(projectId)`**
Retrieve cached contracts.

**`cacheDrawings(projectId, drawings)`**
Cache drawings for a project.

**`getDrawings(projectId)`**
Retrieve cached drawings.

**`cacheDeliveries(projectId, deliveries)`**
Cache deliveries for a project.

**`getDeliveries(projectId)`**
Retrieve cached deliveries.

**`cacheTasks(projectId, tasks)`**
Cache schedule tasks for a project.

**`getTasks(projectId)`**
Retrieve cached tasks.

**`cacheLabor(projectId, labor)`**
Cache labor records for a project.

**`getLabor(projectId)`**
Retrieve cached labor records.

**`cacheWorkPackages(projectId, packages)`**
Cache work packages for a project.

**`getWorkPackages(projectId)`**
Retrieve cached work packages.

**`setSyncMetadata(key, status, error?)`**
Update sync metadata for a cache key.

**`getSyncMetadata(key)`**
Retrieve sync metadata for a cache key.

**`getAllSyncMetadata()`**
Retrieve all sync metadata records.

**`clearCache()`**
Clear all cached data and metadata.

### `syncData` Function

Generic sync function that implements the fetch-cache-fallback pattern.

**Parameters:**
- `cacheKey`: Unique identifier for this data
- `fetchFn`: Async function to fetch fresh data
- `cacheFn`: Async function to cache the data
- `getCachedFn`: Async function to retrieve cached data
- `forceRefresh`: Optional flag to force refresh (default: false)

**Returns:**
```typescript
{
  data: T | null,
  isFromCache: boolean,
  lastSyncAt?: string,
  error?: string
}
```

## Troubleshooting

### Problem: Data not caching
**Solution**: Check browser console for IndexedDB errors. Ensure Dexie is installed: `npm install dexie`

### Problem: Offline indicator not showing
**Solution**: Verify `OfflineIndicator` component is imported in layout. Check that `useOnlineStatus` hook is working.

### Problem: Stale data showing when online
**Solution**: Clear cache manually or implement cache invalidation: `await offlineCache.clearCache()`

### Problem: IndexedDB quota exceeded
**Solution**: Implement cache pruning or increase browser storage quota. Check cached data size in DevTools.

## Electron-Specific Considerations

### Data Persistence
In Electron, IndexedDB data persists in the user data directory:
- Windows: `%APPDATA%/SteelBuild Pro/`
- macOS: `~/Library/Application Support/SteelBuild Pro/`
- Linux: `~/.config/SteelBuild Pro/`

### Clearing Cache
To reset the app completely, delete the user data directory or implement a "Clear Cache" button in settings that calls `offlineCache.clearCache()`.

### File Storage
For large files (drawings, documents), consider using Electron's native file system APIs instead of IndexedDB for better performance.

## Security Considerations

1. **Sensitive Data**: Be mindful of caching sensitive data. Consider encrypting cached data if needed.

2. **Local Access**: Anyone with access to the device can inspect IndexedDB contents.

3. **Cache Invalidation**: Implement proper cache invalidation when user logs out or changes projects.

4. **Token Storage**: Don't cache authentication tokens in IndexedDB. Use secure storage (Electron's safeStorage API).

## Performance Tips

1. **Batch Operations**: Use `bulkPut()` instead of multiple `put()` calls for better performance.

2. **Index Wisely**: Only index fields you'll query on. Over-indexing slows down writes.

3. **Limit Cache Size**: Don't cache entire datasets. Implement pagination and cache only visible/recent data.

4. **Lazy Loading**: Load cached data lazily - only when needed.

5. **Background Sync**: Implement background sync to update cache without blocking UI.

## Conclusion

The offline-first implementation provides a robust foundation for SteelBuild Pro to work without an internet connection. Users can view their dashboard, browse projects, and access critical data even when offline. All cached data automatically syncs when the connection is restored.

For questions or issues, refer to the Dexie.js documentation: https://dexie.org/
