use tauri::{AppHandle, Manager, Runtime, path::BaseDirectory};
use std::path::PathBuf;

pub fn get_bundle_paths<R: Runtime>(app: &AppHandle<R>) -> (PathBuf, PathBuf) {
    // Locate the internal resources folder
    let resource_path = app.path()
        .resolve("", BaseDirectory::Resource)
        .expect("failed to resolve resource dir");
    
    // In production, Tauri extracts resources to _up_ subdirectory
    // The bundled automation-engine is at: _up_/automation-engine
    let engine_path = if cfg!(debug_assertions) {
        // Development: look in resources/automation-engine
        resource_path.join("automation-engine")
    } else {
        // Production: look in _up_/automation-engine
        resource_path.join("_up_").join("automation-engine")
    };
    
    let browser_path = engine_path.join("local-browsers");
    
    (engine_path, browser_path)
}
