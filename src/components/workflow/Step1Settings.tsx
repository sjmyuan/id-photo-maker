import { useRef, type ChangeEvent } from 'react'
import { type SizeOption } from '../size/CropEditor'
import { SizeSelector } from '../size/SizeSelector'
import { DPISelector } from '../size/DPISelector'
import { ColorSelector } from '../background/ColorSelector'
import { PaperTypeSelector, type PaperType } from '../layout/PaperTypeSelector'

interface Step1SettingsProps {
  selectedSize: SizeOption
  requiredDPI: 300 | null
  backgroundColor: string
  paperType: PaperType
  uploadedImageUrl: string | null
  uploadedFile: File | null
  isProcessing: boolean
  isLoadingU2Net: boolean
  onSizeChange: (size: SizeOption) => void
  onDPIChange: (dpi: 300 | null) => void
  onColorChange: (color: string) => void
  onPaperTypeChange: (paper: PaperType) => void
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onGeneratePreview: () => void
}

export function Step1Settings({
  selectedSize,
  requiredDPI,
  backgroundColor,
  paperType,
  uploadedImageUrl,
  uploadedFile,
  isProcessing,
  isLoadingU2Net,
  onSizeChange,
  onDPIChange,
  onColorChange,
  onPaperTypeChange,
  onFileChange,
  onGeneratePreview,
}: Step1SettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div data-testid="step1-container">
      {/* Compact Grid Selector for Size, DPI, Color, and Paper */}
      <div data-testid="selector-grid-step1" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SizeSelector 
          selectedSize={selectedSize} 
          onSizeChange={onSizeChange} 
          testId="size-selector-step1"
        />
        <DPISelector 
          requiredDPI={requiredDPI} 
          onDPIChange={onDPIChange} 
          testId="dpi-selector-step1"
        />
        <ColorSelector 
          backgroundColor={backgroundColor} 
          onColorChange={onColorChange} 
          testId="color-selector-step1"
        />
        <PaperTypeSelector 
          paperType={paperType} 
          onPaperTypeChange={onPaperTypeChange} 
          testId="paper-type-selector-step1"
        />
      </div>
      
      {/* Image Placeholder */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Photo Preview
        </label>
        <div 
          className="w-full h-80 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden"
          data-testid="image-placeholder"
        >
          {uploadedImageUrl ? (
            <img 
              src={uploadedImageUrl} 
              alt="Uploaded preview" 
              className="max-w-full max-h-full object-contain"
              data-testid="uploaded-image"
            />
          ) : (
            <div className="text-center text-gray-400">
              <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">No image uploaded</p>
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onFileChange}
        disabled={isProcessing || isLoadingU2Net}
        data-testid="file-input"
        className="hidden"
      />
      
      {/* Upload Image / Generate ID Photo Button */}
      <button
        onClick={uploadedFile ? onGeneratePreview : handleUploadButtonClick}
        disabled={isProcessing || isLoadingU2Net}
        data-testid="upload-or-generate-button"
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
      >
        {uploadedFile ? 'Generate ID Photo' : 'Upload Image'}
      </button>
      
      {/* Processing Indicator */}
      {isProcessing && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            <p className="text-sm text-blue-700">Processing your image...</p>
          </div>
        </div>
      )}
    </div>
  )
}
