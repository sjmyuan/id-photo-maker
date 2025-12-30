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
 * U2Net expects 320x320 RGB image normalized to [-1, 1]
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
  
  // Draw image resized to 320x320
  ctx.drawImage(image, 0, 0, targetSize, targetSize)
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, targetSize, targetSize)
  const { data } = imageData
  
  // Convert to RGB and normalize to [-1, 1]
  const red = []
  const green = []
  const blue = []
  
  for (let i = 0; i < data.length; i += 4) {
    red.push(data[i] / 255.0)
    green.push(data[i + 1] / 255.0)
    blue.push(data[i + 2] / 255.0)
  }
  
  // Concatenate channels: [R, G, B]
  const inputArray = Float32Array.from([...red, ...green, ...blue])
  
  // Create tensor with shape [1, 3, 320, 320]
  const tensor = new ort.Tensor('float32', inputArray, [1, 3, targetSize, targetSize])
  
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
    
    // Run inference
    const feeds: Record<string, ort.Tensor> = { input: tensor }
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
