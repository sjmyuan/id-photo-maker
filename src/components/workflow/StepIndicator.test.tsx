import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StepIndicator } from './StepIndicator'

describe('StepIndicator', () => {
  it('should render 3 steps', () => {
    render(<StepIndicator currentStep={1} />)
    
    // Should render 3 step indicators
    const steps = screen.getAllByTestId(/^step-\d+$/)
    expect(steps).toHaveLength(3)
  })

  it('should highlight the active step (step 1)', () => {
    render(<StepIndicator currentStep={1} />)
    
    const step1 = screen.getByTestId('step-1')
    const step2 = screen.getByTestId('step-2')
    const step3 = screen.getByTestId('step-3')
    
    // Step 1 should be active (highlighted)
    expect(step1).toHaveClass('bg-blue-600')
    
    // Steps 2 and 3 should not be active
    expect(step2).not.toHaveClass('bg-blue-600')
    expect(step3).not.toHaveClass('bg-blue-600')
  })

  it('should highlight the active step (step 2)', () => {
    render(<StepIndicator currentStep={2} />)
    
    const step1 = screen.getByTestId('step-1')
    const step2 = screen.getByTestId('step-2')
    const step3 = screen.getByTestId('step-3')
    
    // Step 2 should be active (highlighted)
    expect(step2).toHaveClass('bg-blue-600')
    
    // Steps 1 and 3 should not be active
    expect(step1).not.toHaveClass('bg-blue-600')
    expect(step3).not.toHaveClass('bg-blue-600')
  })

  it('should highlight the active step (step 3)', () => {
    render(<StepIndicator currentStep={3} />)
    
    const step1 = screen.getByTestId('step-1')
    const step2 = screen.getByTestId('step-2')
    const step3 = screen.getByTestId('step-3')
    
    // Step 3 should be active (highlighted)
    expect(step3).toHaveClass('bg-blue-600')
    
    // Steps 1 and 2 should not be active
    expect(step1).not.toHaveClass('bg-blue-600')
    expect(step2).not.toHaveClass('bg-blue-600')
  })

  it('should show completed steps with different styling', () => {
    render(<StepIndicator currentStep={3} />)
    
    const step1 = screen.getByTestId('step-1')
    const step2 = screen.getByTestId('step-2')
    
    // Steps 1 and 2 should be marked as completed (use green color)
    expect(step1).toHaveClass('bg-green-500')
    expect(step2).toHaveClass('bg-green-500')
  })

  it('should show upcoming steps with inactive styling', () => {
    render(<StepIndicator currentStep={1} />)
    
    const step2 = screen.getByTestId('step-2')
    const step3 = screen.getByTestId('step-3')
    
    // Steps 2 and 3 should be inactive (gray)
    expect(step2).toHaveClass('bg-white')
    expect(step3).toHaveClass('bg-white')
  })

  it('should display step labels', () => {
    render(<StepIndicator currentStep={1} />)
    
    // Should show step labels
    expect(screen.getByText('Settings & Upload')).toBeInTheDocument()
    expect(screen.getByText('ID Photo Preview')).toBeInTheDocument()
    expect(screen.getByText('Print Layout')).toBeInTheDocument()
  })

  it('should highlight the current step label', () => {
    render(<StepIndicator currentStep={2} />)
    
    const label1 = screen.getByText('Settings & Upload')
    const label2 = screen.getByText('ID Photo Preview')
    const label3 = screen.getByText('Print Layout')
    
    // Current step label should be bold
    expect(label2).toHaveClass('font-bold')
    
    // Other labels should not be bold
    expect(label1).not.toHaveClass('font-semibold')
    expect(label3).not.toHaveClass('font-semibold')
  })
})
