import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { Toast, type ToastVariant } from './Toast'

interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
  duration: number
}

interface ToastContextType {
  showToast: (message: string, variant: ToastVariant, duration?: number) => void
  showInfo: (message: string, duration?: number) => void
  showSuccess: (message: string, duration?: number) => void
  showWarning: (message: string, duration?: number) => void
  showError: (message: string, duration?: number) => void
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((message: string, variant: ToastVariant, duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    
    // Default durations based on variant
    const defaultDuration = duration !== undefined ? duration : getDefaultDuration(variant)
    
    const newToast: ToastItem = {
      id,
      message,
      variant,
      duration: defaultDuration,
    }

    setToasts((prev) => [newToast, ...prev])
  }, [])

  const showInfo = useCallback((message: string, duration?: number) => {
    showToast(message, 'info', duration ?? 5000)
  }, [showToast])

  const showSuccess = useCallback((message: string, duration?: number) => {
    showToast(message, 'success', duration ?? 4000)
  }, [showToast])

  const showWarning = useCallback((message: string, duration?: number) => {
    showToast(message, 'warning', duration ?? 6000)
  }, [showToast])

  const showError = useCallback((message: string, duration?: number) => {
    showToast(message, 'error', duration ?? 0) // Errors don't auto-dismiss by default
  }, [showToast])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const value: ToastContextType = {
    showToast,
    showInfo,
    showSuccess,
    showWarning,
    showError,
    dismissToast,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container */}
      <div
        className="fixed top-4 right-4 z-50 flex flex-col gap-2"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            variant={toast.variant}
            duration={toast.duration}
            onDismiss={dismissToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextType {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Explicitly mark useToast for fast refresh
useToast.displayName = 'useToast'

// Helper function to get default duration based on variant
function getDefaultDuration(variant: ToastVariant): number {
  switch (variant) {
    case 'success':
      return 4000
    case 'info':
      return 5000
    case 'warning':
      return 6000
    case 'error':
      return 0 // Don't auto-dismiss errors
    default:
      return 5000
  }
}
