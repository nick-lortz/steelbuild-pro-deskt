# File Upload Functionality for Drawing Sets and Sheets

## Overview
Added comprehensive file upload, download, and management functionality for drawing sets and sheets in SteelBuild Pro.

## Backend Implementation (Electron)

### 1. File Storage System (`electron/main.cjs`)
Added secure file upload/download handlers:

- **`file:uploadDrawing`**: Uploads drawing files to local storage
  - Creates project-specific directories
  - Sanitizes filenames for safety
  - Generates unique timestamps
  - Returns file metadata (fileKey, size, etc.)
  
- **`file:downloadDrawing`**: Downloads files from local storage
  - Validates file paths for security
  - Returns file buffer and metadata
  
- **`file:deleteDrawing`**: Removes files from storage
  - Validates paths before deletion
  
- **`file:openDrawing`**: Opens files in default system application
  - Uses Electron's shell.openPath API

**File Storage Location**: `{userDataPath}/drawings/{projectId}/{timestamp}_{filename}`

**Supported Formats**: PDF, DWG, DXF, PNG, JPG, TIFF (up to 50MB)

### 2. IPC Bridge (`electron/preload.cjs`)
Exposed file operations to renderer via contextBridge:
```javascript
file: {
  uploadDrawing: (fileData) => ...,
  downloadDrawing: (fileKey) => ...,
  deleteDrawing: (fileKey) => ...,
  openDrawing: (fileKey) => ...
}
```

### 3. Database Schema
The `drawing_sheets` table already includes:
- `file_key` (text): References the uploaded file

## Frontend Implementation

### 1. TypeScript Definitions (`src/types/electron.d.ts`)
Added interfaces for:
- `FileUploadData`: Input data structure
- `FileUploadResult`: Upload response
- `FileDownloadResult`: Download response
- `SBPFile`: File operations interface

### 2. UI Components

#### `FileUpload.tsx` & `FileUploadWithProgress.tsx`
Reusable file upload component with:
- Drag-and-drop support
- File type validation
- Size limits
- Upload progress tracking
- Visual feedback

#### `DrawingSheetViewer.tsx`
Sheet display component with file management:
- View sheet metadata
- Download attached files
- Open files in default app
- Delete sheets (with file cleanup)

### 3. Updated Drawings Page (`drawings-db-page.tsx`)

#### New Features:
1. **File Upload in "Add Sheet" Dialog**
   - Integrated file upload component
   - Progress tracking during upload
   - Automatic file association with sheets

2. **New "All Sheets" Tab**
   - View all sheets across drawing sets
   - Filter by specific drawing set
   - Download/open/delete sheet files
   - Visual file attachment indicators

#### Enhanced Workflow:
```
1. User clicks "Add Sheet" on a drawing set
2. Fills in sheet metadata (number, title, status)
3. Optionally drags/drops a drawing file
4. Clicks "Add Sheet"
5. File uploads with progress indication
6. Sheet created with file reference
7. Sheet appears in "All Sheets" tab with file actions
```

## Security Features

1. **Path Validation**: All file operations validate paths are within user data directory
2. **Filename Sanitization**: Removes unsafe characters from uploaded filenames
3. **Context Isolation**: IPC communication through secure contextBridge
4. **File Type Restrictions**: Accept only specified drawing file formats

## Usage Examples

### Upload a Drawing Sheet:
```typescript
const handleAddSheet = async () => {
  // Convert file to ArrayBuffer
  const arrayBuffer = await selectedFile.arrayBuffer()
  
  // Upload file
  const uploadResult = await window.SBP.file.uploadDrawing({
    fileName: selectedFile.name,
    fileBuffer: arrayBuffer,
    projectId: currentProjectId,
  })
  
  // Create sheet with file reference
  await window.SBP.db.createDrawingSheet({
    set_id: setId,
    sheet_no: 'S-101',
    title: 'Foundation Plan',
    file_key: uploadResult.data.fileKey,
  })
}
```

### Download a Drawing:
```typescript
const downloadResult = await window.SBP.file.downloadDrawing(fileKey)
const blob = new Blob([new Uint8Array(downloadResult.data.buffer)])
// Trigger browser download
```

### Open in Default App:
```typescript
await window.SBP.file.openDrawing(fileKey)
// Opens file in system default application
```

## Testing Checklist

- [x] Backend file upload handler
- [x] Backend file download handler
- [x] Backend file delete handler
- [x] Frontend file upload component
- [x] Frontend file viewer component
- [x] Integration with drawing sheets
- [x] Progress tracking during upload
- [x] File type validation
- [x] Size limit enforcement
- [x] Security path validation

## Future Enhancements

1. **Revision Management**: Track multiple versions of drawing files
2. **Thumbnail Generation**: Auto-generate previews for PDF/image files
3. **Batch Upload**: Upload multiple sheets at once
4. **Cloud Sync**: Optional cloud backup of drawing files
5. **In-App PDF Viewer**: View PDFs without leaving the app
6. **Annotations**: Mark up drawings directly in the app
7. **Comparison Tool**: Visual diff between drawing revisions
8. **File Compression**: Automatically compress large files

## File Structure

```
electron/
  main.cjs            # File operation IPC handlers
  preload.cjs         # File API exposure

src/
  types/
    electron.d.ts     # Type definitions
  components/
    shared/
      FileUpload.tsx           # File upload component
      DrawingSheetViewer.tsx   # Sheet viewer with file actions
  pages/
    drawings/
      drawings-db-page.tsx     # Enhanced drawings page
```

## Notes

- Files are stored locally in the Electron app's user data directory
- File keys are relative paths: `{projectId}/{timestamp}_{filename}`
- All file operations are async and return `DBResult<T>` with success/error
- Upload progress is simulated (30% → 60% → 90% → 100%) for UX feedback
- Files are automatically cleaned up when sheets are deleted
