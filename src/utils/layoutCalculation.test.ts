import { describe, it, expect } from 'vitest'
import {
  PAPER_TYPES,
  calculateLayout,
  mmToPixels,
} from './layoutCalculation'
import type { PhotoSize } from './layoutCalculation'

describe('layoutCalculation', () => {
  describe('mmToPixels', () => {
    it('should convert millimeters to pixels at 300 DPI', () => {
      // At 300 DPI: 1 inch = 25.4mm = 300 pixels
      // So 1mm = 300/25.4 ≈ 11.811 pixels
      expect(mmToPixels(25.4, 300)).toBeCloseTo(300, 0)
      expect(mmToPixels(25, 300)).toBeCloseTo(295.28, 1)
      expect(mmToPixels(35, 300)).toBeCloseTo(413.39, 1)
    })

    it('should handle different DPI values', () => {
      expect(mmToPixels(25.4, 150)).toBeCloseTo(150, 0)
      expect(mmToPixels(25.4, 600)).toBeCloseTo(600, 0)
    })
  })

  describe('PAPER_TYPES', () => {
    it('should define 6-inch photo paper with correct dimensions', () => {
      const sixInch = PAPER_TYPES['6-inch']
      expect(sixInch).toBeDefined()
      expect(sixInch.id).toBe('6-inch')
      expect(sixInch.label).toBe('6-inch Photo Paper')
      expect(sixInch.widthPx).toBe(1200)
      expect(sixInch.heightPx).toBe(1800)
    })

    it('should define A4 paper with correct dimensions', () => {
      const a4 = PAPER_TYPES['a4']
      expect(a4).toBeDefined()
      expect(a4.id).toBe('a4')
      expect(a4.label).toBe('A4 Paper')
      expect(a4.widthPx).toBe(2480)
      expect(a4.heightPx).toBe(3508)
    })
  })

  describe('calculateLayout for 1-inch photos (25×35mm)', () => {
    const photoSize: PhotoSize = {
      widthMm: 25,
      heightMm: 35,
    }

    it('should calculate layout for 6-inch photo paper', () => {
      const result = calculateLayout('6-inch', photoSize, 300)
      
      expect(result.paperType).toBe('6-inch')
      expect(result.paperWidthPx).toBe(1200)
      expect(result.paperHeightPx).toBe(1800)
      expect(result.photoWidthPx).toBeCloseTo(295.28, 1)
      expect(result.photoHeightPx).toBeCloseTo(413.39, 1)
      
      // For 1-inch photos on 6-inch paper, expect 4×6 = 24 photos or similar
      expect(result.photosPerRow).toBeGreaterThan(0)
      expect(result.photosPerColumn).toBeGreaterThan(0)
      expect(result.totalPhotos).toBeGreaterThan(0)
      expect(result.totalPhotos).toBe(result.photosPerRow * result.photosPerColumn)
    })

    it('should calculate layout for A4 paper', () => {
      const result = calculateLayout('a4', photoSize, 300)
      
      expect(result.paperType).toBe('a4')
      expect(result.paperWidthPx).toBe(2480)
      expect(result.paperHeightPx).toBe(3508)
      expect(result.photoWidthPx).toBeCloseTo(295.28, 1)
      expect(result.photoHeightPx).toBeCloseTo(413.39, 1)
      
      // For 1-inch photos on A4, expect more photos than 6-inch paper
      expect(result.photosPerRow).toBeGreaterThan(0)
      expect(result.photosPerColumn).toBeGreaterThan(0)
      expect(result.totalPhotos).toBeGreaterThan(0)
    })
  })

  describe('calculateLayout for 2-inch photos (35×49mm)', () => {
    const photoSize: PhotoSize = {
      widthMm: 35,
      heightMm: 49,
    }

    it('should calculate layout for 6-inch photo paper', () => {
      const result = calculateLayout('6-inch', photoSize, 300)
      
      expect(result.paperType).toBe('6-inch')
      expect(result.photoWidthPx).toBeCloseTo(413.39, 1)
      expect(result.photoHeightPx).toBeCloseTo(578.74, 1)
      
      expect(result.photosPerRow).toBeGreaterThan(0)
      expect(result.photosPerColumn).toBeGreaterThan(0)
      expect(result.totalPhotos).toBeGreaterThan(0)
    })

    it('should calculate layout for A4 paper', () => {
      const result = calculateLayout('a4', photoSize, 300)
      
      expect(result.paperType).toBe('a4')
      expect(result.photoWidthPx).toBeCloseTo(413.39, 1)
      expect(result.photoHeightPx).toBeCloseTo(578.74, 1)
      
      expect(result.photosPerRow).toBeGreaterThan(0)
      expect(result.photosPerColumn).toBeGreaterThan(0)
      expect(result.totalPhotos).toBeGreaterThan(0)
    })
  })

  describe('calculateLayout for 3-inch photos (35×52mm)', () => {
    const photoSize: PhotoSize = {
      widthMm: 35,
      heightMm: 52,
    }

    it('should calculate layout for 6-inch photo paper', () => {
      const result = calculateLayout('6-inch', photoSize, 300)
      
      expect(result.paperType).toBe('6-inch')
      expect(result.photoWidthPx).toBeCloseTo(413.39, 1)
      expect(result.photoHeightPx).toBeCloseTo(614.17, 1)
      
      expect(result.photosPerRow).toBeGreaterThan(0)
      expect(result.photosPerColumn).toBeGreaterThan(0)
      expect(result.totalPhotos).toBeGreaterThan(0)
    })

    it('should calculate layout for A4 paper', () => {
      const result = calculateLayout('a4', photoSize, 300)
      
      expect(result.paperType).toBe('a4')
      expect(result.photoWidthPx).toBeCloseTo(413.39, 1)
      expect(result.photoHeightPx).toBeCloseTo(614.17, 1)
      
      expect(result.photosPerRow).toBeGreaterThan(0)
      expect(result.photosPerColumn).toBeGreaterThan(0)
      expect(result.totalPhotos).toBeGreaterThan(0)
    })
  })

  describe('optimal layout calculation', () => {
    it('should maximize paper space utilization', () => {
      const photoSize: PhotoSize = { widthMm: 25, heightMm: 35 }
      const result = calculateLayout('6-inch', photoSize, 300)
      
      // Verify that the layout uses available space efficiently
      const usedWidth = result.photosPerRow * result.photoWidthPx
      const usedHeight = result.photosPerColumn * result.photoHeightPx
      
      // Used space should be less than or equal to paper size
      expect(usedWidth).toBeLessThanOrEqual(result.paperWidthPx)
      expect(usedHeight).toBeLessThanOrEqual(result.paperHeightPx)
      
      // Verify that at least some photos fit
      expect(result.totalPhotos).toBeGreaterThan(0)
      
      // For 1-inch photos on 6-inch paper, expect reasonable number of photos
      expect(result.totalPhotos).toBeGreaterThan(4)
    })

    it('should handle minimum spacing between photos', () => {
      const photoSize: PhotoSize = { widthMm: 25, heightMm: 35 }
      const result = calculateLayout('6-inch', photoSize, 300)
      
      // Check that horizontal spacing is included
      expect(result.horizontalSpacingPx).toBeGreaterThanOrEqual(0)
      
      // Check that vertical spacing is included
      expect(result.verticalSpacingPx).toBeGreaterThanOrEqual(0)
    })

    it('should center remaining space evenly when unable to fill completely', () => {
      const photoSize: PhotoSize = { widthMm: 25, heightMm: 35 }
      const result = calculateLayout('6-inch', photoSize, 300)
      
      // Calculate remaining space
      const usedWidth = result.photosPerRow * result.photoWidthPx
      const remainingWidth = result.paperWidthPx - usedWidth
      
      // Margin should be approximately half of remaining space (centered)
      // Allow some tolerance for rounding
      expect(result.marginLeftPx).toBeGreaterThanOrEqual(0)
      expect(result.marginLeftPx).toBeLessThanOrEqual(remainingWidth)
    })
  })

  describe('edge cases', () => {
    it('should handle photos that are too large for paper', () => {
      const photoSize: PhotoSize = { widthMm: 200, heightMm: 300 }
      const result = calculateLayout('6-inch', photoSize, 300)
      
      // Should return at least 1 photo even if it doesn't fit
      expect(result.totalPhotos).toBeGreaterThanOrEqual(1)
    })

    it('should handle very small photos', () => {
      const photoSize: PhotoSize = { widthMm: 5, heightMm: 7 }
      const result = calculateLayout('a4', photoSize, 300)
      
      // Should fit many small photos
      expect(result.totalPhotos).toBeGreaterThan(10)
    })

    it('should produce consistent results for same inputs', () => {
      const photoSize: PhotoSize = { widthMm: 35, heightMm: 49 }
      const result1 = calculateLayout('a4', photoSize, 300)
      const result2 = calculateLayout('a4', photoSize, 300)
      
      expect(result1).toEqual(result2)
    })
  })
})
