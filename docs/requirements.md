# Project: ID Photo Maker  
A privacy-first, client-side web application that enables users to create professional ID photos (1-inch, 2-inch, 3-inch) with AI-powered background removal, standard sizing, and print-ready layout optimization. All processing occurs in the browser with zero server dependencies.

## Technical Constraints
- **Pure frontend implementation** (no backend required)
- **Tech Stack**: Vite + React + TypeScript for SPA
- **Deployment**: AWS S3 + CloudFront for static hosting
- **AI Model**: U²-Net for portrait segmentation (~5MB WebAssembly/TensorFlow.js)
- **Internationalization**: i18next with offline support for all languages
- **Offline Support**: PWA-enabled with service worker caching (Workbox)

## Personas  
### Persona: General Consumer  
Creates ID photos at home for official documents like passports, driver's licenses, or job applications.  
**Goal**: Quickly create a compliant ID photo without visiting a professional studio.  
**Pain Point**: Struggles with technical requirements (size, background color, resolution) and lacks design skills.  
**Need**: Simple, guided workflow with clear instructions and instant feedback on compliance.  

### Persona: Privacy-Conscious User  
Concerned about uploading personal photos to external servers due to data privacy risks.  
**Goal**: Create ID photos without compromising personal data or digital footprint.  
**Need**: Assurance that all processing happens locally with no external data transmission.  

### Persona: Mobile-First User  
Prefers using smartphone cameras to capture ID photos directly without transferring files.  
**Goal**: Capture, edit, and download ID photos entirely on mobile device.  
**Pain Point**: Desktop-focused tools don't optimize for touch interfaces or direct camera access.  
**Need**: Mobile-optimized interface with seamless camera integration and offline capability.  

### Persona: International User  
Needs to create ID photos that comply with country-specific requirements and prefers interface in native language.  
**Goal**: Access localized content and region-appropriate ID photo standards.  
**Pain Point**: English-only interfaces create barriers for non-English speakers; different countries have varying ID photo specifications.  
**Need**: Comprehensive language support through manual language selection and awareness of international ID requirements.  

## Epics  
### Epic 1: General Consumer wants intelligent image processing so that they can easily remove backgrounds and customize ID photos without technical expertise.  
This epic delivers core AI-powered matting functionality with performance optimizations for various devices, enabling users to achieve professional results regardless of their technical skill level.  

#### User Story 1: As a General Consumer, I want to upload a photo and complete portrait detection/matting within 5 seconds so that I don't experience frustrating delays during creation.  
Enables quick processing even on mid-range mobile devices through adaptive performance optimization.  
##### Acceptance Criteria:  
- Given a mid-range mobile device (hardwareConcurrency ≤ 4), when uploading a photo ≤10MB, then matting completes within 5 seconds.  
- Given a high-end device (hardwareConcurrency > 4), when uploading a photo ≤10MB, then matting completes within 3 seconds.  
- Given any device, when uploading a photo >10MB, then the system shows a warning and automatically scales down the image before processing.  

#### User Story 2: As a General Consumer, I want to select preset background colors (red, blue, white) or custom RGB so that I can meet specific ID requirements. ✅ COMPLETED
Provides flexibility to comply with different official document standards while maintaining simplicity.  
##### Acceptance Criteria:  
- ✅ Given the editing screen, when selecting "Red" from preset options, then the background changes to #FF0000 immediately.  
- ✅ Given the editing screen, when entering custom RGB values (0-255 range), then the background updates in real-time with validation.  
- ✅ Given invalid RGB input (e.g., negative numbers), when attempting to apply, then the system shows an error message and prevents application.

