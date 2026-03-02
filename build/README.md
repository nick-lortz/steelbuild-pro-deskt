# Application Icons

This directory contains application icons for building installers.

## Icon Files

Currently using **placeholder icons**. For production builds, replace these with branded icons.

### Required Icons

- **icon.icns** - macOS application icon (512x512)
- **icon.ico** - Windows application icon (256x256)  
- **icon.png** - Linux application icon (512x512)

## Generating Custom Icons

You can generate icons from a single source image (1024x1024 PNG recommended) using:

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
sips -z 16 16     source-icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32     source-icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     source-icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64     source-icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   source-icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256   source-icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   source-icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512   source-icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   source-icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 source-icon.png --out icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset
```

**Windows** (create ICO):
Use tools like:
- GIMP (export as .ico with multiple sizes: 16, 32, 48, 64, 128, 256)
- ImageMagick: `convert source-icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico`

**Linux** (PNG):
```bash
# Simply use a 512x512 PNG
cp source-icon.png icon.png
```

## Production Deployment

Before distributing your application:

1. Create branded icons matching your company's visual identity
2. Ensure icons are high resolution and look good at all sizes
3. Test icons on all target platforms
4. Consider hiring a designer for professional icon design

## Current Status

✅ Placeholder icons configured - electron-builder will use defaults
⚠️ Production builds should use custom branded icons
