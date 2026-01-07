import { describe, it, expect } from 'vitest'
import { calculateInitialCropArea } from './cropAreaCalculation'
import { type FaceBox } from '../services/faceDetectionService'

describe('calculateInitialCropArea', () => {
  describe('basic crop area calculation', () => {
    it('should calculate crop area centered on face with correct aspect ratio', () => {
      const faceBox: FaceBox = {
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        confidence: 0.99,
      }
      const aspectRatio = 1 // Square
      const imageWidth = 500
      const imageHeight = 500

      const result = calculateInitialCropArea(faceBox, aspectRatio, imageWidth, imageHeight)

      // Face center is at (150, 150)
      expect(result.width).toBeCloseTo(result.height, 0) // Should be square
      
      // Check that crop is centered on face
      const cropCenterX = result.x + result.width / 2
      const cropCenterY = result.y + result.height / 2
      expect(cropCenterX).toBeCloseTo(150, 0) // Face center X
      expect(cropCenterY).toBeCloseTo(150, 0) // Face center Y
    })

    it('should expand face area by correct proportions', () => {
      const faceBox: FaceBox = {
        x: 200,
        y: 200,
        width: 100,
        height: 100,
        confidence: 0.99,
      }
      const aspectRatio = 3 / 4 // Portrait ratio
      const imageWidth = 1000
      const imageHeight = 1000

      const result = calculateInitialCropArea(faceBox, aspectRatio, imageWidth, imageHeight)

      // Expected expansions:
      // Horizontal: 100 * 0.8 = 80 on each side
      // Vertical Above: 100 * 1.5 = 150
      // Vertical Below: 100 * 1.0 = 100
      // Target width: 100 + 2*80 = 260
      // Target height: 100 + 150 + 100 = 350
      
      // Since target aspect ratio (260/350 = 0.743) is close to required (0.75),
      // the crop should use these dimensions with slight adjustment for exact aspect ratio
      expect(result.width / result.height).toBeCloseTo(aspectRatio, 2)
    })

    it('should maintain aspect ratio for landscape photos', () => {
      const faceBox: FaceBox = {
        x: 300,
        y: 150,
        width: 80,
        height: 80,
        confidence: 0.99,
      }
      const aspectRatio = 4 / 3 // Landscape ratio
      const imageWidth = 800
      const imageHeight = 600

      const result = calculateInitialCropArea(faceBox, aspectRatio, imageWidth, imageHeight)

      expect(result.width / result.height).toBeCloseTo(aspectRatio, 2)
    })
  })

  describe('boundary handling', () => {
    it('should shrink crop area when it exceeds image bounds on the left', () => {
      const faceBox: FaceBox = {
        x: 10, // Very close to left edge
        y: 200,
        width: 50,
        height: 50,
        confidence: 0.99,
      }
      const aspectRatio = 1
      const imageWidth = 500
      const imageHeight = 500

      const result = calculateInitialCropArea(faceBox, aspectRatio, imageWidth, imageHeight)

      // Crop should not exceed left boundary
      expect(result.x).toBeGreaterThanOrEqual(0)
      expect(result.x + result.width).toBeLessThanOrEqual(imageWidth)
      
      // Should maintain aspect ratio
      expect(result.width / result.height).toBeCloseTo(aspectRatio, 2)
      
      // Should be centered on face center
      const cropCenterX = result.x + result.width / 2
      const faceCenterX = faceBox.x + faceBox.width / 2
      expect(cropCenterX).toBeCloseTo(faceCenterX, 0)
    })

    it('should shrink crop area when it exceeds image bounds on the right', () => {
      const faceBox: FaceBox = {
        x: 450, // Very close to right edge
        y: 200,
        width: 50,
        height: 50,
        confidence: 0.99,
      }
      const aspectRatio = 1
      const imageWidth = 500
      const imageHeight = 500

      const result = calculateInitialCropArea(faceBox, aspectRatio, imageWidth, imageHeight)

      expect(result.x).toBeGreaterThanOrEqual(0)
      expect(result.x + result.width).toBeLessThanOrEqual(imageWidth)
      expect(result.width / result.height).toBeCloseTo(aspectRatio, 2)
    })

    it('should shrink crop area when it exceeds image bounds on the top', () => {
      const faceBox: FaceBox = {
        x: 200,
        y: 10, // Very close to top edge
        width: 50,
        height: 50,
        confidence: 0.99,
      }
      const aspectRatio = 1
      const imageWidth = 500
      const imageHeight = 500

      const result = calculateInitialCropArea(faceBox, aspectRatio, imageWidth, imageHeight)

      expect(result.y).toBeGreaterThanOrEqual(0)
      expect(result.y + result.height).toBeLessThanOrEqual(imageHeight)
      expect(result.width / result.height).toBeCloseTo(aspectRatio, 2)
    })

    it('should shrink crop area when it exceeds image bounds on the bottom', () => {
      const faceBox: FaceBox = {
        x: 200,
        y: 450, // Very close to bottom edge
        width: 50,
        height: 50,
        confidence: 0.99,
      }
      const aspectRatio = 1
      const imageWidth = 500
      const imageHeight = 500

      const result = calculateInitialCropArea(faceBox, aspectRatio, imageWidth, imageHeight)

      expect(result.y).toBeGreaterThanOrEqual(0)
      expect(result.y + result.height).toBeLessThanOrEqual(imageHeight)
      expect(result.width / result.height).toBeCloseTo(aspectRatio, 2)
    })

    it('should handle face partially outside image bounds (left)', () => {
      const faceBox: FaceBox = {
        x: -10, // Partially outside left edge
        y: 200,
        width: 50,
        height: 50,
        confidence: 0.99,
      }
      const aspectRatio = 1
      const imageWidth = 500
      const imageHeight = 500

      const result = calculateInitialCropArea(faceBox, aspectRatio, imageWidth, imageHeight)

      // Should clamp face center to image bounds
      expect(result.x).toBeGreaterThanOrEqual(0)
      expect(result.x + result.width).toBeLessThanOrEqual(imageWidth)
      expect(result.width / result.height).toBeCloseTo(aspectRatio, 2)
    })

    it('should handle face in corner of image', () => {
      const faceBox: FaceBox = {
        x: 5,
        y: 5,
        width: 30,
        height: 30,
        confidence: 0.99,
      }
      const aspectRatio = 3 / 4
      const imageWidth = 400
      const imageHeight = 600

      const result = calculateInitialCropArea(faceBox, aspectRatio, imageWidth, imageHeight)

      // Crop should fit within bounds
      expect(result.x).toBeGreaterThanOrEqual(0)
      expect(result.y).toBeGreaterThanOrEqual(0)
      expect(result.x + result.width).toBeLessThanOrEqual(imageWidth)
      expect(result.y + result.height).toBeLessThanOrEqual(imageHeight)
      
      // Should maintain aspect ratio
      expect(result.width / result.height).toBeCloseTo(aspectRatio, 2)
    })
  })

  describe('edge cases', () => {
    it('should handle very small face relative to image', () => {
      const faceBox: FaceBox = {
        x: 480,
        y: 480,
        width: 10,
        height: 10,
        confidence: 0.99,
      }
      const aspectRatio = 1
      const imageWidth = 1000
      const imageHeight = 1000

      const result = calculateInitialCropArea(faceBox, aspectRatio, imageWidth, imageHeight)

      expect(result.x).toBeGreaterThanOrEqual(0)
      expect(result.y).toBeGreaterThanOrEqual(0)
      expect(result.x + result.width).toBeLessThanOrEqual(imageWidth)
      expect(result.y + result.height).toBeLessThanOrEqual(imageHeight)
      expect(result.width / result.height).toBeCloseTo(aspectRatio, 2)
    })

    it('should handle very large face relative to image', () => {
      const faceBox: FaceBox = {
        x: 50,
        y: 50,
        width: 200,
        height: 200,
        confidence: 0.99,
      }
      const aspectRatio = 1
      const imageWidth = 300
      const imageHeight = 300

      const result = calculateInitialCropArea(faceBox, aspectRatio, imageWidth, imageHeight)

      // Should shrink to fit within image bounds while maintaining center
      expect(result.x).toBeGreaterThanOrEqual(0)
      expect(result.y).toBeGreaterThanOrEqual(0)
      expect(result.x + result.width).toBeLessThanOrEqual(imageWidth)
      expect(result.y + result.height).toBeLessThanOrEqual(imageHeight)
      expect(result.width / result.height).toBeCloseTo(aspectRatio, 2)
    })

    it('should handle standard ID photo aspect ratio (3:4)', () => {
      const faceBox: FaceBox = {
        x: 150,
        y: 150,
        width: 100,
        height: 100,
        confidence: 0.99,
      }
      const aspectRatio = 3 / 4
      const imageWidth = 800
      const imageHeight = 1000

      const result = calculateInitialCropArea(faceBox, aspectRatio, imageWidth, imageHeight)

      expect(result.width / result.height).toBeCloseTo(aspectRatio, 2)
      
      // Should be centered on face
      const cropCenterX = result.x + result.width / 2
      const cropCenterY = result.y + result.height / 2
      const faceCenterX = faceBox.x + faceBox.width / 2
      const faceCenterY = faceBox.y + faceBox.height / 2
      expect(cropCenterX).toBeCloseTo(faceCenterX, 0)
      expect(cropCenterY).toBeCloseTo(faceCenterY, 0)
    })

    it('should handle wide aspect ratio (16:9)', () => {
      const faceBox: FaceBox = {
        x: 400,
        y: 200,
        width: 80,
        height: 80,
        confidence: 0.99,
      }
      const aspectRatio = 16 / 9
      const imageWidth = 1920
      const imageHeight = 1080

      const result = calculateInitialCropArea(faceBox, aspectRatio, imageWidth, imageHeight)

      expect(result.width / result.height).toBeCloseTo(aspectRatio, 2)
      expect(result.x).toBeGreaterThanOrEqual(0)
      expect(result.y).toBeGreaterThanOrEqual(0)
      expect(result.x + result.width).toBeLessThanOrEqual(imageWidth)
      expect(result.y + result.height).toBeLessThanOrEqual(imageHeight)
    })

    it('should handle tall aspect ratio (1:2)', () => {
      const faceBox: FaceBox = {
        x: 200,
        y: 400,
        width: 60,
        height: 60,
        confidence: 0.99,
      }
      const aspectRatio = 1 / 2
      const imageWidth = 500
      const imageHeight = 1000

      const result = calculateInitialCropArea(faceBox, aspectRatio, imageWidth, imageHeight)

      expect(result.width / result.height).toBeCloseTo(aspectRatio, 2)
      expect(result.x).toBeGreaterThanOrEqual(0)
      expect(result.y).toBeGreaterThanOrEqual(0)
      expect(result.x + result.width).toBeLessThanOrEqual(imageWidth)
      expect(result.y + result.height).toBeLessThanOrEqual(imageHeight)
    })
  })

  describe('centering behavior', () => {
    it('should always center crop on face when space permits', () => {
      const faceBox: FaceBox = {
        x: 250,
        y: 250,
        width: 100,
        height: 100,
        confidence: 0.99,
      }
      const aspectRatio = 1
      const imageWidth = 1000
      const imageHeight = 1000

      const result = calculateInitialCropArea(faceBox, aspectRatio, imageWidth, imageHeight)

      const cropCenterX = result.x + result.width / 2
      const cropCenterY = result.y + result.height / 2
      const faceCenterX = faceBox.x + faceBox.width / 2
      const faceCenterY = faceBox.y + faceBox.height / 2

      expect(cropCenterX).toBeCloseTo(faceCenterX, 0)
      expect(cropCenterY).toBeCloseTo(faceCenterY, 0)
    })

    it('should maintain centering even when shrinking for boundaries', () => {
      const faceBox: FaceBox = {
        x: 20,
        y: 20,
        width: 50,
        height: 50,
        confidence: 0.99,
      }
      const aspectRatio = 1
      const imageWidth = 200
      const imageHeight = 200

      const result = calculateInitialCropArea(faceBox, aspectRatio, imageWidth, imageHeight)

      const cropCenterX = result.x + result.width / 2
      const cropCenterY = result.y + result.height / 2
      const faceCenterX = faceBox.x + faceBox.width / 2
      const faceCenterY = faceBox.y + faceBox.height / 2

      // Even with shrinking, should be centered on face
      expect(cropCenterX).toBeCloseTo(faceCenterX, 0)
      expect(cropCenterY).toBeCloseTo(faceCenterY, 0)
    })
  })
})
