import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the app title', () => {
    render(<App />)
    expect(screen.getByText('ID Photo Maker')).toBeInTheDocument()
  })

  it('renders the app description', () => {
    render(<App />)
    expect(screen.getByText('Privacy-first ID photo generator')).toBeInTheDocument()
  })
})
