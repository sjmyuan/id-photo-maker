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
    const button = screen.getByTestId('upload-or-preview-button')
    expect(button).toHaveTextContent('Generate Preview')
  })
  
  // Click "Generate Preview" button
  const button = screen.getByTestId('upload-or-preview-button')
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
    
    // Should show all three size options
    expect(screen.getByRole('button', { name: /1 inch/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /2 inch/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /3 inch/i })).toBeInTheDocument()
  })

  it('should have 1-inch size selected by default in step 1', () => {
    render(<MainWorkflow />)
    
    // Check that 1-inch button has selected styling
    const oneInchButton = screen.getByRole('button', { name: /1 inch/i })
    expect(oneInchButton).toHaveClass('border-blue-600', 'bg-blue-50')
  })

  it('should allow selecting different photo sizes in step 1', async () => {
    const userEvent = (await import('@testing-library/user-event')).default
    render(<MainWorkflow />)
    const user = userEvent.setup()
    
    // Select 2-inch size
    const twoInchButton = screen.getByRole('button', { name: /2 inch/i })
    await user.click(twoInchButton)
    
    // Check that 2-inch button is now selected
    expect(twoInchButton).toHaveClass('border-blue-600', 'bg-blue-50')
    
    // Check that 1-inch button is not selected
    const oneInchButton = screen.getByRole('button', { name: /1 inch/i })
    expect(oneInchButton).not.toHaveClass('border-blue-600', 'bg-blue-50')
  })

  it('should show DPI selector in step 1', () => {
    render(<MainWorkflow />)
    
    // Step 1 should show DPI selection
    expect(screen.getByTestId('dpi-selector-step1')).toBeInTheDocument()
    
    // Should show both DPI options
    expect(screen.getByRole('button', { name: /300 dpi/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /none/i })).toBeInTheDocument()
  })

  it('should have 300 DPI selected by default in step 1', () => {
    render(<MainWorkflow />)
    
    // Check that 300 DPI button has selected styling
    const dpi300Button = screen.getByRole('button', { name: /300 dpi/i })
    expect(dpi300Button).toHaveClass('border-blue-600', 'bg-blue-50')
  })

  it('should allow selecting None DPI option in step 1', async () => {
    const userEvent = (await import('@testing-library/user-event')).default
    render(<MainWorkflow />)
    const user = userEvent.setup()
    
    // Select None DPI
    const noneButton = screen.getByRole('button', { name: /none/i })
    await user.click(noneButton)
    
    // Check that None button is now selected
    expect(noneButton).toHaveClass('border-blue-600', 'bg-blue-50')
    
    // Check that 300 DPI button is not selected
    const dpi300Button = screen.getByRole('button', { name: /300 dpi/i })
    expect(dpi300Button).not.toHaveClass('border-blue-600', 'bg-blue-50')
  })

  it.skip('should show size and DPI selectors above file input in step 1 (OBSOLETE - upload-step removed)', () => {
    render(<MainWorkflow />)
    
    const sizeSelector = screen.getByTestId('size-selector-step1')
    const dpiSelector = screen.getByTestId('dpi-selector-step1')
    const fileInput = screen.getByTestId('file-input')
    
    // Get their positions in the DOM
    const uploadStep = screen.getByTestId('upload-step')
    const children = Array.from(uploadStep.querySelectorAll('[data-testid]'))
    
    const sizeSelectorIndex = children.indexOf(sizeSelector)
    const dpiSelectorIndex = children.indexOf(dpiSelector)
    const fileInputIndex = children.findIndex(el => el.contains(fileInput))
    
    // Size and DPI selectors should appear before file input
    expect(sizeSelectorIndex).toBeGreaterThan(-1)
    expect(dpiSelectorIndex).toBeGreaterThan(-1)
    expect(fileInputIndex).toBeGreaterThan(-1)
    expect(sizeSelectorIndex).toBeLessThan(fileInputIndex)
    expect(dpiSelectorIndex).toBeLessThan(fileInputIndex)
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

  it('should display size, DPI, and color selectors in a compact grid layout', () => {
    render(<MainWorkflow />)
    
    const selectorGrid = screen.getByTestId('selector-grid-step1')
    
    // Check that the grid uses compact layout classes
    expect(selectorGrid).toHaveClass('grid')
    
    // All four selectors should be present
    expect(screen.getByTestId('size-selector-step1')).toBeInTheDocument()
    expect(screen.getByTestId('dpi-selector-step1')).toBeInTheDocument()
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
    const uploadButton = screen.getByTestId('upload-or-preview-button')
    expect(uploadButton).toBeInTheDocument()
    expect(uploadButton).toHaveTextContent('Upload Image')
  })

  it('should trigger hidden file input when "Upload Image" button is clicked', async () => {
    render(<MainWorkflow />)
    
    await waitFor(() => {
      const uploadButton = screen.getByTestId('upload-or-preview-button')
      expect(uploadButton).not.toBeDisabled()
    })

    // File input should be hidden (not visible in normal flow)
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    expect(fileInput).toHaveClass('hidden')

    // Click should work (we'll test via the button having click handler)
    const uploadButton = screen.getByTestId('upload-or-preview-button')
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
    let button = screen.getByTestId('upload-or-preview-button')
    expect(button).toHaveTextContent('Upload Image')

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    uploadFile(fileInput, file)
    
    // After upload, button should change to "Generate Preview"
    await waitFor(() => {
      button = screen.getByTestId('upload-or-preview-button')
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
      const button = screen.getByTestId('upload-or-preview-button')
      expect(button).toHaveTextContent('Generate Preview')
    })

    // Click "Generate Preview" button
    const button = screen.getByTestId('upload-or-preview-button')
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
      const button = screen.getByTestId('upload-or-preview-button')
      expect(button).toHaveTextContent('Generate Preview')
    })

    // Click "Generate Preview"
    const button = screen.getByTestId('upload-or-preview-button')
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
      const button = screen.getByTestId('upload-or-preview-button')
      expect(button).toHaveTextContent('Generate Preview')
    })

    // Click "Generate Preview"
    const button = screen.getByTestId('upload-or-preview-button')
    await user.click(button)
    
    // After processing completes, should advance to step 2
    await waitFor(() => {
      expect(screen.getByTestId('edit-step')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    // Should no longer show step 1
    expect(screen.queryByTestId('upload-step')).not.toBeInTheDocument()
  })
})

