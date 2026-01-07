import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Step3Layout } from './Step3Layout'
import { SIZE_OPTIONS } from '../size/CropEditor'

describe('Step3Layout', () => {
  const defaultProps = {
    printLayoutPreviewUrl: 'blob:test-layout-url',
    croppedPreviewUrl: 'blob:test-cropped-url',
    paperType: '6-inch' as const,
    selectedSize: SIZE_OPTIONS[0],
    isProcessing: false,
    onDownloadLayout: vi.fn(),
    onBack: vi.fn(),
  }

  beforeEach(() => {
    // Mock Image constructor for canvas tests
    window.Image = class MockImage {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      src = ''
      crossOrigin = ''
      
      constructor() {
        setTimeout(() => {
          if (this.onload) {
            this.onload()
          }
        }, 0)
      }
    } as unknown as typeof Image
  })

  it('renders step 3 container', () => {
    render(<Step3Layout {...defaultProps} />)
    expect(screen.getByTestId('step3-container')).toBeInTheDocument()
  })

  it('renders heading', () => {
    render(<Step3Layout {...defaultProps} />)
    expect(screen.getByText('Print Layout Preview')).toBeInTheDocument()
  })

  it('renders print layout preview', () => {
    render(<Step3Layout {...defaultProps} />)
    expect(screen.getByTestId('print-layout-preview')).toBeInTheDocument()
  })

  it('renders ImagePreview when printLayoutPreviewUrl is provided', () => {
    render(<Step3Layout {...defaultProps} />)
    // ImagePreview component renders an img tag with the preview URL
    const preview = screen.getByTestId('print-layout-preview')
    expect(preview).toBeInTheDocument()
  })

  it('renders canvas when printLayoutPreviewUrl is null', async () => {
    const props = {
      ...defaultProps,
      printLayoutPreviewUrl: null,
    }
    render(<Step3Layout {...props} />)
    
    await waitFor(() => {
      const canvas = screen.getByTestId('layout-preview')
      expect(canvas).toBeInTheDocument()
    })
  })

  it('renders all action buttons', () => {
    render(<Step3Layout {...defaultProps} />)
    expect(screen.getByTestId('download-print-layout-button')).toBeInTheDocument()
    expect(screen.getByTestId('back-button')).toBeInTheDocument()
  })

  it('calls onDownloadLayout when download button is clicked', () => {
    const onDownloadLayout = vi.fn()
    const props = { ...defaultProps, onDownloadLayout }
    render(<Step3Layout {...props} />)
    
    const button = screen.getByTestId('download-print-layout-button')
    fireEvent.click(button)
    expect(onDownloadLayout).toHaveBeenCalledTimes(1)
  })

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn()
    const props = { ...defaultProps, onBack }
    render(<Step3Layout {...props} />)
    
    const button = screen.getByTestId('back-button')
    fireEvent.click(button)
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('disables all buttons when processing', () => {
    const props = { ...defaultProps, isProcessing: true }
    render(<Step3Layout {...props} />)
    
    expect(screen.getByTestId('download-print-layout-button')).toBeDisabled()
    expect(screen.getByTestId('back-button')).toBeDisabled()
  })

  it('enables all buttons when not processing', () => {
    render(<Step3Layout {...defaultProps} />)
    
    expect(screen.getByTestId('download-print-layout-button')).not.toBeDisabled()
    expect(screen.getByTestId('back-button')).not.toBeDisabled()
  })
})
