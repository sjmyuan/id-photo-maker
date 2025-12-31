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
 * Follows the Python implementation:
 * 1. Normalize prediction to [0, 1] using min-max normalization
 * 2. Convert to uint8 mask (multiply by 255)
 * 3. Resize to original image size using high-quality interpolation
 * 4. Create cutout by compositing original image with empty image using mask
 */
function postprocessOutput(
  mask: Float32Array,
  originalImage: HTMLImageElement,
  maskWidth: number,
  maskHeight: number
): Promise<Blob> {
  // Step 1: Normalize prediction to [0, 1] using min-max normalization
  // pred = (pred - mi) / (ma - mi)
  let minVal = Infinity
  let maxVal = -Infinity
  
  for (let i = 0; i < mask.length; i++) {
    minVal = Math.min(minVal, mask[i])
    maxVal = Math.max(maxVal, mask[i])
  }
  
  const range = maxVal - minVal
  const normalizedMask = new Float32Array(mask.length)
  
  if (range > 0) {
    for (let i = 0; i < mask.length; i++) {
      normalizedMask[i] = (mask[i] - minVal) / range
    }
  } else {
    // If all values are the same, set to 1
    normalizedMask.fill(1)
  }
  
  // Step 2: Convert to uint8 mask (multiply by 255)
  // Create temporary canvas for mask
  const maskCanvas = document.createElement('canvas')
  maskCanvas.width = maskWidth
  maskCanvas.height = maskHeight
  const maskCtx = maskCanvas.getContext('2d')
  if (!maskCtx) {
    throw new Error('Failed to get mask canvas context')
  }
  
  // Draw mask with values in alpha channel for 'destination-in' composite operation
  const maskImageData = maskCtx.createImageData(maskWidth, maskHeight)
  for (let i = 0; i < normalizedMask.length; i++) {
    const value = Math.round(normalizedMask[i] * 255)
    maskImageData.data[i * 4] = 255        // R (white)
    maskImageData.data[i * 4 + 1] = 255    // G (white)
    maskImageData.data[i * 4 + 2] = 255    // B (white)
    maskImageData.data[i * 4 + 3] = value  // A (mask value determines transparency)
  }
  maskCtx.putImageData(maskImageData, 0, 0)
  
  // Step 3: Resize mask to original image size using high-quality interpolation (LANCZOS equivalent)
  const scaledMaskCanvas = document.createElement('canvas')
  scaledMaskCanvas.width = originalImage.width
  scaledMaskCanvas.height = originalImage.height
  const scaledMaskCtx = scaledMaskCanvas.getContext('2d')
  if (!scaledMaskCtx) {
    throw new Error('Failed to get scaled mask canvas context')
  }
  
  // Use high-quality image smoothing (closest to LANCZOS)
  scaledMaskCtx.imageSmoothingEnabled = true
  scaledMaskCtx.imageSmoothingQuality = 'high'
  scaledMaskCtx.drawImage(maskCanvas, 0, 0, originalImage.width, originalImage.height)
  
  // Step 4: Create cutout using composite operation
  // empty = Image.new("RGBA", (img.size), 0)
  // cutout = Image.composite(img, empty, mask)
  
  // Create output canvas
  const outputCanvas = document.createElement('canvas')
  outputCanvas.width = originalImage.width
  outputCanvas.height = originalImage.height
  const outputCtx = outputCanvas.getContext('2d')
  if (!outputCtx) {
    throw new Error('Failed to get output canvas context')
  }
  
  // Draw original image first
  outputCtx.drawImage(originalImage, 0, 0)
  
  // Apply the mask using 'destination-in' composite operation
  // This keeps only the parts of the image where the mask is opaque
  outputCtx.globalCompositeOperation = 'destination-in'
  outputCtx.drawImage(scaledMaskCanvas, 0, 0, originalImage.width, originalImage.height)
  
  // Convert canvas to blob
  return new Promise<Blob>((resolve, reject) => {
    outputCanvas.toBlob((blob) => {
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
    
    console.log('Output shape:', outputTensor.dims)
    
    // Extract prediction: pred = ort_outs[0][:, 0, :, :]
    // Output shape is [batch, channels, height, width], we need [batch, 0, :, :]
    const [, , maskHeight, maskWidth] = outputTensor.dims
    const fullData = outputTensor.data as Float32Array
    
    // Extract only channel 0 from the output
    // For shape [1, C, H, W], we want [1, 0, H, W]
    const channelSize = (maskHeight as number) * (maskWidth as number)
    const maskData = new Float32Array(channelSize)
    
    for (let i = 0; i < channelSize; i++) {
      // Channel 0 data starts at index 0 and has length channelSize
      maskData[i] = fullData[i]
    }
    
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
