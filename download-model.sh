#!/bin/bash

# Download U2Net model for the test page
echo "Downloading U2Net model..."
echo "This will download ~4.7MB to public/u2netp.onnx"
echo ""

cd "$(dirname "$0")/public"

if [ -f "u2netp.onnx" ]; then
  echo "✓ Model already exists at public/u2netp.onnx"
  ls -lh u2netp.onnx
else
  echo "Downloading from GitHub..."
  curl -L --progress-bar -o u2netp.onnx https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx
  
  if [ -f "u2netp.onnx" ]; then
    echo ""
    echo "✓ Download complete!"
    ls -lh u2netp.onnx
    echo ""
    echo "You can now run: npm run dev"
  else
    echo ""
    echo "✗ Download failed. Please try manually:"
    echo "  1. Visit: https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx"
    echo "  2. Save as: public/u2netp.onnx"
    exit 1
  fi
fi
