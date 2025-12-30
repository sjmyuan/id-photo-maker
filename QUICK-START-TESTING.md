# Quick Start: Testing Image Matting

## 🚀 Quick Test (3 steps)

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open the test page in your browser:**
   ```
   http://localhost:5173/test-matting.html
   ```

3. **Upload a portrait image and click "Process with Transformer (AI)"**

That's it! The first run will download the model (~17MB), subsequent runs will be instant.

## 📸 Test Images

Try these types of images for best results:
- Portrait photos (headshots work great)
- Full-body photos
- People with simple backgrounds
- People with complex backgrounds (to see the AI's power)

You can download free test images from:
- [Unsplash](https://unsplash.com/s/photos/portrait)
- [Pexels](https://pexels.com/search/portrait/)

## 🔍 What to Look For

### Good Results:
- ✅ Clean edges around the person
- ✅ Transparent background (you'll see checkerboard pattern)
- ✅ Hair details preserved
- ✅ No artifacts or rough edges

### Compare with Canvas Algorithm:
- Click "Process with Canvas (Simple)" to see the difference
- The AI (Transformer) should be significantly better
- Canvas algorithm is faster but less accurate

## 📊 Expected Performance

| Run | Time | Notes |
|-----|------|-------|
| First | 1-2 min | Downloads model (~17MB) |
| Second+ | 0.5-2 sec | Uses cached model |

## 🐛 If Something Goes Wrong

### Model download fails:
- Check internet connection
- Look at browser console (F12) for errors
- Try refreshing the page

### Processing is slow:
- First run is always slow (model download)
- Try a smaller image
- Check if your browser supports WebGPU (Chrome/Edge)

### Out of memory:
- Close other tabs
- Try a smaller image (< 1000px)
- Restart browser

## 💡 Tips

1. **Use JPEG or PNG** images for best compatibility
2. **Optimal size**: 500-1500px (larger is slower but higher quality)
3. **Best subjects**: Single person, clear foreground/background separation
4. **Lighting**: Well-lit photos work best

## 📝 Code Example

If you want to use this in your own code:

```typescript
import { removeBackgroundWithTransformer } from './services/mattingService'

// Load image
const img = new Image()
img.src = 'path/to/image.jpg'
await img.decode()

// Process (first call downloads model)
const result = await removeBackgroundWithTransformer(img)

// Use the result
document.body.appendChild(result.processedImage)
console.log(`Processed in ${result.processingTime}ms`)
```

## 🎯 Next Steps

After testing:
1. Check [IMPLEMENTATION-SUMMARY.md](./IMPLEMENTATION-SUMMARY.md) for full details
2. Review [huggingface-matting-guide.md](./huggingface-matting-guide.md) for API docs
3. Look at [TransformerMattingExample.tsx](../src/components/examples/TransformerMattingExample.tsx) for React integration

Happy testing! 🎉
