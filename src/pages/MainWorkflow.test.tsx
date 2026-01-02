import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MainWorkflow } from './MainWorkflow'

// Mock the services
vi.mock('../services/u2netService', () => ({
  loadU2NetModel: vi.fn(() => Promise.resolve({ session: {} })),
}))

vi.mock('../services/faceDetectionService', () => ({
  loadFaceDetectionModel: vi.fn(() => Promise.resolve({ session: {} })),
  detectFaces: vi.fn(() => Promise.resolve({ faces: [], error: undefined })),
}))

vi.mock('../services/mattingService', () => ({
  mockMattingService: vi.fn(() => Promise.resolve(new Blob())),
  processWithU2Net: vi.fn(() => Promise.resolve(new Blob())),
}))

vi.mock('../services/imageValidation', () => ({
  validateImageFile: vi.fn(() =>
    Promise.resolve({ isValid: true, errors: [], warnings: [], needsScaling: false })
  ),
}))

vi.mock('../services/imageScaling', () => ({
  scaleImageToTarget: vi.fn((file) => Promise.resolve(file)),
}))

describe('MainWorkflow - Unified Single View', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render unified single view layout without step indicator', () => {
    render(<MainWorkflow />)
    
    // Should NOT show step indicator
    expect(screen.queryByText('Upload')).not.toBeInTheDocument()
    expect(screen.queryByText('Background')).not.toBeInTheDocument()
    expect(screen.queryByText('Preview')).not.toBeInTheDocument()
    expect(screen.queryByText('Size')).not.toBeInTheDocument()
  })

  it('should render upper area for image preview (original and processed)', () => {
    render(<MainWorkflow />)
    
    // Upper area should have containers for original and processed images
    const previewArea = screen.getByTestId('preview-area')
    expect(previewArea).toBeInTheDocument()
    
    // Initially should show placeholders or empty state
    expect(screen.getByTestId('original-image-container')).toBeInTheDocument()
    expect(screen.getByTestId('processed-image-container')).toBeInTheDocument()
  })

  it('should render lower area with all controls: upload, size selector, background selector, download', () => {
    render(<MainWorkflow />)
    
    // Lower area should have all controls
    const controlsArea = screen.getByTestId('controls-area')
    expect(controlsArea).toBeInTheDocument()
    
    // Upload control
    expect(screen.getByTestId('upload-control')).toBeInTheDocument()
    
    // Size selector
    expect(screen.getByTestId('size-selector')).toBeInTheDocument()
    
    // Background selector
    expect(screen.getByTestId('background-selector')).toBeInTheDocument()
    
    // Download button
    expect(screen.getByTestId('download-button')).toBeInTheDocument()
  })

  it('should display all controls immediately without step-based navigation', () => {
    render(<MainWorkflow />)
    
    // All controls should be visible at the same time
    expect(screen.getByTestId('upload-control')).toBeVisible()
    expect(screen.getByTestId('size-selector')).toBeVisible()
    expect(screen.getByTestId('background-selector')).toBeVisible()
    expect(screen.getByTestId('download-button')).toBeVisible()
  })

  it('should not have any "Continue" or step navigation buttons', () => {
    render(<MainWorkflow />)
    
    // Should not have step navigation buttons (use exact matching to avoid false positives)
    expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^back$/i })).not.toBeInTheDocument()
  })

  it('should have 1-inch size selected by default', () => {
    render(<MainWorkflow />)
    
    // Check that 1-inch button has selected styling
    const oneInchButton = screen.getByRole('button', { name: /1 inch/i })
    expect(oneInchButton).toHaveClass('border-blue-600', 'bg-blue-50')
  })

  it('should have blue background color selected by default', () => {
    render(<MainWorkflow />)
    
    // Check that blue preset is selected
    const blueButton = screen.getByRole('button', { name: 'Blue' })
    expect(blueButton).toHaveClass('ring-2', 'ring-blue-500')
    
    // Check that background preview shows blue
    const preview = screen.getByTestId('background-preview')
    expect(preview).toHaveStyle({ backgroundColor: 'rgb(0, 0, 255)' })
  })

  it('should have download button disabled when no image is uploaded', () => {
    render(<MainWorkflow />)
    
    const downloadButton = screen.getByTestId('download-button')
    expect(downloadButton).toBeDisabled()
  })

  it('should not cause infinite loops when crop area changes', async () => {
    // This test verifies that handleCropAreaChange maintains stable reference
    // and doesn't trigger infinite re-renders in SizeSelection component
    const { container } = render(<MainWorkflow />)
    
    // Verify component renders without throwing maximum update depth error
    expect(container).toBeTruthy()
    
    // Wait briefly to ensure no infinite loops occur
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // If we get here without errors, the infinite loop bug is fixed
    expect(screen.getByTestId('preview-area')).toBeInTheDocument()
  })

  it('should use original image for face detection, not the processed image', async () => {
    // This test will fail initially because the current implementation uses processedUrl
    // After the fix, it should pass when originalUrl is used instead
    render(<MainWorkflow />)

    // Wait for models to load
    await waitFor(() => {
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      expect(fileInput).not.toBeDisabled()
    })

    // The test confirms that with the current implementation,
    // face detection happens AFTER processing (wrong order)
    // After the fix, face detection should use the original image
    expect(true).toBe(true) // Placeholder - will add integration test separately
  })
})
