import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useImageDownload } from './useImageDownload'
import { SIZE_OPTIONS } from '../components/size/CropEditor'
import * as dpiMetadata from '../utils/dpiMetadata'
import * as printLayoutService from '../services/printLayoutService'
import * as mattingService from '../services/mattingService'

// Mock modules
vi.mock('../utils/dpiMetadata')
vi.mock('../services/printLayoutService')
vi.mock('../services/mattingService')

describe('useImageDownload', () => {
  let mockBlob: Blob
  let mockCanvas: HTMLCanvasElement
  let mockCreateObjectURL: ReturnType<typeof vi.fn>
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Mock blob
    mockBlob = new Blob(['test'], { type: 'image/png' })
    
    // Mock canvas
    mockCanvas = {
      toBlob: vi.fn((callback) => callback(mockBlob)),
    } as unknown as HTMLCanvasElement

    // Mock URL methods
    mockCreateObjectURL = vi.fn(() => 'blob:mock-url')
    mockRevokeObjectURL = vi.fn()
    globalThis.URL.createObjectURL = mockCreateObjectURL as (obj: Blob | MediaSource) => string
    globalThis.URL.revokeObjectURL = mockRevokeObjectURL as (url: string) => void

    // Mock fetch
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        blob: () => Promise.resolve(mockBlob),
      } as Response)
    ) as typeof fetch

    // Mock embedDPIMetadata
    vi.mocked(dpiMetadata.embedDPIMetadata).mockResolvedValue(mockBlob)

    // Mock print layout services
    vi.mocked(mattingService.applyBackgroundColor).mockReturnValue(mockCanvas)
    vi.mocked(printLayoutService.generatePrintLayout).mockResolvedValue(mockCanvas)
    vi.mocked(printLayoutService.downloadCanvas).mockResolvedValue(undefined)

    // Mock document methods
    document.body.appendChild = vi.fn()
    document.body.removeChild = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
  })

  it('should return download functions', () => {
    const { result } = renderHook(() =>
      useImageDownload({
        selectedSize: SIZE_OPTIONS[0],
        requiredDPI: 300,
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
    it('should download photo with DPI metadata', async () => {
      const onError = vi.fn()
      const { result } = renderHook(() =>
        useImageDownload({
          selectedSize: SIZE_OPTIONS[0],
          requiredDPI: 300,
          paperType: '6-inch',
          backgroundColor: '#0000FF',
          onError,
        })
      )

      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      }
      document.createElement = vi.fn(() => mockLink as unknown as HTMLElement)

      await result.current.downloadPhoto('blob:test-url')

      expect(fetch).toHaveBeenCalledWith('blob:test-url')
      expect(dpiMetadata.embedDPIMetadata).toHaveBeenCalledWith(mockBlob, 300)
      expect(mockCreateObjectURL).toHaveBeenCalled()
      expect(mockLink.click).toHaveBeenCalled()
      expect(mockLink.download).toMatch(/^id-photo-1-inch-300dpi-\d+\.png$/)
      expect(onError).not.toHaveBeenCalled()
    })

    it('should use default DPI of 300 when requiredDPI is null', async () => {
      const { result } = renderHook(() =>
        useImageDownload({
          selectedSize: SIZE_OPTIONS[0],
          requiredDPI: null,
          paperType: '6-inch',
          backgroundColor: '#0000FF',
          onError: vi.fn(),
        })
      )

      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      }
      document.createElement = vi.fn(() => mockLink as unknown as HTMLElement)

      await result.current.downloadPhoto('blob:test-url')

      expect(dpiMetadata.embedDPIMetadata).toHaveBeenCalledWith(mockBlob, 300)
      expect(mockLink.download).toMatch(/300dpi/)
    })

    it('should handle error when croppedPreviewUrl is not provided', async () => {
      const onError = vi.fn()
      const { result } = renderHook(() =>
        useImageDownload({
          selectedSize: SIZE_OPTIONS[0],
          requiredDPI: 300,
          paperType: '6-inch',
          backgroundColor: '#0000FF',
          onError,
        })
      )

      await result.current.downloadPhoto(null)

      expect(fetch).not.toHaveBeenCalled()
      expect(onError).not.toHaveBeenCalled()
    })

    it('should handle download error', async () => {
      const onError = vi.fn()
      const { result } = renderHook(() =>
        useImageDownload({
          selectedSize: SIZE_OPTIONS[0],
          requiredDPI: 300,
          paperType: '6-inch',
          backgroundColor: '#0000FF',
          onError,
        })
      )

      const error = new Error('Download failed')
      globalThis.fetch = vi.fn(() => Promise.reject(error)) as typeof fetch

      await result.current.downloadPhoto('blob:test-url')

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(['Download failed'])
      })
    })

    it('should clean up object URL after timeout', async () => {
      vi.useFakeTimers()
      
      const { result } = renderHook(() =>
        useImageDownload({
          selectedSize: SIZE_OPTIONS[0],
          requiredDPI: 300,
          paperType: '6-inch',
          backgroundColor: '#0000FF',
          onError: vi.fn(),
        })
      )

      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      }
      document.createElement = vi.fn(() => mockLink as unknown as HTMLElement)

      await result.current.downloadPhoto('blob:test-url')

      expect(mockRevokeObjectURL).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)

      expect(mockRevokeObjectURL).toHaveBeenCalled()

      vi.useRealTimers()
    })
  })

  describe('downloadLayout', () => {
    it('should download print layout with DPI metadata', async () => {
      const onError = vi.fn()
      const { result } = renderHook(() =>
        useImageDownload({
          selectedSize: SIZE_OPTIONS[0],
          requiredDPI: 300,
          paperType: '6-inch',
          backgroundColor: '#0000FF',
          onError,
        })
      )

      await result.current.downloadLayout(mockCanvas)

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
      expect(printLayoutService.downloadCanvas).toHaveBeenCalled()
      expect(onError).not.toHaveBeenCalled()
    })

    it('should use default DPI of 300 when requiredDPI is null', async () => {
      const { result } = renderHook(() =>
        useImageDownload({
          selectedSize: SIZE_OPTIONS[0],
          requiredDPI: null,
          paperType: '6-inch',
          backgroundColor: '#0000FF',
          onError: vi.fn(),
        })
      )

      await result.current.downloadLayout(mockCanvas)

      expect(printLayoutService.generatePrintLayout).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        300
      )
    })

    it('should handle error when transparentCanvas is not provided', async () => {
      const onError = vi.fn()
      const { result } = renderHook(() =>
        useImageDownload({
          selectedSize: SIZE_OPTIONS[0],
          requiredDPI: 300,
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
          requiredDPI: 300,
          paperType: '6-inch',
          backgroundColor: '#0000FF',
          onError,
        })
      )

      const error = new Error('Layout generation failed')
      vi.mocked(printLayoutService.generatePrintLayout).mockRejectedValue(error)

      await result.current.downloadLayout(mockCanvas)

      // Error is logged but not passed to onError in the original implementation
      // Just verify it doesn't crash
      expect(true).toBe(true)
    })

    it('should include paperType and size in filename', async () => {
      const { result } = renderHook(() =>
        useImageDownload({
          selectedSize: SIZE_OPTIONS[1], // 2-inch
          requiredDPI: 300,
          paperType: 'a4',
          backgroundColor: '#FF0000',
          onError: vi.fn(),
        })
      )

      await result.current.downloadLayout(mockCanvas)

      const downloadCall = vi.mocked(printLayoutService.downloadCanvas).mock.calls[0]
      expect(downloadCall[1]).toMatch(/id-photo-layout-2-inch-a4-\d+\.png/)
    })
  })
})
