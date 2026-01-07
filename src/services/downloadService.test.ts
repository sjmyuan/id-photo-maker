import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DownloadService } from './downloadService'
import * as dpiMetadata from '../utils/dpiMetadata'

vi.mock('../utils/dpiMetadata')

describe('DownloadService', () => {
  let service: DownloadService

  beforeEach(() => {
    service = new DownloadService()

    // Mock URL methods
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()

    // Mock fetch
    global.fetch = vi.fn()

    // Mock embedDPIMetadata to return the same blob
    vi.spyOn(dpiMetadata, 'embedDPIMetadata').mockImplementation(async (blob) => blob)

    // Mock document methods
    document.body.appendChild = vi.fn()
    document.body.removeChild = vi.fn()
  })

  describe('downloadImageFromUrl', () => {
    it('should download image from URL with DPI metadata', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' })
      ;(global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        blob: () => Promise.resolve(mockBlob),
      })

      await service.downloadImageFromUrl('http://example.com/image.png', 'test.png', 300)

      expect(global.fetch).toHaveBeenCalledWith('http://example.com/image.png')
      expect(dpiMetadata.embedDPIMetadata).toHaveBeenCalledWith(mockBlob, 300)
      expect(global.URL.createObjectURL).toHaveBeenCalled()
    })

    it('should use default DPI if not specified', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' })
      ;(global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        blob: () => Promise.resolve(mockBlob),
      })

      await service.downloadImageFromUrl('http://example.com/image.png', 'test.png')

      expect(dpiMetadata.embedDPIMetadata).toHaveBeenCalledWith(mockBlob, 300)
    })
  })

  describe('downloadCanvas', () => {
    it('should download canvas with DPI metadata', async () => {
      const canvas = document.createElement('canvas')
      canvas.width = 100
      canvas.height = 100

      await service.downloadCanvas(canvas, 'test.png', 300)

      expect(dpiMetadata.embedDPIMetadata).toHaveBeenCalled()
      expect(global.URL.createObjectURL).toHaveBeenCalled()
    })

    it('should use custom mime type', async () => {
      const canvas = document.createElement('canvas')
      canvas.width = 100
      canvas.height = 100

      await service.downloadCanvas(canvas, 'test.jpg', 300, 'image/jpeg')

      expect(dpiMetadata.embedDPIMetadata).toHaveBeenCalled()
    })
  })

  describe('downloadBlob', () => {
    it('should download blob directly', () => {
      const blob = new Blob(['test'], { type: 'text/plain' })

      service.downloadBlob(blob, 'test.txt')

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(blob)
      expect(document.body.appendChild).toHaveBeenCalled()
      expect(document.body.removeChild).toHaveBeenCalled()
    })
  })

  describe('triggerDownload', () => {
    it('should create download link and trigger click', () => {
      const blob = new Blob(['test'], { type: 'text/plain' })
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      }

      document.createElement = vi.fn(() => mockLink as unknown as HTMLElement)

      service.downloadBlob(blob, 'test.txt')

      expect(mockLink.click).toHaveBeenCalled()
      expect(mockLink.download).toBe('test.txt')
    })

    it('should clean up URL after download', () => {
      vi.useFakeTimers()

      const blob = new Blob(['test'], { type: 'text/plain' })
      service.downloadBlob(blob, 'test.txt')

      vi.advanceTimersByTime(100)

      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')

      vi.useRealTimers()
    })
  })
})
