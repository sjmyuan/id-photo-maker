/**
 * Image Processing Orchestrator
 * Single Responsibility: Coordinate the image processing pipeline via the backend API
 */

import { type SizeOption } from '../components/size/CropEditor'
import { type PaperType } from '../components/layout/PaperTypeSelector'
import { type PaperMargins } from '../types'
import { processImageViaApi, type ApiProcessError, type NormalisedFaceBox } from './apiClient'
import {
  calculateCropAreaFromNormalisedFace,
} from '../utils/cropAreaCalculation'
import { getImageDimensions, cropImageToArea } from '../utils/imageCrop'

export interface ProcessingResult {
  croppedPreviewUrl: string
  printLayoutPreviewUrl: string
}

export interface ProcessingError {
  type: ApiProcessError['type'] | 'crop'
  message: string
}

export interface ProcessingOptions {
  file: File
  normalisedFace: NormalisedFaceBox
  selectedSize: SizeOption
  backgroundColor: string
  paperType: PaperType
  margins: PaperMargins
  requiredDPI?: number
}

/**
 * Orchestrates the complete image processing pipeline via the backend API.
 * Crops the original image client-side before sending to /process.
 */
export class ImageProcessingOrchestrator {
  async processImage(
    options: ProcessingOptions
  ): Promise<{ result?: ProcessingResult; errors?: ProcessingError[]; warnings?: string[] }> {
    const { file, normalisedFace, selectedSize, backgroundColor, paperType, margins, requiredDPI = 300 } = options

    try {
      // 1. Compute the crop area from the normalised face bbox
      const { width: imgW, height: imgH } = await getImageDimensions(file)
      const cropArea = calculateCropAreaFromNormalisedFace(
        normalisedFace,
        selectedSize.aspectRatio,
        imgW,
        imgH,
      )

      // 2. Crop the original image to the face region
      const croppedFile = await cropImageToArea(file, cropArea)

      // 3. Send the cropped image to the backend for background removal + layout
      const apiResult = await processImageViaApi({
        file: croppedFile,
        selectedSize,
        backgroundColor,
        paperType,
        margins,
        requiredDPI,
      })

      if (apiResult.errors) {
        return { errors: apiResult.errors }
      }

      return {
        result: {
          croppedPreviewUrl: `data:image/png;base64,${apiResult.idPhotoBase64}`,
          printLayoutPreviewUrl: `data:image/png;base64,${apiResult.printLayoutBase64}`,
        },
        warnings: apiResult.warnings,
      }
    } catch (error) {
      return {
        errors: [
          {
            type: 'processing',
            message: error instanceof Error ? error.message : 'Processing failed',
          },
        ],
      }
    }
  }
}
