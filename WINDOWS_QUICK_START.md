# Windows Quick Start

## If You Get "Error: Failed to start"

This error shows what's actually wrong. Look for one of these messages in the console:

### Missing Chromium Browsers
```
Chromium browsers not found at: ...
Please run: npm run prepare-engine
```
**Fix:**
```bash
npm run prepare-engine
```

### tsx Not Found
```
tsx not found at: ...
Please run: npm install in automation-engine
```
**Fix:**
```bash
npm run prepare-engine
```

### Node Binary Not Found
```
Node binary not found at: ...
```
**Fix:**
```bash
node prepare-sidecar.js
```

### Engine Directory Not Found
```
Engine directory not found at: ...
```
**Fix:**
This means automation-engine folder is missing. Check your clone.

## Complete Rebuild on Windows

If nothing works, do a full rebuild:

```bash
# 1. Clean everything
rm -r tauri-app\src-tauri\target
rm -r tauri-app\automation-engine\node_modules
rm -r tauri-app\automation-engine\local-browsers
npm cache clean --force

# 2. Fresh install
npm install

# 3. Prepare everything
npm run prepare-engine

# 4. Verify setup
npm run verify

# 5. Build
npm run build
```

## Check Your Setup

Before building, verify everything is ready:

```bash
npm run verify
```

You should see all green checkmarks ✓

## Slow Build?

The browser download (~600MB) takes time on first run:
- ✓ Subsequent builds are much faster
- ✓ Browsers are cached in `local-browsers/`
- ✓ You can interrupt and resume later

## Need Help?

Check these files:
- [Full Windows Setup Guide](WINDOWS_SETUP.md)
- [Development Setup](tauri-app/README.md)
