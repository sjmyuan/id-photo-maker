import { useState, useEffect, useCallback, useRef, type ChangeEvent } from 'react'
import { type SizeOption, SIZE_OPTIONS } from '../components/size/CropEditor'
import { SizeSelector } from '../components/size/SizeSelector'
import { DPISelector } from '../components/size/DPISelector'
import { ColorSelector } from '../components/background/ColorSelector'
import { PaperTypeSelector, type PaperType } from '../components/layout/PaperTypeSelector'
import { PrintLayout } from '../components/layout/PrintLayout'
import { loadFaceDetectionModel, detectFaces, type FaceDetectionModel, type FaceBox } from '../services/faceDetectionService'
import { loadU2NetModel, type U2NetModel } from '../services/u2netService'
import { validateImageFile } from '../services/imageValidation'
import { scaleImageToTarget } from '../services/imageScaling'
import { processWithU2Net, applyBackgroundColor } from '../services/mattingService'
import { generatePrintLayout, generatePrintLayoutPreview, downloadCanvas } from '../services/printLayoutService'
import { usePerformanceMeasure } from '../hooks/usePerformanceMeasure'
import { calculateDPI } from '../utils/dpiCalculation'
import { generateExactCrop } from '../services/exactCropService'
import { embedDPIMetadata } from '../utils/dpiMetadata'

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

