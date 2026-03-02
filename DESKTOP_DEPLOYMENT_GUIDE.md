# SteelBuild Pro - Desktop App Deployment Guide

## Overview

SteelBuild Pro is now packaged as a standalone desktop application for Windows and macOS using Electron. This guide covers development, building, and distribution of the desktop application.

## ✅ Completed Implementation

### Step 1: Electron Shell ✅

**Files Created:**
- `electron/main.cjs` - Main process entry point
- `electron/preload.cjs` - Context bridge for secure IPC

**Features Implemented:**
- ✅ BrowserWindow with proper security settings
  - `contextIsolation: true`
  - `nodeIntegration: false`
  - `sandbox: false` (for file system access)
- ✅ Dev mode loads Vite dev server (`http://localhost:5173`)
- ✅ Production mode loads built files (`dist/index.html`)
- ✅ App lifecycle handlers (ready, activate, window-all-closed)
- ✅ Custom application menu with keyboard shortcuts
- ✅ IPC handlers for file operations
- ✅ Window state management

**Security:**
- ✅ No Node APIs exposed in renderer
- ✅ Safe IPC communication via contextBridge
- ✅ Minimal API surface exposed to renderer

### Step 2: electron-builder Packaging ✅

**Configuration:**
- ✅ Added to `package.json` under `build` section
- ✅ AppId: `com.steelbuildpro.app`
- ✅ ProductName: `SteelBuild Pro`

**Targets:**
- ✅ Windows: NSIS installer (64-bit)
  - One-click: false (allows install directory selection)
  - Desktop shortcut: true
  - Start menu shortcut: true
- ✅ macOS: DMG (Intel x64 + Apple Silicon ARM64)
- ✅ Linux: AppImage + DEB (bonus, not in requirements)

**Scripts:**
- ✅ `npm run dev:electron` - Development mode
- ✅ `npm run build:electron` - Build web assets for Electron
- ✅ `npm run dist` - Package for all platforms
- ✅ `npm run dist:win` - Windows installer only
- ✅ `npm run dist:mac` - macOS DMG only

**Output:**
- ✅ Installers output to `release/` directory
- ✅ Correct app name and icon in taskbar/dock

### Step 3: Local-First Storage (IndexedDB) ✅

**Database Layer:**
- ✅ Created `src/lib/storage/db.ts` using Dexie
- ✅ Tables for all major entities:
  - cachedDashboards
  - cachedProjects
  - cachedCounts
  - cachedRFIs
  - cachedCostCodes
  - cachedEquipment
  - cachedChangeOrders
  - cachedContracts
  - cachedDrawings
  - cachedDeliveries
  - cachedTasks
  - cachedLabor
  - cachedWorkPackages
  - syncMetadata (tracks last sync times)

**Sync Strategy:**
- ✅ Created `src/lib/storage/sync.ts`
- ✅ Fetch-cache-fallback pattern
- ✅ On success: write to IndexedDB
- ✅ On failure/offline: read from IndexedDB
- ✅ Sync metadata tracking

**Offline Detection:**
- ✅ Created `src/hooks/use-online-status.ts`
- ✅ Monitors `navigator.onLine`
- ✅ Provides real-time status updates

**UI Indicators:**
- ✅ Created `src/components/shared/offline-indicator.tsx`
- ✅ Shows "Offline" badge when disconnected
- ✅ Shows "Online" badge when connected
- ✅ Displays last sync timestamp
- ✅ Tooltip with detailed status
- ✅ Integrated into main header

## Development Workflow

### Prerequisites

```bash
# Node.js 20+ required
node --version

# Install dependencies
npm install
```

### Development Mode

**Option 1: Web Development (Standard Vite)**
```bash
npm run dev
```
Opens browser at `http://localhost:5173`

**Option 2: Desktop Development (Electron + Vite)**
```bash
npm run dev:electron
```
Launches Electron window with hot reload enabled

### Project Structure

