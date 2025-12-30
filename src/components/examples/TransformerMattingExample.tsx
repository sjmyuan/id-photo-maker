import { useState } from 'react'
import { removeBackgroundWithTransformer, applyBackgroundColor } from '../services/mattingService'

/**
 * Example component demonstrating Hugging Face Transformer image matting
 * This can be integrated into your app or used as a reference
 */
export function TransformerMattingExample() {
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null)
  const [processedCanvas, setProcessedCanvas] = useState<HTMLCanvasElement | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingTime, setProcessingTime] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF')

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const img = new Image()
    img.onload = () => {
      setSelectedImage(img)
      setProcessedCanvas(null)
      setError(null)
    }
    img.onerror = () => {
      setError('Failed to load image')
    }
    img.src = URL.createObjectURL(file)
  }

  const processWithTransformer = async () => {
    if (!selectedImage) return

    setIsProcessing(true)
    setError(null)

    try {
      const result = await removeBackgroundWithTransformer(selectedImage)
      setProcessedCanvas(result.processedImage)
      setProcessingTime(result.processingTime)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const applyBackground = () => {
    if (!processedCanvas) return

    const withBackground = applyBackgroundColor(processedCanvas, backgroundColor)
    setProcessedCanvas(withBackground)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">AI Image Matting Demo</h2>
      
      {/* Upload Section */}
      <div className="mb-6">
        <label className="block mb-2 font-semibold">Upload Image:</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      {/* Process Button */}
      {selectedImage && !processedCanvas && (
        <div className="mb-6">
          <button
            onClick={processWithTransformer}
            disabled={isProcessing}
            className="px-6 py-2 bg-blue-600 text-white rounded-md
              hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing... (may take 1-2 min on first run)' : 'Remove Background (AI)'}
          </button>
        </div>
      )}

      {/* Background Color Selector */}
      {processedCanvas && (
        <div className="mb-6">
          <label className="block mb-2 font-semibold">Background Color:</label>
          <div className="flex gap-4 items-center">
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="h-10 w-20"
            />
            <button
              onClick={applyBackground}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Apply Background
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
          Error: {error}
        </div>
      )}

      {/* Processing Time */}
      {processingTime && (
        <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-md">
          Processing completed in {(processingTime / 1000).toFixed(2)}s
        </div>
      )}

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original Image */}
        {selectedImage && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold mb-2">Original Image</h3>
            <img
              src={selectedImage.src}
              alt="Original"
              className="w-full h-auto rounded border"
            />
            <p className="text-sm text-gray-600 mt-2">
              Size: {selectedImage.width}x{selectedImage.height}px
            </p>
          </div>
        )}

        {/* Processed Image */}
        {processedCanvas && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold mb-2">Processed Image</h3>
            <div className="relative">
              {/* Checkerboard background to show transparency */}
              <div className="absolute inset-0 bg-[linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_75%,#ccc_75%,#ccc),linear-gradient(45deg,#ccc_25%,transparent_25%,transparent_75%,#ccc_75%,#ccc)] bg-[length:20px_20px] bg-[0_0,10px_10px]" />
              <canvas
                ref={(el) => {
                  if (el && processedCanvas) {
                    const ctx = el.getContext('2d')
                    if (ctx) {
                      el.width = processedCanvas.width
                      el.height = processedCanvas.height
                      ctx.drawImage(processedCanvas, 0, 0)
                    }
                  }
                }}
                className="relative w-full h-auto rounded border"
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Size: {processedCanvas.width}x{processedCanvas.height}px
              <br />
              Quality: High (AI-powered)
            </p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h3 className="font-semibold mb-2">ℹ️ How it works:</h3>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          <li>Uses U-2-Netp AI model from Hugging Face</li>
          <li>First run downloads the model (~17MB) and caches it</li>
          <li>Subsequent runs are much faster using the cached model</li>
          <li>Produces high-quality transparent backgrounds</li>
          <li>Works entirely in your browser - no server required</li>
        </ul>
      </div>
    </div>
  )
}
