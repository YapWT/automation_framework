# Windows Setup Guide

This guide helps you set up the automation framework on Windows to ensure all components are properly configured.

## Prerequisites

Before starting, ensure you have the following installed:

### 1. Node.js & npm
- **Download**: https://nodejs.org/ (LTS recommended)
- **Verify**: Open PowerShell and run:
  ```powershell
  node --version
  npm --version
  ```

### 2. Rust Toolchain
- **Download**: https://rustup.rs/
- **Verify**: 
  ```powershell
  rustc --version
  cargo --version
  ```

### 3. Git (Optional but Recommended)
- **Download**: https://git-scm.com/

## Quick Setup

### Option A: Automated Setup (Recommended)

1. **Open PowerShell as Administrator** (right-click → Run as administrator)

2. **Navigate to project root**:
   ```powershell
   cd path\to\automation_framework
   ```

3. **Run setup script**:
   ```powershell
   npm run setup-windows
   ```

This will automatically:
- Check all prerequisites
- Set up Node sidecar binary for Tauri
- Install automation engine dependencies
- Download Chromium browser
- Verify all installations

### Option B: Manual Setup

If automated setup fails, follow these steps:

1. **Install Node sidecar**:
   ```powershell
   npm run prepare-bins
   ```
   This creates the Node binary that Tauri needs at: `tauri-app\src-tauri\bin\node.exe`

2. **Prepare automation engine**:
   ```powershell
   npm run prepare-engine
   ```
   This installs dependencies and downloads Chromium (~150MB).

3. **Verify setup**:
   ```powershell
   npm run verify
   ```

## Running the Application

### Development Mode
```powershell
npm run dev
```

### Production Build
```powershell
npm run build
```

## Common Issues & Fixes

### Issue 1: Node binary not found
**Error**: `Node binary not found at: C:\Users\...\AppData\Local\tauri-app\bin\node`

**Fix**:
```powershell
# Run with Administrator privileges
npm run prepare-bins
```

### Issue 2: Chromium browsers not installed
**Error**: `Chromium browsers not installed at: ...\automation-engine\local-browsers`

**Fix**:
```powershell
# Ensure you have internet connection (150MB download)
npm run prepare-engine

# Or manually:
cd tauri-app/automation-engine
npm install
npx playwright install chromium
```

### Issue 3: tsx not installed
**Error**: `tsx not installed at: ...\automation-engine\node_modules\tsx`

**Fix**:
```powershell
cd tauri-app/automation-engine
npm install
```

### Issue 4: Access Denied or Permission Errors

**Solutions**:
1. Run PowerShell as Administrator
2. Clear npm cache:
   ```powershell
   npm cache clean --force
   ```
3. Try again with fresh directory permissions

### Issue 5: Script won't run
If you get a policy error like "cannot be loaded because running scripts is disabled...":

```powershell
# Temporarily allow scripts for this session
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process

# Then run the setup
npm run setup-windows
```

## File Locations

After successful setup, verify these files exist:

| Component | Location |
|-----------|----------|
| Node binary | `tauri-app\src-tauri\bin\node.exe` |
| Chromium | `tauri-app\automation-engine\local-browsers\chromium-1223\chrome-win64` |
| tsx | `tauri-app\automation-engine\node_modules\.bin\tsx.cmd` |
| Engine deps | `tauri-app\automation-engine\node_modules\` |

## Cleanup & Fresh Start

If you need to start over completely:

```powershell
# Remove all generated files
Remove-Item -Recurse tauri-app\src-tauri\bin -ErrorAction SilentlyContinue
Remove-Item -Recurse tauri-app\automation-engine\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse tauri-app\automation-engine\local-browsers -ErrorAction SilentlyContinue
Remove-Item -Recurse tauri-app\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse tauri-app\dist -ErrorAction SilentlyContinue

# Then reinstall everything
npm install
npm run setup-windows
```

## Environment Variables

If you need to debug issues, you can set these variables:

```powershell
# Show detailed Tauri logs
$env:TAURI_DEBUG = 1

# Show Playwright browser downloads
$env:DEBUG = "pw:api"

# Use specific Playwright browser cache location
$env:PLAYWRIGHT_BROWSERS_PATH = "C:\path\to\browsers"
```

## Advanced: Manual Component Installation

### Manual Node Sidecar Setup

If `prepare-sidecar.js` fails:

```powershell
# Get your Rust target triple
rustc -vV

# Manually copy Node binary
$nodePath = (Get-Command node).Source
$targetPath = "tauri-app\src-tauri\bin\node-x86_64-pc-windows-gnu.exe"
Copy-Item $nodePath $targetPath
```

### Manual Playwright Browser Download

```powershell
cd tauri-app\automation-engine

# Install dependencies first
npm install

# Then download browsers
$env:PLAYWRIGHT_BROWSERS_PATH = "$(Get-Location)\local-browsers"
npx playwright install chromium
```

## Next Steps

After successful setup:

1. **Start development**: `npm run dev`
2. **Read the main README**: See `/README.md` for project overview
3. **Check automation docs**: See `tauri-app/automation-engine/README.md`

## Need Help?

If you still encounter issues:

1. Run the verify script: `npm run verify`
2. Check the issue details above
3. Try Administrator mode
4. Consider checking:
   - Firewall/Antivirus (may block downloads)
   - Internet connection (Chromium is ~150MB)
   - Disk space (needs ~500MB)
   - File permissions on project folder

## Windows-Specific Notes

- **Antivirus**: Some antivirus software may block binary execution or downloads. Whitelist the project folder if needed.
- **Path Length**: Windows has a 260-character path limit in some cases. If paths are too long, move project to a shorter path like `C:\dev\automation_framework`
- **Terminal**: Use PowerShell 7+ or Windows Terminal for better compatibility
- **Admin Rights**: First-time setup may require Administrator privileges for file operations
