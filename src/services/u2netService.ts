/**
 * U2Net ONNX Model Service
 * Handles loading and running U2Net model with onnxruntime-web
 */

import * as ort from 'onnxruntime-web'

// Configure onnxruntime-web to use the correct WASM path
//ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/'

export interface U2NetModel {
  session: ort.InferenceSession
  status: 'loaded' | 'error'
}

/**
 * Load U2Net ONNX model from URL
 */
export async function loadU2NetModel(modelUrl: string): Promise<U2NetModel> {
  try {
    console.log('Loading U2Net model from:', modelUrl)
    
    // Create inference session
    const session = await ort.InferenceSession.create(modelUrl)
    
    console.log('Model loaded successfully')
    
    return {
      session,
      status: 'loaded',
    }
  } catch (error) {
    console.error('Failed to load model:', error)
    throw new Error(`Failed to load U2Net model: ${error}`)
  }
}

/**
 * Preprocess image for U2Net model
 * Normalizes using ImageNet mean and std values
 */
function preprocessImage(image: HTMLImageElement): { tensor: ort.Tensor; originalWidth: number; originalHeight: number } {
  const targetSize = 320
  const canvas = document.createElement('canvas')
  canvas.width = targetSize
  canvas.height = targetSize
  
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }
  
  // Draw image resized to 320x320 using high-quality interpolation
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image, 0, 0, targetSize, targetSize)
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, targetSize, targetSize)
  const { data } = imageData
  
  // ImageNet normalization values
  const mean = [0.485, 0.456, 0.406]
  const std = [0.229, 0.224, 0.225]
  
  // Find max value for initial normalization
  let maxVal = 0
  for (let i = 0; i < data.length; i += 4) {
    maxVal = Math.max(maxVal, data[i], data[i + 1], data[i + 2])
  }
  maxVal = Math.max(maxVal, 1e-6) // Avoid division by zero
  
  // Normalize: (pixel / maxVal - mean) / std for each channel
  const normalized = new Float32Array(3 * targetSize * targetSize)
  
  for (let i = 0; i < targetSize * targetSize; i++) {
    const pixelIdx = i * 4
    
    // Normalize to [0, 1] first
    const r = data[pixelIdx] / maxVal
    const g = data[pixelIdx + 1] / maxVal
    const b = data[pixelIdx + 2] / maxVal
    
    // Apply mean and std normalization for each channel
    // Store in CHW format: [C, H, W]
    normalized[i] = (r - mean[0]) / std[0]                           // R channel
    normalized[targetSize * targetSize + i] = (g - mean[1]) / std[1]  // G channel
    normalized[2 * targetSize * targetSize + i] = (b - mean[2]) / std[2]  // B channel
  }
  
  // Create tensor with shape [1, 3, 320, 320]
  const tensor = new ort.Tensor('float32', normalized, [1, 3, targetSize, targetSize])
  
  return {
    tensor,
    originalWidth: image.width,
    originalHeight: image.height,
  }
}

/**
 * Postprocess U2Net output to create transparent background image
 */
function postprocessOutput(
  mask: Float32Array,
  originalImage: HTMLImageElement,
  maskWidth: number,
  maskHeight: number
): Promise<Blob> {
  // Create canvas for output
  const canvas = document.createElement('canvas')
  canvas.width = originalImage.width
  canvas.height = originalImage.height
  
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }
  
  // Draw original image
  ctx.drawImage(originalImage, 0, 0)
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const pixels = imageData.data
  
  // Create temporary canvas for mask
  const maskCanvas = document.createElement('canvas')
  maskCanvas.width = maskWidth
  maskCanvas.height = maskHeight
  const maskCtx = maskCanvas.getContext('2d')
  if (!maskCtx) {
    throw new Error('Failed to get mask canvas context')
  }
  
  // Draw mask
  const maskImageData = maskCtx.createImageData(maskWidth, maskHeight)
  for (let i = 0; i < mask.length; i++) {
    const value = Math.max(0, Math.min(255, mask[i] * 255))
    maskImageData.data[i * 4] = value
    maskImageData.data[i * 4 + 1] = value
    maskImageData.data[i * 4 + 2] = value
    maskImageData.data[i * 4 + 3] = 255
  }
  maskCtx.putImageData(maskImageData, 0, 0)
  
  // Scale mask to match original image size
  const scaledMaskCanvas = document.createElement('canvas')
  scaledMaskCanvas.width = originalImage.width
  scaledMaskCanvas.height = originalImage.height
  const scaledMaskCtx = scaledMaskCanvas.getContext('2d')
  if (!scaledMaskCtx) {
    throw new Error('Failed to get scaled mask canvas context')
  }
  scaledMaskCtx.drawImage(maskCanvas, 0, 0, originalImage.width, originalImage.height)
  
  const scaledMaskData = scaledMaskCtx.getImageData(0, 0, originalImage.width, originalImage.height)
  
  // Apply mask to original image (set alpha channel)
  for (let i = 0; i < pixels.length; i += 4) {
    const maskValue = scaledMaskData.data[i] / 255.0
    pixels[i + 3] = Math.round(maskValue * 255) // Set alpha channel
  }
  
  // Put modified image data back
  ctx.putImageData(imageData, 0, 0)
  
  // Convert canvas to blob
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Failed to create blob from canvas'))
      }
    }, 'image/png')
  })
}

/**
 * Process image with U2Net model to remove background
 */
export async function processImageWithU2Net(
  model: U2NetModel,
  image: HTMLImageElement
): Promise<Blob> {
  try {
    console.log('Processing image with U2Net...')
    
    // Preprocess image
const { tensor } = preprocessImage(image)
    console.log('Image preprocessed, tensor shape:', tensor.dims)
    
    // Run inference - use the actual input name from the model
    const inputName = model.session.inputNames[0]
    const feeds: Record<string, ort.Tensor> = { [inputName]: tensor }
    const results = await model.session.run(feeds)
    console.log('Inference completed')
    
    // Get output tensor (U2Net has multiple outputs, we use the first one)
    const outputName = model.session.outputNames[0]
    const outputTensor = results[outputName]
    
    // Extract mask data
    const maskData = outputTensor.data as Float32Array
    const [, , maskHeight, maskWidth] = outputTensor.dims
    
    console.log('Output shape:', outputTensor.dims)
    console.log('Processing output...')
    
    // Postprocess to create final image with transparent background
    const result = await postprocessOutput(maskData, image, maskWidth as number, maskHeight as number)
    
    console.log('Processing complete')
    return result
  } catch (error) {
    console.error('Failed to process image:', error)
    throw new Error(`Failed to process image: ${error}`)
  }
}
