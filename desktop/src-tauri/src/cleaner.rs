use crate::{cmd::get_logs_folder, config, logging::get_log_path};
use eyre::{ContextCompat, Result};
use whisperer_core::get_whisperer_temp_folder;

pub fn clean_old_logs(app: &tauri::AppHandle) -> Result<()> {
    let current_log_path = get_log_path(&app.clone())?;

    // Get logs folder
    let logs_folder = get_logs_folder(app.to_owned())?;
    let logs_folder = logs_folder.to_str().context("tostr")?;

    // Remove suffix
    let logs_folder = logs_folder.strip_suffix('/').unwrap_or(logs_folder);
    let logs_folder = logs_folder.strip_suffix('\\').unwrap_or(logs_folder);
    let pattern = format!(
        "{}/{}*{}",
        logs_folder,
        config::LOG_FILENAME_PREFIX,
        config::LOG_FILENAME_SUFFIX
    );

    let mut cleaned_count = 0;
    for path in glob::glob(&pattern)? {
        let path = path?;
        if path == current_log_path {
            continue;
        }
        std::fs::remove_file(path)?;
        cleaned_count += 1;
    }

    if cleaned_count > 0 {
        tracing::debug!("Cleaned {} old log files", cleaned_count);
    }
    Ok(())
}

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

pub fn clean_current_temp_folder() -> Result<()> {
    let current_temp_dir = get_whisperer_temp_folder();
    
    if current_temp_dir.exists() {
        if let Err(e) = std::fs::remove_dir_all(&current_temp_dir) {
            tracing::warn!("Failed to remove current temp folder {}: {}", current_temp_dir.display(), e);
            return Err(e.into());
        }
        tracing::debug!("Cleaned current temp directory: {}", current_temp_dir.display());
    } else {
        tracing::debug!("Current temp directory does not exist: {}", current_temp_dir.display());
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
