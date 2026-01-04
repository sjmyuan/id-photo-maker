import { useEffect, useRef } from 'react'
import { ImagePreview } from '../layout/ImagePreview'
import { type PaperType } from '../layout/PaperTypeSelector'
import { type SizeOption } from '../size/CropEditor'
import { calculateLayout } from '../../utils/layoutCalculation'

interface Step3LayoutProps {
  printLayoutPreviewUrl: string | null
  croppedPreviewUrl: string
  paperType: PaperType
  selectedSize: SizeOption
  isProcessing: boolean
  onDownloadLayout: () => void
  onBack: () => void
}

export function Step3Layout({
  printLayoutPreviewUrl,
  croppedPreviewUrl,
  paperType,
  selectedSize,
  isProcessing,
  onDownloadLayout,
  onBack,
}: Step3LayoutProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  // Canvas drawing logic for print layout preview fallback
  useEffect(() => {
    if (printLayoutPreviewUrl) return // Skip if we have URL
    if (!croppedPreviewUrl) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = croppedPreviewUrl
    img.onload = () => {
      imageRef.current = img
      if (canvasRef.current) {
        drawCanvasPreview()
      }
    }

    return () => {
      imageRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [croppedPreviewUrl, printLayoutPreviewUrl])

  // Redraw canvas when layout changes
  useEffect(() => {
    if (printLayoutPreviewUrl) return
    if (imageRef.current && canvasRef.current) {
      drawCanvasPreview()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paperType, selectedSize, printLayoutPreviewUrl])

  // Canvas drawing function
  const drawCanvasPreview = () => {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Calculate layout based on current paper type and selected size
    const layout = calculateLayout(paperType, {
      widthMm: selectedSize.physicalWidth,
      heightMm: selectedSize.physicalHeight,
    })

    // Set canvas dimensions
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

  return (
    <div data-testid="step3-container">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Print Layout Preview</h3>
      
      {/* Print Layout Preview */}
      <div className="mb-6" data-testid="print-layout-preview">
        {printLayoutPreviewUrl ? (
          <ImagePreview 
            imageUrl={printLayoutPreviewUrl} 
            alt="Print layout preview"
          />
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
      
      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={onDownloadLayout}
          disabled={isProcessing}
          data-testid="download-print-layout-button"
          className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600"
        >
          Download Print Layout
        </button>
        
        <button
          onClick={onBack}
          disabled={isProcessing}
          data-testid="back-button"
          className="w-full py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-600"
        >
          Back
        </button>
      </div>
    </div>
  )
}
