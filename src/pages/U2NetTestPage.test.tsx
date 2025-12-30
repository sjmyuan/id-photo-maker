import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { U2NetTestPage } from './U2NetTestPage'

// Mock the u2netService
vi.mock('../services/u2netService', () => ({
  loadU2NetModel: vi.fn().mockResolvedValue({ status: 'loaded' }),
  processImageWithU2Net: vi.fn().mockResolvedValue(new Blob(['processed'], { type: 'image/png' })),
}))

describe('U2NetTestPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the test page title', () => {
    render(<U2NetTestPage />)
    expect(screen.getByText('U2Net ONNX Model Test')).toBeInTheDocument()
  })

  it('shows model loading status', () => {
    render(<U2NetTestPage />)
    expect(screen.getByText(/loading model/i)).toBeInTheDocument()
  })

  it('shows file input for image upload after model loads', async () => {
    render(<U2NetTestPage />)
    const fileInput = await screen.findByTestId('u2net-image-input')
    expect(fileInput).toBeInTheDocument()
  })
})
