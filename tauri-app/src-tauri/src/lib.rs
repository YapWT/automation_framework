use std::fs;
use std::io::Write;
use std::process::Command;
use std::path::PathBuf;
use tauri::WindowEvent;

// Robust helper to locate the automation-engine/tests folder
fn get_tests_dir() -> PathBuf {
    let mut path = std::env::current_dir().unwrap();
    
    // If we are inside src-tauri (common in dev mode), go up to project root
    if path.ends_with("src-tauri") {
        path.pop();
    }
    
    path.push("automation-engine");
    path.push("tests");
    
    if !path.exists() {
        fs::create_dir_all(&path).unwrap();
    }
    path
}

fn clear_temp_file() {
    let mut path = get_tests_dir();
    path.push("temp_task.ts");
    let _ = fs::write(path, ""); 
}

#[tauri::command]
async fn auto_save_temp(code: String) -> Result<String, String> {
    let mut path = get_tests_dir();
    path.push("temp_task.ts");
    let mut file = fs::File::create(&path).map_err(|e| e.to_string())?;
    file.write_all(code.as_bytes()).map_err(|e| e.to_string())?;
    Ok("Temp updated".into())
}

#[tauri::command]
async fn save_permanent_script(code: String, filename: String) -> Result<String, String> {
    let mut path = get_tests_dir();
    let name = if filename.ends_with(".ts") { filename } else { format!("{}.ts", filename) };
    path.push(name);
    let mut file = fs::File::create(&path).map_err(|e| e.to_string())?;
    file.write_all(code.as_bytes()).map_err(|e| e.to_string())?;
    Ok(format!("Saved successfully"))
}

#[tauri::command]
async fn execute_script(filename: String) -> Result<String, String> {
    let mut script_path = get_tests_dir();
    script_path.push(&filename);

    let mut engine_path = std::env::current_dir().unwrap();
    if engine_path.ends_with("src-tauri") {
        engine_path.pop();
    }
    engine_path.push("automation-engine");

    if !script_path.exists() {
        return Err(format!("File not found at: {:?}", script_path));
    }

    // CROSS-PLATFORM EXECUTION LOGIC
    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(["/C", "npx", "tsx", script_path.to_str().unwrap()])
            .current_dir(engine_path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(not(target_os = "windows"))]
    {
        // On Linux/macOS, we call npx directly
        Command::new("npx")
            .args(["tsx", script_path.to_str().unwrap()])
            .current_dir(engine_path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(format!("Started {}", filename))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            auto_save_temp, 
            save_permanent_script, 
            execute_script
        ])
        .on_window_event(|_window, event| {
            if let WindowEvent::CloseRequested { .. } = event {
                clear_temp_file();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
