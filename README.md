# ID Photo Maker

A privacy-first, client-side web application for creating professional ID photos with AI-powered background removal. All processing happens locally in your browser—your photos never leave your device.

## Features

### 🔒 Privacy-First
- **100% Client-Side Processing**: All AI computations and image processing happen in your browser
- **Zero Server Uploads**: No external network requests—your photos never leave your device
- **Offline Capable**: Works without internet connection after initial load

### 🎨 AI-Powered Background Removal
- **U²-Net Matting**: Professional portrait segmentation using U²-Net ONNX model
- **9 Preset Colors**: Red, Blue, White, Crimson, Maroon, Dark Red, Sky Blue, Royal Blue, Light Blue
- **Custom RGB Colors**: Full color picker with real-time validation

### 📏 Standard ID Photo Sizes
- **1-inch** (25×35mm, 0.714 aspect ratio)
- **2-inch** (35×49mm, 0.714 aspect ratio)
- **3-inch** (35×52mm, 0.673 aspect ratio)
- **300 DPI Output**: Professional print quality

### 🤖 Intelligent Face Detection
- **UltraFace-320 Model**: Automatic face detection for smart cropping
- **Auto-Positioning**: Intelligent crop area calculation with 30% padding
- **Manual Adjustment**: Draggable and resizable crop rectangle

### 🖨️ Print-Ready Layouts
- **6-inch Photo Paper**: 1200×1800px @ 300DPI (4×6 inches)
- **A4 Paper**: 2480×3508px @ 300DPI (8.27×11.69 inches)
- **Optimal Arrangement**: Automatic calculation of maximum photos per sheet
- **5mm Spacing**: Professional spacing between photos for easy cutting

### 🌍 Multi-Language Support
- **Languages**: English, 中文 (Chinese)
- **Manual Selection**: User-controlled language switching
- **Persistent**: Language preference saved to localStorage

### 📱 Mobile-Friendly
- **Responsive Design**: Optimized for all screen sizes
- **Touch Support**: Full touch gesture support for cropping and resizing
- **Camera Access**: Direct camera capture on mobile devices

## Quick Start

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

### Testing

```bash
# Run all tests once
npm test

# Run tests with UI
npm run test:ui

# Type checking
npm run type-check

# Linting
npm run lint
```

### Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## User Workflow

### Step 1: Upload & Configuration
1. Select photo size (1-inch, 2-inch, or 3-inch)
2. Select background color (preset or custom RGB)
3. Select paper type for print layout (6-inch or A4)
4. Upload image or capture with camera
5. Click "Generate ID Photo" to start processing

### Step 2: ID Photo Preview
1. Review the processed ID photo with selected background
2. Download individual ID photo
3. Go back to adjust settings (preserves original image)
4. Continue to print layout

### Step 3: Print Layout Preview
1. Review print-ready layout with multiple photos
2. See optimal arrangement for selected paper size
3. Download high-resolution print layout (300 DPI PNG)
4. Go back to adjust settings if needed

## Architecture

### Tech Stack
- **Frontend Framework**: Vite + React 19 + TypeScript
- **Styling**: Tailwind CSS 4+
- **Testing**: Vitest + Testing Library
- **AI Models**: 
  - U²-Net (ONNX Runtime Web) - Background removal
  - UltraFace-320 (TensorFlow.js) - Face detection
- **Internationalization**: i18next + react-i18next
- **Deployment**: Static hosting (AWS S3 + CloudFront ready)

### Project Structure

```
src/
├── components/          # React components
│   ├── background/      # Background color selection
│   ├── language/        # Language selector
│   ├── layout/          # Print layout components
│   ├── size/            # Size selection and crop editor
│   ├── upload/          # File upload components
│   └── workflow/        # Step indicator and workflow components
├── hooks/               # Custom React hooks
│   ├── useImageDownload.ts       # Download management
│   ├── useModelLoading.ts        # AI model loading
│   ├── useNotificationState.ts   # Error/warning state
│   ├── usePerformanceMeasure.ts  # Performance tracking
│   ├── usePrintLayoutCanvas.ts   # Print layout rendering
│   └── useWorkflowSteps.ts       # Workflow navigation
├── services/            # Business logic
│   ├── canvasOperationsService.ts      # Canvas utilities
│   ├── downloadService.ts              # File download
│   ├── exactCropService.ts             # Precise cropping
│   ├── faceDetectionService.ts         # Face detection
│   ├── fileUploadService.ts            # File upload handling
│   ├── imageProcessingOrchestrator.ts  # Main processing pipeline
│   ├── imageScaling.ts                 # Image scaling
│   ├── imageValidation.ts              # Image validation
│   ├── mattingService.ts               # Background removal
│   ├── printLayoutService.ts           # Print layout generation
│   └── u2netService.ts                 # U²-Net model
├── utils/               # Utility functions
│   ├── cropAreaCalculation.ts  # Crop area math
│   ├── deviceCapability.ts     # Device detection
│   ├── dpiCalculation.ts       # DPI calculations
│   ├── dpiMetadata.ts          # DPI metadata embedding
│   ├── layoutCalculation.ts    # Print layout math
│   └── marginValidation.ts     # Margin validation
├── pages/               # Page components
│   └── MainWorkflow.tsx         # Main application page
├── constants/           # Constants and configurations
├── locales/             # Translation files (en, zh)
├── types/               # TypeScript type definitions
└── test/                # Test setup
```

### Key Design Principles

1. **Privacy-First**: Zero server dependencies, all processing in browser
2. **Separation of Concerns**: Services handle business logic, components handle UI
3. **Test Coverage**: Comprehensive unit tests for all services and components
4. **Type Safety**: Full TypeScript typing throughout
5. **Performance**: Optimized image processing with crop-then-matting approach
6. **Accessibility**: WCAG compliant with proper ARIA labels

## AI Models

### U²-Net Background Removal
- **Model**: U²-Net ONNX (~176MB)
- **Runtime**: ONNX Runtime Web
- **Input**: 320×320 RGB image
- **Output**: Alpha mask for background removal
- **Location**: `/public/u2net.onnx`

### UltraFace-320 Face Detection
- **Model**: UltraFace-320 ONNX (~1.2MB)
- **Runtime**: ONNX Runtime Web
- **Input**: 320×240 RGB image
- **Output**: Face bounding boxes with confidence scores
- **Location**: `/public/version-RFB-320.onnx`

## Documentation

- [Architecture](docs/architecture.md) - Detailed system architecture and design
- [Requirements](docs/requirements.md) - User stories, epics, and acceptance criteria
- [Initial Idea](docs/initial-idea.md) - Original project concept

## Performance

- **Face Detection**: <1 second on modern devices
- **Background Removal**: 3-5 seconds depending on device capability
- **Image Processing**: Optimized with crop-then-matting approach
- **Memory Usage**: Efficient canvas operations with cleanup

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with Canvas and File API support

## References

- [U-2-Net](https://github.com/xuebinqin/U-2-Net) - Portrait segmentation model
- [rembg](https://github.com/danielgatis/rembg) - Background removal inspiration
- [TensorFlow.js Face Detection](https://github.com/tensorflow/tfjs-models/tree/master/face-detection) - Face detection models
- [ONNX Runtime Web](https://onnxruntime.ai/docs/get-started/with-javascript.html) - Web ML inference

## License

MIT
