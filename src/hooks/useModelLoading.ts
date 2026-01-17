import { useState, useEffect } from 'react'
import { loadFaceDetectionModel, type FaceDetectionModel } from '../services/faceDetectionService'
import { loadU2NetModel, type U2NetModel } from '../services/u2netService'

interface UseModelLoadingReturn {
  u2netModel: U2NetModel | null
  faceDetectionModel: FaceDetectionModel | null
  isLoadingU2Net: boolean
  isLoadingFaceDetection: boolean
  modelsLoaded: boolean
}

/**
 * Custom hook to handle loading of AI models (U2Net and Face Detection)
 * Loads models on mount and manages loading states
 */
export function useModelLoading(): UseModelLoadingReturn {
  const [u2netModel, setU2netModel] = useState<U2NetModel | null>(null)
  const [faceDetectionModel, setFaceDetectionModel] = useState<FaceDetectionModel | null>(null)
  const [isLoadingU2Net, setIsLoadingU2Net] = useState(true)
  const [isLoadingFaceDetection, setIsLoadingFaceDetection] = useState(true)
  const [modelsLoaded, setModelsLoaded] = useState(false)

  useEffect(() => {
    const loadModels = async () => {
      let u2netSuccess = false
      let faceDetectionSuccess = false

      // Load U2Net model
      try {
        const selectedModel = localStorage.getItem('selectedU2NetModel') || 'u2netp'
        const modelUrl = `/${selectedModel}.onnx`
        
        setIsLoadingU2Net(true)
        const model = await loadU2NetModel(modelUrl)
        setU2netModel(model)
        u2netSuccess = true
      } catch (error) {
        console.error('Failed to load U2Net model:', error)
      } finally {
        setIsLoadingU2Net(false)
      }

      // Load face detection model
      try {
        setIsLoadingFaceDetection(true)
        const faceModel = await loadFaceDetectionModel()
        setFaceDetectionModel(faceModel)
        faceDetectionSuccess = true
      } catch (error) {
        console.error('Failed to load face detection model:', error)
      } finally {
        setIsLoadingFaceDetection(false)
      }

      // Set modelsLoaded to true only if both models loaded successfully
      if (u2netSuccess && faceDetectionSuccess) {
        setModelsLoaded(true)
      }
    }
    
    loadModels()
  }, [])

  return {
    u2netModel,
    faceDetectionModel,
    isLoadingU2Net,
    isLoadingFaceDetection,
    modelsLoaded,
  }
}
