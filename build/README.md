# Application Icons

This directory should contain application icons for building installers:

## Required Icons

- **icon.icns** - macOS application icon (512x512)
- **icon.ico** - Windows application icon (256x256)  
- **icon.png** - Linux application icon (512x512)

## Generating Icons

You can generate these from a single source image (1024x1024 PNG recommended) using:

### Option 1: electron-icon-builder
```bash
npm install -g electron-icon-builder
electron-icon-builder --input=./source-icon.png --output=./build
```

### Option 2: Online Tools
- [CloudConvert](https://cloudconvert.com/) - Convert PNG to ICO/ICNS
- [iConvert Icons](https://iconverticons.com/online/) - Specialized for app icons

### Option 3: Platform-Specific Tools

**macOS** (create ICNS):
```bash
mkdir icon.iconset
sips -z 512 512   source-icon.png --out icon.iconset/icon_512x512.png
iconutil -c icns icon.iconset
```

**Windows** (create ICO):
Use tools like:
- GIMP (export as .ico)
- ImageMagick: `convert source-icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico`

## Placeholder

Until custom icons are added, electron-builder will use default Electron icons.

For production builds, replace these with your branded icons.
