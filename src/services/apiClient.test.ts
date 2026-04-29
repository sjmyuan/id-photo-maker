import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { processImageViaApi, type ApiProcessOptions } from './apiClient'
import { SIZE_OPTIONS } from '../components/size/CropEditor'

describe('processImageViaApi', () => {
  let mockFile: File
  const defaultOptions: ApiProcessOptions = {
    file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
    selectedSize: SIZE_OPTIONS[0],
    backgroundColor: '#0000FF',
    paperType: '6-inch',
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    requiredDPI: 300,
  }

  beforeEach(() => {
    mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns idPhoto and printLayout on success', async () => {
    const mockResponse = {
      success: true,
      idPhoto: 'base64idphoto==',
      printLayout: 'base64printlayout==',
      warnings: [],
    }
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response)

    const result = await processImageViaApi({ ...defaultOptions, file: mockFile })

    expect(result.idPhotoBase64).toBe('base64idphoto==')
    expect(result.printLayoutBase64).toBe('base64printlayout==')
    expect(result.warnings).toEqual([])
    expect(result.errors).toBeUndefined()
  })

  it('returns warnings when backend includes them', async () => {
    const mockResponse = {
      success: true,
      idPhoto: 'base64idphoto==',
      printLayout: 'base64printlayout==',
      warnings: ['Image was downscaled'],
    }
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response)

    const result = await processImageViaApi({ ...defaultOptions, file: mockFile })

    expect(result.warnings).toEqual(['Image was downscaled'])
  })

  it('returns errors array on 422 response', async () => {
    const mockResponse = {
      success: false,
      errors: [{ type: 'face-detection', message: 'No face detected' }],
    }
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 422,
      json: () => Promise.resolve(mockResponse),
    } as Response)

    const result = await processImageViaApi({ ...defaultOptions, file: mockFile })

    expect(result.errors).toHaveLength(1)
    expect(result.errors![0].type).toBe('face-detection')
    expect(result.errors![0].message).toBe('No face detected')
  })

  it('returns validation error on non-422 HTTP error', async () => {
    const mockResponse = {
      success: false,
      errors: [{ type: 'validation', message: 'Invalid sizeId' }],
    }
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve(mockResponse),
    } as Response)

    const result = await processImageViaApi({ ...defaultOptions, file: mockFile })

    expect(result.errors).toHaveLength(1)
    expect(result.errors![0].type).toBe('validation')
  })

  it('returns processing error when fetch throws (network error)', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    const result = await processImageViaApi({ ...defaultOptions, file: mockFile })

    expect(result.errors).toHaveLength(1)
    expect(result.errors![0].type).toBe('processing')
    expect(result.errors![0].message).toContain('Network error')
  })

  it('sends correct FormData fields to the API', async () => {
    const mockResponse = {
      success: true,
      idPhoto: 'base64==',
      printLayout: 'base64==',
      warnings: [],
    }
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response)

    await processImageViaApi({
      ...defaultOptions,
      file: mockFile,
      selectedSize: SIZE_OPTIONS[0],
      backgroundColor: '#FF0000',
      paperType: 'a4',
      margins: { top: 5, bottom: 5, left: 5, right: 5 },
      requiredDPI: 600,
    })

    expect(fetch).toHaveBeenCalledOnce()
    const [, init] = vi.mocked(fetch).mock.calls[0]
    const body = init?.body as FormData

    expect(body.get('sizeId')).toBe(SIZE_OPTIONS[0].id)
    expect(body.get('backgroundColor')).toBe('#FF0000')
    expect(body.get('paperType')).toBe('a4')
    expect(body.get('dpi')).toBe('600')
    expect(JSON.parse(body.get('margins') as string)).toEqual({
      top: 5, bottom: 5, left: 5, right: 5,
    })
    expect(body.get('image')).toBe(mockFile)
  })
})