```
steelbuild-pro/
├── electron/                      # Electron main process
│   ├── main.cjs                  # Main entry point
│   └── preload.cjs               # Preload script (context bridge)
├── src/                          # React application
│   ├── lib/
│   │   └── storage/              # Offline-first storage
│   │       ├── db.ts            # IndexedDB layer (Dexie)
│   │       └── sync.ts          # Sync strategy
│   ├── hooks/
│   │   └── use-online-status.ts # Offline detection
│   └── components/
│       └── shared/
│           └── offline-indicator.tsx # UI indicator
├── build/                        # Build resources (icons)
├── release/                      # Packaged installers (generated)
└── dist/                         # Built web files (generated)
```

## Building for Production

### 1. Build Web Assets

```bash
npm run build:electron
```

This sets `ELECTRON=true` environment variable and runs Vite build with Electron-specific configuration.

### 2. Package Desktop App

**All Platforms:**
```bash
npm run dist
```

**Windows Only:**
```bash
npm run dist:win
```

**macOS Only:**
```bash
npm run dist:mac
```

**Linux Only:**
```bash
npm run dist:linux
```

### Build Output

After running `npm run dist`, check the `release/` directory:

**Windows:**
- `SteelBuild Pro Setup 1.0.0.exe` (NSIS installer)

**macOS:**
- `SteelBuild Pro-1.0.0-arm64.dmg` (Apple Silicon)
- `SteelBuild Pro-1.0.0-x64.dmg` (Intel)

**Linux:**
- `SteelBuild Pro-1.0.0.AppImage`
- `steelbuild-pro_1.0.0_amd64.deb`

## Installation & Distribution

### Windows Installation

1. Download `SteelBuild Pro Setup 1.0.0.exe`
2. Run installer
3. Choose installation directory (default: `C:\Program Files\SteelBuild Pro`)
4. Installer creates:
   - Desktop shortcut
   - Start menu entry
   - Uninstaller in Control Panel

**User Data Location:**
```
%APPDATA%\SteelBuild Pro\
```

### macOS Installation

1. Download `SteelBuild Pro-1.0.0-[arch].dmg`
2. Open DMG file
3. Drag app to Applications folder
4. First launch: Right-click → Open (to bypass Gatekeeper if not signed)

**User Data Location:**
```
~/Library/Application Support/SteelBuild Pro/
```

### Linux Installation

**AppImage:**
```bash
chmod +x SteelBuild-Pro-1.0.0.AppImage
./SteelBuild-Pro-1.0.0.AppImage
```

**DEB Package:**
```bash
sudo dpkg -i steelbuild-pro_1.0.0_amd64.deb
```

**User Data Location:**
```
~/.config/SteelBuild Pro/
```

## Application Features

### Menu Items

**File Menu:**
- New Project (Ctrl/Cmd+N)
- Export Daily Report (Ctrl/Cmd+E)
- Export SOV
- Quit

**Edit Menu:**
- Standard editing commands (Undo, Redo, Cut, Copy, Paste, Select All)

**View Menu:**
- Dashboard (Ctrl/Cmd+D)
- Projects (Ctrl/Cmd+P)
- Portfolio Pulse (Ctrl/Cmd+Shift+P)
- Reload
- Force Reload
- Toggle DevTools
- Zoom controls
- Toggle Fullscreen

**Window Menu:**
- Minimize
- Zoom
- macOS-specific window management

**Help Menu:**
- Documentation (opens external link)
- Keyboard Shortcuts
- About SteelBuild Pro

### IPC Handlers

The main process exposes these safe APIs to the renderer:

```typescript
window.electronAPI = {
  // Get user data directory path
  getUserDataPath: () => Promise<string>
  
  // File dialogs
  saveFileDialog: (options) => Promise<SaveDialogResult>
  openFileDialog: (options) => Promise<OpenDialogResult>
  
  // File operations
  writeFile: (path, data) => Promise<{success: boolean, error?: string}>
  readFile: (path) => Promise<{success: boolean, data?: string, error?: string}>
  
  // Menu events
  onMenuNewProject: (callback) => () => void
  onMenuExportDailyReport: (callback) => () => void
  onMenuExportSOV: (callback) => () => void
  onMenuNavigate: (callback) => () => void
  
  // Environment detection
  isElectron: true
}
```

