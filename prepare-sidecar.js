const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📦 Setting up Node sidecar binary...\n');

const targetDir = path.join(__dirname, 'tauri-app', 'src-tauri', 'bin');

// Ensure target directory exists
try {
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
        console.log(`✓ Created directory: ${targetDir}`);
    }
} catch (e) {
    console.error(`❌ Failed to create target directory: ${e.message}`);
    process.exit(1);
}

// 1. Get the Rust Target Triple for the current machine
let targetTriple;
try {
    const rustInfo = execSync('rustc -vV', { encoding: 'utf-8' });
    const hostLine = rustInfo.split('\n').find(line => line.startsWith('host:'));
    if (!hostLine) {
        throw new Error('Could not find host line in rustc output');
    }
    targetTriple = hostLine.split(/\s+/)[1];
    console.log(`✓ Detected platform: ${targetTriple}`);
} catch (e) {
    console.error("❌ Error: Rust/Cargo is not installed or not accessible.");
    console.error("   Install Rust from https://rustup.rs/");
    process.exit(1);
}

// 2. Determine binary name (Tauri needs platform-specific names)
const extension = process.platform === 'win32' ? '.exe' : '';
const platformBinaryName = `node-${targetTriple}${extension}`;
const genericBinaryName = `node${extension}`;

const targetSpecificPath = path.join(targetDir, platformBinaryName);
const genericPath = path.join(targetDir, genericBinaryName);

console.log(`\n📋 Setup Details:`);
console.log(`   Platform-specific: ${platformBinaryName}`);
console.log(`   Generic fallback: ${genericBinaryName}`);
console.log(`   Target directory: ${targetDir}\n`);

// 3. Copy your current Node binary to the sidecar location
try {
    const nodePath = process.execPath;
    console.log(`📋 Source Node binary: ${nodePath}`);
    
    if (!fs.existsSync(nodePath)) {
        throw new Error(`Node binary not found at: ${nodePath}`);
    }
    
    // Copy to platform-specific name (what Tauri prefers)
    console.log(`⏳ Copying to platform-specific name...`);
    fs.copyFileSync(nodePath, targetSpecificPath);
    
    // On Unix-like systems, make it executable
    if (process.platform !== 'win32') {
        fs.chmodSync(targetSpecificPath, 0o755);
    }
    console.log(`✓ Platform-specific binary ready`);
    
    // Also create a generic 'node' copy for fallback
    console.log(`⏳ Copying to generic name...`);
    fs.copyFileSync(nodePath, genericPath);
    
    // On Unix-like systems, make it executable
    if (process.platform !== 'win32') {
        fs.chmodSync(genericPath, 0o755);
    }
    console.log(`✓ Generic binary ready`);
    
    console.log(`\n✅ Node sidecar setup completed successfully!`);
    console.log(`\n📁 Binaries are available at:`);
    console.log(`   - ${targetSpecificPath}`);
    console.log(`   - ${genericPath}`);
    
    process.exit(0);
} catch (e) {
    console.error(`\n❌ Failed to copy node binary: ${e.message}`);
    console.error(`\n💡 Troubleshooting:`);
    console.error(`   - Ensure you have write permissions to: ${targetDir}`);
    console.error(`   - Try running with administrator privileges on Windows`);
    console.error(`   - Check that the source path is valid: ${process.execPath}`);
    process.exit(1);
}