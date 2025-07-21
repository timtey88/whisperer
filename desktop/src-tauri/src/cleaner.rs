use crate::logging::get_log_path;
use eyre::{Result, WrapErr};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::Manager;
use whisperer_core::get_whisperer_temp_folder;


pub fn clean_old_files() -> Result<()> {
    let current_temp_dir = get_whisperer_temp_folder();
    let temp_dir = std::env::temp_dir();
    let temp_dir = temp_dir.to_str().unwrap_or_default();
    // Remove suffix
    let temp_dir = temp_dir.strip_suffix('/').unwrap_or(temp_dir);
    let temp_dir = temp_dir.strip_suffix('\\').unwrap_or(temp_dir);
    let pattern = format!("{}/whisperer_temp*", temp_dir);

    let mut cleaned_count = 0;
    for path in glob::glob(&pattern)? {
        let path = path?;
        if path == current_temp_dir {
            continue;
        }
        if std::fs::remove_dir_all(&path).is_ok() {
            cleaned_count += 1;
        }
    }

    if cleaned_count > 0 {
        tracing::debug!("Cleaned {} old temp directories", cleaned_count);
    }
    Ok(())
}

pub fn clean_all_temp_folders() -> Result<()> {
    let temp_dir = std::env::temp_dir();
    let temp_dir = temp_dir.to_str().unwrap_or_default();
    // Remove suffix
    let temp_dir = temp_dir.strip_suffix('/').unwrap_or(temp_dir);
    let temp_dir = temp_dir.strip_suffix('\\').unwrap_or(temp_dir);
    let pattern = format!("{}/whisperer_temp*", temp_dir);

    let mut cleaned_count = 0;
    for path in glob::glob(&pattern)? {
        let path = path?;
        if std::fs::remove_dir_all(&path).is_ok() {
            cleaned_count += 1;
        }
    }

    if cleaned_count > 0 {
        tracing::debug!("Cleaned {} temp directories on exit", cleaned_count);
    }
    Ok(())
}

