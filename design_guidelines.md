# Design Guidelines: Viseme Video Avatar Application

## Design Approach
**System**: Fluent Design + Streaming Tool Aesthetic (OBS Studio, Streamlabs inspiration)
**Rationale**: This is a professional productivity tool for content creators requiring clear workflow visualization, real-time performance feedback, and studio-grade reliability. The design balances technical precision with creative expression.

## Core Design Principles
- **Performance Visibility**: Users must see latency, sync status, and system health at a glance
- **Workflow Clarity**: Multi-step process (record → align → upload → test) needs clear visual progression
- **Studio Professional**: Dark theme with accent colors that don't fatigue during long sessions
- **Real-time Feedback**: Live waveforms, sync indicators, and preview states

## Color Palette

### Dark Mode (Primary)
- **Background**: 220 15% 10% (deep charcoal with slight cool tint)
- **Surface**: 220 12% 16% (elevated panels)
- **Surface Elevated**: 220 10% 20% (cards, modals)
- **Border**: 220 10% 28% (subtle divisions)
- **Primary Brand**: 260 75% 62% (vibrant purple - streaming/creator association)
- **Success/Active**: 142 70% 45% (green for live/recording states)
- **Warning**: 35 85% 55% (latency warnings)
- **Error**: 0 70% 58% (sync errors)
- **Text Primary**: 220 10% 95%
- **Text Secondary**: 220 8% 70%
- **Text Muted**: 220 6% 50%

## Typography
- **Primary Font**: Inter (via Google Fonts CDN) - technical precision, excellent readability
- **Monospace**: JetBrains Mono - for phoneme labels, timecodes, technical data
- **Headings**: 600-700 weight, tracking tight
- **Body**: 400-500 weight
- **UI Labels**: 500 weight, 11-12px uppercase with letter-spacing

## Layout System
**Spacing Scale**: Tailwind units of 1, 2, 3, 4, 6, 8, 12, 16
- Tight spacing (p-1, p-2) for toolbar buttons and compact controls
- Medium spacing (p-4, p-6) for card interiors and form fields
- Large spacing (p-8, p-12) for section separation and workflow steps
- Extra large (p-16) for page-level padding

**Grid**: 12-column grid with gap-4 to gap-6 for responsive layouts

## Component Library

### A. Navigation & Header
- **Top Bar**: Fixed header (h-14) with logo, project name, and global controls (save, settings, export)
- **Tab Navigation**: Workflow steps as horizontal tabs (Setup → Upload Clips → Test → Stream)
- **Status Bar**: Thin strip showing system status (mic active, virtual camera on, latency: 380ms)

### B. Workflow Steps

**Step 1: Project Setup**
- Card-based form with FPS selector (24/30/60), resolution dropdown (1080p/720p)
- Training sentence recorder with waveform visualization
- Large "Record Training Audio" button with pulsing indicator when active

**Step 2: Phoneme Alignment**
- Timeline visualization showing phoneme segments as colored blocks
- Each viseme type gets distinct color (V1-V14)
- Scrubber controls with playback preview

**Step 3: Upload Clips**
- Grid layout (grid-cols-3 lg:grid-cols-4) of viseme cards
- Each card shows: Viseme label (e.g., "V1: M/B/P"), phoneme list, upload drop zone
- Multiple clip slots per viseme for variation
- Thumbnail preview with duration badge
- FFmpeg helper: "Auto-trim & normalize" toggle switch

**Step 4: Test & Preview**
- Split view: Left 50% = video preview canvas, Right 50% = controls
- Large green-screen preview window (16:9 aspect ratio)
- Text input for typed testing + mic toggle button
- Real-time phoneme stream display (scrolling list of active visemes)
- Latency meter with color-coded indicator (<300ms green, 300-500ms yellow, >500ms red)

### C. Video Preview Components
- **Main Canvas**: Rounded corners (rounded-lg), border with glow effect when active
- **Overlay Controls**: Semi-transparent control bar at bottom with playback, chroma key toggle
- **Green Screen Toggle**: Switch between solid green (#00FF00) and transparent background

### D. Upload & File Management
- **Drop Zones**: Dashed border (border-dashed), hover state with border-primary and bg opacity
- **Clip Cards**: Compact cards (p-3) with thumbnail, filename, duration, delete button
- **Batch Actions**: "Clear all" and "Download sample clips" links

### E. Forms & Inputs
- **Buttons Primary**: Solid purple background, white text, rounded-md, px-6 py-2.5
- **Buttons Secondary**: Outline style with border-2, transparent bg on dark surface
- **Inputs**: Dark surface bg, border on focus, monospace font for technical fields
- **Toggles**: Fluent-style toggle switches for binary options
- **Sliders**: For volume, latency threshold adjustments

### F. Real-time Indicators
- **Waveform Display**: Canvas-based audio visualization with gradient from primary to success color
- **Sync Status**: Pill-shaped badges (rounded-full) - "In Sync" (green), "Buffering" (yellow), "Error" (red)
- **FPS Counter**: Small monospace display in corner showing actual render rate

### G. Modals & Overlays
- **Settings Modal**: Center-positioned (max-w-2xl), dark overlay backdrop
- **Export Progress**: Loading bar with percentage and ETA
- **Help Tooltips**: Compact popovers on hover with phoneme examples

## Images
**No hero images needed** - this is a productivity application focused on functionality over marketing aesthetics.

**Placeholder Content**:
- Sample avatar thumbnails for "empty state" demonstrations
- Icon for virtual camera output (camera with broadcast waves)
- Viseme mouth shape illustrations (simple line drawings) - use as small icons in upload cards

## Animations
**Minimal & Purposeful Only**:
- Recording pulse: Subtle scale animation on record button (scale-105)
- Waveform: Smooth canvas animation at 30-60fps
- Progress bars: Linear transition on width changes
- Modal entry: Fade + slide down (duration-200)
- **NO** elaborate page transitions, scrolling effects, or decorative animations

## Accessibility & Performance
- All controls keyboard navigable (tab order follows workflow)
- ARIA labels for all icon-only buttons
- Focus indicators with 2px offset ring in primary color
- Dark mode optimized contrast ratios (4.5:1 minimum)
- Lazy load video thumbnails
- Debounce text-to-phoneme conversion (300ms)

## Technical UI Considerations
- Virtual camera status: Toggle switch + browser source URL (copy button)
- Export button: Disabled state until all viseme clips uploaded
- Latency warning: Toast notification if >500ms
- Phoneme fallback indicator: Warning icon if using grapheme-to-phoneme vs. Whisper

**Overall Aesthetic**: Professional streaming studio meets modern web app - dark, focused, performance-oriented with strategic use of purple accent for branding and green for active/live states.