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
    expect(screen.getByText('Small 1 Inch')).toBeInTheDocument()
    expect(screen.getByText('1 Inch')).toBeInTheDocument()
    expect(screen.getByText('Large 1 Inch')).toBeInTheDocument()
    expect(screen.getByText('Small 2 Inch')).toBeInTheDocument()
    expect(screen.getByText('2 Inch')).toBeInTheDocument()
    expect(screen.getByText('3 Inch')).toBeInTheDocument()
    expect(screen.getByText('China ID Card')).toBeInTheDocument()
  })

  it('highlights the selected size', () => {
    const onSizeChange = vi.fn()
    render(<SizeSelector selectedSize={SIZE_OPTIONS[1]} onSizeChange={onSizeChange} />)
    
    const button = screen.getByText('1 Inch').closest('button')
    expect(button).toHaveClass('border-blue-600')
    expect(button).toHaveClass('bg-blue-50')
  })

  it('calls onSizeChange when a size is clicked', async () => {
    const user = userEvent.setup()
    const onSizeChange = vi.fn()
    render(<SizeSelector selectedSize={SIZE_OPTIONS[0]} onSizeChange={onSizeChange} />)
    
    const button = screen.getByText('Large 1 Inch').closest('button')
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
    
    expect(screen.getByText('22×32mm')).toBeInTheDocument()
    expect(screen.getByText('25×35mm')).toBeInTheDocument()
    expect(screen.getByText('33×48mm')).toBeInTheDocument()
    expect(screen.getByText('35×45mm')).toBeInTheDocument()
    expect(screen.getByText('35×53mm')).toBeInTheDocument()
    expect(screen.getByText('35×52mm')).toBeInTheDocument()
    expect(screen.getByText('26×32mm')).toBeInTheDocument()
  })

  it('renders size options in a grid layout with multiple columns', () => {
    const onSizeChange = vi.fn()
    const { container } = render(<SizeSelector selectedSize={SIZE_OPTIONS[0]} onSizeChange={onSizeChange} />)
    
    // Find the container with grid classes
    const gridContainer = container.querySelector('.grid')
    expect(gridContainer).toBeInTheDocument()
    expect(gridContainer).toHaveClass('grid-cols-2')
  })
})
