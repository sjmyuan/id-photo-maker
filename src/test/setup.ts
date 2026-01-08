import '@testing-library/jest-dom'
import { vi } from 'vitest'
import '../i18n' // Initialize i18n for tests

// Polyfill Blob.arrayBuffer for testing environment
if (typeof Blob !== 'undefined' && !Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = async function() {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = () => reject(reader.error)
      reader.readAsArrayBuffer(this)
    })
  }
}

// Polyfill ImageData for testing environment
if (typeof ImageData === 'undefined') {
  // @ts-expect-error - Polyfilling ImageData for tests
  globalThis.ImageData = class ImageData {
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

  strokeRect() {
    // Mock implementation for drawing rectangle borders
  }

  strokeStyle: string | CanvasGradient | CanvasPattern = '#000000'
  lineWidth = 1

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
  
  // Mock toBlob method - creates a valid minimal PNG
  HTMLCanvasElement.prototype.toBlob = vi.fn(function(this: HTMLCanvasElement, callback: BlobCallback) {
    // Create a minimal valid PNG file structure
    // PNG signature + IHDR chunk + IEND chunk
    const width = this.width || 1
    const height = this.height || 1
    
    // PNG signature
    const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
    
    // IHDR chunk (image header)
    const ihdr = new Uint8Array([
      0, 0, 0, 13, // Chunk length (13 bytes)
      73, 72, 68, 82, // "IHDR"
      0, 0, 0, width, // Width (4 bytes, big-endian)
      0, 0, 0, height, // Height (4 bytes, big-endian)
      8, // Bit depth
      6, // Color type (RGBA)
      0, 0, 0, // Compression, filter, interlace
      // CRC (calculated for type + data)
      0x5c, 0x11, 0xd4, 0x7c // Placeholder CRC
    ])
    
    // IDAT chunk (image data - minimal compressed data)
    const idat = new Uint8Array([
      0, 0, 0, 14, // Chunk length
      73, 68, 65, 84, // "IDAT"
      0x78, 0x9c, // zlib header
      0x62, 0x00, 0x01, 0x00, 0x00, 0xff, 0xff, 0x03, 0x00, 0x00, 0x06, // Minimal compressed data
      0x57, 0xbf, 0xab, 0xd4 // Placeholder CRC
    ])
    
    // IEND chunk (end)
    const iend = new Uint8Array([
      0, 0, 0, 0, // Chunk length (0 bytes)
      73, 69, 78, 68, // "IEND"
      0xae, 0x42, 0x60, 0x82 // CRC
    ])
    
    // Combine all parts
    const pngData = new Uint8Array(signature.length + ihdr.length + idat.length + iend.length)
    pngData.set(signature, 0)
    pngData.set(ihdr, signature.length)
    pngData.set(idat, signature.length + ihdr.length)
    pngData.set(iend, signature.length + ihdr.length + idat.length)
    
    const blob = new Blob([pngData], { type: 'image/png' })
    setTimeout(() => callback(blob), 0)
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

// Mock Image loading
if (typeof Image !== 'undefined') {
  const OriginalImage = Image
  
  // @ts-expect-error - Overriding Image class
  global.Image = class MockImage extends OriginalImage {
    private _src = ''
    
    constructor(width?: number, height?: number) {
      super(width, height)
      // Set default dimensions
      Object.defineProperty(this, 'naturalWidth', { writable: true, value: width || 100 })
      Object.defineProperty(this, 'naturalHeight', { writable: true, value: height || 100 })
    }
    
    get src(): string {
      return this._src
    }
    
    set src(value: string) {
      this._src = value
      // Automatically trigger onload for data URLs and blob URLs
      setTimeout(() => {
        if (this.onload) {
          this.onload(new Event('load'))
        }
      }, 10)
    }
    
    onload: ((this: GlobalEventHandlers, ev: Event) => unknown) | null = null
    onerror: OnErrorEventHandler = null
  }
}
