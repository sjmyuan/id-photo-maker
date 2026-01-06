import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNotificationState } from './useNotificationState'

describe('useNotificationState', () => {
  it('should initialize with empty errors and warnings', () => {
    const { result } = renderHook(() => useNotificationState())

    expect(result.current.errors).toEqual([])
    expect(result.current.warnings).toEqual([])
  })

  it('should set errors', () => {
    const { result } = renderHook(() => useNotificationState())

    act(() => {
      result.current.setErrors(['Error 1', 'Error 2'])
    })

    expect(result.current.errors).toEqual(['Error 1', 'Error 2'])
  })

  it('should set warnings', () => {
    const { result } = renderHook(() => useNotificationState())

    act(() => {
      result.current.setWarnings(['Warning 1', 'Warning 2'])
    })

    expect(result.current.warnings).toEqual(['Warning 1', 'Warning 2'])
  })

  it('should add error', () => {
    const { result } = renderHook(() => useNotificationState())

    act(() => {
      result.current.addError('Error 1')
      result.current.addError('Error 2')
    })

    expect(result.current.errors).toEqual(['Error 1', 'Error 2'])
  })

  it('should add warning', () => {
    const { result } = renderHook(() => useNotificationState())

    act(() => {
      result.current.addWarning('Warning 1')
      result.current.addWarning('Warning 2')
    })

    expect(result.current.warnings).toEqual(['Warning 1', 'Warning 2'])
  })

  it('should clear all notifications', () => {
    const { result } = renderHook(() => useNotificationState())

    act(() => {
      result.current.setErrors(['Error 1'])
      result.current.setWarnings(['Warning 1'])
    })

    expect(result.current.errors).toHaveLength(1)
    expect(result.current.warnings).toHaveLength(1)

    act(() => {
      result.current.clearNotifications()
    })

    expect(result.current.errors).toEqual([])
    expect(result.current.warnings).toEqual([])
  })

  it('should clear only errors', () => {
    const { result } = renderHook(() => useNotificationState())

    act(() => {
      result.current.setErrors(['Error 1'])
      result.current.setWarnings(['Warning 1'])
    })

    act(() => {
      result.current.clearErrors()
    })

    expect(result.current.errors).toEqual([])
    expect(result.current.warnings).toEqual(['Warning 1'])
  })

  it('should clear only warnings', () => {
    const { result } = renderHook(() => useNotificationState())

    act(() => {
      result.current.setErrors(['Error 1'])
      result.current.setWarnings(['Warning 1'])
    })

    act(() => {
      result.current.clearWarnings()
    })

    expect(result.current.errors).toEqual(['Error 1'])
    expect(result.current.warnings).toEqual([])
  })
})
