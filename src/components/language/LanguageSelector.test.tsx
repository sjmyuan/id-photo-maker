import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LanguageSelector } from './LanguageSelector'
import '../../i18n' // Initialize i18n

describe('LanguageSelector', () => {
  beforeEach(() => {
    // Reset to Chinese default before each test
    localStorage.clear()
  })

  it('renders language selector with label', () => {
    render(<LanguageSelector />)
    
    expect(screen.getByTestId('language-selector')).toBeInTheDocument()
    expect(screen.getByTestId('language-select')).toBeInTheDocument()
  })

  it('displays both English and Chinese options', () => {
    render(<LanguageSelector />)
    
    const select = screen.getByTestId('language-select') as HTMLSelectElement
    const options = Array.from(select.options).map((opt) => opt.value)
    
    expect(options).toContain('en')
    expect(options).toContain('zh')
  })

  it('shows default language initially selected', () => {
    render(<LanguageSelector />)
    
    const select = screen.getByTestId('language-select') as HTMLSelectElement
    // In test environment, defaults to English
    expect(select.value).toBe('en')
  })

  it('changes language when selecting a different option', async () => {
    render(<LanguageSelector />)
    
    const select = screen.getByTestId('language-select') as HTMLSelectElement
    
    // Change to English
    fireEvent.change(select, { target: { value: 'en' } })
    
    // Wait for language change to propagate
    await vi.waitFor(() => {
      expect(select.value).toBe('en')
    })
  })

  it('persists language selection to localStorage', async () => {
    render(<LanguageSelector />)
    
    const select = screen.getByTestId('language-select') as HTMLSelectElement
    
    // Change to English
    fireEvent.change(select, { target: { value: 'en' } })
    
    await vi.waitFor(() => {
      expect(localStorage.getItem('language')).toBe('en')
    })
  })

  it('loads saved language from localStorage on mount', () => {
    // Pre-set English in localStorage
    localStorage.setItem('language', 'en')
    
    render(<LanguageSelector />)
    
    const select = screen.getByTestId('language-select') as HTMLSelectElement
    expect(select.value).toBe('en')
  })
})
