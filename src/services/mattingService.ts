/**
 * Matting service for AI-powered portrait background removal
 * Provides background removal with adaptive performance based on device capability
 */

import { processImageWithU2Net, type U2NetModel } from './u2netService'

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
 * Process image using U2Net model for AI-powered background removal
 * 
 * @param file - The image file to process
 * @param model - The loaded U2Net model
 * @returns A promise that resolves to the matted image as a PNG Blob
 */
export async function processWithU2Net(
  file: File,
  model: U2NetModel
): Promise<Blob> {
  // Validate file
  if (!file || file.size === 0) {
    throw new Error('Invalid file for matting')
  }

  // Load image from file
  const img = new Image()
  const imageUrl = URL.createObjectURL(file)
  
  try {
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = imageUrl
    })

    // Process with U2Net
    const result = await processImageWithU2Net(model, img)
    
    return result
  } finally {
    // Clean up object URL
    URL.revokeObjectURL(imageUrl)
  }
}

/**
 * Mock matting service that simulates AI-powered portrait matting
 * Used as fallback when U2Net model is not available
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

export interface MattingServiceInterface {
  processMattingAsync(file: File, expectedProcessingTime: number): Promise<Blob>
  processWithU2Net(file: File, model: U2NetModel): Promise<Blob>
  removeBackground(image: HTMLImageElement, options?: MattingOptions): Promise<MattingResult>
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

  async processWithU2Net(file: File, model: U2NetModel): Promise<Blob> {
    return processWithU2Net(file, model)
  }

  async removeBackground(image: HTMLImageElement, options?: MattingOptions): Promise<MattingResult> {
    return removeBackground(image, options)
  }

  applyBackgroundColor(transparentCanvas: HTMLCanvasElement, color: string): HTMLCanvasElement {
    return applyBackgroundColor(transparentCanvas, color)
  }
}

