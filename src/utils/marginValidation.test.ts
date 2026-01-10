import { describe, it, expect } from 'vitest'
import {
  validateMargin,
  validateAllMargins,
  calculatePrintableArea,
  canFitPhoto,
  type PrintableArea,
} from './marginValidation'
import { type PaperMargins } from '../types'

describe('marginValidation', () => {
  describe('validateMargin', () => {
    it('should accept margin of 0', () => {
      const result = validateMargin(0, 100, 'top')
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept valid margin within 50% limit', () => {
      const result = validateMargin(25, 100, 'left')
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept margin exactly at 50% limit', () => {
      const result = validateMargin(50, 100, 'right')
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject negative margin', () => {
      const result = validateMargin(-5, 100, 'bottom')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('bottom margin cannot be negative')
    })

    it('should reject margin exceeding 50% of dimension', () => {
      const result = validateMargin(51, 100, 'top')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('top margin cannot exceed 50mm (50% of paper dimension)')
    })

    it('should reject margin exceeding dimension', () => {
      const result = validateMargin(150, 100, 'left')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('left margin cannot exceed 50mm (50% of paper dimension)')
    })
  })

  describe('validateAllMargins', () => {
    const paperWidthMm = 102 // 6-inch paper width
    const paperHeightMm = 152 // 6-inch paper height

    it('should accept all zero margins', () => {
      const margins: PaperMargins = { top: 0, bottom: 0, left: 0, right: 0 }
      const result = validateAllMargins(margins, paperWidthMm, paperHeightMm)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('should accept all valid margins', () => {
      const margins: PaperMargins = { top: 5, bottom: 5, left: 5, right: 5 }
      const result = validateAllMargins(margins, paperWidthMm, paperHeightMm)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('should reject invalid top margin', () => {
      const margins: PaperMargins = { top: 100, bottom: 0, left: 0, right: 0 }
      const result = validateAllMargins(margins, paperWidthMm, paperHeightMm)
      expect(result.isValid).toBe(false)
      expect(result.errors.top).toBeDefined()
    })

    it('should reject invalid bottom margin', () => {
      const margins: PaperMargins = { top: 0, bottom: -5, left: 0, right: 0 }
      const result = validateAllMargins(margins, paperWidthMm, paperHeightMm)
      expect(result.isValid).toBe(false)
      expect(result.errors.bottom).toBeDefined()
    })

    it('should reject multiple invalid margins', () => {
      const margins: PaperMargins = { top: -5, bottom: 100, left: 60, right: -10 }
      const result = validateAllMargins(margins, paperWidthMm, paperHeightMm)
      expect(result.isValid).toBe(false)
      expect(result.errors.top).toBeDefined()
      expect(result.errors.bottom).toBeDefined()
      expect(result.errors.left).toBeDefined()
      expect(result.errors.right).toBeDefined()
    })

    it('should accept margins at exactly 50% for A4 paper', () => {
      const margins: PaperMargins = { top: 148.5, bottom: 148.5, left: 105, right: 105 }
      const result = validateAllMargins(margins, 210, 297)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
    })
  })

  describe('calculatePrintableArea', () => {
    it('should return full paper dimensions with zero margins', () => {
      const margins: PaperMargins = { top: 0, bottom: 0, left: 0, right: 0 }
      const area = calculatePrintableArea(102, 152, margins)
      expect(area.widthMm).toBe(102)
      expect(area.heightMm).toBe(152)
    })

    it('should subtract margins from paper dimensions', () => {
      const margins: PaperMargins = { top: 1, bottom: 2, left: 1, right: 1 }
      const area = calculatePrintableArea(210, 297, margins)
      expect(area.widthMm).toBe(208) // 210 - 1 - 1
      expect(area.heightMm).toBe(294) // 297 - 1 - 2
    })

    it('should handle asymmetric margins', () => {
      const margins: PaperMargins = { top: 10, bottom: 5, left: 3, right: 7 }
      const area = calculatePrintableArea(210, 297, margins)
      expect(area.widthMm).toBe(200) // 210 - 3 - 7
      expect(area.heightMm).toBe(282) // 297 - 10 - 5
    })

    it('should return zero or negative dimensions if margins exceed paper size', () => {
      const margins: PaperMargins = { top: 50, bottom: 50, left: 50, right: 50 }
      const area = calculatePrintableArea(102, 152, margins)
      expect(area.widthMm).toBe(2) // 102 - 50 - 50
      expect(area.heightMm).toBe(52) // 152 - 50 - 50
    })
  })

  describe('canFitPhoto', () => {
    it('should return true if photo fits in printable area', () => {
      const printableArea: PrintableArea = { widthMm: 100, heightMm: 150 }
      const photoSize = { widthMm: 25, heightMm: 35 }
      const result = canFitPhoto(printableArea, photoSize, 5)
      expect(result.canFit).toBe(true)
      expect(result.message).toBeUndefined()
    })

    it('should return true if exactly one photo fits', () => {
      const printableArea: PrintableArea = { widthMm: 25, heightMm: 35 }
      const photoSize = { widthMm: 25, heightMm: 35 }
      const result = canFitPhoto(printableArea, photoSize, 0)
      expect(result.canFit).toBe(true)
    })

    it('should return false if photo is wider than printable area', () => {
      const printableArea: PrintableArea = { widthMm: 20, heightMm: 150 }
      const photoSize = { widthMm: 25, heightMm: 35 }
      const result = canFitPhoto(printableArea, photoSize, 5)
      expect(result.canFit).toBe(false)
      expect(result.message).toContain('printable area is too small')
    })

    it('should return false if photo is taller than printable area', () => {
      const printableArea: PrintableArea = { widthMm: 100, heightMm: 30 }
      const photoSize = { widthMm: 25, heightMm: 35 }
      const result = canFitPhoto(printableArea, photoSize, 5)
      expect(result.canFit).toBe(false)
      expect(result.message).toContain('printable area is too small')
    })

    it('should account for minimum spacing when needed', () => {
      // If printable area is just barely enough for photo but not spacing,
      // we should still allow it since at minimum one photo can fit
      const printableArea: PrintableArea = { widthMm: 30, heightMm: 40 }
      const photoSize = { widthMm: 25, heightMm: 35 }
      const result = canFitPhoto(printableArea, photoSize, 10) // 10mm spacing parameter is noted but not enforced for single photo
      expect(result.canFit).toBe(true) // Single photo fits in available space
    })

    it('should return true with zero spacing', () => {
      const printableArea: PrintableArea = { widthMm: 25, heightMm: 35 }
      const photoSize = { widthMm: 25, heightMm: 35 }
      const result = canFitPhoto(printableArea, photoSize, 0)
      expect(result.canFit).toBe(true)
    })
  })
})
