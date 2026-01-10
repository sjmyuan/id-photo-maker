/**
 * Hook for image download operations
 * Single Responsibility: Coordinate download actions with proper error handling
 */

import { useCallback, useMemo } from 'react'
import { type SizeOption } from '../components/size/CropEditor'
import { type PaperType } from '../components/layout/PaperTypeSelector'
import { type PaperMargins } from '../types'
import { DownloadService } from '../services/downloadService'
import { generatePrintLayout } from '../services/printLayoutService'
import { applyBackgroundColor } from '../services/mattingService'

interface UseImageDownloadParams {
  selectedSize: SizeOption
  paperType: PaperType
  backgroundColor: string
  margins: PaperMargins
  onError: (errors: string[]) => void
}

export function useImageDownload({
  selectedSize,
  paperType,
  backgroundColor,
  margins,
  onError,
}: UseImageDownloadParams) {
  const downloadService = useMemo(() => new DownloadService(), [])

  const downloadPhoto = useCallback(
    async (croppedPreviewUrl: string | null) => {
      if (!croppedPreviewUrl) return

      try {
        await downloadService.downloadImageFromUrl(
          croppedPreviewUrl,
          `id-photo-${selectedSize.id}-300dpi-${Date.now()}.png`,
          300
        )
      } catch (error) {
        console.error('Failed to download image:', error)
        onError([error instanceof Error ? error.message : 'Failed to download image'])
      }
    },
    [selectedSize, onError, downloadService]
  )

  const downloadLayout = useCallback(
    async (transparentCanvas: HTMLCanvasElement | null) => {
      if (!transparentCanvas) return

      try {
        // Apply background color to canvas before generating layout
        const coloredCanvas = applyBackgroundColor(transparentCanvas, backgroundColor)

        // Generate high-resolution print layout with colored canvas (always 300 DPI)
        const layoutCanvas = await generatePrintLayout(
          coloredCanvas,
          {
            widthMm: selectedSize.physicalWidth,
            heightMm: selectedSize.physicalHeight,
          },
          paperType,
          300,
          margins
        )

        // Download the layout with DPI metadata (always 300 DPI)
        const filename = `id-photo-layout-${selectedSize.id}-${paperType}-${Date.now()}.png`
        await downloadService.downloadCanvas(layoutCanvas, filename, 300)
      } catch (error) {
        console.error('Failed to generate print layout:', error)
        onError([error instanceof Error ? error.message : 'Failed to download layout'])
      }
    },
    [selectedSize, backgroundColor, paperType, margins, onError, downloadService]
  )

  return {
    downloadPhoto,
    downloadLayout,
  }
}
