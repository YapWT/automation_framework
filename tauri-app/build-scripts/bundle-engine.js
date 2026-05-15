const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function prepare() {
    // Since we run this from 'tauri-app', process.cwd() is the tauri-app folder
    const engineDir = path.join(process.cwd(), 'automation-engine');
    const browserDir = path.join(engineDir, 'local-browsers');

    console.log(`📂 Target Engine Directory: ${engineDir}`);

    if (!fs.existsSync(engineDir)) {
        console.error('❌ Error: automation-engine directory not found!');
        process.exit(1);
    }

    console.log('📦 Cleaning and Pruning Automation Engine...');
    execSync('npm install', { cwd: engineDir, stdio: 'inherit' });

    console.log('🌐 Downloading bundled Chromium...');
    process.env.PLAYWRIGHT_BROWSERS_PATH = browserDir;
    execSync('npx playwright install chromium', { cwd: engineDir, stdio: 'inherit' });

    console.log('🧹 Removing developer tools from bundle...');
    execSync('npm prune --production', { cwd: engineDir, stdio: 'inherit' });

    console.log('✅ Optimization complete.');
}

prepare();