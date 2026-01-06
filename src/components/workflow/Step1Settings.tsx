import { useRef, type ChangeEvent } from 'react'
import { type SizeOption } from '../size/CropEditor'
import { SizeSelector } from '../size/SizeSelector'
import { ColorSelector } from '../background/ColorSelector'
import { PaperTypeSelector, type PaperType } from '../layout/PaperTypeSelector'

interface Step1SettingsProps {
  selectedSize: SizeOption
  backgroundColor: string
  paperType: PaperType
  uploadedImageUrl: string | null
  uploadedFile: File | null
  isProcessing: boolean
  isLoadingU2Net: boolean
  onSizeChange: (size: SizeOption) => void
  onColorChange: (color: string) => void
  onPaperTypeChange: (paper: PaperType) => void
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onGeneratePreview: () => void
}

export function Step1Settings({
  selectedSize,
  backgroundColor,
  paperType,
  uploadedImageUrl,
  uploadedFile,
  isProcessing,
  isLoadingU2Net,
  onSizeChange,
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
      {/* Vertical Stack Selector Layout */}
      <div data-testid="selectors-container" className="space-y-4 mb-6">
        <SizeSelector 
          selectedSize={selectedSize} 
          onSizeChange={onSizeChange} 
          testId="size-selector-step1"
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
      
      {/* Action Buttons */}
      <div className="space-y-3">
        {!uploadedFile ? (
          <button
            onClick={handleUploadButtonClick}
            disabled={isProcessing || isLoadingU2Net}
            data-testid="upload-or-generate-button"
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Image
          </button>
        ) : (
          <>
            <button
              onClick={onGeneratePreview}
              disabled={isProcessing || isLoadingU2Net}
              data-testid="upload-or-generate-button"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate ID Photo
                </>
              )}
            </button>
            
            <button
              onClick={handleUploadButtonClick}
              disabled={isProcessing || isLoadingU2Net}
              className="w-full py-2 px-4 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors border-2 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Change Image
            </button>
          </>
        )}
      </div>
      
      {/* Processing Indicator */}
      {isProcessing && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg animate-pulse">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent mr-3"></div>
            <p className="text-sm text-blue-700 font-medium">Processing your image...</p>
          </div>
        </div>
      )}
    </div>
  )
}
