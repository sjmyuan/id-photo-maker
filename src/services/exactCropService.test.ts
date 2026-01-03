/**
 * Tests for Exact Pixel Cropping Service
 * Tests generating cropped images with exact pixel dimensions based on physical size and DPI
 */

import { describe, it, expect } from 'vitest'
import { generateExactCrop, calculateTargetPixelDimensions } from './exactCropService'

describe('calculateTargetPixelDimensions', () => {
  it('should calculate exact pixel dimensions for 1-inch size at 300 DPI', () => {
    // 1-inch: 25mm x 35mm at 300 DPI
    // 25mm = 0.984252 inches → 0.984252 * 300 = 295.276 pixels ≈ 295 pixels
    // 35mm = 1.377953 inches → 1.377953 * 300 = 413.386 pixels ≈ 413 pixels
    const result = calculateTargetPixelDimensions(25, 35, 300)
    
    expect(result.widthPx).toBe(295)
    expect(result.heightPx).toBe(413)
  })

  it('should calculate exact pixel dimensions for 2-inch size at 300 DPI', () => {
    // 2-inch: 35mm x 49mm at 300 DPI
    const result = calculateTargetPixelDimensions(35, 49, 300)
    
    expect(result.widthPx).toBe(413)
    expect(result.heightPx).toBe(579)
  })

  it('should calculate exact pixel dimensions at different DPI values', () => {
    // Test 25mm x 35mm at 150 DPI
    const result150 = calculateTargetPixelDimensions(25, 35, 150)
    expect(result150.widthPx).toBe(148)
    expect(result150.heightPx).toBe(207)
    
    // Test 25mm x 35mm at 600 DPI
    const result600 = calculateTargetPixelDimensions(25, 35, 600)
    expect(result600.widthPx).toBe(591)
    expect(result600.heightPx).toBe(827)
  })
})

describe('generateExactCrop', () => {
  it('should generate cropped canvas with exact pixel dimensions', async () => {
    // Create a test canvas (source image)
    const sourceCanvas = document.createElement('canvas')
    sourceCanvas.width = 1000
    sourceCanvas.height = 1500
    const ctx = sourceCanvas.getContext('2d')!
    ctx.fillStyle = 'blue'
    ctx.fillRect(0, 0, 1000, 1500)

    // Crop area in source coordinates
    const cropArea = { x: 100, y: 200, width: 600, height: 840 }
    
    // Target: 1-inch (25mm x 35mm) at 300 DPI
    const result = await generateExactCrop(sourceCanvas, cropArea, 25, 35, 300)
    
    // Verify exact dimensions
    expect(result.width).toBe(295) // 25mm at 300 DPI
    expect(result.height).toBe(413) // 35mm at 300 DPI
  })

  it('should scale and crop content correctly', async () => {
    // Create source with distinct pattern
    const sourceCanvas = document.createElement('canvas')
    sourceCanvas.width = 400
    sourceCanvas.height = 600
    const ctx = sourceCanvas.getContext('2d')!
    
    // Draw red top half, blue bottom half
    ctx.fillStyle = 'red'
    ctx.fillRect(0, 0, 400, 300)
    ctx.fillStyle = 'blue'
    ctx.fillRect(0, 300, 400, 300)

    // Crop the middle section (should contain both colors)
    const cropArea = { x: 100, y: 200, width: 200, height: 280 }
    
    const result = await generateExactCrop(sourceCanvas, cropArea, 25, 35, 300)
    
    // Verify dimensions
    expect(result.width).toBe(295)
    expect(result.height).toBe(413)
    
    // Verify content by sampling pixels
    const resultCtx = result.getContext('2d')!
    const topPixel = resultCtx.getImageData(result.width / 2, 50, 1, 1).data
    const bottomPixel = resultCtx.getImageData(result.width / 2, result.height - 50, 1, 1).data
    
    // Top should be reddish, bottom should be blueish
    expect(topPixel[0]).toBeGreaterThan(100) // Red channel
    expect(bottomPixel[2]).toBeGreaterThan(100) // Blue channel
  })

  it('should handle upscaling when crop area is smaller than target', async () => {
    // Small source canvas
    const sourceCanvas = document.createElement('canvas')
    sourceCanvas.width = 200
    sourceCanvas.height = 280
    const ctx = sourceCanvas.getContext('2d')!
    ctx.fillStyle = 'green'
    ctx.fillRect(0, 0, 200, 280)

    // Crop entire image (smaller than target at 300 DPI)
    const cropArea = { x: 0, y: 0, width: 200, height: 280 }
    
    const result = await generateExactCrop(sourceCanvas, cropArea, 25, 35, 300)
    
    // Should be upscaled to exact dimensions
    expect(result.width).toBe(295)
    expect(result.height).toBe(413)
  })

  it('should handle downscaling when crop area is larger than target', async () => {
    // Large source canvas
    const sourceCanvas = document.createElement('canvas')
    sourceCanvas.width = 2000
    sourceCanvas.height = 3000
    const ctx = sourceCanvas.getContext('2d')!
    ctx.fillStyle = 'yellow'
    ctx.fillRect(0, 0, 2000, 3000)

    // Crop large area
    const cropArea = { x: 0, y: 0, width: 1000, height: 1400 }
    
    const result = await generateExactCrop(sourceCanvas, cropArea, 25, 35, 300)
    
    // Should be downscaled to exact dimensions
    expect(result.width).toBe(295)
    expect(result.height).toBe(413)
  })

  it('should maintain aspect ratio during scaling', async () => {
    const sourceCanvas = document.createElement('canvas')
    sourceCanvas.width = 500
    sourceCanvas.height = 700
    const ctx = sourceCanvas.getContext('2d')!
    ctx.fillStyle = 'purple'
    ctx.fillRect(0, 0, 500, 700)

    const cropArea = { x: 0, y: 0, width: 500, height: 700 }
    
    const result = await generateExactCrop(sourceCanvas, cropArea, 35, 49, 300)
    
    // 35mm x 49mm at 300 DPI = 413 x 579 pixels
    expect(result.width).toBe(413)
    expect(result.height).toBe(579)
    
    // Verify aspect ratio is maintained
    const sourceRatio = cropArea.width / cropArea.height // 500/700 = 0.714
    const targetRatio = result.width / result.height // 413/579 = 0.713
    expect(Math.abs(sourceRatio - targetRatio)).toBeLessThan(0.01)
  })
})
