use rdev::{listen, Event, EventType};
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::{BufRead, BufReader};
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Instant;
use tauri::{Emitter, State, Window };
use std::process::Child;
#[cfg(unix)]
use std::os::unix::process::CommandExt;

#[derive(Serialize, Deserialize, Debug, Clone)]
struct RecordedEvent {
    event_type: String,
    x: f64,
    y: f64,
    button: Option<String>,
    key: Option<String>,
    delay_ms: u128,
}

struct RecordingState {
    is_recording: Arc<AtomicBool>,
    events: Arc<Mutex<Vec<RecordedEvent>>>,
}

struct AppState {
    is_recording: Arc<AtomicBool>,
    events: Arc<Mutex<Vec<RecordedEvent>>>,
    running_process: Arc<Mutex<Option<Child>>>, 
}

fn get_tests_dir() -> PathBuf {
    let mut path = std::env::current_dir().unwrap();
    if path.ends_with("src-tauri") { path.pop(); }
    path.push("automation-engine");
    path.push("tests");
    if !path.exists() { fs::create_dir_all(&path).unwrap(); }
    path
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
    let mut path = get_tests_dir();
    let name = if filename.ends_with(".ts") { filename } else { format!("{}.ts", filename) };
    path.push(name);
    fs::write(path, code).map_err(|e| e.to_string())?;
    Ok("Saved Successfully".into())
}

#[tauri::command]
async fn read_script_content(filename: String) -> Result<String, String> {
    let mut path = get_tests_dir();
    path.push(filename);
    fs::read_to_string(path).map_err(|e| e.to_string())
}

// --- RECORDING & EXECUTION ---

#[tauri::command]
async fn start_global_recording(state: State<'_, RecordingState>) -> Result<String, String> {
    state.is_recording.store(true, Ordering::SeqCst);
    state.events.lock().unwrap().clear();
    let is_recording_flag = Arc::clone(&state.is_recording);
    let events_storage = Arc::clone(&state.events);

    thread::spawn(move || {
        let start_time = Instant::now();
        let _ = listen(move |event: Event| {
            if !is_recording_flag.load(Ordering::SeqCst) { return; }
            let delay = start_time.elapsed().as_millis();
            let mut captured = None;
            match event.event_type {
                EventType::MouseMove { x, y } => { captured = Some(RecordedEvent { event_type: "MouseMove".into(), x, y, button: None, key: None, delay_ms: delay }); }
                EventType::ButtonPress(btn) => { captured = Some(RecordedEvent { event_type: "Click".into(), x: 0.0, y: 0.0, button: Some(format!("{:?}", btn)), key: None, delay_ms: delay }); }
                EventType::KeyPress(k) => { captured = Some(RecordedEvent { event_type: "KeyPress".into(), x: 0.0, y: 0.0, button: None, key: Some(format!("{:?}", k)), delay_ms: delay }); }
                _ => {}
            }
            if let Some(ev) = captured { events_storage.lock().unwrap().push(ev); }
        });
    });
    Ok("Started".into())
}

#[tauri::command]
async fn stop_global_recording(state: State<'_, RecordingState>) -> Result<Vec<RecordedEvent>, String> {
    state.is_recording.store(false, Ordering::SeqCst);
    Ok(state.events.lock().unwrap().clone())
}

