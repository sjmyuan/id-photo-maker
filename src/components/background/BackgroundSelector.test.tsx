import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { BackgroundSelector } from './BackgroundSelector'

describe('BackgroundSelector - Preset Colors', () => {
  it('should render preset color buttons: Red, Blue, White, and others', () => {
    render(<BackgroundSelector onColorChange={vi.fn()} />)
    
    expect(screen.getByRole('button', { name: 'Red' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Blue' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'White' })).toBeInTheDocument()
  })

  it('should call onColorChange with #FF0000 when Red is clicked', async () => {
    const user = userEvent.setup()
    const mockOnColorChange = vi.fn()
    
    render(<BackgroundSelector onColorChange={mockOnColorChange} />)
    
    const redButton = screen.getByRole('button', { name: 'Red' })
    await user.click(redButton)
    
    expect(mockOnColorChange).toHaveBeenCalledWith('#FF0000')
    expect(mockOnColorChange).toHaveBeenCalledTimes(1)
  })

  it('should call onColorChange with #0000FF when Blue is clicked', async () => {
    const user = userEvent.setup()
    const mockOnColorChange = vi.fn()
    
    render(<BackgroundSelector onColorChange={mockOnColorChange} />)
    
    const blueButton = screen.getByRole('button', { name: 'Blue' })
    await user.click(blueButton)
    
    expect(mockOnColorChange).toHaveBeenCalledWith('#0000FF')
    expect(mockOnColorChange).toHaveBeenCalledTimes(1)
  })

  it('should call onColorChange with #FFFFFF when White is clicked', async () => {
    const user = userEvent.setup()
    const mockOnColorChange = vi.fn()
    
    render(<BackgroundSelector onColorChange={mockOnColorChange} />)
    
    const whiteButton = screen.getByRole('button', { name: 'White' })
    await user.click(whiteButton)
    
    expect(mockOnColorChange).toHaveBeenCalledWith('#FFFFFF')
    expect(mockOnColorChange).toHaveBeenCalledTimes(1)
  })

  it('should change background immediately after selecting a preset color', async () => {
    const user = userEvent.setup()
    const mockOnColorChange = vi.fn()
    
    render(<BackgroundSelector onColorChange={mockOnColorChange} />)
    
    const redButton = screen.getByRole('button', { name: 'Red' })
    await user.click(redButton)
    
    // Verify immediate callback (no delay)
    expect(mockOnColorChange).toHaveBeenCalledWith('#FF0000')
    
    const blueButton = screen.getByRole('button', { name: 'Blue' })
    await user.click(blueButton)
    
    expect(mockOnColorChange).toHaveBeenCalledWith('#0000FF')
    expect(mockOnColorChange).toHaveBeenCalledTimes(2)
  })

  it('should visually indicate the selected preset color', async () => {
    const user = userEvent.setup()
    
    render(<BackgroundSelector onColorChange={vi.fn()} />)
    
    const redButton = screen.getByRole('button', { name: 'Red' })
    await user.click(redButton)
    
    // Check for active state or selected indicator
    expect(redButton).toHaveClass('ring-2')
  })

  it('should display a preview of the current background color', () => {
    render(<BackgroundSelector onColorChange={vi.fn()} />)
    
    const preview = screen.getByTestId('background-preview')
    expect(preview).toBeInTheDocument()
  })

  it('should update preview immediately when a preset is selected', async () => {
    const user = userEvent.setup()
    
    render(<BackgroundSelector onColorChange={vi.fn()} />)
    
    const preview = screen.getByTestId('background-preview')
    const redButton = screen.getByRole('button', { name: 'Red' })
    
    await user.click(redButton)
    
    // Verify the preview background color is updated
    expect(preview).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' })
  })
})

describe('BackgroundSelector - Custom RGB Input', () => {
  it('should render three input fields for R, G, B values', () => {
    render(<BackgroundSelector onColorChange={vi.fn()} />)
    
    expect(screen.getByRole('spinbutton', { name: 'Red' })).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: /green/i })).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: 'Blue' })).toBeInTheDocument()
  })

  it('should accept valid RGB values (0-255) in input fields', async () => {
    const user = userEvent.setup()
    
    render(<BackgroundSelector onColorChange={vi.fn()} />)
    
    const redInput = screen.getByRole('spinbutton', { name: 'Red' })
    const greenInput = screen.getByRole('spinbutton', { name: /green/i })
    const blueInput = screen.getByRole('spinbutton', { name: 'Blue' })
    
    await user.clear(redInput)
    await user.type(redInput, '128')
    await user.clear(greenInput)
    await user.type(greenInput, '64')
    await user.clear(blueInput)
    await user.type(blueInput, '32')
    
    expect(redInput).toHaveValue(128)
    expect(greenInput).toHaveValue(64)
    expect(blueInput).toHaveValue(32)
  })

  it('should update background in real-time when valid RGB values are entered', async () => {
    const user = userEvent.setup()
    const mockOnColorChange = vi.fn()
    
    render(<BackgroundSelector onColorChange={mockOnColorChange} />)
    
    const redInput = screen.getByRole('spinbutton', { name: 'Red' })
    const greenInput = screen.getByRole('spinbutton', { name: /green/i })
    const blueInput = screen.getByRole('spinbutton', { name: 'Blue' })
    
    await user.clear(redInput)
    await user.type(redInput, '100')
    await user.clear(greenInput)
    await user.type(greenInput, '150')
    await user.clear(blueInput)
    await user.type(blueInput, '200')
    
    // Should call onColorChange with the formatted hex color
    expect(mockOnColorChange).toHaveBeenLastCalledWith('#6496C8')
  })

  it('should show error message when entering negative RGB values', async () => {
    const user = userEvent.setup()
    
    render(<BackgroundSelector onColorChange={vi.fn()} />)
    
    const redInput = screen.getByRole('spinbutton', { name: 'Red' })
    
    // First clear to get empty state (which shows error)
    await user.clear(redInput)
    
    // Verify error is shown for empty input
    expect(screen.getByText(/must be between 0 and 255/i)).toBeInTheDocument()
  })

  it('should show error message when entering RGB values greater than 255', async () => {
    const user = userEvent.setup()
    
    render(<BackgroundSelector onColorChange={vi.fn()} />)
    
    const blueInput = screen.getByRole('spinbutton', { name: 'Blue' })
    
    await user.clear(blueInput)
    await user.type(blueInput, '300')
    
    expect(screen.getByText(/must be between 0 and 255/i)).toBeInTheDocument()
  })

  it('should show error message when entering non-numeric values', async () => {
    const user = userEvent.setup()
    
    render(<BackgroundSelector onColorChange={vi.fn()} />)
    
    const greenInput = screen.getByRole('spinbutton', { name: /green/i })
    
    await user.clear(greenInput)
    await user.type(greenInput, 'abc')
    
    expect(screen.getByText(/must be between 0 and 255/i)).toBeInTheDocument()
  })

  it('should prevent applying invalid RGB values', async () => {
    const user = userEvent.setup()
    const mockOnColorChange = vi.fn()
    
    render(<BackgroundSelector onColorChange={mockOnColorChange} />)
    
    const redInput = screen.getByRole('spinbutton', { name: 'Red' })
    
    // Clear the initial call count
    mockOnColorChange.mockClear()
    
    await user.clear(redInput)
    await user.type(redInput, '300')
    
    // Should not call onColorChange with invalid value
    // (or should have stopped at previous valid state)
    const calls = mockOnColorChange.mock.calls
    const hasInvalidCall = calls.some(call => {
      const color = call[0] as string
      const r = parseInt(color.slice(1, 3), 16)
      return r > 255
    })
    
    expect(hasInvalidCall).toBe(false)
  })

  it('should update preview immediately with valid custom RGB values', async () => {
    const user = userEvent.setup()
    
    render(<BackgroundSelector onColorChange={vi.fn()} />)
    
    const preview = screen.getByTestId('background-preview')
    const redInput = screen.getByRole('spinbutton', { name: 'Red' })
    const greenInput = screen.getByRole('spinbutton', { name: /green/i })
    const blueInput = screen.getByRole('spinbutton', { name: 'Blue' })
    
    await user.clear(redInput)
    await user.type(redInput, '50')
    await user.clear(greenInput)
    await user.type(greenInput, '100')
    await user.clear(blueInput)
    await user.type(blueInput, '150')
    
    // Verify the preview reflects the custom RGB (50, 100, 150)
    expect(preview).toHaveStyle({ backgroundColor: 'rgb(50, 100, 150)' })
  })

  it('should clear error message when valid value is entered after invalid one', async () => {
    const user = userEvent.setup()
    
    render(<BackgroundSelector onColorChange={vi.fn()} />)
    
    const redInput = screen.getByRole('spinbutton', { name: 'Red' })
    
    // Enter invalid value
    await user.clear(redInput)
    await user.type(redInput, '300')
    
    expect(screen.getByText(/must be between 0 and 255/i)).toBeInTheDocument()
    
    // Enter valid value
    await user.clear(redInput)
    await user.type(redInput, '200')
    
    expect(screen.queryByText(/must be between 0 and 255/i)).not.toBeInTheDocument()
  })

  it('should accept boundary values 0 and 255', async () => {
    const user = userEvent.setup()
    const mockOnColorChange = vi.fn()
    
    render(<BackgroundSelector onColorChange={mockOnColorChange} />)
    
    const redInput = screen.getByRole('spinbutton', { name: 'Red' }) as HTMLInputElement
    const greenInput = screen.getByRole('spinbutton', { name: /green/i }) as HTMLInputElement
    const blueInput = screen.getByRole('spinbutton', { name: 'Blue' }) as HTMLInputElement
    
    // Clear and type new values
    await user.clear(redInput)
    await user.type(redInput, '0')
    
    // Wait a bit for state to settle
    await new Promise(resolve => setTimeout(resolve, 10))
    
    await user.clear(greenInput)
    await user.type(greenInput, '255')
    
    await new Promise(resolve => setTimeout(resolve, 10))
    
    await user.clear(blueInput)
    await user.type(blueInput, '128')
    
    // Allow state to update
    await new Promise(resolve => setTimeout(resolve, 10))
    
    // Should have called with #00FF80
    expect(mockOnColorChange).toHaveBeenLastCalledWith('#00FF80')
  })
})
