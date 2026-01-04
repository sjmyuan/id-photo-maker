import { useState, useCallback, type ChangeEvent } from 'react'
import { type SizeOption, SIZE_OPTIONS } from '../components/size/CropEditor'
import { type PaperType } from '../components/layout/PaperTypeSelector'
import { StepIndicator } from '../components/workflow/StepIndicator'
import { Step1Settings } from '../components/workflow/Step1Settings'
import { Step2Preview } from '../components/workflow/Step2Preview'
import { Step3Layout } from '../components/workflow/Step3Layout'
import { detectFaces } from '../services/faceDetectionService'
import { validateImageFile } from '../services/imageValidation'
import { scaleImageToTarget } from '../services/imageScaling'
import { processWithU2Net } from '../services/mattingService'
import { generatePrintLayoutPreview } from '../services/printLayoutService'
import { usePerformanceMeasure } from '../hooks/usePerformanceMeasure'
import { useModelLoading } from '../hooks/useModelLoading'
import { useImageDownload } from '../hooks/useImageDownload'
import { calculateDPI } from '../utils/dpiCalculation'
import { generateExactCrop } from '../services/exactCropService'
import { calculateInitialCropArea, type CropArea } from '../utils/cropAreaCalculation'

interface ImageData {
  originalFile: File
  originalUrl: string
  transparentCanvas: HTMLCanvasElement // Canvas with transparent background (matting result)
  cropArea: CropArea // Crop area from face detection
  croppedPreviewUrl: string // URL of the final cropped preview image with exact pixels
  printLayoutPreviewUrl: string // URL of print layout preview image
}

export function MainWorkflow() {
  // Default values: 1-inch size, 300 DPI, Blue background, 6-inch paper
  const [selectedSize, setSelectedSize] = useState<SizeOption>(SIZE_OPTIONS[0]) // 1-inch
  const [requiredDPI, setRequiredDPI] = useState<300 | null>(300) // 300 DPI or null for "None"
  const [backgroundColor, setBackgroundColor] = useState<string>('#0000FF') // Blue
  const [paperType, setPaperType] = useState<PaperType>('6-inch') // 6-inch paper
  const [imageData, setImageData] = useState<ImageData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])
  const [errors, setErrors] = useState<string[]>([])
  
  // 3-Step workflow state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  
  // New states for separated upload/processing flow
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)

  const { start, stop } = usePerformanceMeasure()
  
  // Load AI models using custom hook
  const { u2netModel, faceDetectionModel, isLoadingU2Net } = useModelLoading()

  // Download functionality hook
  const { downloadPhoto, downloadLayout } = useImageDownload({
    selectedSize,
    requiredDPI,
    paperType,
    backgroundColor,
    onError: (errors) => setErrors(errors),
  })

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

        // Advance to Step 2
        setCurrentStep(2)
        
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
    await downloadPhoto(imageData?.croppedPreviewUrl || null)
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
    
    // Reset to Step 1
    setCurrentStep(1)
  }

  const handleDownloadLayout = useCallback(async () => {
    await downloadLayout(imageData?.transparentCanvas || null)
  }, [imageData, downloadLayout])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto py-4 px-4">
          <h1 className="text-3xl font-bold text-gray-900">ID Photo Maker</h1>
          <p className="text-sm text-gray-600 mt-1">Privacy-first ID photo generator</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-4 px-4 flex-1 w-full flex flex-col" data-testid="main-workflow-container">
        {/* 3-Step Workflow */}
        <div className="max-w-2xl mx-auto w-full">
          <div className="bg-white rounded-lg shadow p-8">
            {/* Step Indicator */}
            <StepIndicator currentStep={currentStep} />
            
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
            
            {/* Step 1: Settings & Upload */}
            {currentStep === 1 && (
              <Step1Settings
                selectedSize={selectedSize}
                requiredDPI={requiredDPI}
                backgroundColor={backgroundColor}
                paperType={paperType}
                uploadedImageUrl={uploadedImageUrl}
                uploadedFile={uploadedFile}
                isProcessing={isProcessing}
                isLoadingU2Net={isLoadingU2Net}
                onSizeChange={handleSizeChange}
                onDPIChange={handleDPIChange}
                onColorChange={handleBackgroundChange}
                onPaperTypeChange={handlePaperTypeChange}
                onFileChange={handleFileChange}
                onGeneratePreview={handleGeneratePreview}
              />
            )}
            
            {/* Step 2: ID Photo Preview */}
            {currentStep === 2 && imageData && (
              <Step2Preview
                croppedPreviewUrl={imageData.croppedPreviewUrl}
                isProcessing={isProcessing}
                onDownload={handleDownload}
                onNext={() => setCurrentStep(3)}
                onBack={() => { setCurrentStep(1); handleReupload(); }}
              />
            )}
            
            {/* Step 3: Print Layout Preview */}
            {currentStep === 3 && imageData && (
              <Step3Layout
                printLayoutPreviewUrl={imageData.printLayoutPreviewUrl}
                croppedPreviewUrl={imageData.croppedPreviewUrl}
                paperType={paperType}
                selectedSize={selectedSize}
                isProcessing={isProcessing}
                onDownloadLayout={handleDownloadLayout}
                onBack={() => setCurrentStep(2)}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
