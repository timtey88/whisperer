use eyre::{bail, Result};
use serde::{Deserialize, Serialize};
use tauri::command;
use whisperer_core::diarization::{
    check_dependencies, run_diarization, DependencyCheck, DiarizeOptions as CoreDiarizeOptions, DiarizeSegment,
};

/// Frontend-compatible diarization options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiarizeOptions {
    pub min_speakers: Option<u32>,
    pub max_speakers: Option<u32>,
    pub num_speakers: Option<u32>,
    pub use_gpu: bool,
    pub hf_token: Option<String>,
}

impl Default for DiarizeOptions {
    fn default() -> Self {
        Self {
            min_speakers: None,
            max_speakers: None,
            num_speakers: None,
            use_gpu: true,
            hf_token: None,
        }
    }
}

impl From<DiarizeOptions> for CoreDiarizeOptions {
    fn from(options: DiarizeOptions) -> Self {
        Self {
            min_speakers: options.min_speakers,
            max_speakers: options.max_speakers,
            num_speakers: options.num_speakers,
            use_gpu: options.use_gpu,
            hf_token: options.hf_token,
        }
    }
}

/// Check if Python diarization dependencies are available
#[command]
pub async fn check_diarization_dependencies() -> Result<DependencyCheck> {
    tracing::debug!("Checking diarization dependencies");

    #[cfg(feature = "diarization")]
    {
        check_dependencies()
    }

    #[cfg(not(feature = "diarization"))]
    {
        bail!("Diarization feature not enabled")
    }
}

/// Run speaker diarization on an audio file
#[command]
pub async fn run_speaker_diarization(audio_path: String, options: DiarizeOptions) -> Result<Vec<DiarizeSegment>> {
    tracing::info!("Running speaker diarization on: {}", audio_path);

    #[cfg(feature = "diarization")]
    {
        let core_options = CoreDiarizeOptions::from(options);

        // Run diarization in a blocking task to avoid blocking the async runtime
        let audio_path_clone = audio_path.clone();
        tokio::task::spawn_blocking(move || run_diarization(audio_path_clone, core_options))
            .await
            .map_err(|e| eyre::eyre!("Task join error: {}", e))?
    }

    #[cfg(not(feature = "diarization"))]
    {
        bail!("Diarization feature not enabled")
    }
}

/// Test command to verify Python bridge is working
#[command]
pub async fn test_python_bridge() -> Result<String> {
    tracing::debug!("Testing Python bridge");

    // Try to run a simple Python command
    let output = std::process::Command::new("python3").arg("--version").output();

    match output {
        Ok(output) => {
            if output.status.success() {
                let version = String::from_utf8_lossy(&output.stdout);
                Ok(format!("Python bridge working: {}", version.trim()))
            } else {
                let error = String::from_utf8_lossy(&output.stderr);
                bail!("Python command failed: {}", error)
            }
        }
        Err(e) => {
            bail!("Failed to execute Python: {}", e)
        }
    }
}
