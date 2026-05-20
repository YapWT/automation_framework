const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const engineDir = path.join(__dirname, 'tauri-app', 'automation-engine');
const browserDir = path.join(engineDir, 'local-browsers');

console.log(`📂 Target Engine Directory: ${engineDir}`);

if (!fs.existsSync(engineDir)) {
    console.error('❌ Error: automation-engine directory not found!');
    process.exit(1);
}

// Check if browsers already exist (skip expensive installation)
const chromiumDir = path.join(browserDir, 'chromium-1223');
if (fs.existsSync(chromiumDir)) {
    console.log('✅ Browsers already installed, skipping download.');
    process.exit(0);
}

try {
    // Ensure browsers directory exists
    if (!fs.existsSync(browserDir)) {
        fs.mkdirSync(browserDir, { recursive: true });
        console.log(`📁 Created browsers directory: ${browserDir}`);
    }

    console.log('📦 Installing Automation Engine dependencies...');
    const installResult = spawnSync('npm', ['install'], {
        cwd: engineDir,
        stdio: 'inherit',
        shell: true  // Essential for Windows
    });

    if (installResult.error) {
        throw new Error(`npm install failed: ${installResult.error.message}`);
    }

    if (installResult.status !== 0) {
        console.warn('⚠️  npm install exited with status', installResult.status);
    }

    console.log('🌐 Downloading bundled Chromium (this may take a minute)...');
    const env = { ...process.env, PLAYWRIGHT_BROWSERS_PATH: browserDir };
    const playwrightResult = spawnSync('npx', ['playwright', 'install', 'chromium'], {
        cwd: engineDir,
        stdio: 'inherit',
        shell: true,  // Essential for Windows
        env: env
    });

    if (playwrightResult.error) {
        throw new Error(`Playwright install failed: ${playwrightResult.error.message}`);
    }

    if (playwrightResult.status !== 0) {
        throw new Error(`Playwright install exited with status ${playwrightResult.status}`);
    }

    // Verify browsers were installed
    if (!fs.existsSync(chromiumDir)) {
        throw new Error(`Chromium directory not found after install: ${chromiumDir}`);
    }

    console.log('🧹 Removing developer tools from bundle...');
    const pruneResult = spawnSync('npm', ['prune', '--production'], {
        cwd: engineDir,
        stdio: 'inherit',
        shell: true
    });

    if (pruneResult.status !== 0) {
        console.warn('⚠️  npm prune exited with status', pruneResult.status);
    }

    console.log('✅ Automation Engine prepared successfully.');
    console.log(`   Browsers: ${browserDir}`);
    process.exit(0);
} catch (e) {
    console.error(`❌ Error: ${e.message}`);
    process.exit(1);
}
