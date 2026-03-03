# SteelBuild Pro - Data Management Guide

## Overview

Your SteelBuild Pro application stores data in different locations depending on the runtime mode:

### 1. **Web Mode (Current Spark Environment)**
- **Storage**: GitHub Spark KV (key-value) storage system
- **Location**: Managed by the Spark runtime
- **Persistence**: Automatic across sessions
- **Access**: Via `window.spark.kv` API or `useKV` React hooks

### 2. **Desktop/Electron Mode**
- **Storage**: Local SQLite database
- **Location**: User's local machine in app data directory
- **Persistence**: Survives app restarts
- **Access**: Via IPC (Inter-Process Communication) through `window.SBP.db`

## How to Access Your Data

### Option 1: Data Management Page (Recommended)

Navigate to: **`/data-management`**

This page provides:
- **Export Data**: Download complete JSON backup of all data
- **Import Data**: Upload and restore from backup file
- **View Stats**: See total data keys and storage size
- **Debug View**: View all data keys in browser console

### Option 2: Manual Export via Console

Open browser console and run:

```javascript
// Export all data
const keys = await window.spark.kv.keys();
const data = {};
for (const key of keys) {
  data[key] = await window.spark.kv.get(key);
}
console.log(JSON.stringify(data, null, 2));
```

### Option 3: Individual Key Access

```javascript
// Get specific data
const projects = await window.spark.kv.get('projects');
const rfis = await window.spark.kv.get('rfis');
console.log({ projects, rfis });
```

## Data Storage Patterns in Your App

Your application uses several data persistence patterns:

### 1. Spark KV Storage (Web Mode)
Used by components with `useKV` hooks:
```typescript
const [projects, setProjects] = useKV('projects', []);
const [settings, setSettings] = useKV('user-settings', {});
```

### 2. Electron SQLite (Desktop Mode)
Used via the `useDatabase` hook:
```typescript
const { db } = useDatabase();
const rfis = await db.listRFIs(projectId);
```

### 3. In-Memory State
Temporary data using React `useState` (does not persist):
```typescript
const [selectedTab, setSelectedTab] = useState('overview');
```

## Common Data Keys

Your app likely stores data under these keys:

### Project Data
- `projects` - Project list
- `project-{id}` - Individual project details
- `project-{id}-members` - Project team members

### Financial Data
- `cost-codes` - Global cost codes
- `project-{id}-cost-codes` - Project-specific cost codes
- `project-{id}-budget` - Budget data
- `project-{id}-sov` - Schedule of Values

### Schedule Data
- `project-{id}-tasks` - Project tasks/schedule
- `project-{id}-wbs` - WBS structure
- `project-{id}-baseline` - Schedule baseline

### Construction Data
- `project-{id}-rfis` - RFIs
- `project-{id}-drawings` - Drawing sets
- `project-{id}-equipment` - Equipment
- `project-{id}-deliveries` - Delivery tracking
- `project-{id}-work-packages` - Work packages

### Settings & Preferences
- `user-settings` - User preferences
- `gradient-settings` - UI gradient settings
- `theme-settings` - Theme preferences

## Backup and Recovery Process

### Creating a Backup

1. **Via UI** (Easiest):
   - Navigate to `/data-management`
   - Click "Download Backup"
   - Save the JSON file to a safe location

2. **Via Console**:
   ```javascript
   // Run in browser console
   const keys = await window.spark.kv.keys();
   const data = {};
   for (const key of keys) {
     data[key] = await window.spark.kv.get(key);
   }
   
   // Download as file
   const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
   const url = URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = 'steelbuild-backup.json';
   a.click();
   ```

### Restoring from Backup

1. **Via UI**:
   - Navigate to `/data-management`
   - Click "Upload Backup"
   - Select your backup JSON file
   - Data will be imported and merged with existing data

2. **Via Console**:
   ```javascript
   // Paste your backup JSON here
   const backupData = { /* your backup data */ };
   
   for (const [key, value] of Object.entries(backupData)) {
     await window.spark.kv.set(key, value);
   }
   ```

