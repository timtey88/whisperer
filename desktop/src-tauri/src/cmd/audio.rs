// Recording functionality disabled - microphone permissions removed
// This file contained audio recording functions that required microphone access
// All recording functionality has been removed as it was considered redundant

use serde::{Deserialize, Serialize};

// Keep AudioDevice struct as it might be referenced elsewhere
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioDevice {
    pub is_default: bool,
    pub is_input: bool,
    pub id: String,
    pub name: String,
}

// All recording functions have been disabled:
// - get_audio_devices() 
// - start_record()
// 
// These functions required microphone permissions which have been removed
// from Info.plist as the recording feature was redundant.