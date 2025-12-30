import { useState } from 'react'
import { ImageUpload } from '../components/upload/ImageUpload'
import { BackgroundSelector } from '../components/background/BackgroundSelector'
import { MattingPreview } from '../components/preview/MattingPreview'

type WorkflowStep = 'upload' | 'background' | 'preview' | 'size-selection'

interface ImageData {
  originalFile: File
  originalUrl: string
  processedBlob: Blob
  processedUrl: string
}

export function MainWorkflow() {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload')
  const [imageData, setImageData] = useState<ImageData | null>(null)
  const [backgroundColor, setBackgroundColor] = useState<string>('#FFFFFF')

  const handleImageProcessed = (originalFile: File, processedBlob: Blob) => {
    // Create URLs for display
    const originalUrl = URL.createObjectURL(originalFile)
    const processedUrl = URL.createObjectURL(processedBlob)
    
    setImageData({
      originalFile,
      originalUrl,
      processedBlob,
      processedUrl,
    })
    setCurrentStep('background')
  }

  const handleBackgroundSelected = (color: string) => {
    setBackgroundColor(color)
  }

  const handleContinueToPreview = () => {
    setCurrentStep('preview')
  }

  const handleReprocess = () => {
    // Clean up URLs
    if (imageData) {
      URL.revokeObjectURL(imageData.originalUrl)
      URL.revokeObjectURL(imageData.processedUrl)
    }
    setImageData(null)
    setCurrentStep('upload')
  }

  const handleContinueToSize = () => {
    setCurrentStep('size-selection')
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
        {/* Step indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <StepIndicator step={1} label="Upload" active={currentStep === 'upload'} />
            <div className="w-16 h-0.5 bg-gray-300" />
            <StepIndicator step={2} label="Background" active={currentStep === 'background'} />
            <div className="w-16 h-0.5 bg-gray-300" />
            <StepIndicator step={3} label="Preview" active={currentStep === 'preview'} />
            <div className="w-16 h-0.5 bg-gray-300" />
            <StepIndicator step={4} label="Size" active={currentStep === 'size-selection'} />
          </div>
        </div>

        {/* Render current step */}
        {currentStep === 'upload' && (
          <ImageUpload onImageProcessed={handleImageProcessed} />
        )}

        {currentStep === 'background' && imageData && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Background Color</h2>
            <BackgroundSelector
              onColorChange={handleBackgroundSelected}
              initialColor={backgroundColor}
            />
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleContinueToPreview}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Continue to Preview
              </button>
            </div>
          </div>
        )}

        {currentStep === 'preview' && imageData && (
          <MattingPreview
            originalImage={imageData.originalUrl}
            processedImage={imageData.processedUrl}
            onReprocess={handleReprocess}
            onContinue={handleContinueToSize}
          />
        )}

        {currentStep === 'size-selection' && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Size Selection</h2>
            <p className="text-gray-600">Size selection feature coming soon...</p>
          </div>
        )}
      </main>
    </div>
  )
}

interface StepIndicatorProps {
  step: number
  label: string
  active: boolean
}

function StepIndicator({ step, label, active }: StepIndicatorProps) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
          active
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-600'
        }`}
      >
        {step}
      </div>
      <span className={`text-xs mt-1 ${active ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  )
}
