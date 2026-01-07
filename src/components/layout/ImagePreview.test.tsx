import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ImagePreview } from './ImagePreview'

describe('ImagePreview', () => {
  const mockImageUrl = 'blob:http://localhost/mock-image'

  it('should render image with provided URL', () => {
    render(<ImagePreview imageUrl={mockImageUrl} />)
    
    const image = screen.getByTestId('image-preview')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', mockImageUrl)
  })

  it('should render image with alt text', () => {
    render(<ImagePreview imageUrl={mockImageUrl} alt="Test image" />)
    
    const image = screen.getByAltText('Test image')
    expect(image).toBeInTheDocument()
  })

  it('should use default alt text when not provided', () => {
    render(<ImagePreview imageUrl={mockImageUrl} />)
    
    const image = screen.getByAltText('Preview image')
    expect(image).toBeInTheDocument()
  })

  it('should apply proper styling classes', () => {
    render(<ImagePreview imageUrl={mockImageUrl} />)
    
    const image = screen.getByTestId('image-preview')
    expect(image).toHaveClass('max-w-full')
    expect(image).toHaveClass('max-h-64')
    expect(image).toHaveClass('object-contain')
  })

  it('should render with container styling', () => {
    render(<ImagePreview imageUrl={mockImageUrl} />)
    
    const container = screen.getByTestId('image-preview-container')
    expect(container).toBeInTheDocument()
    expect(container).toHaveClass('bg-gray-100')
    expect(container).toHaveClass('p-4')
    expect(container).toHaveClass('rounded-lg')
  })
})
