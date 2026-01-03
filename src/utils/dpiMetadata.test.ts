/**
 * Tests for DPI Metadata Utility
 * Tests embedding DPI metadata into PNG image blobs
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { embedDPIMetadata } from './dpiMetadata'

// Mock Image to work in test environment
class MockImage {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  src = ''
  naturalWidth = 100
  naturalHeight = 100

  constructor() {
    // Trigger onload asynchronously
    setTimeout(() => {
      if (this.onload) this.onload()
    }, 10)
  }
}

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).Image = MockImage
})

describe('embedDPIMetadata', () => {
  it('should embed DPI metadata into a PNG blob', async () => {
    // Create a simple test canvas with content
    const canvas = document.createElement('canvas')
    canvas.width = 100
    canvas.height = 100
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = 'red'
    ctx.fillRect(0, 0, 100, 100)

    // Convert to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/png')
    })

    // Embed DPI metadata
    const dpi = 300
    const resultBlob = await embedDPIMetadata(blob, dpi)

    // Verify result is a blob
    expect(resultBlob).toBeInstanceOf(Blob)
    expect(resultBlob.type).toBe('image/png')
    expect(resultBlob.size).toBeGreaterThan(0)
    
    // Verify PNG signature is still present
    const arrayBuffer = await resultBlob.arrayBuffer()
    const data = new Uint8Array(arrayBuffer)
    const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
    expect(data.slice(0, 8)).toEqual(PNG_SIGNATURE)
    
    // Verify pHYs chunk is present
    const pngText = new TextDecoder().decode(data)
    expect(pngText).toContain('pHYs')
  }, 10000)

  it('should handle different DPI values', async () => {
    const canvas = document.createElement('canvas')
    canvas.width = 100
    canvas.height = 100
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = 'green'
    ctx.fillRect(0, 0, 100, 100)

    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/png')
    })

    // Test with different DPI values
    const dpiValues = [72, 150, 300, 600]
    
    for (const dpi of dpiValues) {
      const resultBlob = await embedDPIMetadata(blob, dpi)
      expect(resultBlob).toBeInstanceOf(Blob)
      expect(resultBlob.type).toBe('image/png')
      
      // Verify pHYs chunk exists
      const arrayBuffer = await resultBlob.arrayBuffer()
      const data = new Uint8Array(arrayBuffer)
      const pngText = new TextDecoder().decode(data)
      expect(pngText).toContain('pHYs')
    }
  }, 10000)

  it('should preserve PNG structure', async () => {
    const canvas = document.createElement('canvas')
    canvas.width = 50
    canvas.height = 75
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = 'blue'
    ctx.fillRect(0, 0, 50, 75)

    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/png')
    })

    const resultBlob = await embedDPIMetadata(blob, 300)

    // Verify PNG signature
    const arrayBuffer = await resultBlob.arrayBuffer()
    const data = new Uint8Array(arrayBuffer)
    const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
    expect(data.slice(0, 8)).toEqual(PNG_SIGNATURE)
    
    // Verify IHDR chunk follows signature
    const ihdrType = String.fromCharCode(...Array.from(data.slice(12, 16)))
    expect(ihdrType).toBe('IHDR')
    
    // Verify IEND chunk is present at the end
    const iendPos = data.length - 12
    const iendType = String.fromCharCode(...Array.from(data.slice(iendPos + 4, iendPos + 8)))
    expect(iendType).toBe('IEND')
  }, 10000)
})
