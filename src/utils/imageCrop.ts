/**
 * Image manipulation utilities using the Canvas API
 * Used for downscaling images before /detect and cropping before /process
 */

import type { CropArea } from './cropAreaCalculation'

/** Maximum pixels on the longest side when sending an image to /detect */
const DETECT_MAX_PX = 800

/**
 * Loads an image from a File and resolves with its natural dimensions.
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}

/**
 * Downscale an image so that its longest side is at most `maxPx` pixels.
 * If the image is already within limits it is still reprocessed through canvas
 * so the return type is always a consistent JPEG File.
 */
export async function downscaleImageForDetect(
  file: File,
  maxPx = DETECT_MAX_PX,
): Promise<File> {
  const url = URL.createObjectURL(file)
  const img = await loadImage(url)
  URL.revokeObjectURL(url)

  const { naturalWidth: origW, naturalHeight: origH } = img
  const scale = Math.min(1, maxPx / Math.max(origW, origH))
  const destW = Math.round(origW * scale)
  const destH = Math.round(origH * scale)

  const canvas = document.createElement('canvas')
  canvas.width = destW
  canvas.height = destH
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, destW, destH)

  const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92)
  return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
}

/**
 * Crop an image to the given absolute-pixel crop area.
 * Returns a new JPEG File containing only the cropped region.
 */
export async function cropImageToArea(file: File, cropArea: CropArea): Promise<File> {
  const url = URL.createObjectURL(file)
  const img = await loadImage(url)
  URL.revokeObjectURL(url)

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(cropArea.width)
  canvas.height = Math.round(cropArea.height)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(
    img,
    Math.round(cropArea.x),
    Math.round(cropArea.y),
    Math.round(cropArea.width),
    Math.round(cropArea.height),
    0,
    0,
    Math.round(cropArea.width),
    Math.round(cropArea.height),
  )

  const blob = await canvasToBlob(canvas, 'image/jpeg', 0.95)
  return new File([blob], file.name.replace(/\.[^.]+$/, '-crop.jpg'), { type: 'image/jpeg' })
}

// ── helpers ──────────────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('canvas.toBlob returned null'))
      },
      type,
      quality,
    )
  })
}
