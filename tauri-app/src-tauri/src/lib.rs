use std::fs;
use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};
use std::path::PathBuf;
use std::thread;
use tauri::{Emitter, WindowEvent};

fn get_tests_dir() -> PathBuf {
    let mut path = std::env::current_dir().unwrap();
    if path.ends_with("src-tauri") { path.pop(); }
    path.push("automation-engine");
    path.push("tests");
    if !path.exists() { fs::create_dir_all(&path).unwrap(); }
    path
}

fn clear_temp_file() {
    let mut path = get_tests_dir();
    path.push("temp_task.ts");
    let _ = fs::write(path, ""); 
}

#[tauri::command]
async fn list_saved_scripts() -> Result<Vec<String>, String> {
    let path = get_tests_dir();
    let entries = fs::read_dir(path).map_err(|e| e.to_string())?;
    let mut files = Vec::new();
    for entry in entries {
        if let Ok(entry) = entry {
            let name = entry.file_name().to_string_lossy().into_owned();
            if name.ends_with(".ts") && name != "temp_task.ts" { files.push(name); }
        }
    }
    Ok(files)
}

#[tauri::command]
async fn read_script_content(filename: String) -> Result<String, String> {
    let mut path = get_tests_dir();
    path.push(filename);
    fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
async fn auto_save_temp(code: String) -> Result<String, String> {
    let mut path = get_tests_dir();
    path.push("temp_task.ts");
    fs::write(path, code).map_err(|e| e.to_string())?;
    Ok("OK".into())
}

#[tauri::command]
async fn save_permanent_script(code: String, filename: String) -> Result<String, String> {
    let mut path = get_tests_dir();
    let name = if filename.ends_with(".ts") { filename } else { format!("{}.ts", filename) };
    path.push(&name);
    fs::write(path, code).map_err(|e| e.to_string())?;
    Ok(format!("Saved: {}", name))
}

#[tauri::command]
async fn execute_script(window: tauri::Window, filename: String) -> Result<String, String> {
    let mut script_path = get_tests_dir();
    script_path.push(&filename);
    let mut engine_path = std::env::current_dir().unwrap();
    if engine_path.ends_with("src-tauri") { engine_path.pop(); }
    engine_path.push("automation-engine");

    let mut child = if cfg!(target_os = "windows") {
        Command::new("cmd").args(["/C", "npx", "tsx", script_path.to_str().unwrap()])
            .current_dir(&engine_path).stdout(Stdio::piped()).stderr(Stdio::piped()).spawn().map_err(|e| e.to_string())?
    } else {
        Command::new("npx").args(["tsx", script_path.to_str().unwrap()])
            .current_dir(&engine_path).stdout(Stdio::piped()).stderr(Stdio::piped()).spawn().map_err(|e| e.to_string())?
    };

    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();
    let win_out = window.clone();
    let win_err = window.clone();

    thread::spawn(move || {
        let r = BufReader::new(stdout);
        for l in r.lines() { if let Ok(c) = l { let _ = win_out.emit("automation-log", c); } }
    });
    thread::spawn(move || {
        let r = BufReader::new(stderr);
        for l in r.lines() { if let Ok(c) = l { let _ = win_err.emit("automation-log", format!("Error: {}", c)); } }
    });
    Ok("Started".into())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            auto_save_temp, save_permanent_script, execute_script, list_saved_scripts, read_script_content
        ])
        .on_window_event(|_window, event| {
            if let WindowEvent::CloseRequested { .. } = event { clear_temp_file(); }
        })
        .run(tauri::generate_context!())
        .expect("error while running");
}
