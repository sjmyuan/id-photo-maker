import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MainWorkflow } from './MainWorkflow'
import { ToastProvider } from '../components/toast/ToastProvider'

// Helper function to render MainWorkflow with ToastProvider
function renderMainWorkflow() {
  return render(
    <ToastProvider>
      <MainWorkflow />
    </ToastProvider>
  )
}

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

vi.mock('../services/imageProcessingOrchestrator', () => {
  class MockImageProcessingOrchestrator {
    async processImage() {
      return {
        result: {
          croppedPreviewUrl: 'data:image/png;base64,mock-cropped',
          printLayoutPreviewUrl: 'data:image/png;base64,mock-layout',
        },
        errors: [],
        warnings: [],
      }
    }
  }
  return {
    ImageProcessingOrchestrator: MockImageProcessingOrchestrator
  }
})

// Helper function to simulate file upload in tests
const uploadFile = (fileInput: HTMLInputElement, file: File) => {
  Object.defineProperty(fileInput, 'files', {
    value: [file],
    writable: false,
    configurable: true
  })
  fileInput.dispatchEvent(new Event('change', { bubbles: true }))
}


describe.skip('MainWorkflow - Model Loading Modal (OBSOLETE - Models now on backend)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show loading modal when models are loading', () => {})
  it('should hide loading modal when models finish loading', async () => {})
  it('should display correct loading message in modal', () => {})
  it('should hide loading modal even if models fail to load', async () => {})
  it('should not show toast notifications for model loading', () => {})
})

describe('MainWorkflow - Step 1 Configuration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show size selector in step 1', () => {
    renderMainWorkflow()
    
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
    renderMainWorkflow()
    
    // Check that Small 1-inch button has selected styling (first option, default)
    const smallOneInchButton = screen.getByText('Small 1 Inch').closest('button')
    expect(smallOneInchButton).toHaveClass('border-blue-600', 'bg-blue-50')
  })

  it('should allow selecting different photo sizes in step 1', async () => {
    const userEvent = (await import('@testing-library/user-event')).default
    renderMainWorkflow()
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
    renderMainWorkflow()
    
    // Step 1 should show color selection
    expect(screen.getByTestId('color-selector-step1')).toBeInTheDocument()
  })

  it('should have blue background color selected by default in step 1', () => {
    renderMainWorkflow()
    
    // Check that blue is selected by default
    const blueButton = screen.getByTestId('color-blue')
    expect(blueButton).toHaveClass('ring-4')
  })

  it('should allow selecting different background colors in step 1', async () => {
    const userEvent = (await import('@testing-library/user-event')).default
    renderMainWorkflow()
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
    renderMainWorkflow()
    
    const selectorsContainer = screen.getByTestId('selectors-container')
    
    // Check that the container uses vertical stack layout
    expect(selectorsContainer).toHaveClass('space-y-4')
    
    // All selectors should be present
    expect(screen.getByTestId('size-selector-step1')).toBeInTheDocument()
    expect(screen.getByTestId('color-selector-step1')).toBeInTheDocument()
    expect(screen.getByTestId('paper-type-selector-step1')).toBeInTheDocument()
  })

  it('should have 6-inch paper type selected by default in step 1', () => {
    renderMainWorkflow()
    
    const sixInchButton = screen.getByTestId('paper-6-inch-button')
    expect(sixInchButton).toHaveClass('border-blue-600')
  })

  it('should allow selecting A4 paper type in step 1', async () => {
    const userEvent = (await import('@testing-library/user-event')).default
    const user = userEvent.setup()
    
    renderMainWorkflow()
    
    const a4Button = screen.getByTestId('paper-a4-button')
    await user.click(a4Button)
    
    expect(a4Button).toHaveClass('border-blue-600')
  })
})




describe('MainWorkflow - 3-Step Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Step 1: Settings & Upload', () => {
    it('should show step indicator with step 1 active', async () => {
      renderMainWorkflow()
      
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
      renderMainWorkflow()
      
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
      renderMainWorkflow()
      
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
      renderMainWorkflow()
      
      await waitFor(() => {
        const fileInput = screen.getByTestId('file-input') as HTMLInputElement
        expect(fileInput).not.toBeDisabled()
      })
      
      expect(screen.getByTestId('image-placeholder')).toBeInTheDocument()
      expect(screen.getByText('No image uploaded')).toBeInTheDocument()
    })

    it('should show uploaded image preview after file selection', async () => {
      renderMainWorkflow()
      
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
      renderMainWorkflow()
      
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
      renderMainWorkflow()
      
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

      renderMainWorkflow()
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

      renderMainWorkflow()
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

      renderMainWorkflow()
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

      renderMainWorkflow()
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

      renderMainWorkflow()
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

      renderMainWorkflow()
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

      renderMainWorkflow()
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

      renderMainWorkflow()
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

      renderMainWorkflow()
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

      renderMainWorkflow()
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

      renderMainWorkflow()
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

      renderMainWorkflow()
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

      renderMainWorkflow()
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

      renderMainWorkflow()
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

    it('should return to Step 1 from Step 2 when clicking Back and preserve original image', async () => {
      const userEvent = (await import('@testing-library/user-event')).default

      renderMainWorkflow()
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
      
      // Should preserve original image
      expect(screen.getByTestId('uploaded-image')).toBeInTheDocument()
      expect(screen.queryByText('No image uploaded')).not.toBeInTheDocument()
      
      // Should still show "Generate ID Photo" button (not "Upload Image")
      expect(screen.getByTestId('upload-or-generate-button')).toHaveTextContent('Generate ID Photo')
    })
  })
})
