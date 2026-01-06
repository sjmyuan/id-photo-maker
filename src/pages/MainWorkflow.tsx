import { useState, useCallback, useRef, useEffect, type ChangeEvent } from 'react'
import { type SizeOption, SIZE_OPTIONS } from '../components/size/CropEditor'
import { type PaperType } from '../components/layout/PaperTypeSelector'
import { StepIndicator } from '../components/workflow/StepIndicator'
import { Step1Settings } from '../components/workflow/Step1Settings'
import { Step2Preview } from '../components/workflow/Step2Preview'
import { Step3Layout } from '../components/workflow/Step3Layout'
import { usePerformanceMeasure } from '../hooks/usePerformanceMeasure'
import { useModelLoading } from '../hooks/useModelLoading'
import { useImageDownload } from '../hooks/useImageDownload'
import { useNotificationState } from '../hooks/useNotificationState'
import { useWorkflowSteps } from '../hooks/useWorkflowSteps'
import { FileUploadService } from '../services/fileUploadService'
import { ImageProcessingOrchestrator } from '../services/imageProcessingOrchestrator'

interface ImageData {
  originalFile: File
  originalUrl: string
  transparentCanvas: HTMLCanvasElement
  cropArea: { x: number; y: number; width: number; height: number }
  croppedPreviewUrl: string
  printLayoutPreviewUrl: string
}

export function MainWorkflow() {
  // Settings state
  const [selectedSize, setSelectedSize] = useState<SizeOption>(SIZE_OPTIONS[0])
  const [backgroundColor, setBackgroundColor] = useState<string>('#0000FF')
  const [paperType, setPaperType] = useState<PaperType>('6-inch')
  
  // Image state
  const [imageData, setImageData] = useState<ImageData | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Custom hooks for single responsibilities
  const { errors, warnings, setErrors, setWarnings, clearNotifications } = useNotificationState()
  const { currentStep, nextStep, resetToFirstStep, goToStep } = useWorkflowSteps(1)
  const { start, stop } = usePerformanceMeasure()
  const { u2netModel, faceDetectionModel, isLoadingU2Net } = useModelLoading()
  const { downloadPhoto, downloadLayout } = useImageDownload({
    selectedSize,
    paperType,
    backgroundColor,
    onError: setErrors,
  })
  
  // Services (using refs to maintain instance across renders)
  const fileUploadService = useRef(new FileUploadService())
  const imageProcessor = useRef(new ImageProcessingOrchestrator())

  // Cleanup URLs on unmount
  useEffect(() => {
    const service = fileUploadService.current
    return () => {
      service.cleanup()
    }
  }, [])

  // Handle file upload (only store file, don't process yet)
  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      // Clear previous state
      clearNotifications()
      setImageData(null)

      // Handle upload with service
      const uploaded = fileUploadService.current.handleUpload(file)
      setUploadedFile(uploaded.file)
      setUploadedImageUrl(uploaded.url)
    },
    [clearNotifications]
  )

  // Handle processing (triggered by "Generate Preview" button)
  const handleGeneratePreview = useCallback(
    async () => {
      if (!uploadedFile) return

      // Reset state
      clearNotifications()
      setImageData(null)
      setIsProcessing(true)
      start()

      try {
        // Use orchestrator to process the image
        const result = await imageProcessor.current.processImage({
          file: uploadedFile,
          selectedSize,
          backgroundColor,
          paperType,
          u2netModel,
          faceDetectionModel,
          requiredDPI: 300,
        })

        if (result.errors && result.errors.length > 0) {
          setErrors(result.errors.map((e) => e.message))
          stop()
          setIsProcessing(false)
          return
        }

        if (result.warnings && result.warnings.length > 0) {
          setWarnings(result.warnings)
        }

        if (result.result) {
          setImageData(result.result)
          // Advance to Step 2
          nextStep()
        }

        stop()
        setIsProcessing(false)
      } catch (error) {
        setErrors([error instanceof Error ? error.message : 'Processing failed'])
        stop()
        setIsProcessing(false)
      }
    },
    [
      uploadedFile,
      start,
      stop,
      u2netModel,
      faceDetectionModel,
      backgroundColor,
      selectedSize,
      paperType,
      clearNotifications,
      setErrors,
      setWarnings,
      nextStep,
    ]
  )

  const handleBackgroundChange = useCallback((color: string) => {
    setBackgroundColor(color)
  }, [])

  const handleSizeChange = (size: SizeOption) => {
    setSelectedSize(size)
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
    clearNotifications()

    // Clear uploaded file and revoke URL
    if (uploadedImageUrl) {
      fileUploadService.current.revokeUrl(uploadedImageUrl)
    }
    setUploadedFile(null)
    setUploadedImageUrl(null)

    // Reset to Step 1
    resetToFirstStep()
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
                backgroundColor={backgroundColor}
                paperType={paperType}
                uploadedImageUrl={uploadedImageUrl}
                uploadedFile={uploadedFile}
                isProcessing={isProcessing}
                isLoadingU2Net={isLoadingU2Net}
                onSizeChange={handleSizeChange}
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
                onNext={() => nextStep()}
                onBack={() => { resetToFirstStep(); handleReupload(); }}
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
                onBack={() => goToStep(2)}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
