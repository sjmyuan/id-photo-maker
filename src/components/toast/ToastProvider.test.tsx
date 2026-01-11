import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ToastProvider, useToast } from './ToastProvider'

// Test component that uses the useToast hook
function TestComponent() {
  const { showToast, showInfo, showSuccess, showWarning, showError } = useToast()

  return (
    <div>
      <button onClick={() => showToast('Custom toast', 'info')}>Show Custom</button>
      <button onClick={() => showInfo('Info message')}>Show Info</button>
      <button onClick={() => showSuccess('Success message')}>Show Success</button>
      <button onClick={() => showWarning('Warning message')}>Show Warning</button>
      <button onClick={() => showError('Error message')}>Show Error</button>
    </div>
  )
}

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should render children', () => {
    render(
      <ToastProvider>
        <div>Test content</div>
      </ToastProvider>
    )

    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('should throw error when useToast is called outside provider', () => {
    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useToast must be used within a ToastProvider')

    consoleError.mockRestore()
  })

  describe('useToast hook', () => {
    it('should add toast when showToast is called', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      )

      const button = screen.getByText('Show Custom')
      act(() => {
        button.click()
      })

      expect(screen.getByText('Custom toast')).toBeInTheDocument()
    })

    it('should add info toast when showInfo is called', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      )

      const button = screen.getByText('Show Info')
      act(() => {
        button.click()
      })

      expect(screen.getByText('Info message')).toBeInTheDocument()
      const toast = screen.getByRole('alert')
      expect(toast).toHaveClass('bg-blue-50')
    })

    it('should add success toast when showSuccess is called', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      )

      const button = screen.getByText('Show Success')
      act(() => {
        button.click()
      })

      expect(screen.getByText('Success message')).toBeInTheDocument()
      const toast = screen.getByRole('alert')
      expect(toast).toHaveClass('bg-green-50')
    })

    it('should add warning toast when showWarning is called', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      )

      const button = screen.getByText('Show Warning')
      act(() => {
        button.click()
      })

      expect(screen.getByText('Warning message')).toBeInTheDocument()
      const toast = screen.getByRole('alert')
      expect(toast).toHaveClass('bg-yellow-50')
    })

    it('should add error toast when showError is called', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      )

      const button = screen.getByText('Show Error')
      act(() => {
        button.click()
      })

      expect(screen.getByText('Error message')).toBeInTheDocument()
      const toast = screen.getByRole('alert')
      expect(toast).toHaveClass('bg-red-50')
    })
  })

  describe('Multiple toasts', () => {
    it('should display multiple toasts simultaneously', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      )

      act(() => {
        screen.getByText('Show Info').click()
        screen.getByText('Show Success').click()
        screen.getByText('Show Warning').click()
      })

      expect(screen.getByText('Info message')).toBeInTheDocument()
      expect(screen.getByText('Success message')).toBeInTheDocument()
      expect(screen.getByText('Warning message')).toBeInTheDocument()
    })

    it('should stack toasts in the correct order (newest on top)', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      )

      act(() => {
        screen.getByText('Show Info').click()
      })
      act(() => {
        screen.getByText('Show Success').click()
      })

      const toasts = screen.getAllByRole('alert')
      expect(toasts).toHaveLength(2)
      // Newest toast (Success) should be first in DOM
      expect(toasts[0]).toHaveTextContent('Success message')
      expect(toasts[1]).toHaveTextContent('Info message')
    })
  })

  describe('Toast dismissal', () => {
    it('should remove toast when dismiss button is clicked', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      )

      act(() => {
        screen.getByText('Show Info').click()
      })
      expect(screen.getByText('Info message')).toBeInTheDocument()

      const closeButton = screen.getByRole('button', { name: /close/i })
      act(() => {
        closeButton.click()
      })

      expect(screen.queryByText('Info message')).not.toBeInTheDocument()
    })

    it('should auto-dismiss toast after default duration for success', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      )

      act(() => {
        screen.getByText('Show Success').click()
      })
      expect(screen.getByText('Success message')).toBeInTheDocument()

      // Success toasts should auto-dismiss after 4 seconds
      act(() => {
        vi.advanceTimersByTime(4000)
      })

      expect(screen.queryByText('Success message')).not.toBeInTheDocument()
    })

    it('should not auto-dismiss error toast', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      )

      act(() => {
        screen.getByText('Show Error').click()
      })
      expect(screen.getByText('Error message')).toBeInTheDocument()

      // Error toasts should not auto-dismiss
      act(() => {
        vi.advanceTimersByTime(10000)
      })

      expect(screen.getByText('Error message')).toBeInTheDocument()
    })
  })

  describe('Toast positioning', () => {
    it('should render toasts in a fixed container at top-right', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      )

      act(() => {
        screen.getByText('Show Info').click()
      })

      const container = screen.getByRole('alert').parentElement
      expect(container).toHaveClass('fixed')
      expect(container).toHaveClass('top-4')
      expect(container).toHaveClass('right-4')
    })
  })
})
