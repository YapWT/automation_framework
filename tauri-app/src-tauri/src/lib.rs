mod runtime;
use std::fs;
use std::io::{BufRead, BufReader};
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;
use tauri::{path::BaseDirectory, Emitter, Manager, State, Window};

#[cfg(unix)]
use std::os::unix::process::CommandExt;

use tauri_plugin_shell::ShellExt;

struct AppState {
    running_process: Arc<Mutex<Option<Child>>>,
}

fn get_tests_dir() -> PathBuf {
    let mut path = std::env::current_dir().unwrap();
    if path.ends_with("src-tauri") {
        path.pop();
    }
    path.push("automation-engine");
    path.push("tests");
    if !path.exists() {
        fs::create_dir_all(&path).unwrap();
    }
    path.canonicalize().unwrap_or(path)
}

#[tauri::command]
async fn auto_save_temp(code: String) -> Result<String, String> {
    let mut path = get_tests_dir();
    path.push("temp_task.ts");
    fs::write(path, code).map_err(|e| e.to_string())?;
    Ok("Saved".into())
}

#[tauri::command]
async fn save_permanent_script(code: String, filename: String) -> Result<String, String> {
    let path = if filename.contains('/') || filename.contains('\\') {
        std::path::PathBuf::from(filename)
    } else {
        let mut p = get_tests_dir();
        let name = if filename.ends_with(".ts") {
            filename
        } else {
            format!("{}.ts", filename)
        };
        p.push(name);
        p
    };

    fs::write(path, code).map_err(|e| e.to_string())?;
    Ok("Saved Successfully".into())
}

#[tauri::command]
fn get_default_save_path() -> Result<String, String> {
    let path = get_tests_dir();
    Ok(path.to_string_lossy().into_owned())
}

