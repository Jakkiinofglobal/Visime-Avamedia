# Viseme Avatar Studio

## Overview
Viseme Avatar Studio is a real-time video avatar application designed for content creators and streamers. It enables users to create custom video avatars that synchronize mouth shapes with speech, based on phoneme alignment. The application supports various viseme complexities (3, 9, or 14 mouth shapes), allows users to upload green-screen video clips, and offers real-time testing with text-to-speech or live microphone input. The output can be streamed to OBS or other streaming software, providing a powerful tool for enhancing live content with dynamic, personalized avatars.

## User Preferences
- Dark mode by default (streaming-optimized)
- Purple accent color (#8B5CF6) for branding
- Green (#22C55E) for live/active states
- Professional streaming tool aesthetic

## System Architecture
The application features a single-page React frontend and an Express backend.
- **UI/UX**: The frontend is organized into a tabbed workflow (Setup → Alignment → Upload → Preview). It uses Tailwind CSS and Shadcn UI for styling, with a dark mode optimized for streaming environments and a purple accent color. Key components include `ProjectSetup`, `PhonemeTimeline`, `VisemeClipUploader`, `AvatarPreview`, and `StatusBar`.
- **Technical Implementations**:
    - **Viseme Complexity**: Supports 3, 9, or 14 viseme categories, configurable per project. The UI dynamically adjusts to display relevant upload cards.
    - **Real-time Avatar Rendering**: Utilizes `HTMLVideoElement` and `requestAnimationFrame` for smooth video playback on a canvas, with automatic viseme switching based on speech input.
    - **Audio Processing**: Employs Web Audio API for live microphone input, detecting speech levels to drive viseme changes and silence for automatic return to rest position.
    - **Virtual Camera Output**: `canvas.captureStream()` generates a MediaStream for integration with OBS or other streaming software.
    - **Project Management**: Full CRUD operations for projects, including custom FPS, resolution, and viseme complexity settings.
    - **File Management**: Integrates Cloudinary for all file uploads (video, audio, images), serving assets via CDN.
    - **Persistence**: Uses PostgreSQL database with Drizzle ORM for durable storage of project data and viseme clips.
- **Feature Specifications**:
    - Configurable project settings (FPS, resolution, viseme complexity).
    - Training sentence recording for phoneme alignment.
    - Upload of green-screen video clips for viseme categories and rest positions.
    - Text-to-speech and live microphone input for avatar testing.
    - Playback speed and microphone sensitivity controls.
    - Manual viseme triggering and rest position control.
    - Dynamic timeline visualization of phoneme alignment.
    - Real-time status indicators for microphone and virtual camera.
- **System Design Choices**: The system is designed for real-time performance and flexibility, allowing content creators to fine-tune avatar behavior. The backend is built to be scalable and cloud-deployment friendly, with a clear separation of concerns between frontend, backend, and storage.

## External Dependencies
- **Cloudinary**: Cloud storage and CDN for all uploaded media files (video, audio, images).
- **PostgreSQL**: Relational database for persistent storage of project data and metadata.
- **Drizzle ORM**: TypeScript ORM for interacting with the PostgreSQL database.
- **React**: Frontend UI library.
- **TanStack Query**: Data fetching and state management for the frontend.
- **Wouter**: Small routing library for the frontend.
- **Tailwind CSS**: Utility-first CSS framework.
- **Shadcn UI**: UI component library.
- **Express**: Backend web framework.
- **Multer**: Middleware for handling `multipart/form-data`, primarily for file uploads.
- **Web Audio API**: Browser API for processing and synthesizing audio (e.g., microphone input).
- **MediaRecorder API**: Browser API for recording media.