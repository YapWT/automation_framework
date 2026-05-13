use tauri::{AppHandle, Manager, Runtime, path::BaseDirectory};
use std::path::PathBuf;

pub fn get_bundle_paths<R: Runtime>(app: &AppHandle<R>) -> (PathBuf, PathBuf) {
    // Locate the internal resources folder
    let resource_path = app.path()
        .resolve("", BaseDirectory::Resource)
        .expect("failed to resolve resource dir");
    
    // In production, everything lives inside the resources folder
    let engine_path = resource_path.clone();
    let browser_path = resource_path.join("local-browsers");
    
    (engine_path, browser_path)
}
