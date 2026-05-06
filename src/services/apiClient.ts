/**
 * API Client
 * Single Responsibility: Communicate with the id-photo-maker-backend REST API
 */

import { type SizeOption } from '../components/size/CropEditor'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000/api'

export interface ApiProcessOptions {
  file: File
  selectedSize: SizeOption
  backgroundColor: string
}

export interface ApiProcessError {
  type: 'validation' | 'matting' | 'processing'
  message: string
}

export interface ApiDetectError {
  type: 'validation' | 'face-detection' | 'processing'
  message: string
}

export interface ApiProcessSuccess {
  idPhotoBase64: string
  warnings: string[]
  errors?: never
}

export interface ApiProcessFailure {
  errors: ApiProcessError[]
  idPhotoBase64?: never
  warnings?: never
}

export type ApiProcessResult = ApiProcessSuccess | ApiProcessFailure

/** Face bbox with all values normalised to the 0–1 range */
export interface NormalisedFaceBox {
  x: number
  y: number
  width: number
  height: number
}

export interface ApiDetectSuccess {
  face: NormalisedFaceBox
  warnings: string[]
  errors?: never
}

export interface ApiDetectFailure {
  errors: ApiDetectError[]
  face?: never
  warnings?: never
}

export type ApiDetectResult = ApiDetectSuccess | ApiDetectFailure

/**
 * Pre-flight face detection check. Validates that exactly one face is present
 * without running background removal — faster than /process.
 */
export async function detectFaceViaApi(file: File): Promise<ApiDetectResult> {
  try {
    const formData = new FormData()
    formData.append('image', file)

    const response = await fetch(`${API_BASE_URL}/detect`, {
      method: 'POST',
      body: formData,
    })

    const json = await response.json() as {
      success: boolean
      face?: NormalisedFaceBox
      warnings?: string[]
      errors?: ApiDetectError[]
    }

    if (!response.ok || !json.success) {
      return {
        errors: json.errors ?? [{ type: 'processing', message: 'Face detection failed' }],
      }
    }

    return {
      face: json.face!,
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

/**
 * Send an image to the backend for full processing (face detection,
 * background removal, exact crop, print layout generation).
 */
export async function processImageViaApi(options: ApiProcessOptions): Promise<ApiProcessResult> {
  const { file, selectedSize, backgroundColor } = options

  try {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('sizeId', selectedSize.id)
    formData.append('backgroundColor', backgroundColor)

    const response = await fetch(`${API_BASE_URL}/process`, {
      method: 'POST',
      body: formData,
    })

    const json = await response.json() as {
      success: boolean
      idPhoto?: string
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
