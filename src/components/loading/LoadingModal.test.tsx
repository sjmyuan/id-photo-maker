import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoadingModal } from './LoadingModal'

describe('LoadingModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Visibility', () => {
    it('should render when isOpen is true', () => {
      render(<LoadingModal isOpen={true} message="Loading..." />)
      
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      render(<LoadingModal isOpen={false} message="Loading..." />)
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<LoadingModal isOpen={true} message="Loading models..." />)
      
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby')
      
      const labelId = dialog.getAttribute('aria-labelledby')
      const label = document.getElementById(labelId!)
      expect(label).toHaveTextContent('Loading models...')
    })

    it('should have aria-live region for screen readers', () => {
      render(<LoadingModal isOpen={true} message="Loading..." />)
      
      const liveRegion = screen.getByRole('status')
      expect(liveRegion).toHaveAttribute('aria-live', 'polite')
    })
  })

  describe('Styling', () => {
    it('should have semi-transparent backdrop', () => {
      render(<LoadingModal isOpen={true} message="Loading..." />)
      
      const backdrop = screen.getByRole('dialog').parentElement
      expect(backdrop).toHaveClass('bg-black/50')
    })

    it('should display centered content', () => {
      render(<LoadingModal isOpen={true} message="Loading..." />)
      
      const backdrop = screen.getByRole('dialog').parentElement
      expect(backdrop).toHaveClass('flex', 'items-center', 'justify-center')
    })

    it('should display loading spinner', () => {
      render(<LoadingModal isOpen={true} message="Loading..." />)
      
      const spinner = screen.getByTestId('loading-spinner')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('animate-spin')
    })
  })

  describe('Message Display', () => {
    it('should display the provided message', () => {
      render(<LoadingModal isOpen={true} message="Loading AI models..." />)
      
      expect(screen.getByText('Loading AI models...')).toBeInTheDocument()
    })

    it('should update message when prop changes', () => {
      const { rerender } = render(<LoadingModal isOpen={true} message="Loading..." />)
      
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      
      rerender(<LoadingModal isOpen={true} message="Almost done..." />)
      
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      expect(screen.getByText('Almost done...')).toBeInTheDocument()
    })
  })

  describe('Interaction Blocking', () => {
    it('should prevent closing on backdrop click during loading', () => {
      render(<LoadingModal isOpen={true} message="Loading..." />)
      
      const backdrop = screen.getByRole('dialog').parentElement!
      backdrop.click()
      
      // Modal should still be visible
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should cover the entire viewport', () => {
      render(<LoadingModal isOpen={true} message="Loading..." />)
      
      const backdrop = screen.getByRole('dialog').parentElement
      expect(backdrop).toHaveClass('fixed', 'inset-0')
    })

    it('should have high z-index to appear on top', () => {
      render(<LoadingModal isOpen={true} message="Loading..." />)
      
      const backdrop = screen.getByRole('dialog').parentElement
      expect(backdrop).toHaveClass('z-50')
    })
  })
})