### Offline Functionality

**What Works Offline:**
- ✅ App launches and loads UI
- ✅ Dashboard displays last cached data
- ✅ Project list shows cached projects
- ✅ RFIs, cost codes, equipment show cached data
- ✅ Change orders, contracts, drawings show cached data
- ✅ Last sync timestamp displayed
- ✅ Clear visual indicator of offline status

**What Requires Online:**
- ❌ Creating new records
- ❌ Updating existing records
- ❌ Deleting records
- ❌ Fresh data syncing
- ❌ External API calls (Stripe, integrations)

**Future Enhancement:**
Implement offline write queue to allow creating/updating records offline and syncing when connection restored.

## Code Signing & Notarization

### Windows Code Signing

**Requirements:**
- Code signing certificate (from Sectigo, DigiCert, etc.)
- Certificate stored as `.pfx` file

**Configuration:**
```json
{
  "build": {
    "win": {
      "certificateFile": "path/to/certificate.pfx",
      "certificatePassword": "your-password",
      "signingHashAlgorithms": ["sha256"]
    }
  }
}
```

**Environment Variables:**
```bash
export CSC_LINK=/path/to/certificate.pfx
export CSC_KEY_PASSWORD=your-password
npm run dist:win
```

### macOS Code Signing & Notarization

**Requirements:**
- Apple Developer Account ($99/year)
- Developer ID Application certificate
- App-specific password for notarization

**Configuration:**
```json
{
  "build": {
    "mac": {
      "identity": "Developer ID Application: Your Name (TEAMID)",
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "entitlements": "build/entitlements.mac.plist",
      "entitlementsInherit": "build/entitlements.mac.plist"
    },
    "afterSign": "scripts/notarize.js"
  }
}
```

**Notarization Script Example:**
```javascript
// scripts/notarize.js
const { notarize } = require('@electron/notarize')

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context
  if (electronPlatformName !== 'darwin') return

  const appName = context.packager.appInfo.productFilename

  return await notarize({
    appBundleId: 'com.steelbuildpro.app',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID
  })
}
```

**Environment Variables:**
```bash
export APPLE_ID=your-apple-id@email.com
export APPLE_ID_PASSWORD=app-specific-password
export APPLE_TEAM_ID=YOUR_TEAM_ID
npm run dist:mac
```

## Auto-Updates (Future Enhancement)

To implement auto-updates, use `electron-updater`:

```bash
npm install electron-updater
```

**Update main.cjs:**
```javascript
const { autoUpdater } = require('electron-updater')

app.on('ready', () => {
  autoUpdater.checkForUpdatesAndNotify()
})
```

**Update package.json:**
```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "your-org",
      "repo": "steelbuild-pro"
    }
  }
}
```

## Troubleshooting

### Build Fails on Windows

**Error:** `cannot find python`
**Solution:** Install Python 3.x and add to PATH, or use `npm config set python /path/to/python`

**Error:** `cannot find Visual Studio`
**Solution:** Install Visual Studio Build Tools or full Visual Studio

### Build Fails on macOS

**Error:** `Code signing required`
**Solution:** Set `CSC_IDENTITY_AUTO_DISCOVERY=false` to skip signing during development

### App Won't Launch

**Windows:** Check Windows Event Viewer for crash details
**macOS:** Check Console app for crash logs
**Linux:** Run from terminal to see error output

### Blank Window on Launch

**Cause:** Vite base path issue
**Solution:** Verify `ELECTRON=true` during build and check `base: './'` in vite.config

### Offline Mode Not Working

1. Open DevTools in app (View → Toggle DevTools)
2. Check Console for errors
3. Verify IndexedDB exists (Application → IndexedDB)
4. Check Network tab - requests should fail gracefully
5. Verify `dexie` is installed: `npm list dexie`

