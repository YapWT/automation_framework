#[tauri::command]
async fn start_automation(_window: tauri::Window, path: String) -> Result<String, String> {
    use std::process::Command;

    // Use npx.cmd on Windows to avoid "file not found" errors
    let output = Command::new("cmd")
        .args(["/C", "npx", "ts-node", "../automation-engine/index.ts", &path])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok("Finished".into())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![start_automation])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
