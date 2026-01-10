/**
 * Layout calculation utilities for print-ready ID photo arrangements
 * Handles optimal photo placement on 6-inch photo paper and A4 paper at 300 DPI
 */

import { type PaperMargins } from '../types'

export interface PaperType {
  id: '6-inch' | 'a4'
  label: string
  widthPx: number // Width in pixels at 300 DPI
  heightPx: number // Height in pixels at 300 DPI
}

export interface PhotoSize {
  widthMm: number // Width in millimeters
  heightMm: number // Height in millimeters
}

export interface LayoutResult {
  paperType: '6-inch' | 'a4'
  paperWidthPx: number
  paperHeightPx: number
  photoWidthPx: number
  photoHeightPx: number
  photosPerRow: number
  photosPerColumn: number
  totalPhotos: number
  horizontalSpacingPx: number
  verticalSpacingPx: number
  marginLeftPx: number
  marginTopPx: number
  printerMargins?: {
    topPx: number
    bottomPx: number
    leftPx: number
    rightPx: number
  }
}

/**
 * Standard paper types with dimensions at 300 DPI
 */
export const PAPER_TYPES: Record<'6-inch' | 'a4', PaperType> = {
  '6-inch': {
    id: '6-inch',
    label: '6-inch Photo Paper',
    widthPx: 1200,  // 4 inches × 300 DPI
    heightPx: 1800, // 6 inches × 300 DPI
  },
  'a4': {
    id: 'a4',
    label: 'A4 Paper',
    widthPx: 2480,  // 210mm × (300/25.4) ≈ 2480px
    heightPx: 3508, // 297mm × (300/25.4) ≈ 3508px
  },
}

/**
 * Convert millimeters to pixels at a given DPI
 * Formula: pixels = (mm × DPI) / 25.4
 * 
 * @param mm - Measurement in millimeters
 * @param dpi - Dots per inch (typically 300 for print)
 * @returns Measurement in pixels
 */
export function mmToPixels(mm: number, dpi: number): number {
  return (mm * dpi) / 25.4
}

/**
 * Calculate optimal layout for arranging ID photos on paper
 * Maximizes paper space utilization while maintaining proper spacing
 * 
 * @param paperTypeId - Paper type identifier ('6-inch' or 'a4')
 * @param photoSize - Photo dimensions in millimeters
 * @param dpi - Dots per inch for calculation (default 300)
 * @param margins - Optional printer margins in millimeters (default all 0)
 * @returns Layout result with photo arrangement details
 */
export function calculateLayout(
  paperTypeId: '6-inch' | 'a4',
  photoSize: PhotoSize,
  dpi: number = 300,
  margins?: PaperMargins
): LayoutResult {
  const paperType = PAPER_TYPES[paperTypeId]
  
  // Convert photo dimensions from mm to pixels
  const photoWidthPx = mmToPixels(photoSize.widthMm, dpi)
  const photoHeightPx = mmToPixels(photoSize.heightMm, dpi)
  
  // Convert margins from mm to pixels (default to 0 if not provided)
  const printerMargins = margins ? {
    topPx: mmToPixels(margins.top, dpi),
    bottomPx: mmToPixels(margins.bottom, dpi),
    leftPx: mmToPixels(margins.left, dpi),
    rightPx: mmToPixels(margins.right, dpi),
  } : {
    topPx: 0,
    bottomPx: 0,
    leftPx: 0,
    rightPx: 0,
  }
  
  // Calculate printable area (paper dimensions minus margins)
  const printableWidthPx = paperType.widthPx - printerMargins.leftPx - printerMargins.rightPx
  const printableHeightPx = paperType.heightPx - printerMargins.topPx - printerMargins.bottomPx
  
  // Define minimum spacing between photos (5mm = ~59px at 300 DPI)
  const minSpacingMm = 5
  const minSpacingPx = mmToPixels(minSpacingMm, dpi)
  
  // Calculate how many photos fit in each dimension with minimum spacing
  // Use printable area instead of full paper dimensions
  const photosPerRow = Math.max(1, Math.floor(printableWidthPx / (photoWidthPx + minSpacingPx)))
  const photosPerColumn = Math.max(1, Math.floor(printableHeightPx / (photoHeightPx + minSpacingPx)))
  const totalPhotos = photosPerRow * photosPerColumn
  
  // Calculate actual spacing to distribute photos evenly within printable area
  // If only 1 photo in a dimension, no spacing needed
  const horizontalSpacingPx = photosPerRow > 1
    ? (printableWidthPx - (photosPerRow * photoWidthPx)) / (photosPerRow + 1)
    : 0
  const verticalSpacingPx = photosPerColumn > 1
    ? (printableHeightPx - (photosPerColumn * photoHeightPx)) / (photosPerColumn + 1)
    : 0
  
  // Calculate margins to center the layout within printable area
  // Then add printer margins to offset from paper edge
  const layoutMarginLeftPx = photosPerRow === 1
    ? (printableWidthPx - photoWidthPx) / 2
    : horizontalSpacingPx
  const layoutMarginTopPx = photosPerColumn === 1
    ? (printableHeightPx - photoHeightPx) / 2
    : verticalSpacingPx
  
  // Final margins include both printer margins and layout centering margins
  const marginLeftPx = printerMargins.leftPx + layoutMarginLeftPx
  const marginTopPx = printerMargins.topPx + layoutMarginTopPx
  
  return {
    paperType: paperTypeId,
    paperWidthPx: paperType.widthPx,
    paperHeightPx: paperType.heightPx,
    photoWidthPx,
    photoHeightPx,
    photosPerRow,
    photosPerColumn,
    totalPhotos,
    horizontalSpacingPx,
    verticalSpacingPx,
    marginLeftPx,
    marginTopPx,
    printerMargins: margins ? printerMargins : undefined,
  }
}
