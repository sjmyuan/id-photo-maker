import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { scaleImageToTarget } from './imageScaling'

describe('imageScaling', () => {
  let mockCanvas: HTMLCanvasElement
  let mockContext: CanvasRenderingContext2D
  let mockImage: HTMLImageElement

  beforeEach(() => {
    // Mock Canvas and Context
    mockContext = {
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D

    mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => mockContext),
      toBlob: vi.fn(),
    } as unknown as HTMLCanvasElement

    // Mock document.createElement to return our mock canvas
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return mockCanvas
      }
      return originalCreateElement(tagName)
    })

    // Mock Image
    mockImage = {
      width: 4000,
      height: 3000,
      onload: null as ((this: GlobalEventHandlers, ev: Event) => void) | null,
      onerror: null as ((this: GlobalEventHandlers, ev: Event | string) => void) | null,
      src: '',
    } as unknown as HTMLImageElement

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.stubGlobal('Image', function(this: any) {
      return mockImage
    })

    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:test'),
      revokeObjectURL: vi.fn(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('scaleImageToTarget', () => {
    it('should scale down large image while maintaining aspect ratio', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 15 * 1024 * 1024 }) // 15MB

      const targetMaxSizeMB = 10

      // Mock toBlob to return a smaller file
      mockCanvas.toBlob = vi.fn((callback) => {
        const smallerBlob = new Blob(['smaller'], { type: 'image/jpeg' })
        Object.defineProperty(smallerBlob, 'size', { value: 8 * 1024 * 1024 }) // 8MB
        callback(smallerBlob)
      }) as unknown as typeof mockCanvas.toBlob

      const promise = scaleImageToTarget(file, targetMaxSizeMB)

      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload.call(mockImage, new Event('load'))
        }
      }, 0)

      const result = await promise

      expect(result).toBeDefined()
      expect(result.size).toBeLessThanOrEqual(targetMaxSizeMB * 1024 * 1024)
    })

    it('should maintain aspect ratio when scaling', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 12 * 1024 * 1024 })

      mockImage.width = 4000
      mockImage.height = 3000
      const originalAspectRatio = 4000 / 3000

      mockCanvas.toBlob = vi.fn((callback) => {
        const blob = new Blob(['scaled'], { type: 'image/jpeg' })
        Object.defineProperty(blob, 'size', { value: 8 * 1024 * 1024 })
        callback(blob)
      }) as unknown as typeof mockCanvas.toBlob

      const promise = scaleImageToTarget(file, 10)

      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload.call(mockImage, new Event('load'))
        }
      }, 0)

      await promise

      // Check that canvas dimensions maintain aspect ratio
      const canvasAspectRatio = mockCanvas.width / mockCanvas.height
      expect(Math.abs(canvasAspectRatio - originalAspectRatio)).toBeLessThan(0.01)
    })

    it('should handle scaling errors gracefully', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 12 * 1024 * 1024 })

      const promise = scaleImageToTarget(file, 10)

      setTimeout(() => {
        if (mockImage.onerror) {
          mockImage.onerror(new Event('error'))
        }
      }, 0)

      await expect(promise).rejects.toThrow()
    })

    it('should scale to appropriate dimensions for target file size', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 15 * 1024 * 1024 })

      mockImage.width = 4000
      mockImage.height = 3000

      mockCanvas.toBlob = vi.fn((callback) => {
        const blob = new Blob(['scaled'], { type: 'image/jpeg' })
        Object.defineProperty(blob, 'size', { value: 9 * 1024 * 1024 })
        callback(blob)
      }) as unknown as typeof mockCanvas.toBlob

      const promise = scaleImageToTarget(file, 10)

      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload.call(mockImage, new Event('load'))
        }
      }, 0)

      await promise

      // Canvas should be scaled down from original
      expect(mockCanvas.width).toBeLessThan(4000)
      expect(mockCanvas.height).toBeLessThan(3000)
      expect(mockCanvas.width).toBeGreaterThan(0)
      expect(mockCanvas.height).toBeGreaterThan(0)
    })

    it('should use canvas drawImage to scale the image', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 12 * 1024 * 1024 })

      mockCanvas.toBlob = vi.fn((callback) => {
        const blob = new Blob(['scaled'], { type: 'image/jpeg' })
        Object.defineProperty(blob, 'size', { value: 8 * 1024 * 1024 })
        callback(blob)
      }) as unknown as typeof mockCanvas.toBlob

      const promise = scaleImageToTarget(file, 10)

      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload.call(mockImage, new Event('load'))
        }
      }, 0)

      await promise

      expect(mockContext.drawImage).toHaveBeenCalled()
    })

    it('should handle blob conversion failure', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 12 * 1024 * 1024 })

      mockCanvas.toBlob = vi.fn((callback) => {
        callback(null)
      }) as unknown as typeof mockCanvas.toBlob

      const promise = scaleImageToTarget(file, 10)

      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload.call(mockImage, new Event('load'))
        }
      }, 0)

      await expect(promise).rejects.toThrow('Failed to convert canvas to blob')
    })
  })
})
