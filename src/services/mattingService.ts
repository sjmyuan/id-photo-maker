/**
 * Matting service for AI-powered portrait background removal
 * Provides background removal with adaptive performance based on device capability
 */

import { AutoModel, AutoProcessor, RawImage, type Tensor } from '@huggingface/transformers'

// Model caching
let cachedModel: Awaited<ReturnType<typeof AutoModel.from_pretrained>> | null = null
let cachedProcessor: Awaited<ReturnType<typeof AutoProcessor.from_pretrained>> | null = null

// Types
export interface MattingResult {
  foregroundMask: ImageData
  processedImage: HTMLCanvasElement
  processingTime: number
  quality: 'high' | 'medium' | 'low'
}

export interface MattingOptions {
  quickMode?: boolean
}

/**
 * Remove background from an image using canvas-based matting
 * 
 * @param image - The HTMLImageElement to process
 * @param options - Processing options including quickMode
 * @returns Promise resolving to MattingResult with transparent background
 */
export async function removeBackground(
  image: HTMLImageElement,
  options: MattingOptions = {}
): Promise<MattingResult> {
  const startTime = performance.now()
  
  // Validate input
  if (!image || !image.width || !image.height || image.width === 0 || image.height === 0) {
    throw new Error('Invalid image: Image must have valid width and height')
  }

  const { quickMode = false } = options
  
  // Create canvas for processing
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  
  if (!ctx) {
    throw new Error('Failed to get canvas 2d context')
  }

  // Draw original image
  ctx.drawImage(image, 0, 0)
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  
  // Create a copy for the mask
  const maskData = ctx.createImageData(canvas.width, canvas.height)
  
  // Simple background removal algorithm
  // In production, this would use U²-Net or similar AI model
  // For now, we use a simple edge-based algorithm
  
  if (quickMode) {
    // Quick mode: Simple chroma key-like approach
    // Assumes lighter/uniform background
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const brightness = (r + g + b) / 3
      
      // Simple threshold: if pixel is very bright or very dark, likely background
      const isBackground = brightness > 200 || brightness < 30
      
      if (isBackground) {
        // Make transparent
        data[i + 3] = 0
        maskData.data[i + 3] = 0
      } else {
        // Keep foreground
        maskData.data[i] = 255
        maskData.data[i + 1] = 255
        maskData.data[i + 2] = 255
        maskData.data[i + 3] = 255
      }
    }
  } else {
    // Normal mode: More sophisticated edge detection
    // This simulates a better quality algorithm
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY)
    
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        
        // Distance from center (assume subject is near center)
        const dx = x - centerX
        const dy = y - centerY
        const dist = Math.sqrt(dx * dx + dy * dy)
        const distRatio = dist / maxDist
        
        // Color variance (foreground typically has more varied colors)
        const brightness = (r + g + b) / 3
        const variance = Math.abs(r - brightness) + Math.abs(g - brightness) + Math.abs(b - brightness)
        
        // Combined heuristic: center proximity + color variance
        const foregroundScore = (1 - distRatio) * 0.6 + (variance / 255) * 0.4
        
        if (foregroundScore > 0.3) {
          // Likely foreground - keep with varying alpha based on confidence
          const alpha = Math.min(255, foregroundScore * 255 * 1.5)
          data[i + 3] = alpha
          maskData.data[i] = 255
          maskData.data[i + 1] = 255
          maskData.data[i + 2] = 255
          maskData.data[i + 3] = alpha
        } else {
          // Likely background - make transparent
          data[i + 3] = 0
          maskData.data[i + 3] = 0
        }
      }
    }
  }
  
  // Put the processed data back
  ctx.putImageData(imageData, 0, 0)
  
  const endTime = performance.now()
  const processingTime = endTime - startTime
  
  return {
    foregroundMask: maskData,
    processedImage: canvas,
    processingTime,
    quality: quickMode ? 'low' : 'medium'
  }
}

/**
 * Apply a solid background color to a transparent image
 * 
 * @param transparentCanvas - Canvas with transparent background
 * @param color - Background color (hex or rgb format)
 * @returns Canvas with colored background
 */
