export type PerformanceClass = 'high' | 'medium' | 'low'

export interface DeviceCapability {
  hardwareConcurrency: number
  performanceClass: PerformanceClass
  expectedProcessingTime: number
}

/**
 * Classifies device performance based on hardware concurrency (CPU cores)
 * - high: > 4 cores
 * - medium: 3-4 cores
 * - low: <= 2 cores
 */
export function getPerformanceClass(cores: number): PerformanceClass {
  if (cores > 4) {
    return 'high'
  } else if (cores >= 3) {
    return 'medium'
  } else {
    return 'low'
  }
}

/**
 * Detects device capability based on navigator.hardwareConcurrency
 * Returns device performance class and expected processing time
 */
export function detectDeviceCapability(): DeviceCapability {
  // Default to 2 cores if hardwareConcurrency is not available
  const hardwareConcurrency = navigator.hardwareConcurrency || 2
  const performanceClass = getPerformanceClass(hardwareConcurrency)

  // Expected processing time based on acceptance criteria
  // High-end (>4 cores): 3 seconds
  // Mid-range and low-end: 5 seconds
  const expectedProcessingTime = performanceClass === 'high' ? 3000 : 5000

  return {
    hardwareConcurrency,
    performanceClass,
    expectedProcessingTime,
  }
}
