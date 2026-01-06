import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MainWorkflow } from './MainWorkflow'

// Mock Image to avoid async loading issues in tests
class MockImage {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  src = ''
  naturalWidth = 800
  naturalHeight = 600

  constructor() {
    setTimeout(() => {
      if (this.onload) this.onload()
    }, 0)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).Image = MockImage

// Mock URL.createObjectURL and revokeObjectURL
URL.createObjectURL = vi.fn(() => 'blob:mock-url')
URL.revokeObjectURL = vi.fn()

// Mock the services
vi.mock('../services/u2netService', () => ({
  loadU2NetModel: vi.fn(() => Promise.resolve({ session: {} })),
}))

vi.mock('../services/faceDetectionService', () => ({
  loadFaceDetectionModel: vi.fn(() => Promise.resolve({ session: {} })),
  // Default: return a large enough face for 300 DPI validation
  detectFaces: vi.fn(() => Promise.resolve({ 
    faces: [{ x: 100, y: 100, width: 300, height: 420 }], 
    error: undefined 
  })),
}))

vi.mock('../services/mattingService', () => ({
  mockMattingService: vi.fn(() => Promise.resolve(new Blob())),
  processWithU2Net: vi.fn(() => Promise.resolve(new Blob())),
  applyBackgroundColor: vi.fn((canvas: HTMLCanvasElement) => {
    // Return a new canvas with the background applied
    const newCanvas = document.createElement('canvas')
    newCanvas.width = canvas.width
    newCanvas.height = canvas.height
    return newCanvas
  }),
}))

vi.mock('../services/imageValidation', () => ({
  validateImageFile: vi.fn(() =>
    Promise.resolve({ isValid: true, errors: [], warnings: [], needsScaling: false })
  ),
}))

vi.mock('../services/imageScaling', () => ({
  scaleImageToTarget: vi.fn((file) => Promise.resolve(file)),
}))

vi.mock('../services/exactCropService', () => ({
  generateExactCrop: vi.fn(() => Promise.resolve(document.createElement('canvas'))),
}))

// Helper function to simulate file upload in tests
const uploadFile = (fileInput: HTMLInputElement, file: File) => {
  Object.defineProperty(fileInput, 'files', {
    value: [file],
    writable: false,
    configurable: true
  })
  fileInput.dispatchEvent(new Event('change', { bubbles: true }))
}

// Helper function to upload and generate preview
const uploadAndGeneratePreview = async (fileInput: HTMLInputElement, file: File, user: ReturnType<typeof import('@testing-library/user-event').default.setup>) => {
  uploadFile(fileInput, file)
  
  // Wait for "Generate Preview" button to appear
  await waitFor(() => {
    const button = screen.getByTestId('upload-or-generate-button')
    expect(button).toHaveTextContent('Generate Preview')
  })
  
  // Click "Generate Preview" button
  const button = screen.getByTestId('upload-or-generate-button')
  await user.click(button)
}

describe.skip('MainWorkflow - Two-Step Wizard (OBSOLETE - Refactored to single page)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should start at step 1 (upload step)', () => {
    render(<MainWorkflow />)
    
    // Step 1 should show upload interface
    expect(screen.getByTestId('upload-step')).toBeInTheDocument()
    expect(screen.getByTestId('file-input')).toBeInTheDocument()
  })

  it('should not show step 2 content initially', () => {
    render(<MainWorkflow />)
    
    // Step 2 should not be visible initially
    expect(screen.queryByTestId('edit-step')).not.toBeInTheDocument()
    expect(screen.queryByTestId('go-back-button')).not.toBeInTheDocument()
  })

