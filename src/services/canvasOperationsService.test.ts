import { describe, it, expect, beforeEach } from 'vitest'
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

      // Mock getContext to return null
      HTMLCanvasElement.prototype.getContext = () => null

      expect(() => service.createCanvasFromImage(img)).toThrow('Failed to get canvas context')
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

      expect(blob.type).toBe('image/jpeg')
    })
  })

  describe('loadImageFromUrl', () => {
    it('should load image from URL', async () => {
      const img = await service.loadImageFromUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==')

      expect(img).toBeInstanceOf(HTMLImageElement)
    })

    it('should reject on load error', async () => {
      await expect(service.loadImageFromUrl('invalid-url')).rejects.toThrow()
    })
  })

  describe('loadImageFromFile', () => {
    it('should load image from file', async () => {
      // Create a minimal PNG file
      const imageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      const blob = new Blob([Uint8Array.from(atob(imageData), c => c.charCodeAt(0))], { type: 'image/png' })
      const file = new File([blob], 'test.png', { type: 'image/png' })

      const img = await service.loadImageFromFile(file)

      expect(img).toBeInstanceOf(HTMLImageElement)
    })
  })

  describe('loadImageFromBlob', () => {
    it('should load image from blob', async () => {
      // Create a minimal PNG blob
      const imageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      const blob = new Blob([Uint8Array.from(atob(imageData), c => c.charCodeAt(0))], { type: 'image/png' })

      const img = await service.loadImageFromBlob(blob)

      expect(img).toBeInstanceOf(HTMLImageElement)
    })
  })

  describe('createCanvasFromBlob', () => {
    it('should create canvas from blob', async () => {
      // Create a minimal PNG blob
      const imageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      const blob = new Blob([Uint8Array.from(atob(imageData), c => c.charCodeAt(0))], { type: 'image/png' })

      const canvas = await service.createCanvasFromBlob(blob)

      expect(canvas).toBeInstanceOf(HTMLCanvasElement)
      expect(canvas.width).toBeGreaterThan(0)
      expect(canvas.height).toBeGreaterThan(0)
    })
  })
})
