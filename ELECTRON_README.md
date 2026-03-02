# SteelBuild Pro - Electron Desktop Application

## Building and Running

### Development Mode

Run the application in development mode with hot reload:

```bash
npm run dev:electron
```

This will:
1. Start the Vite dev server on http://localhost:5173
2. Launch Electron pointing to the dev server
3. Enable hot module replacement (HMR)
4. Open DevTools automatically

### Building for Production

#### Build All Platforms
```bash
npm run dist
```

#### Build for Specific Platforms

**Windows**
```bash
npm run dist:win
```
Output: `release/SteelBuild Pro Setup.exe`

**macOS**
```bash
npm run dist:mac
```
Output: `release/SteelBuild Pro.dmg`

**Linux**
```bash
npm run dist:linux
```
Output: `release/SteelBuild Pro.AppImage`

## Application Icons

Place your application icons in the `build/` directory:

- **macOS**: `build/icon.icns` (512x512)
- **Windows**: `build/icon.ico` (256x256)
- **Linux**: `build/icon.png` (512x512)

You can generate these from a source image using tools like:
- [electron-icon-builder](https://www.npmjs.com/package/electron-icon-builder)
- Online converters like CloudConvert

## Menu Items

The application includes native menus with keyboard shortcuts:

### File Menu
- **New Project** (Ctrl/Cmd + N)
- **Export Daily Report** (Ctrl/Cmd + E)
- **Export SOV**
- **Quit**

### Edit Menu
- Standard edit operations (Undo, Redo, Cut, Copy, Paste, Select All)

### View Menu
- **Dashboard** (Ctrl/Cmd + D)
- **Projects** (Ctrl/Cmd + P)
- **Portfolio Pulse** (Ctrl/Cmd + Shift + P)
- Zoom controls
- Toggle DevTools
- Toggle Fullscreen

### Window Menu
- Minimize
- Zoom
- Close

### Help Menu
- Documentation
- Keyboard Shortcuts
- About SteelBuild Pro

## Electron APIs

The application exposes several APIs via the preload script:

### File Operations
```typescript
window.electronAPI.saveFileDialog(options)
window.electronAPI.openFileDialog(options)
window.electronAPI.writeFile(filePath, data)
window.electronAPI.readFile(filePath)
```

### Menu Event Handlers
```typescript
window.electronAPI.onMenuNewProject(callback)
window.electronAPI.onMenuExportDailyReport(callback)
window.electronAPI.onMenuExportSOV(callback)
window.electronAPI.onMenuNavigate(callback)
```

### React Hooks

Use the provided hooks in your components:

```typescript
import { useElectronAPI, useElectronFileOperations } from '@/hooks/use-electron';

function MyComponent() {
  const { isElectron, api } = useElectronAPI();
  const { saveFile, openFile } = useElectronFileOperations();
  
  // Your component logic
}
```

## Code Signing

### macOS

To distribute your app outside of your organization, you need:

1. **Apple Developer Account**
2. **Developer ID Application Certificate**

Set in `package.json`:
```json
"build": {
  "mac": {
    "identity": "Developer ID Application: Your Name (TEAM_ID)"
  }
}
```

### Windows

For Windows code signing:

1. Obtain a code signing certificate
2. Set environment variables:
   - `CSC_LINK`: Path to certificate file
   - `CSC_KEY_PASSWORD`: Certificate password

## Offline Support

The application uses `useKV` from `@github/spark/hooks` for persistent storage:

- Data persists locally in the user's data directory
- Access via `app.getPath('userData')`
- Syncs automatically when online
- Full offline functionality for core features

## Troubleshooting

### Blank Screen on Launch
- Check that `base` is set correctly in `vite.config.ts`
- Verify `dist/index.html` exists after build
- Check DevTools console for errors

### Menu Items Not Working
- Ensure router is properly configured
- Check that menu event handlers are registered
- Verify `useElectronMenuHandlers` is called in layout components

### File Dialogs Not Appearing
- Check that IPC handlers are registered in `electron/main.cjs`
- Verify preload script is loaded correctly
- Check `contextIsolation` is enabled

## Architecture

```
/electron
  ├── main.cjs        # Main process (Node.js)
  └── preload.cjs     # Preload script (sandboxed context bridge)

/src
  ├── hooks
  │   └── use-electron.ts   # React hooks for Electron APIs
  └── types
      └── electron.d.ts     # TypeScript definitions
```

## Security

The application follows Electron security best practices:

- ✅ Context isolation enabled
- ✅ Node integration disabled
- ✅ Sandbox enabled
- ✅ Secure IPC communication via preload script
- ✅ No direct exposure of Node APIs to renderer

## Next Steps

1. Add application icons to `build/` directory
2. Configure code signing for your organization
3. Set up auto-update mechanism (using electron-updater)
4. Add crash reporting (using Sentry or similar)
5. Implement deep linking for project URLs
6. Add system tray integration
