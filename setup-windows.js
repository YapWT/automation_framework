#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
    cyan: '\x1b[36m'
};

function log(msg, color = 'reset') {
    console.log(`${colors[color]}${msg}${colors.reset}`);
}

function section(title) {
    console.log(`\n${colors.blue}${'═'.repeat(60)}${colors.reset}`);
    log(title, 'cyan');
    console.log(`${colors.blue}${'═'.repeat(60)}${colors.reset}\n`);
}

function check(condition, message) {
    const icon = condition ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    console.log(`${icon} ${message}`);
    return condition;
}

let hasErrors = false;

section('🔍 Windows Environment Pre-Flight Checks');

// Check Node.js
try {
    const version = execSync('node --version', { encoding: 'utf-8' }).trim();
    check(true, `Node.js: ${version}`);
} catch (e) {
    check(false, 'Node.js not found');
    log('  → Install from: https://nodejs.org/', 'yellow');
    hasErrors = true;
}

// Check npm
try {
    const version = execSync('npm --version', { encoding: 'utf-8' }).trim();
    check(true, `npm: ${version}`);
} catch (e) {
    check(false, 'npm not found');
    hasErrors = true;
}

// Check Rust
try {
    execSync('rustc --version', { stdio: 'ignore' });
    check(true, 'Rust toolchain found');
} catch (e) {
    check(false, 'Rust toolchain not found');
    log('  → Install from: https://rustup.rs/', 'yellow');
    hasErrors = true;
}

// Check git
try {
    execSync('git --version', { stdio: 'ignore' });
    check(true, 'Git found');
} catch (e) {
    check(false, 'Git not found (optional but recommended)');
}

// Check if running as Administrator
const isAdmin = (() => {
    try {
        execSync('fsutil fsinfo drives', { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
})();

if (!isAdmin) {
    log('\n⚠️  Not running as Administrator', 'yellow');
    log('   For best results, run this script with Admin privileges\n', 'yellow');
}

if (hasErrors) {
    log('\n❌ Some prerequisites are missing. Please install them and try again.\n', 'red');
    process.exit(1);
}

section('📁 Project Structure Validation');

const projectRoot = __dirname;
const engineDir = path.join(projectRoot, 'tauri-app', 'automation-engine');
const tauriDir = path.join(projectRoot, 'tauri-app', 'src-tauri');
const binDir = path.join(tauriDir, 'bin');

check(fs.existsSync(engineDir), `automation-engine directory`);
check(fs.existsSync(tauriDir), `src-tauri directory`);
check(fs.existsSync(binDir) || !fs.existsSync(binDir), `bin directory (will be created if needed)`);

section('🔧 Setting Up Node Sidecar Binary');

try {
    log('Running: node prepare-sidecar.js\n', 'cyan');
    const result = spawnSync('node', ['prepare-sidecar.js'], {
        cwd: projectRoot,
        stdio: 'inherit',
        shell: true
    });
    
    if (result.status !== 0) {
        throw new Error(`Sidecar setup failed with status ${result.status}`);
    }
} catch (e) {
    log(`\n❌ Sidecar setup failed: ${e.message}\n`, 'red');
    hasErrors = true;
}

section('📦 Installing Engine Dependencies');

try {
    log('Running: node prepare-engine.js\n', 'cyan');
    const result = spawnSync('node', ['prepare-engine.js'], {
        cwd: projectRoot,
        stdio: 'inherit',
        shell: true
    });
    
    if (result.status !== 0) {
        throw new Error(`Engine preparation failed with status ${result.status}`);
    }
} catch (e) {
    log(`\n❌ Engine preparation failed: ${e.message}\n`, 'red');
    hasErrors = true;
}

section('✅ Setup Complete');

if (!hasErrors) {
    log('All setup steps completed successfully!\n', 'green');
    log('You can now run:', 'cyan');
    log('  npm run dev        - Start development server', 'green');
    log('  npm run build      - Build for production', 'green');
} else {
    log('Setup completed with some warnings. See above for details.\n', 'yellow');
}

log('\n📋 Troubleshooting:');
log('  If you encounter issues, try:');
log('    1. Run this script with Administrator privileges');
log('    2. Clear npm cache: npm cache clean --force');
log('    3. Delete node_modules: rm -r tauri-app/automation-engine/node_modules');
log('    4. Reinstall: npm run prepare-engine\n');

process.exit(hasErrors ? 1 : 0);
