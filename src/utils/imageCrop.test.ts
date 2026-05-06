import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getImageDimensions, downscaleImageForDetect, cropImageToArea } from './imageCrop'
import type { CropArea } from './cropAreaCalculation'

// Create a minimal fake File for testing
function makeFile(name = 'photo.jpg', type = 'image/jpeg'): File {
  const blob = new Blob(['fake-image-bytes'], { type })
  return new File([blob], name, { type })
}

function stubImageWithDimensions(width: number, height: number) {
  class MockImage {
    naturalWidth = width
    naturalHeight = height
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    set src(_: string) {
      queueMicrotask(() => this.onload?.())
    }
  }
  vi.stubGlobal('Image', MockImage)
}

describe('getImageDimensions', () => {
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-url')
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    stubImageWithDimensions(1200, 900)
  })

  afterEach(() => {
    createObjectURLSpy.mockRestore()
    revokeObjectURLSpy.mockRestore()
    vi.unstubAllGlobals()
  })

  it('resolves with width and height from the image', async () => {
    const file = makeFile()
    const dims = await getImageDimensions(file)
    expect(dims.width).toBe(1200)
    expect(dims.height).toBe(900)
  })

  it('revokes the object URL after loading', async () => {
    const file = makeFile()
    await getImageDimensions(file)
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:fake-url')
  })
})

describe('downscaleImageForDetect', () => {
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-url')
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  })

  afterEach(() => {
    createObjectURLSpy.mockRestore()
    revokeObjectURLSpy.mockRestore()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('returns a File when the image exceeds maxPx', async () => {
    stubImageWithDimensions(1200, 900)
    const file = makeFile()
    const result = await downscaleImageForDetect(file, 800)
    expect(result).toBeInstanceOf(File)
  })

  it('sets the canvas to the correct scaled dimensions (landscape)', async () => {
    // 1200×900 → maxPx=800 → should scale to 800×600
    stubImageWithDimensions(1200, 900)
    const canvasElements: HTMLCanvasElement[] = []
    const origCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreateElement(tag)
      if (tag === 'canvas') canvasElements.push(el as HTMLCanvasElement)
      return el
    })

    const file = makeFile()
    await downscaleImageForDetect(file, 800)

    const canvas = canvasElements[0]
    expect(canvas?.width).toBe(800)
    expect(canvas?.height).toBe(600)
  })

  it('sets the canvas to the correct scaled dimensions (portrait)', async () => {
    // 600×1200 → maxPx=800 → should scale to 400×800
    stubImageWithDimensions(600, 1200)
    const canvasElements: HTMLCanvasElement[] = []
    const origCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreateElement(tag)
      if (tag === 'canvas') canvasElements.push(el as HTMLCanvasElement)
      return el
    })

    const file = makeFile()
    await downscaleImageForDetect(file, 800)

    const canvas = canvasElements[0]
    expect(canvas?.width).toBe(400)
    expect(canvas?.height).toBe(800)
  })

  it('does not enlarge an image already within maxPx', async () => {
    // 400×300 is already within 800px — canvas should keep original dimensions
    stubImageWithDimensions(400, 300)
    const canvasElements: HTMLCanvasElement[] = []
    const origCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreateElement(tag)
      if (tag === 'canvas') canvasElements.push(el as HTMLCanvasElement)
      return el
    })

    const file = makeFile()
    await downscaleImageForDetect(file, 800)

    const canvas = canvasElements[0]
    expect(canvas?.width).toBe(400)
    expect(canvas?.height).toBe(300)
  })
})

describe('cropImageToArea', () => {
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-url')
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    stubImageWithDimensions(1200, 900)
  })

  afterEach(() => {
    createObjectURLSpy.mockRestore()
    revokeObjectURLSpy.mockRestore()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('returns a File', async () => {
    const file = makeFile()
    const cropArea: CropArea = { x: 100, y: 50, width: 300, height: 420 }
    const result = await cropImageToArea(file, cropArea)
    expect(result).toBeInstanceOf(File)
  })

  it('sets canvas dimensions to the crop area', async () => {
    const canvasElements: HTMLCanvasElement[] = []
    const origCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreateElement(tag)
      if (tag === 'canvas') canvasElements.push(el as HTMLCanvasElement)
      return el
    })

    const file = makeFile()
    const cropArea: CropArea = { x: 100, y: 50, width: 300, height: 420 }
    await cropImageToArea(file, cropArea)

    const canvas = canvasElements[0]
    expect(canvas?.width).toBe(300)
    expect(canvas?.height).toBe(420)
  })
})
