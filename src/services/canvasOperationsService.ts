/**
 * Canvas Operations Service
 * Single Responsibility: Handle canvas manipulation operations
 */

import { type CropArea } from '../utils/cropAreaCalculation'

/**
 * Service for canvas manipulation operations
 */
export class CanvasOperationsService {
  /**
   * Create a canvas from an image
   */
  createCanvasFromImage(image: HTMLImageElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to get canvas context')
    }

    ctx.drawImage(image, 0, 0)
    return canvas
  }

  /**
   * Crop an image to a specific area
   */
  cropImage(image: HTMLImageElement, cropArea: CropArea): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = cropArea.width
    canvas.height = cropArea.height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to get canvas context')
    }

    ctx.drawImage(
      image,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height,
      0,
      0,
      cropArea.width,
      cropArea.height
    )

    return canvas
  }

  /**
   * Apply background color to a canvas
   */
  applyBackgroundColor(canvas: HTMLCanvasElement, backgroundColor: string): HTMLCanvasElement {
    const outputCanvas = document.createElement('canvas')
    outputCanvas.width = canvas.width
    outputCanvas.height = canvas.height

    const ctx = outputCanvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to get canvas context')
    }

    // Fill background
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, outputCanvas.width, outputCanvas.height)

    // Draw the original canvas on top
    ctx.drawImage(canvas, 0, 0)

    return outputCanvas
  }

  /**
   * Convert canvas to blob
   */
  async canvasToBlob(canvas: HTMLCanvasElement, type: string = 'image/png'): Promise<Blob> {
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create blob from canvas'))
          }
        },
        type
      )
    })
  }

  /**
   * Load image from URL
   */
  async loadImageFromUrl(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Failed to load image from ${url}`))
      img.src = url
    })
  }

  /**
   * Load image from file
   */
  async loadImageFromFile(file: File): Promise<HTMLImageElement> {
    const url = URL.createObjectURL(file)
    try {
      const image = await this.loadImageFromUrl(url)
      return image
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  /**
   * Load image from blob
   */
  async loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
    const url = URL.createObjectURL(blob)
    try {
      const image = await this.loadImageFromUrl(url)
      return image
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  /**
   * Create canvas from blob
   */
  async createCanvasFromBlob(blob: Blob): Promise<HTMLCanvasElement> {
    const image = await this.loadImageFromBlob(blob)
    return this.createCanvasFromImage(image)
  }
}
