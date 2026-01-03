import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PrintLayout } from './PrintLayout'
import type { SizeOption } from '../size/CropEditor'

describe('PrintLayout', () => {
  const mockCroppedImageUrl = 'blob:http://localhost/mock-image'
  const mockOnDownloadLayout = vi.fn()
  
  const oneInchSize: SizeOption = {
    id: '1-inch',
    label: '1 Inch',
    dimensions: '25×35mm',
    aspectRatio: 0.714,
    physicalWidth: 25,
    physicalHeight: 35,
  }

  describe('Layout Preview', () => {
    it('should render layout preview canvas', () => {
      render(
        <PrintLayout
          croppedImageUrl={mockCroppedImageUrl}
          selectedSize={oneInchSize}
          paperType="6-inch"
          onDownloadLayout={mockOnDownloadLayout}
        />
      )
      
      expect(screen.getByTestId('layout-preview')).toBeInTheDocument()
    })

    it('should not display layout information section', () => {
      render(
        <PrintLayout
          croppedImageUrl={mockCroppedImageUrl}
          selectedSize={oneInchSize}
          paperType="6-inch"
          onDownloadLayout={mockOnDownloadLayout}
        />
      )
      
      // Should not show info section with paper size, resolution, grid, total
      expect(screen.queryByTestId('photo-count')).not.toBeInTheDocument()
      expect(screen.queryByTestId('grid-info')).not.toBeInTheDocument()
      expect(screen.queryByText(/Paper Size:/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Resolution:/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Grid:/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Total:/i)).not.toBeInTheDocument()
    })
  })

  describe('Download Functionality', () => {
    it('should render download button', () => {
      render(
        <PrintLayout
          croppedImageUrl={mockCroppedImageUrl}
          selectedSize={oneInchSize}
          paperType="6-inch"
          onDownloadLayout={mockOnDownloadLayout}
        />
      )
      
      expect(screen.getByRole('button', { name: /download print layout/i })).toBeInTheDocument()
    })

    it('should call onDownloadLayout when download button is clicked', () => {
      render(
        <PrintLayout
          croppedImageUrl={mockCroppedImageUrl}
          selectedSize={oneInchSize}
          paperType="6-inch"
          onDownloadLayout={mockOnDownloadLayout}
        />
      )
      
      const downloadButton = screen.getByRole('button', { name: /download print layout/i })
      fireEvent.click(downloadButton)
      
      expect(mockOnDownloadLayout).toHaveBeenCalledTimes(1)
    })
  })

  describe('Visual Representation', () => {
    it('should show photo grid arrangement visually', () => {
      render(
        <PrintLayout
          croppedImageUrl={mockCroppedImageUrl}
          selectedSize={oneInchSize}
          paperType="6-inch"
          onDownloadLayout={mockOnDownloadLayout}
        />
      )
      
      const preview = screen.getByTestId('layout-preview')
      expect(preview.tagName).toBe('CANVAS')
    })

    it('should render canvas with reasonable dimensions', async () => {
      render(
        <PrintLayout
          croppedImageUrl={mockCroppedImageUrl}
          selectedSize={oneInchSize}
          paperType="6-inch"
          onDownloadLayout={mockOnDownloadLayout}
        />
      )
      
      const canvas = screen.getByTestId('layout-preview') as HTMLCanvasElement
      
      // Canvas should have been sized by the component
      // Wait a bit for the canvas to be drawn
      await new Promise(resolve => setTimeout(resolve, 50))
      
      expect(canvas.width).toBeGreaterThan(0)
      expect(canvas.height).toBeGreaterThan(0)
    })
  })

  describe('Title Styling', () => {
    it('should have consistent title style with other sections (text-sm font-semibold)', () => {
      render(
        <PrintLayout
          croppedImageUrl={mockCroppedImageUrl}
          selectedSize={oneInchSize}
          paperType="6-inch"
          onDownloadLayout={mockOnDownloadLayout}
        />
      )
      
      const title = screen.getByText(/Print Layout Preview/i)
      expect(title).toBeInTheDocument()
      expect(title).toHaveClass('text-sm')
      expect(title).toHaveClass('font-semibold')
      expect(title).not.toHaveClass('text-lg')
    })
  })
})
