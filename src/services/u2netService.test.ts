import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadU2NetModel, processImageWithU2Net } from './u2netService'
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
      const mockModel = {
        session: mockSession,
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
})
