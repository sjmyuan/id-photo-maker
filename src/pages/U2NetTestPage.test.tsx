import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { U2NetTestPage } from './U2NetTestPage'

// Mock the u2netService
vi.mock('../services/u2netService', () => ({
  loadU2NetModel: vi.fn().mockResolvedValue({ status: 'loaded' }),
  processImageWithU2Net: vi.fn().mockResolvedValue(new Blob(['processed'], { type: 'image/png' })),
}))

describe('U2NetTestPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
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

  describe('Model Selection State', () => {
    it('defaults to u2netp model when no localStorage value exists', () => {
      render(<U2NetTestPage />)
      const u2netpRadio = screen.getByRole('radio', { name: /u2net-p \(lite\)/i })
      expect(u2netpRadio).toBeChecked()
    })

    it('loads model selection from localStorage on mount', () => {
      localStorage.setItem('u2net-model-selection', 'u2net')
      render(<U2NetTestPage />)
      const u2netRadio = screen.getByRole('radio', { name: /u2net \(full\)/i })
      expect(u2netRadio).toBeChecked()
    })

    it('saves model selection to localStorage when changed', async () => {
      const user = userEvent.setup()
      render(<U2NetTestPage />)
      
      const u2netRadio = screen.getByRole('radio', { name: /u2net \(full\)/i })
      await user.click(u2netRadio)
      
      await waitFor(() => {
        expect(localStorage.getItem('u2net-model-selection')).toBe('u2net')
      })
    })

    it('updates selected model when radio button is clicked', async () => {
      const user = userEvent.setup()
      render(<U2NetTestPage />)
      
      const u2netRadio = screen.getByRole('radio', { name: /u2net \(full\)/i })
      await user.click(u2netRadio)
      
      await waitFor(() => {
        expect(u2netRadio).toBeChecked()
      })
    })

    it('switches back to u2netp when u2netp radio is clicked', async () => {
      const user = userEvent.setup()
      localStorage.setItem('u2net-model-selection', 'u2net')
      render(<U2NetTestPage />)
      
      const u2netpRadio = screen.getByRole('radio', { name: /u2net-p \(lite\)/i })
      await user.click(u2netpRadio)
      
      await waitFor(() => {
        expect(localStorage.getItem('u2net-model-selection')).toBe('u2netp')
      })
      expect(u2netpRadio).toBeChecked()
    })
  })
})