##### Implementation Details:
- Component: `BackgroundSelector` ([src/components/background/BackgroundSelector.tsx](src/components/background/BackgroundSelector.tsx))
- Tests: `BackgroundSelector.test.tsx` ([src/components/background/BackgroundSelector.test.tsx](src/components/background/BackgroundSelector.test.tsx))
- Features:
  - Three preset buttons for Red (#FF0000), Blue (#0000FF), White (#FFFFFF)
  - Real-time background preview showing selected color
  - Custom RGB inputs with live validation (0-255 range)
  - Error messages for invalid inputs (negative, > 255, non-numeric)
  - Visual indication of selected preset color
  - Accessible with proper ARIA labels
  - Integrated into main App workflow (Upload → Background → Preview → Size)  

#### User Story 3: As a General Consumer, I want to preview matting results and choose to reprocess or continue so that I can ensure quality before proceeding. ✅ COMPLETED
Allows quality control and correction before finalizing the ID photo.  
##### Acceptance Criteria:  
- ✅ Given completed matting, when viewing the preview, then original and processed images are displayed side-by-side.  
- ✅ Given dissatisfaction with matting results, when clicking "Reprocess", then the system returns to upload/edit state with original image.  
- ✅ Given satisfaction with results, when clicking "Continue", then the system proceeds to size selection step.  

##### Implementation Details:
- Component: `MattingPreview` ([src/components/preview/MattingPreview.tsx](src/components/preview/MattingPreview.tsx))
- Tests: `MattingPreview.test.tsx` ([src/components/preview/MattingPreview.test.tsx](src/components/preview/MattingPreview.test.tsx))
- Features:
  - Side-by-side image comparison with original and processed images
  - Clear labels for "Original" and "Processed" images
  - Accessible alt text for screen readers
  - "Reprocess" button to return to upload step
  - "Continue" button to proceed to size selection
  - Integrated into main App workflow (Upload → Background → Preview → Size)
  - Proper cleanup of object URLs to prevent memory leaks  

#### User Story 4: As a General Consumer using a low-performance device, I want access to "quick mode" so that I can still create ID photos despite hardware limitations.  
Ensures accessibility across diverse device capabilities through graceful degradation.  
##### Acceptance Criteria:  
- Given a low-performance device (detected via hardwareConcurrency ≤ 2), when starting the app, then "Quick Mode" option is automatically enabled.  
- Given "Quick Mode" enabled, when processing an image, then the system uses chroma key algorithm instead of U²-Net.  
- Given "Quick Mode" enabled, when viewing results, then a subtle indicator shows reduced quality expectations.  

#### User Story 5: As a General Consumer, I want to undo/redo background replacement operations so that I can experiment with different options without restarting.  
Enhances user control and reduces frustration during the editing process.  
##### Acceptance Criteria:  
- Given multiple background changes, when clicking "Undo", then the previous background state is restored.  
- Given an "Undo" action performed, when clicking "Redo", then the subsequent background state is reapplied.  
- Given no prior actions, when clicking "Undo", then the button remains disabled.  

#### Dependencies/Risks  
- Dependency: U²-Net TensorFlow.js model availability and compatibility  
- Risk: Performance variability across different mobile browsers affecting processing time  
- Dependency: Device capability detection accuracy for adaptive scaling  
- Risk: Multi-person photo handling may produce inconsistent results  

### Epic 2: General Consumer wants standard ID photo workflow so that they can create compliant photos meeting official size requirements.  
This epic ensures users can easily create ID photos that meet standard specifications through intuitive sizing controls and validation.  

#### User Story 1: As a General Consumer, I want to select standard sizes (1-inch, 2-inch, 3-inch) so that my photos comply with official document requirements.  
Provides clear options matching common ID photo standards worldwide.  
##### Acceptance Criteria:  
- Given the size selection screen, when choosing "1-inch", then the system applies 25×35mm dimensions with 0.714 aspect ratio.  
- Given the size selection screen, when choosing "2-inch", then the system applies 35×49mm dimensions with 0.714 aspect ratio.  
- Given the size selection screen, when choosing "3-inch", then the system applies 35×52mm dimensions with 0.673 aspect ratio.  

#### User Story 2: As a General Consumer, I want to view real-time crop overlay with draggable positioning so that I can frame my face correctly within the ID photo.  
Enables precise composition control while maintaining required proportions.  
##### Acceptance Criteria:  
- Given the crop interface, when dragging the image within the overlay, then the visible portion updates in real-time.  
- Given the crop interface, when releasing drag, then boundary constraints prevent moving outside valid areas.  
- Given mobile device, when using touch gestures, then drag handles are large enough for finger interaction (minimum 48px).  

#### User Story 3: As a General Consumer, I want automatic photo orientation detection with size recommendations so that I don't have to manually rotate or resize.  
Reduces user effort through intelligent automation of basic adjustments.  
##### Acceptance Criteria:  
- Given a portrait-oriented source photo, when selecting any size, then the system maintains portrait orientation.  
- Given a landscape-oriented source photo, when selecting any size, then the system recommends rotating to portrait with one-click option.  
- Given EXIF orientation data, when processing the image, then the system automatically corrects orientation before editing.  

#### User Story 4: As a General Consumer, I want clear warnings for insufficient resolution with actionable suggestions so that I can fix issues before printing.  
Prevents failed prints by proactively identifying and addressing quality problems.  
##### Acceptance Criteria:  
- Given an image below minimum resolution requirements, when proceeding to layout, then the system shows a prominent warning.  
- Given a resolution warning, when viewing suggestions, then the system recommends retaking photo or using higher quality source.  
- Given a resolution warning, when attempting to download anyway, then the system requires explicit confirmation acknowledging quality issues.  

#### User Story 5: As a General Consumer, I want to preview final ID photo with background color and correct proportions so that I can verify compliance before downloading.  
Provides confidence in final output through accurate representation of printed result.  
##### Acceptance Criteria:  
- Given completed editing, when viewing final preview, then the display shows exact dimensions with correct aspect ratio.  
- Given completed editing, when viewing final preview, then the background color matches selected option exactly.  
- Given mobile device, when viewing final preview, then the interface adapts to available screen space without distortion.  

#### Dependencies/Risks  
- Dependency: Accurate DPI calculation for different display densities  
- Risk: Face detection accuracy affecting smart cropping effectiveness  
- Dependency: Browser support for EXIF orientation handling  
- Risk: User confusion between pixel dimensions and physical measurements  

### Epic 3: General Consumer wants print-ready layout system so that they can efficiently use paper space and produce correctly sized prints.  
This epic optimizes the printing experience through intelligent layout algorithms and high-quality output formats.  

#### User Story 1: As a General Consumer, I want to choose between 6-inch photo paper or A4 paper layouts so that I can match my available printing materials.  
Accommodates common paper types used for home and professional printing.  
##### Acceptance Criteria:  
- Given the layout selection screen, when choosing "6-inch photo paper", then the system configures 1200×1800px @ 300DPI layout.  
- Given the layout selection screen, when choosing "A4 paper", then the system configures 2480×3508px @ 300DPI layout.  
- Given either paper selection, when viewing the preview, then actual photo arrangement shows quantity and positioning clearly.  

#### User Story 2: As a General Consumer, I want to view layout preview showing actual photo arrangement and quantity so that I understand how many photos will print per sheet.  
Sets accurate expectations for print output through visual representation.  
##### Acceptance Criteria:  
- Given 1-inch photos on 6-inch paper, when viewing layout preview, then 16 photos (4×4 grid) are displayed.  
- Given 2-inch photos on A4 paper, when viewing layout preview, then 36 photos (6×6 grid) are displayed.  
- Given any combination, when viewing layout preview, then spacing and margins reflect actual printable area.  

#### User Story 3: As a General Consumer, I want automatic optimal layout calculation maximizing paper space utilization so that I don't waste paper or ink.  
Maximizes value by intelligently arranging photos to minimize waste.  
##### Acceptance Criteria:  
- Given selected photo size and paper type, when calculating layout, then the system determines optimal orientation (portrait/landscape).  
- Given calculated layout, when displaying preview, then the arrangement shows maximum possible photos per sheet.  
- Given edge cases (unusual ratios), when unable to fill completely, then the system centers remaining space evenly.  

#### User Story 4: As a General Consumer, I want to download 300DPI high-quality print files (PNG/PDF formats) so that my prints meet professional quality standards.  
Ensures print quality through appropriate file formats and resolution settings.  
##### Acceptance Criteria:  
- Given download request, when selecting PNG format, then the file contains lossless quality suitable for photo labs.  
- Given download request, when selecting PDF format, then the file includes embedded 300DPI metadata for home printers.  
- Given any download, when checking file properties, then resolution is exactly 300DPI with correct physical dimensions.  

#### User Story 5: As a General Consumer, I want clear printing instructions ("Select actual size, do not scale") so that my prints maintain correct dimensions.  
Prevents common printing errors through explicit guidance.  
##### Acceptance Criteria:  
- Given completed layout, when viewing download screen, then printing instructions are prominently displayed.  
- Given mobile device, when viewing download screen, then instructions include platform-specific guidance (iOS/Android).  
- Given desktop browser, when viewing download screen, then instructions reference common printer dialog options.  

#### Dependencies/Risks  
- Dependency: Canvas API support for high-resolution image generation  
- Risk: Memory consumption during high-DPI file generation causing browser crashes  
- Dependency: PDF generation library compatibility across browsers  
- Risk: Printer driver variations affecting actual print dimensions despite correct file specs  

### Epic 4: Privacy-Conscious User wants privacy-first user experience so that they can create ID photos without compromising personal data security.  
This epic establishes trust through transparent privacy practices and local-only processing.  

#### User Story 1: As a Privacy-Conscious User, I want to complete ID photo creation in under 5 minutes via clear 3-step wizard so that I can quickly achieve my goal without complexity.  
Delivers efficient workflow that respects user time while maintaining simplicity.  
##### Acceptance Criteria:  
- Given first-time user, when starting the app, then the 3-step wizard (Upload/Edit/Layout) is immediately visible.  
- Given each step completion, when proceeding forward, then progress indicator shows current position clearly.  
- Given task completion, when measuring total time, then average completion time is under 5 minutes for typical users.  

#### User Story 2: As a Privacy-Conscious User, I want visible privacy statement: "Your photos never leave your device" so that I have confidence in data security.  
Builds trust through explicit privacy assurances at critical moments.  
##### Acceptance Criteria:  
- Given the upload screen, when viewing the interface, then the privacy statement is prominently displayed near input controls.  
- Given network monitoring via browser dev tools, when performing all operations, then zero external network requests are made.  
- Given privacy statement visibility, when scrolling through the app, then the assurance remains accessible throughout the workflow.  

#### User Story 3: As a Privacy-Conscious User, I want to add to home screen for offline PWA usage so that I can create ID photos without internet dependency.  
Enables true offline capability through progressive web app features.  
##### Acceptance Criteria:  
- Given supported browser, when visiting the site, then PWA installation prompt appears after brief engagement.  
- Given installed PWA, when launching offline, then core functionality (including AI model) works without internet connection.  
- Given service worker activation, when caching assets, then all critical resources including U²-Net model are stored locally.  

#### User Story 4: As a Mobile-First User, I want direct camera access on mobile without saving to gallery first so that I can streamline the capture process.  
Reduces friction in mobile photo capture by bypassing intermediate storage steps.  
##### Acceptance Criteria:  
- Given mobile device with camera, when clicking "Capture Photo", then the native camera interface opens immediately.  
- Given captured photo, when returning to app, then the image is processed directly without appearing in device gallery.  
- Given permission denial, when attempting camera access, then the system gracefully falls back to file upload option.  

#### User Story 5: As a Privacy-Conscious User, I want clear error messages with actionable solutions for failures so that I can recover from issues without abandoning the task.  
Maintains user confidence through helpful error handling that preserves privacy context.  
##### Acceptance Criteria:  
- Given processing failure, when displaying error, then the message explains cause without technical jargon.  
- Given memory-related error, when suggesting solution, then the system recommends closing other tabs or using smaller images.  
- Given any error state, when providing recovery options, then privacy assurance remains visible alongside troubleshooting steps.  

#### Dependencies/Risks  
- Dependency: Browser support for Web App Manifest and service workers  
- Risk: Camera API permissions varying across mobile platforms and browsers  
- Dependency: Local storage quotas sufficient for caching AI model (~5MB)  
- Risk: User skepticism about privacy claims requiring additional verification mechanisms  

### Epic 5: International User wants manual language selection so that they can use the application in their preferred language with region-appropriate guidance.  
This epic ensures global accessibility through complete internationalization with user-controlled language selection.  

#### User Story 1: As an International User, I want to manually select my preferred language from a language selector so that I can use the application in my native language.  
Provides user control over language selection without relying on automatic detection.  
##### Acceptance Criteria:  
- Given any screen, when accessing the language selector (clearly visible in header/navigation), then dropdown shows all available languages with native names (e.g., "Español", "Français", "Deutsch").  
- Given language selection, when choosing a different language, then the entire interface updates immediately without page reload.  
- Given language switch, when navigating between screens, then the selected language persists throughout the session.  

#### User Story 2: As an International User, I want all user-facing text properly extracted into translation files so that new languages can be added without code changes.  
Enables maintainable internationalization architecture for future language expansion.  
##### Acceptance Criteria:  
- Given translation system implementation, when reviewing code structure, then all UI strings are stored in JSON files organized by language code (e.g., en.json, es.json, fr.json).  
- Given new language addition, when adding a translation file, then the system automatically includes it in the language selector without requiring code modification.  
- Given missing translation key, when viewing the interface, then fallback to English occurs with a visible indicator (e.g., red border) for developers during testing.  

#### User Story 3: As an International User, I want culturally appropriate date, number, and measurement formatting so that the interface feels native to my region.  
Ensures proper localization beyond just text translation for enhanced user experience.  
##### Acceptance Criteria:  
- Given metric system preference, when viewing measurements, then dimensions display in millimeters with appropriate decimal separators based on locale.  
- Given different locale, when displaying numbers (e.g., DPI values), then formatting follows regional conventions (e.g., 1.000,00 vs 1,000.00).  
- Given RTL language selection (e.g., Arabic, Hebrew), when viewing the interface, then layout direction automatically adjusts with proper mirroring of UI elements.  

#### User Story 4: As an International User, I want offline language support so that my chosen language works even without internet connection.  
Maintains full functionality in offline PWA scenarios for all supported languages.  
##### Acceptance Criteria:  
- Given installed PWA, when launching offline, then all translation files for all supported languages are available from service worker cache.  
- Given language switch while offline, when selecting any supported language, then interface updates successfully without network request.  
- Given initial load, when caching assets, then translation files are included in the precache manifest for offline availability.  

#### User Story 5: As an International User, I want the default language to be English so that users without language preference have a consistent baseline experience.  
Provides a reliable default experience while maintaining language choice flexibility.  
##### Acceptance Criteria:  
- Given first-time user, when loading the application, then the interface displays in English by default.  
- Given English as default, when viewing the language selector, then "English" is marked as the currently selected option.  
- Given no prior language selection stored, when returning to the app, then English remains the active language.  

#### Dependencies/Risks  
- Dependency: Translation management system for maintaining language files  
- Risk: Incomplete translations affecting user experience in partially supported languages  
- Dependency: RTL layout support in CSS framework  
- Risk: Increased bundle size from multiple translation files affecting initial load time