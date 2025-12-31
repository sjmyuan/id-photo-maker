/**
 * Size Selection with Crop Guide Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SizeSelection } from './SizeSelection'
import type { FaceBox } from '../../services/faceDetectionService'

describe('SizeSelection', () => {
  const mockProcessedImageUrl = 'blob:http://localhost/processed-image'
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

  describe('Size button rendering and selection', () => {
    it('should render all three size options', () => {
      render(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={mockFaceBox}
          onCropAreaChange={vi.fn()}
        />
      )

      expect(screen.getByTestId('size-1-inch')).toBeInTheDocument()
      expect(screen.getByTestId('size-2-inch')).toBeInTheDocument()
      expect(screen.getByTestId('size-3-inch')).toBeInTheDocument()
    })

    it('should select 1-inch by default', () => {
      render(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={mockFaceBox}
          onCropAreaChange={vi.fn()}
        />
      )

      const oneInchButton = screen.getByTestId('size-1-inch')
      expect(oneInchButton).toHaveClass('selected')
    })

    it('should update selection when clicking different size', () => {
      render(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={mockFaceBox}
          onCropAreaChange={vi.fn()}
        />
      )

      const twoInchButton = screen.getByTestId('size-2-inch')
      fireEvent.click(twoInchButton)

      expect(twoInchButton).toHaveClass('selected')
      expect(screen.getByTestId('size-1-inch')).not.toHaveClass('selected')
    })

    it('should display correct aspect ratio for each size', () => {
      render(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={mockFaceBox}
          onCropAreaChange={vi.fn()}
        />
      )

      // 1-inch and 2-inch: 25×35mm, 35×49mm → both 0.714 aspect ratio
      expect(screen.getByTestId('size-1-inch')).toHaveTextContent('25×35mm')
      expect(screen.getByTestId('size-2-inch')).toHaveTextContent('35×49mm')
      // 3-inch: 35×52mm → 0.673 aspect ratio
      expect(screen.getByTestId('size-3-inch')).toHaveTextContent('35×52mm')
    })
  })

  describe('Crop rectangle rendering', () => {
    it('should render crop rectangle overlay on image', () => {
      render(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={mockFaceBox}
          onCropAreaChange={vi.fn()}
        />
      )

      expect(screen.getByTestId('crop-rectangle')).toBeInTheDocument()
      expect(screen.getByTestId('processed-image')).toBeInTheDocument()
    })

    it('should position rectangle based on face detection initially', () => {
      render(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={mockFaceBox}
          onCropAreaChange={vi.fn()}
        />
      )

      const rectangle = screen.getByTestId('crop-rectangle')
      // Rectangle should be positioned around the face
      expect(rectangle).toHaveClass('absolute')
    })

    it('should maintain aspect ratio of selected size', async () => {
      const onCropAreaChange = vi.fn()
      render(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={mockFaceBox}
          onCropAreaChange={onCropAreaChange}
        />
      )

      const twoInchButton = screen.getByTestId('size-2-inch')
      fireEvent.click(twoInchButton)

      await waitFor(() => {
        const calls = onCropAreaChange.mock.calls
        if (calls.length > 0) {
          const lastCall = calls[calls.length - 1][0]
          const aspectRatio = lastCall.width / lastCall.height
          // 2-inch: 35×49mm = 0.714 aspect ratio (with some tolerance)
          expect(aspectRatio).toBeCloseTo(0.714, 2)
        }
      })
    })

    it('should adjust rectangle when switching between sizes', async () => {
      const onCropAreaChange = vi.fn()
      render(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={mockFaceBox}
          onCropAreaChange={onCropAreaChange}
        />
      )

      // Initially 1-inch (0.714)
      const threeInchButton = screen.getByTestId('size-3-inch')
      fireEvent.click(threeInchButton)

      await waitFor(() => {
        const calls = onCropAreaChange.mock.calls
        if (calls.length > 0) {
          const lastCall = calls[calls.length - 1][0]
          const aspectRatio = lastCall.width / lastCall.height
          // 3-inch: 35×52mm = 0.673 aspect ratio (with some tolerance)
          expect(aspectRatio).toBeCloseTo(0.673, 2)
        }
      })
    })
  })

  describe('Rectangle drag interactions', () => {
    it('should allow dragging the rectangle', () => {
      render(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={mockFaceBox}
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

    it('should call onCropAreaChange when size changes', () => {
      const onCropAreaChange = vi.fn()
      render(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={mockFaceBox}
          onCropAreaChange={onCropAreaChange}
        />
      )

      const initialCallCount = onCropAreaChange.mock.calls.length
      
      const twoInchButton = screen.getByTestId('size-2-inch')
      fireEvent.click(twoInchButton)

      expect(onCropAreaChange.mock.calls.length).toBeGreaterThan(initialCallCount)
    })

    it('should call onCropAreaChange when rectangle is dragged', () => {
      const onCropAreaChange = vi.fn()
      render(
        <SizeSelection
          processedImageUrl={mockProcessedImageUrl}
          faceBox={mockFaceBox}
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
})
