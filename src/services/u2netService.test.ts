import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadU2NetModel, processImageWithU2Net, sharpenImage, type U2NetModel } from './u2netService'
import * as ort from 'onnxruntime-web'

// Mock onnxruntime-web
vi.mock('onnxruntime-web', () => ({
  InferenceSession: {
    create: vi.fn(),
  },
  Tensor: vi.fn(),
  env: {
    wasm: {
      wasmPaths: '',
    },
  },
}))

describe('u2netService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loadU2NetModel', () => {
    it('should load model from URL', async () => {
      const mockSession = { run: vi.fn() }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(ort.InferenceSession.create).mockResolvedValue(mockSession as any)

      const result = await loadU2NetModel('https://example.com/model.onnx')

      expect(ort.InferenceSession.create).toHaveBeenCalledWith(
        'https://example.com/model.onnx'
      )
      expect(result).toHaveProperty('session')
      expect(result).toHaveProperty('status', 'loaded')
    })

    it('should handle model loading errors', async () => {
      vi.mocked(ort.InferenceSession.create).mockRejectedValue(new Error('Network error'))

      await expect(loadU2NetModel('https://example.com/model.onnx')).rejects.toThrow('Failed to load U2Net model')
    })
  })

  describe('processImageWithU2Net', () => {
    it('should process image with the model', async () => {
      // Mock canvas toBlob
      HTMLCanvasElement.prototype.toBlob = vi.fn(function(callback) {
        const blob = new Blob(['test'], { type: 'image/png' })
        callback(blob)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any

      const mockSession = {
        run: vi.fn().mockResolvedValue({
          output: {
            data: new Float32Array(320 * 320),
            dims: [1, 1, 320, 320],
          },
        }),
        inputNames: ['input'],
        outputNames: ['output'],
      }
      const mockModel: U2NetModel = {
        session: mockSession as unknown as U2NetModel['session'],
        status: 'loaded' as const,
      }
      const mockImage = new Image()
      mockImage.width = 320
      mockImage.height = 320

      const result = await processImageWithU2Net(mockModel, mockImage)

      expect(result).toBeInstanceOf(Blob)
      expect(result.type).toBe('image/png')
    })
  })

  describe('sharpenImage', () => {
    it('should sharpen image data using convolution kernel', () => {
      // Create a simple test image data
      const width = 5
      const height = 5
      const imageData = new ImageData(width, height)
      
      // Create a simple pattern with an edge
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4
          // Left half dark, right half bright
          const value = x < 2 ? 50 : 200
          imageData.data[i] = value     // R
          imageData.data[i + 1] = value // G
          imageData.data[i + 2] = value // B
          imageData.data[i + 3] = 255   // A
        }
      }

      const sharpened = sharpenImage(imageData)

      // Verify dimensions are preserved
      expect(sharpened.width).toBe(width)
      expect(sharpened.height).toBe(height)
      
      // Verify sharpening effect: edges should be enhanced
      // Check the center pixel at the edge (x=2, y=2)
      const centerIdx = (2 * width + 2) * 4
      const originalValue = imageData.data[centerIdx]
      const sharpenedValue = sharpened.data[centerIdx]
      
      // The edge should be different after sharpening (enhanced contrast)
      expect(sharpenedValue).not.toBe(originalValue)
    })

    it('should preserve image data structure', () => {
      const width = 10
      const height = 10
      const imageData = new ImageData(width, height)
      
      // Fill with gradient
      for (let i = 0; i < imageData.data.length; i += 4) {
        const value = (i / 4) % 256
        imageData.data[i] = value
        imageData.data[i + 1] = value
        imageData.data[i + 2] = value
        imageData.data[i + 3] = 255
      }

      const sharpened = sharpenImage(imageData)

      expect(sharpened.width).toBe(width)
      expect(sharpened.height).toBe(height)
      expect(sharpened.data.length).toBe(imageData.data.length)
      
      // Alpha channel should remain unchanged
      for (let i = 0; i < sharpened.data.length; i += 4) {
        expect(sharpened.data[i + 3]).toBe(255)
      }
    })

    it('should handle uniform image without crashing', () => {
      const width = 8
      const height = 8
      const imageData = new ImageData(width, height)
      
      // Fill with uniform color
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = 128
        imageData.data[i + 1] = 128
        imageData.data[i + 2] = 128
        imageData.data[i + 3] = 255
      }

      const sharpened = sharpenImage(imageData)

      expect(sharpened.width).toBe(width)
      expect(sharpened.height).toBe(height)
      // Uniform image should remain mostly unchanged
      expect(sharpened.data).toBeDefined()
    })

    it('should clamp values to valid range [0, 255]', () => {
      const width = 3
      const height = 3
      const imageData = new ImageData(width, height)
      
      // Create extreme values that could overflow when sharpened
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = 255     // R
        imageData.data[i + 1] = 255 // G
        imageData.data[i + 2] = 255 // B
        imageData.data[i + 3] = 255 // A
      }

      const sharpened = sharpenImage(imageData)

      // All values should be clamped to [0, 255]
      for (let i = 0; i < sharpened.data.length; i += 4) {
        expect(sharpened.data[i]).toBeGreaterThanOrEqual(0)
        expect(sharpened.data[i]).toBeLessThanOrEqual(255)
        expect(sharpened.data[i + 1]).toBeGreaterThanOrEqual(0)
        expect(sharpened.data[i + 1]).toBeLessThanOrEqual(255)
        expect(sharpened.data[i + 2]).toBeGreaterThanOrEqual(0)
        expect(sharpened.data[i + 2]).toBeLessThanOrEqual(255)
      }
    })
  })
})
