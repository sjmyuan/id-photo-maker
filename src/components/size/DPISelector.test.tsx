import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DPISelector } from './DPISelector'

describe('DPISelector', () => {
  it('renders DPI options', () => {
    const onDPIChange = vi.fn()
    render(<DPISelector requiredDPI={300} onDPIChange={onDPIChange} />)
    
    expect(screen.getByText('DPI')).toBeInTheDocument()
    expect(screen.getByText('300 DPI')).toBeInTheDocument()
    expect(screen.getByText('For print')).toBeInTheDocument()
    expect(screen.getByText('None')).toBeInTheDocument()
    expect(screen.getByText('No requirement')).toBeInTheDocument()
  })

  it('highlights 300 DPI when selected', () => {
    const onDPIChange = vi.fn()
    render(<DPISelector requiredDPI={300} onDPIChange={onDPIChange} />)
    
    const button = screen.getByText('300 DPI').closest('button')
    expect(button).toHaveClass('border-blue-600')
    expect(button).toHaveClass('bg-blue-50')
  })

  it('highlights None when selected', () => {
    const onDPIChange = vi.fn()
    render(<DPISelector requiredDPI={null} onDPIChange={onDPIChange} />)
    
    const button = screen.getByText('None').closest('button')
    expect(button).toHaveClass('border-blue-600')
    expect(button).toHaveClass('bg-blue-50')
  })

  it('calls onDPIChange with 300 when 300 DPI is clicked', async () => {
    const user = userEvent.setup()
    const onDPIChange = vi.fn()
    render(<DPISelector requiredDPI={null} onDPIChange={onDPIChange} />)
    
    const button = screen.getByText('300 DPI').closest('button')
    await user.click(button!)
    
    expect(onDPIChange).toHaveBeenCalledWith(300)
  })

  it('calls onDPIChange with null when None is clicked', async () => {
    const user = userEvent.setup()
    const onDPIChange = vi.fn()
    render(<DPISelector requiredDPI={300} onDPIChange={onDPIChange} />)
    
    const button = screen.getByText('None').closest('button')
    await user.click(button!)
    
    expect(onDPIChange).toHaveBeenCalledWith(null)
  })

  it('renders with custom testId', () => {
    const onDPIChange = vi.fn()
    render(<DPISelector requiredDPI={300} onDPIChange={onDPIChange} testId="custom-dpi-test" />)
    
    expect(screen.getByTestId('custom-dpi-test')).toBeInTheDocument()
  })
})
