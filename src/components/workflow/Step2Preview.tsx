import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  
  return (
    <div data-testid="step2-container">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">{t('step2.title')}</h3>
      
      {/* ID Photo Preview */}
      <div className="mb-6" data-testid="id-photo-preview">
        <ImagePreview 
          imageUrl={croppedPreviewUrl} 
          alt="ID photo preview"
        />
      </div>
      
      {/* Action Buttons */}
      <div className="space-y-4">
        {/* Primary Actions */}
        <div data-testid="primary-actions" className="space-y-3">
          <button
            onClick={onDownload}
            disabled={isProcessing}
            data-testid="download-id-photo-button"
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {t('step2.downloadIdPhoto')}
          </button>
        </div>
        
        {/* Navigation Actions */}
        <div data-testid="navigation-actions" className="flex gap-3">
          <button
            onClick={onBack}
            disabled={isProcessing}
            data-testid="back-button"
            className="flex-1 py-2.5 px-4 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            {t('common.back')}
          </button>
          
          <button
            onClick={onNext}
            disabled={isProcessing}
            data-testid="next-button"
            className="flex-1 py-2.5 px-4 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors border-2 border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow"
          >
            {t('common.continue')}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
