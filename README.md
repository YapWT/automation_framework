# 🤖 Automation Framework
## 📂 Project Structure

```text
.
├── .github/              # CI/CD Workflows (GitHub Actions)
├── public/               # Static assets (icons, robots.txt)
├── src/                  # Frontend (Vue 3 + TypeScript)
│   ├── assets/           # Processed styles/images
│   ├── components/       # Reusable UI components
│   ├── App.vue           # Main Application entry
│   └── main.ts           # Vue initialization
├── src-tauri/            # Backend (Tauri + Rust)
│   ├── src/              # Rust source code (main.rs)
│   ├── capabilities/     # App permissions/security
│   ├── icons/            # App system icons
│   ├── gen/              # Auto-generated Tauri code (Don't edit)
│   ├── Cargo.toml        # Rust dependencies
│   └── tauri.conf.json   # Tauri configuration
├── tests/                # Playwright E2E tests
├── index.html            # Vite entry point
├── package.json          # Project scripts and dependencies
├── playwright.config.ts  # Test runner configuration
├── tsconfig.json         # TypeScript configuration
└── vite.config.ts        # Vite build settings

```

## 🚀 Getting Started

### Prerequisites
* Node.js: LTS version (18+)
* Rust: Install via rustup
* OS Dependencies: Tauri Prerequisites (C++ Build Tools, etc.)

### Installation
```
npm install
```

### Development
To start the app in development mode with hot-reload:
```
npm run tauri dev
```

### Build (Production)
To create a native installer (.exe, .msi, .app, .deb):
```
npm run build
```

## 🛠️ Built With
* Tauri - Desktop Framework
* Vue.js - Frontend Framework
* Vite - Frontend Tooling
* Playwright - Automation/Testing
* TypeScript - Type Safety