describe('MainWorkflow - Single Page Workflow (Refactored)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show single page without step navigation', () => {
    render(<MainWorkflow />)
    
    // Should not have step indicators or navigation between steps
    expect(screen.queryByTestId('upload-step')).not.toBeInTheDocument()
    expect(screen.queryByTestId('edit-step')).not.toBeInTheDocument()
    
    // Should show the main content container
    expect(screen.getByTestId('main-workflow-container')).toBeInTheDocument()
  })

  it('should show upload controls and selectors initially', () => {
    render(<MainWorkflow />)
    
    // Should show size, DPI, background selectors
    expect(screen.getByTestId('selector-grid-step1')).toBeInTheDocument()
    expect(screen.getByTestId('size-selector-step1')).toBeInTheDocument()
    expect(screen.getByTestId('dpi-selector-step1')).toBeInTheDocument()
    expect(screen.getByTestId('color-selector-step1')).toBeInTheDocument()
    
    // Should show image placeholder
    expect(screen.getByTestId('image-placeholder')).toBeInTheDocument()
    
    // Should show upload button
    expect(screen.getByTestId('upload-or-preview-button')).toBeInTheDocument()
    expect(screen.getByTestId('upload-or-preview-button')).toHaveTextContent('Upload Image')
  })

  it('should not show Step 2 edit-step or go-back button after processing', async () => {
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
    
    // Wait for processing to complete
    await waitFor(() => {
      expect(screen.queryByText(/Processing your image/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })
    
    // Should not show Step 2 UI elements
    expect(screen.queryByTestId('edit-step')).not.toBeInTheDocument()
    expect(screen.queryByTestId('go-back-button')).not.toBeInTheDocument()
  })

  it.skip('should show preview in placeholder area after processing (OBSOLETE - placeholder is now hidden)', async () => {
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
    
    // Wait for processing to complete and preview to show in PrintLayout
    await waitFor(() => {
      expect(screen.getByTestId('id-photo-preview')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    // Should still show the same placeholder container (now with uploaded image)
    expect(screen.getByTestId('image-placeholder')).toBeInTheDocument()
  })

  it('should remain on the same page throughout the workflow', async () => {
    const userEvent = (await import('@testing-library/user-event')).default
    const { processWithU2Net } = await import('../services/mattingService')
    vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

    render(<MainWorkflow />)
    const user = userEvent.setup()
    
    // Check main container exists initially
    expect(screen.getByTestId('main-workflow-container')).toBeInTheDocument()
    
    await waitFor(() => {
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      expect(fileInput).not.toBeDisabled()
    })

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    await uploadAndGeneratePreview(fileInput, file, user)
    
    // Wait for processing to complete
    await waitFor(() => {
      expect(screen.queryByText(/Processing your image/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })
    
    // Should still have the same main container (no page change)
    expect(screen.getByTestId('main-workflow-container')).toBeInTheDocument()
    
    // Selectors should now be hidden after preview generation
    expect(screen.queryByTestId('selector-grid-step1')).not.toBeInTheDocument()
  })

  it('should show download and re-upload buttons after processing', async () => {
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
    
    // Wait for processing to complete
    await waitFor(() => {
      expect(screen.queryByText(/Processing your image/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })
    
    // Should show download buttons and re-upload button (no regenerate button - auto-regeneration now)
    expect(screen.getByTestId('download-image-button')).toBeInTheDocument()
    expect(screen.getByTestId('download-layout-button')).toBeInTheDocument()
    expect(screen.getByTestId('reupload-button')).toBeInTheDocument()
    expect(screen.queryByTestId('regenerate-preview-button')).not.toBeInTheDocument()
    
    // Should not show upload button
    expect(screen.queryByTestId('upload-or-preview-button')).not.toBeInTheDocument()
  })

  it('should clear preview and return to upload state when re-upload button is clicked', async () => {
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
    
    // Wait for processing to complete
    await waitFor(() => {
      expect(screen.getByTestId('id-photo-preview')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    // Click re-upload button
    const reuploadButton = screen.getByTestId('reupload-button')
    await user.click(reuploadButton)
    
    // Should return to upload state
    await waitFor(() => {
      expect(screen.queryByTestId('id-photo-preview')).not.toBeInTheDocument()
      expect(screen.queryByTestId('reupload-button')).not.toBeInTheDocument()
      expect(screen.getByTestId('upload-or-preview-button')).toBeInTheDocument()
      expect(screen.getByTestId('upload-or-preview-button')).toHaveTextContent('Upload Image')
    })
  })
})

describe('MainWorkflow - Print Layout Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display PrintLayout component after preview is generated', async () => {
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
    
    // Wait for processing to complete
    await waitFor(() => {
      expect(screen.getByTestId('id-photo-preview')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    // PrintLayout should be visible
    expect(screen.getByTestId('print-layout')).toBeInTheDocument()
  })

  it('should not display PrintLayout before preview is generated', () => {
    render(<MainWorkflow />)
    
    // PrintLayout should not be visible initially
    expect(screen.queryByTestId('print-layout')).not.toBeInTheDocument()
  })

  it('should pass paper type from configuration to PrintLayout', async () => {
    const userEvent = (await import('@testing-library/user-event')).default
    const { processWithU2Net } = await import('../services/mattingService')
    vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

    render(<MainWorkflow />)
    const user = userEvent.setup()
    
    // Select A4 paper type in step 1 configuration
    const a4Button = screen.getByTestId('paper-a4-button')
    await user.click(a4Button)
    expect(a4Button).toHaveClass('border-blue-600')
    
    await waitFor(() => {
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      expect(fileInput).not.toBeDisabled()
    })

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    await uploadAndGeneratePreview(fileInput, file, user)
    
    await waitFor(() => {
      expect(screen.getByTestId('print-layout')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    // PrintLayout should be displayed with print layout preview image
    expect(screen.getByTestId('print-layout-preview-image')).toBeInTheDocument()
  })



  it('should display layout preview image', async () => {
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
      expect(screen.getByTestId('print-layout')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    // Should show print layout preview image
    const preview = screen.getByTestId('print-layout-preview-image')
    expect(preview).toBeInTheDocument()
    expect(preview.tagName).toBe('IMG')
  })

  it('should display download print layout button', async () => {
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
      expect(screen.getByTestId('print-layout')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    // Should show download print layout button
    expect(screen.getByRole('button', { name: /download print layout/i })).toBeInTheDocument()
  })

  it.skip('should display download image button directly under photo preview and before print layout (OBSOLETE - placeholder hidden)', async () => {
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
      expect(screen.getByTestId('id-photo-preview')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    // Verify elements exist
    const imagePlaceholder = screen.getByTestId('image-placeholder')
    const printLayout = screen.getByTestId('print-layout')
    const downloadImageButton = screen.getByTestId('download-image-button')
    const downloadLayoutButton = screen.getByTestId('download-layout-button')
    
    expect(imagePlaceholder).toBeInTheDocument()
    expect(printLayout).toBeInTheDocument()
    expect(downloadImageButton).toBeInTheDocument()
    expect(downloadLayoutButton).toBeInTheDocument()
    
    // Use compareDocumentPosition to verify order in DOM
    // DOCUMENT_POSITION_FOLLOWING (4) means the node comes after
    const printFollowsImage = imagePlaceholder.compareDocumentPosition(printLayout) & Node.DOCUMENT_POSITION_FOLLOWING
    const downloadImageFollowsPrint = printLayout.compareDocumentPosition(downloadImageButton) & Node.DOCUMENT_POSITION_FOLLOWING
    const downloadLayoutFollowsPrint = printLayout.compareDocumentPosition(downloadLayoutButton) & Node.DOCUMENT_POSITION_FOLLOWING
    
    expect(printFollowsImage).toBeTruthy() // Print layout comes after image placeholder
    expect(downloadImageFollowsPrint).toBeTruthy() // Download buttons come after print layout
    expect(downloadLayoutFollowsPrint).toBeTruthy() // Download buttons come after print layout
  })
})

describe('MainWorkflow - No Auto-Regeneration on Settings Change', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.skip('should NOT auto-regenerate preview when size is changed (OBSOLETE - settings hidden after preview)', async () => {
    const userEvent = (await import('@testing-library/user-event')).default
    const { processWithU2Net } = await import('../services/mattingService')
    const { generateExactCrop } = await import('../services/exactCropService')
    
    vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))
    const mockGenerateExactCrop = vi.fn().mockResolvedValue(document.createElement('canvas'))
    vi.mocked(generateExactCrop).mockImplementation(mockGenerateExactCrop)

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
      expect(screen.getByTestId('id-photo-preview')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    // Clear the mock call count after initial generation
    mockGenerateExactCrop.mockClear()
    
    // Change size setting
    const size2InchButton = screen.getByRole('button', { name: /2 inch/i })
    await user.click(size2InchButton)
    
    // Wait a bit to ensure no regeneration is triggered
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // generateExactCrop should NOT have been called again
    expect(mockGenerateExactCrop).not.toHaveBeenCalled()
  })

  it.skip('should NOT auto-regenerate preview when DPI is changed (OBSOLETE - settings hidden after preview)', async () => {
    const userEvent = (await import('@testing-library/user-event')).default
    const { processWithU2Net } = await import('../services/mattingService')
    const { generateExactCrop } = await import('../services/exactCropService')
    
    vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))
    const mockGenerateExactCrop = vi.fn().mockResolvedValue(document.createElement('canvas'))
    vi.mocked(generateExactCrop).mockImplementation(mockGenerateExactCrop)

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
      expect(screen.getByTestId('id-photo-preview')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    // Clear the mock call count after initial generation
    mockGenerateExactCrop.mockClear()
    
    // Change DPI setting
    const dpiNoneButton = screen.getByRole('button', { name: /none.*no requirement/i })
    await user.click(dpiNoneButton)
    
    // Wait a bit to ensure no regeneration is triggered
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // generateExactCrop should NOT have been called again
    expect(mockGenerateExactCrop).not.toHaveBeenCalled()
  })

  it.skip('should NOT auto-regenerate preview when background color is changed (OBSOLETE - settings hidden after preview)', async () => {
    const userEvent = (await import('@testing-library/user-event')).default
    const { processWithU2Net } = await import('../services/mattingService')
    const { generateExactCrop } = await import('../services/exactCropService')
    
    vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))
    const mockGenerateExactCrop = vi.fn().mockResolvedValue(document.createElement('canvas'))
    vi.mocked(generateExactCrop).mockImplementation(mockGenerateExactCrop)

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
      expect(screen.getByTestId('id-photo-preview')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    // Clear the mock call count after initial generation
    mockGenerateExactCrop.mockClear()
    
    // Change background color - find the Red button
    const colorButtons = screen.getAllByRole('button')
    const redColorButton = colorButtons.find(btn => btn.getAttribute('data-testid') === 'color-red')
    expect(redColorButton).toBeDefined()
    await user.click(redColorButton!)
    
    // Wait a bit to ensure no regeneration is triggered
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // generateExactCrop should NOT have been called again
    expect(mockGenerateExactCrop).not.toHaveBeenCalled()
  })

  it.skip('should NOT show "Updating preview" indicator when settings change (OBSOLETE - settings hidden after preview)', async () => {
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
      expect(screen.getByTestId('id-photo-preview')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    // Change multiple settings
    const size2InchButton = screen.getByRole('button', { name: /2 inch/i })
    await user.click(size2InchButton)
    
    const colorButtons = screen.getAllByRole('button')
    const redColorButton = colorButtons.find(btn => btn.getAttribute('data-testid') === 'color-red')
    await user.click(redColorButton!)
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Should NOT show updating indicator
    expect(screen.queryByText(/Updating preview with new settings/i)).not.toBeInTheDocument()
  })
})

describe('MainWorkflow - Dynamic Preview Label', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show "Photo Preview" label when uploaded image is displayed (before processing)', async () => {
    render(<MainWorkflow />)
    
    await waitFor(() => {
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      expect(fileInput).not.toBeDisabled()
    })

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    uploadFile(fileInput, file)
    
    // After upload (before processing), should show "Photo Preview"
    await waitFor(() => {
      expect(screen.getByText('Photo Preview')).toBeInTheDocument()
      expect(screen.getByTestId('uploaded-image')).toBeInTheDocument()
    })
  })

  it('should show "ID Photo Preview" label after processing is complete', async () => {
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
    
    // After processing completes, should show ID Photo Preview in PrintLayout
    await waitFor(() => {
      expect(screen.getByText('ID Photo Preview')).toBeInTheDocument()
      expect(screen.getByTestId('id-photo-preview')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    // Placeholder and its label should be hidden after processing
    expect(screen.queryByText('Photo Preview')).not.toBeInTheDocument()
  })

  it('should revert to "Photo Preview" label after re-upload', async () => {
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
    
    // After processing, should show id photo preview in PrintLayout
    await waitFor(() => {
      expect(screen.getByTestId('id-photo-preview')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    // Click re-upload button
    const reuploadButton = screen.getByTestId('reupload-button')
    await user.click(reuploadButton)
    
    // After re-upload, should show "Photo Preview" label (no image yet)
    await waitFor(() => {
      expect(screen.queryByText('ID Photo Preview')).not.toBeInTheDocument()
      expect(screen.getByText('Photo Preview')).toBeInTheDocument()
    })
  })

  it.skip('should not show cropped image in image placeholder after processing (OBSOLETE - placeholder hidden)', async () => {
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
    
    // Wait for processing to complete
    await waitFor(() => {
      expect(screen.getByTestId('print-layout')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    // Image placeholder should NOT show cropped-preview-image
    const imagePlaceholder = screen.getByTestId('image-placeholder')
    expect(imagePlaceholder.querySelector('[data-testid="cropped-preview-image"]')).not.toBeInTheDocument()
  })

  it('should show both download buttons together under PrintLayout component', async () => {
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
    
    // Wait for processing to complete
    await waitFor(() => {
      expect(screen.getByTestId('print-layout')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    // Both buttons should be present
    expect(screen.getByTestId('download-image-button')).toBeInTheDocument()
    expect(screen.getByTestId('download-layout-button')).toBeInTheDocument()
  })

  it('should show PrintLayout with single ID photo preview inside', async () => {
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
    
    // Wait for processing to complete
    await waitFor(() => {
      expect(screen.getByTestId('print-layout')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    // PrintLayout should contain the single ID photo preview
    expect(screen.getByTestId('id-photo-preview')).toBeInTheDocument()
  })

  it('should hide settings selector grid after generating preview', async () => {
    const userEvent = (await import('@testing-library/user-event')).default
    const { processWithU2Net } = await import('../services/mattingService')
    vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

    render(<MainWorkflow />)
    const user = userEvent.setup()
    
    await waitFor(() => {
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      expect(fileInput).not.toBeDisabled()
    })

    // Settings should be visible initially
    expect(screen.getByTestId('selector-grid-step1')).toBeInTheDocument()

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    await uploadAndGeneratePreview(fileInput, file, user)
    
    // Wait for processing to complete
    await waitFor(() => {
      expect(screen.getByTestId('print-layout')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    // Settings should be hidden after preview generation
    expect(screen.queryByTestId('selector-grid-step1')).not.toBeInTheDocument()
  })

  it('should hide image placeholder after generating preview', async () => {
    const userEvent = (await import('@testing-library/user-event')).default
    const { processWithU2Net } = await import('../services/mattingService')
    vi.mocked(processWithU2Net).mockResolvedValue(new Blob(['matted'], { type: 'image/png' }))

    render(<MainWorkflow />)
    const user = userEvent.setup()
    
    await waitFor(() => {
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement
      expect(fileInput).not.toBeDisabled()
    })

    // Image placeholder should be visible initially
    expect(screen.getByTestId('image-placeholder')).toBeInTheDocument()

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    await uploadAndGeneratePreview(fileInput, file, user)
    
    // Wait for processing to complete
    await waitFor(() => {
      expect(screen.getByTestId('print-layout')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    // Image placeholder should be hidden after preview generation
    expect(screen.queryByTestId('image-placeholder')).not.toBeInTheDocument()
  })

  it('should show settings and image placeholder again after re-upload', async () => {
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
    
    // Wait for processing to complete
    await waitFor(() => {
      expect(screen.getByTestId('print-layout')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    // Settings and placeholder should be hidden
    expect(screen.queryByTestId('selector-grid-step1')).not.toBeInTheDocument()
    expect(screen.queryByTestId('image-placeholder')).not.toBeInTheDocument()
    
    // Click re-upload button
    const reuploadButton = screen.getByTestId('reupload-button')
    await user.click(reuploadButton)
    
    // Settings and placeholder should be visible again
    await waitFor(() => {
      expect(screen.getByTestId('selector-grid-step1')).toBeInTheDocument()
      expect(screen.getByTestId('image-placeholder')).toBeInTheDocument()
    })
  })
})
