/**
 * Face Detection Service
 * Handles UltraFace-320 ONNX model for face detection
 */

import * as ort from 'onnxruntime-web'

export interface FaceDetectionModel {
  session: ort.InferenceSession
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
  error?: 'no-face-detected' | 'multiple-faces-detected'
}

/**
 * Load UltraFace-320 face detection model
 */
export async function loadFaceDetectionModel(modelUrl: string): Promise<FaceDetectionModel> {
  try {
    console.log('Loading face detection model from:', modelUrl)
    
    const session = await ort.InferenceSession.create(modelUrl)
    
    console.log('Face detection model loaded successfully')
    
    return {
      session,
      status: 'loaded',
    }
  } catch (error) {
    console.error('Failed to load face detection model:', error)
    throw new Error(`Failed to load face detection model: ${error}`)
  }
}

/**
 * Preprocess image for UltraFace-320 model
 * Input: 320x240, normalized to [-1, 1] range
 */
function preprocessImage(image: HTMLImageElement): { tensor: ort.Tensor } {
  const targetWidth = 320
  const targetHeight = 240
  
  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }
  
  // Draw image resized to 320x240
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image, 0, 0, targetWidth, targetHeight)
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight)
  const { data } = imageData
  
  // Normalize to [-1, 1] range: (pixel / 127.5) - 1
  const mean = 127.0
  const normalized = new Float32Array(3 * targetWidth * targetHeight)
  
  for (let i = 0; i < targetWidth * targetHeight; i++) {
    const pixelIdx = i * 4
    
    // Normalize to [-1, 1] range and store in CHW format
    normalized[i] = (data[pixelIdx] - mean) / 128.0                              // R channel
    normalized[targetWidth * targetHeight + i] = (data[pixelIdx + 1] - mean) / 128.0  // G channel
    normalized[2 * targetWidth * targetHeight + i] = (data[pixelIdx + 2] - mean) / 128.0  // B channel
  }
  
  // Create tensor with shape [1, 3, 240, 320]
  const tensor = new ort.Tensor('float32', normalized, [1, 3, targetHeight, targetWidth])
  
  return { tensor }
}

/**
 * Calculate area of rectangles
 */
function areaOf(leftTop: number[][], rightBottom: number[][]): number[] {
  const areas: number[] = []
  for (let i = 0; i < leftTop.length; i++) {
    const w = Math.max(0, rightBottom[i][0] - leftTop[i][0])
    const h = Math.max(0, rightBottom[i][1] - leftTop[i][1])
    areas.push(w * h)
  }
  return areas
}

/**
 * Calculate Intersection over Union (IoU)
 */
function iouOf(boxes0: number[][], boxes1: number[][]): number[] {
  const eps = 1e-5
  const ious: number[] = []
  
  for (let i = 0; i < boxes0.length; i++) {
    // Overlap region
    const overlapLeftTop = [
      Math.max(boxes0[i][0], boxes1[i][0]),
      Math.max(boxes0[i][1], boxes1[i][1]),
    ]
    const overlapRightBottom = [
      Math.min(boxes0[i][2], boxes1[i][2]),
      Math.min(boxes0[i][3], boxes1[i][3]),
    ]
    
    const overlapArea = Math.max(0, overlapRightBottom[0] - overlapLeftTop[0]) * 
                       Math.max(0, overlapRightBottom[1] - overlapLeftTop[1])
    
    const area0 = (boxes0[i][2] - boxes0[i][0]) * (boxes0[i][3] - boxes0[i][1])
    const area1 = (boxes1[i][2] - boxes1[i][0]) * (boxes1[i][3] - boxes1[i][1])
    
    ious.push(overlapArea / (area0 + area1 - overlapArea + eps))
  }
  
  return ious
}

/**
 * Hard Non-Maximum Suppression
 */
