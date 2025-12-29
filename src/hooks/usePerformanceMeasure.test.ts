import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePerformanceMeasure } from './usePerformanceMeasure'

describe('usePerformanceMeasure', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with null elapsed time and not measuring', () => {
    const { result } = renderHook(() => usePerformanceMeasure())

    expect(result.current.elapsedTime).toBeNull()
    expect(result.current.isMeasuring).toBe(false)
  })

  it('should start measuring and set isMeasuring to true', () => {
    const { result } = renderHook(() => usePerformanceMeasure())

    act(() => {
      result.current.start()
    })

    expect(result.current.isMeasuring).toBe(true)
    expect(result.current.elapsedTime).toBeNull()
  })

  it('should stop measuring and calculate elapsed time', () => {
    const { result } = renderHook(() => usePerformanceMeasure())

    act(() => {
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(2500) // Advance 2.5 seconds
    })

    act(() => {
      result.current.stop()
    })

    expect(result.current.isMeasuring).toBe(false)
    expect(result.current.elapsedTime).toBe(2500)
  })

  it('should reset elapsed time when starting a new measurement', () => {
    const { result } = renderHook(() => usePerformanceMeasure())

    // First measurement
    act(() => {
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    act(() => {
      result.current.stop()
    })

    expect(result.current.elapsedTime).toBe(1000)

    // Second measurement
    act(() => {
      result.current.start()
    })

    expect(result.current.elapsedTime).toBeNull()
    expect(result.current.isMeasuring).toBe(true)

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    act(() => {
      result.current.stop()
    })

    expect(result.current.elapsedTime).toBe(3000)
  })

  it('should handle multiple start/stop cycles', () => {
    const { result } = renderHook(() => usePerformanceMeasure())

    // First cycle
    act(() => {
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(1500)
    })

    act(() => {
      result.current.stop()
    })

    expect(result.current.elapsedTime).toBe(1500)

    // Second cycle
    act(() => {
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    act(() => {
      result.current.stop()
    })

    expect(result.current.elapsedTime).toBe(2000)

    // Third cycle
    act(() => {
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    act(() => {
      result.current.stop()
    })

    expect(result.current.elapsedTime).toBe(500)
  })

  it('should handle stop without start gracefully', () => {
    const { result } = renderHook(() => usePerformanceMeasure())

    act(() => {
      result.current.stop()
    })

    expect(result.current.isMeasuring).toBe(false)
    expect(result.current.elapsedTime).toBeNull()
  })

  it('should accurately measure time in milliseconds', () => {
    const { result } = renderHook(() => usePerformanceMeasure())

    act(() => {
      result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(4567) // Precise milliseconds
    })

    act(() => {
      result.current.stop()
    })

    expect(result.current.elapsedTime).toBe(4567)
  })
})
