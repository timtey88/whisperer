use crate::config::STORE_FILENAME;
use crate::setup::ModelContext;
use crate::utils::{get_current_dir, LogError};
use eyre::{bail, eyre, Context, ContextCompat, OptionExt, Result};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::panic::{catch_unwind, AssertUnwindSafe};
use std::path::{Path, PathBuf};
use std::sync::{
    atomic::{AtomicBool, AtomicU8, Ordering},
    Arc,
};
use tauri::{
    window::{ProgressBarState, ProgressBarStatus},
    Manager,
};
use tauri::{Emitter, Listener, State};
use tauri_plugin_store::StoreExt;
use tokio::sync::Mutex;
use whisperer_core::get_whisperer_temp_folder;
use whisperer_core::transcript::Segment;
use whisperer_core::transcript::Transcript;
pub mod audio;
#[cfg(feature = "diarization")]
pub mod diarization;
pub mod ytdlp;

/// Return true if there's internet connection
/// timeout in ms
#[tauri::command]
pub async fn is_online(timeout: Option<u64>) -> Result<bool> {
    let timeout = std::time::Duration::from_millis(timeout.unwrap_or(2000));
    let targets = ["1.1.1.1:80", "1.1.1.1:53", "8.8.8.8:53", "8.8.8.8:80"];

    let tasks = targets.iter().map(|addr| async move {
        tokio::time::timeout(timeout, tokio::net::TcpStream::connect(addr))
            .await
            .map(|res| res.is_ok())
            .unwrap_or(false)
    });

    Ok(futures::future::join_all(tasks).await.into_iter().any(|res| res))
}

// Static variable to track last logged progress percentage
static LAST_LOGGED_PROGRESS: AtomicU8 = AtomicU8::new(255); // 255 = uninitialized

fn set_progress_bar(app_handle: &tauri::AppHandle, progress: Option<f64>) -> Result<()> {
    let window = app_handle.get_webview_window("main").context("get window")?;
    if let Some(progress) = progress {
        // Rate limit logging to 10% milestones only
        let progress_percentage = (progress * 100.0) as u8;
        let milestone = (progress_percentage / 10) * 10; // Round down to nearest 10%
        let last_milestone = LAST_LOGGED_PROGRESS.load(Ordering::Relaxed);

        // Only log if we've crossed a new 10% milestone
        if milestone != last_milestone && milestone % 10 == 0 && milestone <= 100 {
            tracing::debug!("Progress: {}%", milestone);
            LAST_LOGGED_PROGRESS.store(milestone, Ordering::Relaxed);
        }

        window.emit("transcribe_progress", progress)?;
        if progress > 1.0 {
            window.set_progress_bar(ProgressBarState {
                progress: Some(progress as u64),
                status: if cfg!(target_os = "windows") {
                    // It works in Windows without it, and setting it causes it to jump every time.
                    None
                } else {
                    Some(ProgressBarStatus::Indeterminate)
                },
            })?;
        }
    } else {
        // Reset progress tracking when clearing progress bar
        LAST_LOGGED_PROGRESS.store(255, Ordering::Relaxed);
        window.set_progress_bar(ProgressBarState {
            progress: Some(0),
            status: Some(ProgressBarStatus::None),
        })?;
    }
    Ok(())
}

#[tauri::command]
pub fn get_commit_hash() -> String {
    env!("COMMIT_HASH").to_string()
}

#[tauri::command]
pub fn get_x86_features() -> Option<Value> {
    #[cfg(all(any(target_arch = "x86", target_arch = "x86_64"), target_os = "windows"))]
    {
        let features: Value = serde_json::to_value(crate::x86_features::X86features::new()).unwrap_or_default();
        Some(features)
    }

    #[cfg(not(all(any(target_arch = "x86", target_arch = "x86_64"), target_os = "windows")))]
    {
        None
    }
}

