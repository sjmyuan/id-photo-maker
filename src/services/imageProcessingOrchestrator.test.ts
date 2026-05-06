import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ImageProcessingOrchestrator } from './imageProcessingOrchestrator'
import * as apiClient from './apiClient'
import * as imageCropModule from '../utils/imageCrop'
import * as cropCalcModule from '../utils/cropAreaCalculation'
import { SIZE_OPTIONS } from '../components/size/CropEditor'

vi.mock('./apiClient')
vi.mock('../utils/imageCrop')
vi.mock('../utils/cropAreaCalculation')

const MOCK_CROP_AREA = { x: 100, y: 80, width: 200, height: 280 }
const MOCK_FACE = { x: 0.3, y: 0.2, width: 0.1, height: 0.14 }

describe('ImageProcessingOrchestrator', () => {
  let orchestrator: ImageProcessingOrchestrator
  let mockFile: File
  let croppedFile: File

  const defaultOptions = {
    file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
    normalisedFace: MOCK_FACE,
    selectedSize: SIZE_OPTIONS[0],
    backgroundColor: '#FFFFFF',
    paperType: '6-inch' as const,
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  }

  beforeEach(() => {
    orchestrator = new ImageProcessingOrchestrator()
    mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    croppedFile = new File(['cropped'], 'test-crop.jpg', { type: 'image/jpeg' })
    vi.clearAllMocks()

    // Default mocks for utils
    vi.spyOn(imageCropModule, 'getImageDimensions').mockResolvedValue({ width: 800, height: 600 })
    vi.spyOn(cropCalcModule, 'calculateCropAreaFromNormalisedFace').mockReturnValue(MOCK_CROP_AREA)
    vi.spyOn(imageCropModule, 'cropImageToArea').mockResolvedValue(croppedFile)
  })

  describe('processImage - success', () => {
    it('should return preview URLs derived from base64 on success', async () => {
      vi.spyOn(apiClient, 'processImageViaApi').mockResolvedValue({
        idPhotoBase64: 'abc123==',
        printLayoutBase64: 'def456==',
        warnings: [],
      })

      const result = await orchestrator.processImage({ ...defaultOptions, file: mockFile })

      expect(result.errors).toBeUndefined()
      expect(result.result).toBeDefined()
      expect(result.result!.croppedPreviewUrl).toBe('data:image/png;base64,abc123==')
      expect(result.result!.printLayoutPreviewUrl).toBe('data:image/png;base64,def456==')
    })

    it('should forward warnings from the API', async () => {
      vi.spyOn(apiClient, 'processImageViaApi').mockResolvedValue({
        idPhotoBase64: 'abc123==',
        printLayoutBase64: 'def456==',
        warnings: ['Image was downscaled'],
      })

      const result = await orchestrator.processImage({ ...defaultOptions, file: mockFile })

      expect(result.warnings).toEqual(['Image was downscaled'])
    })

    it('should send the cropped file (not the original) to the API', async () => {
      const spy = vi.spyOn(apiClient, 'processImageViaApi').mockResolvedValue({
        idPhotoBase64: 'abc==',
        printLayoutBase64: 'def==',
        warnings: [],
      })

      await orchestrator.processImage({ ...defaultOptions, file: mockFile })

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ file: croppedFile }))
    })

    it('should pass non-file options through to the API', async () => {
      const spy = vi.spyOn(apiClient, 'processImageViaApi').mockResolvedValue({
        idPhotoBase64: 'abc==',
        printLayoutBase64: 'def==',
        warnings: [],
      })

      const margins = { top: 5, bottom: 10, left: 3, right: 3 }
      await orchestrator.processImage({
        file: mockFile,
        normalisedFace: MOCK_FACE,
        selectedSize: SIZE_OPTIONS[1],
        backgroundColor: '#FF0000',
        paperType: 'a4',
        margins,
        requiredDPI: 600,
      })

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({
        selectedSize: SIZE_OPTIONS[1],
        backgroundColor: '#FF0000',
        paperType: 'a4',
        margins,
        requiredDPI: 600,
      }))
    })

    it('should compute crop area using the normalised face and selected size aspect ratio', async () => {
      const calcSpy = vi.spyOn(cropCalcModule, 'calculateCropAreaFromNormalisedFace')
      vi.spyOn(apiClient, 'processImageViaApi').mockResolvedValue({
        idPhotoBase64: 'abc==', printLayoutBase64: 'def==', warnings: [],
      })

      await orchestrator.processImage({ ...defaultOptions, file: mockFile })

      expect(calcSpy).toHaveBeenCalledWith(
        MOCK_FACE,
        SIZE_OPTIONS[0].aspectRatio,
        800,
        600,
      )
    })
  })

  describe('processImage - API errors', () => {
    it('should return validation errors from the API', async () => {
      vi.spyOn(apiClient, 'processImageViaApi').mockResolvedValue({
        errors: [{ type: 'validation', message: 'Invalid file type' }],
      })

      const result = await orchestrator.processImage({ ...defaultOptions, file: mockFile })

      expect(result.errors).toHaveLength(1)
      expect(result.errors![0].type).toBe('validation')
      expect(result.errors![0].message).toBe('Invalid file type')
    })

    it('should return multiple errors from the API', async () => {
      vi.spyOn(apiClient, 'processImageViaApi').mockResolvedValue({
        errors: [
          { type: 'validation', message: 'Error 1' },
          { type: 'processing', message: 'Error 2' },
        ],
      })

      const result = await orchestrator.processImage({ ...defaultOptions, file: mockFile })

      expect(result.errors).toHaveLength(2)
    })

    it('should return processing error when API call throws', async () => {
      vi.spyOn(apiClient, 'processImageViaApi').mockRejectedValue(new Error('Network failure'))

      const result = await orchestrator.processImage({ ...defaultOptions, file: mockFile })

      expect(result.errors).toHaveLength(1)
      expect(result.errors![0].type).toBe('processing')
      expect(result.errors![0].message).toContain('Network failure')
    })

    it('should return processing error when crop fails', async () => {
      vi.spyOn(imageCropModule, 'cropImageToArea').mockRejectedValue(new Error('Canvas error'))

      const result = await orchestrator.processImage({ ...defaultOptions, file: mockFile })

      expect(result.errors).toHaveLength(1)
      expect(result.errors![0].type).toBe('processing')
    })
  })
})
