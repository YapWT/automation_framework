import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Recreate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function prepare() {
    const engineDir = path.join(__dirname, '../automation-engine');
    const tauriBinDir = path.join(__dirname, '../src-tauri/bin');
    const browserDir = path.join(engineDir, 'local-browsers');

    console.log('📦 Preparing Automation Engine for production...');

    // 1. Install dependencies in the engine
    execSync('npm install', {
        cwd: engineDir,
        stdio: 'inherit'
    });

    // 2. Download browsers into the LOCAL engine folder
    console.log('🌐 Downloading bundled Chromium...');

    process.env.PLAYWRIGHT_BROWSERS_PATH = browserDir;

    execSync('npx playwright install chromium', {
        cwd: engineDir,
        stdio: 'inherit'
    });

    // 3. Ensure bin directory exists for Node sidecar
    if (!fs.existsSync(tauriBinDir)) {
        fs.mkdirSync(tauriBinDir, { recursive: true });
    }

    console.log('✅ Production assets prepared.');
}

prepare();