export function applyBackgroundColor(
  transparentCanvas: HTMLCanvasElement,
  color: string
): HTMLCanvasElement {
  // Create a new canvas for the result
  const canvas = document.createElement('canvas')
  canvas.width = transparentCanvas.width
  canvas.height = transparentCanvas.height
  const ctx = canvas.getContext('2d')
  
  if (!ctx) {
    throw new Error('Failed to get canvas 2d context')
  }
  
  // Fill with background color
  ctx.fillStyle = color
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // Draw the transparent image on top
  ctx.drawImage(transparentCanvas, 0, 0)
  
  return canvas
}

/**
 * Mock matting service that simulates AI-powered portrait matting
 * In a real implementation, this would call an actual ML model or API
 * 
 * @param file - The image file to process
 * @param expectedProcessingTime - Expected processing time in milliseconds based on device capability
 * @returns A promise that resolves to the matted image as a PNG Blob
 */
export async function mockMattingService(
  file: File,
  expectedProcessingTime: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Validate file
    if (!file || file.size === 0) {
      reject(new Error('Invalid file for matting'))
      return
    }

    // Simulate processing time
    setTimeout(() => {
      try {
        // In a real implementation, this would:
        // 1. Send the image to an AI model (e.g., RMBG, SAM, U2Net)
        // 2. Process the image to detect and extract the person
        // 3. Generate a PNG with transparent background
        
        // Create a mock PNG blob with reasonable size
        // PNG signature + minimal image data
        const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10]
        const mockImageData = new Array(Math.min(1000, file.size)).fill(0)
        const mockMattedData = new Uint8Array([...pngSignature, ...mockImageData])
        
        const blob = new Blob([mockMattedData], { type: 'image/png' })
        resolve(blob)
      } catch (error) {
        reject(error)
      }
    }, expectedProcessingTime)
  })
}

/**
 * Remove background from an image using Hugging Face Transformers (U-2-Netp model)
 * This provides production-quality AI-powered background removal
 * 
 * @param image - The HTMLImageElement to process
 * @returns Promise resolving to MattingResult with transparent background
 */
