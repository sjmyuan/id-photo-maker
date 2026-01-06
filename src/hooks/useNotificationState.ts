/**
 * Hook for managing error and warning notifications
 * Single Responsibility: Notification state management
 */

import { useState, useCallback } from 'react'

export interface NotificationState {
  errors: string[]
  warnings: string[]
}

export interface UseNotificationStateReturn {
  errors: string[]
  warnings: string[]
  setErrors: (errors: string[]) => void
  setWarnings: (warnings: string[]) => void
  addError: (error: string) => void
  addWarning: (warning: string) => void
  clearNotifications: () => void
  clearErrors: () => void
  clearWarnings: () => void
}

/**
 * Custom hook for managing notification state (errors and warnings)
 */
export function useNotificationState(): UseNotificationStateReturn {
  const [errors, setErrors] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])

  const addError = useCallback((error: string) => {
    setErrors((prev) => [...prev, error])
  }, [])

  const addWarning = useCallback((warning: string) => {
    setWarnings((prev) => [...prev, warning])
  }, [])

  const clearNotifications = useCallback(() => {
    setErrors([])
    setWarnings([])
  }, [])

  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])

  const clearWarnings = useCallback(() => {
    setWarnings([])
  }, [])

  return {
    errors,
    warnings,
    setErrors,
    setWarnings,
    addError,
    addWarning,
    clearNotifications,
    clearErrors,
    clearWarnings,
  }
}
