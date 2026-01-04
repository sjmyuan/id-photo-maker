import { ImagePreview } from '../layout/ImagePreview'
import { type PaperType } from '../layout/PaperTypeSelector'
import { type SizeOption } from '../size/CropEditor'
import { usePrintLayoutCanvas } from '../../hooks/usePrintLayoutCanvas'

interface Step3LayoutProps {
  printLayoutPreviewUrl: string | null
  croppedPreviewUrl: string
  paperType: PaperType
  selectedSize: SizeOption
  isProcessing: boolean
  onDownloadLayout: () => void
  onBack: () => void
}

export function Step3Layout({
  printLayoutPreviewUrl,
  croppedPreviewUrl,
  paperType,
  selectedSize,
  isProcessing,
  onDownloadLayout,
  onBack,
}: Step3LayoutProps) {
  const { canvasRef } = usePrintLayoutCanvas({
    croppedPreviewUrl,
    paperType,
    selectedSize,
  })

  return (
    <div data-testid="step3-container">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Print Layout Preview</h3>
      
      {/* Print Layout Preview */}
      <div className="mb-6" data-testid="print-layout-preview">
        {printLayoutPreviewUrl ? (
          <ImagePreview 
            imageUrl={printLayoutPreviewUrl} 
            alt="Print layout preview"
          />
        ) : (
          <div className="bg-gray-100 p-4 rounded-lg flex justify-center items-center">
            <canvas
              ref={canvasRef}
              data-testid="layout-preview"
              className="border border-gray-300 shadow-sm"
            />
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Primary Action */}
        <button
          onClick={onDownloadLayout}
          disabled={isProcessing}
          data-testid="download-print-layout-button"
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Print Layout
        </button>
        
        {/* Secondary Action */}
        <button
          onClick={onBack}
          disabled={isProcessing}
          data-testid="back-button"
          className="w-full py-2 px-4 bg-white hover:bg-gray-50 text-gray-600 font-normal rounded-lg transition-colors border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          Back to Preview
        </button>
      </div>
    </div>
  )
}
