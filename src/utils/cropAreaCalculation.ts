/**
 * Crop Area Calculation
 * Converts a normalised face bbox (0–1) into an expanded crop area in pixels
 * that includes head and shoulders — port of the Python backend logic.
 */

export interface NormalisedFaceBox {
  /** Left edge as a fraction of image width (0–1) */
  x: number
  /** Top edge as a fraction of image height (0–1) */
  y: number
  /** Width as a fraction of image width (0–1) */
  width: number
  /** Height as a fraction of image height (0–1) */
  height: number
}

export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Given a normalised face bounding box, compute the expanded crop area in
 * absolute pixels that fits the required aspect ratio and includes head/shoulders.
 *
 * @param normalisedFace - Face bbox with coordinates in 0–1 range
 * @param aspectRatio    - width/height ratio of the target photo size
 * @param imageWidth     - Width of the original image in pixels
 * @param imageHeight    - Height of the original image in pixels
 */
export function calculateCropAreaFromNormalisedFace(
  normalisedFace: NormalisedFaceBox,
  aspectRatio: number,
  imageWidth: number,
  imageHeight: number,
): CropArea {
  // Convert normalised coords to absolute pixels
  const face = {
    x: normalisedFace.x * imageWidth,
    y: normalisedFace.y * imageHeight,
    width: normalisedFace.width * imageWidth,
    height: normalisedFace.height * imageHeight,
  }

  const faceCenterX = face.x + face.width / 2
  const faceCenterY = face.y + face.height / 2

  const clampedCx = Math.max(0, Math.min(faceCenterX, imageWidth))
  const clampedCy = Math.max(0, Math.min(faceCenterY, imageHeight))

  const horizontalExpansion = face.width * 0.4
  const verticalAbove = face.height * 1.0
  const verticalBelow = face.height * 0.6

  const targetW = face.width + 2 * horizontalExpansion
  const targetH = face.height + verticalAbove + verticalBelow

  let cropW: number
  let cropH: number

  if (targetW / targetH > aspectRatio) {
    cropW = targetW
    cropH = cropW / aspectRatio
  } else {
    cropH = targetH
    cropW = cropH * aspectRatio
  }

  let cropX = clampedCx - cropW / 2
  let cropY = clampedCy - cropH / 2

  const exceeds =
    cropX < 0 ||
    cropX + cropW > imageWidth ||
    cropY < 0 ||
    cropY + cropH > imageHeight

  if (exceeds) {
    const maxW = Math.min(clampedCx, imageWidth - clampedCx) * 2
    const maxH = Math.min(clampedCy, imageHeight - clampedCy) * 2

    if (maxW / aspectRatio <= maxH) {
      cropW = maxW
      cropH = maxW / aspectRatio
    } else {
      cropH = maxH
      cropW = maxH * aspectRatio
    }

    cropX = clampedCx - cropW / 2
    cropY = clampedCy - cropH / 2
  }

  return { x: cropX, y: cropY, width: cropW, height: cropH }
}
