import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PaperTypeSelector } from './PaperTypeSelector'

describe('PaperTypeSelector', () => {
  it('renders paper type options', () => {
    const onPaperTypeChange = vi.fn()
    render(<PaperTypeSelector paperType="6-inch" onPaperTypeChange={onPaperTypeChange} />)
    
    expect(screen.getByText('Paper Type')).toBeInTheDocument()
    expect(screen.getByText('6-inch')).toBeInTheDocument()
    expect(screen.getByText('102×152 mm')).toBeInTheDocument()
    expect(screen.getByText('A4')).toBeInTheDocument()
    expect(screen.getByText('210×297 mm')).toBeInTheDocument()
  })

  it('highlights 6-inch when selected', () => {
    const onPaperTypeChange = vi.fn()
    render(<PaperTypeSelector paperType="6-inch" onPaperTypeChange={onPaperTypeChange} />)
    
    const button = screen.getByTestId('paper-6-inch-button')
    expect(button).toHaveClass('border-blue-600')
    expect(button).toHaveClass('bg-blue-50')
  })

  it('highlights A4 when selected', () => {
    const onPaperTypeChange = vi.fn()
    render(<PaperTypeSelector paperType="a4" onPaperTypeChange={onPaperTypeChange} />)
    
    const button = screen.getByTestId('paper-a4-button')
    expect(button).toHaveClass('border-blue-600')
    expect(button).toHaveClass('bg-blue-50')
  })

  it('calls onPaperTypeChange with 6-inch when clicked', async () => {
    const user = userEvent.setup()
    const onPaperTypeChange = vi.fn()
    render(<PaperTypeSelector paperType="a4" onPaperTypeChange={onPaperTypeChange} />)
    
    const button = screen.getByTestId('paper-6-inch-button')
    await user.click(button)
    
    expect(onPaperTypeChange).toHaveBeenCalledWith('6-inch')
  })

  it('calls onPaperTypeChange with a4 when clicked', async () => {
    const user = userEvent.setup()
    const onPaperTypeChange = vi.fn()
    render(<PaperTypeSelector paperType="6-inch" onPaperTypeChange={onPaperTypeChange} />)
    
    const button = screen.getByTestId('paper-a4-button')
    await user.click(button)
    
    expect(onPaperTypeChange).toHaveBeenCalledWith('a4')
  })

  it('renders with custom testId', () => {
    const onPaperTypeChange = vi.fn()
    render(<PaperTypeSelector paperType="6-inch" onPaperTypeChange={onPaperTypeChange} testId="custom-paper-test" />)
    
    expect(screen.getByTestId('custom-paper-test')).toBeInTheDocument()
  })
})
