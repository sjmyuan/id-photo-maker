/**
 * Image Processing Orchestrator
 * Single Responsibility: Coordinate the image processing pipeline via the backend API
 */

import { type SizeOption } from '../components/size/CropEditor'
import { type PaperType } from '../components/layout/PaperTypeSelector'
import { type PaperMargins } from '../types'
import { processImageViaApi, type ApiProcessError } from './apiClient'

export interface ProcessingResult {
  croppedPreviewUrl: string
  printLayoutPreviewUrl: string
}

export interface ProcessingError {
  type: ApiProcessError['type']
  message: string
}

export interface ProcessingOptions {
  file: File
  selectedSize: SizeOption
  backgroundColor: string
  paperType: PaperType
  margins: PaperMargins
  requiredDPI?: number
}

/**
 * Orchestrates the complete image processing pipeline via the backend API
 */
export class ImageProcessingOrchestrator {
  async processImage(
    options: ProcessingOptions
  ): Promise<{ result?: ProcessingResult; errors?: ProcessingError[]; warnings?: string[] }> {
    const { file, selectedSize, backgroundColor, paperType, margins, requiredDPI = 300 } = options

    try {
      const apiResult = await processImageViaApi({
        file,
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
