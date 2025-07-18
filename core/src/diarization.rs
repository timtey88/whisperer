use eyre::{bail, eyre, Result};
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::{Command, Stdio};

/// Speaker diarization segment from RTTM format
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiarizeSegment {
    pub start_time: f64,
    pub duration: f64,
    pub speaker: String,
}

/// Options for speaker diarization
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiarizeOptions {
    pub min_speakers: Option<u32>,
    pub max_speakers: Option<u32>,
    pub num_speakers: Option<u32>,
    pub use_gpu: bool,
    pub hf_token: Option<String>,
}

/// Result of dependency check
#[derive(Debug, Serialize, Deserialize)]
pub struct DependencyCheck {
    pub dependencies_ok: bool,
    pub cuda_available: bool,
    pub torch_version: Option<String>,
}

/// Check if Python diarization dependencies are available
pub fn check_dependencies() -> Result<DependencyCheck> {
    tracing::debug!("Checking Python diarization dependencies");
    
    let output = Command::new("python3")
        .arg("-c")
        .arg("import sys; sys.path.insert(0, '.'); import scripts.diarize as d; d.main()")
        .arg("--check-deps")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output();

    match output {
        Ok(output) => {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);
                match serde_json::from_str::<DependencyCheck>(&stdout) {
                    Ok(check) => {
                        tracing::debug!("Dependency check result: {:?}", check);
                        Ok(check)
                    }
                    Err(e) => {
                        tracing::error!("Failed to parse dependency check output: {}", e);
                        bail!("Failed to parse dependency check result")
                    }
                }
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr);
                tracing::error!("Dependency check failed: {}", stderr);
                bail!("Python diarization dependencies not available: {}", stderr)
            }
        }
        Err(e) => {
            tracing::error!("Failed to run dependency check: {}", e);
            bail!("Failed to check Python dependencies: {}", e)
        }
    }
}

/// Parse RTTM format output into DiarizeSegment structs
fn parse_rttm_output(rttm_content: &str) -> Result<Vec<DiarizeSegment>> {
    let mut segments = Vec::new();
    
    for line in rttm_content.lines() {
        let line = line.trim();
        if line.is_empty() || !line.starts_with("SPEAKER") {
            continue;
        }
        
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() < 8 {
            tracing::warn!("Invalid RTTM line format: {}", line);
            continue;
        }
        
        // RTTM format: SPEAKER <file> <chnl> <tbeg> <tdur> <ortho> <stype> <name> <conf>
        let start_time: f64 = parts[3].parse()
            .map_err(|e| eyre!("Failed to parse start time '{}': {}", parts[3], e))?;
        let duration: f64 = parts[4].parse()
            .map_err(|e| eyre!("Failed to parse duration '{}': {}", parts[4], e))?;
        let speaker = parts[7].to_string();
        
        segments.push(DiarizeSegment {
            start_time,
            duration,
            speaker,
        });
    }
    
    // Sort segments by start time
    segments.sort_by(|a, b| a.start_time.partial_cmp(&b.start_time).unwrap());
    
    tracing::debug!("Parsed {} diarization segments", segments.len());
    Ok(segments)
}

