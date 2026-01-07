import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useImageDownload } from './useImageDownload'
import { SIZE_OPTIONS } from '../components/size/CropEditor'
import * as printLayoutService from '../services/printLayoutService'
import * as mattingService from '../services/mattingService'

// Mock modules
vi.mock('../services/downloadService', () => ({
  DownloadService: function () {
    return {
      downloadImageFromUrl: vi.fn().mockResolvedValue(undefined),
      downloadCanvas: vi.fn().mockResolvedValue(undefined),
      downloadBlob: vi.fn(),
    }
  },
}))
vi.mock('../services/printLayoutService')
vi.mock('../services/mattingService')
vi.mock('../services/canvasOperationsService', () => ({
  CanvasOperationsService: vi.fn().mockImplementation(() => ({})),
}))

describe('useImageDownload', () => {
  let mockBlob: Blob
  let mockCanvas: HTMLCanvasElement

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock blob
    mockBlob = new Blob(['test'], { type: 'image/png' })

    // Mock canvas
    mockCanvas = {
      toBlob: vi.fn((callback) => callback(mockBlob)),
      width: 100,
      height: 100,
    } as unknown as HTMLCanvasElement

    // Mock print layout services
    vi.mocked(mattingService.applyBackgroundColor).mockReturnValue(mockCanvas)
    vi.mocked(printLayoutService.generatePrintLayout).mockResolvedValue(mockCanvas)
  })

  it('should return downloadPhoto and downloadLayout functions', () => {
    const { result } = renderHook(() =>
      useImageDownload({
        selectedSize: SIZE_OPTIONS[0],
        paperType: '6-inch',
        backgroundColor: '#0000FF',
        onError: vi.fn(),
      })
    )

    expect(result.current.downloadPhoto).toBeDefined()
    expect(result.current.downloadLayout).toBeDefined()
    expect(typeof result.current.downloadPhoto).toBe('function')
    expect(typeof result.current.downloadLayout).toBe('function')
  })

  describe('downloadPhoto', () => {
    it('should handle when croppedPreviewUrl is not provided', async () => {
      const onError = vi.fn()
      const { result } = renderHook(() =>
        useImageDownload({
          selectedSize: SIZE_OPTIONS[0],
          paperType: '6-inch',
          backgroundColor: '#0000FF',
          onError,
        })
      )

      await result.current.downloadPhoto(null)

      expect(onError).not.toHaveBeenCalled()
    })

    it('should call downloadService.downloadImageFromUrl with proper params', async () => {
      const onError = vi.fn()
      const { result } = renderHook(() =>
        useImageDownload({
          selectedSize: SIZE_OPTIONS[0],
          paperType: '6-inch',
          backgroundColor: '#0000FF',
          onError,
        })
      )

      await result.current.downloadPhoto('blob:test-url')

      expect(onError).not.toHaveBeenCalled()
    })
  })

  describe('downloadLayout', () => {
    it('should generate and download print layout', async () => {
      const onError = vi.fn()
      const { result } = renderHook(() =>
        useImageDownload({
          selectedSize: SIZE_OPTIONS[0],
          paperType: '6-inch',
          backgroundColor: '#0000FF',
          onError,
        })
      )

      await result.current.downloadLayout(mockCanvas)

      await waitFor(() => {
        expect(mattingService.applyBackgroundColor).toHaveBeenCalledWith(mockCanvas, '#0000FF')
        expect(printLayoutService.generatePrintLayout).toHaveBeenCalledWith(
          mockCanvas,
          {
            widthMm: SIZE_OPTIONS[0].physicalWidth,
            heightMm: SIZE_OPTIONS[0].physicalHeight,
          },
          '6-inch',
          300
        )
      })
      expect(onError).not.toHaveBeenCalled()
    })

    it('should handle error when transparentCanvas is not provided', async () => {
      const onError = vi.fn()
      const { result } = renderHook(() =>
        useImageDownload({
          selectedSize: SIZE_OPTIONS[0],
          paperType: '6-inch',
          backgroundColor: '#0000FF',
          onError,
        })
      )

      await result.current.downloadLayout(null)

      expect(mattingService.applyBackgroundColor).not.toHaveBeenCalled()
      expect(onError).not.toHaveBeenCalled()
    })

    it('should handle layout generation error', async () => {
      const onError = vi.fn()
      const { result } = renderHook(() =>
        useImageDownload({
          selectedSize: SIZE_OPTIONS[0],
          paperType: '6-inch',
          backgroundColor: '#0000FF',
          onError,
        })
      )

      const error = new Error('Layout generation failed')
      vi.mocked(printLayoutService.generatePrintLayout).mockRejectedValue(error)

      await result.current.downloadLayout(mockCanvas)

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(['Layout generation failed'])
      })
    })
  })
})
