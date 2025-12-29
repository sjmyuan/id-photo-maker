import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  mockMattingService, 
  removeBackground, 
  applyBackgroundColor,
  MattingService 
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
})

