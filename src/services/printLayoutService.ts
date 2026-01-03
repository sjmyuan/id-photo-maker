/**
 * Print Layout Service
 * Generates high-resolution print-ready canvases with multiple ID photos arranged in a grid
 */

import { calculateLayout } from '../utils/layoutCalculation'
import type { PhotoSize } from '../utils/layoutCalculation'

/**
 * Generate a print-ready layout canvas with multiple photos arranged in a grid
 * 
 * @param sourceCanvas - Canvas containing the cropped ID photo
 * @param photoSize - Physical dimensions of the ID photo in millimeters
 * @param paperType - Paper type identifier ('6-inch' or 'a4')
 * @param dpi - Dots per inch for output (default 300)
 * @returns High-resolution canvas with photo grid layout
 */
export async function generatePrintLayout(
  sourceCanvas: HTMLCanvasElement,
  photoSize: PhotoSize,
  paperType: '6-inch' | 'a4',
  dpi: number = 300
): Promise<HTMLCanvasElement> {
  // Calculate optimal layout
  const layout = calculateLayout(paperType, photoSize, dpi)

  // Create output canvas with paper dimensions
  const outputCanvas = document.createElement('canvas')
  outputCanvas.width = layout.paperWidthPx
  outputCanvas.height = layout.paperHeightPx

  const ctx = outputCanvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  // Fill with white background
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, outputCanvas.width, outputCanvas.height)

  // Draw photo grid
  for (let row = 0; row < layout.photosPerColumn; row++) {
    for (let col = 0; col < layout.photosPerRow; col++) {
      // Calculate position for this photo
      const x = layout.marginLeftPx + col * (layout.photoWidthPx + layout.horizontalSpacingPx)
      const y = layout.marginTopPx + row * (layout.photoHeightPx + layout.verticalSpacingPx)

      // Draw the source canvas at the calculated position and size
      ctx.drawImage(
        sourceCanvas,
        0, 0, sourceCanvas.width, sourceCanvas.height, // Source rectangle (full image)
        x, y, layout.photoWidthPx, layout.photoHeightPx // Destination rectangle
      )
    }
  }

  return outputCanvas
}

/**
 * Convert canvas to blob for download
 * 
 * @param canvas - Canvas to convert
 * @param mimeType - MIME type for output (default 'image/png')
 * @param quality - Image quality (0-1, only for JPEG)
 * @returns Promise resolving to blob
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string = 'image/png',
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to convert canvas to blob'))
        }
      },
      mimeType,
      quality
    )
  })
}

/**
 * Download a canvas as an image file
 * 
 * @param canvas - Canvas to download
 * @param filename - Filename for download
 * @param mimeType - MIME type for output (default 'image/png')
 */
export async function downloadCanvas(
  canvas: HTMLCanvasElement,
  filename: string,
  mimeType: string = 'image/png'
): Promise<void> {
  const blob = await canvasToBlob(canvas, mimeType)
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up the URL
  URL.revokeObjectURL(url)
}
