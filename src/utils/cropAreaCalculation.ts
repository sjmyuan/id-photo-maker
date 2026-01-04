import { type FaceBox } from '../services/faceDetectionService'

export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Calculate initial crop area based on detected face
 * Expands to include head and shoulders for professional ID photo framing
 * Always centers on face center, shrinks proportionally if exceeding bounds
 */
export function calculateInitialCropArea(
  faceBox: FaceBox,
  aspectRatio: number,
  imageWidth: number,
  imageHeight: number
): CropArea {
  // For ID photos, we need more space:
  // - 150% expansion above the face (for head/hair)
  // - 100% expansion below the face (for shoulders)
  // - 80% expansion on each side (for natural portrait framing)
  
  const faceWidth = faceBox.width
  const faceHeight = faceBox.height
  
  // Calculate face center - this is our anchor point
  const faceCenterX = faceBox.x + faceBox.width / 2
  const faceCenterY = faceBox.y + faceBox.height / 2
  
  // Clamp face center to image bounds (in case face is partially outside)
  const clampedCenterX = Math.max(0, Math.min(faceCenterX, imageWidth))
  const clampedCenterY = Math.max(0, Math.min(faceCenterY, imageHeight))
  
  // Calculate expanded dimensions
  const horizontalExpansion = faceWidth * 0.8
  const verticalExpansionAbove = faceHeight * 1.5
  const verticalExpansionBelow = faceHeight * 1.0
  
  // Calculate target crop dimensions
  const targetWidth = faceWidth + (2 * horizontalExpansion)
  const targetHeight = faceHeight + verticalExpansionAbove + verticalExpansionBelow
  
  // Adjust to match the required aspect ratio
  let cropWidth, cropHeight
  const expandedAspectRatio = targetWidth / targetHeight
  
  if (expandedAspectRatio > aspectRatio) {
    // Expanded area is wider - use width and adjust height
    cropWidth = targetWidth
    cropHeight = cropWidth / aspectRatio
  } else {
    // Expanded area is taller - use height and adjust width
    cropHeight = targetHeight
    cropWidth = cropHeight * aspectRatio
  }
  
  // Calculate initial position centered on face
  let cropX = clampedCenterX - cropWidth / 2
  let cropY = clampedCenterY - cropHeight / 2
  
  // Check if crop area exceeds image bounds
  // If it does, shrink proportionally while maintaining center and aspect ratio
  const exceedsLeft = cropX < 0
  const exceedsRight = cropX + cropWidth > imageWidth
  const exceedsTop = cropY < 0
  const exceedsBottom = cropY + cropHeight > imageHeight
  
  if (exceedsLeft || exceedsRight || exceedsTop || exceedsBottom) {
    // Calculate maximum dimensions that fit within image bounds while centered on face
    const maxWidthFromLeft = clampedCenterX * 2
    const maxWidthFromRight = (imageWidth - clampedCenterX) * 2
    const maxWidthFromCenter = Math.min(maxWidthFromLeft, maxWidthFromRight)
    
    const maxHeightFromTop = clampedCenterY * 2
    const maxHeightFromBottom = (imageHeight - clampedCenterY) * 2
    const maxHeightFromCenter = Math.min(maxHeightFromTop, maxHeightFromBottom)
    
    // Choose the dimension that fits while maintaining aspect ratio
    if (maxWidthFromCenter / aspectRatio <= maxHeightFromCenter) {
      // Width is the limiting factor
      cropWidth = maxWidthFromCenter
      cropHeight = maxWidthFromCenter / aspectRatio
    } else {
      // Height is the limiting factor
      cropHeight = maxHeightFromCenter
      cropWidth = maxHeightFromCenter * aspectRatio
    }
    
    // Recalculate position to maintain center
    cropX = clampedCenterX - cropWidth / 2
    cropY = clampedCenterY - cropHeight / 2
  }
  
  return { x: cropX, y: cropY, width: cropWidth, height: cropHeight }
}
