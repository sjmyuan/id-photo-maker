import { describe, it, expect } from 'vitest'
import { calculateCropAreaFromNormalisedFace, type NormalisedFaceBox } from './cropAreaCalculation'

describe('calculateCropAreaFromNormalisedFace', () => {
  const imageWidth = 1000
  const imageHeight = 1000
  const aspectRatio = 25 / 35 // 1-inch

  it('returns a crop area with x >= 0 and y >= 0', () => {
    const face: NormalisedFaceBox = { x: 0.4, y: 0.3, width: 0.1, height: 0.12 }
    const crop = calculateCropAreaFromNormalisedFace(face, aspectRatio, imageWidth, imageHeight)
    expect(crop.x).toBeGreaterThanOrEqual(0)
    expect(crop.y).toBeGreaterThanOrEqual(0)
  })

  it('returns a crop area that does not exceed image bounds', () => {
    const face: NormalisedFaceBox = { x: 0.4, y: 0.3, width: 0.1, height: 0.12 }
    const crop = calculateCropAreaFromNormalisedFace(face, aspectRatio, imageWidth, imageHeight)
    expect(crop.x + crop.width).toBeLessThanOrEqual(imageWidth)
    expect(crop.y + crop.height).toBeLessThanOrEqual(imageHeight)
  })

  it('preserves the requested aspect ratio', () => {
    const face: NormalisedFaceBox = { x: 0.4, y: 0.3, width: 0.1, height: 0.12 }
    const crop = calculateCropAreaFromNormalisedFace(face, aspectRatio, imageWidth, imageHeight)
    expect(crop.width / crop.height).toBeCloseTo(aspectRatio, 6)
  })

  it('centres the crop on the face centre', () => {
    // Face centred at (500, 500) in a 1000×1000 image
    const face: NormalisedFaceBox = { x: 0.45, y: 0.45, width: 0.1, height: 0.1 }
    const crop = calculateCropAreaFromNormalisedFace(face, 1.0, imageWidth, imageHeight)
    const cropCenterX = crop.x + crop.width / 2
    const cropCenterY = crop.y + crop.height / 2
    expect(cropCenterX).toBeCloseTo(500, 4)
    expect(cropCenterY).toBeCloseTo(500, 4)
  })

  it('clamps to image bounds when face is near an edge', () => {
    // Face in the top-left corner
    const face: NormalisedFaceBox = { x: 0, y: 0, width: 0.05, height: 0.06 }
    const crop = calculateCropAreaFromNormalisedFace(face, 1.0, 500, 500)
    expect(crop.x).toBeGreaterThanOrEqual(0)
    expect(crop.y).toBeGreaterThanOrEqual(0)
    expect(crop.x + crop.width).toBeLessThanOrEqual(500)
    expect(crop.y + crop.height).toBeLessThanOrEqual(500)
  })

  it('expands crop beyond the raw face bbox', () => {
    // The crop should include head and shoulders — wider/taller than the face
    const face: NormalisedFaceBox = { x: 0.4, y: 0.4, width: 0.1, height: 0.1 }
    const crop = calculateCropAreaFromNormalisedFace(face, 1.0, imageWidth, imageHeight)
    // Face is 100px wide/tall; crop should be larger
    expect(crop.width).toBeGreaterThan(100)
    expect(crop.height).toBeGreaterThan(100)
  })
})
