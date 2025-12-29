import { useState, useCallback, useRef } from 'react'

export interface PerformanceMeasure {
  elapsedTime: number | null
  isMeasuring: boolean
  start: () => void
  stop: () => void
}

/**
 * Hook to measure performance/elapsed time
 * @returns Performance measurement utilities
 */
export function usePerformanceMeasure(): PerformanceMeasure {
  const [elapsedTime, setElapsedTime] = useState<number | null>(null)
  const [isMeasuring, setIsMeasuring] = useState(false)
  const startTimeRef = useRef<number | null>(null)

  const start = useCallback(() => {
    startTimeRef.current = Date.now()
    setElapsedTime(null)
    setIsMeasuring(true)
  }, [])

  const stop = useCallback(() => {
    if (startTimeRef.current !== null) {
      const elapsed = Date.now() - startTimeRef.current
      setElapsedTime(elapsed)
      startTimeRef.current = null
    }
    setIsMeasuring(false)
  }, [])

  return {
    elapsedTime,
    isMeasuring,
    start,
    stop,
  }
}
