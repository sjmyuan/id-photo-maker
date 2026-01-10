import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MarginSelector } from './MarginSelector'
import { type PaperMargins } from '../../types'

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('MarginSelector', () => {
  const defaultMargins: PaperMargins = {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  }

  const paperDimensions = {
    widthMm: 102,
    heightMm: 152,
  }

  describe('Rendering', () => {
    it('should render all four margin inputs', () => {
      render(
        <MarginSelector
          margins={defaultMargins}
          paperDimensions={paperDimensions}
          onMarginsChange={vi.fn()}
        />
      )

      expect(screen.getByTestId('margin-top-input')).toBeInTheDocument()
      expect(screen.getByTestId('margin-bottom-input')).toBeInTheDocument()
      expect(screen.getByTestId('margin-left-input')).toBeInTheDocument()
      expect(screen.getByTestId('margin-right-input')).toBeInTheDocument()
    })

    it('should display current margin values', () => {
      const margins: PaperMargins = { top: 5, bottom: 10, left: 3, right: 7 }
      render(
        <MarginSelector
          margins={margins}
          paperDimensions={paperDimensions}
          onMarginsChange={vi.fn()}
        />
      )

      expect(screen.getByTestId('margin-top-input')).toHaveValue(5)
      expect(screen.getByTestId('margin-bottom-input')).toHaveValue(10)
      expect(screen.getByTestId('margin-left-input')).toHaveValue(3)
      expect(screen.getByTestId('margin-right-input')).toHaveValue(7)
    })

    it('should render with custom test ID', () => {
      render(
        <MarginSelector
          margins={defaultMargins}
          paperDimensions={paperDimensions}
          onMarginsChange={vi.fn()}
          testId="custom-margin-selector"
        />
      )

      expect(screen.getByTestId('custom-margin-selector')).toBeInTheDocument()
    })
  })

  describe('Input Changes', () => {
    it('should call onMarginsChange when top margin changes', () => {
      const handleChange = vi.fn()
      render(
        <MarginSelector
          margins={defaultMargins}
          paperDimensions={paperDimensions}
          onMarginsChange={handleChange}
        />
      )

      const topInput = screen.getByTestId('margin-top-input')
      fireEvent.change(topInput, { target: { value: '5' } })

      expect(handleChange).toHaveBeenCalledWith({
        top: 5,
        bottom: 0,
        left: 0,
        right: 0,
      })
    })

    it('should call onMarginsChange when bottom margin changes', () => {
      const handleChange = vi.fn()
      render(
        <MarginSelector
          margins={defaultMargins}
          paperDimensions={paperDimensions}
          onMarginsChange={handleChange}
        />
      )

      const bottomInput = screen.getByTestId('margin-bottom-input')
      fireEvent.change(bottomInput, { target: { value: '10' } })

      expect(handleChange).toHaveBeenCalledWith({
        top: 0,
        bottom: 10,
        left: 0,
        right: 0,
      })
    })

    it('should call onMarginsChange when left margin changes', () => {
      const handleChange = vi.fn()
      render(
        <MarginSelector
          margins={defaultMargins}
          paperDimensions={paperDimensions}
          onMarginsChange={handleChange}
        />
      )

      const leftInput = screen.getByTestId('margin-left-input')
      fireEvent.change(leftInput, { target: { value: '3' } })

      expect(handleChange).toHaveBeenCalledWith({
        top: 0,
        bottom: 0,
        left: 3,
        right: 0,
      })
    })

    it('should call onMarginsChange when right margin changes', () => {
      const handleChange = vi.fn()
      render(
        <MarginSelector
          margins={defaultMargins}
          paperDimensions={paperDimensions}
          onMarginsChange={handleChange}
        />
      )

      const rightInput = screen.getByTestId('margin-right-input')
      fireEvent.change(rightInput, { target: { value: '7' } })

      expect(handleChange).toHaveBeenCalledWith({
        top: 0,
        bottom: 0,
        left: 0,
        right: 7,
      })
    })

    it('should handle empty input as 0', () => {
      const handleChange = vi.fn()
      render(
        <MarginSelector
          margins={{ top: 5, bottom: 5, left: 5, right: 5 }}
          paperDimensions={paperDimensions}
          onMarginsChange={handleChange}
        />
      )

      const topInput = screen.getByTestId('margin-top-input')
      fireEvent.change(topInput, { target: { value: '' } })

      expect(handleChange).toHaveBeenCalledWith({
        top: 0,
        bottom: 5,
        left: 5,
        right: 5,
      })
    })

    it('should handle decimal values', () => {
      const handleChange = vi.fn()
      render(
        <MarginSelector
          margins={defaultMargins}
          paperDimensions={paperDimensions}
          onMarginsChange={handleChange}
        />
      )

      const topInput = screen.getByTestId('margin-top-input')
      fireEvent.change(topInput, { target: { value: '5.5' } })

      expect(handleChange).toHaveBeenCalledWith({
        top: 5.5,
        bottom: 0,
        left: 0,
        right: 0,
      })
    })
  })

  describe('Validation', () => {
    it('should show error for negative margin', () => {
      // Test with margins already set to invalid value
      render(
        <MarginSelector
          margins={{ top: -5, bottom: 0, left: 0, right: 0 }}
          paperDimensions={paperDimensions}
          onMarginsChange={vi.fn()}
        />
      )

      // Error message should be displayed
      expect(screen.getByText(/cannot be negative/i)).toBeInTheDocument()
    })

    it('should show error for margin exceeding 50% of paper dimension', () => {
      // 152mm height, max is 76mm for top/bottom
      render(
        <MarginSelector
          margins={{ top: 80, bottom: 0, left: 0, right: 0 }}
          paperDimensions={paperDimensions}
          onMarginsChange={vi.fn()}
        />
      )

      // Error message should be displayed
      expect(screen.getByText(/cannot exceed.*76mm/i)).toBeInTheDocument()
    })

    it('should show errors for multiple invalid margins', () => {
      const handleChange = vi.fn()
      render(
        <MarginSelector
          margins={{ top: -5, bottom: 100, left: -3, right: 60 }}
          paperDimensions={paperDimensions}
          onMarginsChange={handleChange}
        />
      )

      // Should show multiple error messages
      const errors = screen.getAllByText(/cannot/i)
      expect(errors.length).toBeGreaterThan(1)
    })

    it('should accept valid margins at exactly 50%', () => {
      const handleChange = vi.fn()
      render(
        <MarginSelector
          margins={{ top: 76, bottom: 76, left: 51, right: 51 }}
          paperDimensions={paperDimensions}
          onMarginsChange={handleChange}
        />
      )

      // No error messages should be displayed
      expect(screen.queryByText(/cannot exceed/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/cannot be negative/i)).not.toBeInTheDocument()
    })
  })

  describe('Different Paper Dimensions', () => {
    it('should validate based on A4 paper dimensions', () => {
      const a4Dimensions = { widthMm: 210, heightMm: 297 }
      render(
        <MarginSelector
          margins={{ top: 150, bottom: 0, left: 0, right: 0 }}
          paperDimensions={a4Dimensions}
          onMarginsChange={vi.fn()}
        />
      )

      // Max for A4 top margin is 148.5mm
      expect(screen.getByText(/cannot exceed.*148\.5mm/i)).toBeInTheDocument()
    })
  })

  describe('Info Icon and Description', () => {
    it('should hide description by default', () => {
      render(
        <MarginSelector
          margins={defaultMargins}
          paperDimensions={paperDimensions}
          onMarginsChange={vi.fn()}
        />
      )

      expect(screen.queryByTestId('margin-description')).not.toBeInTheDocument()
    })

    it('should show description when info icon is clicked', () => {
      render(
        <MarginSelector
          margins={defaultMargins}
          paperDimensions={paperDimensions}
          onMarginsChange={vi.fn()}
        />
      )

      const infoIcon = screen.getByTestId('margin-info-icon')
      fireEvent.click(infoIcon)

      expect(screen.getByTestId('margin-description')).toBeInTheDocument()
      expect(screen.getByText('margins.description')).toBeInTheDocument()
    })

    it('should toggle description visibility when info icon is clicked multiple times', () => {
      render(
        <MarginSelector
          margins={defaultMargins}
          paperDimensions={paperDimensions}
          onMarginsChange={vi.fn()}
        />
      )

      const infoIcon = screen.getByTestId('margin-info-icon')

      // Click to show
      fireEvent.click(infoIcon)
      expect(screen.getByTestId('margin-description')).toBeInTheDocument()

      // Click to hide
      fireEvent.click(infoIcon)
      expect(screen.queryByTestId('margin-description')).not.toBeInTheDocument()

      // Click to show again
      fireEvent.click(infoIcon)
      expect(screen.getByTestId('margin-description')).toBeInTheDocument()
    })
  })
})
