#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m'
};

function log(msg, color = 'reset') {
    console.log(`${colors[color]}${msg}${colors.reset}`);
}

function section(title) {
    console.log(`\n${colors.blue}${'═'.repeat(70)}${colors.reset}`);
    log(title, 'cyan');
    console.log(`${colors.blue}${'═'.repeat(70)}${colors.reset}\n`);
}

function check(condition, message, details = '') {
    const icon = condition ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    console.log(`${icon} ${message}`);
    if (details) {
        console.log(`  ${colors.gray}${details}${colors.reset}`);
    }
}

function fileExists(filePath, description = '') {
    const exists = fs.existsSync(filePath);
    const desc = description || path.basename(filePath);
    check(exists, `${desc}`, exists ? `✓ ${filePath}` : `✗ Missing: ${filePath}`);
    return exists;
}

function getFileSize(filePath) {
    try {
        const stats = fs.statSync(filePath);
        const kb = Math.round(stats.size / 1024);
        return `${kb}KB`;
    } catch {
        return 'N/A';
    }
}

const projectRoot = __dirname;

section('📋 SYSTEM INFORMATION');

log(`Platform: ${os.platform()} ${os.arch()}`);
log(`Node: ${process.version}`);
log(`npm: v${execSync('npm --version', { encoding: 'utf-8' }).trim()}`);

try {
    const rustVersion = execSync('rustc --version', { encoding: 'utf-8' }).trim();
    log(`Rust: ${rustVersion}`);
} catch {
    log(`Rust: Not found`, 'red');
}

log(`CWD: ${projectRoot}`);

section('🔧 TAURI CONFIGURATION');

const tauriConfPath = path.join(projectRoot, 'tauri-app', 'src-tauri', 'tauri.conf.json');
fileExists(tauriConfPath, 'tauri.conf.json');

if (fs.existsSync(tauriConfPath)) {
    const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf-8'));
    console.log('  External binaries:');
    if (tauriConf.bundle?.externalBin) {
        tauriConf.bundle.externalBin.forEach(bin => {
            log(`    - ${bin}`, 'gray');
        });
    }
}

section('🔍 NODE SIDECAR BINARY');

const binDir = path.join(projectRoot, 'tauri-app', 'src-tauri', 'bin');
const nodeExe = path.join(binDir, 'node.exe');
const nodeGeneric = path.join(binDir, 'node');

let rustTarget = 'unknown';
try {
    const rustInfo = execSync('rustc -vV', { encoding: 'utf-8' });
    const hostLine = rustInfo.split('\n').find(line => line.startsWith('host:'));
    rustTarget = hostLine.split(/\s+/)[1];
} catch (e) {
    // Rust not installed
}

const platformBinary = path.join(binDir, `node-${rustTarget}.exe`);
const platformBinaryUnix = path.join(binDir, `node-${rustTarget}`);

log(`Target triple: ${rustTarget}\n`);

log('Checking for Node binaries:');
fileExists(nodeExe, `  Generic (Windows): node.exe`);
fileExists(nodeGeneric, `  Generic (Unix): node`);
fileExists(platformBinary, `  Platform-specific: node-${rustTarget}.exe`);
fileExists(platformBinaryUnix, `  Platform-specific: node-${rustTarget}`);

if (fs.existsSync(nodeExe)) {
    console.log(`    Size: ${getFileSize(nodeExe)}`);
}

section('📦 AUTOMATION ENGINE');

const engineDir = path.join(projectRoot, 'tauri-app', 'automation-engine');
fileExists(engineDir, 'automation-engine directory');

const enginePackageJson = path.join(engineDir, 'package.json');
fileExists(enginePackageJson, 'package.json');

const engineNodeModules = path.join(engineDir, 'node_modules');
const hasNodeModules = fs.existsSync(engineNodeModules);
check(hasNodeModules, 'node_modules installed', 
      hasNodeModules ? `✓ Found` : `✗ Missing - Run: npm run prepare-engine`);

if (hasNodeModules) {
    console.log('  Dependencies:');
    
    const deps = ['playwright', 'tsx', 'typescript', 'fs-extra', 'xlsx'];
    deps.forEach(dep => {
        const depPath = path.join(engineNodeModules, dep);
        const exists = fs.existsSync(depPath);
        const icon = exists ? '✓' : '✗';
        console.log(`    ${icon} ${dep}`);
    });
}

section('🌐 BROWSER BINARIES');

const browserDir = path.join(engineDir, 'local-browsers');
const chromiumDir = path.join(browserDir, 'chromium-1223');

fileExists(browserDir, 'local-browsers directory');
fileExists(chromiumDir, 'chromium-1223 directory');

// Check for platform-specific browser binaries
const chromeWin64 = path.join(chromiumDir, 'chrome-win64', 'chrome.exe');
const chromiumLinux = path.join(chromiumDir, 'chrome-linux64', 'chrome');
const chromiumMac = path.join(chromiumDir, 'chrome-mac', 'Chromium.app');

