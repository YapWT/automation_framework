const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetDir = path.join(__dirname, 'tauri-app', 'src-tauri', 'bin');
if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

// 1. Get the Rust Target Triple for the current machine
let targetTriple;
try {
    targetTriple = execSync('rustc -vV')
        .toString()
        .split('\n')
        .find(line => line.startsWith('host:'))
        .split(' ')[1]
        .trim();
} catch (e) {
    console.error("Error: Rust/Cargo is not installed.");
    process.exit(1);
}

// 2. Determine binary name (Tauri needs platform-specific names)
const extension = process.platform === 'win32' ? '.exe' : '';
const platformBinaryName = `node-${targetTriple}${extension}`;
const genericBinaryName = `node${extension}`;

const targetSpecificPath = path.join(targetDir, platformBinaryName);
const genericPath = path.join(targetDir, genericBinaryName);

// 3. Copy your current Node binary to the sidecar location
try {
    const nodePath = process.execPath;
    console.log(`Setting up sidecar for ${targetTriple}...`);
    
    // Copy to platform-specific name (what Tauri prefers)
    fs.copyFileSync(nodePath, targetSpecificPath);
    fs.chmodSync(targetSpecificPath, 0o755);
    console.log(`✓ Platform-specific binary: ${platformBinaryName}`);
    
    // Also create a generic 'node' copy for fallback
    fs.copyFileSync(nodePath, genericPath);
    fs.chmodSync(genericPath, 0o755);
    console.log(`✓ Generic binary: ${genericBinaryName}`);
    console.log(`\nSidecar ready at: ${targetDir}`);
} catch (e) {
    console.error(`Failed to copy node binary: ${e.message}`);
}