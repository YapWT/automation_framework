import { Command } from '@tauri-apps/plugin-shell';
import { resolveResource } from '@tauri-apps/api/path';

async function runAutomation() {
  try {
    // 1. Get the absolute path to your engine script
    const scriptPath = await resolveResource('automation-engine/index.js');
    
    // 2. Get the absolute path to the directory (so node knows where to find node_modules)
    const engineDir = await resolveResource('automation-engine/');

    // 3. Start the sidecar
    // Note: Use 'bin/node' because that matches your tauri.conf.json name
    const command = Command.sidecar('bin/node', [scriptPath], {
      cwd: engineDir // Set the working directory to the engine folder
    });

    command.on('close', data => {
      console.log(`Command finished with code ${data.code}`);
    });
    
    command.on('error', error => {
      console.error(`Command error: ${error}`);
    });

    const child = await command.spawn();
    console.log(`Started automation with PID: ${child.pid}`);

  } catch (err) {
    console.error("Failed to start automation:", err);
  }
}