# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Whisperer is a desktop application for transcribing audio and video files offline using OpenAI's Whisper model. It's built with:
- **Backend**: Rust with Tauri framework
- **Frontend**: React with TypeScript, Vite, and Tailwind CSS
- **Core**: Rust library for audio processing and transcription
- **Landing**: SvelteKit website
- **Architecture**: Cross-platform desktop app with web frontend

## Common Development Commands

### Development
```bash
# Start development server (from desktop/ directory)
bun run dev

# Build the application
bun run build

# Run linting
bun run lint

# Run Tauri commands
bun run tauri dev
bun run tauri build
```

### Testing
```bash
# Test core library
cargo test -p whisperer_core --release -- --nocapture

# Test with diarization features
cargo test -p whisperer_core --features diarization --release -- --nocapture

# Test with environment variables
export RUST_LOG=trace
cargo test -- --nocapture
```

### Linting & Formatting
```bash
# Rust formatting and linting
cargo fmt
cargo clippy

# TypeScript linting
bun run lint
```

### Setup & Building
```bash
# Install dependencies
bun install

# Execute pre-build scripts (required before building)
bun scripts/pre_build.js

# Build with GPU support options
bun run scripts/pre_build.js --vulkan  # Vulkan support
bun run scripts/pre_build.js --openblas --build  # CUDA support
bun run scripts/pre_build.js --amd  # AMD support
```

### Speaker Diarization Setup (Optional)
Speaker diarization is available through a Python bridge using pyannote/speaker-diarization-3.1:

```bash
# Install Python dependencies
pip install pyannote.audio torch torchaudio

# Set up HuggingFace access token
export HUGGINGFACE_TOKEN="your_token_here"

# Accept user conditions on HuggingFace:
# - https://huggingface.co/pyannote/segmentation-3.0
# - https://huggingface.co/pyannote/speaker-diarization-3.1

# Test diarization dependencies
python3 scripts/diarize.py --check-deps

# Build with diarization features
cargo build --features diarization
```

**Requirements for Diarization**:
- Python 3.8+ with pyannote.audio 3.1+
- HuggingFace account with accepted model user conditions
- Valid HuggingFace access token
- GPU support optional but recommended (CUDA/Metal/MPS)

## Development Workflow

### Code Change Process
**IMPORTANT**: Always follow this workflow for any changes made in this repository:

1. **Make Changes**: Implement the requested modifications
2. **Clean Up Code**: Run linting and formatting after changes
3. **Always Commit**: Commit ALL changes regardless of errors or incomplete state
4. **Maintain History**: Every attempt should be committed for complete traceability

### Commit Requirements
All commits must include:
- **Summary**: Brief description of what was changed
- **Description**: Detailed explanation including:
  - What was changed and why
  - Any issues encountered
  - Next steps if incomplete
  - Reference to related issues or requirements

### Commit Message Format
```
Brief summary of changes

Detailed description explaining:
- What was changed and why
- Any issues encountered
- Next steps if incomplete

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Code Quality Steps
After making changes, always run:
- `bun run lint` - Fix TypeScript/JavaScript linting issues (from desktop/ directory)
- `cargo fmt` - Format Rust code
- `cargo clippy` - Fix Rust linting issues
- Apply consistent code formatting
- Clean up unused imports, variables, or code
- Ensure code follows project conventions

### Why This Workflow
- Creates complete audit trail of all development efforts
- Allows tracking of failed attempts and partial implementations
- Maintains code quality while preserving development history
- Enables easy rollback and understanding of what was tried

## Architecture Overview

### Project Structure
- `core/` - Rust library containing audio processing, transcription, and configuration logic
- `desktop/` - Main Tauri application with React frontend
- `desktop/src-tauri/` - Tauri backend (Rust)
- `desktop/src/` - React frontend (TypeScript)
- `landing/` - SvelteKit marketing website
- `docs/` - Documentation files

### Key Components

**Core Library (`core/src/`)**:
- `transcribe.rs` - Main transcription logic using whisper.cpp
- `diarization.rs` - Speaker diarization using Python bridge (feature-gated)
- `audio.rs` - Audio processing and device management
- `config.rs` - Configuration management
- `downloader.rs` - Model downloading functionality
- `transcript.rs` - Transcript formatting and export

**Tauri Backend (`desktop/src-tauri/src/`)**:
- `main.rs` - Application entry point with command handlers
- `cmd/` - Tauri command implementations
  - `cmd/diarization.rs` - Speaker diarization commands (feature-gated)
- `setup.rs` - Application initialization
- `server.rs` - HTTP API server (when enabled)
- `cli.rs` - Command line interface

**React Frontend (`desktop/src/`)**:
- `App.tsx` - Main application component with routing
- `pages/` - Main application pages (home, batch, setup)
- `components/` - Reusable UI components
- `providers/` - React context providers
- `lib/` - Utility functions and API clients

### Key Features
- Offline transcription using Whisper models
- Speaker diarization using pyannote/speaker-diarization-3.1 (optional)
- Multiple export formats (SRT, VTT, TXT, HTML, PDF, JSON, DOCX)
- GPU acceleration (CUDA, Vulkan, CoreML)
- Batch processing
- Real-time audio recording
- Model management and downloading
- Multi-language support with i18n
- Auto-updater functionality

### Development Notes
- Uses Tauri's IPC system for frontend-backend communication
- Speaker diarization implemented via Python subprocess bridge for compatibility
- Implements custom protocol handling for deep links
- Supports CLI usage with `--help` flag
- Has HTTP API mode with Swagger docs at `/docs`
- Includes crash reporting and logging system
- Uses ffmpeg for audio/video processing

### Build Configuration
- Workspace-based Cargo project with optimization for release builds
- Tauri configuration varies by platform (Windows, macOS, Linux)
- Pre-build scripts handle dependency setup and GPU support
- Supports portable and installer distributions

### Testing Strategy
- Core library tests focus on transcription accuracy
- Uses sample audio files in `samples/` directory
- Environment variables control test behavior
- Release mode testing recommended for performance validation