# ID Photo Maker - Complete Project Specification

## Project Overview
A privacy-first, client-side web application that enables users to create professional ID photos (1-inch, 2-inch, 3-inch) with AI-powered background removal, standard sizing, and print-ready layout optimization. All processing occurs in the browser with zero server dependencies.

## Target Users
- General consumers creating ID photos at home
- Privacy-conscious users who don't want to upload photos to external servers
- Mobile-first users capturing photos directly from their cameras

## Technical Constraints
- **Pure frontend implementation** (no backend required)
- **Deployment**: AWS S3 + CloudFront for static hosting
- **AI Model**: U²-Net for portrait segmentation (~5MB WebAssembly/TensorFlow.js)
- **Offline Support**: PWA-enabled with service worker caching

---

## Core Requirements Breakdown

### Epic 1: Intelligent Image Processing Engine
**User Stories:**
- US-1.1: Upload photo and complete portrait detection/matting within 5 seconds (mid-range mobile)
- US-1.2: Select preset background colors (red #FF0000, blue #0000FF, white #FFFFFF) or custom RGB
- US-1.3: Preview matting results and choose to reprocess or continue
- US-1.4: Access "quick mode" option on low-performance devices (simple chroma key algorithm)
- US-1.5: Undo/redo background replacement operations

**Technical Implementation:**
- **U²-Net Integration**: TensorFlow.js implementation with on-demand loading
- **Memory Management**: tf.tidy() wrappers, tensor disposal, single-image processing limit
- **Performance Optimization**: 
  - Device capability detection (hardwareConcurrency, devicePixelRatio)
  - Adaptive image scaling (1536px max for high-end, 768px for low-end)
  - Loading states with progress indicators and cancellation support
- **Edge Cases**: Multi-person photos (process largest face), transparent PNG inputs, oversized images (>10MB)

### Epic 2: Standard ID Photo Workflow
**User Stories:**
- US-2.1: Select standard sizes: 1-inch (25×35mm), 2-inch (35×49mm), or 3-inch (35×52mm)
- US-2.2: View real-time crop overlay with draggable positioning
- US-2.3: Automatic photo orientation detection with size recommendations
- US-2.4: Clear warnings for insufficient resolution with actionable suggestions
- US-2.5: Preview final ID photo with background color and correct proportions

**Technical Implementation:**
- **Size Standards**:
  ```javascript
  const PHOTO_SIZES = {
    '1inch': { widthMm: 25, heightMm: 35, aspectRatio: 0.714, minWidthPx: 295, minHeightPx: 413 },
    '2inch': { widthMm: 35, heightMm: 49, aspectRatio: 0.714, minWidthPx: 413, minHeightPx: 579 },
    '3inch': { widthMm: 35, heightMm: 52, aspectRatio: 0.673, minWidthPx: 413, minHeightPx: 614 }
  };
  ```
- **Smart Cropping**: Face-aware positioning, boundary constraints, aspect ratio preservation
- **Resolution Validation**: 300DPI minimum requirements with user-friendly warnings
- **Mobile Optimization**: Touch-friendly drag handles, reduced preview update frequency

### Epic 3: Print-Ready Layout System
**User Stories:**
- US-3.1: Choose between 6-inch photo paper (4×6 inches) or A4 paper (210×297mm) layouts
- US-3.2: View layout preview showing actual photo arrangement and quantity
- US-3.3: Automatic optimal layout calculation maximizing paper space utilization
- US-3.4: Download 300DPI high-quality print files (PNG/PDF formats)
- US-3.5: Clear printing instructions ("Select actual size, do not scale")

**Technical Implementation:**
- **Layout Algorithm**: Optimal orientation calculation (portrait vs landscape photos)
- **Paper Specifications**:
  - 6-inch: 1200×1800px @ 300DPI
  - A4: 2480×3508px @ 300DPI
- **Output Examples**:
  - 1-inch on 6-inch paper: 16 photos (4×4 grid)
  - 2-inch on A4 paper: 36 photos (6×6 grid)
- **High-Quality Export**:
  - PNG: Lossless quality for photo labs
  - PDF: Embedded 300DPI metadata for home printers
- **Memory Management**: Low-res preview (72DPI), high-res generation only on download

### Epic 4: Privacy-First User Experience
**User Stories:**
- US-4.1: Complete ID photo creation in under 5 minutes via clear 3-step wizard
- US-4.2: Visible privacy statement: "Your photos never leave your device"
- US-4.3: Add to home screen for offline PWA usage
- US-4.4: Direct camera access on mobile without saving to gallery first
- US-4.5: Clear error messages with actionable solutions for failures

**Technical Implementation:**
- **3-Step Wizard UI**:
  1. Upload/Capture: Camera button (mobile), file input, drag-and-drop (desktop)
  2. Edit: Background color picker, size selector, real-time preview
  3. Layout & Download: Paper selection, layout preview, format options
- **PWA Integration**:
  - manifest.json with appropriate icons and display settings
  - Service worker caching core assets and AI model
  - Offline detection with user notifications
- **Privacy by Design**:
  - Zero external requests (all dependencies bundled locally)
  - No analytics, tracking, or error monitoring scripts
  - Minimal permissions (camera only when explicitly requested)
- **Error Handling**: Intelligent error classification with user-friendly guidance and graceful degradation

---

## Deployment Architecture

### AWS S3/CloudFront Configuration
- **Static Hosting**: S3 bucket configured for website hosting
- **CDN**: CloudFront distribution with HTTPS enforcement
- **Caching Strategy**:
  - HTML files: `Cache-Control: no-cache, no-store, must-revalidate`
  - Static assets (JS/CSS): `Cache-Control: max-age=31536000`
  - AI model files: Long-term caching with versioned paths
- **Compression**: Automatic Gzip/Brotli compression enabled
- **Security**: CORS policy restricting to same-origin requests

### Resource Bundling Strategy
```
/dist
├── app-core.js          # Core application logic (~100KB)
├── u2net-model/         # AI segmentation model (~5MB)
│   ├── model.json
│   └── group1-shard1of2.bin
├── styles/
│   └── main.css         # Stylesheet (~20KB)
└── assets/
    ├── icons/           # PWA icons (192px, 512px)
    └── fallback/        # Degraded experience assets
```

---

## Development Phases

### Phase 1 (MVP - Core Value)
- Basic U²-Net matting with red/blue/white backgrounds
- 1-inch/2-inch/3-inch standard sizing with crop preview
- 6-inch photo paper layout with PNG download
- 3-step wizard interface with privacy messaging

### Phase 2 (Experience Optimization)
- A4 paper layout support
- Custom RGB background colors
- Mobile camera direct capture
- PWA installation and offline support

### Phase 3 (Advanced Features)
- International ID photo specifications
- Manual edge refinement tools
- CMYK color profile support
- Enhanced error recovery and user guidance

---

## Success Metrics
- **User Completion Rate**: >80% of users complete all 3 steps
- **Processing Time**: <5 seconds for matting on mid-range mobile devices
- **Privacy Compliance**: Zero external network requests verified via browser dev tools
- **Print Success**: >90% of downloaded files produce correctly sized prints
- **Mobile Adoption**: >40% of users access via mobile devices

This specification provides a complete foundation for building a privacy-focused, technically robust ID photo creation tool that delivers real value to users while maintaining strict client-side processing requirements.