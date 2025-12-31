import { useState, useEffect, useCallback, type ChangeEvent } from 'react'
import { BackgroundSelector } from '../components/background/BackgroundSelector'
import { SizeSelection, type CropArea, type SizeOption, SIZE_OPTIONS } from '../components/size/SizeSelection'
import { loadFaceDetectionModel, detectFaces, type FaceDetectionModel, type FaceBox } from '../services/faceDetectionService'
import { loadU2NetModel, type U2NetModel } from '../services/u2netService'
import { validateImageFile } from '../services/imageValidation'
import { scaleImageToTarget } from '../services/imageScaling'
import { processWithU2Net, applyBackgroundColor } from '../services/mattingService'
import { usePerformanceMeasure } from '../hooks/usePerformanceMeasure'

interface ImageData {
  originalFile: File
  originalUrl: string
  transparentBlob: Blob // Transparent matted image
  transparentCanvas: HTMLCanvasElement // Canvas with transparent background
  processedUrl: string // URL with applied background color
}

export function MainWorkflow() {
  // Default values: 1-inch size, Blue background
  const [selectedSize, setSelectedSize] = useState<SizeOption>(SIZE_OPTIONS[0]) // 1-inch
  const [backgroundColor, setBackgroundColor] = useState<string>('#0000FF') // Blue
  const [imageData, setImageData] = useState<ImageData | null>(null)
  const [u2netModel, setU2netModel] = useState<U2NetModel | null>(null)
  const [isLoadingU2Net, setIsLoadingU2Net] = useState(true)
  const [faceDetectionModel, setFaceDetectionModel] = useState<FaceDetectionModel | null>(null)
  const [detectedFace, setDetectedFace] = useState<FaceBox | null>(null)
  const [faceDetectionError, setFaceDetectionError] = useState<'no-face-detected' | 'multiple-faces-detected' | undefined>()
  const [cropArea, setCropArea] = useState<CropArea | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])
  const [errors, setErrors] = useState<string[]>([])

  const { start, stop } = usePerformanceMeasure()

  // Load models on mount
  useEffect(() => {
    const loadModels = async () => {
      // Load U2Net model
      try {
        const selectedModel = localStorage.getItem('selectedU2NetModel') || 'u2netp'
        const modelUrl = `/${selectedModel}.onnx`
        
        setIsLoadingU2Net(true)
        const model = await loadU2NetModel(modelUrl)
        setU2netModel(model)
      } catch (error) {
        console.error('Failed to load U2Net model:', error)
      } finally {
        setIsLoadingU2Net(false)
      }

      // Load face detection model
      try {
        const faceModel = await loadFaceDetectionModel('/version-RFB-320.onnx')
        setFaceDetectionModel(faceModel)
      } catch (error) {
        console.error('Failed to load face detection model:', error)
      }
    }
    loadModels()
  }, [])

  // Handle file upload
  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      // Reset state
      setWarnings([])
      setErrors([])
      setImageData(null)
      setDetectedFace(null)
      setFaceDetectionError(undefined)
      setIsProcessing(true)
      start()

      try {
        // 1. Validate the file
        const validation = await validateImageFile(file)
        
        if (!validation.isValid) {
          setErrors(validation.errors)
          stop()
          setIsProcessing(false)
          return
        }

        if (validation.warnings.length > 0) {
          setWarnings(validation.warnings)
        }

        // 2. Scale if needed
        let fileToProcess = file
        if (validation.needsScaling) {
          const scaledBlob = await scaleImageToTarget(file, 10)
          fileToProcess = new File([scaledBlob], file.name, { type: file.type })
        }

        // 3. Process matting
        if (!u2netModel) {
          setErrors(['AI model not loaded yet. Please wait and try again.'])
          setIsProcessing(false)
          stop()
          return
        }

        const mattedBlob = await processWithU2Net(fileToProcess, u2netModel)

        // Create transparent canvas from blob
        const transparentImg = new Image()
        const transparentUrl = URL.createObjectURL(mattedBlob)
        transparentImg.src = transparentUrl
        
        await new Promise((resolve, reject) => {
          transparentImg.onload = resolve
          transparentImg.onerror = reject
        })

        const transparentCanvas = document.createElement('canvas')
        transparentCanvas.width = transparentImg.naturalWidth
        transparentCanvas.height = transparentImg.naturalHeight
        const ctx = transparentCanvas.getContext('2d')
        if (!ctx) throw new Error('Failed to get canvas context')
        ctx.drawImage(transparentImg, 0, 0)

        // Apply background color
        const coloredCanvas = applyBackgroundColor(transparentCanvas, backgroundColor)
        const coloredBlob = await new Promise<Blob>((resolve, reject) => {
          coloredCanvas.toBlob((blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Failed to create blob'))
          }, 'image/png')
        })

        // Create URLs for display
        const originalUrl = URL.createObjectURL(file)
        const processedUrl = URL.createObjectURL(coloredBlob)
        
        // Clean up temporary URL
        URL.revokeObjectURL(transparentUrl)
        
        setImageData({
          originalFile: file,
          originalUrl,
          transparentBlob: mattedBlob,
          transparentCanvas,
          processedUrl,
        })

        // 4. Detect face
        if (faceDetectionModel) {
          const img = new Image()
          img.src = processedUrl
          
          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
          })
          
          const result = await detectFaces(faceDetectionModel, img)
          
          if (result.error) {
            setFaceDetectionError(result.error)
            setDetectedFace(result.faces[0] || null)
          } else if (result.faces.length === 1) {
            setDetectedFace(result.faces[0])
            setFaceDetectionError(undefined)
          }
        }

        stop()
        setIsProcessing(false)
      } catch (error) {
        setErrors([error instanceof Error ? error.message : 'Processing failed'])
        stop()
        setIsProcessing(false)
      }
    },
    [start, stop, u2netModel, faceDetectionModel]
  )

  const handleBackgroundChange = useCallback((color: string) => {
    setBackgroundColor(color)
    
    // Re-apply background color to processed image in real-time
    if (imageData && imageData.transparentCanvas) {
      const coloredCanvas = applyBackgroundColor(imageData.transparentCanvas, color)
      coloredCanvas.toBlob((blob) => {
        if (blob) {
          // Revoke old URL
          URL.revokeObjectURL(imageData.processedUrl)
          
          // Create new URL with updated background
          const newProcessedUrl = URL.createObjectURL(blob)
          setImageData({
            ...imageData,
            processedUrl: newProcessedUrl,
          })
        }
      }, 'image/png')
    }
  }, [imageData])

  const handleSizeChange = (size: SizeOption) => {
    setSelectedSize(size)
    // Crop area will be adjusted automatically by SizeSelection component
  }

  const handleCropAreaChange = (newCropArea: CropArea) => {
    setCropArea(newCropArea)
  }

  const handleDownload = () => {
    if (!imageData || !cropArea) return
    
    // Create a canvas for the cropped image
    const canvas = document.createElement('canvas')
    
    // Set canvas size to match the crop area
    canvas.width = cropArea.width
    canvas.height = cropArea.height
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Apply background color
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw the transparent image on top, cropped to the selected area
    ctx.drawImage(
      imageData.transparentCanvas,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height, // Source rectangle
      0, 0, cropArea.width, cropArea.height // Destination rectangle
    )
    
    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (!blob) return
      
      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `id-photo-${selectedSize.id}-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 100)
    }, 'image/png')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4">
          <h1 className="text-3xl font-bold text-gray-900">ID Photo Maker</h1>
          <p className="text-sm text-gray-600 mt-1">Privacy-first ID photo generator</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        {/* Upper Area: Image Preview */}
        <div data-testid="preview-area" className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Original Image */}
          <div data-testid="original-image-container" className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">Original</h2>
            <div className="aspect-[3/4] bg-gray-100 rounded flex items-center justify-center">
              {imageData ? (
                <img 
                  src={imageData.originalUrl} 
                  alt="Original" 
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <p className="text-gray-400">No image uploaded</p>
              )}
            </div>
          </div>

          {/* Processed Image with Crop Rectangle */}
          <div data-testid="processed-image-container" className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">Processed</h2>
            <div className="aspect-[3/4] bg-gray-100 rounded flex items-center justify-center">
              {imageData ? (
                <SizeSelection
                  processedImageUrl={imageData.processedUrl}
                  faceBox={detectedFace}
                  error={faceDetectionError}
                  onCropAreaChange={handleCropAreaChange}
                  selectedSize={selectedSize}
                  onSizeChange={handleSizeChange}
                />
              ) : (
                <p className="text-gray-400">No image processed</p>
              )}
            </div>
          </div>
        </div>

        {/* Lower Area: Controls */}
        <div data-testid="controls-area" className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Upload Control */}
            <div data-testid="upload-control">
              <h3 className="text-md font-semibold mb-3 text-gray-800">Upload Image</h3>
              {isLoadingU2Net && (
                <div className="mb-3 p-2 bg-blue-100 border border-blue-400 text-blue-700 text-sm rounded">
                  Loading AI model...
                </div>
              )}
              {warnings.length > 0 && (
                <div className="mb-3 p-2 bg-yellow-100 border border-yellow-400 text-yellow-700 text-sm rounded">
                  {warnings.map((warning, i) => <div key={i}>{warning}</div>)}
                </div>
              )}
              {errors.length > 0 && (
                <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 text-sm rounded">
                  {errors.map((error, i) => <div key={i}>{error}</div>)}
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                disabled={isProcessing || isLoadingU2Net}
                data-testid="file-input"
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {isProcessing && (
                <p className="mt-2 text-sm text-blue-600">Processing image...</p>
              )}
            </div>

            {/* Size Selector */}
            <div data-testid="size-selector">
              <h3 className="text-md font-semibold mb-3 text-gray-800">Photo Size</h3>
              <div className="space-y-2">
                {SIZE_OPTIONS.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => handleSizeChange(size)}
                    className={`w-full px-4 py-2 text-left rounded-lg border-2 transition-colors ${
                      selectedSize.id === size.id
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-semibold">{size.label}</div>
                    <div className="text-sm text-gray-600">{size.dimensions}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Background Selector */}
            <div data-testid="background-selector">
              <h3 className="text-md font-semibold mb-3 text-gray-800">Background Color</h3>
              <BackgroundSelector
                onColorChange={handleBackgroundChange}
                initialColor={backgroundColor}
              />
            </div>
          </div>

          {/* Download Button */}
          <div className="mt-6 flex justify-center">
            <button
              data-testid="download-button"
              onClick={handleDownload}
              disabled={!imageData || isProcessing}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
            >
              Download ID Photo
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
