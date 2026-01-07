/**
 * Face Detection Service
 * Handles TensorFlow.js face-detection for face detection
 */

import * as faceDetection from '@tensorflow-models/face-detection'
import '@tensorflow/tfjs-core'
import '@tensorflow/tfjs-backend-webgl'

export interface FaceDetectionModel {
  detector: faceDetection.FaceDetector
  status: 'loaded' | 'error'
}

export interface FaceBox {
  x: number
  y: number
  width: number
  height: number
}

export interface FaceDetectionResult {
  faces: FaceBox[]
  error?: 'no-face-detected' | 'multiple-faces-detected'
}

/**
 * Load TensorFlow.js face detection model
 */
export async function loadFaceDetectionModel(): Promise<FaceDetectionModel> {
  try {
    console.log('Loading TensorFlow.js face detection model')
    
    const detector = await faceDetection.createDetector(
      faceDetection.SupportedModels.MediaPipeFaceDetector,
      {
        runtime: 'tfjs',
      }
    )
    
    console.log('Face detection model loaded successfully')
    
    return {
      detector,
      status: 'loaded',
    }
  } catch (error) {
    console.error('Failed to load face detection model:', error)
    throw new Error(`Failed to load face detection model: ${error}`)
  }
}

/**
 * Detect faces in an image
 */
export async function detectFaces(
  model: FaceDetectionModel,
  image: HTMLImageElement,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _threshold: number = 0.7
): Promise<FaceDetectionResult> {
  try {
    // Run face detection
    const predictions = await model.detector.estimateFaces(image)

    // Convert to FaceBox format
    const faces: FaceBox[] = predictions.map((prediction) => {
      const box = prediction.box
      return {
        x: Math.round(box.xMin),
        y: Math.round(box.yMin),
        width: Math.round(box.width),
        height: Math.round(box.height),
      }
    })

    // Check for errors
    let error: FaceDetectionResult['error']
    if (faces.length === 0) {
      error = 'no-face-detected'
    } else if (faces.length > 1) {
      error = 'multiple-faces-detected'
    }

    return { faces, error }
  } catch (error) {
    console.error('Face detection failed:', error)
    throw new Error(`Face detection failed: ${error}`)
  }
}


