/**
 * U2Net ONNX Model Test Page
 * Test page for running U2Net model with onnxruntime-web
 */

import { useState, useEffect, useRef } from 'react'
import { loadU2NetModel, processImageWithU2Net } from '../services/u2netService'
import type { U2NetModel } from '../services/u2netService'

type ModelType = 'u2netp' | 'u2net'

const MODELS = {
  u2netp: {
    url: 'http://localhost:5173/u2netp.onnx',
    name: 'U2Net-P (Lite)',
    size: '~4.7MB',
    speed: 'Fast',
    quality: 'Good',
  },
  u2net: {
    url: 'http://localhost:5173/u2net.onnx',
    name: 'U2Net (Full)',
    size: '~176MB',
    speed: 'Slower',
    quality: 'Excellent',
  },
} as const

export function U2NetTestPage() {
  // Load initial model selection from localStorage or default to u2netp
  const [selectedModel, setSelectedModel] = useState<ModelType>(() => {
    const saved = localStorage.getItem('u2net-model-selection')
    return (saved === 'u2net' || saved === 'u2netp') ? saved : 'u2netp'
  })
  
  const [model, setModel] = useState<U2NetModel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [processingTime, setProcessingTime] = useState<number | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  const handleModelChange = (modelType: ModelType) => {
    setSelectedModel(modelType)
    localStorage.setItem('u2net-model-selection', modelType)
    
    // Clear current model and processed images when switching models
    setModel(null)
    setProcessedImage(null)
    setProcessingTime(null)
    setError(null)
  }

  useEffect(() => {
    // Load model when selectedModel changes
    const initModel = async () => {
      try {
        setLoading(true)
        setError(null)
        const modelUrl = MODELS[selectedModel].url
        const loadedModel = await loadU2NetModel(modelUrl)
        setModel(loadedModel)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load model')
      } finally {
        setLoading(false)
      }
    }

    initModel()
  }, [selectedModel])

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !model) return

    try {
      setProcessing(true)
      setError(null)
      setProcessedImage(null)
      setProcessingTime(null)

      // Create object URL for original image
      const imageUrl = URL.createObjectURL(file)
      setOriginalImage(imageUrl)

      // Load image
      const img = new Image()
      img.onload = async () => {
        imageRef.current = img
        
        // Process with U2Net
        const startTime = performance.now()
        const blob = await processImageWithU2Net(model, img)
        const endTime = performance.now()
        
        setProcessingTime(endTime - startTime)
        
        // Create URL for processed image
        const processedUrl = URL.createObjectURL(blob)
        setProcessedImage(processedUrl)
        setProcessing(false)
      }
      img.onerror = () => {
        setError('Failed to load image')
        setProcessing(false)
      }
      img.src = imageUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image')
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4">
          <h1 className="text-3xl font-bold text-gray-900">U2Net ONNX Model Test</h1>
          <p className="text-sm text-gray-600 mt-1">Test U2Net background removal with onnxruntime-web</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Model Selection */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Model Selection</h2>
            <div className="space-y-3">
              {(Object.keys(MODELS) as ModelType[]).map((modelType) => {
                const modelInfo = MODELS[modelType]
                return (
                  <label
                    key={modelType}
                    className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedModel === modelType
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="model-selection"
                      value={modelType}
                      checked={selectedModel === modelType}
                      onChange={() => handleModelChange(modelType)}
                      className="mt-1 mr-3"
                      disabled={loading}
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{modelInfo.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="inline-block mr-4">Size: {modelInfo.size}</span>
                        <span className="inline-block mr-4">Speed: {modelInfo.speed}</span>
                        <span className="inline-block">Quality: {modelInfo.quality}</span>
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Model Status */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Model Status</h2>
            {loading && (
              <div>
                <p className="text-gray-600 mb-2">Loading model from: {MODELS[selectedModel].url}</p>
                <p className="text-sm text-gray-500">This may take a moment on first load...</p>
              </div>
            )}
            {error && !model && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 font-semibold mb-2">Error: {error}</p>
                <div className="text-sm text-gray-700 space-y-2">
                  <p className="font-semibold">Model file not found. Please download it:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Run this command in your terminal:</li>
                  </ol>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                    curl -L -o public/u2netp.onnx https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx
                  </pre>
                  <ol className="list-decimal list-inside space-y-1 ml-2" start={2}>
                    <li>Restart the dev server</li>
                    <li>Refresh this page</li>
                  </ol>
                  <p className="text-xs text-gray-600 mt-2">Model size: ~4.7MB</p>
                </div>
              </div>
            )}
            {model && !loading && (
              <p className="text-green-600">✓ Model loaded successfully</p>
            )}
          </div>

          {/* Image Upload */}
          {model && !loading && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Upload Image</h2>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                disabled={processing}
                data-testid="u2net-image-input"
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {processing && (
                <p className="mt-2 text-gray-600">Processing image...</p>
              )}
            </div>
          )}

          {/* Processing Time */}
          {processingTime !== null && (
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Processing time: <span className="font-semibold">{processingTime.toFixed(0)}ms</span>
              </p>
            </div>
          )}

          {/* Error Display */}
          {error && model && (
            <div className="mb-6">
              <p className="text-red-600">Error: {error}</p>
            </div>
          )}

          {/* Image Comparison */}
          {originalImage && processedImage && (
            <div className="flex flex-row items-start justify-center gap-8 mt-4">
              <div className="flex flex-col items-center">
                <span className="text-base font-semibold mb-2">Original</span>
                <img
                  src={originalImage}
                  alt="Original"
                  className="max-w-[240px] w-full rounded-lg border border-gray-300 shadow"
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-base font-semibold mb-2">Processed</span>
                <div className="relative max-w-[240px] w-full rounded-lg border border-gray-300 shadow overflow-hidden">
                  {/* Checkered background to show transparency */}
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage:
                        'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                    }}
                  />
                  <img
                    src={processedImage}
                    alt="Processed"
                    className="relative w-full"
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
