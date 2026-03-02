# Desktop Quick Start

## Run in Development

```bash
npm run desktop:dev
```

This starts the Vite dev server and launches the Electron window.

## Build Installer

### Current Platform
```bash
npm run desktop:build
```

### Windows
```bash
npm run dist:win
```

### macOS
```bash
npm run dist:mac
```

### Linux
```bash
npm run dist:linux
```

## Output

Installers are created in `/release`:
- Windows: `SteelBuild Pro Setup x.x.x.exe`
- macOS: `SteelBuild Pro-x.x.x.dmg`
- Linux: `SteelBuild-Pro-x.x.x.AppImage`

## Security Features ✅

- ✅ contextIsolation: true
- ✅ nodeIntegration: false
- ✅ enableRemoteModule: false
- ✅ sandbox: true
- ✅ External links open in system browser
- ✅ All native APIs accessed via secure IPC

## Keyboard Shortcuts

- **Ctrl/Cmd+N** - New Project
- **Ctrl/Cmd+D** - Dashboard
- **Ctrl/Cmd+P** - Projects
- **Ctrl/Cmd+Shift+P** - Portfolio Pulse
- **Ctrl/Cmd+E** - Export Daily Report

## Using Electron API in React

```typescript
import { useElectronAPI, useElectronFileOperations } from '@/hooks/use-electron';

function MyComponent() {
  const { isElectron, api } = useElectronAPI();
  const { saveFile, openFile } = useElectronFileOperations();
  
  const handleExport = async () => {
    if (!isElectron) {
      // Fallback for web
      return;
    }
    
    await saveFile('report.pdf', pdfData, [
      { name: 'PDF Files', extensions: ['pdf'] }
    ]);
  };
  
  return (
    <button onClick={handleExport}>
      Export Report
    </button>
  );
}
```

## Troubleshooting

### Blank screen in packaged app?
- Ensure you ran `npm run build:electron` (not just `npm run build`)
- This sets `ELECTRON=true` which configures proper base path

### External links not opening?
- Links must start with `http://` or `https://`
- Shell integration is automatic

### Menu shortcuts not working?
- Check console for IPC errors
- Verify menu handlers in App component

## More Info

See [DESKTOP_SETUP.md](./DESKTOP_SETUP.md) for complete documentation.
