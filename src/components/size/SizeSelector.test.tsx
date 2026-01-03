import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SizeSelector } from './SizeSelector'
import { SIZE_OPTIONS } from './CropEditor'

describe('SizeSelector', () => {
  it('renders all size options', () => {
    const onSizeChange = vi.fn()
    render(<SizeSelector selectedSize={SIZE_OPTIONS[0]} onSizeChange={onSizeChange} />)
    
    expect(screen.getByText('Photo Size')).toBeInTheDocument()
    expect(screen.getByText('1 Inch')).toBeInTheDocument()
    expect(screen.getByText('2 Inch')).toBeInTheDocument()
    expect(screen.getByText('3 Inch')).toBeInTheDocument()
  })

  it('highlights the selected size', () => {
    const onSizeChange = vi.fn()
    render(<SizeSelector selectedSize={SIZE_OPTIONS[1]} onSizeChange={onSizeChange} />)
    
    const button = screen.getByText('2 Inch').closest('button')
    expect(button).toHaveClass('border-blue-600')
    expect(button).toHaveClass('bg-blue-50')
  })

  it('calls onSizeChange when a size is clicked', async () => {
    const user = userEvent.setup()
    const onSizeChange = vi.fn()
    render(<SizeSelector selectedSize={SIZE_OPTIONS[0]} onSizeChange={onSizeChange} />)
    
    const button = screen.getByText('3 Inch').closest('button')
    await user.click(button!)
    
    expect(onSizeChange).toHaveBeenCalledWith(SIZE_OPTIONS[2])
  })

  it('renders with custom testId', () => {
    const onSizeChange = vi.fn()
    render(<SizeSelector selectedSize={SIZE_OPTIONS[0]} onSizeChange={onSizeChange} testId="custom-test-id" />)
    
    expect(screen.getByTestId('custom-test-id')).toBeInTheDocument()
  })

  it('displays dimensions for each size', () => {
    const onSizeChange = vi.fn()
    render(<SizeSelector selectedSize={SIZE_OPTIONS[0]} onSizeChange={onSizeChange} />)
    
    expect(screen.getByText('25×35mm')).toBeInTheDocument()
    expect(screen.getByText('35×49mm')).toBeInTheDocument()
    expect(screen.getByText('35×52mm')).toBeInTheDocument()
  })
})
