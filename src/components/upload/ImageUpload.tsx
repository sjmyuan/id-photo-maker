import { useState, useCallback, type ChangeEvent } from 'react'
import { validateImageFile } from '../../services/imageValidation'
import { scaleImageToTarget } from '../../services/imageScaling'
import { mockMattingService, processWithU2Net } from '../../services/mattingService'
import { detectDeviceCapability } from '../../utils/deviceCapability'
import { usePerformanceMeasure } from '../../hooks/usePerformanceMeasure'
import type { U2NetModel } from '../../services/u2netService'

export interface ImageUploadProps {
  /** Callback when image is successfully processed */
  onImageProcessed?: (originalFile: File, processedBlob: Blob) => void
  /** Optional U2Net model for AI-powered background removal */
  u2netModel?: U2NetModel | null
}

export function ImageUpload({ onImageProcessed, u2netModel }: ImageUploadProps) {
  const [warnings, setWarnings] = useState<string[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedImage, setProcessedImage] = useState<Blob | null>(null)
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  
  const { elapsedTime, isMeasuring, start, stop } = usePerformanceMeasure()
  const deviceCapability = detectDeviceCapability()

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      // Reset state
      setWarnings([])
      setErrors([])
      setProcessedImage(null)
      setOriginalFile(file)
      setIsProcessing(true)
      start()

      try {
        // 1. Validate the file
        const validation = await validateImageFile(file)
        
        if (!validation.isValid) {
          setErrors(validation.errors)
          stop()
          setIsProcessing(false)
          return
        }

        if (validation.warnings.length > 0) {
          setWarnings(validation.warnings)
        }

        // 2. Scale if needed
        let fileToProcess = file
        if (validation.needsScaling) {
          const scaledBlob = await scaleImageToTarget(file, 10)
          fileToProcess = new File([scaledBlob], file.name, { type: file.type })
        }

        // 3. Process matting
        let mattedImage: Blob
        if (u2netModel) {
          // Use U2Net model if available
          mattedImage = await processWithU2Net(fileToProcess, u2netModel)
        } else {
          // Fall back to mock service
          mattedImage = await mockMattingService(
            fileToProcess,
            deviceCapability.expectedProcessingTime
          )
        }

        // 4. Complete
        setProcessedImage(mattedImage)
        stop()
        setIsProcessing(false)
        
        // 5. Notify parent
        if (onImageProcessed) {
          onImageProcessed(file, mattedImage)
        }
      } catch (error) {
        setErrors([error instanceof Error ? error.message : 'Processing failed'])
        stop()
        setIsProcessing(false)
      }
    },
[start, stop, deviceCapability, onImageProcessed, u2netModel]
  )

  return (
    <div className="p-4">
      <div className="mb-4">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={isProcessing}
          data-testid="file-input"
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
        />
      </div>

      {warnings.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded" data-testid="warnings">
          {warnings.map((warning, index) => (
            <p key={index}>{warning}</p>
          ))}
        </div>
      )}

      {errors.length > 0 && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded" data-testid="errors">
          {errors.map((error, index) => (
            <p key={index}>{error}</p>
          ))}
        </div>
      )}

      {isMeasuring && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded" data-testid="processing">
          Processing... (Expected time: {deviceCapability.expectedProcessingTime}ms)
        </div>
      )}

      {processedImage && !isMeasuring && originalFile && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded" data-testid="processing-complete">
          <p>Processing complete!</p>
          {elapsedTime !== null && (
            <p data-testid="elapsed-time">Processing time: {elapsedTime}ms</p>
          )}
        </div>
      )}
    </div>
  )
}
