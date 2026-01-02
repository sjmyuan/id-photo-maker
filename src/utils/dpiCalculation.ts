/**
 * DPI Calculation Utility
 * Calculates DPI (dots per inch) for ID photo crop areas
 */

export interface DPIResult {
  widthDPI: number
  heightDPI: number
  minDPI: number
}

/**
 * Calculate DPI based on crop area pixel dimensions and physical size in millimeters
 * 
 * @param widthPx - Width of crop area in pixels
 * @param heightPx - Height of crop area in pixels
 * @param widthMm - Physical width in millimeters
 * @param heightMm - Physical height in millimeters
 * @returns Object containing width DPI, height DPI, and minimum DPI
 * 
 * Formula: DPI = (pixels / millimeters) * 25.4
 * (25.4 mm = 1 inch)
 */
export function calculateDPI(
  widthPx: number,
  heightPx: number,
  widthMm: number,
  heightMm: number
): DPIResult {
  const MM_PER_INCH = 25.4
  
  // Calculate DPI for width and height
  const widthDPI = (widthPx / widthMm) * MM_PER_INCH
  const heightDPI = (heightPx / heightMm) * MM_PER_INCH
  
  // Return the minimum DPI (the limiting factor)
  const minDPI = Math.min(widthDPI, heightDPI)
  
  return {
    widthDPI,
    heightDPI,
    minDPI,
  }
}
