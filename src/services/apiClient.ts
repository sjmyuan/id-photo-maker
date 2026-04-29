/**
 * API Client
 * Single Responsibility: Communicate with the id-photo-maker-backend REST API
 */

import { type SizeOption } from '../components/size/CropEditor'
import { type PaperType } from '../components/layout/PaperTypeSelector'
import { type PaperMargins } from '../types'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000/api'

export interface ApiProcessOptions {
  file: File
  selectedSize: SizeOption
  backgroundColor: string
  paperType: PaperType
  margins: PaperMargins
  requiredDPI?: number
}

export interface ApiProcessError {
  type: 'validation' | 'face-detection' | 'dpi' | 'matting' | 'processing'
  message: string
}

export interface ApiProcessSuccess {
  idPhotoBase64: string
  printLayoutBase64: string
  warnings: string[]
  errors?: never
}

export interface ApiProcessFailure {
  errors: ApiProcessError[]
  idPhotoBase64?: never
  printLayoutBase64?: never
  warnings?: never
}

export type ApiProcessResult = ApiProcessSuccess | ApiProcessFailure

/**
 * Send an image to the backend for full processing (face detection,
 * background removal, exact crop, print layout generation).
 */
export async function processImageViaApi(options: ApiProcessOptions): Promise<ApiProcessResult> {
  const { file, selectedSize, backgroundColor, paperType, margins, requiredDPI = 300 } = options

  try {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('sizeId', selectedSize.id)
    formData.append('backgroundColor', backgroundColor)
    formData.append('paperType', paperType)
    formData.append('margins', JSON.stringify(margins))
    formData.append('dpi', String(requiredDPI))

    const response = await fetch(`${API_BASE_URL}/process`, {
      method: 'POST',
      body: formData,
    })

    const json = await response.json() as {
      success: boolean
      idPhoto?: string
      printLayout?: string
      warnings?: string[]
      errors?: ApiProcessError[]
    }

    if (!response.ok || !json.success) {
      return {
        errors: json.errors ?? [{ type: 'processing', message: 'Processing failed' }],
      }
    }

    return {
      idPhotoBase64: json.idPhoto!,
      printLayoutBase64: json.printLayout!,
      warnings: json.warnings ?? [],
    }
  } catch (error) {
    return {
      errors: [
        {
          type: 'processing',
          message: error instanceof Error ? error.message : 'Network error',
        },
      ],
    }
  }
}
