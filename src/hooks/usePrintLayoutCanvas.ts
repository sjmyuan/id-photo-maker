import { useEffect, useRef } from 'react'
import { type PaperType } from '../components/layout/PaperTypeSelector'
import { type SizeOption } from '../components/size/CropEditor'
import { calculateLayout } from '../utils/layoutCalculation'

interface UsePrintLayoutCanvasParams {
  croppedPreviewUrl: string
  paperType: PaperType
  selectedSize: SizeOption
}

export function usePrintLayoutCanvas({
  croppedPreviewUrl,
  paperType,
  selectedSize,
}: UsePrintLayoutCanvasParams) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  // Load image effect
  useEffect(() => {
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
  }, [croppedPreviewUrl])

  // Redraw canvas when layout changes
  useEffect(() => {
    if (imageRef.current && canvasRef.current) {
      drawCanvasPreview()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paperType, selectedSize])

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

  return { canvasRef }
}
