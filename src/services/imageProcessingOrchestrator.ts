/**
 * Image Processing Orchestrator
 * Single Responsibility: Coordinate the entire image processing pipeline
 */

import { type SizeOption } from '../components/size/CropEditor'
import { type PaperType } from '../components/layout/PaperTypeSelector'
import { type PaperMargins } from '../types'
import { type FaceDetectionModel, detectFaces } from './faceDetectionService'
import { type U2NetModel, processWithU2Net } from './mattingService'
import { validateImageFile, type ValidationResult } from './imageValidation'
import { calculateInitialCropArea, type CropArea } from '../utils/cropAreaCalculation'
import { calculateDPI } from '../utils/dpiCalculation'
import { generateExactCrop } from './exactCropService'
import { generatePrintLayoutPreview } from './printLayoutService'
import { CanvasOperationsService } from './canvasOperationsService'

export interface ProcessingResult {
  originalFile: File
  originalUrl: string
  transparentCanvas: HTMLCanvasElement
  cropArea: CropArea
  croppedPreviewUrl: string
  printLayoutPreviewUrl: string
}

export interface ProcessingError {
  type: 'validation' | 'face-detection' | 'dpi' | 'matting' | 'processing'
  message: string
}

export interface ProcessingOptions {
  file: File
  selectedSize: SizeOption
  backgroundColor: string
  paperType: PaperType
  margins: PaperMargins
  u2netModel: U2NetModel | null
  faceDetectionModel: FaceDetectionModel | null
  requiredDPI?: number
}

/**
 * Orchestrates the complete image processing pipeline
 */
export class ImageProcessingOrchestrator {
  private canvasOps: CanvasOperationsService

  constructor() {
    this.canvasOps = new CanvasOperationsService()
  }

  /**
   * Process an image through the complete pipeline
   */
  async processImage(
    options: ProcessingOptions
  ): Promise<{ result?: ProcessingResult; errors?: ProcessingError[]; warnings?: string[] }> {
    const {
      file,
      selectedSize,
      backgroundColor,
      paperType,
      margins,
      u2netModel,
      faceDetectionModel,
      requiredDPI = 300,
    } = options

    const warnings: string[] = []

    try {
      // Step 1: Validate the file
      const validation = await this.validateFile(file)
      if (!validation.isValid) {
        return {
          errors: validation.errors.map((msg) => ({ type: 'validation', message: msg })),
        }
      }
      if (validation.warnings.length > 0) {
        warnings.push(...validation.warnings)
      }

      // Step 2: Detect face and calculate crop area
      const faceResult = await this.detectFaceAndCalculateCrop(
        file,
        faceDetectionModel,
        selectedSize,
        requiredDPI
      )
      if (faceResult.errors) {
        return { errors: faceResult.errors, warnings }
      }
      const { cropArea } = faceResult

      // Step 3: Crop the original image
      const croppedCanvas = await this.cropOriginalImage(file, cropArea!)

      // Step 4: Apply matting (background removal)
      const transparentCanvas = await this.applyMatting(croppedCanvas, u2netModel)
      if (!transparentCanvas) {
        return {
          errors: [{ type: 'matting', message: 'Failed to apply background removal' }],
          warnings,
        }
      }

      // Step 5: Generate exact crop with precise dimensions
      const exactCroppedCanvas = await this.generateExactCrop(
        transparentCanvas,
        selectedSize,
        requiredDPI
      )

      // Step 6: Apply background color
      const coloredCanvas = this.canvasOps.applyBackgroundColor(exactCroppedCanvas, backgroundColor)

      // Step 7: Create preview URLs
      const urls = await this.createPreviewUrls(
        file,
        coloredCanvas,
        selectedSize,
        paperType,
        margins
      )

      return {
        result: {
          originalFile: file,
          originalUrl: urls.originalUrl,
          transparentCanvas,
          cropArea: cropArea!,
          croppedPreviewUrl: urls.croppedPreviewUrl,
          printLayoutPreviewUrl: urls.printLayoutPreviewUrl,
        },
        warnings,
      }
    } catch (error) {
      return {
        errors: [
          {
            type: 'processing',
            message: error instanceof Error ? error.message : 'Processing failed',
          },
        ],
        warnings,
      }
    }
  }

  /**
   * Step 1: Validate the file
   */
  private async validateFile(file: File): Promise<ValidationResult> {
    return await validateImageFile(file)
  }

