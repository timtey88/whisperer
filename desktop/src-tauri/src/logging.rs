use eyre::{Context, Result};
use std::env;
use std::sync::Arc;
use std::{fs::OpenOptions, path::PathBuf, io::{BufRead, BufReader}};
use tauri::{AppHandle, Manager, Wry};
use tauri_plugin_store::Store;
use tracing_subscriber::{layer::SubscriberExt, EnvFilter, Layer, Registry};

use crate::{cmd::is_portable, config, utils::get_current_dir};

pub fn get_log_path(app: &AppHandle) -> Result<PathBuf> {
    let config_path = if is_portable() {
        get_current_dir()?
    } else {
        app.path().app_config_dir()?
    };

    let log_filename = format!(
        "{}{}",
        config::LOG_FILENAME_PREFIX,
        config::LOG_FILENAME_SUFFIX
    );
    let log_path = config_path.join(log_filename);

    Ok(log_path)
}

// Maximum log file size in bytes (5MB)
const MAX_LOG_SIZE: u64 = 5 * 1024 * 1024;

fn truncate_log_if_needed(log_path: &PathBuf) -> Result<()> {
    if !log_path.exists() {
        return Ok(());
    }

    let metadata = std::fs::metadata(log_path)?;
    if metadata.len() <= MAX_LOG_SIZE {
        return Ok(());
    }

    // Read the file and keep the last 50% of content
    let file = std::fs::File::open(log_path)?;
    let reader = BufReader::new(file);
    let lines: Vec<String> = reader.lines().collect::<Result<Vec<_>, std::io::Error>>()?;
    
    let lines_len = lines.len();
    let keep_lines = lines_len / 2; // Keep last 50% of lines
    let kept_content = lines.into_iter().skip(lines_len - keep_lines).collect::<Vec<_>>().join("\n");
    
    // Write truncated content back
    std::fs::write(log_path, kept_content + "\n")?;
    
    Ok(())
}

pub fn setup_logging(app: &AppHandle, _store: Arc<Store<Wry>>) -> Result<()> {
    let rust_log = env::var("RUST_LOG").unwrap_or_else(|_| config::DEFAULT_LOG_DIRECTIVE.to_owned());
    
    // Create separate filter instances for console and file
    // Console: ERROR only to keep terminal clean for production
    let console_filter = EnvFilter::new("ERROR");
    // File: Comprehensive logging for debugging
    let file_filter = EnvFilter::new(&rust_log);
    
    let path = get_log_path(app)?;
    
    // Check and truncate log file if it's too large
    truncate_log_if_needed(&path)?;
    
    let file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(path.clone())
        .context(format!("failed to open file at {}", path.display()))?;

    let sub = Registry::default()
        .with(
            tracing_subscriber::fmt::layer()
                .with_file(true)
                .with_line_number(true)
                .with_ansi(true)
                .with_filter(console_filter),
        )
        .with(
            tracing_subscriber::fmt::layer()
                .json()
                .with_writer(file)
                .with_filter(file_filter),
        );

    tracing::subscriber::set_global_default(sub)?;

    tracing::info!("Logging initialized - Level: {}", rust_log);
    tracing::info!("Log file: {}", path.display());
    Ok(())
}
