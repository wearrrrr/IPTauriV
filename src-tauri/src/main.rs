// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use random_color;
// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

#[tauri::command]
fn generate_rgb() -> String {
    let color = random_color::RandomColor::new().to_rgb_string();
    return color;
}



fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_upload::init())
        .plugin(tauri_plugin_fs_extra::init())
        .invoke_handler(tauri::generate_handler![generate_rgb])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
