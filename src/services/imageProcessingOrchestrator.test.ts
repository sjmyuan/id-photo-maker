import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ImageProcessingOrchestrator } from './imageProcessingOrchestrator'
import * as faceDetectionService from './faceDetectionService'
import * as mattingService from './mattingService'
import * as imageValidation from './imageValidation'
import * as exactCropService from './exactCropService'
import * as printLayoutService from './printLayoutService'
import { SIZE_OPTIONS } from '../components/size/CropEditor'

vi.mock('./faceDetectionService')
vi.mock('./mattingService')
vi.mock('./imageValidation')
vi.mock('./exactCropService')
vi.mock('./printLayoutService')
vi.mock('./canvasOperationsService', () => ({
  CanvasOperationsService: function () {
    const mockCanvas = document.createElement('canvas')
    mockCanvas.width = 1000
    mockCanvas.height = 1200
    
    const mockImg = {
      naturalWidth: 1000,
      naturalHeight: 1200,
      width: 1000,
      height: 1200,
    } as HTMLImageElement

    return {
      loadImageFromFile: vi.fn().mockResolvedValue(mockImg),
      cropImage: vi.fn().mockReturnValue(mockCanvas),
      canvasToBlob: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'image/png' })),
      createCanvasFromBlob: vi.fn().mockResolvedValue(mockCanvas),
      loadImageFromBlob: vi.fn().mockResolvedValue(mockImg),
      applyBackgroundColor: vi.fn().mockReturnValue(mockCanvas),
    }
  },
}))

