import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PrintLayout } from './PrintLayout'
import type { SizeOption } from '../size/CropEditor'

describe('PrintLayout', () => {
  const mockCroppedImageUrl = 'blob:http://localhost/mock-image'
  
  const oneInchSize: SizeOption = {
    id: '1-inch',
    label: '1 Inch',
    dimensions: '25×35mm',
    aspectRatio: 0.714,
    physicalWidth: 25,
    physicalHeight: 35,
  }

  describe('ID Photo Preview', () => {
    it('should render single ID photo preview image using ImagePreview component', () => {
      render(
        <PrintLayout
          croppedImageUrl={mockCroppedImageUrl}
          selectedSize={oneInchSize}
          paperType="6-inch"
        />
      )
      
      // Should render ImagePreview component for cropped image
      const previewContainers = screen.getAllByTestId('image-preview-container')
      expect(previewContainers.length).toBeGreaterThanOrEqual(1) // At least one for cropped image
      
      // Check that cropped image is displayed
      const images = screen.getAllByTestId('image-preview')
      expect(images[0]).toHaveAttribute('src', mockCroppedImageUrl)
    })
  })

  describe('Layout Preview', () => {
    it('should render layout preview using ImagePreview when printLayoutPreviewUrl is provided', () => {
      const mockPrintLayoutUrl = 'blob:http://localhost/mock-print-layout'
      render(
        <PrintLayout
          croppedImageUrl={mockCroppedImageUrl}
          selectedSize={oneInchSize}
          paperType="6-inch"
          printLayoutPreviewUrl={mockPrintLayoutUrl}
        />
      )
      
      // Should render two ImagePreview components
      const images = screen.getAllByTestId('image-preview')
      expect(images).toHaveLength(2)
      
      // Second image should be the print layout preview
      expect(images[1]).toHaveAttribute('src', mockPrintLayoutUrl)
    })

    it('should render layout preview canvas when printLayoutPreviewUrl is not provided', () => {
      render(
        <PrintLayout
          croppedImageUrl={mockCroppedImageUrl}
          selectedSize={oneInchSize}
          paperType="6-inch"
        />
      )
      
      // Should still have canvas for backward compatibility
      expect(screen.getByTestId('layout-preview')).toBeInTheDocument()
    })

    it('should not display layout information section', () => {
      render(
        <PrintLayout
          croppedImageUrl={mockCroppedImageUrl}
          selectedSize={oneInchSize}
          paperType="6-inch"
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
    it('should not render download button internally', () => {
      render(
        <PrintLayout
          croppedImageUrl={mockCroppedImageUrl}
          selectedSize={oneInchSize}
          paperType="6-inch"
        />
      )
      
      expect(screen.queryByRole('button', { name: /download print layout/i })).not.toBeInTheDocument()
    })
  })

  describe('Component Interface', () => {
    it('should accept croppedImageUrl prop without onDownloadLayout', () => {
      render(
        <PrintLayout
          croppedImageUrl={mockCroppedImageUrl}
          selectedSize={oneInchSize}
          paperType="6-inch"
        />
      )
      
      // Should render without errors
      expect(screen.getByTestId('print-layout')).toBeInTheDocument()
    })

    it('should accept printLayoutPreviewUrl prop and display it', () => {
      const mockPrintLayoutUrl = 'blob:http://localhost/mock-print-layout'
      render(
        <PrintLayout
          croppedImageUrl={mockCroppedImageUrl}
          selectedSize={oneInchSize}
          paperType="6-inch"
          printLayoutPreviewUrl={mockPrintLayoutUrl}
        />
      )
      
      // Should display print layout preview image using ImagePreview
      const images = screen.getAllByTestId('image-preview')
      expect(images).toHaveLength(2) // Cropped image and print layout preview
      expect(images[1]).toHaveAttribute('src', mockPrintLayoutUrl)
    })

    it('should work without printLayoutPreviewUrl prop for backward compatibility', () => {
      render(
        <PrintLayout
          croppedImageUrl={mockCroppedImageUrl}
          selectedSize={oneInchSize}
          paperType="6-inch"
        />
      )
      
      // Should render without errors even without printLayoutPreviewUrl
      expect(screen.getByTestId('print-layout')).toBeInTheDocument()
    })
  })

  describe('Visual Representation', () => {
    it('should show photo grid arrangement visually', () => {
      render(
        <PrintLayout
          croppedImageUrl={mockCroppedImageUrl}
          selectedSize={oneInchSize}
          paperType="6-inch"
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
        />
      )
      
      const canvas = screen.getByTestId('layout-preview') as HTMLCanvasElement
      
      // Canvas should have been sized by the component
      // Wait a bit for the canvas to be drawn
      await new Promise(resolve => setTimeout(resolve, 50))
      
      expect(canvas.width).toBeGreaterThan(0)
      expect(canvas.height).toBeGreaterThan(0)
    })

    it('should display images vertically without grid layout', () => {
      const mockPrintLayoutUrl = 'blob:http://localhost/mock-print-layout'
      render(
        <PrintLayout
          croppedImageUrl={mockCroppedImageUrl}
          selectedSize={oneInchSize}
          paperType="6-inch"
          printLayoutPreviewUrl={mockPrintLayoutUrl}
        />
      )
      
      // Should not have grid layout (md:grid-cols-2)
      const container = screen.getByTestId('print-layout')
      const gridElement = container.querySelector('.grid')
      
      // If grid exists, it should not have md:grid-cols-2
      if (gridElement) {
        expect(gridElement.className).not.toContain('md:grid-cols-2')
      }
    })

    it('should not display separate labels for single photo and layout preview', () => {
      const mockPrintLayoutUrl = 'blob:http://localhost/mock-print-layout'
      render(
        <PrintLayout
          croppedImageUrl={mockCroppedImageUrl}
          selectedSize={oneInchSize}
          paperType="6-inch"
          printLayoutPreviewUrl={mockPrintLayoutUrl}
        />
      )
      
      // Should not have individual labels
      expect(screen.queryByText('Single ID Photo')).not.toBeInTheDocument()
      expect(screen.queryByText('Print Layout Preview')).not.toBeInTheDocument()
    })
  })

  describe('Title Styling', () => {
    it('should have consistent title style with other sections (text-sm font-semibold)', () => {
      render(
        <PrintLayout
          croppedImageUrl={mockCroppedImageUrl}
          selectedSize={oneInchSize}
          paperType="6-inch"
        />
      )
      
      const title = screen.getByText(/ID Photo Preview/i)
      expect(title).toBeInTheDocument()
      expect(title).toHaveClass('text-sm')
      expect(title).toHaveClass('font-semibold')
      expect(title).not.toHaveClass('text-lg')
    })
  })
})
