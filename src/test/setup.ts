import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Polyfill ImageData for testing environment
if (typeof ImageData === 'undefined') {
  // @ts-expect-error - Polyfilling ImageData for tests
  global.ImageData = class ImageData {
    data: Uint8ClampedArray
    width: number
    height: number

    constructor(dataOrWidth: Uint8ClampedArray | number, widthOrHeight: number, height?: number) {
      if (typeof dataOrWidth === 'number') {
        // ImageData(width, height)
        this.width = dataOrWidth
        this.height = widthOrHeight
        this.data = new Uint8ClampedArray(dataOrWidth * widthOrHeight * 4)
      } else {
        // ImageData(data, width, height)
        this.data = dataOrWidth
        this.width = widthOrHeight
        this.height = height || dataOrWidth.length / (widthOrHeight * 4)
      }
    }
  }
}

// Mock HTMLCanvasElement methods for testing
class MockCanvasRenderingContext2D {
  canvas: HTMLCanvasElement
  fillStyle: string | CanvasGradient | CanvasPattern = '#000000'
  private imageData: ImageData | null = null
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  drawImage() {
    // Mock implementation
  }

  getImageData(_sx: number, _sy: number, sw: number, sh: number): ImageData {
    // If we already have imageData stored (from putImageData), return that
    if (this.imageData && this.imageData.width === sw && this.imageData.height === sh) {
      return this.imageData
    }
    
    const data = new Uint8ClampedArray(sw * sh * 4)
    // Fill with varied test data to simulate an actual image
    // Create a pattern with center being darker (subject) and edges being lighter (background)
    const centerX = sw / 2
    const centerY = sh / 2
    
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const i = (y * sw + x) * 4
        const dx = x - centerX
        const dy = y - centerY
        const dist = Math.sqrt(dx * dx + dy * dy)
        const maxDist = Math.sqrt(centerX * centerX + centerY * centerY)
        const distRatio = dist / maxDist
        
        // Edges are lighter (background), center is darker (subject)
        const brightness = Math.floor(100 + distRatio * 155)
        
        data[i] = brightness // R
        data[i + 1] = brightness // G
        data[i + 2] = brightness // B
        data[i + 3] = 255 // A (fully opaque initially)
      }
    }
    const newImageData = new ImageData(data, sw, sh)
    this.imageData = newImageData
    return newImageData
  }

  putImageData(imageData: ImageData) {
    // Store the image data so subsequent getImageData calls return the modified data
    this.imageData = imageData
  }

  createImageData(sw: number, sh: number): ImageData {
    const data = new Uint8ClampedArray(sw * sh * 4)
    return new ImageData(data, sw, sh)
  }

  fillRect() {
    // Mock implementation
  }
}

// Mock HTMLCanvasElement
if (typeof HTMLCanvasElement !== 'undefined') {
  const contextMap = new WeakMap<HTMLCanvasElement, MockCanvasRenderingContext2D>()
  
  HTMLCanvasElement.prototype.getContext = vi.fn(function(this: HTMLCanvasElement, contextId: string) {
    if (contextId === '2d') {
      // Return existing context if one was already created for this canvas
      let ctx = contextMap.get(this)
      if (!ctx) {
        ctx = new MockCanvasRenderingContext2D(this)
        contextMap.set(this, ctx)
      }
      return ctx as unknown as CanvasRenderingContext2D
    }
    return null
  }) as typeof HTMLCanvasElement.prototype.getContext

  HTMLCanvasElement.prototype.toDataURL = vi.fn(function() {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  })
}

// Mock localStorage
class LocalStorageMock {
  private store: Map<string, string>

  constructor() {
    this.store = new Map()
  }

  clear() {
    this.store.clear()
  }

  getItem(key: string): string | null {
    return this.store.get(key) || null
  }

  setItem(key: string, value: string) {
    this.store.set(key, value)
  }

  removeItem(key: string) {
    this.store.delete(key)
  }

  get length() {
    return this.store.size
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys())
    return keys[index] || null
  }
}

// @ts-expect-error - Mocking localStorage
global.localStorage = new LocalStorageMock()
