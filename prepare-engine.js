const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const engineDir = path.join(__dirname, 'tauri-app', 'automation-engine');
const browserDir = path.join(engineDir, 'local-browsers');

console.log(`📂 Target Engine Directory: ${engineDir}`);

if (!fs.existsSync(engineDir)) {
    console.error('❌ Error: automation-engine directory not found!');
    process.exit(1);
}

try {
    console.log('📦 Installing Automation Engine dependencies...');
    execSync('npm install', { cwd: engineDir, stdio: 'inherit' });

    console.log('🌐 Downloading bundled Chromium...');
    process.env.PLAYWRIGHT_BROWSERS_PATH = browserDir;
    execSync('npx playwright install chromium', { cwd: engineDir, stdio: 'inherit' });

    console.log('🧹 Removing developer tools from bundle...');
    execSync('npm prune --production', { cwd: engineDir, stdio: 'inherit' });

    console.log('✅ Automation Engine prepared successfully.');
} catch (e) {
    console.error(`❌ Error: ${e.message}`);
    process.exit(1);
}
