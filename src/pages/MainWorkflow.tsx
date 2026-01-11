import { useState, useCallback, useRef, useEffect, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { type SizeOption, SIZE_OPTIONS } from '../components/size/CropEditor'
import { type PaperType } from '../components/layout/PaperTypeSelector'
import { type PaperMargins } from '../types'
import { StepIndicator } from '../components/workflow/StepIndicator'
import { Step1Settings } from '../components/workflow/Step1Settings'
import { Step2Preview } from '../components/workflow/Step2Preview'
import { Step3Layout } from '../components/workflow/Step3Layout'
import { LanguageSelector } from '../components/language/LanguageSelector'
import { usePerformanceMeasure } from '../hooks/usePerformanceMeasure'
import { useModelLoading } from '../hooks/useModelLoading'
import { useImageDownload } from '../hooks/useImageDownload'
import { useWorkflowSteps } from '../hooks/useWorkflowSteps'
import { FileUploadService } from '../services/fileUploadService'
import { ImageProcessingOrchestrator } from '../services/imageProcessingOrchestrator'
import { useToast } from '../components/toast/ToastProvider'

interface ImageData {
  originalFile: File
  originalUrl: string
  transparentCanvas: HTMLCanvasElement
  cropArea: { x: number; y: number; width: number; height: number }
  croppedPreviewUrl: string
  printLayoutPreviewUrl: string
}

export function MainWorkflow() {
  const { t } = useTranslation()
  
  // Helper function to translate error messages (memoized)
  const translateError = useCallback((errorMessage: string): string => {
    // Check for specific error patterns and translate them
    if (errorMessage.includes('No face detected')) {
      return t('faceDetection.noFaceDetected')
    } else if (errorMessage.includes('Multiple faces detected')) {
      return t('faceDetection.multipleFacesDetected')
    }
    // Return original message if no translation found
    return errorMessage
  }, [t])
  
  // Settings state
  const [selectedSize, setSelectedSize] = useState<SizeOption>(SIZE_OPTIONS[0])
  const [backgroundColor, setBackgroundColor] = useState<string>('#0000FF')
  const [paperType, setPaperType] = useState<PaperType>('6-inch')
  
  // Margin state per paper type
  const [margins6Inch, setMargins6Inch] = useState<PaperMargins>({ top: 0, bottom: 0, left: 0, right: 0 })
  const [marginsA4, setMarginsA4] = useState<PaperMargins>({ top: 0, bottom: 0, left: 0, right: 0 })
  
  // Get current margins based on selected paper type
  const currentMargins = paperType === '6-inch' ? margins6Inch : marginsA4
  
  // Image state
  const [imageData, setImageData] = useState<ImageData | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Custom hooks for single responsibilities
  const { showInfo, showSuccess, showWarning, showError } = useToast()
  const { currentStep, nextStep, goToStep } = useWorkflowSteps(1)
  const { start, stop } = usePerformanceMeasure()
  const { u2netModel, faceDetectionModel, isLoadingU2Net } = useModelLoading()
  const { downloadPhoto, downloadLayout } = useImageDownload({
    selectedSize,
    paperType,
    backgroundColor,
    margins: currentMargins,
    onError: (errors: string[]) => {
      errors.forEach((error) => showError(error))
    },
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

  // Show loading toast when models are loading
  useEffect(() => {
    if (isLoadingU2Net) {
      showInfo(t('common.loading'))
    }
  }, [isLoadingU2Net, showInfo, t])

  // Handle file upload (only store file, don't process yet)
  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      // Clear previous state
      setImageData(null)

      // Handle upload with service
      const uploaded = fileUploadService.current.handleUpload(file)
      setUploadedFile(uploaded.file)
      setUploadedImageUrl(uploaded.url)
      showInfo(t('step1.imageUploaded'))
    },
    [showInfo, t]
  )

  // Handle processing (triggered by "Generate Preview" button)
  const handleGeneratePreview = useCallback(
    async () => {
      if (!uploadedFile) return

      // Reset state
      setImageData(null)
      setIsProcessing(true)
      showInfo(t('common.processing'))
      start()

      try {
        // Use orchestrator to process the image
        const result = await imageProcessor.current.processImage({
          file: uploadedFile,
          selectedSize,
          backgroundColor,
          paperType,
          margins: currentMargins,
          u2netModel,
          faceDetectionModel,
          requiredDPI: 300,
        })

        if (result.errors && result.errors.length > 0) {
          result.errors.forEach((e) => showError(translateError(e.message)))
          stop()
          setIsProcessing(false)
          return
        }

        if (result.warnings && result.warnings.length > 0) {
          result.warnings.forEach((warning) => showWarning(warning))
        }

        if (result.result) {
          setImageData(result.result)
          showSuccess(t('step2.processSuccess'))
          // Advance to Step 2
          nextStep()
        }

        stop()
        setIsProcessing(false)
      } catch (error) {
        showError(error instanceof Error ? error.message : 'Processing failed')
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
      currentMargins,
      showInfo,
      showSuccess,
      showWarning,
      showError,
      nextStep,
      translateError,
      t,
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

  const handleMarginsChange = useCallback((margins: PaperMargins) => {
    // Update margins for the current paper type
    if (paperType === '6-inch') {
      setMargins6Inch(margins)
    } else {
      setMarginsA4(margins)
    }
  }, [paperType])

  const handleDownload = async () => {
    await downloadPhoto(imageData?.croppedPreviewUrl || null)
    showSuccess(t('step2.downloadSuccess'))
  }

  const handleBackToSettings = () => {
    // Clear only processed data, preserve uploaded file
    setImageData(null)

    // Return to Step 1 (keeps uploadedFile and uploadedImageUrl)
    goToStep(1)
  }

  const handleDownloadLayout = useCallback(async () => {
    await downloadLayout(imageData?.transparentCanvas || null)
    showSuccess(t('step3.downloadSuccess'))
  }, [imageData, downloadLayout, showSuccess, t])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto py-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img src="/logo.png" alt={t('app.title')} className="h-12 w-auto mr-4" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{t('app.title')}</h1>
              </div>
            </div>
            <LanguageSelector />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-4 px-4 flex-1 w-full flex flex-col" data-testid="main-workflow-container">
        {/* 3-Step Workflow */}
        <div className="max-w-2xl mx-auto w-full">
          <div className="bg-white rounded-lg shadow p-8">
            {/* Step Indicator */}
            <StepIndicator currentStep={currentStep} />
            
            {/* Step 1: Settings & Upload */}
            {currentStep === 1 && (
              <Step1Settings
                selectedSize={selectedSize}
                backgroundColor={backgroundColor}
                paperType={paperType}
                margins={currentMargins}
                uploadedImageUrl={uploadedImageUrl}
                uploadedFile={uploadedFile}
                isProcessing={isProcessing}
                isLoadingU2Net={isLoadingU2Net}
                onSizeChange={handleSizeChange}
                onColorChange={handleBackgroundChange}
                onPaperTypeChange={handlePaperTypeChange}
                onMarginsChange={handleMarginsChange}
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
                onBack={handleBackToSettings}
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
