import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateImageFile } from './imageValidation'

describe('imageValidation', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  describe('validateImageFile', () => {
    it('should validate a valid JPEG file under 10MB', async () => {
      const file = new File([''], 'test.jpg', {
        type: 'image/jpeg',
      })
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 }) // 5MB

      // Mock Image constructor and instance
      const mockImage = {
        width: 1920,
        height: 1080,
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.stubGlobal('Image', function(this: any) {
        return mockImage
      })
      vi.stubGlobal('URL', {
        createObjectURL: vi.fn(() => 'blob:test'),
        revokeObjectURL: vi.fn(),
      })

      const promise = validateImageFile(file)
      
      // Trigger onload asynchronously
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload()
        }
      }, 0)

      const result = await promise

      expect(result.isValid).toBe(true)
      expect(result.fileSize).toBe(5 * 1024 * 1024)
      expect(result.needsScaling).toBe(false)
      expect(result.dimensions).toEqual({ width: 1920, height: 1080 })
      expect(result.errors).toEqual([])
      expect(result.warnings).toEqual([])
    })

    it('should validate a valid PNG file under 10MB', async () => {
      const file = new File([''], 'test.png', {
        type: 'image/png',
      })
      Object.defineProperty(file, 'size', { value: 3 * 1024 * 1024 }) // 3MB

      const mockImage = {
        width: 1024,
        height: 768,
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.stubGlobal('Image', function(this: any) {
        return mockImage
      })
      vi.stubGlobal('URL', {
        createObjectURL: vi.fn(() => 'blob:test'),
        revokeObjectURL: vi.fn(),
      })

      const promise = validateImageFile(file)
      
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload()
        }
      }, 0)

      const result = await promise

      expect(result.isValid).toBe(true)
      expect(result.needsScaling).toBe(false)
    })

    it('should validate a valid WebP file under 10MB', async () => {
      const file = new File([''], 'test.webp', {
        type: 'image/webp',
      })
      Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 }) // 2MB

      const mockImage = {
        width: 1280,
        height: 720,
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.stubGlobal('Image', function(this: any) {
        return mockImage
      })
      vi.stubGlobal('URL', {
        createObjectURL: vi.fn(() => 'blob:test'),
        revokeObjectURL: vi.fn(),
      })

      const promise = validateImageFile(file)
      
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload()
        }
      }, 0)

      const result = await promise

      expect(result.isValid).toBe(true)
      expect(result.needsScaling).toBe(false)
    })

    it('should reject invalid file types', async () => {
      const file = new File([''], 'test.pdf', {
        type: 'application/pdf',
      })

      const result = await validateImageFile(file)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid file type. Only JPEG, PNG, and WebP are supported.')
    })

    it('should warn when file size exceeds 10MB and mark needsScaling', async () => {
      const file = new File([''], 'test.jpg', {
        type: 'image/jpeg',
      })
      Object.defineProperty(file, 'size', { value: 12 * 1024 * 1024 }) // 12MB

      const mockImage = {
        width: 4000,
        height: 3000,
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.stubGlobal('Image', function(this: any) {
        return mockImage
      })
      vi.stubGlobal('URL', {
        createObjectURL: vi.fn(() => 'blob:test'),
        revokeObjectURL: vi.fn(),
      })

      const promise = validateImageFile(file)
      
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload()
        }
      }, 0)

      const result = await promise

      expect(result.isValid).toBe(true)
      expect(result.needsScaling).toBe(true)
      expect(result.warnings).toContain('File size exceeds 10MB. Image will be automatically scaled down.')
    })

    it('should extract image dimensions correctly', async () => {
      const file = new File([''], 'test.jpg', {
        type: 'image/jpeg',
      })
      Object.defineProperty(file, 'size', { value: 1 * 1024 * 1024 }) // 1MB

      const mockImage = {
        width: 3840,
        height: 2160,
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.stubGlobal('Image', function(this: any) {
        return mockImage
      })
      vi.stubGlobal('URL', {
        createObjectURL: vi.fn(() => 'blob:test'),
        revokeObjectURL: vi.fn(),
      })

      const promise = validateImageFile(file)
      
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload()
        }
      }, 0)

      const result = await promise

      expect(result.dimensions).toEqual({ width: 3840, height: 2160 })
    })

    it('should handle image loading errors', async () => {
      const file = new File([''], 'test.jpg', {
        type: 'image/jpeg',
      })
      Object.defineProperty(file, 'size', { value: 1 * 1024 * 1024 }) // 1MB

      const mockImage = {
        width: 0,
        height: 0,
        onload: null as (() => void) | null,
        onerror: null as ((error: Event) => void) | null,
        src: '',
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.stubGlobal('Image', function(this: any) {
        return mockImage
      })
      vi.stubGlobal('URL', {
        createObjectURL: vi.fn(() => 'blob:test'),
        revokeObjectURL: vi.fn(),
      })

      const promise = validateImageFile(file)
      
      // Trigger onerror
      setTimeout(() => {
        if (mockImage.onerror) {
          mockImage.onerror(new Event('error'))
        }
      }, 0)

      const result = await promise

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Failed to load image file.')
    })

    it('should set fileSize to actual file size', async () => {
      const file = new File([''], 'test.jpg', {
        type: 'image/jpeg',
      })
      Object.defineProperty(file, 'size', { value: 7890123 }) // Specific byte count

      const mockImage = {
        width: 2000,
        height: 1500,
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.stubGlobal('Image', function(this: any) {
        return mockImage
      })
      vi.stubGlobal('URL', {
        createObjectURL: vi.fn(() => 'blob:test'),
        revokeObjectURL: vi.fn(),
      })

      const promise = validateImageFile(file)
      
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload()
        }
      }, 0)

      const result = await promise

      expect(result.fileSize).toBe(7890123)
    })
  })
})
