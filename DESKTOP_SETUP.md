# SteelBuild Pro - Desktop Application Setup

## Overview

SteelBuild Pro can be run as a standalone desktop application for Windows and macOS using Electron. This guide covers development, building, and packaging the desktop app.

## Architecture

### Security Model

The desktop application follows Electron security best practices:

- ✅ **contextIsolation: true** - Renderer process cannot directly access Node.js APIs
- ✅ **nodeIntegration: false** - Node.js integration disabled in renderer
- ✅ **enableRemoteModule: false** - Remote module disabled
- ✅ **sandbox: true** - Renderer runs in a sandboxed environment
- ✅ All native capabilities accessed via secure preload IPC bridge

### Components

1. **Main Process** (`electron/main.cjs`)
   - Creates and manages BrowserWindow
   - Handles application lifecycle
   - Provides secure IPC handlers
   - Opens external links in system browser

2. **Preload Script** (`electron/preload.cjs`)
   - Exposes safe API via contextBridge
   - No direct Node.js access from renderer

3. **Renderer Process** (Your React app)
   - Web application loaded in Electron window
   - Access to Electron APIs only through `window.electronAPI`

## Development

### Prerequisites

- Node.js 20+ installed
- All dependencies installed (`npm install`)

### Running in Development

Start the desktop app in development mode:

```bash
npm run desktop:dev
```

This command:
1. Starts Vite dev server at http://localhost:5173
2. Waits for server to be ready
3. Launches Electron window pointing to dev server
4. Opens DevTools automatically

### Development Features

- Hot module reload (HMR) works normally
- DevTools open by default
- React DevTools available
- Changes to renderer code reload instantly
- Changes to `electron/main.cjs` or `electron/preload.cjs` require restart

## Building and Packaging

### Build for Production

Build the web assets with Electron-specific optimizations:

```bash
npm run build:electron
```

This sets `ELECTRON=true` which configures Vite with `base: "./"` for proper file:// protocol asset loading.

### Create Installers

#### All Platforms (current OS)
```bash
npm run desktop:build
```

#### Windows Only
```bash
npm run dist:win
```

Creates:
- `release/SteelBuild Pro Setup x.x.x.exe` (NSIS installer)

#### macOS Only
```bash
npm run dist:mac
```

Creates:
- `release/SteelBuild Pro-x.x.x.dmg`
- `release/SteelBuild Pro-x.x.x-arm64.dmg` (Apple Silicon)

#### Linux
```bash
npm run dist:linux
```

Creates:
- `release/SteelBuild-Pro-x.x.x.AppImage`
- `release/steelbuild-pro_x.x.x_amd64.deb`

### Build Output

All installers are placed in the `/release` directory:
- Windows: `.exe` (NSIS installer)
- macOS: `.dmg` (disk image)
- Linux: `.AppImage`, `.deb`

## Electron API

### Available APIs

The renderer process can access these secure APIs via `window.electronAPI`:

#### App Information
```typescript
const version = await window.electronAPI.app.getVersion();
const platform = await window.electronAPI.app.getPlatform();
const userDataPath = await window.electronAPI.app.getUserDataPath();
```

#### Shell Operations
```typescript
await window.electronAPI.shell.openExternal('https://example.com');
```

#### File Dialogs
```typescript
const result = await window.electronAPI.dialog.saveFile({
  title: 'Save Report',
  defaultPath: 'report.pdf',
  filters: [
    { name: 'PDF Files', extensions: ['pdf'] },
    { name: 'All Files', extensions: ['*'] }
  ]
});

const openResult = await window.electronAPI.dialog.openFile({
  title: 'Open File',
  filters: [{ name: 'CSV Files', extensions: ['csv'] }],
  properties: ['openFile']
});
```

#### File System (Sandboxed)
```typescript
// Only works within userData directory for security
const userData = await window.electronAPI.app.getUserDataPath();
const filePath = `${userData}/data.json`;

await window.electronAPI.fs.writeFile(filePath, JSON.stringify(data));
const result = await window.electronAPI.fs.readFile(filePath);
```

#### Database (Stub)
```typescript
// Sprint 2 implementation
const result = await window.electronAPI.db.query('SELECT * FROM projects', []);
await window.electronAPI.db.execute('INSERT INTO ...', [params]);
```

#### Menu Events
```typescript
useEffect(() => {
  const unsubscribe = window.electronAPI.menu.onNewProject(() => {
    // Handle new project creation
  });
  return unsubscribe;
}, []);
```

### React Hooks

Use the provided hooks for easier integration:

```typescript
import { useElectronAPI, useElectronMenuHandlers, useElectronFileOperations } from '@/hooks/use-electron';

function MyComponent() {
  const { isElectron, api } = useElectronAPI();
  const { saveFile, openFile } = useElectronFileOperations();
  
  // Automatically handles menu navigation
  useElectronMenuHandlers();
  
  const handleExport = async () => {
    await saveFile('report.pdf', pdfData, [
      { name: 'PDF Files', extensions: ['pdf'] }
    ]);
  };
}
```

