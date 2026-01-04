import { useCallback } from 'react'
import { type SizeOption } from '../components/size/CropEditor'
import { type PaperType } from '../components/layout/PaperTypeSelector'
import { embedDPIMetadata } from '../utils/dpiMetadata'
import { applyBackgroundColor } from '../services/mattingService'
import { generatePrintLayout, downloadCanvas } from '../services/printLayoutService'

interface UseImageDownloadParams {
  selectedSize: SizeOption
  requiredDPI: 300 | null
  paperType: PaperType
  backgroundColor: string
  onError: (errors: string[]) => void
}

export function useImageDownload({
  selectedSize,
  requiredDPI,
  paperType,
  backgroundColor,
  onError,
}: UseImageDownloadParams) {
  const downloadPhoto = useCallback(
    async (croppedPreviewUrl: string | null) => {
      if (!croppedPreviewUrl) return

      try {
        // Fetch the cropped preview blob
        const response = await fetch(croppedPreviewUrl)
        const blob = await response.blob()

        // Embed DPI metadata
        const dpi = requiredDPI || 300
        const blobWithDPI = await embedDPIMetadata(blob, dpi)

        // Create download link with DPI-embedded image
        const url = URL.createObjectURL(blobWithDPI)
        const link = document.createElement('a')
        link.href = url
        link.download = `id-photo-${selectedSize.id}-${dpi}dpi-${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 100)
      } catch (error) {
        console.error('Failed to download image:', error)
        onError([error instanceof Error ? error.message : 'Failed to download image'])
      }
    },
    [selectedSize, requiredDPI, onError]
  )

  const downloadLayout = useCallback(
    async (transparentCanvas: HTMLCanvasElement | null) => {
      if (!transparentCanvas) return

      try {
        // Apply background color to canvas before generating layout
        const coloredCanvas = applyBackgroundColor(transparentCanvas, backgroundColor)

        // Use the same DPI as the photo (required DPI or default 300)
        const dpi = requiredDPI || 300

        // Generate high-resolution print layout with colored canvas
        const layoutCanvas = await generatePrintLayout(
          coloredCanvas,
          {
            widthMm: selectedSize.physicalWidth,
            heightMm: selectedSize.physicalHeight,
          },
          paperType,
          dpi
        )

        // Download the layout with DPI metadata
        const filename = `id-photo-layout-${selectedSize.id}-${paperType}-${Date.now()}.png`
        await downloadCanvas(layoutCanvas, filename, 'image/png', dpi)
      } catch (error) {
        console.error('Failed to generate print layout:', error)
      }
    },
    [selectedSize, backgroundColor, paperType, requiredDPI]
  )

  return {
    downloadPhoto,
    downloadLayout,
  }
}
