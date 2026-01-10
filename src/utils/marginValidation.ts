/**
 * Margin validation utilities for print layout
 * Validates printer margins and calculates printable areas
 */

import { type PaperMargins } from '../types'
import { type PhotoSize } from './layoutCalculation'

export interface MarginValidationResult {
  isValid: boolean
  error?: string
}

export interface AllMarginsValidationResult {
  isValid: boolean
  errors: {
    top?: string
    bottom?: string
    left?: string
    right?: string
  }
}

export interface PrintableArea {
  widthMm: number
  heightMm: number
}

export interface PhotoFitResult {
  canFit: boolean
  message?: string
}

/**
 * Validate a single margin value
 * Margin cannot be negative or exceed 50% of the paper dimension
 * 
 * @param marginMm - Margin value in millimeters
 * @param paperDimensionMm - Full paper dimension in millimeters
 * @param marginName - Name of the margin (for error messages)
 * @returns Validation result with error message if invalid
 */
export function validateMargin(
  marginMm: number,
  paperDimensionMm: number,
  marginName: string
): MarginValidationResult {
  // Check for negative values
  if (marginMm < 0) {
    return {
      isValid: false,
      error: `${marginName} margin cannot be negative`,
    }
  }

  // Check for exceeding 50% of paper dimension
  const maxMargin = paperDimensionMm / 2
  if (marginMm > maxMargin) {
    return {
      isValid: false,
      error: `${marginName} margin cannot exceed ${maxMargin}mm (50% of paper dimension)`,
    }
  }

  return { isValid: true }
}

/**
 * Validate all four margins
 * 
 * @param margins - Margins object with top, bottom, left, right
 * @param paperWidthMm - Paper width in millimeters
 * @param paperHeightMm - Paper height in millimeters
 * @returns Validation result with errors for each invalid margin
 */
export function validateAllMargins(
  margins: PaperMargins,
  paperWidthMm: number,
  paperHeightMm: number
): AllMarginsValidationResult {
  const errors: AllMarginsValidationResult['errors'] = {}

  // Validate top margin
  const topResult = validateMargin(margins.top, paperHeightMm, 'top')
  if (!topResult.isValid) {
    errors.top = topResult.error
  }

  // Validate bottom margin
  const bottomResult = validateMargin(margins.bottom, paperHeightMm, 'bottom')
  if (!bottomResult.isValid) {
    errors.bottom = bottomResult.error
  }

  // Validate left margin
  const leftResult = validateMargin(margins.left, paperWidthMm, 'left')
  if (!leftResult.isValid) {
    errors.left = leftResult.error
  }

  // Validate right margin
  const rightResult = validateMargin(margins.right, paperWidthMm, 'right')
  if (!rightResult.isValid) {
    errors.right = rightResult.error
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Calculate the printable area after subtracting margins
 * 
 * @param paperWidthMm - Paper width in millimeters
 * @param paperHeightMm - Paper height in millimeters
 * @param margins - Margins object with top, bottom, left, right
 * @returns Printable area dimensions
 */
export function calculatePrintableArea(
  paperWidthMm: number,
  paperHeightMm: number,
  margins: PaperMargins
): PrintableArea {
  return {
    widthMm: paperWidthMm - margins.left - margins.right,
    heightMm: paperHeightMm - margins.top - margins.bottom,
  }
}

/**
 * Check if at least one photo can fit in the printable area
 * 
 * @param printableArea - Available printable area
 * @param photoSize - Photo dimensions
 * @param minSpacingMm - Minimum spacing required (default 5mm)
 * @returns Result indicating if photo can fit with optional message
 */
export function canFitPhoto(
  printableArea: PrintableArea,
  photoSize: PhotoSize
): PhotoFitResult {
  // For a single photo, we don't need spacing on all sides
  // Just check if photo dimensions fit within printable area
  const photoFitsWidth = photoSize.widthMm <= printableArea.widthMm
  const photoFitsHeight = photoSize.heightMm <= printableArea.heightMm

  if (photoFitsWidth && photoFitsHeight) {
    return { canFit: true }
  }

  return {
    canFit: false,
    message: `The printable area is too small for the selected photo size (${photoSize.widthMm}×${photoSize.heightMm}mm). Please reduce margins or select a smaller photo size.`,
  }
}
