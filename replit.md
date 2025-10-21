# Viseme Avatar Studio

A real-time video avatar application that sequences uploaded green-screen mouth-shape clips based on speech phoneme alignment. Built for content creators and streamers who want custom video avatars that sync with their voice.

## Overview

This application allows users to create real-time video avatars by:
1. Creating a project with custom FPS, resolution, and **viseme complexity** settings (3, 9, or 14 mouth shapes)
2. Recording a training sentence for phoneme alignment
3. Uploading green-screen video clips for the selected viseme categories
4. Testing with text-to-speech or live microphone input
5. Adjusting playback speed and microphone sensitivity for optimal performance
6. Manually triggering specific visemes for precise control
7. Streaming the output to OBS or other streaming software

## Recent Changes

**2025-10-21**: Three-Tier Viseme Complexity System ✅
- **Three Complexity Levels**: Users can now choose between 3, 9, or 14 viseme categories when creating a project
  - **3 visemes (Simple)**: Baa (Closed), Maa (Mid), Ohh (Open)
    - Simplest option for beginners or low-fidelity avatars
    - Minimal recording required (just 3 mouth shape videos)
  - **9 visemes (Medium)**: Baa, Mee, Foe, Tie, Loo, Wuh, Shhh, Ohh, Ayy
    - Default/recommended option balancing quality and complexity
    - Good coverage of common phonemes with manageable recording time
  - **14 visemes (Legacy/Full)**: V1-V14 (full ARPABET coverage)
    - Maximum detail for professional productions
    - Complete phoneme coverage for highest quality lip-sync
- **Project Creation**: Complexity level selector added to "Create New Avatar" dialog
  - Dropdown menu with clear descriptions for each level
  - Defaults to 9 visemes (Medium) for best balance
  - Cannot be changed after project creation
- **Dynamic UI**: Upload Clips tab shows only the visemes for the selected complexity level
  - 3-viseme projects show 3 upload cards
  - 9-viseme projects show 9 upload cards
  - 14-viseme projects show 14 upload cards
- **Backend Validation**: Server validates uploaded clip viseme IDs match project complexity
  - Prevents uploading V5 clip to a 3-viseme project
  - Training audio generates timelines with correct viseme IDs for each complexity level
- **Rest Position Management**: Added "Remove Rest Position" button
  - Clears rest position video with single click
  - Shows confirmation toast on successful removal
- **Homepage Display**: Project cards show complexity level (e.g., "30 FPS • 1920x1080 • 9 visemes")

**2025-10-21**: Simplified 9-Viseme System & Enhanced Controls ✅
- **BREAKING CHANGE**: Viseme system refactored from 14 to 9 categories
  - Previous V1-V14 viseme IDs are no longer supported
  - Existing projects will need to re-upload clips with new viseme categories
  - Server now validates and rejects legacy viseme IDs on upload
- **Simplified Viseme Categories**: Reduced from 14 to 9 easy-to-understand mouth shapes
  - Baa (Closed) - m, b, p, sil sounds like "mom, bob, pop" + silence/rest
  - Mee (Smile) - iy, ih, ix, ae sounds like "see, bit, cat"
  - Foe (Teeth) - f, v sounds like "fun, van"
  - Tie (Tongue) - t, d, n, s, z, th, dh sounds like "tie, dog, no"
  - Loo (Round) - uw, uh, ux, ow sounds like "blue, book, go"
  - Wuh (Glide) - w, r, l, y, er, hh sounds like "wow, red, let"
  - Shhh (Hiss) - sh, zh, ch, jh sounds like "shoe, measure"
  - Ohh (Open) - aa, ah, ao, ax, aw sounds like "hot, father"
  - Ayy (Mid) - eh, ey, ay, k, g sounds like "say, bed, sky"
  - Comprehensive phoneme coverage for ARPABET and common variants
  - Example words shown for each viseme in the UI
- **Automatic Rest Position**: Rest clips auto-loop when avatar is idle (no sound/text)
  - No manual rest selection needed - rest position video loops continuously
  - Returns to rest automatically after speaking
  - 500ms silence threshold before returning to rest
- **Playback Speed Control**: Slider to adjust clip playback rate (0.5x - 2.0x)
  - Affects both text-to-speech and microphone input
  - Real-time adjustment during playback
- **Mic Sensitivity Control**: Slider to fine-tune microphone detection (10-100)
  - Lower values = more sensitive (picks up quiet sounds)
  - Higher values = less sensitive (only loud sounds trigger)
- **Manual Viseme Triggers**: Grid of 9 buttons to manually trigger specific mouth shapes
  - Color-coded buttons matching viseme colors
  - Useful for testing individual clips
  - Can be used during streams for precise control
- **Enhanced UI**: Viseme examples shown in timeline and active stream display

**2025-10-20**: Cloudinary Integration for Vercel Deployment ✅
- **Cloud File Storage**: Migrated from local /uploads to Cloudinary
  - All video, audio, and image uploads now stored in Cloudinary
  - Files served via CDN for better performance and reliability
  - Supports deployment to platforms with ephemeral filesystems (Vercel, etc.)
  - Configured multer-storage-cloudinary for seamless integration
  - Files organized in "viseme-avatar" folder in Cloudinary
  - Supports multiple file formats: mp4, webm, mov, mp3, wav, ogg, jpg, png, gif
  - 100MB file size limit maintained
- **Removed Local File System Dependencies**:
  - No more local /uploads directory
  - Removed express.static serving
  - All file URLs now point to Cloudinary CDN
  - Ready for serverless deployment

