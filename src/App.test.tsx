import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

// Mock the services
vi.mock('./services/imageValidation', () => ({
  validateImageFile: vi.fn().mockResolvedValue({
    isValid: true,
    warnings: [],
    errors: [],
    needsScaling: false,
  }),
}))

vi.mock('./services/mattingService', () => ({
  mockMattingService: vi.fn().mockResolvedValue(
    new Blob(['processed'], { type: 'image/png' })
  ),
}))

vi.mock('./utils/deviceCapability', () => ({
  detectDeviceCapability: vi.fn().mockReturnValue({
    hardwareConcurrency: 4,
    expectedProcessingTime: 3000,
  }),
}))

describe('App', () => {
  it('renders the app title', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByText('ID Photo Maker')).toBeInTheDocument()
  })

  it('should display ImageUpload component initially', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByTestId('file-input')).toBeInTheDocument()
  })

  it('should display BackgroundSelector after successful image upload and processing', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )
    
    const fileInput = screen.getByTestId('file-input')
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    
    // Trigger file upload
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    })
    fileInput.dispatchEvent(new Event('change', { bubbles: true }))
    
    // Wait for processing to complete and BackgroundSelector to appear
    await waitFor(() => {
      expect(screen.getByText('Background Color')).toBeInTheDocument()
    })
  })

  it('should display MattingPreview after background selection', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )
    
    // First upload an image
    const fileInput = screen.getByTestId('file-input')
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    })
    fileInput.dispatchEvent(new Event('change', { bubbles: true }))
    
    // Wait for BackgroundSelector
    await waitFor(() => {
      expect(screen.getByText('Background Color')).toBeInTheDocument()
    })
    
    // Select a background color
    const redButton = screen.getByRole('button', { name: /red/i })
    redButton.click()
    
    // Click continue to preview
    const continueButton = screen.getByRole('button', { name: /continue to preview/i })
    continueButton.click()
    
    // Should show preview
    await waitFor(() => {
      expect(screen.getByText('Preview Results')).toBeInTheDocument()
    })
  })

  it('should return to upload when reprocess is clicked from preview', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )
    
    // Upload image
    const fileInput = screen.getByTestId('file-input')
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    })
    fileInput.dispatchEvent(new Event('change', { bubbles: true }))
    
    // Wait for BackgroundSelector
    await waitFor(() => {
      expect(screen.getByText('Background Color')).toBeInTheDocument()
    })
    
    // Continue to preview
    const continueButton = screen.getByRole('button', { name: /continue to preview/i })
    continueButton.click()
    
    // Wait for preview
    await waitFor(() => {
      expect(screen.getByText('Preview Results')).toBeInTheDocument()
    })
    
    // Click reprocess
    const reprocessButton = screen.getByRole('button', { name: /reprocess/i })
    reprocessButton.click()
    
    // Should return to upload
    await waitFor(() => {
      expect(screen.getByTestId('file-input')).toBeInTheDocument()
    })
  })

  it('should proceed to next step when continue is clicked from preview', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )
    
    // Upload image
    const fileInput = screen.getByTestId('file-input')
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    })
    fileInput.dispatchEvent(new Event('change', { bubbles: true }))
    
    // Wait for BackgroundSelector
    await waitFor(() => {
      expect(screen.getByText('Background Color')).toBeInTheDocument()
    })
    
    // Continue to preview
    const bgContinueButton = screen.getByRole('button', { name: /continue to preview/i })
    bgContinueButton.click()
    
    // Wait for preview
    await waitFor(() => {
      expect(screen.getByText('Preview Results')).toBeInTheDocument()
    })
    
    // Click continue
    const previewContinueButton = screen.getByRole('button', { name: /continue to next step/i })
    previewContinueButton.click()
    
    // For now, it should show a placeholder message for size selection
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /size selection/i })).toBeInTheDocument()
    })
  })

  it('should navigate to main page at root route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByText('ID Photo Maker')).toBeInTheDocument()
    expect(screen.getByTestId('file-input')).toBeInTheDocument()
  })

  it('should navigate to U2Net test page at /u2net-test route', () => {
    render(
      <MemoryRouter initialEntries={['/u2net-test']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByText('U2Net ONNX Model Test')).toBeInTheDocument()
  })
})
