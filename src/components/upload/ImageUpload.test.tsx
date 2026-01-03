import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ImageUpload } from './ImageUpload'

// Mock the services
vi.mock('../../services/imageValidation', () => ({
  validateImageFile: vi.fn(),
}))

vi.mock('../../services/imageScaling', () => ({
  scaleImageToTarget: vi.fn(),
}))

vi.mock('../../services/mattingService', () => ({
  mockMattingService: vi.fn(),
  processWithU2Net: vi.fn(),
}))

vi.mock('../../utils/deviceCapability', () => ({
  detectDeviceCapability: vi.fn(),
}))

import { validateImageFile } from '../../services/imageValidation'
import { scaleImageToTarget } from '../../services/imageScaling'
import { mockMattingService } from '../../services/mattingService'
import { detectDeviceCapability } from '../../utils/deviceCapability'

describe('ImageUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mocks
    vi.mocked(detectDeviceCapability).mockReturnValue({
      hardwareConcurrency: 8,
      performanceClass: 'high',
      expectedProcessingTime: 3000,
    })
  })

  it('should render file input', () => {
    render(<ImageUpload />)
    
    const fileInput = screen.getByTestId('file-input')
    expect(fileInput).toBeInTheDocument()
    expect(fileInput).toHaveAttribute('type', 'file')
    expect(fileInput).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp')
  })

  it('should trigger validation when file is selected', async () => {
    vi.mocked(validateImageFile).mockResolvedValue({
      isValid: true,
      fileSize: 5 * 1024 * 1024,
      needsScaling: false,
      dimensions: { width: 2000, height: 1500 },
      errors: [],
      warnings: [],
    })

    render(<ImageUpload />)
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('file-input')
    
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(validateImageFile).toHaveBeenCalledWith(file)
    })
  })

  it('should show warning when file is larger than 10MB', async () => {
    vi.mocked(validateImageFile).mockResolvedValue({
      isValid: true,
      fileSize: 12 * 1024 * 1024,
      needsScaling: true,
      dimensions: { width: 4000, height: 3000 },
      errors: [],
      warnings: ['File size exceeds 10MB. Image will be automatically scaled down.'],
    })

    render(<ImageUpload />)
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    Object.defineProperty(file, 'size', { value: 12 * 1024 * 1024 })
    const fileInput = screen.getByTestId('file-input')
    
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText(/File size exceeds 10MB/i)).toBeInTheDocument()
    })
  })

  it('should trigger auto-scaling for files larger than 10MB', async () => {
    vi.mocked(validateImageFile).mockResolvedValue({
      isValid: true,
      fileSize: 15 * 1024 * 1024,
      needsScaling: true,
      dimensions: { width: 5000, height: 4000 },
      errors: [],
      warnings: ['File size exceeds 10MB. Image will be automatically scaled down.'],
    })

    const scaledBlob = new Blob(['scaled'], { type: 'image/jpeg' })
    vi.mocked(scaleImageToTarget).mockResolvedValue(scaledBlob)

    vi.mocked(mockMattingService).mockResolvedValue(
      new Blob(['matted'], { type: 'image/png' })
    )

    render(<ImageUpload />)
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    Object.defineProperty(file, 'size', { value: 15 * 1024 * 1024 })
    const fileInput = screen.getByTestId('file-input')
    
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(scaleImageToTarget).toHaveBeenCalledWith(file, 10)
    })
  })

  it('should complete upload within time limits for high-end device', async () => {
    vi.mocked(validateImageFile).mockResolvedValue({
      isValid: true,
      fileSize: 5 * 1024 * 1024,
      needsScaling: false,
      dimensions: { width: 2000, height: 1500 },
      errors: [],
      warnings: [],
    })

    vi.mocked(mockMattingService).mockResolvedValue(
      new Blob(['matted'], { type: 'image/png' })
    )

    render(<ImageUpload />)
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('file-input')
    
    const startTime = Date.now()
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByTestId('processing-complete')).toBeInTheDocument()
    }, { timeout: 5000 })

    const endTime = Date.now()
    const elapsedTime = endTime - startTime

    // Should complete within expected time (3s) plus reasonable overhead
    expect(elapsedTime).toBeLessThan(4000)
  })

  it('should complete upload within time limits for mid-range device', async () => {
    vi.mocked(detectDeviceCapability).mockReturnValue({
      hardwareConcurrency: 4,
      performanceClass: 'medium',
      expectedProcessingTime: 5000,
    })

    vi.mocked(validateImageFile).mockResolvedValue({
      isValid: true,
      fileSize: 5 * 1024 * 1024,
      needsScaling: false,
      dimensions: { width: 2000, height: 1500 },
      errors: [],
      warnings: [],
    })

    vi.mocked(mockMattingService).mockResolvedValue(
      new Blob(['matted'], { type: 'image/png' })
    )

    render(<ImageUpload />)
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('file-input')
    
    const startTime = Date.now()
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByTestId('processing-complete')).toBeInTheDocument()
    }, { timeout: 6000 })

    const endTime = Date.now()
    const elapsedTime = endTime - startTime

    // Should complete within expected time (5s) plus reasonable overhead
    expect(elapsedTime).toBeLessThan(6000)
  })

  it('should display processing time after upload completes', async () => {
    vi.mocked(validateImageFile).mockResolvedValue({
      isValid: true,
      fileSize: 5 * 1024 * 1024,
      needsScaling: false,
      dimensions: { width: 2000, height: 1500 },
      errors: [],
      warnings: [],
    })

    vi.mocked(mockMattingService).mockResolvedValue(
      new Blob(['matted'], { type: 'image/png' })
    )

    render(<ImageUpload />)
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('file-input')
    
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByTestId('elapsed-time')).toBeInTheDocument()
    })

    const elapsedTimeElement = screen.getByTestId('elapsed-time')
    expect(elapsedTimeElement.textContent).toMatch(/\d+ms/)
  })

  it('should handle validation errors', async () => {
    vi.mocked(validateImageFile).mockResolvedValue({
      isValid: false,
      fileSize: 0,
      needsScaling: false,
      dimensions: { width: 100, height: 100 },
      errors: ['Invalid file type'],
      warnings: [],
    })

    render(<ImageUpload />)
    
    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    const fileInput = screen.getByTestId('file-input')
    
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText(/Invalid file type/i)).toBeInTheDocument()
    })
  })
})
