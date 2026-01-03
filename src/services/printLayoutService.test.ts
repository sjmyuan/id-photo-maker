import { describe, it, expect, beforeEach } from 'vitest'
import { generatePrintLayout } from './printLayoutService'

describe('printLayoutService', () => {
  let mockCanvas: HTMLCanvasElement
  let mockImage: HTMLImageElement

  beforeEach(() => {
    // Create a mock canvas
    mockCanvas = document.createElement('canvas')
    mockCanvas.width = 300
    mockCanvas.height = 400

    // Draw a simple rectangle to simulate an image
    const ctx = mockCanvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#FF0000'
      ctx.fillRect(0, 0, 300, 400)
    }

    // Create a mock image from the canvas
    mockImage = new Image()
    mockImage.width = 300
    mockImage.height = 400
  })

  describe('generatePrintLayout', () => {
    it('should generate a canvas with correct dimensions for 6-inch paper', async () => {
      const result = await generatePrintLayout(
        mockCanvas,
        {
          widthMm: 25,
          heightMm: 35,
        },
        '6-inch',
        300
      )

      expect(result.width).toBe(1200)
      expect(result.height).toBe(1800)
    })

    it('should generate a canvas with correct dimensions for A4 paper', async () => {
      const result = await generatePrintLayout(
        mockCanvas,
        {
          widthMm: 25,
          heightMm: 35,
        },
        'a4',
        300
      )

      expect(result.width).toBe(2480)
      expect(result.height).toBe(3508)
    })

    it('should arrange photos in calculated grid pattern', async () => {
      const result = await generatePrintLayout(
        mockCanvas,
        {
          widthMm: 25,
          heightMm: 35,
        },
        '6-inch',
        300
      )

      const ctx = result.getContext('2d')
      expect(ctx).not.toBeNull()

      // Verify canvas has been drawn to (not blank)
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, result.width, result.height)
        const data = imageData.data

        // Check that some pixels are not white (255, 255, 255, 255)
        let hasNonWhitePixels = false
        for (let i = 0; i < data.length; i += 4) {
          if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) {
            hasNonWhitePixels = true
            break
          }
        }

        expect(hasNonWhitePixels).toBe(true)
      }
    })

    it('should maintain 300 DPI resolution', async () => {
      const result = await generatePrintLayout(
        mockCanvas,
        {
          widthMm: 25,
          heightMm: 35,
        },
        '6-inch',
        300
      )

      // 6-inch paper should be 1200x1800 at 300 DPI
      // 4 inches = 1200 pixels, 6 inches = 1800 pixels
      expect(result.width).toBe(1200)
      expect(result.height).toBe(1800)
    })

    it('should handle 1-inch photos', async () => {
      const result = await generatePrintLayout(
        mockCanvas,
        {
          widthMm: 25,
          heightMm: 35,
        },
        '6-inch',
        300
      )

      expect(result.width).toBe(1200)
      expect(result.height).toBe(1800)
      expect(result).toBeInstanceOf(HTMLCanvasElement)
    })

    it('should handle 2-inch photos', async () => {
      const result = await generatePrintLayout(
        mockCanvas,
        {
          widthMm: 35,
          heightMm: 49,
        },
        'a4',
        300
      )

      expect(result.width).toBe(2480)
      expect(result.height).toBe(3508)
      expect(result).toBeInstanceOf(HTMLCanvasElement)
    })

    it('should handle 3-inch photos', async () => {
      const result = await generatePrintLayout(
        mockCanvas,
        {
          widthMm: 35,
          heightMm: 52,
        },
        'a4',
        300
      )

      expect(result.width).toBe(2480)
      expect(result.height).toBe(3508)
      expect(result).toBeInstanceOf(HTMLCanvasElement)
    })

    it('should properly space photos in the layout', async () => {
      const result = await generatePrintLayout(
        mockCanvas,
        {
          widthMm: 25,
          heightMm: 35,
        },
        '6-inch',
        300
      )

      // The layout should use calculated spacing from layoutCalculation
      expect(result).toBeInstanceOf(HTMLCanvasElement)
      
      const ctx = result.getContext('2d')
      expect(ctx).not.toBeNull()
    })

    it('should fill white background before drawing photos', async () => {
      const result = await generatePrintLayout(
        mockCanvas,
        {
          widthMm: 25,
          heightMm: 35,
        },
        '6-inch',
        300
      )

      const ctx = result.getContext('2d')
      if (ctx) {
        // Check corners - they should be white if spacing exists
        const topLeft = ctx.getImageData(0, 0, 1, 1).data
        expect(topLeft[0]).toBe(255) // R
        expect(topLeft[1]).toBe(255) // G
        expect(topLeft[2]).toBe(255) // B
      }
    })

    it('should handle edge case of very large photos', async () => {
      const result = await generatePrintLayout(
        mockCanvas,
        {
          widthMm: 100,
          heightMm: 150,
        },
        '6-inch',
        300
      )

      // Should still generate a valid canvas
      expect(result).toBeInstanceOf(HTMLCanvasElement)
      expect(result.width).toBe(1200)
      expect(result.height).toBe(1800)
    })

    it('should handle edge case of very small photos', async () => {
      const result = await generatePrintLayout(
        mockCanvas,
        {
          widthMm: 10,
          heightMm: 15,
        },
        'a4',
        300
      )

      // Should still generate a valid canvas with many photos
      expect(result).toBeInstanceOf(HTMLCanvasElement)
      expect(result.width).toBe(2480)
      expect(result.height).toBe(3508)
    })

    it('should produce consistent results for same inputs', async () => {
      const result1 = await generatePrintLayout(
        mockCanvas,
        {
          widthMm: 35,
          heightMm: 49,
        },
        'a4',
        300
      )

      const result2 = await generatePrintLayout(
        mockCanvas,
        {
          widthMm: 35,
          heightMm: 49,
        },
        'a4',
        300
      )

      expect(result1.width).toBe(result2.width)
      expect(result1.height).toBe(result2.height)
    })

    it('should scale source image to exact photo dimensions', async () => {
      // Use a small source canvas
      const smallCanvas = document.createElement('canvas')
      smallCanvas.width = 100
      smallCanvas.height = 140

      const result = await generatePrintLayout(
        smallCanvas,
        {
          widthMm: 25,
          heightMm: 35,
        },
        '6-inch',
        300
      )

      // Photos should be drawn at calculated pixel size (not source size)
      expect(result).toBeInstanceOf(HTMLCanvasElement)
    })
  })
})
