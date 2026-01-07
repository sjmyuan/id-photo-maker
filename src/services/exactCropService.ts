/**
 * Exact Crop Service
 * Generates cropped images with exact pixel dimensions based on physical size and DPI requirements
 */

export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export interface PixelDimensions {
  widthPx: number
  heightPx: number
}

/**
 * Calculate exact pixel dimensions needed for a given physical size and DPI
 * 
 * @param widthMm - Physical width in millimeters
 * @param heightMm - Physical height in millimeters
 * @param dpi - Desired DPI (dots per inch)
 * @returns Exact pixel dimensions required
 * 
 * Formula: pixels = (millimeters / 25.4) * DPI
 * 25.4 mm = 1 inch
 */
export function calculateTargetPixelDimensions(
  widthMm: number,
  heightMm: number,
  dpi: number
): PixelDimensions {
  const MM_PER_INCH = 25.4
  
  // Convert mm to inches, then multiply by DPI
  const widthInches = widthMm / MM_PER_INCH
  const heightInches = heightMm / MM_PER_INCH
  
  const widthPx = Math.round(widthInches * dpi)
  const heightPx = Math.round(heightInches * dpi)
  
  return { widthPx, heightPx }
}

/**
 * Generate a cropped canvas with exact pixel dimensions
 * Scales the crop area content to match the target physical size at the specified DPI
 * 
 * @param sourceCanvas - Source canvas containing the image
 * @param cropArea - Area to crop from source (in source canvas coordinates)
 * @param widthMm - Target physical width in millimeters
 * @param heightMm - Target physical height in millimeters
 * @param dpi - Target DPI
 * @returns Canvas with exact pixel dimensions containing scaled and cropped content
 */
export async function generateExactCrop(
  sourceCanvas: HTMLCanvasElement,
  cropArea: CropArea,
  widthMm: number,
  heightMm: number,
  dpi: number
): Promise<HTMLCanvasElement> {
  // Calculate exact target dimensions
  const targetDimensions = calculateTargetPixelDimensions(widthMm, heightMm, dpi)
  
  // Create output canvas with exact dimensions
  const outputCanvas = document.createElement('canvas')
  outputCanvas.width = targetDimensions.widthPx
  outputCanvas.height = targetDimensions.heightPx
  
  const ctx = outputCanvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }
  
  // Draw the cropped and scaled content
  // Source: crop area from source canvas
  // Destination: entire output canvas (will be scaled to fit)
  ctx.drawImage(
    sourceCanvas,
    cropArea.x, cropArea.y, cropArea.width, cropArea.height, // Source rectangle
    0, 0, targetDimensions.widthPx, targetDimensions.heightPx // Destination rectangle
  )
  
  return outputCanvas
}
