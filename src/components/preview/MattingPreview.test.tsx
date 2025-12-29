import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MattingPreview } from './MattingPreview'

describe('MattingPreview', () => {
  const mockOriginalImage = 'data:image/png;base64,original'
  const mockProcessedImage = 'data:image/png;base64,processed'

  describe('Side-by-side image display', () => {
    it('should render both original and processed images', () => {
      render(
        <MattingPreview
          originalImage={mockOriginalImage}
          processedImage={mockProcessedImage}
          onReprocess={vi.fn()}
          onContinue={vi.fn()}
        />
      )

      const images = screen.getAllByRole('img')
      expect(images).toHaveLength(2)
      
      const originalImg = screen.getByTestId('original-image')
      const processedImg = screen.getByTestId('processed-image')
      
      expect(originalImg).toHaveAttribute('src', mockOriginalImage)
      expect(processedImg).toHaveAttribute('src', mockProcessedImage)
    })

    it('should display labels for original and processed images', () => {
      render(
        <MattingPreview
          originalImage={mockOriginalImage}
          processedImage={mockProcessedImage}
          onReprocess={vi.fn()}
          onContinue={vi.fn()}
        />
      )

      expect(screen.getByText('Original')).toBeInTheDocument()
      expect(screen.getByText('Processed')).toBeInTheDocument()
    })

    it('should have alt text for accessibility', () => {
      render(
        <MattingPreview
          originalImage={mockOriginalImage}
          processedImage={mockProcessedImage}
          onReprocess={vi.fn()}
          onContinue={vi.fn()}
        />
      )

      expect(screen.getByAltText('Original image')).toBeInTheDocument()
      expect(screen.getByAltText('Processed image with background removed')).toBeInTheDocument()
    })
  })

  describe('Reprocess button', () => {
    it('should render reprocess button', () => {
      render(
        <MattingPreview
          originalImage={mockOriginalImage}
          processedImage={mockProcessedImage}
          onReprocess={vi.fn()}
          onContinue={vi.fn()}
        />
      )

      const reprocessButton = screen.getByRole('button', { name: /reprocess/i })
      expect(reprocessButton).toBeInTheDocument()
    })

    it('should call onReprocess when reprocess button is clicked', () => {
      const onReprocess = vi.fn()
      render(
        <MattingPreview
          originalImage={mockOriginalImage}
          processedImage={mockProcessedImage}
          onReprocess={onReprocess}
          onContinue={vi.fn()}
        />
      )

      const reprocessButton = screen.getByRole('button', { name: /reprocess/i })
      reprocessButton.click()

      expect(onReprocess).toHaveBeenCalledTimes(1)
    })
  })

  describe('Continue button', () => {
    it('should render continue button', () => {
      render(
        <MattingPreview
          originalImage={mockOriginalImage}
          processedImage={mockProcessedImage}
          onReprocess={vi.fn()}
          onContinue={vi.fn()}
        />
      )

      const continueButton = screen.getByRole('button', { name: /continue/i })
      expect(continueButton).toBeInTheDocument()
    })

    it('should call onContinue when continue button is clicked', () => {
      const onContinue = vi.fn()
      render(
        <MattingPreview
          originalImage={mockOriginalImage}
          processedImage={mockProcessedImage}
          onReprocess={vi.fn()}
          onContinue={onContinue}
        />
      )

      const continueButton = screen.getByRole('button', { name: /continue/i })
      continueButton.click()

      expect(onContinue).toHaveBeenCalledTimes(1)
    })
  })
})
