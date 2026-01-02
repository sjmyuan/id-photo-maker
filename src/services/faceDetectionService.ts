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
  confidence: number
}

export interface FaceDetectionResult {
  faces: FaceBox[]
  faceCrops?: HTMLCanvasElement[]
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
        confidence: 1.0, // MediaPipeFaceDetector doesn't provide confidence scores
      }
    })

    // Scale boxes to square and crop faces
    const scaledBoxes = faces.map((face) =>
      scaleBox([face.x, face.y, face.x + face.width, face.y + face.height])
    )
    const faceCrops = scaledBoxes.map((box) => cropImage(image, box))

    // Update faces with scaled boxes
    const scaledFaces: FaceBox[] = scaledBoxes.map((box, i) => ({
      x: box[0],
      y: box[1],
      width: box[2] - box[0],
      height: box[3] - box[1],
      confidence: faces[i].confidence,
    }))

    // Check for errors
    let error: FaceDetectionResult['error']
    if (scaledFaces.length === 0) {
      error = 'no-face-detected'
    } else if (scaledFaces.length > 1) {
      error = 'multiple-faces-detected'
    }

    return { faces: scaledFaces, faceCrops, error }
  } catch (error) {
    console.error('Face detection failed:', error)
    throw new Error(`Face detection failed: ${error}`)
  }
}

/**
 * Scale a bounding box to a square by expanding the shorter side
 * @param box [x1, y1, x2, y2]
 * @returns [x1, y1, x2, y2] scaled to square
 */
export function scaleBox(box: [number, number, number, number]): [number, number, number, number] {
  const width = box[2] - box[0];
  const height = box[3] - box[1];
  const maximum = Math.max(width, height);
  const dx = Math.floor((maximum - width) / 2);
  const dy = Math.floor((maximum - height) / 2);
  return [
    box[0] - dx,
    box[1] - dy,
    box[2] + dx,
    box[3] + dy,
  ];
}

/**
 * Crop an image to the given box
 * @param image HTMLImageElement
 * @param box [x1, y1, x2, y2]
 * @returns HTMLCanvasElement containing the cropped region
 */
export function cropImage(image: HTMLImageElement, box: [number, number, number, number]): HTMLCanvasElement {
  const [x1, y1, x2, y2] = box;
  const width = x2 - x1;
  const height = y2 - y1;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');
  ctx.drawImage(image, x1, y1, width, height, 0, 0, width, height);
  return canvas;
}
