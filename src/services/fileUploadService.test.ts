import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FileUploadService } from './fileUploadService'

describe('FileUploadService', () => {
  let service: FileUploadService

  beforeEach(() => {
    service = new FileUploadService()
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()
  })

  describe('handleUpload', () => {
    it('should create object URL for uploaded file', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })

      const result = service.handleUpload(file)

      expect(result.file).toBe(file)
      expect(result.url).toBe('blob:mock-url')
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(file)
    })

    it('should track created URLs', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })

      service.handleUpload(file)
      service.revokeAllUrls()

      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    })
  })

  describe('revokeUrl', () => {
    it('should revoke specific URL', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
      const { url } = service.handleUpload(file)

      service.revokeUrl(url)

      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(url)
    })

    it('should not revoke URL that was not tracked', () => {
      service.revokeUrl('blob:untracked-url')

      expect(global.URL.revokeObjectURL).not.toHaveBeenCalled()
    })

    it('should remove URL from tracking after revoke', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
      const { url } = service.handleUpload(file)

      service.revokeUrl(url)
      vi.clearAllMocks()

      // Try to revoke again
      service.revokeUrl(url)
      expect(global.URL.revokeObjectURL).not.toHaveBeenCalled()
    })
  })

  describe('revokeAllUrls', () => {
    it('should revoke all tracked URLs', () => {
      const file1 = new File(['content1'], 'test1.jpg', { type: 'image/jpeg' })
      const file2 = new File(['content2'], 'test2.jpg', { type: 'image/jpeg' })

      // Mock different URLs for different files
      let callCount = 0
      global.URL.createObjectURL = vi.fn(() => {
        callCount++
        return `blob:mock-url-${callCount}`
      })

      service.handleUpload(file1)
      service.handleUpload(file2)

      service.revokeAllUrls()

      expect(global.URL.revokeObjectURL).toHaveBeenCalledTimes(2)
    })

    it('should clear tracking after revoking all', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
      service.handleUpload(file)

      service.revokeAllUrls()
      vi.clearAllMocks()

      // Try to revoke all again
      service.revokeAllUrls()
      expect(global.URL.revokeObjectURL).not.toHaveBeenCalled()
    })
  })

  describe('createTemporaryUrl', () => {
    it('should create URL without tracking', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })

      const url = service.createTemporaryUrl(file)

      expect(url).toBe('blob:mock-url')
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(file)

      // Should not be revoked when revoking all
      vi.clearAllMocks()
      service.revokeAllUrls()
      expect(global.URL.revokeObjectURL).not.toHaveBeenCalled()
    })
  })

  describe('createTemporaryBlobUrl', () => {
    it('should create URL from blob without tracking', () => {
      const blob = new Blob(['content'], { type: 'image/jpeg' })

      const url = service.createTemporaryBlobUrl(blob)

      expect(url).toBe('blob:mock-url')
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(blob)
    })
  })

  describe('cleanup', () => {
    it('should revoke all URLs on cleanup', () => {
      const file1 = new File(['content1'], 'test1.jpg', { type: 'image/jpeg' })
      const file2 = new File(['content2'], 'test2.jpg', { type: 'image/jpeg' })

      let callCount = 0
      global.URL.createObjectURL = vi.fn(() => {
        callCount++
        return `blob:mock-url-${callCount}`
      })

      service.handleUpload(file1)
      service.handleUpload(file2)

      service.cleanup()

      expect(global.URL.revokeObjectURL).toHaveBeenCalledTimes(2)
    })
  })
})
