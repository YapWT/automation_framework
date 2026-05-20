# Windows Installation Guide

## Prerequisites

Before building, ensure you have:

1. **Node.js** (v18+) - [Download](https://nodejs.org/)
2. **Rust** - [Install via rustup](https://rustup.rs/)
3. **Visual Studio Build Tools** (for Windows)
   - Required for Tauri and native dependencies
   - Download: https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - During installation, select "Desktop development with C++"

## Installation Steps

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd automation_framework
npm install
```

**Important**: The `npm install` will automatically run `prepare-engine` which:
- Installs automation engine dependencies
- Downloads Chromium browser (this takes ~2-3 minutes)
- Sets up all required resources

### 2. Build for Production

```bash
npm run build
```

This will:
- Prepare Node.js sidecar
- Prepare automation engine + browsers
- Build the frontend
- Compile Rust backend
- Create installer

### 3. For Development

```bash
npm run dev
```

## Troubleshooting

### Error: "Failed to start"

This usually means one of these is missing:

1. **Chromium browsers not installed**
   ```bash
   cd tauri-app/automation-engine
   PLAYWRIGHT_BROWSERS_PATH=./local-browsers npx playwright install chromium
   ```

2. **Dependencies not installed**
   ```bash
   cd tauri-app/automation-engine
   npm install
   ```

3. **Node.js sidecar not prepared**
   ```bash
   node prepare-sidecar.js
   ```

### Error: "Script not found"
- Your automation script wasn't saved properly
- Try the automation again from the UI

### Error: "Chromium browsers not found"
- Run the prepare-engine script manually:
  ```bash
  npm run prepare-engine
  ```

### Error: "tsx not found"
- The automation engine dependencies weren't installed
- Run: `npm run prepare-engine`

## Manual Full Setup (if npm scripts fail)

```bash
# 1. Install root dependencies
npm install

# 2. Setup sidecar
node prepare-sidecar.js

# 3. Install automation engine
cd tauri-app/automation-engine
npm install

# 4. Download browsers
PLAYWRIGHT_BROWSERS_PATH=./local-browsers npx playwright install chromium

# 5. Remove dev dependencies (optional, saves ~500MB)
npm prune --production

# 6. Build the app
cd ../..
cd tauri-app
npm install
npm run tauri build
```

## What Gets Installed

- **local-browsers/** (~600MB)
  - Chromium executable
  - FFmpeg
  - Chrome Headless Shell
  
- **node_modules/** in automation-engine
  - playwright
  - tsx
  - typescript
  - xlsx
  - fs-extra
  - dependencies

## Build Output

The installer will be created at:
```
tauri-app/src-tauri/target/release/bundle/msi/
```

On Windows, look for `.msi` files which are the installers.
