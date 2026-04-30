# ID Photo Maker

A web application for creating professional ID photos, powered by server-side AI. The React frontend handles the UI workflow; a Node.js backend runs face detection (TensorFlow.js) and background removal (U²-Net ONNX) server-side and returns processed images via REST API.

## Features

### AI-Powered Processing
- **U²-Net Background Removal**: Professional portrait segmentation using the U²-Net ONNX model, run server-side
- **TensorFlow.js Face Detection**: Automatic face detection for smart cropping and layout, run server-side
- **9 Preset Background Colors**: Red, Blue, White, Crimson, Maroon, Dark Red, Sky Blue, Royal Blue, Light Blue
- **Custom Color Picker**: Full RGB color picker with hex validation

### Standard ID Photo Sizes
- Small 1-inch (22×32mm), 1-inch (25×35mm), Large 1-inch (33×48mm)
- Small 2-inch (35×45mm), 2-inch (35×53mm), 3-inch (35×52mm)
- China ID Card (26×32mm)

### Print-Ready Layouts
- **6-inch Photo Paper**: 1200×1800px @ 300DPI (4×6 inches)
- **A4 Paper**: 2480×3508px @ 300DPI (8.27×11.69 inches)
- Automatic optimal photo arrangement with 5mm spacing

### Multi-Language Support
- English and Chinese (中文), with user-controlled language switching

### Mobile-Friendly
- Responsive design with touch support and direct camera capture

## Architecture

This project consists of two services that must both be running:

| Service | Folder | Description |
|---------|--------|-------------|
| **Frontend** | `id-photo-maker/` | React 19 + Vite + TypeScript UI |
| **Backend** | `id-photo-maker-backend/` | Node.js + Express + TypeScript API |

The frontend sends the uploaded image to the backend's `POST /api/process` endpoint. The backend runs AI inference and image processing, then returns base64-encoded ID photo and print layout images.

## Quick Start

### Prerequisites

- Node.js 18+ and npm

### 1. Start the backend

```bash
cd id-photo-maker-backend
cp .env.example .env      # review and adjust values
./download-models.sh      # download required AI model files into models/
npm install
npm run dev
```

The backend starts on `http://localhost:3000`.

### 2. Start the frontend

```bash
cd id-photo-maker
cp .env.example .env      # set VITE_API_BASE_URL if your backend runs on a different port
npm install
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

### Environment Variables

**Frontend** (`id-photo-maker/.env`):

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:3000/api` | URL of the backend API |

**Backend** (`id-photo-maker-backend/.env`):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port to listen on |
| `CORS_ORIGIN` | `*` | Comma-separated allowed origins — **restrict this in production** |
| `MODEL_U2NET_PATH` | `./models/u2net.onnx` | Path to U²-Net ONNX model file |
| `MODEL_FACE_DETECTION_PATH` | `./models/face-detection-models/model.json` | Path to face detection model |
| `MAX_FILE_SIZE_MB` | `10` | Soft threshold — images above this are scaled before processing |
| `MAX_UPLOAD_SIZE_MB` | `50` | Hard upload limit — requests above this are rejected with 413 |

### Testing

```bash
# Frontend tests
cd id-photo-maker && npm test

# Backend tests
cd id-photo-maker-backend && npm test
```

### Build for Production

```bash
cd id-photo-maker
npm run build   # outputs to dist/
```

## User Workflow

### Step 1: Upload & Configuration
1. Select photo size
2. Select background color (preset or custom)
3. Select paper type for print layout (6-inch or A4)
4. Upload image or capture with camera
5. Click "Generate ID Photo" — the image is sent to the backend for processing

### Step 2: ID Photo Preview
1. Review the processed ID photo with the selected background
2. Download individual ID photo
3. Go back to adjust settings (preserves the original uploaded image)
4. Continue to print layout

### Step 3: Print Layout Preview
1. Review the print-ready layout with multiple photos
2. See the optimal arrangement for the selected paper size
3. Download high-resolution print layout (300 DPI PNG)
4. Go back to adjust settings if needed

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 19 + Vite + TypeScript |
| Styling | Tailwind CSS 4 |
| Testing | Vitest + Testing Library |
| Internationalization | i18next + react-i18next |
| Backend framework | Express + TypeScript |
| Image processing | sharp |
| Background removal | onnxruntime-node (U²-Net) |
| Face detection | TensorFlow.js (tfjs-node) |

## Documentation

- [Architecture](docs/architecture.md) — Detailed system architecture and design
- [Requirements](docs/requirements.md) — User stories, epics, and acceptance criteria
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
