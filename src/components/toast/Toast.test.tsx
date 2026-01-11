import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Toast } from './Toast'

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('Variants', () => {
    it('should render info toast with correct styling', () => {
      render(<Toast id="1" message="Info message" variant="info" onDismiss={vi.fn()} />)
      
      const toast = screen.getByRole('alert')
      expect(toast).toBeInTheDocument()
      expect(toast).toHaveClass('bg-blue-50')
      expect(screen.getByText('Info message')).toBeInTheDocument()
    })

    it('should render success toast with correct styling', () => {
      render(<Toast id="1" message="Success message" variant="success" onDismiss={vi.fn()} />)
      
      const toast = screen.getByRole('alert')
      expect(toast).toHaveClass('bg-green-50')
      expect(screen.getByText('Success message')).toBeInTheDocument()
    })

    it('should render warning toast with correct styling', () => {
      render(<Toast id="1" message="Warning message" variant="warning" onDismiss={vi.fn()} />)
      
      const toast = screen.getByRole('alert')
      expect(toast).toHaveClass('bg-yellow-50')
      expect(screen.getByText('Warning message')).toBeInTheDocument()
    })

    it('should render error toast with correct styling', () => {
      render(<Toast id="1" message="Error message" variant="error" onDismiss={vi.fn()} />)
      
      const toast = screen.getByRole('alert')
      expect(toast).toHaveClass('bg-red-50')
      expect(screen.getByText('Error message')).toBeInTheDocument()
    })
  })

  describe('Dismiss functionality', () => {
    it('should call onDismiss when close button is clicked', async () => {
      const onDismiss = vi.fn()
      
      render(<Toast id="1" message="Test message" variant="info" onDismiss={onDismiss} />)
      
      const closeButton = screen.getByRole('button', { name: /close/i })
      closeButton.click()
      
      expect(onDismiss).toHaveBeenCalledWith('1')
    })

    it('should auto-dismiss after specified duration', async () => {
      const onDismiss = vi.fn()
      
      render(
        <Toast
          id="1"
          message="Auto dismiss"
          variant="success"
          onDismiss={onDismiss}
          duration={3000}
        />
      )
      
      expect(onDismiss).not.toHaveBeenCalled()
      
      vi.advanceTimersByTime(3000)
      
      expect(onDismiss).toHaveBeenCalledWith('1')
    })

    it('should not auto-dismiss when duration is 0', async () => {
      const onDismiss = vi.fn()
      
      render(
        <Toast
          id="1"
          message="No auto dismiss"
          variant="error"
          onDismiss={onDismiss}
          duration={0}
        />
      )
      
      vi.advanceTimersByTime(10000)
      
      expect(onDismiss).not.toHaveBeenCalled()
    })
  })

  describe('Animation', () => {
    it('should have animation classes for entrance', () => {
      render(<Toast id="1" message="Animated toast" variant="info" onDismiss={vi.fn()} />)
      
      const toast = screen.getByRole('alert')
      expect(toast).toHaveClass('animate-slide-in-right')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Toast id="1" message="Accessible toast" variant="info" onDismiss={vi.fn()} />)
      
      const toast = screen.getByRole('alert')
      expect(toast).toHaveAttribute('aria-live', 'polite')
      expect(toast).toHaveAttribute('aria-atomic', 'true')
    })

    it('should have assertive aria-live for error toasts', () => {
      render(<Toast id="1" message="Error toast" variant="error" onDismiss={vi.fn()} />)
      
      const toast = screen.getByRole('alert')
      expect(toast).toHaveAttribute('aria-live', 'assertive')
    })
  })

  describe('Icon display', () => {
    it('should display appropriate icon for each variant', () => {
      const { rerender } = render(
        <Toast id="1" message="Test" variant="info" onDismiss={vi.fn()} />
      )
      expect(screen.getByTestId('toast-icon-info')).toBeInTheDocument()

      rerender(<Toast id="1" message="Test" variant="success" onDismiss={vi.fn()} />)
      expect(screen.getByTestId('toast-icon-success')).toBeInTheDocument()

      rerender(<Toast id="1" message="Test" variant="warning" onDismiss={vi.fn()} />)
      expect(screen.getByTestId('toast-icon-warning')).toBeInTheDocument()

      rerender(<Toast id="1" message="Test" variant="error" onDismiss={vi.fn()} />)
      expect(screen.getByTestId('toast-icon-error')).toBeInTheDocument()
    })
  })
})
