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

// 2. Determine binary name
const extension = process.platform === 'win32' ? '.exe' : '';
const binaryName = `node-${targetTriple}${extension}`;
const destPath = path.join(targetDir, binaryName);

// 3. Copy your current Node binary to the sidecar location
try {
    const nodePath = process.execPath;
    console.log(`Setting up sidecar for ${targetTriple}...`);
    fs.copyFileSync(nodePath, destPath);
    fs.chmodSync(destPath, 0o755); // Make it executable
    console.log(`Success: Sidecar created at ${destPath}`);
} catch (e) {
    console.error(`Failed to copy node binary: ${e.message}`);
}