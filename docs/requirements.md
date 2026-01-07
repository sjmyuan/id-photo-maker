# Project: ID Photo Maker  
A privacy-first, client-side web application that enables users to create professional ID photos (1-inch, 2-inch, 3-inch) with AI-powered background removal, standard sizing, and print-ready layout optimization. All processing occurs in the browser with zero server dependencies.

## Technical Constraints
- **Pure frontend implementation** (no backend required)
- **Tech Stack**: Vite + React + TypeScript for SPA
- **Deployment**: AWS S3 + CloudFront for static hosting
- **AI Model**: U²-Net for portrait segmentation (~5MB WebAssembly/TensorFlow.js)
- **Internationalization**: i18next with offline support for all languages
- **Offline Support**: PWA-enabled with service worker caching (Workbox)

## User Workflow
The application follows a two-step workflow with explicit user control over processing:

### Step 1: Upload & Configuration
1. User selects photo size (1-inch, 2-inch, or 3-inch) and DPI requirement (300 DPI or None)
2. User selects background color (red, blue, white, or custom RGB)
3. User selects paper type for print layout (6-inch, A4)
4. User clicks "Upload Image" button to select a photo file
5. Selected image appears in a placeholder preview
6. Button changes to "Generate ID Photo"
7. User clicks "Generate ID Photo" to trigger processing (face detection, validation, and background removal)
8. If validation passes, user automatically advances to Step 2

### Step 2: ID Photo Preview
1. User reviews the processed ID photo with selected background
2. User can click "Download ID Photo" to save the final result
3. User can click "Continue to Print Layout" to advance to Step 3
4. User can click "Back to Settings" to return to Step 1 (preserves original image and allows changing settings)

### Step 3: Print Layout Preview
1. User reviews the print layout with multiple photos optimized for selected paper type
2. User can click "Download Print Layout" to save the print-ready layout
3. User can click "Back" to return to Step 2

**Key Design Decisions**: 
- Upload and processing are separated to give users explicit control. The user sees their uploaded image before triggering any processing, allowing them to verify the correct file was selected.
- When navigating back from Step 2 to Step 1, the original uploaded image is preserved, allowing users to modify settings (size, background color, paper type) and regenerate the preview without re-uploading.
- Users can still change the image via the "Change Image" button in Step 1.

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

#### User Story 4: As a General Consumer, I want to choose between U2Net-P (lite) and U2Net (full) models so that I can balance processing speed and quality based on my needs. ✅ COMPLETED
Provides flexibility for users to optimize for speed on slower devices or quality for best results.
##### Acceptance Criteria:  
- ✅ Given the U2NetTestPage, when viewing model selection, then two radio buttons are displayed for U2Net-P (Lite) and U2Net (Full).
- ✅ Given model selection, when no previous choice exists, then U2Net-P is selected by default.
- ✅ Given model selection, when clicking a model option, then the selection is saved to localStorage for future visits.
- ✅ Given model selection, when switching models, then the new model loads automatically and any processed images are cleared.
- ✅ Given model information display, when viewing options, then size (~4.7MB vs ~176MB), speed (Fast vs Slower), and quality (Good vs Excellent) are clearly shown.

##### Implementation Details:
- Page: `U2NetTestPage` ([src/pages/U2NetTestPage.tsx](src/pages/U2NetTestPage.tsx))
- Tests: `U2NetTestPage.test.tsx` ([src/pages/U2NetTestPage.test.tsx](src/pages/U2NetTestPage.test.tsx))
- Features:
  - Radio button UI with model selection
  - Model information display (size, speed, quality trade-offs)
  - LocalStorage persistence of model choice
  - Dynamic model loading based on selection
  - Automatic clearing of processed images on model switch
  - Visual feedback for selected model

#### User Story 5: As a General Consumer using a low-performance device, I want access to "quick mode" so that I can still create ID photos despite hardware limitations.  
Ensures accessibility across diverse device capabilities through graceful degradation.  
##### Acceptance Criteria:  
- Given a low-performance device (detected via hardwareConcurrency ≤ 2), when starting the app, then "Quick Mode" option is automatically enabled.  
- Given "Quick Mode" enabled, when processing an image, then the system uses chroma key algorithm instead of U²-Net.  
- Given "Quick Mode" enabled, when viewing results, then a subtle indicator shows reduced quality expectations.  

#### User Story 6: As a General Consumer, I want to undo/redo background replacement operations so that I can experiment with different options without restarting.  
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

