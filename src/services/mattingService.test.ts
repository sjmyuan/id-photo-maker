import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  mockMattingService, 
  removeBackground, 
  applyBackgroundColor,
  MattingService,
  removeBackgroundWithTransformer 
} from './mattingService'

// Helper to create a test image
function createTestImage(width: number = 100, height: number = 100): HTMLImageElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (ctx) {
    // Draw a simple test pattern
    ctx.fillStyle = 'blue'
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = 'white'
    ctx.fillRect(25, 25, 50, 50)
  }
  
  const img = new Image()
  img.src = canvas.toDataURL()
  img.width = width
  img.height = height
  return img
}

describe('mattingService', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('mockMattingService (legacy)', () => {
    it('should complete matting within expected time for high-end device', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const expectedTime = 3000

      const promise = mockMattingService(file, expectedTime)

      // Advance timers by expected time
      vi.advanceTimersByTime(expectedTime)

      const result = await promise

      expect(result).toBeDefined()
      expect(result.type).toBe('image/png')
    })

    it('should complete matting within expected time for mid-range device', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const expectedTime = 5000

      const promise = mockMattingService(file, expectedTime)

      // Advance timers by expected time
      vi.advanceTimersByTime(expectedTime)

      const result = await promise

      expect(result).toBeDefined()
      expect(result.type).toBe('image/png')
    })

    it('should return processed image result', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 }) // 5MB
      const expectedTime = 3000

      const promise = mockMattingService(file, expectedTime)

      vi.advanceTimersByTime(expectedTime)

      const result = await promise

      expect(result).toBeInstanceOf(Blob)
      expect(result.size).toBeGreaterThan(0)
      expect(result.type).toBe('image/png')
    })

    it('should simulate processing time accurately', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const expectedTime = 4000

      const startTime = Date.now()
      const promise = mockMattingService(file, expectedTime)

      vi.advanceTimersByTime(expectedTime)

      await promise
      const endTime = Date.now()

      expect(endTime - startTime).toBe(expectedTime)
    })

    it('should handle errors gracefully when file processing fails', async () => {
      const file = new File([], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 0 })
      const expectedTime = 3000

      const promise = mockMattingService(file, expectedTime)

      vi.advanceTimersByTime(expectedTime)

      await expect(promise).rejects.toThrow('Invalid file for matting')
    })

    it('should accept different expected processing times', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      // Test with 2 seconds
      const promise1 = mockMattingService(file, 2000)
      vi.advanceTimersByTime(2000)
      const result1 = await promise1
      expect(result1).toBeDefined()

      // Test with 6 seconds
      const promise2 = mockMattingService(file, 6000)
      vi.advanceTimersByTime(6000)
      const result2 = await promise2
      expect(result2).toBeDefined()
    })

    it('should return PNG format for matted image', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const expectedTime = 3000

      const promise = mockMattingService(file, expectedTime)
      vi.advanceTimersByTime(expectedTime)

      const result = await promise

      expect(result.type).toBe('image/png')
    })
  })

  describe('removeBackground', () => {
    beforeEach(() => {
      vi.useRealTimers() // Use real timers for actual image processing
    })

    it('should accept an HTMLImageElement and return MattingResult', async () => {
      const img = createTestImage()
      
      const result = await removeBackground(img, { quickMode: false })
      
      expect(result).toBeDefined()
      expect(result.processedImage).toBeInstanceOf(HTMLCanvasElement)
      expect(result.foregroundMask).toBeInstanceOf(ImageData)
      expect(result.processingTime).toBeGreaterThan(0)
      expect(result.quality).toBeDefined()
    })

    it('should generate transparent PNG output', async () => {
      const img = createTestImage()
      
      const result = await removeBackground(img, { quickMode: false })
      
      // Check that the canvas has transparent pixels
      const ctx = result.processedImage.getContext('2d')
      expect(ctx).toBeTruthy()
      
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, result.processedImage.width, result.processedImage.height)
        // Check that there are some transparent pixels (alpha < 255)
        // Count transparent pixels for debugging
        let transparentCount = 0
        for (let i = 3; i < imageData.data.length; i += 4) {
          if (imageData.data[i] < 255) {
            transparentCount++
          }
        }
        
        // For a 100x100 image with center-based algorithm, we expect at least some transparent pixels at the edges
        expect(transparentCount).toBeGreaterThan(0)
      }
    })

    it('should handle quick mode for low-performance devices', async () => {
      const img = createTestImage()
      
      const result = await removeBackground(img, { quickMode: true })
      
      expect(result).toBeDefined()
      expect(result.quality).toBe('low')
      expect(result.processingTime).toBeLessThan(5000)
    })

    it('should provide higher quality in normal mode', async () => {
      const img = createTestImage()
      
      const result = await removeBackground(img, { quickMode: false })
      
      expect(result).toBeDefined()
      expect(['medium', 'high']).toContain(result.quality)
    })

    it('should track processing time accurately', async () => {
      const img = createTestImage()
      
      const startTime = performance.now()
      const result = await removeBackground(img, { quickMode: false })
      const endTime = performance.now()
      
      const actualTime = endTime - startTime
      
      // Processing time should be within 10% of actual elapsed time
      expect(result.processingTime).toBeGreaterThan(0)
      expect(Math.abs(result.processingTime - actualTime)).toBeLessThan(actualTime * 0.1)
    })

    it('should handle different image sizes', async () => {
      const smallImg = createTestImage(50, 50)
      const largeImg = createTestImage(500, 500)
      
      const smallResult = await removeBackground(smallImg, { quickMode: false })
      const largeResult = await removeBackground(largeImg, { quickMode: false })
      
      expect(smallResult.processedImage.width).toBe(50)
      expect(smallResult.processedImage.height).toBe(50)
      expect(largeResult.processedImage.width).toBe(500)
      expect(largeResult.processedImage.height).toBe(500)
    })

    it('should throw error for invalid image input', async () => {
      const invalidImg = new Image()
      // Don't set src or dimensions
      
      await expect(removeBackground(invalidImg, { quickMode: false }))
        .rejects.toThrow()
    })

    it('should include foreground mask in result', async () => {
      const img = createTestImage()
      
      const result = await removeBackground(img, { quickMode: false })
      
      expect(result.foregroundMask).toBeInstanceOf(ImageData)
      expect(result.foregroundMask.width).toBe(img.width)
      expect(result.foregroundMask.height).toBe(img.height)
    })
  })

  describe('applyBackgroundColor', () => {
    beforeEach(() => {
      vi.useRealTimers()
    })

    it('should accept transparent canvas and solid color', async () => {
      const img = createTestImage()
      const mattingResult = await removeBackground(img, { quickMode: false })
      
      const result = applyBackgroundColor(mattingResult.processedImage, '#FF0000')
      
      expect(result).toBeInstanceOf(HTMLCanvasElement)
      expect(result.width).toBe(mattingResult.processedImage.width)
      expect(result.height).toBe(mattingResult.processedImage.height)
    })

    it('should apply red background correctly', async () => {
      const img = createTestImage()
      const mattingResult = await removeBackground(img, { quickMode: false })
      
      const result = applyBackgroundColor(mattingResult.processedImage, '#FF0000')
      const ctx = result.getContext('2d')
      
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, 1, 1)
        const [r] = imageData.data
        // Background should have red component
        expect(r).toBeGreaterThan(0)
      }
    })

    it('should apply blue background correctly', async () => {
      const img = createTestImage()
      const mattingResult = await removeBackground(img, { quickMode: false })
      
      const result = applyBackgroundColor(mattingResult.processedImage, '#0000FF')
      
      expect(result).toBeDefined()
      expect(result).toBeInstanceOf(HTMLCanvasElement)
    })

    it('should apply white background correctly', async () => {
      const img = createTestImage()
      const mattingResult = await removeBackground(img, { quickMode: false })
      
      const result = applyBackgroundColor(mattingResult.processedImage, '#FFFFFF')
      
      expect(result).toBeDefined()
      expect(result).toBeInstanceOf(HTMLCanvasElement)
    })

    it('should support RGB color format', async () => {
      const img = createTestImage()
      const mattingResult = await removeBackground(img, { quickMode: false })
      
      const result = applyBackgroundColor(mattingResult.processedImage, 'rgb(255, 0, 0)')
      
      expect(result).toBeDefined()
      expect(result).toBeInstanceOf(HTMLCanvasElement)
    })

    it('should preserve image dimensions', async () => {
      const img = createTestImage(200, 300)
      const mattingResult = await removeBackground(img, { quickMode: false })
      
      const result = applyBackgroundColor(mattingResult.processedImage, '#FF0000')
      
      expect(result.width).toBe(200)
      expect(result.height).toBe(300)
    })
  })

  describe('MattingService class', () => {
    beforeEach(() => {
      vi.useRealTimers()
    })

    it('should process image and apply background in one workflow', async () => {
      const service = new MattingService()
      const img = createTestImage()
      
      const mattingResult = await service.removeBackground(img, { quickMode: false })
      const finalResult = service.applyBackgroundColor(mattingResult.processedImage, '#FF0000')
      
      expect(mattingResult).toBeDefined()
      expect(finalResult).toBeDefined()
      expect(finalResult).toBeInstanceOf(HTMLCanvasElement)
    })

    it('should handle quick mode through service', async () => {
      const service = new MattingService()
      const img = createTestImage()
      
      const result = await service.removeBackground(img, { quickMode: true })
      
      expect(result.quality).toBe('low')
    })

    it('should provide consistent results across multiple calls', async () => {
      const service = new MattingService()
      const img = createTestImage()
      
      const result1 = await service.removeBackground(img, { quickMode: false })
      const result2 = await service.removeBackground(img, { quickMode: false })
      
      expect(result1.processedImage.width).toBe(result2.processedImage.width)
      expect(result1.processedImage.height).toBe(result2.processedImage.height)
    })
  })

  describe('removeBackgroundWithTransformer (Hugging Face)', () => {
    beforeEach(() => {
      vi.useRealTimers()
    })

    it('should load U-2-Netp model and process image', async () => {
      const img = createTestImage(320, 320)
      
      const result = await removeBackgroundWithTransformer(img)
      
      expect(result).toBeDefined()
      expect(result.processedImage).toBeInstanceOf(HTMLCanvasElement)
      expect(result.foregroundMask).toBeInstanceOf(ImageData)
      expect(result.processingTime).toBeGreaterThan(0)
      expect(result.quality).toBe('high')
    }, 60000) // 60s timeout for model loading

    it('should return mask with correct dimensions', async () => {
      const img = createTestImage(320, 320)
      
      const result = await removeBackgroundWithTransformer(img)
      
      // U-2-Netp outputs 320x320 mask
      expect(result.foregroundMask.width).toBe(320)
      expect(result.foregroundMask.height).toBe(320)
      expect(result.processedImage.width).toBe(320)
      expect(result.processedImage.height).toBe(320)
    }, 60000)

    it('should handle different image sizes by scaling', async () => {
      const img = createTestImage(640, 480)
      
      const result = await removeBackgroundWithTransformer(img)
      
      expect(result).toBeDefined()
      expect(result.processedImage).toBeDefined()
      // Should scale to model input size then back to original
      expect(result.processedImage.width).toBeGreaterThan(0)
      expect(result.processedImage.height).toBeGreaterThan(0)
    }, 60000)

    it('should generate transparent background pixels', async () => {
      const img = createTestImage(320, 320)
      
      const result = await removeBackgroundWithTransformer(img)
      
      const ctx = result.processedImage.getContext('2d')
      expect(ctx).toBeTruthy()
      
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, result.processedImage.width, result.processedImage.height)
        let transparentCount = 0
        for (let i = 3; i < imageData.data.length; i += 4) {
          if (imageData.data[i] === 0) {
            transparentCount++
          }
        }
        
        // Should have some transparent background pixels
        expect(transparentCount).toBeGreaterThan(0)
      }
    }, 60000)

    it('should throw error for invalid image', async () => {
      const invalidImg = new Image()
      
      await expect(removeBackgroundWithTransformer(invalidImg))
        .rejects.toThrow()
    })

    it('should track processing time', async () => {
      const img = createTestImage(320, 320)
      
      const startTime = performance.now()
      const result = await removeBackgroundWithTransformer(img)
      const endTime = performance.now()
      
      const actualTime = endTime - startTime
      
      expect(result.processingTime).toBeGreaterThan(0)
      // Processing time should be reasonable (within 50% margin due to model loading variations)
      expect(Math.abs(result.processingTime - actualTime)).toBeLessThan(actualTime * 0.5)
    }, 60000)

    it('should use model caching for subsequent calls', async () => {
      const img1 = createTestImage(320, 320)
      const img2 = createTestImage(320, 320)
      
      const start1 = performance.now()
      const result1 = await removeBackgroundWithTransformer(img1)
      const time1 = performance.now() - start1
      
      const start2 = performance.now()
      const result2 = await removeBackgroundWithTransformer(img2)
      const time2 = performance.now() - start2
      
      expect(result1).toBeDefined()
      expect(result2).toBeDefined()
      // Second call should be faster due to model caching
      expect(time2).toBeLessThan(time1)
    }, 120000)

    it('should handle small images', async () => {
      const img = createTestImage(100, 100)
      
      const result = await removeBackgroundWithTransformer(img)
      
      expect(result).toBeDefined()
      expect(result.processedImage.width).toBeGreaterThan(0)
      expect(result.processedImage.height).toBeGreaterThan(0)
    }, 60000)

    it('should handle large images', async () => {
      const img = createTestImage(1920, 1080)
      
      const result = await removeBackgroundWithTransformer(img)
      
      expect(result).toBeDefined()
      expect(result.processedImage.width).toBe(1920)
      expect(result.processedImage.height).toBe(1080)
    }, 60000)

    it('should provide foreground mask with alpha channel', async () => {
      const img = createTestImage(320, 320)
      
      const result = await removeBackgroundWithTransformer(img)
      
      expect(result.foregroundMask).toBeInstanceOf(ImageData)
      // Check that mask has both opaque and transparent regions
      let hasOpaque = false
      let hasTransparent = false
      
      for (let i = 3; i < result.foregroundMask.data.length; i += 4) {
        if (result.foregroundMask.data[i] === 255) hasOpaque = true
        if (result.foregroundMask.data[i] === 0) hasTransparent = true
      }
      
      expect(hasOpaque).toBe(true)
      expect(hasTransparent).toBe(true)
    }, 60000)
  })
})

