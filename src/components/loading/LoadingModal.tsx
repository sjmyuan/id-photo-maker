export interface LoadingModalProps {
  isOpen: boolean
  message: string
}

/**
 * LoadingModal component displays a full-screen modal overlay with a loading spinner
 * Used to block user interaction while essential operations (like model loading) are in progress
 */
export function LoadingModal({ isOpen, message }: LoadingModalProps) {
  if (!isOpen) {
    return null
  }

  const labelId = 'loading-modal-label'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-4"
      >
        <div className="flex flex-col items-center gap-4">
          {/* Loading Spinner */}
          <div
            data-testid="loading-spinner"
            className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"
            aria-hidden="true"
          />
          
          {/* Loading Message */}
          <div
            id={labelId}
            role="status"
            aria-live="polite"
            className="text-lg font-medium text-gray-900 text-center"
          >
            {message}
          </div>
        </div>
      </div>
    </div>
  )
}
