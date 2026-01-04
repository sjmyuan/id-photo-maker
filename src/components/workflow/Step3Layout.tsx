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
        <button
          onClick={onDownloadLayout}
          disabled={isProcessing}
          data-testid="download-print-layout-button"
          className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600"
        >
          Download Print Layout
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