fn extract_zip(zip_path: &Path, extract_to: &Path, app_handle: Option<&tauri::AppHandle>) -> Result<()> {
    let file = std::fs::File::open(zip_path)?;
    let mut archive = zip::ZipArchive::new(file)?;

    tracing::debug!(
        "Extracting zip: {} -> {} ({} files)",
        zip_path.display(),
        extract_to.display(),
        archive.len()
    );

    // Emit extraction started event
    if let Some(app_handle) = app_handle {
        if let Some(window) = app_handle.get_webview_window("main") {
            let _ = window.emit("extraction_started", archive.len());
        }
    }

    // Create the base extraction directory
    std::fs::create_dir_all(extract_to)?;

    let archive_len = archive.len();
    for i in 0..archive_len {
        let mut file = archive.by_index(i)?;
        let file_name = file.name();

        let outpath = match file.enclosed_name() {
            Some(path) => extract_to.join(path),
            None => {
                tracing::warn!("Skipping file with unsafe name: {}", file_name);
                continue;
            }
        };

        if file.name().ends_with('/') {
            // Directory
            std::fs::create_dir_all(&outpath)?;
        } else {
            // File
            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    std::fs::create_dir_all(p)?;
                }
            }
            let mut outfile = std::fs::File::create(&outpath)?;
            std::io::copy(&mut file, &mut outfile)?;
        }

        // Emit extraction progress event
        if let Some(app_handle) = app_handle {
            if let Some(window) = app_handle.get_webview_window("main") {
                let progress = ((i + 1) as f64 / archive_len as f64) * 100.0;
                let _ = window.emit("extraction_progress", (i + 1, archive_len, progress));
            }
        }
    }

    // Emit extraction completed event
    if let Some(app_handle) = app_handle {
        if let Some(window) = app_handle.get_webview_window("main") {
            let _ = window.emit("extraction_completed", ());
        }
    }

    tracing::debug!("Zip extraction completed");
    Ok(())
}

