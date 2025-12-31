import { useState, useEffect } from 'react'
import { ImageUpload } from '../components/upload/ImageUpload'
import { BackgroundSelector } from '../components/background/BackgroundSelector'
import { MattingPreview } from '../components/preview/MattingPreview'
import { SizeSelection, type CropArea } from '../components/size/SizeSelection'
import { loadFaceDetectionModel, detectFaces, type FaceDetectionModel, type FaceBox } from '../services/faceDetectionService'
import { loadU2NetModel, type U2NetModel } from '../services/u2netService'

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
  const [u2netModel, setU2netModel] = useState<U2NetModel | null>(null)
  const [isLoadingU2Net, setIsLoadingU2Net] = useState(true)
  const [faceDetectionModel, setFaceDetectionModel] = useState<FaceDetectionModel | null>(null)
  const [detectedFace, setDetectedFace] = useState<FaceBox | null>(null)
  const [faceDetectionError, setFaceDetectionError] = useState<'no-face-detected' | 'multiple-faces-detected' | undefined>()
  const [cropArea, setCropArea] = useState<CropArea | null>(null)
  const [isDetectingFace, setIsDetectingFace] = useState(false)

  // Load models on mount
  useEffect(() => {
    const loadModels = async () => {
      // Load U2Net model
      try {
        // Get model selection from localStorage, default to u2netp (lite version)
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
    setDetectedFace(null)
    setFaceDetectionError(undefined)
    setCropArea(null)
    setCurrentStep('upload')
  }

  const handleContinueToSize = async () => {
    // Run face detection before going to size selection
    if (!imageData || !faceDetectionModel) {
      setCurrentStep('size-selection')
      return
    }

    setIsDetectingFace(true)
    
    try {
      // Load the processed image
      const img = new Image()
      img.src = imageData.processedUrl
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })
      
      // Detect faces
      const result = await detectFaces(faceDetectionModel, img)
      
      if (result.error) {
        setFaceDetectionError(result.error)
        setDetectedFace(result.faces[0] || null)
      } else if (result.faces.length === 1) {
        setDetectedFace(result.faces[0])
        setFaceDetectionError(undefined)
      }
      
      setCurrentStep('size-selection')
    } catch (error) {
      console.error('Face detection failed:', error)
      // Proceed anyway, user can manually adjust
      setFaceDetectionError('no-face-detected')
      setCurrentStep('size-selection')
    } finally {
      setIsDetectingFace(false)
    }
  }

  const handleCropAreaChange = (newCropArea: CropArea) => {
    setCropArea(newCropArea)
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
          <div>
            {isLoadingU2Net && (
              <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
                <p>Loading AI model...</p>
              </div>
            )}
            <ImageUpload onImageProcessed={handleImageProcessed} u2netModel={u2netModel} />
          </div>
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

        {currentStep === 'size-selection' && imageData && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Size and Adjust Crop</h2>
            {isDetectingFace && (
              <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
                <p>Detecting face...</p>
              </div>
            )}
            <SizeSelection
              processedImageUrl={imageData.processedUrl}
              faceBox={detectedFace}
              error={faceDetectionError}
              onCropAreaChange={handleCropAreaChange}
            />
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => alert('Download functionality coming soon!')}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
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
