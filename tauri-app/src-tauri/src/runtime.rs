use tauri::{AppHandle, Manager, Runtime, path::BaseDirectory};
use std::path::PathBuf;

pub fn get_bundle_paths<R: Runtime>(app: &AppHandle<R>) -> (PathBuf, PathBuf) {
    // Locate the internal resources folder
    let resource_path = app.path()
        .resolve("", BaseDirectory::Resource)
        .expect("failed to resolve resource dir");
    
    // The bundled engine is copied under resources/automation-engine
    let engine_path = resource_path.join("automation-engine");
    let browser_path = engine_path.join("local-browsers");
    
    (engine_path, browser_path)
}
