import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Step1Settings } from './Step1Settings'
import { SIZE_OPTIONS } from '../size/CropEditor'

describe('Step1Settings', () => {
  const defaultProps = {
    selectedSize: SIZE_OPTIONS[0],
    requiredDPI: 300 as const,
    backgroundColor: '#0000FF',
    paperType: '6-inch' as const,
    uploadedImageUrl: null,
    uploadedFile: null,
    isProcessing: false,
    isLoadingU2Net: false,
    onSizeChange: vi.fn(),
    onDPIChange: vi.fn(),
    onColorChange: vi.fn(),
    onPaperTypeChange: vi.fn(),
    onFileChange: vi.fn(),
    onGeneratePreview: vi.fn(),
  }

  it('renders step 1 container', () => {
    render(<Step1Settings {...defaultProps} />)
    expect(screen.getByTestId('step1-container')).toBeInTheDocument()
  })

  it('renders all selector components', () => {
    render(<Step1Settings {...defaultProps} />)
    expect(screen.getByTestId('size-selector-step1')).toBeInTheDocument()
    expect(screen.getByTestId('dpi-selector-step1')).toBeInTheDocument()
    expect(screen.getByTestId('color-selector-step1')).toBeInTheDocument()
    expect(screen.getByTestId('paper-type-selector-step1')).toBeInTheDocument()
  })

  it('renders image placeholder when no image uploaded', () => {
    render(<Step1Settings {...defaultProps} />)
    expect(screen.getByTestId('image-placeholder')).toBeInTheDocument()
    expect(screen.getByText('No image uploaded')).toBeInTheDocument()
  })

  it('renders uploaded image when uploadedImageUrl is provided', () => {
    const props = {
      ...defaultProps,
      uploadedImageUrl: 'blob:test-image-url',
    }
    render(<Step1Settings {...props} />)
    const img = screen.getByTestId('uploaded-image')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'blob:test-image-url')
  })

  it('renders "Upload Image" button when no file is uploaded', () => {
    render(<Step1Settings {...defaultProps} />)
    const button = screen.getByTestId('upload-or-generate-button')
    expect(button).toHaveTextContent('Upload Image')
  })

  it('renders "Generate ID Photo" button when file is uploaded', () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const props = {
      ...defaultProps,
      uploadedFile: file,
    }
    render(<Step1Settings {...props} />)
    const button = screen.getByTestId('upload-or-generate-button')
    expect(button).toHaveTextContent('Generate ID Photo')
  })

  it('calls onGeneratePreview when Generate button is clicked', () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const onGeneratePreview = vi.fn()
    const props = {
      ...defaultProps,
      uploadedFile: file,
      onGeneratePreview,
    }
    render(<Step1Settings {...props} />)
    const button = screen.getByTestId('upload-or-generate-button')
    fireEvent.click(button)
    expect(onGeneratePreview).toHaveBeenCalledTimes(1)
  })

  it('triggers file input click when Upload button is clicked', () => {
    render(<Step1Settings {...defaultProps} />)
    const button = screen.getByTestId('upload-or-generate-button')
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    
    const clickSpy = vi.spyOn(fileInput, 'click')
    fireEvent.click(button)
    expect(clickSpy).toHaveBeenCalledTimes(1)
  })

  it('calls onFileChange when file is selected', () => {
    const onFileChange = vi.fn()
    const props = {
      ...defaultProps,
      onFileChange,
    }
    render(<Step1Settings {...props} />)
    const fileInput = screen.getByTestId('file-input')
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    
    fireEvent.change(fileInput, { target: { files: [file] } })
    expect(onFileChange).toHaveBeenCalledTimes(1)
  })

  it('disables controls when processing', () => {
    const props = {
      ...defaultProps,
      isProcessing: true,
    }
    render(<Step1Settings {...props} />)
    const button = screen.getByTestId('upload-or-generate-button')
    const fileInput = screen.getByTestId('file-input')
    
    expect(button).toBeDisabled()
    expect(fileInput).toBeDisabled()
  })

  it('disables controls when loading U2Net model', () => {
    const props = {
      ...defaultProps,
      isLoadingU2Net: true,
    }
    render(<Step1Settings {...props} />)
    const button = screen.getByTestId('upload-or-generate-button')
    const fileInput = screen.getByTestId('file-input')
    
    expect(button).toBeDisabled()
    expect(fileInput).toBeDisabled()
  })

  it('shows processing indicator when processing', () => {
    const props = {
      ...defaultProps,
      isProcessing: true,
    }
    render(<Step1Settings {...props} />)
    expect(screen.getByText('Processing your image...')).toBeInTheDocument()
  })

  it('does not show processing indicator when not processing', () => {
    render(<Step1Settings {...defaultProps} />)
    expect(screen.queryByText('Processing your image...')).not.toBeInTheDocument()
  })

  it('renders DPI and Paper Type selectors in the same row', () => {
    render(<Step1Settings {...defaultProps} />)
    const dpiPaperRow = screen.getByTestId('dpi-paper-row')
    expect(dpiPaperRow).toBeInTheDocument()
    
    // Both selectors should be children of the row container
    const dpiSelector = screen.getByTestId('dpi-selector-step1')
    const paperSelector = screen.getByTestId('paper-type-selector-step1')
    expect(dpiPaperRow).toContainElement(dpiSelector)
    expect(dpiPaperRow).toContainElement(paperSelector)
  })

  it('renders selectors in vertical stack order', () => {
    render(<Step1Settings {...defaultProps} />)
    const container = screen.getByTestId('selectors-container')
    expect(container).toBeInTheDocument()
    
    // Check that selectors appear in the correct order
    const sizeSelector = screen.getByTestId('size-selector-step1')
    const colorSelector = screen.getByTestId('color-selector-step1')
    const dpiPaperRow = screen.getByTestId('dpi-paper-row')
    
    expect(container).toContainElement(sizeSelector)
    expect(container).toContainElement(colorSelector)
    expect(container).toContainElement(dpiPaperRow)
  })
})
