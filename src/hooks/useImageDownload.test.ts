import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useImageDownload } from './useImageDownload'
import { SIZE_OPTIONS } from '../components/size/CropEditor'

const { mockDownloadFn } = vi.hoisted(() => ({
  mockDownloadFn: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../services/downloadService', () => ({
  DownloadService: function () {
    return { downloadImageFromUrl: mockDownloadFn }
  },
}))

describe('useImageDownload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDownloadFn.mockResolvedValue(undefined)
  })

  it('should return downloadPhoto and downloadLayout functions', () => {
    const { result } = renderHook(() =>
      useImageDownload({ selectedSize: SIZE_OPTIONS[0], onError: vi.fn() })
    )

    expect(typeof result.current.downloadPhoto).toBe('function')
    expect(typeof result.current.downloadLayout).toBe('function')
  })

  describe('downloadPhoto', () => {
    it('should not call onError when url is null', async () => {
      const onError = vi.fn()
      const { result } = renderHook(() =>
        useImageDownload({ selectedSize: SIZE_OPTIONS[0], onError })
      )

      await result.current.downloadPhoto(null)

      expect(onError).not.toHaveBeenCalled()
      expect(mockDownloadFn).not.toHaveBeenCalled()
    })

    it('should call downloadService.downloadImageFromUrl with the url', async () => {
      const onError = vi.fn()
      const { result } = renderHook(() =>
        useImageDownload({ selectedSize: SIZE_OPTIONS[0], onError })
      )

      await result.current.downloadPhoto('blob:test-url')

      expect(mockDownloadFn).toHaveBeenCalledWith('blob:test-url', expect.stringContaining('id-photo'), 300)
      expect(onError).not.toHaveBeenCalled()
    })
  })

  describe('downloadLayout', () => {
    it('should not call onError when url is null', async () => {
      const onError = vi.fn()
      const { result } = renderHook(() =>
        useImageDownload({ selectedSize: SIZE_OPTIONS[0], onError })
      )

      await result.current.downloadLayout(null)

      expect(onError).not.toHaveBeenCalled()
      expect(mockDownloadFn).not.toHaveBeenCalled()
    })

    it('should call downloadService.downloadImageFromUrl with the layout url', async () => {
      const onError = vi.fn()
      const { result } = renderHook(() =>
        useImageDownload({ selectedSize: SIZE_OPTIONS[0], onError })
      )

      await result.current.downloadLayout('data:image/png;base64,abc==')

      expect(mockDownloadFn).toHaveBeenCalledWith('data:image/png;base64,abc==', expect.stringContaining('layout'), 300)
      expect(onError).not.toHaveBeenCalled()
    })

    it('should call onError when download throws', async () => {
      const onError = vi.fn()
      mockDownloadFn.mockRejectedValueOnce(new Error('Download failed'))

      const { result } = renderHook(() =>
        useImageDownload({ selectedSize: SIZE_OPTIONS[0], onError })
      )

      await result.current.downloadLayout('data:image/png;base64,abc==')

      expect(onError).toHaveBeenCalledWith(['Download failed'])
    })
  })
})
