# Viseme Avatar Studio

A real-time video avatar application that sequences uploaded green-screen mouth-shape clips based on speech phoneme alignment. Built for content creators and streamers who want custom video avatars that sync with their voice.

## Overview

This application allows users to create real-time video avatars by:
1. Creating a project with custom FPS and resolution settings
2. Recording a training sentence for phoneme alignment
3. Uploading green-screen video clips for 14 different viseme (mouth shape) categories
4. Testing with text-to-speech or live microphone input
5. Streaming the output to OBS or other streaming software

## Recent Changes

**2025-10-20**: Avatar Rest Position & Background Features ✅
- Added rest position clip upload - avatar returns to default state when idle
- Implemented chromakey (green screen) removal with real-time processing
- Added background image upload and compositing
- Updated canvas rendering with pixel-level greenscreen removal
- Projects now persist rest position and background settings
- All uploaded clips are saved and maintained across sessions

**2025-10-20**: Initial MVP Complete ✅
- Created full-stack application with Express backend and React frontend
- Implemented project creation and management system
- Added file upload system for audio (training) and video (viseme clips)
- Built phoneme-to-viseme mapping with 14 viseme categories
- Created 4-step workflow: Setup → Alignment → Upload → Preview
- Implemented real-time preview with green-screen support for OBS
- Added text-to-viseme conversion with timeline animation
- Implemented live microphone simulation with latency monitoring (300-500ms)
- Actual video playback on canvas with variant selection
- Dark mode optimized for streaming environments

## Project Architecture

### Frontend (`client/src/`)
- **Pages**: Single-page application with tabbed workflow (Setup → Alignment → Upload → Preview)
- **Components**:
  - `ProjectSetup`: Configure project parameters and record training audio
  - `PhonemeTimeline`: Visualize phoneme-to-viseme alignment timeline
  - `VisemeClipUploader`: Upload and manage video clips for each viseme
  - `AvatarPreview`: Real-time preview with text/mic input and green-screen output
  - `StatusBar`: System status display (mic, virtual camera, latency)
  - `ThemeToggle`: Dark/light mode switcher

### Backend (`server/`)
- **Storage**: In-memory storage for projects and viseme clips
- **Routes**:
  - `POST /api/projects` - Create new project
  - `GET /api/projects` - List all projects
  - `GET /api/projects/:id` - Get project by ID
  - `PATCH /api/projects/:id` - Update project
  - `POST /api/projects/:id/training-audio` - Upload training audio
  - `POST /api/projects/:id/rest-position` - Upload rest position video clip
  - `POST /api/projects/:id/background` - Upload background image
  - `POST /api/projects/:projectId/clips` - Upload viseme clip
  - `GET /api/projects/:projectId/clips` - Get all clips for project
  - `DELETE /api/clips/:clipId` - Delete clip
  - `POST /api/text-to-visemes` - Convert text to viseme timeline

### Data Model (`shared/schema.ts`)
- **Project**: Project configuration (name, FPS, resolution, training audio, phoneme timeline, rest position clip URL, background image URL)
- **VisemeClip**: Video clip metadata (project ID, viseme ID, URL, duration, variant index)
- **VISEME_MAP**: 14 viseme categories mapping phonemes to mouth shapes (V1-V14)

## Tech Stack

- **Frontend**: React, TanStack Query, Wouter, Tailwind CSS, Shadcn UI
- **Backend**: Express, Multer (file uploads)
- **Storage**: In-memory (MemStorage)
- **Audio Processing**: Simulated phoneme alignment (ready for Vosk/WhisperX integration)

## User Preferences

- Dark mode by default (streaming-optimized)
- Purple accent color (#8B5CF6) for branding
- Green (#22C55E) for live/active states
- Professional streaming tool aesthetic

## Next Steps

### Phase 1: Core Functionality
- [ ] Integrate real speech recognition (Vosk for CPU or WhisperX for GPU)
- [ ] Implement actual video playback in preview canvas
- [ ] Add FFmpeg integration for clip trimming and normalization
- [ ] Build clip sequencing engine for real-time playback
- [ ] Add audio waveform visualization

### Phase 2: Advanced Features
- [ ] Virtual camera output (browser-based or system-level)
- [ ] Export functionality (MP4 timeline stitching)
- [ ] Multiple clip variants with randomization
- [ ] Project save/load functionality
- [ ] Latency optimization (<300ms target)

### Phase 3: Production Features
- [ ] Database migration (PostgreSQL)
- [ ] User authentication
- [ ] Cloud storage for clips
- [ ] WebSocket for real-time streaming
- [ ] Browser source for OBS integration

## Development Notes

- The current implementation uses simulated phoneme detection for prototyping
- Basic grapheme-to-phoneme conversion is implemented as a fallback
- File uploads are stored in the `uploads/` directory
- All API routes are prefixed with `/api`
- Frontend uses dark mode optimized for long streaming sessions