/// Run speaker diarization on an audio file using Python bridge
pub fn run_diarization<P: AsRef<Path>>(
    audio_path: P,
    options: DiarizeOptions,
) -> Result<Vec<DiarizeSegment>> {
    let audio_path = audio_path.as_ref();
    
    if !audio_path.exists() {
        bail!("Audio file does not exist: {}", audio_path.display());
    }
    
    tracing::info!("Running speaker diarization on: {}", audio_path.display());
    
    // Build Python command arguments
    let mut args = vec![
        "scripts/diarize.py".to_string(),
        audio_path.to_string_lossy().to_string(),
        "--output-format".to_string(),
        "rttm".to_string(),
    ];
    
    // Add token if provided
    if let Some(token) = &options.hf_token {
        args.push("--token".to_string());
        args.push(token.clone());
    }
    
    // Add speaker constraints
    if let Some(num_speakers) = options.num_speakers {
        args.push("--num-speakers".to_string());
        args.push(num_speakers.to_string());
    } else {
        if let Some(min_speakers) = options.min_speakers {
            args.push("--min-speakers".to_string());
            args.push(min_speakers.to_string());
        }
        if let Some(max_speakers) = options.max_speakers {
            args.push("--max-speakers".to_string());
            args.push(max_speakers.to_string());
        }
    }
    
    // Add GPU option
    if !options.use_gpu {
        args.push("--no-gpu".to_string());
    }
    
    tracing::debug!("Running Python diarization with args: {:?}", args);
    
    // Execute Python script
    let mut cmd = Command::new("python3");
    cmd.args(&args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    
    // Set environment variables if needed
    if let Some(token) = &options.hf_token {
        cmd.env("HUGGINGFACE_TOKEN", token);
    }
    
    let output = cmd.output()
        .map_err(|e| eyre!("Failed to execute Python diarization script: {}", e))?;
    
    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    
    // Log stderr for debugging (contains INFO/DEBUG messages)
    if !stderr.is_empty() {
        for line in stderr.lines() {
            if line.starts_with("INFO:") {
                tracing::info!("Python: {}", line.strip_prefix("INFO:").unwrap_or(line));
            } else if line.starts_with("ERROR:") {
                tracing::error!("Python: {}", line.strip_prefix("ERROR:").unwrap_or(line));
            } else {
                tracing::debug!("Python: {}", line);
            }
        }
    }
    
    if !output.status.success() {
        bail!("Python diarization script failed with exit code {}: {}", 
              output.status.code().unwrap_or(-1), stderr);
    }
    
    // Parse RTTM output
    parse_rttm_output(&stdout)
}

/// Convert DiarizeSegment to transcript-compatible format
impl DiarizeSegment {
    /// Get end time of the segment
    pub fn end_time(&self) -> f64 {
        self.start_time + self.duration
    }
    
    /// Convert to whisper-compatible timestamps (centiseconds)
    pub fn to_whisper_timestamps(&self) -> (i64, i64) {
        let start_cs = (self.start_time * 100.0) as i64;
        let end_cs = (self.end_time() * 100.0) as i64;
        (start_cs, end_cs)
    }
    
    /// Check if this segment overlaps with a time range
    pub fn overlaps_with(&self, start: f64, end: f64) -> bool {
        self.start_time < end && self.end_time() > start
    }
}

/// Find the speaker for a given time range using diarization segments
pub fn find_speaker_for_timerange(
    segments: &[DiarizeSegment],
    start_time: f64,
    end_time: f64,
) -> Option<String> {
    // Find segments that overlap with the given timerange
    let overlapping_segments: Vec<&DiarizeSegment> = segments
        .iter()
        .filter(|seg| seg.overlaps_with(start_time, end_time))
        .collect();
    
    if overlapping_segments.is_empty() {
        return None;
    }
    
    // If there's only one overlapping segment, return its speaker
    if overlapping_segments.len() == 1 {
        return Some(overlapping_segments[0].speaker.clone());
    }
    
    // If multiple segments overlap, find the one with the most overlap
    let mut best_overlap = 0.0;
    let mut best_speaker = None;
    
    for segment in overlapping_segments {
        let overlap_start = start_time.max(segment.start_time);
        let overlap_end = end_time.min(segment.end_time());
        let overlap_duration = (overlap_end - overlap_start).max(0.0);
        
        if overlap_duration > best_overlap {
            best_overlap = overlap_duration;
            best_speaker = Some(segment.speaker.clone());
        }
    }
    
    best_speaker
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_rttm_output() {
        let rttm_content = r#"
SPEAKER audio1 1 0.000 2.500 <NA> <NA> SPEAKER_00 <NA>
SPEAKER audio1 1 2.500 3.200 <NA> <NA> SPEAKER_01 <NA>
SPEAKER audio1 1 5.700 1.800 <NA> <NA> SPEAKER_00 <NA>
"#;
        
        let segments = parse_rttm_output(rttm_content).unwrap();
        assert_eq!(segments.len(), 3);
        
        assert_eq!(segments[0].start_time, 0.0);
        assert_eq!(segments[0].duration, 2.5);
        assert_eq!(segments[0].speaker, "SPEAKER_00");
        
        assert_eq!(segments[1].start_time, 2.5);
        assert_eq!(segments[1].duration, 3.2);
        assert_eq!(segments[1].speaker, "SPEAKER_01");
    }

    #[test]
    fn test_segment_overlap() {
        let segment = DiarizeSegment {
            start_time: 1.0,
            duration: 2.0,
            speaker: "SPEAKER_00".to_string(),
        };
        
        assert!(segment.overlaps_with(0.5, 1.5));
        assert!(segment.overlaps_with(2.5, 3.5));
        assert!(!segment.overlaps_with(3.5, 4.0));
        assert!(!segment.overlaps_with(0.0, 0.5));
    }

    #[test]
    fn test_find_speaker_for_timerange() {
        let segments = vec![
            DiarizeSegment {
                start_time: 0.0,
                duration: 2.0,
                speaker: "SPEAKER_00".to_string(),
            },
            DiarizeSegment {
                start_time: 2.0,
                duration: 2.0,
                speaker: "SPEAKER_01".to_string(),
            },
        ];
        
        assert_eq!(
            find_speaker_for_timerange(&segments, 0.5, 1.5),
            Some("SPEAKER_00".to_string())
        );
        assert_eq!(
            find_speaker_for_timerange(&segments, 2.5, 3.5),
            Some("SPEAKER_01".to_string())
        );
        assert_eq!(find_speaker_for_timerange(&segments, 4.5, 5.5), None);
    }
}