#### User Story 1: As a General Consumer, I want to choose between 6-inch photo paper or A4 paper layouts so that I can match my available printing materials. ✅ COMPLETED
Accommodates common paper types used for home and professional printing.  
##### Acceptance Criteria:  
- ✅ Given the layout selection screen, when choosing "6-inch photo paper", then the system configures 1200×1800px @ 300DPI layout.  
- ✅ Given the layout selection screen, when choosing "A4 paper", then the system configures 2480×3508px @ 300DPI layout.  
- ✅ Given either paper selection, when viewing the preview, then actual photo arrangement shows quantity and positioning clearly.  

##### Implementation Details:
- Utility: `layoutCalculation` ([src/utils/layoutCalculation.ts](src/utils/layoutCalculation.ts))
  - `PAPER_TYPES` constant defining 6-inch (1200×1800px) and A4 (2480×3508px) paper specifications
  - `calculateLayout()` function calculating optimal photo arrangements for different paper types
  - `mmToPixels()` helper for DPI-aware dimension conversions
- Component: `PrintLayout` ([src/components/layout/PrintLayout.tsx](src/components/layout/PrintLayout.tsx))
  - Paper type selector with two buttons: 6-inch Photo Paper and A4 Paper
  - Default selection: 6-inch photo paper
  - Real-time layout recalculation when paper type changes
  - Visual feedback for selected paper type
- Tests:
  - `layoutCalculation.test.ts` ([src/utils/layoutCalculation.test.ts](src/utils/layoutCalculation.test.ts)) - 16 tests
  - `PrintLayout.test.tsx` ([src/components/layout/PrintLayout.test.tsx](src/components/layout/PrintLayout.test.tsx)) - 16 tests
- Integration: MainWorkflow ([src/pages/MainWorkflow.tsx](src/pages/MainWorkflow.tsx))
  - PrintLayout component displayed under cropped image in photo preview container
  - Appears only after preview generation is complete
  - Paper selection persists during session

#### User Story 2: As a General Consumer, I want to view layout preview showing actual photo arrangement so that I understand how photos will be arranged on the print sheet. ✅ COMPLETED
Sets accurate expectations for print output through visual representation.  
##### Acceptance Criteria:  
- ✅ Given 1-inch photos on 6-inch paper, when viewing layout preview, then photos are displayed in calculated grid arrangement.  
- ✅ Given 2-inch photos on A4 paper, when viewing layout preview, then photos are displayed in calculated grid arrangement.  
- ✅ Given any combination, when viewing layout preview, then spacing and margins reflect actual printable area.  

##### Implementation Details:
- Component: `PrintLayout` ([src/components/layout/PrintLayout.tsx](src/components/layout/PrintLayout.tsx))
  - Canvas-based visual preview showing photo grid arrangement
  - Preview maintains paper aspect ratio
  - Photos drawn with proper spacing and margins
  - Border visualization for each photo in grid
  - Clean, minimal presentation focused on visual layout preview
  - Automatically updates when settings change (size, DPI, background, paper type)
- Utility: `layoutCalculation` ([src/utils/layoutCalculation.ts](src/utils/layoutCalculation.ts))
  - Dynamic calculation of photos per row and column
  - Automatic spacing calculation (5mm minimum between photos)
  - Margin calculation for centering layout on paper
- Tests: Comprehensive coverage for all size/paper combinations and visual rendering
  - `PrintLayout.test.tsx` ([src/components/layout/PrintLayout.test.tsx](src/components/layout/PrintLayout.test.tsx)) - 6 tests covering canvas rendering, visual presentation, and download functionality

#### User Story 3: As a General Consumer, I want automatic optimal layout calculation maximizing paper space utilization so that I don't waste paper or ink. ✅ COMPLETED
Maximizes value by intelligently arranging photos to minimize waste.  
##### Acceptance Criteria:  
- ✅ Given selected photo size and paper type, when calculating layout, then the system determines optimal orientation (portrait/landscape).  
- ✅ Given calculated layout, when displaying preview, then the arrangement shows maximum possible photos per sheet.  
- ✅ Given edge cases (unusual ratios), when unable to fill completely, then the system centers remaining space evenly.  

##### Implementation Details:
- Utility: `layoutCalculation` ([src/utils/layoutCalculation.ts](src/utils/layoutCalculation.ts))
  - Optimal layout algorithm maximizing paper space utilization
  - Automatic calculation of maximum photos per row/column
  - 5mm minimum spacing between photos for cutting ease
  - Even distribution of remaining space through calculated margins
  - Handles edge cases (very large/small photos, unusual aspect ratios)
  - Consistent results for same inputs (deterministic algorithm)
