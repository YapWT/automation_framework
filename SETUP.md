# Automation Framework - Setup Guide

## Quick Start by OS

### 🪟 Windows Users

1. **Initial Setup** (requires ~15-20 min on first build)
   ```bash
   git clone <repo>
   cd automation_framework
   npm install
   npm run verify
   npm run build
   ```

2. **Getting Errors?**
   - Read: [Windows Quick Start](WINDOWS_QUICK_START.md)
   - Full guide: [Windows Setup Guide](WINDOWS_SETUP.md)

3. **Check Setup**
   ```bash
   npm run verify
   ```

### 🐧 Linux/macOS Developers

```bash
git clone <repo>
cd automation_framework
npm install
npm run dev
```

## What Happens During Setup

```
npm install
  ↓
  ├─ Downloads Node dependencies
  └─ Runs postinstall: npm run prepare-engine
       ├─ Installs automation-engine dependencies
       ├─ Downloads Playwright Chromium browser (~600MB)
       ├─ Sets up all required resources
       └─ Verifies everything is working
```

## Common Issues

### "Error: Failed to start" on Windows

The error message now shows what's missing! Examples:

| Error | Solution |
|-------|----------|
| `Chromium browsers not found` | `npm run prepare-engine` |
| `tsx not found` | `npm run prepare-engine` |
| `Engine directory not found` | Check your clone |

### Slow First Build?

Normal! Playwright browser download (~600MB) takes time. Subsequent builds are much faster.

## Build Tools

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development with hot-reload |
| `npm run build` | Create production installer |
| `npm run verify` | Check if setup is complete |
| `npm run prepare-engine` | Reinstall browsers/dependencies |

## Documentation

- [FIXES_SUMMARY.md](FIXES_SUMMARY.md) - Detailed changes made for Windows support
- [WINDOWS_SETUP.md](WINDOWS_SETUP.md) - Complete Windows installation guide
- [WINDOWS_QUICK_START.md](WINDOWS_QUICK_START.md) - Quick reference for troubleshooting

## For Linux Users Building for Windows

If building on Linux for Windows deployment:

```bash
npm run build
# Creates artifacts in: tauri-app/src-tauri/target/release/bundle/
```

Output for Windows: `.msi` installer files

## System Requirements

- **Node.js** v18+
- **npm** 9+
- **Rust** (installed via rustup)
- **Visual Studio Build Tools** (Windows only - for C++ compilation)
