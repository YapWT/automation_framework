# Browser Automation Framework

A modern desktop application for creating, managing, and executing browser automation scripts. Built with **Tauri** (Rust backend), **Vue 3** (TypeScript frontend), and **Playwright** for cross-browser automation.

## 📋 Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development](#development)
- [Project Structure](#project-structure)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)

## ✨ Features

- **Visual Script Editor** - Write automation scripts with TypeScript support
- **Code Editor** - Integrated CodeMirror editor with syntax highlighting
- **Multi-Browser Support** - Chromium and Firefox browser engines
- **Real-Time Console** - View script execution logs in real-time
- **Script Management** - Save, load, rename, and delete scripts
- **Hot Reload** - Auto-save scripts during development
- **Dark Mode** - Toggle between light and dark themes

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Rust** (v1.70 or higher) - [Download](https://rustup.rs/)
- **npm** - Usually installed with Node.js

### Verify Installation

```bash
node --version
npm --version
rustc --version
cargo --version
```

## 🚀 Installation

### 1. Clone and Navigate

```bash
cd automation_framework/tauri-app
```

### 2. Install Root Dependencies

Install the main Tauri app dependencies:

```bash
npm install
```

### 3. Install Automation Engine Dependencies

Install the Playwright and TypeScript dependencies for the automation engine:

```bash
cd automation-engine
npm install
cargo install
cd ..
```

### 4. Verify Installation

Run a quick check to ensure everything is set up:

```bash
cargo check
```

## 🛠️ Development

### Start Development Server

```bash
npm run tauri dev
```

This command will:
- Start the Vite development server
- Compile the Rust backend
- Launch the desktop application

The app will open automatically with hot reload enabled for frontend changes.

### Build for Production

```bash
npm run build
```

Then build the Tauri app:

```bash
npm run tauri build
```

The built executable will be available in `src-tauri/target/release/bundle/`

## 📁 Project Structure

```
tauri-app/
├── src/                          # Vue frontend source
│   ├── components/
│   │   └── automation/          # Core automation UI components
│   │       ├── ScriptEditor.vue
│   │       ├── StepDesigner.vue
│   │       ├── ConsoleDrawer.vue
│   │       └── ...
│   ├── composables/             # Vue composables for logic
│   │   ├── useAutomation.ts
│   │   ├── useContextMenu.ts
│   │   ├── useGeneralHotkeys.ts
│   │   └── ...
│   ├── views/
│   │   └── WorkflowsEditor.vue  # Main editor view
│   └── main.ts
├── src-tauri/
│   ├── src/
│   │   ├── lib.rs              # Rust backend logic
│   │   └── main.rs             # Tauri app entry point
│   ├── build.rs                # Build script
│   └── Cargo.toml              # Rust dependencies
├── automation-engine/           # Playwright automation engine
│   ├── tests/                  # Test/script directory
│   │   └── temp_task.ts        # Temporary script file
│   ├── local-browsers/         # Browser binaries
│   │   ├── chromium-1223/
│   │   ├── chromium_headless_shell-1223/
│   │   └── ffmpeg-1011/
│   ├── package.json
│   └── playwright.config.ts
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## 📝 Usage

### Creating a Script

1. Open the application
2. Write your automation code in the **Script Editor**
3. Click **Save** to store the script

### Running a Script

1. Select a saved script from the **Scripts List**
2. Click **Execute** or press the run button
3. View real-time output in the **Console Drawer**
4. Use **Stop** to terminate execution

### Script Example

```typescript
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto('https://example.com');
console.log('Title:', await page.title());

await browser.close();
```

### Keyboard Shortcuts

- `Ctrl/Cmd + S` - Save script
- `Ctrl/Cmd + Enter` - Execute script
- `Ctrl/Cmd + .` - Stop execution
- `Ctrl/Cmd + /` - Toggle dark mode
- `Ctrl/Cmd + K` - Show shortcuts guide

## 🔧 Recommended IDE Setup

For the best development experience, use:

- **[VS Code](https://code.visualstudio.com/)**
- **[Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar)** extension
- **[Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)** extension
- **[rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)** extension

## 🐛 Troubleshooting

### Issue: `npm install` fails

**Solution**: Clear npm cache and retry
```bash
npm cache clean --force
npm install
```

### Issue: Rust compilation errors

**Solution**: Update Rust toolchain
```bash
rustup update
rustc --version
```

### Issue: Browsers not found

**Solution**: Reinstall automation-engine dependencies
```bash
cd automation-engine
rm -rf node_modules package-lock.json
npm install
cd ..
```

### Issue: Port already in use

**Solution**: The dev server runs on port `5173`. If it's in use, stop other services or modify `vite.config.ts`

### Issue: "Script not found" error

**Solution**: Ensure scripts are saved in the correct directory (`~/.config/automation_framework/automation-engine/tests/`)

## 📚 Additional Resources

- [Tauri Documentation](https://tauri.app/v1/guides/)
- [Vue 3 Documentation](https://vuejs.org/)
- [Playwright Documentation](https://playwright.dev/)
- [Vite Documentation](https://vitejs.dev/)

## 📄 License

ISC

## 💬 Support

For issues and questions, please check the existing documentation or create an issue in the repository.
