/**
 * PrintLayout Component
 * Displays single ID photo preview and paper type selection with layout preview for print-ready ID photo sheets
 */

import { useEffect, useRef } from 'react'
import type { SizeOption } from '../size/CropEditor'
import { calculateLayout } from '../../utils/layoutCalculation'
import { ImagePreview } from './ImagePreview'

export interface PrintLayoutProps {
  croppedImageUrl: string // URL of the cropped ID photo
  selectedSize: SizeOption // Selected ID photo size
  paperType: '6-inch' | 'a4' // Selected paper type (now controlled by parent)
  printLayoutPreviewUrl?: string // Optional URL of pre-generated print layout preview
}

export function PrintLayout({
  croppedImageUrl,
  selectedSize,
  paperType,
  printLayoutPreviewUrl,
}: PrintLayoutProps) {
  // Keep refs and layout calculation for backward compatibility (fallback to canvas rendering)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  // Calculate layout based on current paper type and selected size
  const layout = calculateLayout(paperType, {
    widthMm: selectedSize.physicalWidth,
    heightMm: selectedSize.physicalHeight,
  })

  // Draw preview function (only used when printLayoutPreviewUrl is not provided)
  const drawPreview = () => {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas dimensions to maintain paper aspect ratio
    // Use a reasonable preview size (e.g., 400px width)
    const previewWidth = 400
    const paperAspectRatio = layout.paperWidthPx / layout.paperHeightPx
    const previewHeight = previewWidth / paperAspectRatio

    canvas.width = previewWidth
    canvas.height = previewHeight

    // Fill with white background
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Calculate scaling factor
    const scale = previewWidth / layout.paperWidthPx

    // Draw photo grid
    for (let row = 0; row < layout.photosPerColumn; row++) {
      for (let col = 0; col < layout.photosPerRow; col++) {
        const x = (layout.marginLeftPx + col * (layout.photoWidthPx + layout.horizontalSpacingPx)) * scale
        const y = (layout.marginTopPx + row * (layout.photoHeightPx + layout.verticalSpacingPx)) * scale
        const w = layout.photoWidthPx * scale
        const h = layout.photoHeightPx * scale

        // Draw the image
        ctx.drawImage(img, x, y, w, h)

        // Draw border around each photo
        ctx.strokeStyle = '#E5E7EB'
        ctx.lineWidth = 1
        ctx.strokeRect(x, y, w, h)
      }
    }
  }

  // Load the cropped image only if we need to draw canvas (backward compatibility)
  useEffect(() => {
    if (printLayoutPreviewUrl) return // Skip if URL is provided

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = croppedImageUrl
    img.onload = () => {
      imageRef.current = img
      if (canvasRef.current) {
        drawPreview()
      }
    }

    return () => {
      imageRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [croppedImageUrl, printLayoutPreviewUrl])

  // Redraw preview when layout changes (only if using canvas fallback)
  useEffect(() => {
    if (printLayoutPreviewUrl) return // Skip if URL is provided
    
    if (imageRef.current) {
      drawPreview()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, paperType, printLayoutPreviewUrl])

  return (
    <div className="mt-6 border-t pt-6" data-testid="print-layout">
      <h3 className="text-sm font-semibold mb-4 text-gray-900">ID Photo Preview</h3>

      {/* Vertical container for both previews */}
      <div className="space-y-4 mb-4">
        {/* Single ID Photo Preview using ImagePreview */}
        <ImagePreview imageUrl={croppedImageUrl} alt="ID photo preview" />

        {/* Print Layout Preview using ImagePreview or Canvas */}
        {printLayoutPreviewUrl ? (
          <ImagePreview imageUrl={printLayoutPreviewUrl} alt="Print layout preview" />
        ) : (
          <div className="bg-gray-100 p-4 rounded-lg flex justify-center items-center">
            <canvas
              ref={canvasRef}
              data-testid="layout-preview"
              className="border border-gray-300 shadow-sm"
            />
          </div>
        )}
      </div>
    </div>
  )
}