console.log('  Platform-specific browsers:');
fileExists(chromeWin64, `    Windows`, `${getFileSize(chromeWin64)}`);
fileExists(chromiumLinux, `    Linux`, `${getFileSize(chromiumLinux)}`);
fileExists(chromiumMac, `    macOS`, `${getFileSize(chromiumMac)}`);

section('🎨 FRONTEND BUILD');

const tauraAppDir = path.join(projectRoot, 'tauri-app');
fileExists(path.join(tauraAppDir, 'package.json'), 'tauri-app/package.json');
fileExists(path.join(tauraAppDir, 'vite.config.ts'), 'vite.config.ts');
fileExists(path.join(tauraAppDir, 'tsconfig.json'), 'tsconfig.json');

const tauraAppNodeModules = path.join(tauraAppDir, 'node_modules');
check(fs.existsSync(tauraAppNodeModules), 'tauri-app/node_modules installed');

const distDir = path.join(tauraAppDir, 'dist');
check(fs.existsSync(distDir), 'dist directory built', 
      fs.existsSync(distDir) ? '✓ Ready for production' : '⚠ Not built yet - Will be built on npm run build');

section('🧪 TEST SUITE');

const testsDir = path.join(engineDir, 'tests');
fileExists(testsDir, 'tests directory');

const testFile = path.join(testsDir, 'temp_task.ts');
fileExists(testFile, '  temp_task.ts');

section('📋 SETUP SCRIPT STATUS');

const setupWinScript = path.join(projectRoot, 'setup-windows.js');
const prepareSidecarScript = path.join(projectRoot, 'prepare-sidecar.js');
const prepareEngineScript = path.join(projectRoot, 'prepare-engine.js');
const verifyScript = path.join(projectRoot, 'verify-setup.js');

fileExists(setupWinScript, 'setup-windows.js');
fileExists(prepareSidecarScript, 'prepare-sidecar.js');
fileExists(prepareEngineScript, 'prepare-engine.js');
fileExists(verifyScript, 'verify-setup.js');

section('🔧 RECOMMENDED ACTIONS');

const issues = [];

if (!fs.existsSync(nodeExe) && !fs.existsSync(nodeGeneric) && !fs.existsSync(platformBinary) && !fs.existsSync(platformBinaryUnix)) {
    issues.push({
        priority: 'HIGH',
        action: 'Set up Node sidecar',
        command: 'npm run prepare-bins',
        reason: 'Node binary not found for Tauri'
    });
}

if (!hasNodeModules) {
    issues.push({
        priority: 'HIGH',
        action: 'Install automation engine dependencies',
        command: 'npm run prepare-engine',
        reason: 'Dependencies not installed'
    });
}

const chromiumExists = fs.existsSync(chromeWin64) || fs.existsSync(chromiumLinux) || fs.existsSync(chromiumMac);
if (!chromiumExists) {
    issues.push({
        priority: 'HIGH',
        action: 'Download Chromium browser',
        command: 'cd tauri-app/automation-engine && npx playwright install chromium',
        reason: 'Browser binary not found'
    });
}

if (!fs.existsSync(tauraAppNodeModules)) {
    issues.push({
        priority: 'MEDIUM',
        action: 'Install frontend dependencies',
        command: 'cd tauri-app && npm install',
        reason: 'Frontend dependencies not installed'
    });
}

if (issues.length === 0) {
    log('\n✅ All checks passed! Your setup is ready.', 'green');
    log('You can now run:', 'cyan');
    log('  npm run dev      - Start development', 'green');
    log('  npm run build    - Build for production', 'green');
} else {
    log(`\n⚠️  Found ${issues.length} issue(s) that need attention:\n`, 'yellow');
    
    issues.sort((a, b) => {
        const priority = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2 };
        return priority[a.priority] - priority[b.priority];
    });
    
    issues.forEach((issue, idx) => {
        const color = issue.priority === 'HIGH' ? 'red' : issue.priority === 'MEDIUM' ? 'yellow' : 'gray';
        log(`${idx + 1}. [${issue.priority}] ${issue.action}`, color);
        log(`   Reason: ${issue.reason}`, 'gray');
        log(`   Fix: ${issue.command}`, 'cyan');
        console.log('');
    });
}

section('💡 TROUBLESHOOTING HELP');

log('Common issues and solutions:');
console.log('');
log('Issue: "Node binary not found"', 'yellow');
log('  → Run: npm run prepare-bins', 'green');
log('');
log('Issue: "Chromium browsers not installed"', 'yellow');
log('  → Run: npm run prepare-engine', 'green');
log('');
log('Issue: "tsx not installed"', 'yellow');
log('  → Run: cd tauri-app/automation-engine && npm install', 'green');
log('');
log('Issue: "Permission denied"', 'yellow');
log('  → Run script with Administrator privileges', 'green');
log('  → Or clear npm cache: npm cache clean --force', 'green');
log('');
log('For more help, see: WINDOWS_SETUP.md', 'cyan');

console.log('');
