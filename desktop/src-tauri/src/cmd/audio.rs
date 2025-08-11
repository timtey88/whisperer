use serde::{Deserialize, Serialize};
use eyre::Result;

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioDevice {
    pub is_default: bool,
    pub is_input: bool,
    pub id: String,
    pub name: String,
}

// Audio recording functionality disabled
#[tauri::command]
pub fn get_audio_devices() -> Result<Vec<AudioDevice>> {
    Ok(vec![])
}

#[tauri::command] 
pub async fn start_record(_app_handle: tauri::AppHandle, _devices: Vec<AudioDevice>, _store_in_documents: bool) -> Result<()> {
    Ok(())
}