const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function prepare() {
    // Note: This script is run from the tauri-app folder in CI
    const engineDir = path.join(process.cwd(), 'automation-engine');
    const browserDir = path.join(engineDir, 'local-browsers');

    console.log('📦 Cleaning and Pruning Automation Engine...');

    // 1. Install all dependencies including dev ones (to get Playwright/TSX)
    execSync('npm install', { cwd: engineDir, stdio: 'inherit' });

    // 2. Download ONLY Chromium (saves ~400MB by skipping Firefox/Webkit)
    console.log('🌐 Downloading bundled Chromium...');
    process.env.PLAYWRIGHT_BROWSERS_PATH = browserDir;
    execSync('npx playwright install chromium', { cwd: engineDir, stdio: 'inherit' });

    // 3. REMOVE devDependencies (tsx, types, etc) to shrink the package
    console.log('🧹 Removing developer tools from bundle...');
    execSync('npm prune --production', { cwd: engineDir, stdio: 'inherit' });

    console.log('✅ Optimization complete.');
}

prepare();