## Application Menu

The desktop app includes a native menu with:

### File Menu
- **New Project** (Ctrl/Cmd+N)
- **Export Daily Report** (Ctrl/Cmd+E)
- **Export SOV**
- **Quit**

### Edit Menu
- Undo, Redo
- Cut, Copy, Paste
- Select All

### View Menu
- **Dashboard** (Ctrl/Cmd+D)
- **Projects** (Ctrl/Cmd+P)
- **Portfolio Pulse** (Ctrl/Cmd+Shift+P)
- Reload, Force Reload
- Toggle DevTools
- Zoom controls
- Toggle Fullscreen

### Window Menu
- Minimize, Zoom
- Close (Windows/Linux)
- Front (macOS)

### Help Menu
- Documentation
- Keyboard Shortcuts
- About SteelBuild Pro

## Configuration

### electron-builder Config

The build configuration is in `package.json` under the `build` key:

```json
{
  "build": {
    "appId": "com.steelbuildpro.app",
    "productName": "SteelBuild Pro",
    "directories": {
      "output": "release",
      "buildResources": "build"
    },
    "files": [
      "dist/**/*",
      "electron/**/*",
      "package.json"
    ],
    "mac": {
      "category": "public.app-category.business",
      "target": ["dmg"],
      "icon": "build/icon.icns"
    },
    "win": {
      "target": ["nsis"],
      "icon": "build/icon.ico"
    }
  }
}
```

### Application Icons

Place custom icons in `/build`:
- `icon.icns` - macOS (512x512+)
- `icon.ico` - Windows (256x256+)
- `icon.png` - Linux (512x512+)

Without custom icons, electron-builder uses default Electron icons.

## External Links

All external links automatically open in the system browser, not within the app:

```typescript
// These will open in default browser
<a href="https://docs.steelbuildpro.com">Docs</a>
window.open('https://example.com');
```

## File System Security

### Allowed Operations

- ✅ Read/write within `app.getPath('userData')`
- ✅ File dialogs (user explicitly chooses files)
- ❌ Arbitrary filesystem access blocked

### User Data Location

- **Windows**: `%APPDATA%/SteelBuild Pro`
- **macOS**: `~/Library/Application Support/SteelBuild Pro`
- **Linux**: `~/.config/steelbuild-pro`

## Troubleshooting

### Blank Screen in Production

**Problem**: App shows blank screen when packaged.

**Solutions**:
1. Ensure `ELECTRON=true` during build
2. Verify `base: "./"` in vite.config.ts when ELECTRON is true
3. Check dist/index.html uses relative paths
4. Open DevTools and check console for errors

### External Links Don't Open

**Problem**: Clicking links does nothing.

**Solution**: Verify `shell.openExternal` is configured in main.cjs and links use `http://` or `https://` protocol.

### Menu Shortcuts Don't Work

**Problem**: Keyboard shortcuts not triggering.

**Solution**: 
1. Check menu is created in `createMenu()`
2. Verify IPC handlers registered
3. Ensure preload exposes menu event handlers

### DevTools Won't Open in Production

**Problem**: Can't debug packaged app.

**Solution**: Temporarily enable DevTools:
```javascript
// In electron/main.cjs
if (isDev) {
  mainWindow.webContents.openDevTools();
}
// Change to:
mainWindow.webContents.openDevTools(); // Always open
```

## Distribution

### Windows

**NSIS Installer Features**:
- Installation directory choosable
- Desktop shortcut created
- Start Menu shortcut created
- Uninstaller included

**Code Signing** (Optional):
- Reduces SmartScreen warnings
- Requires code signing certificate
- Configure via environment variables

### macOS

**DMG Features**:
- Drag-to-Applications installer
- Universal binary (Intel + Apple Silicon)

**Code Signing & Notarization** (Required for distribution):
- Apple Developer account required
- Configure via environment variables:
  ```bash
  export APPLE_ID="your@email.com"
  export APPLE_ID_PASSWORD="app-specific-password"
  export APPLE_TEAM_ID="your-team-id"
  ```

### Linux

**AppImage**:
- Self-contained, no installation required
- Works on most distributions

**DEB Package**:
- For Debian/Ubuntu systems
- Installs via apt/dpkg

## Next Steps

### Sprint 2: Local Database

The current implementation includes database IPC stubs. Sprint 2 will implement:

1. SQLite integration via `better-sqlite3`
2. Secure IPC layer for database operations
3. Local-first data storage
4. Sync strategy when online

### Future Enhancements

- Auto-update support (electron-updater)
- Native notifications
- System tray integration
- Deep linking (open app via custom protocol)
- Offline data synchronization
- Multi-window support

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder](https://www.electron.build/)
- [Electron Security](https://www.electronjs.org/docs/latest/tutorial/security)
- [IPC Communication](https://www.electronjs.org/docs/latest/tutorial/ipc)
