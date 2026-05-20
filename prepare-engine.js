const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

console.log('📦 Preparing Automation Engine...\n');

const engineDir = path.join(__dirname, 'tauri-app', 'automation-engine');
const browserDir = path.join(engineDir, 'local-browsers');

console.log(`📂 Engine Directory: ${engineDir}`);
console.log(`📂 Browser Cache: ${browserDir}\n`);

if (!fs.existsSync(engineDir)) {
    console.error('❌ Error: automation-engine directory not found!');
    console.error(`   Expected at: ${engineDir}`);
    process.exit(1);
}

// Check if browsers already exist (skip expensive installation)
const chromiumDir = path.join(browserDir, 'chromium-1223');
const chromiumWinDir = path.join(chromiumDir, 'chrome-win64');
const chromiumLinuxDir = path.join(chromiumDir, 'chrome-linux64');
const chromiumMacDir = path.join(chromiumDir, 'chrome-mac');

const browsersExist = fs.existsSync(chromiumWinDir) || 
                      fs.existsSync(chromiumLinuxDir) || 
                      fs.existsSync(chromiumMacDir);

if (browsersExist) {
    console.log('✅ Browsers already installed, skipping download.\n');
} else {
    console.log('⏳ Browsers not found, proceeding with installation...\n');
}

try {
    // Ensure browsers directory exists
    if (!fs.existsSync(browserDir)) {
        fs.mkdirSync(browserDir, { recursive: true });
        console.log(`✓ Created browsers directory`);
    }

    // Step 1: Install dependencies
    console.log('\n📦 Step 1: Installing Automation Engine dependencies...');
    console.log(`   (cwd: ${engineDir})\n`);
    
    const installResult = spawnSync('npm', ['install'], {
        cwd: engineDir,
        stdio: 'inherit',
        shell: true,  // Essential for Windows
        windowsHide: false
    });

    if (installResult.error) {
        throw new Error(`npm install failed: ${installResult.error.message}`);
    }

    if (installResult.status !== 0) {
        console.warn('⚠️  npm install exited with status', installResult.status);
        console.warn('   This might be okay if all dependencies were installed.');
    } else {
        console.log('✓ Dependencies installed successfully');
    }

    // Step 2: Download browsers (only if not already present)
    if (!browsersExist) {
        console.log('\n📦 Step 2: Downloading bundled Chromium...');
        console.log(`   (this may take a few minutes on first run)\n`);
        
        const env = { 
            ...process.env, 
            PLAYWRIGHT_BROWSERS_PATH: browserDir,
            // Force Playwright to use the specified directory
            PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: undefined
        };
        
        const playwrightResult = spawnSync('npx', ['playwright', 'install', 'chromium'], {
            cwd: engineDir,
            stdio: 'inherit',
            shell: true,  // Essential for Windows
            env: env,
            windowsHide: false
        });

        if (playwrightResult.error) {
            throw new Error(`Playwright install failed: ${playwrightResult.error.message}`);
        }

        if (playwrightResult.status !== 0) {
            throw new Error(`Playwright install exited with status ${playwrightResult.status}`);
        }

        console.log('✓ Chromium downloaded successfully');

        // Verify browsers were installed
        const verifyBrowsers = fs.existsSync(chromiumWinDir) || 
                               fs.existsSync(chromiumLinuxDir) || 
                               fs.existsSync(chromiumMacDir);
        
        if (!verifyBrowsers) {
            throw new Error(`Chromium not found after install at: ${chromiumDir}`);
        }
        console.log('✓ Chromium installation verified');
    } else {
        console.log('\n✓ Using existing browser cache');
    }

    // Step 3: Prune dev dependencies
    console.log('\n📦 Step 3: Optimizing for production (removing dev dependencies)...\n');
    
    const pruneResult = spawnSync('npm', ['prune', '--production'], {
        cwd: engineDir,
        stdio: 'inherit',
        shell: true,
        windowsHide: false
    });

    if (pruneResult.status !== 0) {
        console.warn('⚠️  npm prune exited with status', pruneResult.status);
        console.warn('   This is usually not critical.');
    } else {
        console.log('✓ Production dependencies optimized');
    }

    // Verify key dependencies exist
    console.log('\n📦 Step 4: Verifying dependencies...\n');
    
    const requiredDeps = ['playwright', 'tsx', 'typescript'];
    let allDepsPresent = true;
    
    for (const dep of requiredDeps) {
        const depPath = path.join(engineDir, 'node_modules', dep);
        const exists = fs.existsSync(depPath);
        const icon = exists ? '✓' : '✗';
        console.log(`   ${icon} ${dep}`);
        if (!exists) allDepsPresent = false;
    }
    
    if (!allDepsPresent) {
        throw new Error('Some required dependencies are missing. Please run: npm install');
    }

    console.log('\n✅ Automation Engine prepared successfully!\n');
    console.log('📋 Summary:');
    console.log(`   ✓ Dependencies installed`);
    console.log(`   ✓ Chromium browser ready`);
    console.log(`   ✓ tsx command-line tool ready`);
    console.log(`   ✓ All verifications passed\n`);
    
    process.exit(0);
} catch (e) {
    console.error(`\n❌ Error: ${e.message}\n`);
    console.error('💡 Troubleshooting steps:');
    console.error(`   1. Check internet connection (Chromium download is ~150MB)`);
    console.error(`   2. On Windows, try running as Administrator`);
    console.error(`   3. Try clearing npm cache: npm cache clean --force`);
    console.error(`   4. Manually install: cd tauri-app/automation-engine && npm install`);
    console.error(`   5. Manually download: cd tauri-app/automation-engine && npx playwright install chromium\n`);
    process.exit(1);
}
