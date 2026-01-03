/**
 * PrintLayout Component
 * Displays paper type selection, layout preview, and download for print-ready ID photo sheets
 */

import { useEffect, useRef } from 'react'
import type { SizeOption } from '../size/CropEditor'
import { calculateLayout } from '../../utils/layoutCalculation'

export interface PrintLayoutProps {
  croppedImageUrl: string // URL of the cropped ID photo
  selectedSize: SizeOption // Selected ID photo size
  paperType: '6-inch' | 'a4' // Selected paper type (now controlled by parent)
  onDownloadLayout: () => void // Callback for download action (no parameter needed)
}

export function PrintLayout({
  croppedImageUrl,
  selectedSize,
  paperType,
  onDownloadLayout,
}: PrintLayoutProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  // Calculate layout based on current paper type and selected size
  const layout = calculateLayout(paperType, {
    widthMm: selectedSize.physicalWidth,
    heightMm: selectedSize.physicalHeight,
  })

  // Load the cropped image
  useEffect(() => {
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
  }, [croppedImageUrl])

  // Draw preview function
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

  // Redraw preview when layout changes
  useEffect(() => {
    if (imageRef.current) {
      drawPreview()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, paperType])

  const handleDownload = () => {
    onDownloadLayout()
  }

  return (
    <div className="mt-6 border-t pt-6" data-testid="print-layout">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Print Layout Preview</h3>

      {/* Layout Preview Canvas */}
      <div className="mb-4">
        <div className="bg-gray-100 p-4 rounded-lg flex justify-center">
          <canvas
            ref={canvasRef}
            data-testid="layout-preview"
            className="border border-gray-300 shadow-sm"
          />
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
      >
        Download Print Layout
      </button>
    </div>
  )
}
