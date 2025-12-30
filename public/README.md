# Public Assets

## U2Net Model Setup

To use the U2Net test page (`/u2net-test`), you need to download the model file:

### Download the model:

```bash
curl -L -o public/u2netp.onnx https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx
```

Or download manually:
1. Visit: https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx
2. Save the file as `u2netp.onnx` in this `public/` folder

The model file is approximately 4.7MB.

### Alternative: Use a different model

You can also use other U2Net variants by downloading them and updating the `MODEL_URL` in `src/pages/U2NetTestPage.tsx`:
- u2net.onnx (176MB) - Full model
- u2netp.onnx (4.7MB) - Portable model (recommended)
