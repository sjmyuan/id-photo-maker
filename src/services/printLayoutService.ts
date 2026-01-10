/**
 * Print Layout Service
 * Generates high-resolution print-ready canvases with multiple ID photos arranged in a grid
 */

import { calculateLayout } from '../utils/layoutCalculation'
import type { PhotoSize } from '../utils/layoutCalculation'
import type { PaperMargins } from '../types'

/**
 * Generate a print-ready layout canvas with multiple photos arranged in a grid
 * 
 * @param sourceCanvas - Canvas containing the cropped ID photo
 * @param photoSize - Physical dimensions of the ID photo in millimeters
 * @param paperType - Paper type identifier ('6-inch' or 'a4')
 * @param dpi - Dots per inch for output (default 300)
 * @param margins - Optional printer margins in millimeters
 * @returns High-resolution canvas with photo grid layout
 */
export async function generatePrintLayout(
  sourceCanvas: HTMLCanvasElement,
  photoSize: PhotoSize,
  paperType: '6-inch' | 'a4',
  dpi: number = 300,
  margins?: PaperMargins
): Promise<HTMLCanvasElement> {
  // Calculate optimal layout with margins
  const layout = calculateLayout(paperType, photoSize, dpi, margins)

  // When margins are set, create canvas sized to printable area (excluding margins)
  // This generates an image that fits the printer's actual printable area
  const canvasWidth = layout.printerMargins
    ? layout.paperWidthPx - layout.printerMargins.leftPx - layout.printerMargins.rightPx
    : layout.paperWidthPx
  const canvasHeight = layout.printerMargins
    ? layout.paperHeightPx - layout.printerMargins.topPx - layout.printerMargins.bottomPx
    : layout.paperHeightPx

  // Adjust photo positions: when margins are present, photos are positioned relative to printable area
  // Subtract printer margins from the calculated positions
  const offsetX = layout.printerMargins ? layout.printerMargins.leftPx : 0
  const offsetY = layout.printerMargins ? layout.printerMargins.topPx : 0

  // Create output canvas with calculated dimensions
  const outputCanvas = document.createElement('canvas')
  outputCanvas.width = canvasWidth
  outputCanvas.height = canvasHeight

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
      // Calculate position for this photo (subtract offset to account for margins)
      const x = layout.marginLeftPx - offsetX + col * (layout.photoWidthPx + layout.horizontalSpacingPx)
      const y = layout.marginTopPx - offsetY + row * (layout.photoHeightPx + layout.verticalSpacingPx)

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
 * Generate a preview-sized layout canvas for display purposes
 * Creates a scaled-down version of the print layout (400px wide)
 * 
 * @param sourceImage - Image element containing the cropped ID photo
 * @param photoSize - Physical dimensions of the ID photo in millimeters
 * @param paperType - Paper type identifier ('6-inch' or 'a4')
 * @param margins - Optional printer margins in millimeters
 * @returns Preview-sized canvas (400px wide, maintaining aspect ratio)
 */
export function generatePrintLayoutPreview(
  sourceImage: HTMLImageElement,
  photoSize: PhotoSize,
  paperType: '6-inch' | 'a4',
  margins?: PaperMargins
): HTMLCanvasElement {
  // Calculate layout at a standard DPI for layout dimensions
  const layout = calculateLayout(paperType, photoSize, 300, margins)

  // When margins are set, calculate dimensions based on printable area
  const layoutWidth = layout.printerMargins
    ? layout.paperWidthPx - layout.printerMargins.leftPx - layout.printerMargins.rightPx
    : layout.paperWidthPx
  const layoutHeight = layout.printerMargins
    ? layout.paperHeightPx - layout.printerMargins.topPx - layout.printerMargins.bottomPx
    : layout.paperHeightPx

  // Adjust photo positions: when margins are present, subtract printer margins
  const offsetX = layout.printerMargins ? layout.printerMargins.leftPx : 0
  const offsetY = layout.printerMargins ? layout.printerMargins.topPx : 0

  // Create preview canvas with fixed width
  const previewWidth = 400
  const paperAspectRatio = layoutWidth / layoutHeight
  const previewHeight = previewWidth / paperAspectRatio

  const outputCanvas = document.createElement('canvas')
  outputCanvas.width = previewWidth
  outputCanvas.height = previewHeight

  const ctx = outputCanvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  // Fill with white background
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, outputCanvas.width, outputCanvas.height)

  // Calculate scaling factor from layout dimensions to preview dimensions
  const scale = previewWidth / layoutWidth

  // Draw photo grid
  for (let row = 0; row < layout.photosPerColumn; row++) {
    for (let col = 0; col < layout.photosPerRow; col++) {
      // Calculate position for this photo (subtract offset to account for margins)
      const layoutX = layout.marginLeftPx - offsetX + col * (layout.photoWidthPx + layout.horizontalSpacingPx)
      const layoutY = layout.marginTopPx - offsetY + row * (layout.photoHeightPx + layout.verticalSpacingPx)
      
      const x = layoutX * scale
      const y = layoutY * scale
      const w = layout.photoWidthPx * scale
      const h = layout.photoHeightPx * scale

      // Draw the image
      ctx.drawImage(sourceImage, x, y, w, h)

      // Draw border around each photo
      ctx.strokeStyle = '#E5E7EB'
      ctx.lineWidth = 1
      ctx.strokeRect(x, y, w, h)
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
 * @param dpi - DPI value to embed in metadata (default 300)
 */
export async function downloadCanvas(
  canvas: HTMLCanvasElement,
  filename: string,
  mimeType: string = 'image/png',
  dpi: number = 300
): Promise<void> {
  const blob = await canvasToBlob(canvas, mimeType)
  
  // Embed DPI metadata for PNG files
  let finalBlob = blob
  if (mimeType === 'image/png') {
    const { embedDPIMetadata } = await import('../utils/dpiMetadata')
    finalBlob = await embedDPIMetadata(blob, dpi)
  }
  
  const url = URL.createObjectURL(finalBlob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up the URL
  URL.revokeObjectURL(url)
}
