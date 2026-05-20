#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function check(condition, message) {
  const icon = condition ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
  console.log(`${icon} ${message}`);
  return condition;
}

function logSection(title) {
  console.log(`\n${colors.blue}${title}${colors.reset}`);
  console.log('─'.repeat(50));
}

let allGood = true;

logSection('🔍 Environment Checks');

// Check Node.js
try {
  const version = execSync('node --version').toString().trim();
  check(true, `Node.js: ${version}`);
} catch (e) {
  check(false, 'Node.js not found in PATH');
  allGood = false;
}

// Check npm
try {
  const version = execSync('npm --version').toString().trim();
  check(true, `npm: ${version}`);
} catch (e) {
  check(false, 'npm not found in PATH');
  allGood = false;
}

// Check Rust
try {
  execSync('rustc --version', { stdio: 'ignore' });
  check(true, 'Rust toolchain found');
} catch (e) {
  check(false, 'Rust toolchain not found');
  allGood = false;
}

logSection('📁 Project Structure');

const engineDir = path.join(__dirname, 'tauri-app', 'automation-engine');
check(fs.existsSync(engineDir), `automation-engine directory exists`);

const testsDir = path.join(engineDir, 'tests');
check(fs.existsSync(testsDir), `tests directory exists: ${testsDir}`);

const browserDir = path.join(engineDir, 'local-browsers');
check(fs.existsSync(browserDir), `local-browsers directory exists`);

logSection('📦 Dependencies');

const pkgPath = path.join(engineDir, 'package.json');
check(fs.existsSync(pkgPath), 'automation-engine/package.json exists');

const nodeModulesPath = path.join(engineDir, 'node_modules');
const hasNodeModules = fs.existsSync(nodeModulesPath);
check(hasNodeModules, 'node_modules installed');

if (hasNodeModules) {
  const hasPlaywright = fs.existsSync(path.join(nodeModulesPath, 'playwright'));
  check(hasPlaywright, '  - playwright installed');

  const hasTsx = fs.existsSync(path.join(nodeModulesPath, 'tsx'));
  check(hasTsx, '  - tsx installed');

  const hasXlsx = fs.existsSync(path.join(nodeModulesPath, 'xlsx'));
  check(hasXlsx, '  - xlsx installed');

  const hasFsExtra = fs.existsSync(path.join(nodeModulesPath, 'fs-extra'));
  check(hasFsExtra, '  - fs-extra installed');
}

logSection('🌐 Browsers');

const chromiumDir = path.join(browserDir, 'chromium-1223');
const hasChromium = fs.existsSync(chromiumDir);
check(hasChromium, 'Chromium installed');

if (hasChromium) {
  const linuxChrome = path.join(chromiumDir, 'chrome-linux64', 'chrome');
  const windowsChrome = path.join(chromiumDir, 'chrome-win64', 'chrome.exe');
  const macChrome = path.join(chromiumDir, 'chrome-mac', 'Chromium.app');
  
  if (fs.existsSync(linuxChrome)) check(true, '  - Linux Chromium binary found');
  if (fs.existsSync(windowsChrome)) check(true, '  - Windows Chromium binary found');
  if (fs.existsSync(macChrome)) check(true, '  - macOS Chromium binary found');
}

const ffmpegDir = path.join(browserDir, 'ffmpeg-1011');
check(fs.existsSync(ffmpegDir), 'FFmpeg installed');

logSection('🔧 Tauri Setup');

const sidecarDir = path.join(__dirname, 'tauri-app', 'src-tauri', 'bin');
const hasSidecar = fs.existsSync(sidecarDir) && 
  fs.readdirSync(sidecarDir).some(f => f.startsWith('node-'));
check(hasSidecar, 'Node.js sidecar prepared');

const tsxPath = path.join(engineDir, 'node_modules', 'tsx', 'dist', 'cli.mjs');
check(fs.existsSync(tsxPath), 'tsx CLI available');

logSection('Summary');

if (allGood && hasNodeModules && hasChromium && hasSidecar && fs.existsSync(tsxPath)) {
  console.log(`\n${colors.green}✅ Everything looks good! You're ready to build.${colors.reset}`);
  console.log(`   Run: ${colors.blue}npm run build${colors.reset}`);
  process.exit(0);
} else {
  console.log(`\n${colors.yellow}⚠️  Some dependencies are missing.${colors.reset}`);
  console.log(`   Run: ${colors.blue}npm run prepare-engine${colors.reset}`);
  process.exit(1);
}
