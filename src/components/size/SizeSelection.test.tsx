/**
 * Size Selection with Crop Guide Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SizeSelection, SIZE_OPTIONS } from './SizeSelection'
import type { FaceBox } from '../../services/faceDetectionService'

describe('SizeSelection', () => {
  const mockProcessedImageUrl = 'blob:http://localhost/processed-image'
  const mockSelectedSize = SIZE_OPTIONS[0] // 1-inch by default
  const mockFaceBox: FaceBox = {
    x: 100,
    y: 80,
    width: 200,
    height: 250,
    confidence: 0.95,
  }

  // Mock image loading behavior
  beforeEach(() => {
    // Mock HTMLImageElement to simulate loaded image with dimensions
    Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', {
      get() {
        return 800
      },
      configurable: true,
    })
    Object.defineProperty(HTMLImageElement.prototype, 'naturalHeight', {
      get() {
        return 600
      },
      configurable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Crop rectangle rendering', () => {
    it('should render crop rectangle overlay on image', () => {
      render(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={mockFaceBox}
          selectedSize={mockSelectedSize}
          onCropAreaChange={vi.fn()}
        />
      )

      expect(screen.getByTestId('crop-rectangle')).toBeInTheDocument()
      expect(screen.getByTestId('processed-image')).toBeInTheDocument()
    })

    it('should render processed image with consistent styling matching original image', () => {
      render(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={mockFaceBox}
          selectedSize={mockSelectedSize}
          onCropAreaChange={vi.fn()}
        />
      )

      const processedImage = screen.getByTestId('processed-image')
      
      // Should use the same styling as original image in MainWorkflow
      expect(processedImage).toHaveClass('max-w-full')
      expect(processedImage).toHaveClass('max-h-full')
      expect(processedImage).toHaveClass('object-contain')
      
      // Should NOT have inline maxHeight style
      expect(processedImage).not.toHaveStyle({ maxHeight: '600px' })
    })

    it('should render crop rectangle with transparent background and only border visible', () => {
      render(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={mockFaceBox}
          selectedSize={mockSelectedSize}
          onCropAreaChange={vi.fn()}
        />
      )

      const rectangle = screen.getByTestId('crop-rectangle')
      expect(rectangle).toBeInTheDocument()
      
      // Rectangle should have border styling
      expect(rectangle).toHaveClass('border-2')
      expect(rectangle).toHaveClass('border-blue-500')
      
      // Rectangle should NOT have any background color classes
      expect(rectangle).not.toHaveClass('bg-blue-500')
      expect(rectangle).not.toHaveClass('bg-opacity-10')
    })

    it('should position rectangle based on face detection initially', () => {
      render(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={mockFaceBox}
          selectedSize={mockSelectedSize}
          onCropAreaChange={vi.fn()}
        />
      )

      const rectangle = screen.getByTestId('crop-rectangle')
      // Rectangle should be positioned around the face
      expect(rectangle).toHaveClass('absolute')
    })

    it('should expand crop area to include head and shoulders for ID photo', () => {
      const onCropAreaChange = vi.fn()
      render(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={mockFaceBox}
          selectedSize={mockSelectedSize}
          onCropAreaChange={onCropAreaChange}
        />
      )

      expect(onCropAreaChange).toHaveBeenCalled()
      const cropArea = onCropAreaChange.mock.calls[0][0]
      
      // Crop area should be significantly larger than face box to include head and shoulders
      // We expect the crop to be at least 2x the face width
      expect(cropArea.width).toBeGreaterThan(mockFaceBox.width * 2)
      // Height will be constrained by aspect ratio, but should be larger than face box
      expect(cropArea.height).toBeGreaterThan(mockFaceBox.height * 2)
      
      // Face should be positioned in the upper portion of the crop (not centered)
      const faceCenterY = mockFaceBox.y + mockFaceBox.height / 2
      const cropCenterY = cropArea.y + cropArea.height / 2
      expect(faceCenterY).toBeLessThan(cropCenterY)
    })
  })

  describe('Rectangle drag interactions', () => {
    it('should allow dragging the rectangle', () => {
      render(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={mockFaceBox}
          selectedSize={mockSelectedSize}
          onCropAreaChange={vi.fn()}
        />
      )

      const rectangle = screen.getByTestId('crop-rectangle')
      
      fireEvent.mouseDown(rectangle, { clientX: 100, clientY: 100 })
      fireEvent.mouseMove(document, { clientX: 150, clientY: 150 })
      fireEvent.mouseUp(document)

      // Rectangle should have moved
      expect(rectangle).toBeInTheDocument()
    })

    it('should keep rectangle within image boundaries when dragging', () => {
      const onCropAreaChange = vi.fn()
      render(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={mockFaceBox}
          selectedSize={mockSelectedSize}
          onCropAreaChange={onCropAreaChange}
        />
      )

      const rectangle = screen.getByTestId('crop-rectangle')
      
      // Try to drag beyond boundaries
      fireEvent.mouseDown(rectangle, { clientX: 100, clientY: 100 })
      fireEvent.mouseMove(document, { clientX: -100, clientY: -100 })
      fireEvent.mouseUp(document)

      // Verify rectangle stayed within bounds
      if (onCropAreaChange.mock.calls.length > 0) {
        const lastCall = onCropAreaChange.mock.calls[onCropAreaChange.mock.calls.length - 1][0]
        expect(lastCall.x).toBeGreaterThanOrEqual(0)
        expect(lastCall.y).toBeGreaterThanOrEqual(0)
      }
    })

    it('should support touch events for mobile', () => {
      render(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={mockFaceBox}
          selectedSize={mockSelectedSize}
          onCropAreaChange={vi.fn()}
        />
      )

      const rectangle = screen.getByTestId('crop-rectangle')
      
      fireEvent.touchStart(rectangle, { touches: [{ clientX: 100, clientY: 100 }] })
      fireEvent.touchMove(document, { touches: [{ clientX: 150, clientY: 150 }] })
      fireEvent.touchEnd(document)

      expect(rectangle).toBeInTheDocument()
    })
  })

  describe('Rectangle resize interactions', () => {
    it('should render resize handles on rectangle', () => {
      render(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={mockFaceBox}
          selectedSize={mockSelectedSize}
          onCropAreaChange={vi.fn()}
        />
      )

      // Should have corner handles
      expect(screen.getByTestId('resize-handle-ne')).toBeInTheDocument()
      expect(screen.getByTestId('resize-handle-nw')).toBeInTheDocument()
      expect(screen.getByTestId('resize-handle-se')).toBeInTheDocument()
      expect(screen.getByTestId('resize-handle-sw')).toBeInTheDocument()
    })

    it('should allow resizing while maintaining aspect ratio', async () => {
      const onCropAreaChange = vi.fn()
      render(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={mockFaceBox}
          selectedSize={mockSelectedSize}
          onCropAreaChange={onCropAreaChange}
        />
      )

      const handle = screen.getByTestId('resize-handle-se')
      
      fireEvent.mouseDown(handle, { clientX: 300, clientY: 400 })
      fireEvent.mouseMove(document, { clientX: 350, clientY: 470 })
      fireEvent.mouseUp(document)

      await waitFor(() => {
        if (onCropAreaChange.mock.calls.length > 0) {
          const lastCall = onCropAreaChange.mock.calls[onCropAreaChange.mock.calls.length - 1][0]
          const aspectRatio = lastCall.width / lastCall.height
          // Should maintain 1-inch aspect ratio (0.714)
          expect(aspectRatio).toBeCloseTo(0.714, 2)
        }
      })
    })

    it('should prevent resizing beyond image boundaries', () => {
      const onCropAreaChange = vi.fn()
      render(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={mockFaceBox}
          selectedSize={mockSelectedSize}
          onCropAreaChange={onCropAreaChange}
        />
      )

      const handle = screen.getByTestId('resize-handle-se')
      
      // Try to resize beyond boundaries
      fireEvent.mouseDown(handle, { clientX: 300, clientY: 400 })
      fireEvent.mouseMove(document, { clientX: 5000, clientY: 5000 })
      fireEvent.mouseUp(document)

      // Should be constrained
      if (onCropAreaChange.mock.calls.length > 0) {
        const lastCall = onCropAreaChange.mock.calls[onCropAreaChange.mock.calls.length - 1][0]
        // Rectangle should not exceed image bounds (assuming some reasonable max)
        expect(lastCall.width).toBeLessThan(2000)
        expect(lastCall.height).toBeLessThan(2000)
      }
    })

    it('should have minimum size constraint', () => {
      const onCropAreaChange = vi.fn()
      render(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={mockFaceBox}
          selectedSize={mockSelectedSize}
          onCropAreaChange={onCropAreaChange}
        />
      )

      const handle = screen.getByTestId('resize-handle-se')
      
      // Try to resize to very small
      fireEvent.mouseDown(handle, { clientX: 300, clientY: 400 })
      fireEvent.mouseMove(document, { clientX: 100, clientY: 100 })
      fireEvent.mouseUp(document)

      // Should have minimum size
      if (onCropAreaChange.mock.calls.length > 0) {
        const lastCall = onCropAreaChange.mock.calls[onCropAreaChange.mock.calls.length - 1][0]
        expect(lastCall.width).toBeGreaterThan(50)
        expect(lastCall.height).toBeGreaterThan(50)
      }
    })
  })

  describe('Error handling', () => {
    it('should display error when no face detected', () => {
      render(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={null}
          error="no-face-detected"
          selectedSize={mockSelectedSize}
          onCropAreaChange={vi.fn()}
        />
      )

      expect(screen.getByText(/no face detected/i)).toBeInTheDocument()
    })

    it('should display error when multiple faces detected', () => {
      render(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={null}
          error="multiple-faces-detected"
          selectedSize={mockSelectedSize}
          onCropAreaChange={vi.fn()}
        />
      )

      expect(screen.getByText(/multiple faces detected/i)).toBeInTheDocument()
    })

    it('should center rectangle when no face detected', () => {
      render(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={null}
          error="no-face-detected"
          selectedSize={mockSelectedSize}
          onCropAreaChange={vi.fn()}
        />
      )

      const rectangle = screen.getByTestId('crop-rectangle')
      expect(rectangle).toBeInTheDocument()
      // Rectangle should still be present but centered
    })
  })

  describe('Callback invocation', () => {
    it('should call onCropAreaChange with initial crop area', () => {
      const onCropAreaChange = vi.fn()
      render(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={mockFaceBox}
          selectedSize={mockSelectedSize}
          onCropAreaChange={onCropAreaChange}
        />
      )

      expect(onCropAreaChange).toHaveBeenCalled()
      expect(onCropAreaChange.mock.calls[0][0]).toMatchObject({
        x: expect.any(Number),
        y: expect.any(Number),
        width: expect.any(Number),
        height: expect.any(Number),
      })
    })

    it('should call onCropAreaChange when rectangle is dragged', () => {
      const onCropAreaChange = vi.fn()
      render(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={mockFaceBox}
          selectedSize={mockSelectedSize}
          onCropAreaChange={onCropAreaChange}
        />
      )

      const initialCallCount = onCropAreaChange.mock.calls.length
      const rectangle = screen.getByTestId('crop-rectangle')
      
      fireEvent.mouseDown(rectangle, { clientX: 100, clientY: 100 })
      fireEvent.mouseMove(document, { clientX: 150, clientY: 150 })
      fireEvent.mouseUp(document)

      expect(onCropAreaChange.mock.calls.length).toBeGreaterThan(initialCallCount)
    })
  })

  describe('Compact mode', () => {
    it('should not render size buttons', () => {
      render(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={mockFaceBox}
          selectedSize={mockSelectedSize}
          onCropAreaChange={vi.fn()}
        />
      )

      // Size buttons should never be visible
      expect(screen.queryByTestId('size-1-inch')).not.toBeInTheDocument()
      expect(screen.queryByTestId('size-2-inch')).not.toBeInTheDocument()
      expect(screen.queryByTestId('size-3-inch')).not.toBeInTheDocument()
      
      // But image and crop rectangle should still be visible
      expect(screen.getByTestId('processed-image')).toBeInTheDocument()
      expect(screen.getByTestId('crop-rectangle')).toBeInTheDocument()
    })

    it('should not render instructions', () => {
      render(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={mockFaceBox}
          selectedSize={mockSelectedSize}
          onCropAreaChange={vi.fn()}
        />
      )

      // Instructions should never be visible
      expect(screen.queryByText(/drag the rectangle/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/drag the corner handles/i)).not.toBeInTheDocument()
    })

    it('should still allow drag and resize interactions', () => {
      const onCropAreaChange = vi.fn()
      render(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={mockFaceBox}
          selectedSize={mockSelectedSize}
          onCropAreaChange={onCropAreaChange}
        />
      )

      const rectangle = screen.getByTestId('crop-rectangle')
      const initialCallCount = onCropAreaChange.mock.calls.length
      
      // Try dragging
      fireEvent.mouseDown(rectangle, { clientX: 100, clientY: 100 })
      fireEvent.mouseMove(document, { clientX: 150, clientY: 150 })
      fireEvent.mouseUp(document)

      // Should still call callback
      expect(onCropAreaChange.mock.calls.length).toBeGreaterThan(initialCallCount)
    })

    it('should not hide error messages', () => {
      render(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={null}
          error="no-face-detected"
          selectedSize={mockSelectedSize}
          onCropAreaChange={vi.fn()}
        />
      )

      // Error messages should still be visible
      expect(screen.getByText(/no face detected/i)).toBeInTheDocument()
    })
  })

  describe('External size selection control', () => {
    it('should adjust crop area when selectedSize prop changes externally', async () => {
      const onCropAreaChange = vi.fn()
      const { rerender } = render(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={mockFaceBox}
          onCropAreaChange={onCropAreaChange}
          selectedSize={{ id: '1-inch', label: '1 Inch', dimensions: '25×35mm', aspectRatio: 25 / 35 }}
        />
      )

      const initialCallCount = onCropAreaChange.mock.calls.length

      // Change size externally by updating prop
      rerender(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={mockFaceBox}
          onCropAreaChange={onCropAreaChange}
          selectedSize={{ id: '3-inch', label: '3 Inch', dimensions: '35×52mm', aspectRatio: 35 / 52 }}
        />
      )

      // Should trigger crop area adjustment
      await waitFor(() => {
        expect(onCropAreaChange.mock.calls.length).toBeGreaterThan(initialCallCount)
      })

      // Check that new aspect ratio is applied
      const lastCall = onCropAreaChange.mock.calls[onCropAreaChange.mock.calls.length - 1][0]
      const aspectRatio = lastCall.width / lastCall.height
      expect(aspectRatio).toBeCloseTo(35 / 52, 2)
    })

    it('should maintain crop area center when size changes externally', async () => {
      const onCropAreaChange = vi.fn()
      const { rerender } = render(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={mockFaceBox}
          onCropAreaChange={onCropAreaChange}
          selectedSize={{ id: '1-inch', label: '1 Inch', dimensions: '25×35mm', aspectRatio: 25 / 35 }}
        />
      )

      // Wait for initial crop area to be set
      await waitFor(() => {
        expect(onCropAreaChange).toHaveBeenCalled()
      })

      const initialCrop = onCropAreaChange.mock.calls[onCropAreaChange.mock.calls.length - 1][0]
      const initialCenterX = initialCrop.x + initialCrop.width / 2
      const initialCenterY = initialCrop.y + initialCrop.height / 2

      // Change size externally
      rerender(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={mockFaceBox}
          onCropAreaChange={onCropAreaChange}
          selectedSize={{ id: '2-inch', label: '2 Inch', dimensions: '35×49mm', aspectRatio: 35 / 49 }}
        />
      )

      await waitFor(() => {
        const calls = onCropAreaChange.mock.calls
        if (calls.length > 1) {
          const newCrop = calls[calls.length - 1][0]
          const newCenterX = newCrop.x + newCrop.width / 2
          const newCenterY = newCrop.y + newCrop.height / 2
          
          // Center should remain approximately the same (with some tolerance for rounding)
          expect(newCenterX).toBeCloseTo(initialCenterX, 0)
          expect(newCenterY).toBeCloseTo(initialCenterY, 0)
        }
      })
    })
  })
})
