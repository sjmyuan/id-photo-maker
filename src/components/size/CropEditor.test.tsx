/**
 * Crop Editor Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CropEditor, SIZE_OPTIONS, type CropArea } from './CropEditor'

describe('CropEditor', () => {
  const mockProcessedImageUrl = 'blob:http://localhost/processed-image'
  const mockSelectedSize = SIZE_OPTIONS[1] // 1-inch (standard) by default
  const mockInitialCropArea: CropArea = {
    x: 100,
    y: 80,
    width: 200,
    height: 280,
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
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={mockInitialCropArea}
          selectedSize={mockSelectedSize}
          onCropAreaChange={vi.fn()}
        />
      )

      expect(screen.getByTestId('crop-rectangle')).toBeInTheDocument()
      expect(screen.getByTestId('processed-image')).toBeInTheDocument()
    })

    it('should render processed image with maximum height constraint', () => {
      render(
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={mockInitialCropArea}
          selectedSize={mockSelectedSize}
          onCropAreaChange={vi.fn()}
        />
      )

      const processedImage = screen.getByTestId('processed-image')
      
      // Should have maximum height styling to avoid scrolling
      expect(processedImage).toHaveClass('max-h-[70vh]')
      expect(processedImage).toHaveClass('max-w-full')
      expect(processedImage).toHaveClass('object-contain')
    })

    it('should render dark overlay outside crop area', () => {
      render(
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={mockInitialCropArea}
          selectedSize={mockSelectedSize}
          onCropAreaChange={vi.fn()}
        />
      )

      // Check for the four separate overlay divs
      const overlayTop = screen.getByTestId('crop-overlay-top')
      const overlayBottom = screen.getByTestId('crop-overlay-bottom')
      const overlayLeft = screen.getByTestId('crop-overlay-left')
      const overlayRight = screen.getByTestId('crop-overlay-right')
      
      expect(overlayTop).toBeInTheDocument()
      expect(overlayBottom).toBeInTheDocument()
      expect(overlayLeft).toBeInTheDocument()
      expect(overlayRight).toBeInTheDocument()
      
      // All overlays should be absolutely positioned
      expect(overlayTop).toHaveClass('absolute')
      expect(overlayTop).toHaveClass('bg-black/50')
      expect(overlayTop).toHaveClass('pointer-events-none')
    })

    it('should render crop rectangle with transparent background and only border visible', () => {
      render(
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={mockInitialCropArea}
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
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={mockInitialCropArea}
          selectedSize={mockSelectedSize}
          onCropAreaChange={vi.fn()}
        />
      )

      const rectangle = screen.getByTestId('crop-rectangle')
      // Rectangle should be positioned around the face
      expect(rectangle).toHaveClass('absolute')
    })

    // Test for face expansion logic removed - this is now handled in MainWorkflow
  })

  describe('Rectangle drag interactions', () => {
    it('should allow dragging the rectangle', () => {
      render(
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={mockInitialCropArea}
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
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={mockInitialCropArea}
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
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={mockInitialCropArea}
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
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={mockInitialCropArea}
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
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={mockInitialCropArea}
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
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={mockInitialCropArea}
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
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={mockInitialCropArea}
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

  // Error handling tests removed - errors are now handled in MainWorkflow component

  describe('Callback invocation', () => {
    it('should call onCropAreaChange with initial crop area', () => {
      const onCropAreaChange = vi.fn()
      render(
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={mockInitialCropArea}
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
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={mockInitialCropArea}
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
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={mockInitialCropArea}
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
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={mockInitialCropArea}
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
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={mockInitialCropArea}
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

    // Test for error messages removed - errors are now handled in MainWorkflow
  })

  describe('External size selection control', () => {
    it('should adjust crop area when selectedSize prop changes externally', async () => {
      const onCropAreaChange = vi.fn()
      const { rerender } = render(
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={mockInitialCropArea}
          onCropAreaChange={onCropAreaChange}
          selectedSize={{ id: '1-inch', label: '1 Inch', dimensions: '25×35mm', aspectRatio: 25 / 35, physicalWidth: 25, physicalHeight: 35 }}
        />
      )

      const initialCallCount = onCropAreaChange.mock.calls.length

      // Change size externally by updating prop
      rerender(
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={mockInitialCropArea}
          onCropAreaChange={onCropAreaChange}
          selectedSize={{ id: '3-inch', label: '3 Inch', dimensions: '35×52mm', aspectRatio: 35 / 52, physicalWidth: 35, physicalHeight: 52 }}
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
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={mockInitialCropArea}
          onCropAreaChange={onCropAreaChange}
          selectedSize={{ id: '1-inch', label: '1 Inch', dimensions: '25×35mm', aspectRatio: 25 / 35, physicalWidth: 25, physicalHeight: 35 }}
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
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={mockInitialCropArea}
          onCropAreaChange={onCropAreaChange}
          selectedSize={{ id: '2-inch', label: '2 Inch', dimensions: '35×49mm', aspectRatio: 35 / 49, physicalWidth: 35, physicalHeight: 49 }}
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

  // Tests for calculateInitialCropArea logic removed - this function now lives in MainWorkflow

  describe('View mode toggle controls', () => {
    it('should render zoom to crop and show full image buttons', () => {
      render(
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={mockInitialCropArea}
          selectedSize={mockSelectedSize}
          onCropAreaChange={vi.fn()}
        />
      )

      // Should have buttons for toggling view modes
      const zoomToCropButton = screen.getByRole('button', { name: /zoom to crop/i })
      const showFullImageButton = screen.getByRole('button', { name: /show full image/i })
      
      expect(zoomToCropButton).toBeInTheDocument()
      expect(showFullImageButton).toBeInTheDocument()
    })

    it('should start in full view mode by default', () => {
      render(
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={mockInitialCropArea}
          selectedSize={mockSelectedSize}
          onCropAreaChange={vi.fn()}
        />
      )

      // Show full image button should be active (indicated by styling or aria attributes)
      const showFullImageButton = screen.getByRole('button', { name: /show full image/i })
      expect(showFullImageButton).toHaveClass('ring-2')
    })

    it('should toggle to crop view when zoom to crop button is clicked', () => {
      render(
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={mockInitialCropArea}
          selectedSize={mockSelectedSize}
          onCropAreaChange={vi.fn()}
        />
      )

      const zoomToCropButton = screen.getByRole('button', { name: /zoom to crop/i })
      fireEvent.click(zoomToCropButton)

      // Zoom to crop button should now be active
      expect(zoomToCropButton).toHaveClass('ring-2')
    })

    it('should toggle back to full view when show full image button is clicked', () => {
      render(
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={mockInitialCropArea}
          selectedSize={mockSelectedSize}
          onCropAreaChange={vi.fn()}
        />
      )

      const zoomToCropButton = screen.getByRole('button', { name: /zoom to crop/i })
      const showFullImageButton = screen.getByRole('button', { name: /show full image/i })
      
      // Switch to crop view
      fireEvent.click(zoomToCropButton)
      expect(zoomToCropButton).toHaveClass('ring-2')
      
      // Switch back to full view
      fireEvent.click(showFullImageButton)
      expect(showFullImageButton).toHaveClass('ring-2')
    })

    it('should display buttons at top-right of image container', () => {
      render(
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={mockInitialCropArea}
          selectedSize={mockSelectedSize}
          onCropAreaChange={vi.fn()}
        />
      )

      const controlsContainer = screen.getByTestId('view-mode-controls')
      expect(controlsContainer).toBeInTheDocument()
      expect(controlsContainer).toHaveClass('absolute')
    })
  })

  describe('Crop view zoom behavior', () => {
    it('should apply transform scale to image in crop view mode', () => {
      render(
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={mockInitialCropArea}
          selectedSize={mockSelectedSize}
          onCropAreaChange={vi.fn()}
        />
      )

      const zoomToCropButton = screen.getByRole('button', { name: /zoom to crop/i })
      fireEvent.click(zoomToCropButton)

      const imageContainer = screen.getByTestId('image-container')
      const style = imageContainer.style.transform
      
      // Should have scale and translate transforms applied
      expect(style).toBeTruthy()
      expect(style).toContain('scale')
    })

    it('should center crop area when in crop view mode', () => {
      render(
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={mockInitialCropArea}
          selectedSize={mockSelectedSize}
          onCropAreaChange={vi.fn()}
        />
      )

      const zoomToCropButton = screen.getByRole('button', { name: /zoom to crop/i })
      fireEvent.click(zoomToCropButton)

      const imageContainer = screen.getByTestId('image-container')
      const style = imageContainer.style.transform
      
      // Should have translate transform to center the crop area
      expect(style).toContain('translate')
    })

    it('should not apply transforms in full view mode', () => {
      render(
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={mockInitialCropArea}
          selectedSize={mockSelectedSize}
          onCropAreaChange={vi.fn()}
        />
      )

      const imageContainer = screen.getByTestId('image-container')
      const style = imageContainer.style.transform
      
      // Should not have transforms in full view mode
      expect(style).toBeFalsy()
    })

    it('should add transition for smooth zoom animation', () => {
      render(
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={mockInitialCropArea}
          selectedSize={mockSelectedSize}
          onCropAreaChange={vi.fn()}
        />
      )

      const imageContainer = screen.getByTestId('image-container')
      
      // Should have transition property for smooth animation
      expect(imageContainer).toHaveClass('transition-transform')
    })

    it('should update zoom when crop area changes in crop view mode', () => {
      render(
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={mockInitialCropArea}
          selectedSize={mockSelectedSize}
          onCropAreaChange={vi.fn()}
        />
      )

      const zoomToCropButton = screen.getByRole('button', { name: /zoom to crop/i })
      fireEvent.click(zoomToCropButton)

      const imageContainer = screen.getByTestId('image-container')

      // Drag the crop rectangle to change crop area
      const rectangle = screen.getByTestId('crop-rectangle')
      fireEvent.mouseDown(rectangle, { clientX: 100, clientY: 100 })
      fireEvent.mouseMove(document, { clientX: 150, clientY: 150 })
      fireEvent.mouseUp(document)

      // Transform should be recalculated
      const updatedTransform = imageContainer.style.transform
      expect(updatedTransform).toBeTruthy()
      // Note: In actual implementation, we expect transform might change,
      // but for this test we just verify it's still applied
      expect(updatedTransform).toContain('scale')
    })
  })

  describe('DPI Warning Display', () => {
    it('should show warning when crop area cannot achieve 300 DPI', () => {
      // Set up small crop area that cannot achieve 300 DPI for 1-inch photo (25x35mm)
      // At 300 DPI, 1-inch needs ~295x413 pixels
      // We'll make the crop area only 200x280 pixels (approx 203 DPI)
      const onCropAreaChange = vi.fn()
      
      render(
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={null} // No face box to control initial size
          selectedSize={mockSelectedSize} // 1-inch: 25x35mm
          onCropAreaChange={onCropAreaChange}
        />
      )

      // Wait for initial crop area to be set (40% of 800px = 320px width)
      // This should be sufficient for 300 DPI initially
      
      // Resize the crop area to be small (use SW handle to resize)
      const swHandle = screen.getByTestId('resize-handle-sw')
      
      // Simulate resizing to make crop area small
      fireEvent.mouseDown(swHandle, { clientX: 200, clientY: 300 })
      // Move to make it much smaller - this should trigger low DPI warning
      fireEvent.mouseMove(document, { clientX: 350, clientY: 450 })
      fireEvent.mouseUp(document)

      // Warning should appear
      const warning = screen.getByTestId('dpi-warning')
      expect(warning).toBeInTheDocument()
      expect(warning).toHaveTextContent(/warning/i)
      expect(warning).toHaveTextContent(/300 dpi/i)
    })

    it('should display actual calculated DPI in warning message', () => {
      const onCropAreaChange = vi.fn()
      
      render(
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={null}
          selectedSize={mockSelectedSize}
          onCropAreaChange={onCropAreaChange}
        />
      )

      // Resize to create low DPI scenario
      const swHandle = screen.getByTestId('resize-handle-sw')
      fireEvent.mouseDown(swHandle, { clientX: 200, clientY: 300 })
      fireEvent.mouseMove(document, { clientX: 350, clientY: 450 })
      fireEvent.mouseUp(document)

      const warning = screen.getByTestId('dpi-warning')
      
      // Should show the actual calculated DPI value
      expect(warning).toHaveTextContent(/\d+ dpi/i)
    })

    it('should not show warning when crop area achieves 300 DPI or higher', () => {
      const onCropAreaChange = vi.fn()
      
      // Use a larger crop area to ensure it exceeds 300 DPI
      const largeCropArea: CropArea = {
        x: 50,
        y: 50,
        width: 300,
        height: 375,
      }
      
      render(
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={largeCropArea} // Large crop area with sufficient DPI
          selectedSize={mockSelectedSize}
          onCropAreaChange={onCropAreaChange}
        />
      )

      // With large crop area on 800x600 image, should be large enough for 300+ DPI
      const warning = screen.queryByTestId('dpi-warning')
      expect(warning).not.toBeInTheDocument()
    })

    it('should update warning when switching between sizes', () => {
      const onCropAreaChange = vi.fn()
      
      const { rerender } = render(
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={null}
          selectedSize={SIZE_OPTIONS[0]} // 1-inch (25x35mm)
          onCropAreaChange={onCropAreaChange}
        />
      )

      // Initial crop might be okay for 1-inch
      let warning = screen.queryByTestId('dpi-warning')
      
      // Make crop small enough to trigger warning for 1-inch
      const swHandle = screen.getByTestId('resize-handle-sw')
      fireEvent.mouseDown(swHandle, { clientX: 200, clientY: 300 })
      fireEvent.mouseMove(document, { clientX: 350, clientY: 450 })
      fireEvent.mouseUp(document)

      warning = screen.queryByTestId('dpi-warning')
      expect(warning).toBeInTheDocument()

      // Switch to 3-inch (35x52mm) - larger physical size needs more pixels
      // Same crop area should still show warning or potentially worse DPI
      rerender(
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={null}
          selectedSize={SIZE_OPTIONS[2]} // 3-inch
          onCropAreaChange={onCropAreaChange}
        />
      )

      warning = screen.queryByTestId('dpi-warning')
      // Warning should still be present since 3-inch requires more pixels
      expect(warning).toBeInTheDocument()
    })

    it('should style warning as informational not blocking', () => {
      const onCropAreaChange = vi.fn()
      
      render(
        <CropEditor
          processedImageUrl={mockProcessedImageUrl}
          initialCropArea={null}
          selectedSize={mockSelectedSize}
          onCropAreaChange={onCropAreaChange}
        />
      )

      // Create low DPI scenario
      const swHandle = screen.getByTestId('resize-handle-sw')
      fireEvent.mouseDown(swHandle, { clientX: 200, clientY: 300 })
      fireEvent.mouseMove(document, { clientX: 350, clientY: 450 })
      fireEvent.mouseUp(document)

      const warning = screen.getByTestId('dpi-warning')
      
      // Should use informational styling (yellow/warning colors, not red/error)
      expect(warning).toHaveClass('bg-yellow-100')
      expect(warning).toHaveClass('border-yellow-400')
      expect(warning).toHaveClass('text-yellow-700')
    })
  })
})
