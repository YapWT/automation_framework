# Windows Quick Fix Guide

## One-Line Fixes

### Fix Everything At Once (Recommended)
```powershell
npm run setup-windows
```

### Fix Node Binary Issue
```
Error: Node binary not found at: C:\Users\...\bin\node
Fix: npm run prepare-bins
```

### Fix Chromium Not Installed
```
Error: Chromium browsers not installed at: ...\local-browsers
Fix: npm run prepare-engine
```

### Fix tsx Not Installed
```
Error: tsx not installed at: ...\node_modules\tsx
Fix: cd tauri-app\automation-engine && npm install
```

## Diagnostic Tools

### Check Your Setup Status
```powershell
npm run diagnose
```
Shows exactly what's working and what needs to be fixed.

### Verify Complete Setup
```powershell
npm run verify
```

## Common Workflows

### First Time Setup
```powershell
# 1. Install project dependencies
npm install

# 2. Run automated Windows setup
npm run setup-windows

# 3. Start development
npm run dev
```

### Rebuild After Errors
```powershell
# Option 1: Quick rebuild (recommended)
npm run prepare-engine

# Option 2: Full clean rebuild
npm run setup-windows

# Option 3: Manual full reset
Remove-Item -Recurse tauri-app\src-tauri\bin -ErrorAction SilentlyContinue
Remove-Item -Recurse tauri-app\automation-engine\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse tauri-app\automation-engine\local-browsers -ErrorAction SilentlyContinue
npm run setup-windows
```

## When Scripts Fail

### Error: "cannot be loaded because running scripts is disabled"
```powershell
# Allow scripts for this PowerShell session
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process

# Then retry
npm run setup-windows
```

### Error: "Permission Denied"
```powershell
# Run PowerShell as Administrator (right-click → Run as administrator)
# Then retry your command
```

### Error: "npm: command not found"
```powershell
# Reinstall Node.js from https://nodejs.org/
# Close and reopen PowerShell
npm --version
```

## Running the App

### Development Mode
```powershell
npm run dev
```
- Starts dev server at http://localhost:1420
- Hot-reload enabled
- Debugging tools available

### Production Build
```powershell
npm run build
```
- Creates optimized bundle
- Bundles Chromium and Node automatically
- Output: `tauri-app\src-tauri\target\release\`

## Files You Need to Check

After setup, these files should exist:

```
✓ tauri-app\src-tauri\bin\node.exe
✓ tauri-app\automation-engine\node_modules\tsx
✓ tauri-app\automation-engine\local-browsers\chromium-1223\chrome-win64\chrome.exe
✓ tauri-app\node_modules\
✓ tauri-app\dist\  (after first build)
```

Use `npm run diagnose` to verify all files.

## Environment Issues

### Antivirus Blocking Downloads
- Whitelist your project folder in antivirus software
- Temporarily disable antivirus during setup

### Slow Network
- Chromium download is ~150MB
- May take 5-30 minutes on slow connection
- Check internet with: `npm run diagnose`

### Disk Space Issues
- Need ~500MB free space
- Move project to shorter path if path errors occur
- Example: `C:\dev\automation_framework` (not deep nested paths)

## Advanced Debugging

### Show All Setup Logs
```powershell
$DebugPreference = "Continue"
npm run setup-windows
```

### Manual Component Tests
```powershell
# Test Node binary
.\tauri-app\src-tauri\bin\node.exe --version

# Test Chromium
.\tauri-app\automation-engine\local-browsers\chromium-1223\chrome-win64\chrome.exe --version

# Test tsx
cd tauri-app\automation-engine
.\node_modules\.bin\tsx --version
```

## Still Having Issues?

1. **Run diagnostic**: `npm run diagnose`
2. **Check prerequisites**: Node, npm, Rust installed?
3. **Try clean rebuild**:
   ```powershell
   npm cache clean --force
   npm run setup-windows
   ```
4. **Check file permissions**: Right-click project folder → Properties → Security
5. **Try different terminal**: PowerShell 7+ or Windows Terminal
6. **Read full guide**: See `WINDOWS_SETUP.md`

## Emergency Reset

Use this only if nothing else works:

```powershell
# Remove all generated files
Remove-Item -Recurse tauri-app\src-tauri\bin -ErrorAction SilentlyContinue
Remove-Item -Recurse tauri-app\src-tauri\target -ErrorAction SilentlyContinue
Remove-Item -Recurse tauri-app\automation-engine\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse tauri-app\automation-engine\local-browsers -ErrorAction SilentlyContinue
Remove-Item -Recurse tauri-app\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse tauri-app\dist -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue

# Reinstall everything
npm install
npm run setup-windows
```

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run setup-windows` | Automated setup (recommended) |
| `npm run prepare-bins` | Setup Node sidecar only |
| `npm run prepare-engine` | Setup automation engine only |
| `npm run diagnose` | Check what's working/broken |
| `npm run verify` | Verify all components |
| `npm run dev` | Start development |
| `npm run build` | Production build |

---

**Need Help?** Check `WINDOWS_SETUP.md` for detailed information.