#[tauri::command]
pub async fn download_model(app_handle: tauri::AppHandle, url: String, path: String) -> Result<String> {
    let mut downloader = whisperer_core::downloader::Downloader::new();
    tracing::debug!("Download model invoked! with path {}", path);

    let abort_atomic = Arc::new(AtomicBool::new(false));
    let abort_atomic_c = abort_atomic.clone();

    let app_handle_c = app_handle.clone();

    // allow abort download
    let app_handle_d = app_handle_c.clone();
    app_handle.listen("abort_download", move |_| {
        tracing::info!("🚫 Model download cancellation requested by user");
        set_progress_bar(&app_handle_d, None).log_error();
        abort_atomic_c.store(true, Ordering::Relaxed);
    });

    let download_progress_callback = {
        let app_handle = app_handle.clone();
        let abort_atomic = abort_atomic.clone();

        move |current: u64, total: u64| {
            let app_handle = app_handle.clone();

            // Update progress in background
            tauri::async_runtime::spawn(async move {
                let percentage = (current as f64 / total as f64) * 100.0;
                if let Err(e) = set_progress_bar(&app_handle, Some(percentage)) {
                    tracing::error!("Failed to set progress bar: {}", e);
                }
                if let Some(window) = app_handle.get_webview_window("main") {
                    if let Err(e) = window.emit("download_progress", (current, total)) {
                        tracing::error!("Failed to emit download progress: {}", e);
                    }
                }
            });
            // Return the abort signal immediately
            abort_atomic.load(Ordering::Relaxed)
        }
    };

    // Check if we need to download a zip file
    let (download_path, final_path) = if url.ends_with(".zip") {
        // For zip files, download with .zip extension, then extract to the original path
        let zip_path = format!("{}.zip", path);
        (zip_path, path)
    } else {
        // For regular files, download directly to the intended path
        (path.clone(), path)
    };

    downloader
        .download(&url, download_path.clone().into(), download_progress_callback)
        .await?;

    // Check if the downloaded file is a zip and extract it
    let download_path_buf = PathBuf::from(&download_path);
    if url.ends_with(".zip") {
        tracing::debug!("Extracting zip file: {}", download_path);

        // Get the models directory (parent of the zip file)
        let models_dir = download_path_buf
            .parent()
            .ok_or_else(|| eyre!("Could not get models directory"))?;

        // Create a temporary extraction directory first
        let temp_extract_dir = models_dir.join("temp_extract");
        let final_extract_dir = PathBuf::from(&final_path);

        // Cleanup function for error handling
        let cleanup = || {
            if temp_extract_dir.exists() {
                let _ = std::fs::remove_dir_all(&temp_extract_dir);
            }
            if final_extract_dir.exists() {
                let _ = std::fs::remove_dir_all(&final_extract_dir);
            }
        };

        // Perform extraction with error handling
        match (|| -> Result<()> {
            std::fs::create_dir_all(&temp_extract_dir)?;

            // Extract the zip file to temporary directory
            extract_zip(&download_path_buf, &temp_extract_dir, Some(&app_handle_c))?;

            // Check what was actually extracted
            let entries: Vec<_> = std::fs::read_dir(&temp_extract_dir)?.collect::<Result<Vec<_>, _>>()?;

            tracing::debug!("Extracted {} items to temp directory", entries.len());

            if entries.is_empty() {
                return Err(eyre!("No files were extracted from the zip archive"));
            }

            if entries.len() == 1 {
                // If there's only one item extracted, move it to the final location
                let extracted_item = &entries[0];
                let extracted_path = extracted_item.path();
                let extracted_name = extracted_item.file_name();

                if extracted_path.is_dir() {
                    // Check if the extracted directory name matches the target name
                    let expected_name = final_extract_dir.file_name().map(|n| n.to_string_lossy()).unwrap_or_default();
                    let actual_name = extracted_name.to_string_lossy();

                    if actual_name == expected_name {
                        // Names match - this is a pre-structured bundle, move it directly
                        tracing::debug!(
                            "Moving pre-structured bundle: {} -> {}",
                            extracted_path.display(),
                            final_extract_dir.display()
                        );

                        // Remove target if it exists (to avoid conflicts)
                        if final_extract_dir.exists() {
                            std::fs::remove_dir_all(&final_extract_dir)?;
                        }

                        std::fs::rename(&extracted_path, &final_extract_dir)?;
                    } else {
                        // Names don't match - create target and move contents
                        tracing::debug!("Moving directory contents to target");
                        std::fs::create_dir_all(&final_extract_dir)?;

                        // Move all contents from extracted directory to final directory
                        for entry in std::fs::read_dir(&extracted_path)? {
                            let entry = entry?;
                            let src = entry.path();
                            let dst = final_extract_dir.join(entry.file_name());
                            std::fs::rename(src, dst)?;
                        }
                    }
                } else {
                    // If it's a file, create the directory and move the file into it
                    tracing::debug!("Moving single file to directory");
                    std::fs::create_dir_all(&final_extract_dir)?;
                    let final_file_path = final_extract_dir.join(extracted_item.file_name());
                    std::fs::rename(&extracted_path, &final_file_path)?;
                }
            } else {
                // Multiple items extracted, move the temp directory to final location
                tracing::debug!(
                    "Moving multiple items: {} -> {}",
                    temp_extract_dir.display(),
                    final_extract_dir.display()
                );

                // Remove target if it exists
                if final_extract_dir.exists() {
                    std::fs::remove_dir_all(&final_extract_dir)?;
                }

                std::fs::rename(&temp_extract_dir, &final_extract_dir)?;
            }

            // Clean up temp directory if it still exists
            if temp_extract_dir.exists() {
                std::fs::remove_dir_all(&temp_extract_dir)?;
            }

            // Validate extraction was successful
            if !final_extract_dir.exists() {
                return Err(eyre!("Extraction failed - final directory does not exist"));
            }

            if !final_extract_dir.is_dir() {
                return Err(eyre!("Extraction failed - final path is not a directory"));
            }

            tracing::debug!("Extraction validation passed");

            // Special handling for .mlmodelc bundles on macOS
            if final_extract_dir.extension().and_then(|s| s.to_str()) == Some("mlmodelc") {
                #[cfg(target_os = "macos")]
                {
                    use std::process::Command;
                    tracing::debug!("Setting macOS bundle attributes");

                    // Set the bundle bit using xattr
                    let _ = Command::new("xattr")
                        .arg("-w")
                        .arg("com.apple.FinderInfo")
                        .arg("0000000000000000000000000000000000000000000000000000000000000000")
                        .arg(&final_extract_dir)
                        .output();

                    // Try to set the bundle type using SetFile if available
                    let _ = Command::new("SetFile").arg("-a").arg("B").arg(&final_extract_dir).output();
                }
            }

            Ok(())
        })() {
            Ok(()) => {
                // Extraction successful, remove the zip file
                tracing::debug!("Extraction completed, removing zip file");

                // Safety check: ensure paths are different
                if download_path_buf == final_extract_dir {
                    return Err(eyre!("Cannot remove zip file - same path as extracted directory"));
                }

                // Verify final directory exists before removing zip
                if !final_extract_dir.exists() || !final_extract_dir.is_dir() {
                    return Err(eyre!("Final directory missing or invalid before zip cleanup"));
                }

                // Remove the zip file
                std::fs::remove_file(&download_path_buf)?;

                // Final verification
                if !final_extract_dir.exists() {
                    return Err(eyre!("Final directory was accidentally deleted"));
                }

                tracing::info!("Zip extraction completed successfully");
                set_progress_bar(&app_handle_c, None)?;

                // Return the extracted directory path
                Ok(final_extract_dir.to_string_lossy().to_string())
            }
            Err(e) => {
                // Extraction failed, cleanup and keep the zip file
                tracing::error!("Zip extraction failed: {}", e);
                cleanup();

                // Return the original zip file path so the user can manually extract
                set_progress_bar(&app_handle_c, None)?;
                Ok(download_path)
            }
        }
    } else {
        set_progress_bar(&app_handle_c, None)?;
        Ok(final_path)
    }
}