## Performance Optimization

### Reduce Bundle Size

1. **Enable Code Splitting:**
   ```typescript
   // Use dynamic imports
   const HeavyComponent = lazy(() => import('./HeavyComponent'))
   ```

2. **Minimize Dependencies:**
   - Remove unused npm packages
   - Use tree-shakeable imports

3. **Optimize Assets:**
   - Compress images
   - Use WebP format for images
   - Lazy load large assets

### Improve Load Time

1. **Preload Critical Resources:**
   ```html
   <link rel="preload" href="/fonts/Inter.woff2" as="font" type="font/woff2" crossorigin>
   ```

2. **Cache Static Assets:**
   Configure appropriate cache headers

3. **Use Production Build:**
   Always build with `NODE_ENV=production`

## Security Best Practices

### 1. Content Security Policy

Add to `index.html`:
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
```

### 2. Disable Node Integration

Already configured in `preload.cjs`:
```javascript
nodeIntegration: false,
contextIsolation: true,
```

### 3. Validate IPC Messages

Always validate data received from renderer:
```javascript
ipcMain.handle('write-file', async (event, filePath, data) => {
  // Validate inputs
  if (!filePath || typeof filePath !== 'string') {
    return { success: false, error: 'Invalid file path' }
  }
  // ... rest of handler
})
```

### 4. Use Secure Storage

For sensitive data (tokens, keys), use Electron's `safeStorage`:
```javascript
const { safeStorage } = require('electron')

// Encrypt
const encrypted = safeStorage.encryptString('sensitive-data')

// Decrypt
const decrypted = safeStorage.decryptString(encrypted)
```

## Monitoring & Analytics

### Crash Reporting

Integrate Sentry or similar:

```bash
npm install @sentry/electron
```

```javascript
// In main.cjs
const Sentry = require('@sentry/electron')

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN'
})
```

### Usage Analytics

Respect user privacy. If collecting analytics:
1. Get user consent
2. Anonymize data
3. Follow GDPR/privacy laws
4. Provide opt-out

## Distribution Channels

### Direct Download

1. Host installers on your website
2. Provide checksums (SHA256) for verification
3. Include release notes

### Microsoft Store (Windows)

1. Create Microsoft Partner Center account
2. Package as MSIX
3. Submit for certification

### Mac App Store

1. Use App Store provisioning profile
2. Meet App Store guidelines
3. Submit via App Store Connect

### Auto-Update Server

1. Host release files on GitHub Releases
2. Use `electron-updater` with GitHub provider
3. Version using semantic versioning

## Maintenance

### Regular Updates

1. **Security Patches:**
   - Update Electron regularly
   - Run `npm audit` and fix vulnerabilities

2. **Dependency Updates:**
   ```bash
   npm outdated
   npm update
   ```

3. **Testing:**
   - Test on all target platforms before release
   - Verify auto-update mechanism
   - Check offline functionality

### Version Management

Follow semantic versioning (semver):
- Major: Breaking changes
- Minor: New features (backward compatible)
- Patch: Bug fixes

Update version in `package.json`:
```json
{
  "version": "1.2.3"
}
```

## Resources

- **Electron Documentation:** https://www.electronjs.org/docs
- **electron-builder:** https://www.electron.build/
- **Dexie.js:** https://dexie.org/
- **Code Signing Guide:** https://www.electron.build/code-signing
- **Auto-Update:** https://www.electron.build/auto-update

## Support

For issues or questions:
1. Check existing documentation
2. Search GitHub issues
3. Open new issue with:
   - OS and version
   - App version
   - Steps to reproduce
   - Error logs

## Conclusion

SteelBuild Pro is now a fully-functional desktop application with:
- ✅ Secure Electron wrapper
- ✅ Cross-platform installers
- ✅ Offline-first architecture
- ✅ Professional desktop experience

The app can be distributed to users who can install and run it like any native desktop application, with the added benefit of working offline with cached data.