export async function removeBackgroundWithTransformer(
  image: HTMLImageElement
): Promise<MattingResult> {
  const startTime = performance.now()
  
  // Validate input
  if (!image || !image.width || !image.height || image.width === 0 || image.height === 0) {
    throw new Error('Invalid image: Image must have valid width and height')
  }

  try {
    // Load or use cached model and processor
    if (!cachedModel || !cachedProcessor) {
      cachedProcessor = await AutoProcessor.from_pretrained('BritishWerewolf/U-2-Netp')
      cachedModel = await AutoModel.from_pretrained('BritishWerewolf/U-2-Netp', {
        dtype: 'fp32',
      })
    }

    // Convert HTMLImageElement to canvas for RawImage
    const canvas = document.createElement('canvas')
    canvas.width = image.width
    canvas.height = image.height
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      throw new Error('Failed to get canvas 2d context')
    }

    ctx.drawImage(image, 0, 0)
    
    // Get image data for RawImage
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    
    // Create RawImage from ImageData
    const rawImage = new RawImage(
      new Uint8ClampedArray(imageData.data),
      canvas.width,
      canvas.height,
      4 // 4 channels (RGBA)
    )

    // Process image through processor
    const processed = await cachedProcessor(rawImage)

    // Run model inference
    const output = await cachedModel({ input: processed.pixel_values })

    // Extract mask tensor
    const maskTensor = output.mask as Tensor
    const maskData = maskTensor.data as Uint8Array
    const [, maskHeight, maskWidth] = maskTensor.dims

    // Create output canvas scaled to original size
    const outputCanvas = document.createElement('canvas')
    outputCanvas.width = image.width
    outputCanvas.height = image.height
    const outputCtx = outputCanvas.getContext('2d')
    
    if (!outputCtx) {
      throw new Error('Failed to get output canvas 2d context')
    }

    // Draw original image
    outputCtx.drawImage(image, 0, 0)

    // Get original image data
    const outputImageData = outputCtx.getImageData(0, 0, outputCanvas.width, outputCanvas.height)
    const pixels = outputImageData.data

    // Create scaled mask canvas
    const maskCanvas = document.createElement('canvas')
    maskCanvas.width = maskWidth
    maskCanvas.height = maskHeight
    const maskCtx = maskCanvas.getContext('2d')
    
    if (!maskCtx) {
      throw new Error('Failed to get mask canvas 2d context')
    }

    // Convert mask tensor to ImageData
    const maskImageData = maskCtx.createImageData(maskWidth, maskHeight)
    for (let i = 0; i < maskData.length; i++) {
      const idx = i * 4
      const maskValue = maskData[i]
      maskImageData.data[idx] = maskValue     // R
      maskImageData.data[idx + 1] = maskValue // G
      maskImageData.data[idx + 2] = maskValue // B
      maskImageData.data[idx + 3] = 255       // A
    }
    maskCtx.putImageData(maskImageData, 0, 0)

    // Scale mask to original image size if needed
    const scaledMaskCanvas = document.createElement('canvas')
    scaledMaskCanvas.width = outputCanvas.width
    scaledMaskCanvas.height = outputCanvas.height
    const scaledMaskCtx = scaledMaskCanvas.getContext('2d')
    
    if (!scaledMaskCtx) {
      throw new Error('Failed to get scaled mask canvas 2d context')
    }

    scaledMaskCtx.drawImage(maskCanvas, 0, 0, outputCanvas.width, outputCanvas.height)
    const scaledMaskData = scaledMaskCtx.getImageData(0, 0, outputCanvas.width, outputCanvas.height)

    // Apply mask to original image (set alpha channel based on mask)
    for (let i = 0; i < pixels.length; i += 4) {
      const maskAlpha = scaledMaskData.data[i] // Use R channel of mask as alpha
      pixels[i + 3] = maskAlpha // Set alpha channel
    }

    // Put modified image data back
    outputCtx.putImageData(outputImageData, 0, 0)

    // Create foreground mask ImageData
    const foregroundMaskData = outputCtx.createImageData(outputCanvas.width, outputCanvas.height)
    for (let i = 0; i < scaledMaskData.data.length; i += 4) {
      const maskValue = scaledMaskData.data[i]
      foregroundMaskData.data[i] = maskValue
      foregroundMaskData.data[i + 1] = maskValue
      foregroundMaskData.data[i + 2] = maskValue
      foregroundMaskData.data[i + 3] = maskValue
    }

    const endTime = performance.now()
    const processingTime = endTime - startTime

    return {
      foregroundMask: foregroundMaskData,
      processedImage: outputCanvas,
      processingTime,
      quality: 'high'
    }
  } catch (error) {
    throw new Error(`Failed to process image with transformer: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export interface MattingServiceInterface {
  processMattingAsync(file: File, expectedProcessingTime: number): Promise<Blob>
  removeBackground(image: HTMLImageElement, options?: MattingOptions): Promise<MattingResult>
  removeBackgroundWithTransformer(image: HTMLImageElement): Promise<MattingResult>
  applyBackgroundColor(transparentCanvas: HTMLCanvasElement, color: string): HTMLCanvasElement
}

/**
 * Matting service class implementing the interface
 * This can be extended to support different matting backends
 */
export class MattingService implements MattingServiceInterface {
  async processMattingAsync(file: File, expectedProcessingTime: number): Promise<Blob> {
    return mockMattingService(file, expectedProcessingTime)
  }

  async removeBackground(image: HTMLImageElement, options?: MattingOptions): Promise<MattingResult> {
    return removeBackground(image, options)
  }

  async removeBackgroundWithTransformer(image: HTMLImageElement): Promise<MattingResult> {
    return removeBackgroundWithTransformer(image)
  }

  applyBackgroundColor(transparentCanvas: HTMLCanvasElement, color: string): HTMLCanvasElement {
    return applyBackgroundColor(transparentCanvas, color)
  }
}

