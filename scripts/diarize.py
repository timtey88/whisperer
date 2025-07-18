#!/usr/bin/env python3
"""
Python bridge for speaker diarization using pyannote/speaker-diarization-3.1

This script provides a bridge between the Rust application and pyannote.audio
for speaker diarization functionality. It accepts audio files and outputs
RTTM format results.

Requirements:
- pyannote.audio 3.1+
- HuggingFace access token with accepted user conditions
- torch and other pyannote dependencies

Usage:
    python diarize.py <audio_file> [options]
"""

import argparse
import sys
import os
import json
import traceback
from pathlib import Path
from typing import Optional, Union
import warnings

# Suppress warnings to keep output clean
warnings.filterwarnings("ignore")

try:
    import torch
    import torchaudio
    from pyannote.audio import Pipeline
    from pyannote.core import Annotation
except ImportError as e:
    print(f"ERROR: Failed to import required dependencies: {e}", file=sys.stderr)
    print("Please install pyannote.audio with: pip install pyannote.audio", file=sys.stderr)
    sys.exit(1)


def check_dependencies():
    """Check if all required dependencies are available."""
    try:
        # Test basic imports
        import torch
        import torchaudio
        from pyannote.audio import Pipeline
        
        # Check for CUDA availability
        cuda_available = torch.cuda.is_available()
        return True, cuda_available
    except ImportError as e:
        return False, False


def load_pipeline(hf_token: Optional[str] = None, use_gpu: bool = True) -> Pipeline:
    """
    Load the pyannote speaker diarization pipeline.
    
    Args:
        hf_token: HuggingFace access token
        use_gpu: Whether to use GPU if available
        
    Returns:
        Loaded pipeline instance
    """
    # Get token from environment if not provided
    if not hf_token:
        hf_token = os.getenv('HUGGINGFACE_TOKEN')
    
    if not hf_token:
        raise ValueError(
            "HuggingFace access token required. "
            "Set HUGGINGFACE_TOKEN environment variable or pass --token"
        )
    
    # Load the pipeline
    pipeline = Pipeline.from_pretrained(
        "pyannote/speaker-diarization-3.1",
        use_auth_token=hf_token
    )
    
    # Move to GPU if available and requested
    if use_gpu and torch.cuda.is_available():
        pipeline.to(torch.device("cuda"))
        print("INFO: Using GPU for diarization", file=sys.stderr)
    else:
        print("INFO: Using CPU for diarization", file=sys.stderr)
    
    return pipeline


def process_audio(
    audio_path: str,
    pipeline: Pipeline,
    min_speakers: Optional[int] = None,
    max_speakers: Optional[int] = None,
    num_speakers: Optional[int] = None
) -> Annotation:
    """
    Process audio file for speaker diarization.
    
    Args:
        audio_path: Path to audio file
        pipeline: Loaded pyannote pipeline
        min_speakers: Minimum number of speakers
        max_speakers: Maximum number of speakers
        num_speakers: Exact number of speakers
        
    Returns:
        Diarization annotation
    """
    # Prepare kwargs for pipeline
    kwargs = {}
    
    if num_speakers is not None:
        kwargs['num_speakers'] = num_speakers
    else:
        if min_speakers is not None:
            kwargs['min_speakers'] = min_speakers
        if max_speakers is not None:
            kwargs['max_speakers'] = max_speakers
    
    # Process the audio file
    try:
        # Try loading from memory for better performance
        waveform, sample_rate = torchaudio.load(audio_path)
        diarization = pipeline({
            "waveform": waveform,
            "sample_rate": sample_rate
        }, **kwargs)
    except Exception:
        # Fallback to file path
        diarization = pipeline(audio_path, **kwargs)
    
    return diarization


def format_rttm_output(diarization: Annotation, audio_file: str) -> str:
    """
    Format diarization results as RTTM string.
    
    Args:
        diarization: Pyannote annotation object
        audio_file: Original audio file path for RTTM header
        
    Returns:
        RTTM formatted string
    """
    rttm_lines = []
    
    # Get base filename without extension for RTTM
    audio_basename = Path(audio_file).stem
    
    for segment, _, speaker in diarization.itertracks(yield_label=True):
        # RTTM format: SPEAKER <file> <chnl> <tbeg> <tdur> <ortho> <stype> <name> <conf>
        start_time = segment.start
        duration = segment.duration
        
        rttm_line = f"SPEAKER {audio_basename} 1 {start_time:.3f} {duration:.3f} <NA> <NA> {speaker} <NA>"
        rttm_lines.append(rttm_line)
    
    return "\n".join(rttm_lines)


def main():
    parser = argparse.ArgumentParser(
        description="Speaker diarization using pyannote/speaker-diarization-3.1"
    )
    parser.add_argument("audio_file", nargs="?", help="Path to audio file")
    parser.add_argument("--token", help="HuggingFace access token")
    parser.add_argument("--no-gpu", action="store_true", help="Disable GPU usage")
    parser.add_argument("--min-speakers", type=int, help="Minimum number of speakers")
    parser.add_argument("--max-speakers", type=int, help="Maximum number of speakers")
    parser.add_argument("--num-speakers", type=int, help="Exact number of speakers")
    parser.add_argument("--output-format", choices=["rttm", "json"], default="rttm",
                       help="Output format (default: rttm)")
    parser.add_argument("--check-deps", action="store_true", 
                       help="Check dependencies and exit")
    
    args = parser.parse_args()
    
    # Check dependencies if requested
    if args.check_deps:
        deps_ok, cuda_available = check_dependencies()
        result = {
            "dependencies_ok": deps_ok,
            "cuda_available": cuda_available,
            "torch_version": torch.__version__ if deps_ok else None
        }
        print(json.dumps(result))
        sys.exit(0 if deps_ok else 1)
    
    # Validate audio file is provided
    if not args.audio_file:
        print("ERROR: Audio file argument is required", file=sys.stderr)
        sys.exit(1)
    
    # Validate audio file exists
    if not Path(args.audio_file).exists():
        print(f"ERROR: Audio file not found: {args.audio_file}", file=sys.stderr)
        sys.exit(1)
    
    try:
        # Load pipeline
        print("INFO: Loading pyannote pipeline...", file=sys.stderr)
        pipeline = load_pipeline(args.token, use_gpu=not args.no_gpu)
        
        # Process audio
        print("INFO: Processing audio for speaker diarization...", file=sys.stderr)
        diarization = process_audio(
            args.audio_file,
            pipeline,
            min_speakers=args.min_speakers,
            max_speakers=args.max_speakers,
            num_speakers=args.num_speakers
        )
        
        # Output results
        if args.output_format == "rttm":
            rttm_output = format_rttm_output(diarization, args.audio_file)
            print(rttm_output)
        elif args.output_format == "json":
            # Convert to JSON format
            segments = []
            for segment, _, speaker in diarization.itertracks(yield_label=True):
                segments.append({
                    "start": segment.start,
                    "end": segment.end,
                    "duration": segment.duration,
                    "speaker": speaker
                })
            
            result = {
                "audio_file": args.audio_file,
                "segments": segments,
                "num_speakers": len(set(segment["speaker"] for segment in segments))
            }
            print(json.dumps(result, indent=2))
        
        print("INFO: Diarization completed successfully", file=sys.stderr)
        
    except Exception as e:
        print(f"ERROR: Diarization failed: {e}", file=sys.stderr)
        print("TRACEBACK:", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()