**2025-10-20**: Real-Time Microphone and Virtual Camera Features Complete ✅
- **Live Microphone Input**: Real audio capture using Web Audio API
  - getUserMedia() grants microphone access with permission handling
  - AnalyserNode detects speech levels and drives viseme changes in real-time
  - Silence detection (500ms threshold) reverts to V2 rest viseme
  - Proper RAF-based loop with refs to avoid stale closures
  - Respects text processing state (no interference during playback)
  - Complete cleanup on toggle off and component unmount
- **Virtual Camera Output**: Canvas streaming for OBS/streaming software
  - canvas.captureStream(30) creates 30 FPS MediaStream from avatar canvas
  - Toggle controls with on/off status indicators
  - Browser Source URL provided for OBS integration
  - Toast notifications for user feedback
  - Proper MediaStream track cleanup
- **Multiple Avatar Projects**: Full project management system
  - Project list page (/) shows all saved avatars
  - Create new projects with custom settings (name, FPS, resolution)
  - Delete projects with cascade deletion of clips
  - Switch between projects seamlessly
  - Individual project page (/project/:id) for each avatar
- **Status Indicators**: Real-time feedback for microphone and camera state
  - Microphone status shown in button text and live indicator
  - Virtual camera status shown in switch and descriptive label
  - Latency display updates during recording (0ms when silent)

**2025-10-20**: PostgreSQL Database Migration Complete ✅
- **Permanent Storage**: Migrated from file-based storage to PostgreSQL database
  - All projects and viseme clips now persist permanently in the database
  - No more data loss on server restarts
  - Created DatabaseStorage class replacing MemStorage
  - Safe update operations with undefined value filtering
  - Database schema pushed successfully with Drizzle ORM
- **Data Durability**: Projects and clips survive application restarts
  - Uploaded video files stored in /uploads directory
  - Database records reference file paths
  - All CRUD operations use Drizzle ORM for type safety

**2025-10-20**: Canvas Video Renderer & Persistence Complete ✅
- **Canvas Video Playback**: Implemented full video rendering system in AvatarPreview
  - Preloads all uploaded clips into HTMLVideoElement objects
  - requestAnimationFrame render loop for smooth 30-60fps playback
  - Automatic viseme switching based on text-to-viseme timeline
  - Rest pose fallback (explicit rest → V2 → first available clip)
  - Aspect ratio preservation with "cover" behavior
  - Proper cleanup of video elements and animation frames
- **File-Backed Persistence**: Storage now survives server restarts
  - Synchronous loading in constructor prevents race conditions
  - All projects and clips saved to uploads/data.json
  - Directory creation ensures first write succeeds
  - Automatic save on all mutations (create, update, delete)
- **Security Improvements**: Fixed path traversal vulnerability
  - Replaced custom /uploads handler with express.static
  - Dotfiles denied, fallthrough disabled for safety
  - Proper MIME type handling for video/image files
- **Rest Pose Selection**: Users can mark any uploaded clip as rest position
  - Star icon indicates selected rest pose in UI
  - PATCH endpoint updates restPositionClipUrl
  - Separate upload endpoint for dedicated rest position clips

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
- **Storage**: PostgreSQL database with Drizzle ORM (permanent persistence)
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
- **VISEME_MAP**: 9 simplified viseme categories mapping phonemes to mouth shapes (Baa, Mee, Foe, Tie, Loo, Wuh, Shhh, Ohh, Ayy)
  - Each viseme includes: label, phonemes array, color, and example words
- **VISEME_MAP_LEGACY**: Original 14 viseme categories (kept for backwards compatibility)

## Tech Stack

- **Frontend**: React, TanStack Query, Wouter, Tailwind CSS, Shadcn UI
- **Backend**: Express, Multer (file uploads)
- **Storage**: PostgreSQL with Drizzle ORM
- **Audio Processing**: Simulated phoneme alignment (ready for Vosk/WhisperX integration)

## User Preferences

- Dark mode by default (streaming-optimized)
- Purple accent color (#8B5CF6) for branding
- Green (#22C55E) for live/active states
- Professional streaming tool aesthetic

## Next Steps

### Phase 1: Core Functionality
- [ ] Integrate real speech recognition (Vosk for CPU or WhisperX for GPU)
- [✅] Implement actual video playback in preview canvas
- [ ] Add FFmpeg integration for clip trimming and normalization
- [✅] Build clip sequencing engine for real-time playback
- [ ] Add audio waveform visualization

### Phase 2: Advanced Features
- [ ] Virtual camera output (browser-based or system-level)
- [ ] Export functionality (MP4 timeline stitching)
- [✅] Multiple clip variants with randomization
- [✅] Project save/load functionality (file-backed persistence)
- [ ] Latency optimization (<300ms target)
- [ ] Optimize chroma key rendering (reuse offscreen canvas)
- [ ] Add PATCH request validation with Zod

### Phase 3: Production Features
- [✅] Database migration (PostgreSQL)
- [ ] User authentication
- [ ] Cloud storage for clips
- [ ] WebSocket for real-time streaming
- [✅] Browser source for OBS integration (available via canvas URL)

## Development Notes

- The current implementation uses simulated phoneme detection for prototyping
- Basic grapheme-to-phoneme conversion is implemented as a fallback
- File uploads are stored in the `uploads/` directory
- All API routes are prefixed with `/api`
- Frontend uses dark mode optimized for long streaming sessions