#[tauri::command]
async fn read_script_content(filename: String) -> Result<String, String> {
    let mut path = get_tests_dir();
    path.push(filename);
    fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
async fn execute_script(window: Window, state: State<'_, AppState>, filename: String) -> Result<String, String> {
    let app = window.app_handle();
    let mut script_path = get_tests_dir();
    script_path.push(&filename);
    
    if !script_path.exists() {
        return Err(format!("Script file not found: {:?}", script_path));
    }

    let is_prod = !cfg!(debug_assertions);
    
    // --- 1. PREPARE THE COMMAND ---
    let (mut command, final_engine_path, final_browser_path) = if !is_prod {
        // DEVELOPMENT MODE
        let mut engine_path = std::env::current_dir().unwrap();
        if engine_path.ends_with("src-tauri") { engine_path.pop(); }
        engine_path.push("automation-engine");

        let cmd = if cfg!(target_os = "windows") {
            let mut c = Command::new("cmd");
            c.args(["/C", "npx", "tsx", &script_path.to_string_lossy()]);
            c
        } else {
            let mut c = Command::new("npx");
            c.args(["tsx", &script_path.to_string_lossy()]);
            #[cfg(unix)] { c.process_group(0); }
            c
        };
        (cmd, engine_path, None)
    } else {
        // PRODUCTION MODE: Use the official Sidecar API
        // This automatically finds "node-x86_64-pc-windows-msvc.exe" etc.
        let sidecar = app.shell().sidecar("bin/node")
            .map_err(|e| format!("Failed to locate sidecar: {}", e))?;
        
        let (prod_engine, prod_browser) = runtime::get_bundle_paths(app);
        
        if !prod_engine.exists() {
            return Err("Internal Error: Automation engine resources missing.".into());
        }

        let tsx_path = prod_engine.join("node_modules/tsx/dist/cli.mjs");
        
        // Convert to Command
        let mut c = Command::from(sidecar);
        c.args([
            tsx_path.to_string_lossy().to_string(),
            script_path.to_string_lossy().to_string()
        ]);
        
        #[cfg(unix)] { c.process_group(0); }
        (c, prod_engine, Some(prod_browser))
    };

    // --- 2. CONFIGURE ENVIRONMENT ---
    command.current_dir(&final_engine_path);
    command.stdout(Stdio::piped());
    command.stderr(Stdio::piped());

    if let Some(bp) = final_browser_path {
        command.env("PLAYWRIGHT_BROWSERS_PATH", bp);
    }

    // --- 3. SPAWN ---
    let mut child = command.spawn()
        .map_err(|e| format!("Process failed to start: {}. Ensure resources are installed.", e))?;

    let stdout = child.stdout.take().ok_or("Failed to open stdout")?;
    let stderr = child.stderr.take().ok_or("Failed to open stderr")?;

    {
        let mut running = state.running_process.lock().unwrap();
        *running = Some(child);
    }

    // --- 4. LOGGING & MONITORING (Same as your logic but with flattening) ---
    let win_out = window.clone();
    thread::spawn(move || {
        let r = BufReader::new(stdout);
        for l in r.lines().flatten() { let _ = win_out.emit("automation-log", l); }
    });

    let win_err = window.clone();
    thread::spawn(move || {
        let r = BufReader::new(stderr);
        for l in r.lines().flatten() { let _ = win_err.emit("automation-log", format!("TASK:FAIL:{}", l)); }
    });

    let running_clone = Arc::clone(&state.running_process);
    let win_fin = window.clone();
    thread::spawn(move || {
        loop {
            thread::sleep(std::time::Duration::from_millis(500));
            let mut lock = running_clone.lock().unwrap();
            if let Some(child) = lock.as_mut() {
                if let Ok(Some(status)) = child.try_wait() {
                    let _ = win_fin.emit("automation-finished", status.success());
                    *lock = None;
                    break;
                }
            } else { break; }
        }
    });

    Ok("Started".into())
}

#[tauri::command]
async fn stop_script(state: State<'_, AppState>) -> Result<String, String> {
    let mut lock = state.running_process.lock().unwrap();
    let child_handle = lock.take();

    if let Some(mut child) = child_handle {
        let pid = child.id();

        #[cfg(target_os = "windows")]
        {
            let _ = Command::new("taskkill")
                .args(["/F", "/T", "/PID", &pid.to_string()])
                .output();
        }

        #[cfg(not(target_os = "windows"))]
        {
            let pgid = pid;
            unsafe {
                libc::kill(-(pgid as libc::pid_t), libc::SIGKILL);
            }
            let _ = child.kill();
        }

        Ok("Process tree terminated".into())
    } else {
        Err("No active process found".into())
    }
}

#[tauri::command]
async fn list_saved_scripts() -> Result<Vec<String>, String> {
    let path = get_tests_dir();
    let mut files = Vec::new();
    for entry in fs::read_dir(path).map_err(|e| e.to_string())?.flatten() {
        let name = entry.file_name().to_string_lossy().into_owned();
        if name.ends_with(".ts") && name != "temp_task.ts" {
            files.push(name);
        }
    }
    Ok(files)
}

#[tauri::command]
async fn delete_script(filename: String) -> Result<String, String> {
    let mut path = get_tests_dir();
    path.push(&filename);
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
        Ok("Deleted".into())
    } else {
        Err("File not found".into())
    }
}

#[tauri::command]
async fn rename_script(old_name: String, new_name: String) -> Result<String, String> {
    let mut old_path = get_tests_dir();
    old_path.push(&old_name);
    let mut new_path = get_tests_dir();
    new_path.push(&new_name);

    std::fs::rename(old_path, new_path).map_err(|e| e.to_string())?;
    Ok("Renamed".into())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState {
            running_process: Arc::new(Mutex::new(None)),
        })
        .invoke_handler(tauri::generate_handler![
            auto_save_temp,
            save_permanent_script,
            read_script_content,
            stop_script,
            execute_script,
            delete_script,
            list_saved_scripts,
            rename_script,
            get_default_save_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
