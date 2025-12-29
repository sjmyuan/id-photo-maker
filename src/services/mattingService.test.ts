import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mockMattingService } from './mattingService'

describe('mattingService', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('mockMattingService', () => {
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
})