function hardNMS(
  boxScores: number[][],
  iouThreshold: number,
  topK: number = -1,
  candidateSize: number = 200
): number[][] {
  const scores = boxScores.map(bs => bs[4])
  const boxes = boxScores.map(bs => bs.slice(0, 4))
  
  // Sort by score and take top candidates
  const indices = scores
    .map((score, idx) => ({ score, idx }))
    .sort((a, b) => b.score - a.score)
    .slice(0, candidateSize)
    .map(item => item.idx)
  
  const picked: number[] = []
  
  while (indices.length > 0) {
    const current = indices[indices.length - 1]
    picked.push(current)
    
    if ((topK > 0 && picked.length === topK) || indices.length === 1) {
      break
    }
    
    const currentBox = boxes[current]
    indices.pop()
    
    const restBoxes = indices.map(idx => boxes[idx])
    const ious = restBoxes.map(box => {
      const overlapLeft = Math.max(currentBox[0], box[0])
      const overlapTop = Math.max(currentBox[1], box[1])
      const overlapRight = Math.min(currentBox[2], box[2])
      const overlapBottom = Math.min(currentBox[3], box[3])
      
      const overlapArea = Math.max(0, overlapRight - overlapLeft) * 
                         Math.max(0, overlapBottom - overlapTop)
      
      const currentArea = (currentBox[2] - currentBox[0]) * (currentBox[3] - currentBox[1])
      const boxArea = (box[2] - box[0]) * (box[3] - box[1])
      
      return overlapArea / (currentArea + boxArea - overlapArea + 1e-5)
    })
    
    // Keep only boxes with IoU <= threshold
    const newIndices: number[] = []
    for (let i = 0; i < indices.length; i++) {
      if (ious[i] <= iouThreshold) {
        newIndices.push(indices[i])
      }
    }
    indices.length = 0
    indices.push(...newIndices)
  }
  
  return picked.map(idx => boxScores[idx])
}

/**
 * Predict faces from model output
 */
function predict(
  width: number,
  height: number,
  confidences: Float32Array,
  boxes: Float32Array,
  confDims: number[],
  boxDims: number[],
  probThreshold: number,
  iouThreshold: number = 0.5,
  topK: number = -1
): { boxes: number[][]; labels: number[]; probs: number[] } {
  const numDetections = confDims[2]
  const numClasses = confDims[1]
  
  const pickedBoxProbs: number[][] = []
  const pickedLabels: number[] = []
  
  // Process each class (skip background class 0)
  for (let classIndex = 1; classIndex < numClasses; classIndex++) {
    const probs: number[] = []
    const probIndices: number[] = []
    
    // Extract probabilities for this class
    for (let i = 0; i < numDetections; i++) {
      const prob = confidences[classIndex * numDetections + i]
      if (prob > probThreshold) {
        probs.push(prob)
        probIndices.push(i)
      }
    }
    
    if (probs.length === 0) {
      continue
    }
    
    // Get corresponding boxes
    const subsetBoxes: number[][] = []
    for (const idx of probIndices) {
      subsetBoxes.push([
        boxes[0 * numDetections + idx],
        boxes[1 * numDetections + idx],
        boxes[2 * numDetections + idx],
        boxes[3 * numDetections + idx],
      ])
    }
    
    // Combine boxes with probabilities
    const boxProbs: number[][] = subsetBoxes.map((box, i) => [...box, probs[i]])
    
    // Apply NMS
    const nmsResults = hardNMS(boxProbs, iouThreshold, topK)
    
    pickedBoxProbs.push(...nmsResults)
    pickedLabels.push(...Array(nmsResults.length).fill(classIndex))
  }
  
  if (pickedBoxProbs.length === 0) {
    return { boxes: [], labels: [], probs: [] }
  }
  
  // Scale boxes to original image dimensions
  const scaledBoxes = pickedBoxProbs.map(bp => [
    bp[0] * width,
    bp[1] * height,
    bp[2] * width,
    bp[3] * height,
  ])
  
  const resultProbs = pickedBoxProbs.map(bp => bp[4])
  
  return {
    boxes: scaledBoxes,
    labels: pickedLabels,
    probs: resultProbs,
  }
}

/**
 * Detect faces in an image
 */
export async function detectFaces(
  model: FaceDetectionModel,
  image: HTMLImageElement,
  threshold: number = 0.7
): Promise<FaceDetectionResult> {
  try {
    // Preprocess image
    const { tensor } = preprocessImage(image)
    
    // Run inference
    const inputName = model.session.inputNames[0]
    const results = await model.session.run({ [inputName]: tensor })
    
    // Get output tensors (scores and boxes)
    const scoresOutput = results[model.session.outputNames[0]]
    const boxesOutput = results[model.session.outputNames[1]]
    
    const scores = scoresOutput.data as Float32Array
    const boxes = boxesOutput.data as Float32Array
    const scoresDims = scoresOutput.dims as number[]
    const boxesDims = boxesOutput.dims as number[]
    
    // Predict faces
    const { boxes: detectedBoxes, labels, probs } = predict(
      image.width,
      image.height,
      scores,
      boxes,
      scoresDims,
      boxesDims,
      threshold
    )
    
    // Convert to FaceBox format
    const faces: FaceBox[] = detectedBoxes.map((box, i) => ({
      x: Math.round(box[0]),
      y: Math.round(box[1]),
      width: Math.round(box[2] - box[0]),
      height: Math.round(box[3] - box[1]),
      confidence: probs[i],
    }))
    
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