## Data Migration Scenarios

### Scenario 1: Moving from Web to Desktop

1. Export data from web version using Data Management page
2. Launch desktop/Electron version
3. Data will be in a new SQLite database
4. Manual migration script needed (not yet implemented)

### Scenario 2: Resetting Application

To clear all data and start fresh:

```javascript
// WARNING: This deletes ALL data
const keys = await window.spark.kv.keys();
for (const key of keys) {
  await window.spark.kv.delete(key);
}
```

### Scenario 3: Selective Data Export

Export only specific project data:

```javascript
const projectId = 'your-project-id';
const keys = await window.spark.kv.keys();
const projectKeys = keys.filter(k => k.includes(projectId));
const projectData = {};
for (const key of projectKeys) {
  projectData[key] = await window.spark.kv.get(key);
}
console.log(projectData);
```

## Troubleshooting

### "My data is missing"

1. **Check if you're in the right mode**:
   - Web mode data: Stored in Spark KV
   - Desktop mode data: Stored in SQLite
   - Data doesn't automatically sync between modes

2. **Check browser/session**:
   - Spark KV is session-persistent
   - Clearing browser data will remove it
   - Different browsers = different storage

3. **Verify data exists**:
   ```javascript
   const keys = await window.spark.kv.keys();
   console.log('Available keys:', keys);
   ```

### "Import is not working"

1. Verify JSON file format is correct
2. Check browser console for errors
3. Ensure file is not corrupted
4. Try importing smaller chunks if file is large

### "Data is not persisting"

1. Ensure you're using `useKV` for persistent data
2. Check that you're not using plain `useState` for important data
3. Verify Spark runtime is loaded: `typeof window.spark !== 'undefined'`

## Best Practices

### 1. Regular Backups
- Export data weekly or after significant changes
- Store backups in multiple locations
- Include date in filename: `steelbuild-backup-2024-01-15.json`

### 2. Data Validation
- Always validate imported data structure
- Check for required fields before using data
- Handle missing or malformed data gracefully

### 3. Incremental Saves
- Use functional updates with `useKV`:
  ```typescript
  setProjects(current => [...current, newProject])
  ```
- This prevents data loss from stale closures

### 4. Data Versioning
- Include version numbers in exported data
- Handle schema migrations when app updates
- Maintain backward compatibility

## Future Enhancements

Planned improvements for data management:

1. **Automatic Backups**: Scheduled daily/weekly backups
2. **Cloud Sync**: Sync data across devices
3. **Version Control**: Track data changes over time
4. **Selective Restore**: Import only specific modules
5. **Data Validation**: Pre-import data structure validation
6. **Migration Tools**: Automated web-to-desktop migration

## Support

If you need help with data management:

1. Check this guide first
2. Navigate to `/data-management` page
3. Use browser console for debugging
4. Export data before making major changes
5. Keep regular backups

## Developer Notes

### Data Structure

The application expects data in this structure:

```typescript
{
  "projects": Project[],
  "project-{id}-rfis": RFI[],
  "project-{id}-cost-codes": CostCode[],
  "project-{id}-tasks": Task[],
  // ... etc
}
```

### Adding New Data Types

When adding new persisted data:

1. Use descriptive key names
2. Prefix project-specific data with `project-{id}-`
3. Use arrays for lists
4. Use objects for single entities
5. Document the schema

### Custom Export/Import

To add custom export logic:

```typescript
// In src/lib/data-export.ts
export async function exportProjectOnly(projectId: string) {
  const keys = await window.spark.kv.keys();
  const projectKeys = keys.filter(k => 
    k === 'projects' || k.startsWith(`project-${projectId}-`)
  );
  
  const data: Record<string, any> = {};
  for (const key of projectKeys) {
    data[key] = await window.spark.kv.get(key);
  }
  
  return data;
}
```

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0
**Application**: SteelBuild Pro
