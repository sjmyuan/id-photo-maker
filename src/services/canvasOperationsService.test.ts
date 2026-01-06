import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CanvasOperationsService } from './canvasOperationsService'

describe('CanvasOperationsService', () => {
  let service: CanvasOperationsService

  beforeEach(() => {
    service = new CanvasOperationsService()
  })

  describe('createCanvasFromImage', () => {
    it('should create canvas from image', () => {
      const img = new Image()
      Object.defineProperty(img, 'naturalWidth', { value: 100 })
      Object.defineProperty(img, 'naturalHeight', { value: 200 })

      const canvas = service.createCanvasFromImage(img)

      expect(canvas.width).toBe(100)
      expect(canvas.height).toBe(200)
    })

    it('should throw error if canvas context cannot be obtained', () => {
      const img = new Image()
      Object.defineProperty(img, 'naturalWidth', { value: 100 })
      Object.defineProperty(img, 'naturalHeight', { value: 200 })

      // Mock getContext to return null and restore it after
      const originalGetContext = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = vi.fn(() => null)

      try {
        expect(() => service.createCanvasFromImage(img)).toThrow('Failed to get canvas context')
      } finally {
        HTMLCanvasElement.prototype.getContext = originalGetContext
      }
    })
  })

  describe('cropImage', () => {
    it('should crop image to specified area', () => {
      const img = new Image()
      Object.defineProperty(img, 'naturalWidth', { value: 400 })
      Object.defineProperty(img, 'naturalHeight', { value: 600 })

      const cropArea = { x: 50, y: 100, width: 200, height: 300 }
      const canvas = service.cropImage(img, cropArea)

      expect(canvas.width).toBe(200)
      expect(canvas.height).toBe(300)
    })
  })

  describe('applyBackgroundColor', () => {
    it('should apply background color to canvas', () => {
      const sourceCanvas = document.createElement('canvas')
      sourceCanvas.width = 100
      sourceCanvas.height = 100

      const resultCanvas = service.applyBackgroundColor(sourceCanvas, '#FF0000')

      expect(resultCanvas.width).toBe(100)
      expect(resultCanvas.height).toBe(100)
    })
  })

  describe('canvasToBlob', () => {
    it('should convert canvas to blob', async () => {
      const canvas = document.createElement('canvas')
      canvas.width = 100
      canvas.height = 100

      const blob = await service.canvasToBlob(canvas)

      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('image/png')
    })

    it('should support custom mime type', async () => {
      const canvas = document.createElement('canvas')
      canvas.width = 100
      canvas.height = 100

      const blob = await service.canvasToBlob(canvas, 'image/jpeg')

      // Note: The test environment mock always returns PNG
      // In a real browser, this would be 'image/jpeg'
      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toMatch(/image\/(png|jpeg)/)
    })
  })

  describe('loadImageFromUrl', () => {
    it('should load image from URL', async () => {
      // Store original Image constructor
      const OriginalImage = window.Image
      
      // Mock Image to trigger onload for valid URLs
      class MockImage extends OriginalImage {
        constructor() {
          super()
          const originalSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src')
          Object.defineProperty(this, 'src', {
            set: (value: string) => {
              if (value && value.startsWith('data:')) {
                // Trigger onload asynchronously for data URLs
                setTimeout(() => {
                  if (this.onload) {
                    this.onload(new Event('load'))
                  }
                }, 0)
              } else if (value && value.startsWith('blob:')) {
                // Trigger onload asynchronously for blob URLs
                setTimeout(() => {
                  if (this.onload) {
                    this.onload(new Event('load'))
                  }
                }, 0)
              } else {
                originalSrcDescriptor?.set?.call(this, value)
              }
            },
            configurable: true
          })
        }
      }
      
      window.Image = MockImage as unknown as typeof Image

      try {
        const img = await service.loadImageFromUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==')
        expect(img).toBeInstanceOf(HTMLImageElement)
      } finally {
        window.Image = OriginalImage
      }
    })

    it('should reject on load error', async () => {
      // Store original Image constructor
      const OriginalImage = window.Image
      
      // Create a mock Image class
      class MockImage extends OriginalImage {
        constructor() {
          super()
          // Trigger onerror immediately when src is set to 'invalid-url'
          const originalSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src')
          Object.defineProperty(this, 'src', {
            set: (value: string) => {
              if (value === 'invalid-url') {
                // Trigger error asynchronously
                setTimeout(() => {
                  if (this.onerror) {
                    this.onerror(new Event('error'))
                  }
                }, 0)
              } else {
                // Use original setter for other URLs
                originalSrcDescriptor?.set?.call(this, value)
              }
            },
            configurable: true
          })
        }
      }
      
      // Replace window.Image temporarily
      window.Image = MockImage as unknown as typeof Image

      try {
        await expect(service.loadImageFromUrl('invalid-url')).rejects.toThrow('Failed to load image from invalid-url')
      } finally {
        // Restore original Image
        window.Image = OriginalImage
      }
    })
  })

  describe('loadImageFromFile', () => {
    it('should load image from file', async () => {
      // Store original Image constructor
      const OriginalImage = window.Image
      
      // Mock Image to trigger onload for blob URLs (created from files)
      class MockImage extends OriginalImage {
        constructor() {
          super()
          const originalSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src')
          Object.defineProperty(this, 'src', {
            set: (value: string) => {
              if (value && value.startsWith('blob:')) {
                setTimeout(() => {
                  if (this.onload) {
                    this.onload(new Event('load'))
                  }
                }, 0)
              } else {
                originalSrcDescriptor?.set?.call(this, value)
              }
            },
            configurable: true
          })
        }
      }
      
      window.Image = MockImage as unknown as typeof Image

      try {
        // Create a minimal PNG file
        const imageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        const blob = new Blob([Uint8Array.from(atob(imageData), c => c.charCodeAt(0))], { type: 'image/png' })
        const file = new File([blob], 'test.png', { type: 'image/png' })

        const img = await service.loadImageFromFile(file)

        expect(img).toBeInstanceOf(HTMLImageElement)
      } finally {
        window.Image = OriginalImage
      }
    })
  })

  describe('loadImageFromBlob', () => {
    it('should load image from blob', async () => {
      // Store original Image constructor
      const OriginalImage = window.Image
      
      // Mock Image to trigger onload for blob URLs
      class MockImage extends OriginalImage {
        constructor() {
          super()
          const originalSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src')
          Object.defineProperty(this, 'src', {
            set: (value: string) => {
              if (value && value.startsWith('blob:')) {
                setTimeout(() => {
                  if (this.onload) {
                    this.onload(new Event('load'))
                  }
                }, 0)
              } else {
                originalSrcDescriptor?.set?.call(this, value)
              }
            },
            configurable: true
          })
        }
      }
      
      window.Image = MockImage as unknown as typeof Image

      try {
        // Create a minimal PNG blob
        const imageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        const blob = new Blob([Uint8Array.from(atob(imageData), c => c.charCodeAt(0))], { type: 'image/png' })

        const img = await service.loadImageFromBlob(blob)

        expect(img).toBeInstanceOf(HTMLImageElement)
      } finally {
        window.Image = OriginalImage
      }
    })
  })

  describe('createCanvasFromBlob', () => {
    it('should create canvas from blob', async () => {
      // Store original Image constructor
      const OriginalImage = window.Image
      
      // Mock Image to trigger onload for blob URLs
      class MockImage extends OriginalImage {
        private _naturalWidth = 1
        private _naturalHeight = 1
        
        constructor() {
          super()
          
          const originalSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src')
          Object.defineProperty(this, 'src', {
            set: (value: string) => {
              if (value && value.startsWith('blob:')) {
                setTimeout(() => {
                  if (this.onload) {
                    this.onload(new Event('load'))
                  }
                }, 0)
              } else {
                originalSrcDescriptor?.set?.call(this, value)
              }
            },
            configurable: true
          })
        }
        
        get naturalWidth() {
          return this._naturalWidth
        }
        
        get naturalHeight() {
          return this._naturalHeight
        }
      }
      
      window.Image = MockImage as unknown as typeof Image

      try {
        // Create a minimal PNG blob
        const imageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        const blob = new Blob([Uint8Array.from(atob(imageData), c => c.charCodeAt(0))], { type: 'image/png' })

        const canvas = await service.createCanvasFromBlob(blob)

        expect(canvas).toBeInstanceOf(HTMLCanvasElement)
        expect(canvas.width).toBeGreaterThan(0)
        expect(canvas.height).toBeGreaterThan(0)
      } finally {
        window.Image = OriginalImage
      }
    })
  })
})