#[tauri::command]
async fn export_to_automation_script(filename: String, state: State<'_, RecordingState>) -> Result<String, String> {
    let events = state.events.lock().unwrap();
    
    let mut script = String::from("import { chromium } from 'playwright';\n");
    script.push_str("const logTask = (status, msg) => console.log(`TASK:${status}:${msg}`);\n\n");
    script.push_str("(async () => {\n");
    script.push_str("  try {\n"); // Added try block
    script.push_str("    logTask('START', 'Launching Browser');\n");
    script.push_str("    const browser = await chromium.launch({ headless: false });\n");
    script.push_str("    const page = await browser.newPage();\n");
    script.push_str("    logTask('DONE', 'Launching Browser');\n\n");

    for ev in events.iter() {
        if ev.event_type == "MouseMove" {
            script.push_str(&format!("    await page.mouse.move({}, {});\n", ev.x, ev.y));
        }
        if ev.event_type == "Click" {
            script.push_str(&format!(
                "logTask('START', 'CLICK_{}', 'Performing Click');\n", 
                ev.delay_ms
            ));
            script.push_str("await page.mouse.down(); await page.mouse.up();\n");
            script.push_str(&format!(
                "logTask('DONE', 'CLICK_{}', '');\n", 
                ev.delay_ms
            ));
        }
    }

    script.push_str("    await browser.close();\n");
    script.push_str("    logTask('DONE', 'Automation Finished');\n");
    script.push_str("  } catch (e) {\n");
    script.push_str("    logTask('FAIL', e.message);\n"); // Report error to UI
    script.push_str("    process.exit(1);\n");
    script.push_str("  }\n");
    script.push_str("})();");

    let mut path = get_tests_dir();
    let name = if filename.ends_with(".ts") { filename } else { format!("{}.ts", filename) };
    path.push(name);
    fs::write(path, script).map_err(|e| e.to_string())?;
    Ok("Exported".into())
}

#[tauri::command]
async fn execute_script(window: Window, state: State<'_, AppState>, filename: String) -> Result<String, String> {
    let mut script_path = get_tests_dir();
    script_path.push(&filename);
    
    let mut engine_path = std::env::current_dir().unwrap();
    if engine_path.ends_with("src-tauri") { engine_path.pop(); }
    engine_path.push("automation-engine");

    // FIX: Run node/tsx directly instead of through 'npx' wrapper
    // This gives Rust the direct PID of the automation engine
    let mut command = if cfg!(target_os = "windows") {
        let mut cmd = Command::new("cmd");
        // We use node_modules/.bin/tsx.cmd directly to avoid the npx overhead
        cmd.args(["/C", "node_modules\\.bin\\tsx.cmd", script_path.to_str().unwrap()]);
        cmd
    } else {
        let mut cmd = Command::new("./node_modules/.bin/tsx");
        cmd.arg(script_path.to_str().unwrap());
        #[cfg(unix)]
        {
            // Create a process group so we can kill the whole group later
            cmd.process_group(0); 
        }
        cmd
    };

    let mut child = command
        .current_dir(&engine_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn: {}", e))?;

    let stdout = child.stdout.take().ok_or("Failed to capture stdout")?;
    let stderr = child.stderr.take().ok_or("Failed to capture stderr")?;

    // Store child handle
    {
        let mut running = state.running_process.lock().unwrap();
        *running = Some(child);
    }

    // Logging Threads (Same as before)
    let win_out = window.clone();
    thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines().flatten() { let _ = win_out.emit("automation-log", line); }
    });

    let win_err = window.clone();
    thread::spawn(move || {
        let reader = BufReader::new(stderr);
        for line in reader.lines().flatten() { let _ = win_err.emit("automation-log", format!("TASK:FAIL:{}", line)); }
    });

    // Monitor Thread (Polling)
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
            // Aggressive Windows Tree Kill
            // taskkill /F (force) /T (tree) /PID 
            let _ = Command::new("taskkill")
                .args(["/F", "/T", "/PID", &pid.to_string()])
                .output();
        }

        #[cfg(not(target_os = "windows"))]
        {
            // Aggressive Unix Group Kill
            // Using -PID (negative) kills the entire process group
            let pgid = pid; 
            unsafe {
                libc::kill(-(pgid as libc::pid_t), libc::SIGKILL);
            }
            let _ = child.kill(); // Final safety
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
        if name.ends_with(".ts") && name != "temp_task.ts" { files.push(name); }
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

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState {
            is_recording: Arc::new(AtomicBool::new(false)),
            events: Arc::new(Mutex::new(Vec::new())),
            running_process: Arc::new(Mutex::new(None)), // Initialize here
        })
        .invoke_handler(tauri::generate_handler![
            auto_save_temp,
            save_permanent_script,
            read_script_content,
            start_global_recording,
            stop_global_recording,
            export_to_automation_script,
            stop_script,
            execute_script,
            delete_script,
            list_saved_scripts
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
