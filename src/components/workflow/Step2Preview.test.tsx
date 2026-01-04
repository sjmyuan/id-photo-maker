import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Step2Preview } from './Step2Preview'

describe('Step2Preview', () => {
  const defaultProps = {
    croppedPreviewUrl: 'blob:test-preview-url',
    isProcessing: false,
    onDownload: vi.fn(),
    onNext: vi.fn(),
    onBack: vi.fn(),
  }

  it('renders step 2 container', () => {
    render(<Step2Preview {...defaultProps} />)
    expect(screen.getByTestId('step2-container')).toBeInTheDocument()
  })

  it('renders heading', () => {
    render(<Step2Preview {...defaultProps} />)
    expect(screen.getByText('ID Photo Preview')).toBeInTheDocument()
  })

  it('renders image preview', () => {
    render(<Step2Preview {...defaultProps} />)
    expect(screen.getByTestId('id-photo-preview')).toBeInTheDocument()
  })

  it('renders all action buttons', () => {
    render(<Step2Preview {...defaultProps} />)
    expect(screen.getByTestId('download-id-photo-button')).toBeInTheDocument()
    expect(screen.getByTestId('next-button')).toBeInTheDocument()
    expect(screen.getByTestId('back-button')).toBeInTheDocument()
  })

  it('calls onDownload when download button is clicked', () => {
    const onDownload = vi.fn()
    const props = { ...defaultProps, onDownload }
    render(<Step2Preview {...props} />)
    
    const button = screen.getByTestId('download-id-photo-button')
    fireEvent.click(button)
    expect(onDownload).toHaveBeenCalledTimes(1)
  })

  it('calls onNext when next button is clicked', () => {
    const onNext = vi.fn()
    const props = { ...defaultProps, onNext }
    render(<Step2Preview {...props} />)
    
    const button = screen.getByTestId('next-button')
    fireEvent.click(button)
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn()
    const props = { ...defaultProps, onBack }
    render(<Step2Preview {...props} />)
    
    const button = screen.getByTestId('back-button')
    fireEvent.click(button)
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('disables all buttons when processing', () => {
    const props = { ...defaultProps, isProcessing: true }
    render(<Step2Preview {...props} />)
    
    expect(screen.getByTestId('download-id-photo-button')).toBeDisabled()
    expect(screen.getByTestId('next-button')).toBeDisabled()
    expect(screen.getByTestId('back-button')).toBeDisabled()
  })

  it('enables all buttons when not processing', () => {
    render(<Step2Preview {...defaultProps} />)
    
    expect(screen.getByTestId('download-id-photo-button')).not.toBeDisabled()
    expect(screen.getByTestId('next-button')).not.toBeDisabled()
    expect(screen.getByTestId('back-button')).not.toBeDisabled()
  })
})