- Service: `printLayoutService` ([src/services/printLayoutService.ts](src/services/printLayoutService.ts))
  - `generatePrintLayout()` function creating high-resolution print canvas
  - Automatic photo arrangement based on calculated layout
  - White background fill for professional appearance
  - Precise photo placement at calculated positions
  - Scales source image to exact photo dimensions
  - `downloadCanvas()` helper for PNG file download
- Tests:
  - `printLayoutService.test.ts` ([src/services/printLayoutService.test.ts](src/services/printLayoutService.test.ts)) - 13 tests
  - Coverage for space utilization, edge cases, and consistency
- Integration: MainWorkflow ([src/pages/MainWorkflow.tsx](src/pages/MainWorkflow.tsx))
  - Download handler calling `generatePrintLayout()` and `downloadCanvas()`
  - Filename pattern: `id-photo-layout-{size}-{paperType}-{timestamp}.png`
  - Uses transparent canvas with background for layout generation

#### User Story 4: As a General Consumer, I want to download 300DPI high-quality print files (PNG/PDF formats) so that my prints meet professional quality standards.  
Ensures print quality through appropriate file formats and resolution settings.  
##### Acceptance Criteria:  
- Given download request, when selecting PNG format, then the file contains lossless quality suitable for photo labs.  
- Given download request, when selecting PDF format, then the file includes embedded 300DPI metadata for home printers.  
- Given any download, when checking file properties, then resolution is exactly 300DPI with correct physical dimensions.  

#### User Story 5: As a General Consumer, I want automatic face detection with intelligent crop positioning so that I can easily frame my face correctly for ID photos. ✅ COMPLETED
Ensures proper face positioning and framing through AI-powered face detection with manual adjustment capabilities.
##### Acceptance Criteria:
- ✅ Given the size selection screen, when proceeding from preview, then the system automatically detects faces using UltraFace-320 model on the matted image.
- ✅ Given a single face detected, when viewing the crop interface, then the crop rectangle automatically positions around the face with 30% padding.
- ✅ Given auto-positioned crop, when the user wants to adjust, then the rectangle can be dragged and resized while maintaining the selected size's aspect ratio.
- ✅ Given size selection changes, when switching between 1-inch, 2-inch, or 3-inch, then the crop rectangle adjusts its aspect ratio accordingly.
- ✅ Given no face detected, when viewing crop interface, then an error message displays and the rectangle centers on the image.
- ✅ Given multiple faces detected, when viewing crop interface, then an error message displays suggesting to use a photo with one person.
- ✅ Given the crop rectangle, when resizing via corner handles, then the aspect ratio is maintained and boundary constraints prevent moving outside the image.

##### Implementation Details:
- Service: `faceDetectionService` ([src/services/faceDetectionService.ts](src/services/faceDetectionService.ts))
  - UltraFace-320 ONNX model loading and inference
  - Image preprocessing (320x240 resize, normalization to [-1,1])
  - Non-maximum suppression (NMS) with IoU threshold 0.5
  - Confidence threshold 0.7 for face detection
  - Error handling for no-face and multiple-faces scenarios
- Component: `SizeSelection` ([src/components/size/SizeSelection.tsx](src/components/size/SizeSelection.tsx))
  - Three size buttons with aspect ratios: 1-inch (0.714), 2-inch (0.714), 3-inch (0.673)
  - Draggable crop rectangle with mouse and touch support
  - Resizable corner handles maintaining aspect ratio
  - Auto-positioning based on detected face with 30% padding
  - Centered positioning fallback when no face detected
  - Error display for no-face/multiple-faces scenarios
  - Boundary constraints preventing rectangle from moving outside image
  - Real-time visual feedback during drag and resize operations
- Tests:
  - `faceDetectionService.test.ts` ([src/services/faceDetectionService.test.ts](src/services/faceDetectionService.test.ts)) - 10 tests
  - `SizeSelection.test.tsx` ([src/components/size/SizeSelection.test.tsx](src/components/size/SizeSelection.test.tsx)) - 21 tests
- Integration: MainWorkflow ([src/pages/MainWorkflow.tsx](src/pages/MainWorkflow.tsx))
  - Model loaded on component mount from `/version-RFB-320.onnx`
  - Face detection runs on matted image before size selection step
  - Crop area state managed and passed to size selection component
  - Workflow: Upload → Background → Preview → **Face Detection + Size Selection with Crop Guide** → Layout → Download