pub fn clean_updater_files() -> Result<()> {
    let current_temp_dir = get_whisperer_temp_folder();
    let temp_dir = std::env::temp_dir();
    let temp_dir = temp_dir.to_str().unwrap_or_default();
    // Remove suffix
    let temp_dir = temp_dir.strip_suffix('/').unwrap_or(temp_dir);
    let temp_dir = temp_dir.strip_suffix('\\').unwrap_or(temp_dir);
    let pattern = format!("{}/whisperer*-updater*", temp_dir);

    let mut cleaned_count = 0;
    for path in glob::glob(&pattern)? {
        let path = path?;
        if path == current_temp_dir {
            continue;
        }
        if path.is_dir() && std::fs::remove_dir_all(&path).is_ok() {
            cleaned_count += 1;
        }
    }

    if cleaned_count > 0 {
        tracing::debug!("Cleaned {} old updater directories", cleaned_count);
    }
    Ok(())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanupSettings {
    pub clean_logs: bool,
    pub clean_models: bool,
    pub clean_compiled_models: bool,
}

impl Default for CleanupSettings {
    fn default() -> Self {
        Self {
            clean_logs: true,             // Default: clean old logs
            clean_models: false,          // Default: preserve downloaded models
            clean_compiled_models: false, // Default: preserve compiled models
        }
    }
}

impl CleanupSettings {
    /// Normal app close profile - preserves models and compiled models
    pub fn app_close_profile() -> Self {
        Self {
            clean_logs: true,
            clean_models: false,          // Preserve models on normal close
            clean_compiled_models: false, // Preserve compiled models on normal close
        }
    }

    /// User-initiated uninstall preparation profile - cleans everything
    pub fn uninstall_profile() -> Self {
        Self {
            clean_logs: true,
            clean_models: true,          // Clean models for uninstall
            clean_compiled_models: true, // Clean compiled models for uninstall
        }
    }

    /// App reset profile - cleans temp/cache but preserves models and compiled models
    pub fn app_reset_profile() -> Self {
        Self {
            clean_logs: true,
            clean_models: false,         // Preserve models on reset
            clean_compiled_models: false, // Preserve compiled models on reset
        }
    }
}

pub fn clean_app_cache_selective() -> Result<()> {
    // Get the application cache directory
    let cache_dir = if let Some(home) = std::env::var_os("HOME") {
        PathBuf::from(home).join("Library/Caches/whisperer")
    } else {
        return Ok(()); // Skip if can't determine home directory
    };

    if !cache_dir.exists() {
        tracing::debug!("Cache directory does not exist: {}", cache_dir.display());
        return Ok(());
    }

    let mut cleaned_items = 0;

    // Clean WebKit cache (browser data)
    let webkit_cache = cache_dir.join("WebKit");
    if webkit_cache.exists() {
        if let Err(e) = std::fs::remove_dir_all(&webkit_cache) {
            tracing::warn!("Failed to remove WebKit cache: {}", e);
        } else {
            cleaned_items += 1;
            tracing::debug!("Cleaned WebKit cache");
        }
    }

    // Clean cookies
    let cookies_file = cache_dir.join(".cookies");
    if cookies_file.exists() {
        if let Err(e) = std::fs::remove_file(&cookies_file) {
            tracing::warn!("Failed to remove cookies file: {}", e);
        } else {
            cleaned_items += 1;
            tracing::debug!("Cleaned cookies file");
        }
    }

    // Preserve E5RT cache (CoreML compilation cache) - expensive to regenerate

    if cleaned_items > 0 {
        tracing::debug!("Cleaned {} cache items", cleaned_items);
    }

    Ok(())
}

pub fn clean_app_cache_complete() -> Result<()> {
    // Get the application cache directory
    let cache_dir = if let Some(home) = std::env::var_os("HOME") {
        PathBuf::from(home).join("Library/Caches/whisperer")
    } else {
        return Ok(()); // Skip if can't determine home directory
    };

    if !cache_dir.exists() {
        tracing::debug!("Cache directory does not exist: {}", cache_dir.display());
        return Ok(());
    }

    // Remove entire cache directory for uninstall
    if let Err(e) = std::fs::remove_dir_all(&cache_dir) {
        tracing::warn!("Failed to remove cache directory {}: {}", cache_dir.display(), e);
        return Err(e.into());
    }

    tracing::debug!("Completely removed cache directory: {}", cache_dir.display());
    Ok(())
}

pub fn clean_app_support_configurable(app_handle: &tauri::AppHandle, settings: CleanupSettings) -> Result<()> {
    // Get the application support directory (app_config_dir)
    let app_support_dir = app_handle
        .path()
        .app_config_dir()
        .wrap_err("Can't get app config directory")?;

    if !app_support_dir.exists() {
        tracing::debug!("App support directory does not exist: {}", app_support_dir.display());
        return Ok(());
    }

    let mut cleaned_items = 0;

    // Always preserve critical app state files
    let _protected_files = vec!["app_config.json", ".window-state.json"];

    if settings.clean_logs {
        // Clear the single log file (truncate to empty)
        let log_path = get_log_path(app_handle)?;
        if log_path.exists() {
            if let Err(e) = std::fs::write(&log_path, "") {
                tracing::warn!("Failed to clear log file {}: {}", log_path.display(), e);
            } else {
                cleaned_items += 1;
                tracing::debug!("Cleared log file: {}", log_path.display());
            }
        }
    }

    if settings.clean_models {
        // Clean downloaded AI models (.bin, .onnx files)
        let model_extensions = vec!["*.bin", "*.onnx"];

        for ext in model_extensions {
            let pattern = format!("{}/{}", app_support_dir.display(), ext);
            for path in glob::glob(&pattern)? {
                let path = path?;
                if let Err(e) = std::fs::remove_file(&path) {
                    tracing::warn!("Failed to remove model file {}: {}", path.display(), e);
                } else {
                    cleaned_items += 1;
                    tracing::debug!("Cleaned model file: {}", path.display());
                }
            }
        }
    }

    if settings.clean_compiled_models {
        // Clean compiled CoreML models (.mlmodelc bundles)
        let pattern = format!("{}/*.mlmodelc", app_support_dir.display());
        for path in glob::glob(&pattern)? {
            let path = path?;
            if path.is_dir() {
                if let Err(e) = std::fs::remove_dir_all(&path) {
                    tracing::warn!("Failed to remove compiled model {}: {}", path.display(), e);
                } else {
                    cleaned_items += 1;
                    tracing::debug!("Cleaned compiled model: {}", path.display());
                }
            }
        }
    }

    if cleaned_items > 0 {
        tracing::debug!("Cleaned {} app support items", cleaned_items);
    }

    Ok(())
}

pub fn clean_app_support_complete(app_handle: &tauri::AppHandle) -> Result<()> {
    // Get the application support directory (app_config_dir)
    let app_support_dir = app_handle
        .path()
        .app_config_dir()
        .wrap_err("Can't get app config directory")?;

    if !app_support_dir.exists() {
        tracing::debug!("App support directory does not exist: {}", app_support_dir.display());
        return Ok(());
    }

    // Remove entire Application Support directory for uninstall
    if let Err(e) = std::fs::remove_dir_all(&app_support_dir) {
        tracing::warn!("Failed to remove app support directory {}: {}", app_support_dir.display(), e);
        return Err(e.into());
    }

    tracing::debug!("Completely removed app support directory: {}", app_support_dir.display());
    Ok(())
}

pub fn clean_all_on_exit(app_handle: &tauri::AppHandle, cleanup_settings: Option<CleanupSettings>) -> Result<()> {
    // Always clean temp folders
    clean_all_temp_folders()?;

    // Always clean cache selectively
    clean_app_cache_selective()?;

    // Clean app support based on settings (use app_close_profile by default)
    let settings = cleanup_settings.unwrap_or_else(CleanupSettings::app_close_profile);
    clean_app_support_configurable(app_handle, settings)?;

    tracing::debug!("Completed exit cleanup");
    Ok(())
}

pub fn clean_for_app_reset(app_handle: &tauri::AppHandle) -> Result<()> {
    // Clean temp folders
    clean_all_temp_folders()?;

    // Clean cache selectively (preserve expensive CoreML cache)
    clean_app_cache_selective()?;

    // Clean app support based on reset profile (preserves models)
    clean_app_support_configurable(app_handle, CleanupSettings::app_reset_profile())?;

    tracing::debug!("Completed app reset cleanup");
    Ok(())
}

pub fn clean_for_uninstall(app_handle: &tauri::AppHandle) -> Result<()> {
    // Clean temp folders
    clean_all_temp_folders()?;

    // Clean cache completely (including all subdirectories)
    clean_app_cache_complete()?;

    // Clean app support completely using uninstall profile
    let settings = CleanupSettings::uninstall_profile();
    clean_app_support_configurable(app_handle, settings)?;

    // Additional complete cleanup - remove entire Application Support directory
    clean_app_support_complete(app_handle)?;

    tracing::debug!("Completed uninstall cleanup");
    Ok(())
}