#[tauri::command]
pub fn get_ffmpeg_path() -> String {
    whisperer_core::audio::find_ffmpeg_path()
        .map(|p| p.to_str().unwrap().to_string())
        .unwrap_or_default()
}

#[tauri::command]
pub async fn download_file(app_handle: tauri::AppHandle, url: String, path: String) -> Result<()> {
    let mut downloader = whisperer_core::downloader::Downloader::new();
    tracing::debug!("Download file invoked! with path {}", path);

    let abort_atomic = Arc::new(AtomicBool::new(false));
    let abort_atomic_c = abort_atomic.clone();

    let app_handle_c = app_handle.clone();

    // allow abort download
    let app_handle_d = app_handle_c.clone();
    app_handle.listen("abort_download", move |_| {
        tracing::info!("🚫 File download cancellation requested by user");
        set_progress_bar(&app_handle_d, None).log_error();
        abort_atomic_c.store(true, Ordering::Relaxed);
    });

    let download_progress_callback = {
        let app_handle = app_handle.clone();
        let abort_atomic = abort_atomic.clone();

        move |current: u64, total: u64| {
            let app_handle = app_handle.clone();

            // Update progress in background
            tauri::async_runtime::spawn(async move {
                if let Some(window) = app_handle.get_webview_window("main") {
                    if let Err(e) = window.emit("download_progress", (current, total)) {
                        tracing::error!("Failed to emit download progress: {}", e);
                    }
                }
            });
            // Return the abort signal immediately
            abort_atomic.load(Ordering::Relaxed)
        }
    };

    downloader.download(&url, path.into(), download_progress_callback).await?;
    Ok(())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiarizeOptions {
    threshold: f32,
    max_speakers: usize,
    enabled: bool,
}

impl Default for DiarizeOptions {
    fn default() -> Self {
        DiarizeOptions {
            enabled: false,
            threshold: 0.0,
            max_speakers: 0,
        }
    }
}

#[derive(Deserialize, Serialize, Clone)]
pub struct FfmpegOptions {
    pub normalize_loudness: bool,
    pub custom_command: Option<String>,
}

impl Default for FfmpegOptions {
    fn default() -> Self {
        Self {
            normalize_loudness: true,
            custom_command: None,
        }
    }
}

impl FfmpegOptions {
    pub fn to_vec(&self) -> Vec<String> {
        let mut cmd = Vec::<String>::new();
        if let Some(custom_cmd) = &self.custom_command {
            cmd.extend(custom_cmd.split_whitespace().map(|s| s.to_string()));
        } else if self.normalize_loudness {
            cmd.extend(["-af".to_string(), "loudnorm=I=-16:TP=-1.5:LRA=11".to_string()]);
        }
        cmd
    }
}

#[tauri::command]
pub async fn glob_files(folder: String, patterns: Vec<String>, recursive: bool) -> Vec<String> {
    let mut files = Vec::new();

    // Construct the search pattern based on the recursive flag
    let search_pattern = if recursive {
        format!("{}/**/*", folder) // Recursive search
    } else {
        format!("{}/*", folder) // Non-recursive search (only in the folder)
    };

    match glob::glob(&search_pattern) {
        Ok(paths) => {
            for entry in paths.filter_map(Result::ok) {
                if entry.is_file() {
                    if let Some(file_name) = entry.file_name().and_then(|n| n.to_str()) {
                        if patterns.iter().any(|p| file_name.ends_with(p)) {
                            if let Ok(path_str) = entry.into_os_string().into_string() {
                                files.push(path_str);
                            }
                        }
                    }
                }
            }
        }
        Err(e) => {
            eprintln!("Failed to read pattern {}: {}", search_pattern, e);
        }
    }

    files
}

#[tauri::command]
pub async fn transcribe(
    app_handle: tauri::AppHandle,
    options: whisperer_core::config::TranscribeOptions,
    model_context_state: State<'_, Mutex<Option<ModelContext>>>,
    diarize_options: DiarizeOptions,
    ffmpeg_options: FfmpegOptions,
) -> Result<Transcript> {
    let model_context = model_context_state.lock().await;
    if model_context.is_none() {
        bail!("Please load model first")
    }
    let ctx = model_context.as_ref().context("as ref")?;
    let app_handle_c = app_handle.clone();

    let new_segment_callback = move |segment: Segment| {
        app_handle_c
            .clone()
            .emit_to("main", "new_segment", segment)
            .map_err(|e| eyre!("{:?}", e))
            .log_error();
    };
    let abort_atomic = Arc::new(AtomicBool::new(false));
    let abort_atomic_c = abort_atomic.clone();
    let abort_atomic_check = abort_atomic.clone(); // Clone for status checking

    // allow abort transcription
    let app_handle_c = app_handle.clone();
    app_handle.listen("abort_transcribe", move |_| {
        let _ = set_progress_bar(&app_handle_c, None);
        abort_atomic_c.store(true, Ordering::Relaxed);
    });

    let abort_callback = move || abort_atomic.load(Ordering::Relaxed);

    let app_handle_c = app_handle.clone();
    let app_handle_c1 = app_handle.clone();
    let progress_callback = move |progress: i32| {
        let _ = set_progress_bar(&app_handle, Some(progress.into()));
    };

    // prevent panic crash. sometimes whisper.cpp crash without nice errors.

    let mut core_diarize_options = None;
    if diarize_options.enabled {
        let embedding_model_path = get_models_folder(app_handle_c1.clone())?
            .join(crate::config::EMBEDDING_MODEL_FILENAME)
            .to_str()
            .ok_or_eyre("tostr")?
            .to_string();

        let segment_model_path = get_models_folder(app_handle_c1.clone())?
            .join(crate::config::SEGMENT_MODEL_FILENAME)
            .to_str()
            .ok_or_eyre("tostr")?
            .to_string();
        core_diarize_options = Some(whisperer_core::transcribe::DiarizeOptions {
            embedding_model_path,
            segment_model_path,
            max_speakers: diarize_options.max_speakers,
            threshold: diarize_options.threshold,
        });
    }
    let ffmpeg_options = ffmpeg_options.to_vec();
    tracing::debug!("ffmpeg additiona options: {:?}", ffmpeg_options);
    let unwind_result = catch_unwind(AssertUnwindSafe(|| {
        whisperer_core::transcribe::transcribe(
            &ctx.handle,
            &options,
            Some(Box::new(progress_callback)),
            Some(Box::new(new_segment_callback)),
            Some(Box::new(abort_callback)),
            core_diarize_options,
            Some(ffmpeg_options),
        )
    }));

    let _ = set_progress_bar(&app_handle_c, None);
    
    // Check if cancellation was requested to provide appropriate logging
    let was_cancelled = abort_atomic_check.load(Ordering::Relaxed);
    
    match unwind_result {
        Err(error) => {
            if !was_cancelled {
                tracing::error!("💥 Transcription crashed unexpectedly: {:?}", error);
            }
            bail!("transcribe crash: {:?}", error)
        }
        Ok(transcribe_result) => {
            match transcribe_result {
                Ok(transcript) => {
                    // Emit completion event for frontend
                    let _ = app_handle_c.emit("transcription_complete", &transcript);
                    tracing::debug!("Emitted transcription_complete event");

                    Ok(transcript)
                }
                Err(err) => {
                    if !was_cancelled {
                        tracing::error!("❌ Transcription failed with error: {}", err);
                    }
                    Err(err).with_context(|| format!("options: {:?}", options))
                }
            }
        }
    }
}

#[tauri::command]
pub fn get_path_dst(src: String, suffix: String) -> Result<String> {
    let src = PathBuf::from(src);
    let src_filename = src.file_name().context("filename")?.to_str().context("stostr")?;
    let src_name = src
        .file_stem()
        .map(|name| name.to_str().context("tosstr"))
        .unwrap_or(Ok(src_filename))?;

    let parent = src.parent().context("parent")?;
    let mut dst_path = parent.join(format!("{}{}", src_name, suffix));

    // Ensure we don't overwrite existing file
    let mut counter = 1;
    while dst_path.exists() {
        dst_path = parent.join(format!("{} ({}){}", src_name, counter, suffix));
        counter += 1;
    }
    Ok(dst_path.to_str().context("tostr")?.into())
}

#[tauri::command]
#[cfg(windows)]
pub fn set_high_gpu_preference(mode: bool) -> Result<()> {
    if mode {
        crate::gpu_preference::set_gpu_preference_high()?;
    } else {
        crate::gpu_preference::remove_gpu_preference()?;
    }
    Ok(())
}

#[tauri::command]
pub fn get_save_path(src_path: PathBuf, target_ext: &str) -> Result<Value> {
    // Get the file stem (filename without extension)
    let stem = src_path.file_stem().and_then(|s| s.to_str()).unwrap_or_default();

    // Create a new path with the same directory and the new extension
    let mut new_path = src_path.clone();
    new_path.set_file_name(stem);
    new_path.set_extension(target_ext);
    let new_filename = new_path.file_name().map(|s| s.to_str()).unwrap_or(Some("Untitled"));
    // Convert the new path to a string
    let new_path = new_path.to_str().context("to_str")?;
    let named_path = json!({"name": new_filename, "path": new_path});
    Ok(named_path)
}

#[tauri::command]
pub fn get_argv() -> Vec<String> {
    std::env::args().collect()
}

#[tauri::command]
/// Opens folder or open folder of a file
pub async fn open_path(path: PathBuf) -> Result<()> {
    if path.is_file() {
        showfile::show_path_in_file_manager(path);
    } else {
        open::that(path)?;
    }
    Ok(())
}

#[tauri::command]
pub fn get_cuda_version() -> String {
    env!("CUDA_VERSION").to_string()
}

#[tauri::command]
pub fn get_rocm_version() -> String {
    env!("ROCM_VERSION").to_string()
}

#[tauri::command]
pub fn is_avx2_enabled() -> bool {
    #[allow(clippy::comparison_to_empty)]
    return env!("WHISPER_NO_AVX") != "ON";
}

#[tauri::command]
pub async fn load_model(
    app_handle: tauri::AppHandle,
    model_path: String,
    gpu_device: Option<i32>,
    use_gpu: Option<bool>,
) -> Result<String> {
    let model_context_state: State<'_, Mutex<Option<ModelContext>>> = app_handle.state();
    let mut state_guard = model_context_state.lock().await;
    if let Some(state) = state_guard.as_ref() {
        // check if new path is different
        if model_path != state.path || gpu_device != state.gpu_device || use_gpu != state.use_gpu {
            tracing::debug!("model path or gpu device changed. reloading");
            // reload
            match whisperer_core::transcribe::create_context(Path::new(&model_path), gpu_device, use_gpu) {
                Ok(context) => {
                    *state_guard = Some(ModelContext {
                        path: model_path.clone(),
                        handle: context,
                        gpu_device,
                        use_gpu,
                    });
                }
                Err(e) => {
                    // Clear progress bar on model loading error
                    let _ = set_progress_bar(&app_handle, None);
                    return Err(e);
                }
            }
        }
    } else {
        tracing::debug!("loading model first time");
        match whisperer_core::transcribe::create_context(Path::new(&model_path), gpu_device, use_gpu) {
            Ok(context) => {
                *state_guard = Some(ModelContext {
                    path: model_path.clone(),
                    handle: context,
                    gpu_device,
                    use_gpu,
                });
            }
            Err(e) => {
                // Clear progress bar on model loading error
                let _ = set_progress_bar(&app_handle, None);
                return Err(e);
            }
        }
    }
    Ok(model_path)
}

#[tauri::command]
#[allow(clippy::comparison_to_empty)]
pub fn is_portable() -> bool {
    env!("WINDOWS_PORTABLE") == "1"
}

#[tauri::command]
pub fn check_vulkan() -> Result<()> {
    #[cfg(all(feature = "vulkan", windows))]
    {
        use ash::vk;
        unsafe {
            let entry = match ash::Entry::load() {
                Ok(e) => e,
                Err(e) => {
                    tracing::error!("Failed to load Vulkan entry: {:?}", e);
                    return Err(e.into());
                }
            };

            let app_desc = vk::ApplicationInfo::default().api_version(vk::make_api_version(0, 1, 0, 0));
            let instance_desc = vk::InstanceCreateInfo::default().application_info(&app_desc);

            let instance = match entry.create_instance(&instance_desc, None) {
                Ok(inst) => inst,
                Err(e) => {
                    tracing::error!("Failed to create Vulkan instance: {:?}", e);
                    return Err(e.into());
                }
            };

            instance.destroy_instance(None);
            tracing::debug!("Vulkan support is successfully checked and working.");
        }
        Ok(())
    }
    #[cfg(not(all(feature = "vulkan", windows)))]
    {
        tracing::debug!("Vulkan check skipped on this platform");
        Ok(())
    }
}

#[tauri::command]
pub fn get_logs_folder(app_handle: tauri::AppHandle) -> Result<PathBuf> {
    let config_path = if is_portable() {
        get_current_dir()?
    } else {
        app_handle.path().app_config_dir()?
    };
    Ok(config_path)
}

#[tauri::command]
pub async fn show_log_path(app_handle: tauri::AppHandle) -> Result<()> {
    let log_path = crate::logging::get_log_path(&app_handle)?;
    if log_path.exists() {
        showfile::show_path_in_file_manager(log_path);
    } else if let Some(parent) = log_path.parent() {
        showfile::show_path_in_file_manager(parent);
    }
    Ok(())
}

#[tauri::command]
pub async fn show_temp_path() -> Result<()> {
    let temp_path = whisperer_core::get_whisperer_temp_folder();
    showfile::show_path_in_file_manager(temp_path);
    Ok(())
}

#[tauri::command]
pub fn get_models_folder(app_handle: tauri::AppHandle) -> Result<PathBuf> {
    let store = app_handle.store(STORE_FILENAME)?;

    let models_folder = store.get("models_folder").and_then(|p| p.as_str().map(PathBuf::from));
    if let Some(models_folder) = models_folder {
        tracing::debug!("models folder: {:?}", models_folder);
        return Ok(models_folder);
    }
    if is_portable() {
        return get_current_dir();
    }
    let path = app_handle.path().app_local_data_dir().context("Can't get data directory")?;
    Ok(path)
}

#[tauri::command]
pub fn get_bundled_models_folder(app_handle: tauri::AppHandle) -> Result<PathBuf> {
    let resource_path = app_handle.path().resource_dir().context("Can't get resource directory")?;
    let bundled_models_path = resource_path.join("models");
    Ok(bundled_models_path)
}

#[tauri::command]
pub async fn copy_bundled_models(app_handle: tauri::AppHandle) -> Result<()> {
    let bundled_folder = get_bundled_models_folder(app_handle.clone())?;
    let models_folder = get_models_folder(app_handle)?;

    // Ensure models folder exists
    std::fs::create_dir_all(&models_folder)?;

    let embedding_src = bundled_folder.join(crate::config::EMBEDDING_MODEL_FILENAME);
    let segment_src = bundled_folder.join(crate::config::SEGMENT_MODEL_FILENAME);

    let embedding_dst = models_folder.join(crate::config::EMBEDDING_MODEL_FILENAME);
    let segment_dst = models_folder.join(crate::config::SEGMENT_MODEL_FILENAME);

    // Copy files if they exist in bundled resources and don't exist in user folder
    if embedding_src.exists() && !embedding_dst.exists() {
        std::fs::copy(&embedding_src, &embedding_dst)?;
        tracing::debug!("Copied bundled embedding model to {}", embedding_dst.display());
    }

    if segment_src.exists() && !segment_dst.exists() {
        std::fs::copy(&segment_src, &segment_dst)?;
        tracing::debug!("Copied bundled segment model to {}", segment_dst.display());
    }

    Ok(())
}

#[tauri::command]
pub fn is_diarization_available() -> bool {
    cfg!(feature = "diarization")
}

#[tauri::command]
pub fn get_logs(app_handle: tauri::AppHandle) -> Result<String> {
    let path = crate::logging::get_log_path(&app_handle)?;
    let content = std::fs::read_to_string(path)?;
    Ok(content)
}

#[tauri::command]
pub fn is_crashed_recently() -> bool {
    tracing::debug!("checking path {}", get_whisperer_temp_folder().join("crash.txt").display());
    get_whisperer_temp_folder().join("crash.txt").exists()
}

#[tauri::command]
pub fn rename_crash_file() -> Result<()> {
    std::fs::rename(
        get_whisperer_temp_folder().join("crash.txt"),
        // TODO: save all crashed?
        get_whisperer_temp_folder().join("crash.1.txt"),
    )
    .context("Can't delete file")
}

#[tauri::command]
pub fn get_cargo_features() -> Vec<String> {
    let mut enabled_features = Vec::new();

    if cfg!(feature = "cuda") {
        enabled_features.push("cuda".to_string());
    }
    if cfg!(feature = "coreml") {
        enabled_features.push("coreml".to_string());
    }
    if cfg!(feature = "metal") {
        enabled_features.push("metal".to_string());
    }
    if cfg!(feature = "openblas") {
        enabled_features.push("openblas".to_string());
    }
    if cfg!(feature = "vulkan") {
        enabled_features.push("vulkan".to_string());
    }
    if cfg!(feature = "rocm") {
        enabled_features.push("rocm".to_string());
    }

    enabled_features
}

#[tauri::command]
pub fn check_model_exists(models_folder: String, file_name: String) -> bool {
    let model_path = PathBuf::from(models_folder).join(file_name);
    model_path.exists()
}

#[tauri::command]
pub fn delete_model(models_folder: String, file_name: String) -> Result<()> {
    // Create the models folder path first
    let models_folder_path = PathBuf::from(models_folder);
    let model_path = models_folder_path.join(file_name);

    if !model_path.exists() {
        bail!("Model does not exist");
    }

    // Ensure the file is within the models folder for security
    if !model_path.starts_with(&models_folder_path) {
        bail!("Model path is outside the models folder");
    }

    // Handle both files and directories (for encoder models)
    if model_path.is_dir() {
        std::fs::remove_dir_all(&model_path).context("Failed to delete model directory")?;
    } else {
        std::fs::remove_file(&model_path).context("Failed to delete model file")?;
    }
    Ok(())
}

#[tauri::command]
pub async fn prepare_for_uninstall(app_handle: tauri::AppHandle) -> Result<String> {
    tracing::info!("User initiated uninstall preparation");

    // Run comprehensive cleanup for uninstall
    crate::cleaner::clean_for_uninstall(&app_handle)?;

    let message = "App data cleaned successfully. You can now safely delete the application.";
    tracing::info!("Uninstall preparation completed successfully");

    Ok(message.to_string())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuDevice {
    pub index: i32,
    pub name: String,
    pub device_type: String,
    pub vendor: String,
    pub is_recommended: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuInfo {
    pub devices: Vec<GpuDevice>,
    pub recommended_device: i32,
    pub has_discrete_gpu: bool,
    pub gpu_acceleration_available: bool,
    pub current_features: Vec<String>,
}

#[tauri::command]
pub async fn get_gpu_info() -> Result<GpuInfo> {
    tracing::debug!("Starting GPU detection");

    // Get current build features
    let features = get_cargo_features();

    // Enumerate GPUs using wgpu
    let mut devices = enumerate_gpu_devices().await?;

    // Determine recommendations
    let has_discrete_gpu = devices.iter().any(|d| d.device_type == "Discrete");
    let recommended_device = find_recommended_device(&devices);
    let gpu_acceleration_available = !features.is_empty() && !devices.is_empty();

    // Mark the recommended device
    for device in &mut devices {
        device.is_recommended = device.index == recommended_device;
    }

    Ok(GpuInfo {
        devices,
        recommended_device,
        has_discrete_gpu,
        gpu_acceleration_available,
        current_features: features,
    })
}

async fn enumerate_gpu_devices() -> Result<Vec<GpuDevice>> {
    use wgpu::{Backends, DeviceType, Instance};

    let instance = Instance::new(wgpu::InstanceDescriptor {
        backends: Backends::all(),
        dx12_shader_compiler: wgpu::Dx12Compiler::default(),
        flags: wgpu::InstanceFlags::default(),
        gles_minor_version: wgpu::Gles3MinorVersion::Automatic,
    });

    let mut devices = Vec::new();
    let mut index = 0;

    for adapter in instance.enumerate_adapters(Backends::all()) {
        let info = adapter.get_info();

        let device_type = match info.device_type {
            DeviceType::IntegratedGpu => "Integrated",
            DeviceType::DiscreteGpu => "Discrete",
            DeviceType::VirtualGpu => "Virtual",
            DeviceType::Cpu => "CPU",
            DeviceType::Other => "Other",
        };

        let vendor = match info.vendor {
            0x10DE => "NVIDIA", // NVIDIA vendor ID
            0x1002 => "AMD",    // AMD vendor ID
            0x8086 => "Intel",  // Intel vendor ID
            0x106B => "Apple",  // Apple vendor ID
            _ => "Unknown",
        };

        devices.push(GpuDevice {
            index,
            name: info.name,
            device_type: device_type.to_string(),
            vendor: vendor.to_string(),
            is_recommended: false, // Will be set later
        });

        index += 1;
    }

    tracing::debug!("Found {} GPU devices", devices.len());
    Ok(devices)
}

fn find_recommended_device(devices: &[GpuDevice]) -> i32 {
    // Priority order for recommendations:
    // 1. Discrete NVIDIA GPU (best for CUDA)
    // 2. Discrete AMD GPU (good for general compute)
    // 3. Apple Silicon GPU (unified memory, good performance)
    // 4. Other discrete GPUs
    // 5. Integrated GPUs

    // First try to find discrete NVIDIA
    if let Some(device) = devices.iter().find(|d| d.device_type == "Discrete" && d.vendor == "NVIDIA") {
        return device.index;
    }

    // Then discrete AMD
    if let Some(device) = devices.iter().find(|d| d.device_type == "Discrete" && d.vendor == "AMD") {
        return device.index;
    }

    // Apple Silicon (good unified memory performance)
    if let Some(device) = devices.iter().find(|d| d.vendor == "Apple") {
        return device.index;
    }

    // Any other discrete GPU
    if let Some(device) = devices.iter().find(|d| d.device_type == "Discrete") {
        return device.index;
    }

    // Fallback to first device (usually index 0)
    0
}
