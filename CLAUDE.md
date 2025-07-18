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

# Test diarization dependencies
python3 scripts/diarize.py --check-deps

# Build with diarization features
cargo build --features diarization
```

**HuggingFace Token Setup**:
1. **Create HuggingFace account** and go to https://huggingface.co/settings/tokens
2. **Create new token** with **READ access** (write access not needed)
3. **Accept user conditions** for required models:
   - https://huggingface.co/pyannote/segmentation-3.0
   - https://huggingface.co/pyannote/speaker-diarization-3.1

**Token Configuration (choose one method)**:

**Option A: .env file (recommended)**:
```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your token:
HUGGINGFACE_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Option B: Environment variable**:
```bash
# macOS/Linux
export HUGGINGFACE_TOKEN="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Windows PowerShell
$env:HUGGINGFACE_TOKEN="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**Option C: Pass token directly**:
```bash
python3 scripts/diarize.py audio.wav --token hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Test Speaker Diarization**:
```bash
# Test with sample file
python3 scripts/diarize.py samples/multi.wav --no-gpu

# Test through Tauri (with dev server running)
# Available commands: test_python_bridge, check_diarization_dependencies, run_speaker_diarization
```

**Requirements for Diarization**:
- Python 3.8+ with pyannote.audio 3.1+
- HuggingFace account with READ access token
- Accepted user conditions for pyannote models
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

## Git Branching Strategy

### Branch Structure
- **`production`** - Production-ready releases only (v1.0.0, v1.1.0, v2.0.0)
- **`development`** - Integration branch for features and testing
- **`release/vX.Y.x`** - Release preparation branches for version X.Y patches
- **`feature/feature-name`** - Individual feature development branches
- **`hotfix/issue-name`** - Critical bug fixes for production
- **`thewh1eagle-main`** - Preserved original upstream branch

### Development Workflow

#### For New Features (Minor Version)
```bash
# Create feature branch from development
git checkout development
git checkout -b feature/feature-name

# Develop feature with regular commits
git add .
git commit -m "Add feature functionality"

# When feature complete, merge to development
git checkout development
git merge feature/feature-name
git branch -d feature/feature-name

# Create release branch when ready for new version
git checkout -b release/v1.Y.x
# Update version numbers, test, build

# When release ready, merge to production
git checkout production
git merge release/v1.Y.x
git tag v1.Y.0
git push origin production --tags
```

#### For Bug Fixes (Patch Version)
```bash
# Create hotfix from appropriate release branch
git checkout release/v1.0.x
git checkout -b hotfix/critical-bug

# Fix bug, test, build
git add .
git commit -m "Fix critical bug"

# When ready, merge back to release branch
git checkout release/v1.0.x
git merge hotfix/critical-bug

# Merge to production and tag
git checkout production
git merge release/v1.0.x
git tag v1.0.1
git push origin production --tags

# Also merge fix back to development
git checkout development
git merge hotfix/critical-bug
```

### Version Management
- **v1.0.x** - Patch releases (bug fixes, small improvements)
- **v1.Y.0** - Minor releases (new features, enhancements)
- **v2.0.0** - Major releases (breaking changes, major redesigns)

### Branch Naming Conventions
- `feature/drag-drop-ui` - New feature development
- `feature/multi-upload` - Multi-file upload system
- `feature/queue-system` - Transcription queue management
- `hotfix/memory-leak` - Critical bug fixes
- `release/v1.1.x` - Release preparation

### Git Workflow Rules
1. **Never commit directly to `production`** - Always use release branches
2. **All features start from `development`** - Keep development as integration point
3. **Use descriptive branch names** - Include feature/issue description
4. **Clean commit history** - Squash commits when merging if needed
5. **Tag all releases** - Use semantic versioning (v1.0.0, v1.1.0, etc.)
6. **Delete merged branches** - Keep repository clean after merging features

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