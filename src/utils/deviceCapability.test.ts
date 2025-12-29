import { describe, it, expect, beforeEach, vi } from 'vitest'
import { detectDeviceCapability, getPerformanceClass } from './deviceCapability'

describe('deviceCapability', () => {
  beforeEach(() => {
    // Reset navigator mock before each test
    vi.stubGlobal('navigator', {
      hardwareConcurrency: 4,
    })
  })

  describe('detectDeviceCapability', () => {
    it('should detect high-end device with more than 4 cores', () => {
      vi.stubGlobal('navigator', {
        hardwareConcurrency: 8,
      })

      const result = detectDeviceCapability()

      expect(result.hardwareConcurrency).toBe(8)
      expect(result.performanceClass).toBe('high')
    })

    it('should detect mid-range device with 4 cores', () => {
      vi.stubGlobal('navigator', {
        hardwareConcurrency: 4,
      })

      const result = detectDeviceCapability()

      expect(result.hardwareConcurrency).toBe(4)
      expect(result.performanceClass).toBe('medium')
    })

    it('should detect mid-range device with 3 cores', () => {
      vi.stubGlobal('navigator', {
        hardwareConcurrency: 3,
      })

      const result = detectDeviceCapability()

      expect(result.hardwareConcurrency).toBe(3)
      expect(result.performanceClass).toBe('medium')
    })

    it('should detect low-end device with 2 cores', () => {
      vi.stubGlobal('navigator', {
        hardwareConcurrency: 2,
      })

      const result = detectDeviceCapability()

      expect(result.hardwareConcurrency).toBe(2)
      expect(result.performanceClass).toBe('low')
    })

    it('should detect low-end device with 1 core', () => {
      vi.stubGlobal('navigator', {
        hardwareConcurrency: 1,
      })

      const result = detectDeviceCapability()

      expect(result.hardwareConcurrency).toBe(1)
      expect(result.performanceClass).toBe('low')
    })

    it('should default to 2 cores (low-end) when hardwareConcurrency is undefined', () => {
      vi.stubGlobal('navigator', {})

      const result = detectDeviceCapability()

      expect(result.hardwareConcurrency).toBe(2)
      expect(result.performanceClass).toBe('low')
    })

    it('should return expected processing time for high-end device', () => {
      vi.stubGlobal('navigator', {
        hardwareConcurrency: 8,
      })

      const result = detectDeviceCapability()

      expect(result.expectedProcessingTime).toBe(3000) // 3 seconds
    })

    it('should return expected processing time for mid-range device', () => {
      vi.stubGlobal('navigator', {
        hardwareConcurrency: 4,
      })

      const result = detectDeviceCapability()

      expect(result.expectedProcessingTime).toBe(5000) // 5 seconds
    })

    it('should return expected processing time for low-end device', () => {
      vi.stubGlobal('navigator', {
        hardwareConcurrency: 2,
      })

      const result = detectDeviceCapability()

      expect(result.expectedProcessingTime).toBe(5000) // 5 seconds for low-end
    })
  })

  describe('getPerformanceClass', () => {
    it('should return "high" for more than 4 cores', () => {
      expect(getPerformanceClass(8)).toBe('high')
      expect(getPerformanceClass(6)).toBe('high')
      expect(getPerformanceClass(5)).toBe('high')
    })

    it('should return "medium" for 3-4 cores', () => {
      expect(getPerformanceClass(4)).toBe('medium')
      expect(getPerformanceClass(3)).toBe('medium')
    })

    it('should return "low" for 2 or fewer cores', () => {
      expect(getPerformanceClass(2)).toBe('low')
      expect(getPerformanceClass(1)).toBe('low')
      expect(getPerformanceClass(0)).toBe('low')
    })
  })
})