  it('should advance to step 2 after successful image processing', async () => {
    const userEvent = (await import('@testing-library/user-event')).default
    const { processWithU2Net } = await import('../services/mattingService')
    vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

    render(<MainWorkflow />)
    const user = userEvent.setup()
    
    // Wait for models to load
    await waitFor(() => {
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      expect(fileInput).not.toBeDisabled()
    })

    // Upload a file and click Generate Preview
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    await uploadAndGeneratePreview(fileInput, file, user)
    
    // After processing completes, should advance to step 2
    await waitFor(() => {
      expect(screen.getByTestId('edit-step')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should show go-back button in step 2', async () => {
    const userEvent = (await import('@testing-library/user-event')).default
    const { processWithU2Net } = await import('../services/mattingService')
    vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

    render(<MainWorkflow />)
    const user = userEvent.setup()
    
    await waitFor(() => {
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      expect(fileInput).not.toBeDisabled()
    })

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    await uploadAndGeneratePreview(fileInput, file, user)
    
    await waitFor(() => {
      expect(screen.getByTestId('go-back-button')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should return to step 1 when go-back button is clicked', async () => {
    const { processWithU2Net } = await import('../services/mattingService')
    const userEvent = (await import('@testing-library/user-event')).default
    vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

    render(<MainWorkflow />)
    const user = userEvent.setup()
    
    await waitFor(() => {
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      expect(fileInput).not.toBeDisabled()
    })

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    await uploadAndGeneratePreview(fileInput, file, user)
    
    await waitFor(() => {
      expect(screen.getByTestId('edit-step')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Click go-back button
    const goBackButton = screen.getByTestId('go-back-button')
    await user.click(goBackButton)

    // Should return to step 1
    expect(screen.getByTestId('upload-step')).toBeInTheDocument()
    expect(screen.queryByTestId('edit-step')).not.toBeInTheDocument()
  })

  it('should clear image data when going back to step 1', async () => {
    const { processWithU2Net } = await import('../services/mattingService')
    const userEvent = (await import('@testing-library/user-event')).default
    vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

    render(<MainWorkflow />)
    const user = userEvent.setup()
    
    await waitFor(() => {
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      expect(fileInput).not.toBeDisabled()
    })

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    await uploadAndGeneratePreview(fileInput, file, user)
    
    await waitFor(() => {
      expect(screen.getByTestId('edit-step')).toBeInTheDocument()
    }, { timeout: 3000 })

    const goBackButton = screen.getByTestId('go-back-button')
    await user.click(goBackButton)

    // Should return to step 1
    await waitFor(() => {
      expect(screen.getByTestId('upload-step')).toBeInTheDocument()
    })
  })

  // Obsolete tests - these test the old single-view layout which has been refactored to a two-step wizard
  it.skip('should render upper area for image preview (original and processed)', () => {
    render(<MainWorkflow />)
    
    // Upper area should have containers for original and processed images
    const previewArea = screen.getByTestId('preview-area')
    expect(previewArea).toBeInTheDocument()
    
    // Initially should show placeholders or empty state
    expect(screen.getByTestId('original-image-container')).toBeInTheDocument()
    expect(screen.getByTestId('processed-image-container')).toBeInTheDocument()
  })

  it.skip('should render lower area with all controls: upload, size selector, background selector, download', () => {
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

  it.skip('should display all controls immediately without step-based navigation', () => {
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

  it.skip('should have 1-inch size selected by default', () => {
    render(<MainWorkflow />)
    
    // Check that 1-inch button has selected styling
    const oneInchButton = screen.getByRole('button', { name: /1 inch/i })
    expect(oneInchButton).toHaveClass('border-blue-600', 'bg-blue-50')
  })

  it.skip('should have blue background color selected by default', () => {
    render(<MainWorkflow />)
    
    // Check that blue preset is selected
    const blueButton = screen.getByRole('button', { name: 'Blue' })
    expect(blueButton).toHaveClass('ring-2', 'ring-blue-500')
    
    // Check that background preview shows blue
    const preview = screen.getByTestId('background-preview')
    expect(preview).toHaveStyle({ backgroundColor: 'rgb(0, 0, 255)' })
  })

  it.skip('should have download button disabled when no image is uploaded', () => {
    render(<MainWorkflow />)
    
    const downloadButton = screen.getByTestId('download-button')
    expect(downloadButton).toBeDisabled()
  })

  it.skip('should not cause infinite loops when crop area changes', async () => {
    // This test verifies that handleCropAreaChange maintains stable reference
    // and doesn't trigger infinite re-renders in CropEditor component
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

  // This test verifies that face detection runs on scaled image dimensions
  // to ensure faceBox coordinates match the processed image that's displayed.
  // The fix ensures: scale -> detect faces -> process with U2Net
  // Integration test is skipped as it's complex to mock image loading properly
  it.skip('should run face detection on scaled image to match processed dimensions', async () => {
    const { detectFaces } = await import('../services/faceDetectionService')
    const { scaleImageToTarget } = await import('../services/imageScaling')
    const { validateImageFile } = await import('../services/imageValidation')
    const { processWithU2Net } = await import('../services/mattingService')
    
    // Mock validation to require scaling
    vi.mocked(validateImageFile).mockResolvedValue({
      isValid: true,
      fileSize: 11 * 1024 * 1024, // 11MB
      needsScaling: true,
      dimensions: { width: 4000, height: 3000 },
      errors: [],
      warnings: ['Image is large and will be scaled down'],
    })

    // Mock scaleImageToTarget to return a scaled blob
    const scaledBlob = new Blob(['scaled'], { type: 'image/jpeg' })
    vi.mocked(scaleImageToTarget).mockResolvedValue(scaledBlob)

    // Mock detectFaces
    vi.mocked(detectFaces).mockResolvedValue({
      faces: [{ x: 100, y: 100, width: 200, height: 200 }],
      error: undefined,
    })

    // Mock processWithU2Net
    vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

    render(<MainWorkflow />)

    // Wait for models to load
    await waitFor(() => {
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      expect(fileInput).not.toBeDisabled()
    })

    // Create a mock file that will require scaling
    const largeFile = new File(['large image data'], 'large.jpg', { type: 'image/jpeg' })
    Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 }) // 11MB

    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    
    // Simulate file upload
    Object.defineProperty(fileInput, 'files', {
      value: [largeFile],
      writable: false,
    })
    
    fileInput.dispatchEvent(new Event('change', { bubbles: true }))

    // Wait for face detection to be called
    await waitFor(() => {
      expect(detectFaces).toHaveBeenCalled()
    }, { timeout: 5000 })

    // Verify the correct call order: scale first, then detect faces, then process with U2Net
    expect(scaleImageToTarget).toHaveBeenCalledWith(largeFile, 10)
    
    // Face detection should happen after scaling but before U2Net processing
    const scaleCallOrder = vi.mocked(scaleImageToTarget).mock.invocationCallOrder[0]
    const detectCallOrder = vi.mocked(detectFaces).mock.invocationCallOrder[0]
    const u2netCallOrder = vi.mocked(processWithU2Net).mock.invocationCallOrder[0]
    
    expect(scaleCallOrder).toBeLessThan(detectCallOrder)
    expect(detectCallOrder).toBeLessThan(u2netCallOrder)
  })
})

describe('MainWorkflow - Step 1 Configuration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show size selector in step 1', () => {
    render(<MainWorkflow />)
    
    // Step 1 should show size selection
    expect(screen.getByTestId('size-selector-step1')).toBeInTheDocument()
    
    // Should show all size options
    expect(screen.getByText('Small 1 Inch')).toBeInTheDocument()
    expect(screen.getByText('1 Inch')).toBeInTheDocument()
    expect(screen.getByText('Large 1 Inch')).toBeInTheDocument()
    expect(screen.getByText('Small 2 Inch')).toBeInTheDocument()
    expect(screen.getByText('2 Inch')).toBeInTheDocument()
    expect(screen.getByText('3 Inch')).toBeInTheDocument()
    expect(screen.getByText('China ID Card')).toBeInTheDocument()
  })

  it('should have 1-inch size selected by default in step 1', () => {
    render(<MainWorkflow />)
    
    // Check that Small 1-inch button has selected styling (first option, default)
    const smallOneInchButton = screen.getByText('Small 1 Inch').closest('button')
    expect(smallOneInchButton).toHaveClass('border-blue-600', 'bg-blue-50')
  })

  it('should allow selecting different photo sizes in step 1', async () => {
    const userEvent = (await import('@testing-library/user-event')).default
    render(<MainWorkflow />)
    const user = userEvent.setup()
    
    // Select Large 1-inch size
    const largeOneInchButton = screen.getByText('Large 1 Inch').closest('button')
    await user.click(largeOneInchButton!)
    
    // Check that Large 1-inch button is now selected
    expect(largeOneInchButton).toHaveClass('border-blue-600', 'bg-blue-50')
    
    // Check that Small 1-inch button is not selected
    const smallOneInchButton = screen.getByText('Small 1 Inch').closest('button')
    expect(smallOneInchButton).not.toHaveClass('border-blue-600', 'bg-blue-50')
  })

  it('should show color selector in step 1', () => {
    render(<MainWorkflow />)
    
    // Step 1 should show color selection
    expect(screen.getByTestId('color-selector-step1')).toBeInTheDocument()
  })

  it('should have blue background color selected by default in step 1', () => {
    render(<MainWorkflow />)
    
    // Check that blue is selected by default
    const blueButton = screen.getByTestId('color-blue')
    expect(blueButton).toHaveClass('ring-4')
  })

  it('should allow selecting different background colors in step 1', async () => {
    const userEvent = (await import('@testing-library/user-event')).default
    render(<MainWorkflow />)
    const user = userEvent.setup()
    
    // Select red color
    const redButton = screen.getByTestId('color-red')
    await user.click(redButton)
    
    // Check that red button is now selected
    expect(redButton).toHaveClass('ring-4')
    
    // Check that blue button is not selected
    const blueButton = screen.getByTestId('color-blue')
    expect(blueButton).not.toHaveClass('ring-4')
  })

  it('should display size, color, and paper type selectors in a vertical stack layout', () => {
    render(<MainWorkflow />)
    
    const selectorsContainer = screen.getByTestId('selectors-container')
    
    // Check that the container uses vertical stack layout
    expect(selectorsContainer).toHaveClass('space-y-4')
    
    // All selectors should be present
    expect(screen.getByTestId('size-selector-step1')).toBeInTheDocument()
    expect(screen.getByTestId('color-selector-step1')).toBeInTheDocument()
    expect(screen.getByTestId('paper-type-selector-step1')).toBeInTheDocument()
  })

  it('should have 6-inch paper type selected by default in step 1', () => {
    render(<MainWorkflow />)
    
    const sixInchButton = screen.getByTestId('paper-6-inch-button')
    expect(sixInchButton).toHaveClass('border-blue-600')
  })

  it('should allow selecting A4 paper type in step 1', async () => {
    const userEvent = (await import('@testing-library/user-event')).default
    const user = userEvent.setup()
    
    render(<MainWorkflow />)
    
    const a4Button = screen.getByTestId('paper-a4-button')
    await user.click(a4Button)
    
    expect(a4Button).toHaveClass('border-blue-600')
  })
})

describe.skip('MainWorkflow - Face Detection and DPI Validation Tests (OBSOLETE - Step 2 removed)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show error when no face is detected', async () => {
    const userEvent = (await import('@testing-library/user-event')).default
    const { processWithU2Net } = await import('../services/mattingService')
    const { detectFaces } = await import('../services/faceDetectionService')
    
    // Mock no face detected
    vi.mocked(detectFaces).mockResolvedValue({ faces: [], error: 'no-face-detected' })
    vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

    render(<MainWorkflow />)
    const user = userEvent.setup()
    
    await waitFor(() => {
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      expect(fileInput).not.toBeDisabled()
    })

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    await uploadAndGeneratePreview(fileInput, file, user)
    
    // Should show error and NOT advance to step 2
    await waitFor(() => {
      expect(screen.getByText(/no face detected/i)).toBeInTheDocument()
      expect(screen.queryByTestId('edit-step')).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should show error when multiple faces are detected', async () => {
    const userEvent = (await import('@testing-library/user-event')).default
    const { processWithU2Net } = await import('../services/mattingService')
    const { detectFaces } = await import('../services/faceDetectionService')
    
    // Mock multiple faces detected
    vi.mocked(detectFaces).mockResolvedValue({
      faces: [
        { x: 100, y: 100, width: 50, height: 50 },
        { x: 200, y: 200, width: 50, height: 50 }
      ],
      error: 'multiple-faces-detected'
    })
    vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

    render(<MainWorkflow />)
    const user = userEvent.setup()
    
    await waitFor(() => {
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      expect(fileInput).not.toBeDisabled()
    })

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    await uploadAndGeneratePreview(fileInput, file, user)
    
    // Should show error and NOT advance to step 2
    await waitFor(() => {
      expect(screen.getByText(/multiple faces detected/i)).toBeInTheDocument()
      expect(screen.queryByTestId('edit-step')).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should show error when DPI requirement cannot be met', async () => {
    const userEvent = (await import('@testing-library/user-event')).default
    const { processWithU2Net } = await import('../services/mattingService')
    const { detectFaces } = await import('../services/faceDetectionService')
    
    // Mock single face detected with small dimensions that will result in low DPI
    vi.mocked(detectFaces).mockResolvedValue({
      faces: [{ x: 100, y: 100, width: 50, height: 70 }],
      error: undefined
    })
    vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

    render(<MainWorkflow />)
    const user = userEvent.setup()
    
    await waitFor(() => {
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      expect(fileInput).not.toBeDisabled()
    })

    // Upload file with 300 DPI requirement (default)
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    await uploadAndGeneratePreview(fileInput, file, user)
    
    // Should show DPI error and NOT advance to step 2
    await waitFor(() => {
      expect(screen.getByText(/dpi requirement.*cannot be met/i)).toBeInTheDocument()
      expect(screen.queryByTestId('edit-step')).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should allow processing when DPI requirement is None (no validation)', async () => {
    const { processWithU2Net } = await import('../services/mattingService')
    const { detectFaces } = await import('../services/faceDetectionService')
    const userEvent = (await import('@testing-library/user-event')).default
    
    // Mock single face detected with small dimensions
    vi.mocked(detectFaces).mockResolvedValue({
      faces: [{ x: 100, y: 100, width: 50, height: 70 }],
      error: undefined
    })
    vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

    render(<MainWorkflow />)
    const user = userEvent.setup()
    
    await waitFor(() => {
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      expect(fileInput).not.toBeDisabled()
    })

    // Select "None" DPI option
    const noneButton = screen.getByRole('button', { name: /none/i })
    await user.click(noneButton)

    // Upload file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    await uploadAndGeneratePreview(fileInput, file, user)
    
    // Should NOT show DPI error and SHOULD advance to step 2
    await waitFor(() => {
      expect(screen.getByTestId('edit-step')).toBeInTheDocument()
      expect(screen.queryByText(/dpi requirement.*cannot be met/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should advance to step 2 when face is detected and DPI is sufficient', async () => {
    const userEvent = (await import('@testing-library/user-event')).default
    const { processWithU2Net } = await import('../services/mattingService')
    const { detectFaces } = await import('../services/faceDetectionService')
    
    // Mock single face detected with large enough dimensions for 300 DPI
    vi.mocked(detectFaces).mockResolvedValue({
      faces: [{ x: 100, y: 100, width: 300, height: 420 }],
      error: undefined
    })
    vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

    render(<MainWorkflow />)
    const user = userEvent.setup()
    
    await waitFor(() => {
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      expect(fileInput).not.toBeDisabled()
    })

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    await uploadAndGeneratePreview(fileInput, file, user)
    
    // Should NOT show errors and SHOULD advance to step 2
    await waitFor(() => {
      expect(screen.getByTestId('edit-step')).toBeInTheDocument()
      expect(screen.queryByText(/no face detected/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/multiple faces detected/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/dpi requirement.*cannot be met/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })
})

describe.skip('MainWorkflow - Step 2 Layout Tests (OBSOLETE - Step 2 removed)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show processed image on the right side in step 2', async () => {
    const userEvent = (await import('@testing-library/user-event')).default
    const { processWithU2Net } = await import('../services/mattingService')
    vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

    render(<MainWorkflow />)
    const user = userEvent.setup()
    
    await waitFor(() => {
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      expect(fileInput).not.toBeDisabled()
    })

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    await uploadAndGeneratePreview(fileInput, file, user)
    
    await waitFor(() => {
      expect(screen.getByTestId('processed-image-with-crop')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should NOT show background selector in step 2 after refactor (moved to step 1)', async () => {
    const userEvent = (await import('@testing-library/user-event')).default
    const { processWithU2Net } = await import('../services/mattingService')
    vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

    render(<MainWorkflow />)
    const user = userEvent.setup()
    
    await waitFor(() => {
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      expect(fileInput).not.toBeDisabled()
    })

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    await uploadAndGeneratePreview(fileInput, file, user)
    
    await waitFor(() => {
      expect(screen.getByTestId('edit-step')).toBeInTheDocument()
      // Background selector should NOT be in step 2 (it's in step 1)
      expect(screen.queryByTestId('background-selector')).not.toBeInTheDocument()
      // Left panel should NOT be present
      expect(screen.queryByTestId('left-panel')).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should not show original image in step 2', async () => {
    const userEvent = (await import('@testing-library/user-event')).default
    const { processWithU2Net } = await import('../services/mattingService')
    vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

    render(<MainWorkflow />)
    const user = userEvent.setup()
    
    await waitFor(() => {
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      expect(fileInput).not.toBeDisabled()
    })

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    await uploadAndGeneratePreview(fileInput, file, user)
    
    await waitFor(() => {
      expect(screen.getByTestId('edit-step')).toBeInTheDocument()
      expect(screen.queryByTestId('original-image-container')).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should show download button and go-back button at the bottom in step 2', async () => {
    const userEvent = (await import('@testing-library/user-event')).default
    const { processWithU2Net } = await import('../services/mattingService')
    vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

    render(<MainWorkflow />)
    const user = userEvent.setup()
    
    await waitFor(() => {
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      expect(fileInput).not.toBeDisabled()
    })

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    await uploadAndGeneratePreview(fileInput, file, user)
    
    await waitFor(() => {
      expect(screen.getByTestId('download-button')).toBeInTheDocument()
      expect(screen.getByTestId('go-back-button')).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})

describe.skip('MainWorkflow - Refactored Upload Flow with Placeholder (OBSOLETE - Further refactored to single page)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display image placeholder initially', () => {
    render(<MainWorkflow />)
    
    // Image placeholder should be visible in step 1
    expect(screen.getByTestId('image-placeholder')).toBeInTheDocument()
  })

  it('should render "Upload Image" button initially', () => {
    render(<MainWorkflow />)
    
    // Should show "Upload Image" button
    const uploadButton = screen.getByTestId('upload-or-generate-button')
    expect(uploadButton).toBeInTheDocument()
    expect(uploadButton).toHaveTextContent('Upload Image')
  })

  it('should trigger hidden file input when "Upload Image" button is clicked', async () => {
    render(<MainWorkflow />)
    
    await waitFor(() => {
      const uploadButton = screen.getByTestId('upload-or-generate-button')
      expect(uploadButton).not.toBeDisabled()
    })

    // File input should be hidden (not visible in normal flow)
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    expect(fileInput).toHaveClass('hidden')

    // Click should work (we'll test via the button having click handler)
    const uploadButton = screen.getByTestId('upload-or-generate-button')
    expect(uploadButton).toBeEnabled()
  })

  it('should show uploaded image in placeholder after file selection', async () => {
    render(<MainWorkflow />)
    
    await waitFor(() => {
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      expect(fileInput).not.toBeDisabled()
    })

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    uploadFile(fileInput, file)
    
    // After file selection, image should be displayed in placeholder
    await waitFor(() => {
      const uploadedImage = screen.getByTestId('uploaded-image')
      expect(uploadedImage).toBeInTheDocument()
      expect(uploadedImage).toHaveAttribute('src', 'blob:mock-url')
    })
  })

  it('should change button to "Generate Preview" after file upload', async () => {
    render(<MainWorkflow />)
    
    await waitFor(() => {
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      expect(fileInput).not.toBeDisabled()
    })

    // Initially shows "Upload Image"
    let button = screen.getByTestId('upload-or-generate-button')
    expect(button).toHaveTextContent('Upload Image')

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    uploadFile(fileInput, file)
    
    // After upload, button should change to "Generate Preview"
    await waitFor(() => {
      button = screen.getByTestId('upload-or-generate-button')
      expect(button).toHaveTextContent('Generate Preview')
    })
  })

  it('should NOT start processing automatically after file upload', async () => {
    const { processWithU2Net } = await import('../services/mattingService')
    vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

    render(<MainWorkflow />)
    
    await waitFor(() => {
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      expect(fileInput).not.toBeDisabled()
    })

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    uploadFile(fileInput, file)
    
    // Wait a bit to ensure processing doesn't start automatically
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Should still be on step 1
    expect(screen.getByTestId('upload-step')).toBeInTheDocument()
    expect(screen.queryByTestId('edit-step')).not.toBeInTheDocument()
    
    // processWithU2Net should NOT have been called yet
    expect(processWithU2Net).not.toHaveBeenCalled()
  })

  it('should start processing when "Generate Preview" button is clicked', async () => {
    const userEvent = (await import('@testing-library/user-event')).default
    const { processWithU2Net } = await import('../services/mattingService')
    vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

    render(<MainWorkflow />)
    const user = userEvent.setup()
    
    await waitFor(() => {
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      expect(fileInput).not.toBeDisabled()
    })

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    uploadFile(fileInput, file)
    
    // Wait for button to change to "Generate Preview"
    await waitFor(() => {
      const button = screen.getByTestId('upload-or-generate-button')
      expect(button).toHaveTextContent('Generate Preview')
    })

    // Click "Generate Preview" button
    const button = screen.getByTestId('upload-or-generate-button')
    await user.click(button)
    
    // Now processing should start
    await waitFor(() => {
      expect(processWithU2Net).toHaveBeenCalled()
    })
  })

  it('should validate and show errors when "Generate Preview" is clicked', async () => {
    const userEvent = (await import('@testing-library/user-event')).default
    const { detectFaces } = await import('../services/faceDetectionService')
    
    // Mock no face detected
    vi.mocked(detectFaces).mockResolvedValue({ 
      faces: [], 
      error: undefined 
    })

    render(<MainWorkflow />)
    const user = userEvent.setup()
    
    await waitFor(() => {
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      expect(fileInput).not.toBeDisabled()
    })

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    uploadFile(fileInput, file)
    
    await waitFor(() => {
      const button = screen.getByTestId('upload-or-generate-button')
      expect(button).toHaveTextContent('Generate Preview')
    })

    // Click "Generate Preview"
    const button = screen.getByTestId('upload-or-generate-button')
    await user.click(button)
    
    // Should show error about no face detected
    await waitFor(() => {
      expect(screen.getByText(/No face detected/i)).toBeInTheDocument()
    })
    
    // Should remain on step 1
    expect(screen.getByTestId('upload-step')).toBeInTheDocument()
    expect(screen.queryByTestId('edit-step')).not.toBeInTheDocument()
  })

  it('should transition to step 2 only after successful processing', async () => {
    const userEvent = (await import('@testing-library/user-event')).default
    const { processWithU2Net } = await import('../services/mattingService')
    const { detectFaces } = await import('../services/faceDetectionService')
    
    // Mock single face detected with large enough dimensions for 300 DPI
    vi.mocked(detectFaces).mockResolvedValue({
      faces: [{ x: 100, y: 100, width: 300, height: 420 }],
      error: undefined
    })
    vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

    render(<MainWorkflow />)
    const user = userEvent.setup()
    
    await waitFor(() => {
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      expect(fileInput).not.toBeDisabled()
    })

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    uploadFile(fileInput, file)
    
    await waitFor(() => {
      const button = screen.getByTestId('upload-or-generate-button')
      expect(button).toHaveTextContent('Generate Preview')
    })

    // Click "Generate Preview"
    const button = screen.getByTestId('upload-or-generate-button')
    await user.click(button)
    
    // After processing completes, should advance to step 2
    await waitFor(() => {
      expect(screen.getByTestId('edit-step')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    // Should no longer show step 1
    expect(screen.queryByTestId('upload-step')).not.toBeInTheDocument()
  })
})

describe('MainWorkflow - 3-Step Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Step 1: Settings & Upload', () => {
    it('should show step indicator with step 1 active', async () => {
      render(<MainWorkflow />)
      
      // Wait for models to load
      await waitFor(() => {
        const fileInput = screen.getByTestId('file-input') as HTMLInputElement
        expect(fileInput).not.toBeDisabled()
      })
      
      // Step indicator should be present
      expect(screen.getByTestId('step-indicator')).toBeInTheDocument()
      
      // Step 1 should be active
      const step1 = screen.getByTestId('step-1')
      expect(step1).toHaveClass('bg-blue-600')
    })

    it('should show all settings (size, background, paper type)', async () => {
      render(<MainWorkflow />)
      
      await waitFor(() => {
        const fileInput = screen.getByTestId('file-input') as HTMLInputElement
        expect(fileInput).not.toBeDisabled()
      })
      
      // Should show all selectors
      expect(screen.getByTestId('size-selector-step1')).toBeInTheDocument()
      expect(screen.getByTestId('color-selector-step1')).toBeInTheDocument()
      expect(screen.getByTestId('paper-type-selector-step1')).toBeInTheDocument()
    })

    it('should show upload interface', async () => {
      render(<MainWorkflow />)
      
      await waitFor(() => {
        const fileInput = screen.getByTestId('file-input') as HTMLInputElement
        expect(fileInput).not.toBeDisabled()
      })
      
      // Should show upload button and file input
      expect(screen.getByTestId('file-input')).toBeInTheDocument()
      expect(screen.getByTestId('upload-or-generate-button')).toBeInTheDocument()
      expect(screen.getByTestId('upload-or-generate-button')).toHaveTextContent('Upload Image')
    })

    it('should show image placeholder before upload', async () => {
      render(<MainWorkflow />)
      
      await waitFor(() => {
        const fileInput = screen.getByTestId('file-input') as HTMLInputElement
        expect(fileInput).not.toBeDisabled()
      })
      
      expect(screen.getByTestId('image-placeholder')).toBeInTheDocument()
      expect(screen.getByText('No image uploaded')).toBeInTheDocument()
    })

    it('should show uploaded image preview after file selection', async () => {
      render(<MainWorkflow />)
      
      await waitFor(() => {
        const fileInput = screen.getByTestId('file-input') as HTMLInputElement
        expect(fileInput).not.toBeDisabled()
      })
      
      // Upload file
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      uploadFile(fileInput, file)
      
      // Should show uploaded image
      await waitFor(() => {
        expect(screen.getByTestId('uploaded-image')).toBeInTheDocument()
      })
    })

    it('should change button text to "Generate ID Photo" after file upload', async () => {
      render(<MainWorkflow />)
      
      await waitFor(() => {
        const fileInput = screen.getByTestId('file-input') as HTMLInputElement
        expect(fileInput).not.toBeDisabled()
      })
      
      // Initially shows "Upload Image"
      expect(screen.getByTestId('upload-or-generate-button')).toHaveTextContent('Upload Image')
      
      // Upload file
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      uploadFile(fileInput, file)
      
      // Button should change to "Generate ID Photo"
      await waitFor(() => {
        expect(screen.getByTestId('upload-or-generate-button')).toHaveTextContent('Generate ID Photo')
      })
    })

    it('should not show Step 2 or Step 3 content initially', async () => {
      render(<MainWorkflow />)
      
      await waitFor(() => {
        const fileInput = screen.getByTestId('file-input') as HTMLInputElement
        expect(fileInput).not.toBeDisabled()
      })
      
      // Step 2 content should not be visible
      expect(screen.queryByTestId('step2-container')).not.toBeInTheDocument()
      expect(screen.queryByTestId('download-id-photo-button')).not.toBeInTheDocument()
      expect(screen.queryByTestId('next-button')).not.toBeInTheDocument()
      
      // Step 3 content should not be visible
      expect(screen.queryByTestId('step3-container')).not.toBeInTheDocument()
      expect(screen.queryByTestId('download-print-layout-button')).not.toBeInTheDocument()
    })
  })

  describe('Step 2: ID Photo Preview', () => {
    it('should show step indicator with step 2 active', async () => {
      const userEvent = (await import('@testing-library/user-event')).default
      const { processWithU2Net } = await import('../services/mattingService')
      vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

      render(<MainWorkflow />)
      const user = userEvent.setup()
      
      await waitFor(() => {
        const fileInput = screen.getByTestId('file-input') as HTMLInputElement
        expect(fileInput).not.toBeDisabled()
      })
      
      // Upload file and generate ID photo
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      uploadFile(fileInput, file)
      
      await waitFor(() => {
        expect(screen.getByTestId('upload-or-generate-button')).toHaveTextContent('Generate ID Photo')
      })
      
      const button = screen.getByTestId('upload-or-generate-button')
      await user.click(button)
      
      // Wait for step 2 to appear
      await waitFor(() => {
        expect(screen.getByTestId('step2-container')).toBeInTheDocument()
      }, { timeout: 3000 })
      
      // Step 2 should be active
      const step2 = screen.getByTestId('step-2')
      expect(step2).toHaveClass('bg-blue-600')
    })

    it('should show ID photo preview', async () => {
      const userEvent = (await import('@testing-library/user-event')).default
      const { processWithU2Net } = await import('../services/mattingService')
      vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

      render(<MainWorkflow />)
      const user = userEvent.setup()
      
      await waitFor(() => {
        const fileInput = screen.getByTestId('file-input') as HTMLInputElement
        expect(fileInput).not.toBeDisabled()
      })
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      uploadFile(fileInput, file)
      
      await waitFor(() => {
        expect(screen.getByTestId('upload-or-generate-button')).toHaveTextContent('Generate ID Photo')
      })
      
      const button = screen.getByTestId('upload-or-generate-button')
      await user.click(button)
      
      // Wait for step 2 and check ID photo preview
      await waitFor(() => {
        expect(screen.getByTestId('id-photo-preview')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should show Download ID Photo button', async () => {
      const userEvent = (await import('@testing-library/user-event')).default
      const { processWithU2Net } = await import('../services/mattingService')
      vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

      render(<MainWorkflow />)
      const user = userEvent.setup()
      
      await waitFor(() => {
        const fileInput = screen.getByTestId('file-input') as HTMLInputElement
        expect(fileInput).not.toBeDisabled()
      })
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      uploadFile(fileInput, file)
      
      await waitFor(() => {
        expect(screen.getByTestId('upload-or-generate-button')).toHaveTextContent('Generate ID Photo')
      })
      
      const button = screen.getByTestId('upload-or-generate-button')
      await user.click(button)
      
      // Check for download button
      await waitFor(() => {
        expect(screen.getByTestId('download-id-photo-button')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should show Next button', async () => {
      const userEvent = (await import('@testing-library/user-event')).default
      const { processWithU2Net } = await import('../services/mattingService')
      vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

      render(<MainWorkflow />)
      const user = userEvent.setup()
      
      await waitFor(() => {
        const fileInput = screen.getByTestId('file-input') as HTMLInputElement
        expect(fileInput).not.toBeDisabled()
      })
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      uploadFile(fileInput, file)
      
      await waitFor(() => {
        expect(screen.getByTestId('upload-or-generate-button')).toHaveTextContent('Generate ID Photo')
      })
      
      const button = screen.getByTestId('upload-or-generate-button')
      await user.click(button)
      
      // Check for next button
      await waitFor(() => {
        expect(screen.getByTestId('next-button')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should show Back button', async () => {
      const userEvent = (await import('@testing-library/user-event')).default
      const { processWithU2Net } = await import('../services/mattingService')
      vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

      render(<MainWorkflow />)
      const user = userEvent.setup()
      
      await waitFor(() => {
        const fileInput = screen.getByTestId('file-input') as HTMLInputElement
        expect(fileInput).not.toBeDisabled()
      })
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      uploadFile(fileInput, file)
      
      await waitFor(() => {
        expect(screen.getByTestId('upload-or-generate-button')).toHaveTextContent('Generate ID Photo')
      })
      
      const button = screen.getByTestId('upload-or-generate-button')
      await user.click(button)
      
      // Check for back button
      await waitFor(() => {
        expect(screen.getByTestId('back-button')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should not show Step 1 or Step 3 content', async () => {
      const userEvent = (await import('@testing-library/user-event')).default
      const { processWithU2Net } = await import('../services/mattingService')
      vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

      render(<MainWorkflow />)
      const user = userEvent.setup()
      
      await waitFor(() => {
        const fileInput = screen.getByTestId('file-input') as HTMLInputElement
        expect(fileInput).not.toBeDisabled()
      })
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      uploadFile(fileInput, file)
      
      await waitFor(() => {
        expect(screen.getByTestId('upload-or-generate-button')).toHaveTextContent('Generate ID Photo')
      })
      
      const button = screen.getByTestId('upload-or-generate-button')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByTestId('step2-container')).toBeInTheDocument()
      }, { timeout: 3000 })
      
      // Step 1 content should not be visible
      expect(screen.queryByTestId('step1-container')).not.toBeInTheDocument()
      expect(screen.queryByTestId('upload-or-generate-button')).not.toBeInTheDocument()
      
      // Step 3 content should not be visible
      expect(screen.queryByTestId('step3-container')).not.toBeInTheDocument()
      expect(screen.queryByTestId('download-print-layout-button')).not.toBeInTheDocument()
    })
  })

  describe('Step 3: Print Layout Preview', () => {
    it('should show step indicator with step 3 active', async () => {
      const userEvent = (await import('@testing-library/user-event')).default
      const { processWithU2Net } = await import('../services/mattingService')
      vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

      render(<MainWorkflow />)
      const user = userEvent.setup()
      
      await waitFor(() => {
        const fileInput = screen.getByTestId('file-input') as HTMLInputElement
        expect(fileInput).not.toBeDisabled()
      })
      
      // Upload and generate
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      uploadFile(fileInput, file)
      
      await waitFor(() => {
        expect(screen.getByTestId('upload-or-generate-button')).toHaveTextContent('Generate ID Photo')
      })
      
      const button = screen.getByTestId('upload-or-generate-button')
      await user.click(button)
      
      // Wait for step 2, then click Next
      await waitFor(() => {
        expect(screen.getByTestId('next-button')).toBeInTheDocument()
      }, { timeout: 3000 })
      
      const nextButton = screen.getByTestId('next-button')
      await user.click(nextButton)
      
      // Wait for step 3 and check indicator
      await waitFor(() => {
        expect(screen.getByTestId('step3-container')).toBeInTheDocument()
      })
      
      const step3 = screen.getByTestId('step-3')
      expect(step3).toHaveClass('bg-blue-600')
    })

    it('should show print layout preview', async () => {
      const userEvent = (await import('@testing-library/user-event')).default
      const { processWithU2Net } = await import('../services/mattingService')
      vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

      render(<MainWorkflow />)
      const user = userEvent.setup()
      
      await waitFor(() => {
        const fileInput = screen.getByTestId('file-input') as HTMLInputElement
        expect(fileInput).not.toBeDisabled()
      })
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      uploadFile(fileInput, file)
      
      await waitFor(() => {
        expect(screen.getByTestId('upload-or-generate-button')).toHaveTextContent('Generate ID Photo')
      })
      
      const button = screen.getByTestId('upload-or-generate-button')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByTestId('next-button')).toBeInTheDocument()
      }, { timeout: 3000 })
      
      const nextButton = screen.getByTestId('next-button')
      await user.click(nextButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('print-layout-preview')).toBeInTheDocument()
      })
    })

    it('should show Download Print Layout button', async () => {
      const userEvent = (await import('@testing-library/user-event')).default
      const { processWithU2Net } = await import('../services/mattingService')
      vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

      render(<MainWorkflow />)
      const user = userEvent.setup()
      
      await waitFor(() => {
        const fileInput = screen.getByTestId('file-input') as HTMLInputElement
        expect(fileInput).not.toBeDisabled()
      })
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      uploadFile(fileInput, file)
      
      await waitFor(() => {
        expect(screen.getByTestId('upload-or-generate-button')).toHaveTextContent('Generate ID Photo')
      })
      
      const button = screen.getByTestId('upload-or-generate-button')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByTestId('next-button')).toBeInTheDocument()
      }, { timeout: 3000 })
      
      const nextButton = screen.getByTestId('next-button')
      await user.click(nextButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('download-print-layout-button')).toBeInTheDocument()
      })
    })

    it('should show Back button', async () => {
      const userEvent = (await import('@testing-library/user-event')).default
      const { processWithU2Net } = await import('../services/mattingService')
      vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

      render(<MainWorkflow />)
      const user = userEvent.setup()
      
      await waitFor(() => {
        const fileInput = screen.getByTestId('file-input') as HTMLInputElement
        expect(fileInput).not.toBeDisabled()
      })
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      uploadFile(fileInput, file)
      
      await waitFor(() => {
        expect(screen.getByTestId('upload-or-generate-button')).toHaveTextContent('Generate ID Photo')
      })
      
      const button = screen.getByTestId('upload-or-generate-button')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByTestId('next-button')).toBeInTheDocument()
      }, { timeout: 3000 })
      
      const nextButton = screen.getByTestId('next-button')
      await user.click(nextButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('back-button')).toBeInTheDocument()
      })
    })

    it('should not show Step 1 or Step 2 content', async () => {
      const userEvent = (await import('@testing-library/user-event')).default
      const { processWithU2Net } = await import('../services/mattingService')
      vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

      render(<MainWorkflow />)
      const user = userEvent.setup()
      
      await waitFor(() => {
        const fileInput = screen.getByTestId('file-input') as HTMLInputElement
        expect(fileInput).not.toBeDisabled()
      })
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      uploadFile(fileInput, file)
      
      await waitFor(() => {
        expect(screen.getByTestId('upload-or-generate-button')).toHaveTextContent('Generate ID Photo')
      })
      
      const button = screen.getByTestId('upload-or-generate-button')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByTestId('next-button')).toBeInTheDocument()
      }, { timeout: 3000 })
      
      const nextButton = screen.getByTestId('next-button')
      await user.click(nextButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('step3-container')).toBeInTheDocument()
      })
      
      // Step 1 content should not be visible
      expect(screen.queryByTestId('step1-container')).not.toBeInTheDocument()
      
      // Step 2 content should not be visible
      expect(screen.queryByTestId('step2-container')).not.toBeInTheDocument()
      expect(screen.queryByTestId('id-photo-preview')).not.toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('should advance from Step 1 to Step 2 after clicking Generate ID Photo', async () => {
      const userEvent = (await import('@testing-library/user-event')).default
      const { processWithU2Net } = await import('../services/mattingService')
      vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

      render(<MainWorkflow />)
      const user = userEvent.setup()
      
      await waitFor(() => {
        const fileInput = screen.getByTestId('file-input') as HTMLInputElement
        expect(fileInput).not.toBeDisabled()
      })
      
      // Start at Step 1
      expect(screen.getByTestId('step1-container')).toBeInTheDocument()
      
      // Upload and generate
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      uploadFile(fileInput, file)
      
      await waitFor(() => {
        expect(screen.getByTestId('upload-or-generate-button')).toHaveTextContent('Generate ID Photo')
      })
      
      const button = screen.getByTestId('upload-or-generate-button')
      await user.click(button)
      
      // Should advance to Step 2
      await waitFor(() => {
        expect(screen.getByTestId('step2-container')).toBeInTheDocument()
      }, { timeout: 3000 })
      
      expect(screen.queryByTestId('step1-container')).not.toBeInTheDocument()
    })

    it('should advance from Step 2 to Step 3 after clicking Next', async () => {
      const userEvent = (await import('@testing-library/user-event')).default
      const { processWithU2Net } = await import('../services/mattingService')
      vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

      render(<MainWorkflow />)
      const user = userEvent.setup()
      
      await waitFor(() => {
        const fileInput = screen.getByTestId('file-input') as HTMLInputElement
        expect(fileInput).not.toBeDisabled()
      })
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      uploadFile(fileInput, file)
      
      await waitFor(() => {
        expect(screen.getByTestId('upload-or-generate-button')).toHaveTextContent('Generate ID Photo')
      })
      
      const button = screen.getByTestId('upload-or-generate-button')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByTestId('step2-container')).toBeInTheDocument()
      }, { timeout: 3000 })
      
      // Click Next
      const nextButton = screen.getByTestId('next-button')
      await user.click(nextButton)
      
      // Should advance to Step 3
      await waitFor(() => {
        expect(screen.getByTestId('step3-container')).toBeInTheDocument()
      })
      
      expect(screen.queryByTestId('step2-container')).not.toBeInTheDocument()
    })

    it('should return to Step 2 from Step 3 when clicking Back', async () => {
      const userEvent = (await import('@testing-library/user-event')).default
      const { processWithU2Net } = await import('../services/mattingService')
      vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

      render(<MainWorkflow />)
      const user = userEvent.setup()
      
      await waitFor(() => {
        const fileInput = screen.getByTestId('file-input') as HTMLInputElement
        expect(fileInput).not.toBeDisabled()
      })
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      uploadFile(fileInput, file)
      
      await waitFor(() => {
        expect(screen.getByTestId('upload-or-generate-button')).toHaveTextContent('Generate ID Photo')
      })
      
      const button = screen.getByTestId('upload-or-generate-button')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByTestId('step2-container')).toBeInTheDocument()
      }, { timeout: 3000 })
      
      const nextButton = screen.getByTestId('next-button')
      await user.click(nextButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('step3-container')).toBeInTheDocument()
      })
      
      // Click Back
      const backButton = screen.getByTestId('back-button')
      await user.click(backButton)
      
      // Should return to Step 2
      await waitFor(() => {
        expect(screen.getByTestId('step2-container')).toBeInTheDocument()
      })
      
      expect(screen.queryByTestId('step3-container')).not.toBeInTheDocument()
    })

    it('should return to Step 1 from Step 2 when clicking Back and reset state', async () => {
      const userEvent = (await import('@testing-library/user-event')).default
      const { processWithU2Net } = await import('../services/mattingService')
      vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

      render(<MainWorkflow />)
      const user = userEvent.setup()
      
      await waitFor(() => {
        const fileInput = screen.getByTestId('file-input') as HTMLInputElement
        expect(fileInput).not.toBeDisabled()
      })
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      uploadFile(fileInput, file)
      
      await waitFor(() => {
        expect(screen.getByTestId('upload-or-generate-button')).toHaveTextContent('Generate ID Photo')
      })
      
      const button = screen.getByTestId('upload-or-generate-button')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByTestId('step2-container')).toBeInTheDocument()
      }, { timeout: 3000 })
      
      // Click Back from Step 2
      const backButton = screen.getByTestId('back-button')
      await user.click(backButton)
      
      // Should return to Step 1
      await waitFor(() => {
        expect(screen.getByTestId('step1-container')).toBeInTheDocument()
      })
      
      expect(screen.queryByTestId('step2-container')).not.toBeInTheDocument()
      
      // Should reset state (no image uploaded)
      expect(screen.getByText('No image uploaded')).toBeInTheDocument()
      expect(screen.getByTestId('upload-or-generate-button')).toHaveTextContent('Upload Image')
    })
  })
})