  /**
   * Step 2: Detect face and calculate crop area
   */
  private async detectFaceAndCalculateCrop(
    file: File,
    faceDetectionModel: FaceDetectionModel | null,
    selectedSize: SizeOption,
    requiredDPI: number
  ): Promise<{ cropArea?: CropArea; errors?: ProcessingError[] }> {
    if (!faceDetectionModel) {
      return {
        errors: [
          {
            type: 'face-detection',
            message: 'Face detection model not loaded',
          },
        ],
      }
    }

    const img = await this.canvasOps.loadImageFromFile(file)
    const result = await detectFaces(faceDetectionModel, img)

    // Validate: require exactly one face
    if (result.faces.length === 0) {
      return {
        errors: [
          {
            type: 'face-detection',
            message: 'No face detected in the image. Please upload an image with exactly one face.',
          },
        ],
      }
    } else if (result.faces.length > 1) {
      return {
        errors: [
          {
            type: 'face-detection',
            message:
              'Multiple faces detected in the image. Please upload an image with exactly one face.',
          },
        ],
      }
    }

    const face = result.faces[0]
    const imgWidth = img.naturalWidth
    const imgHeight = img.naturalHeight

    // Calculate initial crop area based on face and selected size
    const cropArea = calculateInitialCropArea(
      face,
      selectedSize.aspectRatio,
      imgWidth,
      imgHeight
    )

    // Validate DPI
    const dpiResult = calculateDPI(
      cropArea.width,
      cropArea.height,
      selectedSize.physicalWidth,
      selectedSize.physicalHeight
    )

    if (dpiResult.minDPI < requiredDPI) {
      return {
        errors: [
          {
            type: 'dpi',
            message:
              `DPI requirement (${requiredDPI} DPI) cannot be met. ` +
              `The calculated DPI is ${Math.round(dpiResult.minDPI)} DPI. ` +
              `Please upload a higher resolution image.`,
          },
        ],
      }
    }

    return { cropArea }
  }

  /**
   * Step 3: Crop the original image
   */
  private async cropOriginalImage(file: File, cropArea: CropArea): Promise<HTMLCanvasElement> {
    const img = await this.canvasOps.loadImageFromFile(file)
    return this.canvasOps.cropImage(img, cropArea)
  }

  /**
   * Step 4: Apply matting (background removal)
   */
  private async applyMatting(
    croppedCanvas: HTMLCanvasElement,
    u2netModel: U2NetModel | null
  ): Promise<HTMLCanvasElement | null> {
    if (!u2netModel) {
      return null
    }

    const croppedBlob = await this.canvasOps.canvasToBlob(croppedCanvas)
    const croppedFile = new File([croppedBlob], 'cropped.png', { type: 'image/png' })

    const mattedBlob = await processWithU2Net(croppedFile, u2netModel)
    return await this.canvasOps.createCanvasFromBlob(mattedBlob)
  }

  /**
   * Step 5: Generate exact crop with precise dimensions
   */
  private async generateExactCrop(
    transparentCanvas: HTMLCanvasElement,
    selectedSize: SizeOption,
    requiredDPI: number
  ): Promise<HTMLCanvasElement> {
    return await generateExactCrop(
      transparentCanvas,
      { x: 0, y: 0, width: transparentCanvas.width, height: transparentCanvas.height },
      selectedSize.physicalWidth,
      selectedSize.physicalHeight,
      requiredDPI
    )
  }

  /**
   * Step 7: Create preview URLs
   */
  private async createPreviewUrls(
    file: File,
    coloredCanvas: HTMLCanvasElement,
    selectedSize: SizeOption,
    paperType: PaperType,
    margins: PaperMargins
  ): Promise<{
    originalUrl: string
    croppedPreviewUrl: string
    printLayoutPreviewUrl: string
  }> {
    // Create URLs for display
    const originalUrl = URL.createObjectURL(file)

    const croppedBlob = await this.canvasOps.canvasToBlob(coloredCanvas)
    const croppedPreviewUrl = URL.createObjectURL(croppedBlob)

    // Generate print layout preview
    const croppedImg = await this.canvasOps.loadImageFromBlob(croppedBlob)
    const printLayoutPreviewCanvas = generatePrintLayoutPreview(
      croppedImg,
      {
        widthMm: selectedSize.physicalWidth,
        heightMm: selectedSize.physicalHeight,
      },
      paperType,
      margins
    )

    const printLayoutBlob = await this.canvasOps.canvasToBlob(printLayoutPreviewCanvas)
    const printLayoutPreviewUrl = URL.createObjectURL(printLayoutBlob)

    return {
      originalUrl,
      croppedPreviewUrl,
      printLayoutPreviewUrl,
    }
  }
}
