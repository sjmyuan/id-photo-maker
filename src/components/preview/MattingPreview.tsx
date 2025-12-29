export interface MattingPreviewProps {
  /** Original image URL or data URL */
  originalImage: string
  /** Processed image URL or data URL (with background removed) */
  processedImage: string
  /** Callback when user clicks reprocess button */
  onReprocess: () => void
  /** Callback when user clicks continue button */
  onContinue: () => void
}

/**
 * MattingPreview component displays original and processed images side-by-side
 * and provides options to reprocess or continue to the next step.
 * 
 * Acceptance Criteria (Epic 1, User Story 3):
 * - Display original and processed images side-by-side
 * - Provide "Reprocess" button to return to upload/edit state
 * - Provide "Continue" button to proceed to size selection
 */
export function MattingPreview({
  originalImage,
  processedImage,
  onReprocess,
  onContinue,
}: MattingPreviewProps) {
  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Preview Results</h2>
      
      {/* Side-by-side image comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Original Image */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-700">Original</h3>
          <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
            <img
              src={originalImage}
              alt="Original image"
              data-testid="original-image"
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* Processed Image */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-700">Processed</h3>
          <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
            <img
              src={processedImage}
              alt="Processed image with background removed"
              data-testid="processed-image"
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-4 justify-center">
        <button
          onClick={onReprocess}
          className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
          aria-label="Reprocess image"
        >
          Reprocess
        </button>
        <button
          onClick={onContinue}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          aria-label="Continue to next step"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