#### User Story 6: As a General Consumer, I want clear printing instructions ("Select actual size, do not scale") so that my prints maintain correct dimensions.  
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

#### User Story 1: As an International User, I want to manually select my preferred language from a language selector so that I can use the application in my native language. ✅ COMPLETED
Provides user control over language selection without relying on automatic detection.  
##### Acceptance Criteria:  
- ✅ Given any screen, when accessing the language selector (clearly visible in header/navigation), then dropdown shows all available languages with native names (English, 中文).  
- ✅ Given language selection, when choosing a different language, then the entire interface updates immediately without page reload.  
- ✅ Given language switch, when navigating between screens, then the selected language persists throughout the session via localStorage.  

##### Implementation Details:
- Component: `LanguageSelector` ([src/components/language/LanguageSelector.tsx](src/components/language/LanguageSelector.tsx))
- Tests: `LanguageSelector.test.tsx` ([src/components/language/LanguageSelector.test.tsx](src/components/language/LanguageSelector.test.tsx))
- Configuration: `i18n.ts` ([src/i18n.ts](src/i18n.ts))
- Translation Files:
  - English: [src/locales/en.json](src/locales/en.json)
  - Chinese: [src/locales/zh.json](src/locales/zh.json)
- Features:
  - Dropdown selector in app header showing native language names
  - Instant language switching without page reload
  - LocalStorage persistence of language selection
  - Chinese as default language (per user request)
  - English fallback for missing translations
  - Integrated into MainWorkflow header

#### User Story 2: As an International User, I want all user-facing text properly extracted into translation files so that new languages can be added without code changes. ✅ COMPLETED
Enables maintainable internationalization architecture for future language expansion.  
##### Acceptance Criteria:  
- ✅ Given translation system implementation, when reviewing code structure, then all UI strings are stored in JSON files organized by language code (en.json, zh.json).  
- ✅ Given new language addition, when adding a translation file, then the system automatically includes it in the language selector without requiring code modification.  
- ✅ Given missing translation key, when viewing the interface, then fallback to English occurs gracefully.  

##### Implementation Details:
- All UI strings extracted to translation files using i18next keys
- Components updated to use `useTranslation` hook:
  - MainWorkflow (app title, subtitle, loading message)
  - Step1Settings (buttons, labels, image preview)
  - Step2Preview (title, button labels)
  - Step3Layout (title, button labels)
  - StepIndicator (step labels)
  - SizeSelector (size labels translated via labelKey)
  - ColorSelector (background label)
  - PaperTypeSelector (paper type labels)
  - CropEditor (DPI warning messages)
- Face detection error messages translated in MainWorkflow
- Size options include labelKey for dynamic translation
- Fallback to English for missing keys

#### User Story 3: As an International User, I want culturally appropriate date, number, and measurement formatting so that the interface feels native to my region.  
Ensures proper localization beyond just text translation for enhanced user experience.  
##### Acceptance Criteria:  
- Given metric system preference, when viewing measurements, then dimensions display in millimeters with appropriate decimal separators based on locale.  
- Given different locale, when displaying numbers (e.g., DPI values), then formatting follows regional conventions (e.g., 1.000,00 vs 1,000.00).  
- Given RTL language selection (e.g., Arabic, Hebrew), when viewing the interface, then layout direction automatically adjusts with proper mirroring of UI elements.  

**Note**: This user story is deferred as it's not required for English/Chinese support. RTL and advanced number formatting can be added when additional languages are supported.

#### User Story 4: As an International User, I want offline language support so that my chosen language works even without internet connection. ✅ COMPLETED
Maintains full functionality in offline PWA scenarios for all supported languages.  
##### Acceptance Criteria:  
- ✅ Given translation files bundled with application, when launching offline, then all translation files for both English and Chinese are available without network request.  
- ✅ Given language switch while offline, when selecting any supported language, then interface updates successfully without network request.  
- ✅ Given initial load, when caching assets, then translation files are included in the application bundle for offline availability.  

##### Implementation Details:
- Translation files imported directly in i18n.ts configuration
- No external API calls for translations
- Translations bundled with application during build
- Works seamlessly in offline/PWA scenarios

