import { useState, useEffect, useCallback, type ChangeEvent } from 'react'
import { BackgroundSelector } from '../components/background/BackgroundSelector'
import { CropEditor, type CropArea, type SizeOption, SIZE_OPTIONS } from '../components/size/CropEditor'
import { loadFaceDetectionModel, detectFaces, type FaceDetectionModel, type FaceBox } from '../services/faceDetectionService'
import { loadU2NetModel, type U2NetModel } from '../services/u2netService'
import { validateImageFile } from '../services/imageValidation'
import { scaleImageToTarget } from '../services/imageScaling'
import { processWithU2Net, applyBackgroundColor } from '../services/mattingService'
import { usePerformanceMeasure } from '../hooks/usePerformanceMeasure'
import { calculateDPI } from '../utils/dpiCalculation'

interface ImageData {
  originalFile: File
  originalUrl: string
  transparentBlob: Blob // Transparent matted image
  transparentCanvas: HTMLCanvasElement // Canvas with transparent background
  processedUrl: string // URL with applied background color
}

/**
 * Calculate initial crop area based on detected face
 * Expands to include head and shoulders for professional ID photo framing
 * Always centers on face center, shrinks proportionally if exceeding bounds
 */
function calculateInitialCropArea(
  faceBox: FaceBox,
  aspectRatio: number,
  imageWidth: number,
  imageHeight: number
): CropArea {
  // For ID photos, we need more space:
  // - 150% expansion above the face (for head/hair)
  // - 100% expansion below the face (for shoulders)
  // - 80% expansion on each side (for natural portrait framing)
  
  const faceWidth = faceBox.width
  const faceHeight = faceBox.height
  
  // Calculate face center - this is our anchor point
  const faceCenterX = faceBox.x + faceBox.width / 2
  const faceCenterY = faceBox.y + faceBox.height / 2
  
  // Clamp face center to image bounds (in case face is partially outside)
  const clampedCenterX = Math.max(0, Math.min(faceCenterX, imageWidth))
  const clampedCenterY = Math.max(0, Math.min(faceCenterY, imageHeight))
  
  // Calculate expanded dimensions
  const horizontalExpansion = faceWidth * 0.8
  const verticalExpansionAbove = faceHeight * 1.5
  const verticalExpansionBelow = faceHeight * 1.0
  
  // Calculate target crop dimensions
  const targetWidth = faceWidth + (2 * horizontalExpansion)
  const targetHeight = faceHeight + verticalExpansionAbove + verticalExpansionBelow
  
  // Adjust to match the required aspect ratio
  let cropWidth, cropHeight
  const expandedAspectRatio = targetWidth / targetHeight
  
  if (expandedAspectRatio > aspectRatio) {
    // Expanded area is wider - use width and adjust height
    cropWidth = targetWidth
    cropHeight = cropWidth / aspectRatio
  } else {
    // Expanded area is taller - use height and adjust width
    cropHeight = targetHeight
    cropWidth = cropHeight * aspectRatio
  }
  
  // Calculate initial position centered on face
  let cropX = clampedCenterX - cropWidth / 2
  let cropY = clampedCenterY - cropHeight / 2
  
  // Check if crop area exceeds image bounds
  // If it does, shrink proportionally while maintaining center and aspect ratio
  const exceedsLeft = cropX < 0
  const exceedsRight = cropX + cropWidth > imageWidth
  const exceedsTop = cropY < 0
  const exceedsBottom = cropY + cropHeight > imageHeight
  
  if (exceedsLeft || exceedsRight || exceedsTop || exceedsBottom) {
    // Calculate maximum dimensions that fit within image bounds while centered on face
    const maxWidthFromLeft = clampedCenterX * 2
    const maxWidthFromRight = (imageWidth - clampedCenterX) * 2
    const maxWidthFromCenter = Math.min(maxWidthFromLeft, maxWidthFromRight)
    
    const maxHeightFromTop = clampedCenterY * 2
    const maxHeightFromBottom = (imageHeight - clampedCenterY) * 2
    const maxHeightFromCenter = Math.min(maxHeightFromTop, maxHeightFromBottom)
    
    // Choose the dimension that fits while maintaining aspect ratio
    if (maxWidthFromCenter / aspectRatio <= maxHeightFromCenter) {
      // Width is the limiting factor
      cropWidth = maxWidthFromCenter
      cropHeight = maxWidthFromCenter / aspectRatio
    } else {
      // Height is the limiting factor
      cropHeight = maxHeightFromCenter
      cropWidth = maxHeightFromCenter * aspectRatio
    }
    
    // Recalculate position to maintain center
    cropX = clampedCenterX - cropWidth / 2
    cropY = clampedCenterY - cropHeight / 2
  }
  
  return { x: cropX, y: cropY, width: cropWidth, height: cropHeight }
}

