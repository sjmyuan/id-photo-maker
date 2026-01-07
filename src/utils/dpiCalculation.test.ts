import { describe, it, expect } from 'vitest'
import { calculateDPI } from './dpiCalculation'

describe('calculateDPI', () => {
  it('should calculate exact 300 DPI for 1-inch photo (25x35mm)', () => {
    // At 300 DPI: 25mm = 295.28 pixels, 35mm = 413.39 pixels
    const widthPx = 295
    const heightPx = 413
    const widthMm = 25
    const heightMm = 35

    const result = calculateDPI(widthPx, heightPx, widthMm, heightMm)

    expect(result.widthDPI).toBeCloseTo(300, 0)
    expect(result.heightDPI).toBeCloseTo(300, 0)
    expect(result.minDPI).toBeCloseTo(300, 0)
  })

  it('should calculate exact 300 DPI for 2-inch photo (35x49mm)', () => {
    // At 300 DPI: 35mm = 413.39 pixels, 49mm = 578.74 pixels
    const widthPx = 413
    const heightPx = 579
    const widthMm = 35
    const heightMm = 49

    const result = calculateDPI(widthPx, heightPx, widthMm, heightMm)

    expect(result.widthDPI).toBeCloseTo(300, 0)
    expect(result.heightDPI).toBeCloseTo(300, 0)
    expect(result.minDPI).toBeCloseTo(300, 0)
  })

  it('should calculate below 300 DPI when crop area is too small', () => {
    // Only 200 pixels for 25mm = 200 DPI
    const widthPx = 200
    const heightPx = 280
    const widthMm = 25
    const heightMm = 35

    const result = calculateDPI(widthPx, heightPx, widthMm, heightMm)

    expect(result.widthDPI).toBeCloseTo(203.2, 1)
    expect(result.heightDPI).toBeCloseTo(203.2, 1)
    expect(result.minDPI).toBeCloseTo(203.2, 1)
  })

  it('should calculate above 300 DPI when crop area is large', () => {
    // 600 pixels for 25mm = 600 DPI approx
    const widthPx = 600
    const heightPx = 840
    const widthMm = 25
    const heightMm = 35

    const result = calculateDPI(widthPx, heightPx, widthMm, heightMm)

    expect(result.widthDPI).toBeCloseTo(609.6, 1)
    expect(result.heightDPI).toBeCloseTo(609.6, 1)
    expect(result.minDPI).toBeCloseTo(609.6, 1)
  })

  it('should handle different DPI for width and height correctly', () => {
    // Width: 300 pixels / 25mm = 304.8 DPI
    // Height: 350 pixels / 35mm = 254 DPI
    const widthPx = 300
    const heightPx = 350
    const widthMm = 25
    const heightMm = 35

    const result = calculateDPI(widthPx, heightPx, widthMm, heightMm)

    expect(result.widthDPI).toBeCloseTo(304.8, 1)
    expect(result.heightDPI).toBeCloseTo(254.0, 1)
    expect(result.minDPI).toBeCloseTo(254.0, 1) // Should be the minimum
  })

  it('should calculate DPI for 3-inch photo (35x52mm)', () => {
    // At 300 DPI: 35mm = 413.39 pixels, 52mm = 614.17 pixels
    const widthPx = 413
    const heightPx = 614
    const widthMm = 35
    const heightMm = 52

    const result = calculateDPI(widthPx, heightPx, widthMm, heightMm)

    expect(result.widthDPI).toBeCloseTo(300, 0)
    expect(result.heightDPI).toBeCloseTo(300, 0)
    expect(result.minDPI).toBeCloseTo(300, 0)
  })

  it('should handle very small crop areas', () => {
    const widthPx = 50
    const heightPx = 70
    const widthMm = 25
    const heightMm = 35

    const result = calculateDPI(widthPx, heightPx, widthMm, heightMm)

    expect(result.widthDPI).toBeCloseTo(50.8, 1)
    expect(result.heightDPI).toBeCloseTo(50.8, 1)
    expect(result.minDPI).toBeCloseTo(50.8, 1)
  })

  it('should handle very large crop areas', () => {
    const widthPx = 3000
    const heightPx = 4200
    const widthMm = 25
    const heightMm = 35

    const result = calculateDPI(widthPx, heightPx, widthMm, heightMm)

    expect(result.widthDPI).toBeCloseTo(3048, 0)
    expect(result.heightDPI).toBeCloseTo(3048, 0)
    expect(result.minDPI).toBeCloseTo(3048, 0)
  })
})