interface ImageData {
  originalFile: File
  originalUrl: string
  transparentCanvas: HTMLCanvasElement // Canvas with transparent background (matting result)
  cropArea: CropArea // Crop area from face detection
  croppedPreviewUrl: string // URL of the final cropped preview image with exact pixels
  printLayoutPreviewUrl: string // URL of print layout preview image
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
  // Default values: 1-inch size, 300 DPI, Blue background, 6-inch paper
  const [selectedSize, setSelectedSize] = useState<SizeOption>(SIZE_OPTIONS[0]) // 1-inch
  const [requiredDPI, setRequiredDPI] = useState<300 | null>(300) // 300 DPI or null for "None"
  const [backgroundColor, setBackgroundColor] = useState<string>('#0000FF') // Blue
  const [paperType, setPaperType] = useState<PaperType>('6-inch') // 6-inch paper
  const [imageData, setImageData] = useState<ImageData | null>(null)
  const [u2netModel, setU2netModel] = useState<U2NetModel | null>(null)
  const [isLoadingU2Net, setIsLoadingU2Net] = useState(true)
  const [faceDetectionModel, setFaceDetectionModel] = useState<FaceDetectionModel | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])
  const [errors, setErrors] = useState<string[]>([])
  
  // New states for separated upload/processing flow
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  
  // Ref for hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { start, stop } = usePerformanceMeasure()
  
  // Handler to trigger file input click
  const handleUploadButtonClick = () => {
    fileInputRef.current?.click()
  }

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

  // Handle file upload (only store file, don't process yet)
  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      // Reset state
      setWarnings([])
      setErrors([])
      setImageData(null)
      
      // Store uploaded file and create preview URL
      setUploadedFile(file)
      const imageUrl = URL.createObjectURL(file)
      setUploadedImageUrl(imageUrl)
    },
    []
  )

  // Handle processing (triggered by "Generate Preview" button)
  const handleGeneratePreview = useCallback(
    async () => {
      if (!uploadedFile) return

      // Reset state
      setWarnings([])
      setErrors([])
      setImageData(null)
      setIsProcessing(true)
      start()

      const file = uploadedFile

      try {
        // 1. Validate the file
        const validation = await validateImageFile(uploadedFile)
        
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

        // Use exact crop service to generate output with precise pixel dimensions
        const dpi = requiredDPI || 300 // Use required DPI or default to 300
        const croppedCanvas = await generateExactCrop(
          transparentCanvas,
          initialCropArea!,
          selectedSize.physicalWidth,
          selectedSize.physicalHeight,
          dpi
        )
        
        // Apply background color to the exact-sized canvas
        const croppedWithBgCanvas = document.createElement('canvas')
        croppedWithBgCanvas.width = croppedCanvas.width
        croppedWithBgCanvas.height = croppedCanvas.height
        const croppedWithBgCtx = croppedWithBgCanvas.getContext('2d')
        if (!croppedWithBgCtx) throw new Error('Failed to get canvas context')
        
        croppedWithBgCtx.fillStyle = backgroundColor
        croppedWithBgCtx.fillRect(0, 0, croppedWithBgCanvas.width, croppedWithBgCanvas.height)
        croppedWithBgCtx.drawImage(croppedCanvas, 0, 0)

        const croppedBlob = await new Promise<Blob>((resolve, reject) => {
          croppedWithBgCanvas.toBlob((blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Failed to create cropped blob'))
          }, 'image/png')
        })

        // Create URLs for display
        const originalUrl = URL.createObjectURL(file)
        const croppedPreviewUrl = URL.createObjectURL(croppedBlob)
        
        // Generate print layout preview (scaled-down preview for display)
        // Load cropped image to create preview
        const croppedImg = new Image()
        croppedImg.src = croppedPreviewUrl
        await new Promise<void>((resolve, reject) => {
          croppedImg.onload = () => resolve()
          croppedImg.onerror = reject
        })
        
        const printLayoutPreviewCanvas = generatePrintLayoutPreview(
          croppedImg,
          {
            widthMm: selectedSize.physicalWidth,
            heightMm: selectedSize.physicalHeight,
          },
          paperType
        )
        
        const printLayoutBlob = await new Promise<Blob>((resolve, reject) => {
          printLayoutPreviewCanvas.toBlob((blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Failed to create print layout blob'))
          }, 'image/png')
        })
        
        const printLayoutPreviewUrl = URL.createObjectURL(printLayoutBlob)
        
        // Clean up temporary URL
        URL.revokeObjectURL(transparentUrl)
        
        setImageData({
          originalFile: file,
          originalUrl,
          transparentCanvas,
          cropArea: initialCropArea!,
          croppedPreviewUrl,
          printLayoutPreviewUrl,
        })

        stop()
        setIsProcessing(false)
      } catch (error) {
        setErrors([error instanceof Error ? error.message : 'Processing failed'])
        stop()
        setIsProcessing(false)
      }
    },
    [uploadedFile, start, stop, u2netModel, faceDetectionModel, backgroundColor, selectedSize, requiredDPI, paperType]
  )

  const handleBackgroundChange = useCallback((color: string) => {
    setBackgroundColor(color)
  }, [])

  const handleSizeChange = (size: SizeOption) => {
    setSelectedSize(size)
  }

  const handleDPIChange = (dpi: 300 | null) => {
    setRequiredDPI(dpi)
  }

  const handlePaperTypeChange = (paper: PaperType) => {
    setPaperType(paper)
  }

  const handleDownload = async () => {
    if (!imageData || !imageData.croppedPreviewUrl) return
    
    try {
      // Fetch the cropped preview blob
      const response = await fetch(imageData.croppedPreviewUrl)
      const blob = await response.blob()
      
      // Embed DPI metadata
      const dpi = requiredDPI || 300
      const blobWithDPI = await embedDPIMetadata(blob, dpi)
      
      // Create download link with DPI-embedded image
      const url = URL.createObjectURL(blobWithDPI)
      const link = document.createElement('a')
      link.href = url
      link.download = `id-photo-${selectedSize.id}-${dpi}dpi-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 100)
    } catch (error) {
      console.error('Failed to download image:', error)
      setErrors([error instanceof Error ? error.message : 'Failed to download image'])
    }
  }

  const handleReupload = () => {
    // Clear all state and return to upload view
    setImageData(null)
    setWarnings([])
    setErrors([])
    
    // Clear uploaded file and image URL
    if (uploadedImageUrl) {
      URL.revokeObjectURL(uploadedImageUrl)
    }
    setUploadedFile(null)
    setUploadedImageUrl(null)
  }

  const handleDownloadLayout = useCallback(async () => {
    if (!imageData || !imageData.transparentCanvas) return
    
    try {
      // Apply background color to canvas before generating layout
      const coloredCanvas = applyBackgroundColor(imageData.transparentCanvas, backgroundColor)
      
      // Use the same DPI as the photo (required DPI or default 300)
      const dpi = requiredDPI || 300
      
      // Generate high-resolution print layout with colored canvas
      const layoutCanvas = await generatePrintLayout(
        coloredCanvas,
        {
          widthMm: selectedSize.physicalWidth,
          heightMm: selectedSize.physicalHeight,
        },
        paperType,
        dpi
      )
      
      // Download the layout with DPI metadata
      const filename = `id-photo-layout-${selectedSize.id}-${paperType}-${Date.now()}.png`
      await downloadCanvas(layoutCanvas, filename, 'image/png', dpi)
    } catch (error) {
      console.error('Failed to generate print layout:', error)
    }
  }, [imageData, selectedSize, backgroundColor, paperType, requiredDPI])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto py-4 px-4">
          <h1 className="text-3xl font-bold text-gray-900">ID Photo Maker</h1>
          <p className="text-sm text-gray-600 mt-1">Privacy-first ID photo generator</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-4 px-4 flex-1 w-full flex flex-col" data-testid="main-workflow-container">
        {/* Single Page Workflow */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8">
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
            
            {/* Compact Grid Selector for Size, DPI, Color, and Paper - Hidden after preview */}
            {!imageData && (
              <div data-testid="selector-grid-step1" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <SizeSelector 
                  selectedSize={selectedSize} 
                  onSizeChange={handleSizeChange} 
                  testId="size-selector-step1"
                />
                <DPISelector 
                  requiredDPI={requiredDPI} 
                  onDPIChange={handleDPIChange} 
                  testId="dpi-selector-step1"
                />
                <ColorSelector 
                  backgroundColor={backgroundColor} 
                  onColorChange={handleBackgroundChange} 
                  testId="color-selector-step1"
                />
                <PaperTypeSelector 
                  paperType={paperType} 
                  onPaperTypeChange={handlePaperTypeChange} 
                  testId="paper-type-selector-step1"
                />
              </div>
            )}
            
            {/* Image Placeholder - Hidden after preview */}
            {!imageData && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo Preview
                </label>
                <div 
                  className="w-full h-80 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden"
                  data-testid="image-placeholder"
                >
                  {uploadedImageUrl ? (
                    <img 
                      src={uploadedImageUrl} 
                      alt="Uploaded preview" 
                      className="max-w-full max-h-full object-contain"
                      data-testid="uploaded-image"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm">No image uploaded</p>
                    </div>
                  )}
                </div>
              </div>
            )}

              {/* Print Layout and Download Buttons - shown after preview is generated */}
              {imageData && imageData.croppedPreviewUrl && (
                <>
                  <PrintLayout
                    croppedImageUrl={imageData.croppedPreviewUrl}
                    selectedSize={selectedSize}
                    paperType={paperType}
                    printLayoutPreviewUrl={imageData.printLayoutPreviewUrl}
                  />

                  {/* Download Buttons */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={handleDownload}
                      disabled={isProcessing}
                      data-testid="download-image-button"
                      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                    >
                      Download Image
                    </button>
                    <button
                      onClick={handleDownloadLayout}
                      disabled={isProcessing}
                      data-testid="download-layout-button"
                      className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600"
                    >
                      Download Print Layout
                    </button>
                  </div>
                </>
              )}
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={isProcessing || isLoadingU2Net}
              data-testid="file-input"
              className="hidden"
            />
            
            {/* Upload Image / Generate Preview Button - Only show when no preview */}
            {!imageData && (
              <button
                onClick={uploadedFile ? handleGeneratePreview : handleUploadButtonClick}
                disabled={isProcessing || isLoadingU2Net}
                data-testid="upload-or-preview-button"
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
              >
                {uploadedFile ? 'Generate Preview' : 'Upload Image'}
              </button>
            )}

            {/* Re-upload Button - At the bottom, shown after preview */}
            {imageData && (
              <div className="mt-6 pt-6 border-t">
                <button
                  onClick={handleReupload}
                  disabled={isProcessing}
                  data-testid="reupload-button"
                  className="w-full py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-600"
                >
                  Re-upload Image
                </button>
              </div>
            )}
            
            {/* Processing Indicator */}
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
      </main>
    </div>
  )
}