export function MainWorkflow() {
  // Step state: 1 = upload, 2 = edit
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)
  
  // Default values: 1-inch size, 300 DPI, Blue background
  const [selectedSize, setSelectedSize] = useState<SizeOption>(SIZE_OPTIONS[0]) // 1-inch
  const [requiredDPI, setRequiredDPI] = useState<300 | null>(300) // 300 DPI or null for "None"
  const [backgroundColor, setBackgroundColor] = useState<string>('#0000FF') // Blue
  const [imageData, setImageData] = useState<ImageData | null>(null)
  const [u2netModel, setU2netModel] = useState<U2NetModel | null>(null)
  const [isLoadingU2Net, setIsLoadingU2Net] = useState(true)
  const [faceDetectionModel, setFaceDetectionModel] = useState<FaceDetectionModel | null>(null)
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
        const faceModel = await loadFaceDetectionModel()
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

        // 3. Detect face on the scaled image (before U2Net processing)
        // This ensures faceBox coordinates match the processed image dimensions
        let initialCropArea: CropArea | null = null
        if (faceDetectionModel) {
          const img = new Image()
          const imgUrl = URL.createObjectURL(fileToProcess)
          img.src = imgUrl
          
          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
          })
          
          const result = await detectFaces(faceDetectionModel, img)
          const imgWidth = img.naturalWidth
          const imgHeight = img.naturalHeight
          
          // Validate: require exactly one face
          if (result.faces.length === 0) {
            setErrors(['No face detected in the image. Please upload an image with exactly one face.'])
            stop()
            setIsProcessing(false)
            URL.revokeObjectURL(imgUrl)
            return
          } else if (result.faces.length > 1) {
            setErrors(['Multiple faces detected in the image. Please upload an image with exactly one face.'])
            stop()
            setIsProcessing(false)
            URL.revokeObjectURL(imgUrl)
            return
          }
          
          // Exactly one face detected - proceed
          const face = result.faces[0]
          
          // Calculate initial crop area based on face and selected size
          initialCropArea = calculateInitialCropArea(
            face,
            selectedSize.aspectRatio,
            imgWidth,
            imgHeight
          )
          
          // Validate DPI if requirement is set
          if (requiredDPI !== null) {
            const dpiResult = calculateDPI(
              initialCropArea.width,
              initialCropArea.height,
              selectedSize.physicalWidth,
              selectedSize.physicalHeight
            )
            
            if (dpiResult.minDPI < requiredDPI) {
              setErrors([
                `DPI requirement (${requiredDPI} DPI) cannot be met. ` +
                `The calculated DPI is ${Math.round(dpiResult.minDPI)} DPI. ` +
                `Please upload a higher resolution image or select "None" for DPI requirement.`
              ])
              stop()
              setIsProcessing(false)
              URL.revokeObjectURL(imgUrl)
              return
            }
          }
          
          // Store the calculated crop area
          setCropArea(initialCropArea)
          
          // Clean up temporary URL
          URL.revokeObjectURL(imgUrl)
        }

        // 4. Process matting
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

        stop()
        setIsProcessing(false)
        
        // Automatically advance to step 2 after successful processing
        setCurrentStep(2)
      } catch (error) {
        setErrors([error instanceof Error ? error.message : 'Processing failed'])
        stop()
        setIsProcessing(false)
      }
    },
    [start, stop, u2netModel, faceDetectionModel, backgroundColor, selectedSize, requiredDPI]
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
  }

  const handleDPIChange = (dpi: 300 | null) => {
    setRequiredDPI(dpi)
  }

  const handleCropAreaChange = useCallback((newCropArea: CropArea) => {
    setCropArea(newCropArea)
  }, [])

  const handleGoBack = () => {
    // Reset to step 1 and clear image data
    setCurrentStep(1)
    setImageData(null)
    setCropArea(null)
    setWarnings([])
    setErrors([])
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto py-4 px-4">
          <h1 className="text-3xl font-bold text-gray-900">ID Photo Maker</h1>
          <p className="text-sm text-gray-600 mt-1">Privacy-first ID photo generator</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-4 px-4 flex-1 w-full flex flex-col">{/* Step 1: Upload */}
        {currentStep === 1 && (
          <div data-testid="upload-step" className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow p-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Upload Your Photo</h2>
              
              {isLoadingU2Net && (
                <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 text-sm rounded">
                  Loading AI model...
                </div>
              )}
              
              {warnings.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 text-sm rounded">
                  {warnings.map((warning, i) => <div key={i}>{warning}</div>)}
                </div>
              )}
              
              {errors.length > 0 && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 text-sm rounded">
                  {errors.map((error, i) => <div key={i}>{error}</div>)}
                </div>
              )}
              
              {/* Size Selector */}
              <div data-testid="size-selector-step1" className="mb-6">
                <h3 className="text-base font-semibold mb-3 text-gray-800">Photo Size</h3>
                <div className="space-y-2">
                  {SIZE_OPTIONS.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => handleSizeChange(size)}
                      className={`w-full px-3 py-2 text-left rounded-lg border-2 transition-colors ${
                        selectedSize.id === size.id
                          ? 'border-blue-600 bg-blue-50 text-blue-900'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-semibold text-sm">{size.label}</div>
                      <div className="text-xs text-gray-600">{size.dimensions}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* DPI Selector */}
              <div data-testid="dpi-selector-step1" className="mb-6">
                <h3 className="text-base font-semibold mb-3 text-gray-800">DPI Requirement</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleDPIChange(300)}
                    className={`w-full px-3 py-2 text-left rounded-lg border-2 transition-colors ${
                      requiredDPI === 300
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-semibold text-sm">300 DPI</div>
                    <div className="text-xs text-gray-600">Recommended for printing</div>
                  </button>
                  <button
                    onClick={() => handleDPIChange(null)}
                    className={`w-full px-3 py-2 text-left rounded-lg border-2 transition-colors ${
                      requiredDPI === null
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-semibold text-sm">None</div>
                    <div className="text-xs text-gray-600">No DPI requirement</div>
                  </button>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select an image file
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  disabled={isProcessing || isLoadingU2Net}
                  data-testid="file-input"
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed p-2"
                />
              </div>
              
              {isProcessing && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                    <p className="text-sm text-blue-700">Processing your image...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Edit & Download */}
        {currentStep === 2 && imageData && (
          <div data-testid="edit-step" className="flex flex-col h-full">
            {/* Two-column layout with equal heights and aligned */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0 mb-4">
              {/* Left Panel: Background selector */}
              <div data-testid="left-panel" className="lg:col-span-1 flex flex-col gap-4">
                {/* Background Selector */}
                <div data-testid="background-selector" className="bg-white rounded-lg shadow p-4 flex-1 overflow-auto">
                  <h3 className="text-base font-semibold mb-3 text-gray-800">Background Color</h3>
                  <BackgroundSelector
                    onColorChange={handleBackgroundChange}
                    initialColor={backgroundColor}
                  />
                </div>
              </div>

              {/* Right Panel: Processed image with crop */}
              <div className="lg:col-span-2">
                <div data-testid="processed-image-with-crop" className="bg-white rounded-lg shadow p-4 h-full flex flex-col">
                  <h3 className="text-base font-semibold mb-3 text-gray-800">Preview & Adjust</h3>
                  <div className="bg-gray-100 rounded-lg p-3 flex-1 overflow-hidden flex items-center justify-center">
                    <CropEditor
                      processedImageUrl={imageData.processedUrl}
                      initialCropArea={cropArea}
                      onCropAreaChange={handleCropAreaChange}
                      selectedSize={selectedSize}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-center gap-4">
              <button
                data-testid="go-back-button"
                onClick={handleGoBack}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
              >
                ← Go Back
              </button>
              <button
                data-testid="download-button"
                onClick={handleDownload}
                disabled={!imageData || isProcessing}
                className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
              >
                Download ID Photo
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
