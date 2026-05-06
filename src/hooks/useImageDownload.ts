/**
 * Hook for image download operations
 * Single Responsibility: Coordinate download actions with proper error handling
 */

import { useCallback, useMemo } from 'react'
import { type SizeOption } from '../components/size/CropEditor'
import { DownloadService } from '../services/downloadService'

interface UseImageDownloadParams {
  selectedSize: SizeOption
  onError: (errors: string[]) => void
}

export function useImageDownload({ selectedSize, onError }: UseImageDownloadParams) {
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
        onError([error instanceof Error ? error.message : 'Failed to download image'])
      }
    },
    [selectedSize, onError, downloadService]
  )

  return {
    downloadPhoto,
  }
}