describe('ImageProcessingOrchestrator', () => {
  let orchestrator: ImageProcessingOrchestrator
  let mockFile: File

  beforeEach(() => {
    orchestrator = new ImageProcessingOrchestrator()
    mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

    // Reset all mocks
    vi.clearAllMocks()
  })

  describe('processImage - validation errors', () => {
    it('should return validation errors when file is invalid', async () => {
      vi.spyOn(imageValidation, 'validateImageFile').mockResolvedValue({
        isValid: false,
        fileSize: 1024,
        needsScaling: false,
        dimensions: { width: 100, height: 100 },
        errors: ['Invalid file type'],
        warnings: [],
      })

      const result = await orchestrator.processImage({
        file: mockFile,
        selectedSize: SIZE_OPTIONS[0],
        backgroundColor: '#FFFFFF',
        paperType: '6-inch',
        u2netModel: {} as never,
        faceDetectionModel: {} as never,
      })

      expect(result.errors).toHaveLength(1)
      expect(result.errors![0].type).toBe('validation')
      expect(result.errors![0].message).toBe('Invalid file type')
    })

    it('should collect warnings from validation', async () => {
      vi.spyOn(imageValidation, 'validateImageFile').mockResolvedValue({
        isValid: true,
        fileSize: 1024,
        needsScaling: false,
        dimensions: { width: 100, height: 100 },
        errors: [],
        warnings: ['Image size is large'],
      })

      vi.spyOn(faceDetectionService, 'detectFaces').mockResolvedValue({
        faces: [],
      })

      const result = await orchestrator.processImage({
        file: mockFile,
        selectedSize: SIZE_OPTIONS[0],
        backgroundColor: '#FFFFFF',
        paperType: '6-inch',
        u2netModel: {} as never,
        faceDetectionModel: {} as never,
      })

      expect(result.warnings).toContain('Image size is large')
    })
  })

  describe('processImage - face detection errors', () => {
    beforeEach(() => {
      vi.spyOn(imageValidation, 'validateImageFile').mockResolvedValue({
        isValid: true,
        fileSize: 1024,
        needsScaling: false,
        dimensions: { width: 100, height: 100 },
        errors: [],
        warnings: [],
      })
    })

    it('should return error when face detection model is not loaded', async () => {
      const result = await orchestrator.processImage({
        file: mockFile,
        selectedSize: SIZE_OPTIONS[0],
        backgroundColor: '#FFFFFF',
        paperType: '6-inch',
        u2netModel: {} as never,
        faceDetectionModel: null,
      })

      expect(result.errors).toHaveLength(1)
      expect(result.errors![0].type).toBe('face-detection')
      expect(result.errors![0].message).toContain('model not loaded')
    })

    it('should return error when no face is detected', async () => {
      vi.spyOn(faceDetectionService, 'detectFaces').mockResolvedValue({
        faces: [],
      })

      const result = await orchestrator.processImage({
        file: mockFile,
        selectedSize: SIZE_OPTIONS[0],
        backgroundColor: '#FFFFFF',
        paperType: '6-inch',
        u2netModel: {} as never,
        faceDetectionModel: {} as never,
      })

      expect(result.errors).toHaveLength(1)
      expect(result.errors![0].type).toBe('face-detection')
      expect(result.errors![0].message).toContain('No face detected')
    })

    it('should return error when multiple faces are detected', async () => {
      vi.spyOn(faceDetectionService, 'detectFaces').mockResolvedValue({
        faces: [
          { x: 0, y: 0, width: 100, height: 100 },
          { x: 200, y: 0, width: 100, height: 100 },
        ],
      })

      const result = await orchestrator.processImage({
        file: mockFile,
        selectedSize: SIZE_OPTIONS[0],
        backgroundColor: '#FFFFFF',
        paperType: '6-inch',
        u2netModel: {} as never,
        faceDetectionModel: {} as never,
      })

      expect(result.errors).toHaveLength(1)
      expect(result.errors![0].type).toBe('face-detection')
      expect(result.errors![0].message).toContain('Multiple faces')
    })
  })

  describe('processImage - DPI errors', () => {
    beforeEach(() => {
      vi.spyOn(imageValidation, 'validateImageFile').mockResolvedValue({
        isValid: true,
        fileSize: 1024,
        needsScaling: false,
        dimensions: { width: 100, height: 100 },
        errors: [],
        warnings: [],
      })

      // Mock a face detection with small image dimensions (low DPI)
      vi.spyOn(faceDetectionService, 'detectFaces').mockResolvedValue({
        faces: [{ x: 10, y: 10, width: 50, height: 50 }],
      })
    })

    it('should return DPI error when resolution is too low', async () => {
      const result = await orchestrator.processImage({
        file: mockFile,
        selectedSize: SIZE_OPTIONS[0],
        backgroundColor: '#FFFFFF',
        paperType: '6-inch',
        u2netModel: {} as never,
        faceDetectionModel: {} as never,
        requiredDPI: 300,
      })

      expect(result.errors).toBeDefined()
      if (result.errors) {
        expect(result.errors[0].type).toBe('dpi')
      }
    })
  })

  describe('processImage - matting errors', () => {
    beforeEach(() => {
      vi.spyOn(imageValidation, 'validateImageFile').mockResolvedValue({
        isValid: true,
        fileSize: 1024,
        needsScaling: false,
        dimensions: { width: 100, height: 100 },
        errors: [],
        warnings: [],
      })

      // Mock sufficient face and DPI
      vi.spyOn(faceDetectionService, 'detectFaces').mockResolvedValue({
        faces: [{ x: 100, y: 100, width: 800, height: 1000 }],
      })
    })

    it('should return error when U2Net model is not loaded', async () => {
      const result = await orchestrator.processImage({
        file: mockFile,
        selectedSize: SIZE_OPTIONS[0],
        backgroundColor: '#FFFFFF',
        paperType: '6-inch',
        u2netModel: null,
        faceDetectionModel: {} as never,
      })

      expect(result.errors).toHaveLength(1)
      expect(result.errors![0].type).toBe('matting')
    })
  })

  describe('processImage - success case', () => {
    beforeEach(() => {
      // Setup successful mocks
      vi.spyOn(imageValidation, 'validateImageFile').mockResolvedValue({
        isValid: true,
        fileSize: 1024,
        needsScaling: false,
        dimensions: { width: 100, height: 100 },
        errors: [],
        warnings: [],
      })

      vi.spyOn(faceDetectionService, 'detectFaces').mockResolvedValue({
        faces: [{ x: 100, y: 100, width: 800, height: 1000 }],
      })

      vi.spyOn(mattingService, 'processWithU2Net').mockResolvedValue(
        new Blob(['matted'], { type: 'image/png' })
      )

      const mockCanvas = document.createElement('canvas')
      mockCanvas.width = 100
      mockCanvas.height = 100

      vi.spyOn(exactCropService, 'generateExactCrop').mockResolvedValue(mockCanvas)

      vi.spyOn(printLayoutService, 'generatePrintLayoutPreview').mockReturnValue(mockCanvas)
    })

    it('should successfully process image', async () => {
      const result = await orchestrator.processImage({
        file: mockFile,
        selectedSize: SIZE_OPTIONS[0],
        backgroundColor: '#FFFFFF',
        paperType: '6-inch',
        u2netModel: {} as never,
        faceDetectionModel: {} as never,
      })

      expect(result.result).toBeDefined()
      expect(result.result!.originalFile).toBe(mockFile)
      expect(result.result!.transparentCanvas).toBeDefined()
      expect(result.result!.croppedPreviewUrl).toBeDefined()
      expect(result.result!.printLayoutPreviewUrl).toBeDefined()
    })
  })
})