#### User Story 5: As an International User, I want the default language to be Chinese so that users in China have an optimized baseline experience. ✅ COMPLETED (Modified from English default per user request)
Provides a reliable default experience while maintaining language choice flexibility.  
##### Acceptance Criteria:  
- ✅ Given first-time user, when loading the application, then the interface displays in Chinese by default.  
- ✅ Given Chinese as default, when viewing the language selector, then "中文" is marked as the currently selected option.  
- ✅ Given no prior language selection stored, when returning to the app, then Chinese remains the active language.  

##### Implementation Details:
- Default language set to Chinese ('zh') in i18n configuration
- LocalStorage used to persist language selection
- Graceful fallback to English in test environment
- Language switcher shows current selection with proper highlighting  

#### Dependencies/Risks  
- Dependency: Translation management system for maintaining language files  
- Risk: Incomplete translations affecting user experience in partially supported languages  
- Dependency: RTL layout support in CSS framework  
- Risk: Increased bundle size from multiple translation files affecting initial load time

---

## Recent Changes

### Refactor: CropEditor Component - DPI Warning & Rename (January 2, 2026)

**Issue**: The SizeSelection component name didn't accurately reflect its primary purpose (crop editing), and there was no validation to warn users when the crop area couldn't achieve 300 DPI for print quality.

**Solution**: 
1. Added DPI calculation and warning system to alert users when crop area is insufficient for 300 DPI
2. Renamed component from `SizeSelection` to `CropEditor` to better reflect its purpose

**Changes**:
- Created `dpiCalculation.ts` utility with `calculateDPI()` function that computes DPI from pixel dimensions and physical millimeters
- Added `physicalWidth` and `physicalHeight` properties to `SizeOption` interface (25mm, 35mm, etc.)
- Integrated DPI calculation into component using `useMemo` based on crop area and selected size
- Added informational (non-blocking) warning display when DPI < 300, showing actual calculated DPI
- Warning styled with yellow colors to indicate informational status (not error)
- Renamed component files: `SizeSelection.tsx` → `CropEditor.tsx`, `SizeSelection.test.tsx` → `CropEditor.test.tsx`
- Updated all imports in `MainWorkflow.tsx` and other files
- Updated component props interface: `SizeSelectionProps` → `CropEditorProps`
- Updated CSS class name: `size-selection` → `crop-editor`
- Added comprehensive tests for DPI calculation (8 test cases) and warning display (5 test cases)

**Impact**: 
- Users receive clear guidance when their crop area won't meet 300 DPI print standards
- Component name now accurately reflects its primary function (crop editing with size guidance)
- Improved code clarity and maintainability with better naming
- All 181 tests passing, no regressions

### Refactor: SizeSelection Component - Compact Mode (January 2, 2026)

**Issue**: The processed image view in MainWorkflow displayed duplicate UI elements - size selection buttons and instructions were shown both in the processed image area and in the lower controls area.

**Solution**: Added a `compact` prop to the `SizeSelection` component to conditionally hide size selection buttons and instructions when rendered in the processed image view. This creates a cleaner, more focused view showing only the image with the crop overlay.

**Changes**:
- Added `compact?: boolean` prop to `SizeSelectionProps` interface
- Size selection buttons and instructions are now conditionally rendered based on `compact` prop
- MainWorkflow passes `compact={true}` to SizeSelection in the processed image container
- Error messages are still displayed in compact mode for user feedback

**Impact**: Improved UX by removing duplicate controls and creating a cleaner processed image view.

### Bug Fix: Crop Box Not Updating on External Size Change (January 2, 2026)

**Issue**: When users selected a different photo size from the lower controls area, the crop box in the processed image view did not update to match the new aspect ratio.

**Root Cause**: The SizeSelection component only adjusted the crop area when its internal size buttons were clicked. When `selectedSize` was changed externally via props from MainWorkflow, there was no `useEffect` watching for aspect ratio changes to adjust the crop area accordingly.

**Solution**: Added a `useEffect` hook that watches `selectedSize.aspectRatio` changes and automatically adjusts the crop area to match the new aspect ratio while maintaining the center position of the crop.

**Changes**:
- Added new `useEffect` with `selectedSize.aspectRatio` as a dependency
- Crop area adjustment logic calculates new dimensions while maintaining center position
- Includes proper constraints to keep crop area within image bounds
- Only updates if aspect ratio actually changed (to avoid unnecessary re-renders)

**Impact**: Crop box now properly updates when users change size selection, providing immediate visual feedback and ensuring the crop matches the selected ID photo dimensions.