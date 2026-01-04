import { ImagePreview } from '../layout/ImagePreview'

interface Step2PreviewProps {
  croppedPreviewUrl: string
  isProcessing: boolean
  onDownload: () => void
  onNext: () => void
  onBack: () => void
}

export function Step2Preview({
  croppedPreviewUrl,
  isProcessing,
  onDownload,
  onNext,
  onBack,
}: Step2PreviewProps) {
  return (
    <div data-testid="step2-container">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">ID Photo Preview</h3>
      
      {/* ID Photo Preview */}
      <div className="mb-6" data-testid="id-photo-preview">
        <ImagePreview 
          imageUrl={croppedPreviewUrl} 
          alt="ID photo preview"
        />
      </div>
      
      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={onDownload}
          disabled={isProcessing}
          data-testid="download-id-photo-button"
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
        >
          Download ID Photo
        </button>
        
        <button
          onClick={onNext}
          disabled={isProcessing}
          data-testid="next-button"
          className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600"
        >
          Next
        </button>
        
        <button
          onClick={onBack}
          disabled={isProcessing}
          data-testid="back-button"
          className="w-full py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-600"
        >
          Back
        </button>
      </div>
    </div>
  )
}
