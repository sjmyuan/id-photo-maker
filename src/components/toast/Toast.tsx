import { useEffect, useRef, useState } from 'react'

export type ToastVariant = 'info' | 'success' | 'warning' | 'error'

export interface ToastProps {
  id: string
  message: string
  variant: ToastVariant
  duration?: number
  onDismiss: (id: string) => void
}

const variantStyles = {
  info: {
    container: 'bg-blue-50 border-blue-400 text-blue-800',
    icon: 'text-blue-600',
  },
  success: {
    container: 'bg-green-50 border-green-400 text-green-800',
    icon: 'text-green-600',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-400 text-yellow-800',
    icon: 'text-yellow-600',
  },
  error: {
    container: 'bg-red-50 border-red-400 text-red-800',
    icon: 'text-red-600',
  },
}

const icons = {
  info: (
    <svg
      data-testid="toast-icon-info"
      className="w-5 h-5"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  ),
  success: (
    <svg
      data-testid="toast-icon-success"
      className="w-5 h-5"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  ),
  warning: (
    <svg
      data-testid="toast-icon-warning"
      className="w-5 h-5"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  ),
  error: (
    <svg
      data-testid="toast-icon-error"
      className="w-5 h-5"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
        clipRule="evenodd"
      />
    </svg>
  ),
}

export function Toast({ id, message, variant, duration = 5000, onDismiss }: ToastProps) {
  const [isHovered, setIsHovered] = useState(false)
  const timerRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const remainingTimeRef = useRef<number>(duration)

  useEffect(() => {
    if (duration === 0) return

    // Initialize start time on first effect
    if (startTimeRef.current === 0) {
      startTimeRef.current = Date.now()
    }

    const startTimer = () => {
      startTimeRef.current = Date.now()
      timerRef.current = window.setTimeout(() => {
        onDismiss(id)
      }, remainingTimeRef.current)
    }

    const pauseTimer = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
        const elapsed = Date.now() - startTimeRef.current
        remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed)
      }
    }

    if (isHovered) {
      pauseTimer()
    } else {
      startTimer()
    }

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [id, duration, onDismiss, isHovered])

  const handleDismiss = () => {
    onDismiss(id)
  }

  const styles = variantStyles[variant]
  const ariaLive = variant === 'error' ? 'assertive' : 'polite'

  return (
    <div
      role="alert"
      aria-live={ariaLive}
      aria-atomic="true"
      className={`
        ${styles.container}
        flex items-start gap-3 p-4 rounded-lg border shadow-lg
        animate-slide-in-right
        min-w-[300px] max-w-md
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex-shrink-0 ${styles.icon}`}>{icons[variant]}</div>
      
      <div className="flex-1 pt-0.5">
        <p className="text-sm font-medium">{message}</p>
      </div>
      
      <button
        type="button"
        aria-label="Close notification"
        onClick={handleDismiss}
        className={`
          flex-shrink-0 ${styles.icon}
          hover:opacity-70 transition-opacity
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent
          rounded
        `}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  )
}
