import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ColorSelector } from './ColorSelector'
import { PRESET_COLORS } from '../../constants/colors'

describe('ColorSelector', () => {
  it('renders all preset colors', () => {
    const onColorChange = vi.fn()
    render(<ColorSelector backgroundColor="#FFFFFF" onColorChange={onColorChange} />)
    
    expect(screen.getByText('Background')).toBeInTheDocument()
    PRESET_COLORS.forEach((color) => {
      expect(screen.getByText(color.name)).toBeInTheDocument()
    })
  })

  it('highlights the selected color', () => {
    const onColorChange = vi.fn()
    render(<ColorSelector backgroundColor="#FF0000" onColorChange={onColorChange} />)
    
    const button = screen.getByTestId('color-red')
    expect(button).toHaveClass('border-blue-600')
    expect(button).toHaveClass('ring-4')
  })

  it('calls onColorChange when a color is clicked', async () => {
    const user = userEvent.setup()
    const onColorChange = vi.fn()
    render(<ColorSelector backgroundColor="#FFFFFF" onColorChange={onColorChange} />)
    
    const blueButton = screen.getByTestId('color-blue')
    await user.click(blueButton)
    
    expect(onColorChange).toHaveBeenCalledWith('#0000FF')
  })

  it('renders with custom testId', () => {
    const onColorChange = vi.fn()
    render(<ColorSelector backgroundColor="#FFFFFF" onColorChange={onColorChange} testId="custom-color-test" />)
    
    expect(screen.getByTestId('custom-color-test')).toBeInTheDocument()
  })

  it('displays color swatches with correct background colors', () => {
    const onColorChange = vi.fn()
    render(<ColorSelector backgroundColor="#FFFFFF" onColorChange={onColorChange} />)
    
    const redButton = screen.getByTestId('color-red')
    const colorSwatch = redButton.querySelector('div[class*="w-6 h-6"]')
    expect(colorSwatch).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' })
  })

  it('renders colors in a 3-column grid', () => {
    const onColorChange = vi.fn()
    const { container } = render(<ColorSelector backgroundColor="#FFFFFF" onColorChange={onColorChange} />)
    
    const grid = container.querySelector('.grid-cols-3')
    expect(grid).toBeInTheDocument()
  })
})
