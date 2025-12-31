/**
 * Size Selection with Integrated Crop Guide
 * Combines ID photo size selection with draggable/resizable crop rectangle
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import type { FaceBox } from '../../services/faceDetectionService'

export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export interface SizeOption {
  id: '1-inch' | '2-inch' | '3-inch'
  label: string
  dimensions: string
  aspectRatio: number // width / height
}

const SIZE_OPTIONS: SizeOption[] = [
  { id: '1-inch', label: '1 Inch', dimensions: '25×35mm', aspectRatio: 25 / 35 }, // 0.714
  { id: '2-inch', label: '2 Inch', dimensions: '35×49mm', aspectRatio: 35 / 49 }, // 0.714
  { id: '3-inch', label: '3 Inch', dimensions: '35×52mm', aspectRatio: 35 / 52 }, // 0.673
]

// Export SIZE_OPTIONS for external use
export { SIZE_OPTIONS }

export interface SizeSelectionProps {
  processedImageUrl: string
  faceBox: FaceBox | null
  error?: 'no-face-detected' | 'multiple-faces-detected'
  onCropAreaChange: (cropArea: CropArea) => void
  selectedSize?: SizeOption // Optional: external size control
  onSizeChange?: (size: SizeOption) => void // Optional: external size change handler
}

type ResizeHandle = 'ne' | 'nw' | 'se' | 'sw'

export function SizeSelection({
  processedImageUrl,
  faceBox,
  error,
  onCropAreaChange,
  selectedSize: externalSelectedSize,
  onSizeChange: externalOnSizeChange,
}: SizeSelectionProps) {
  const [internalSelectedSize, setInternalSelectedSize] = useState<SizeOption>(SIZE_OPTIONS[0])
  const selectedSize = externalSelectedSize || internalSelectedSize
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 200, height: 280 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState<ResizeHandle | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize crop area based on face detection
  useEffect(() => {
    if (imageRef.current) {
      const img = imageRef.current
      const imgWidth = img.naturalWidth
      const imgHeight = img.naturalHeight
      
      setImageSize({ width: imgWidth, height: imgHeight })

      if (faceBox) {
        // Auto-position based on face
        const initialCrop = calculateInitialCropArea(faceBox, selectedSize.aspectRatio, imgWidth, imgHeight)
        setCropArea(initialCrop)
        onCropAreaChange(initialCrop)
      } else {
        // Center the crop area if no face detected
        const initialCrop = calculateCenteredCropArea(selectedSize.aspectRatio, imgWidth, imgHeight)
        setCropArea(initialCrop)
        onCropAreaChange(initialCrop)
      }
    }
  }, [processedImageUrl, faceBox, selectedSize.aspectRatio, onCropAreaChange])

  // Handle size selection change
  const handleSizeChange = useCallback((size: SizeOption) => {
    // Use external handler if provided, otherwise use internal state
    if (externalOnSizeChange) {
      externalOnSizeChange(size)
    } else {
      setInternalSelectedSize(size)
    }
    
    // Adjust crop area to new aspect ratio while maintaining center
    const centerX = cropArea.x + cropArea.width / 2
    const centerY = cropArea.y + cropArea.height / 2
    
    // Calculate new dimensions maintaining the larger dimension
    let newWidth, newHeight
    const currentAspectRatio = cropArea.width / cropArea.height
    
    if (size.aspectRatio > currentAspectRatio) {
      // New size is wider - keep height, adjust width
      newHeight = cropArea.height
      newWidth = newHeight * size.aspectRatio
    } else {
      // New size is taller - keep width, adjust height
      newWidth = cropArea.width
      newHeight = newWidth / size.aspectRatio
    }
    
    // Constrain to image bounds
    const maxWidth = imageSize.width
    const maxHeight = imageSize.height
    
    if (newWidth > maxWidth) {
      newWidth = maxWidth
      newHeight = newWidth / size.aspectRatio
    }
    if (newHeight > maxHeight) {
      newHeight = maxHeight
      newWidth = newHeight * size.aspectRatio
    }
    
    const newX = Math.max(0, Math.min(centerX - newWidth / 2, maxWidth - newWidth))
    const newY = Math.max(0, Math.min(centerY - newHeight / 2, maxHeight - newHeight))
    
    const newCrop = { x: newX, y: newY, width: newWidth, height: newHeight }
    setCropArea(newCrop)
    onCropAreaChange(newCrop)
  }, [cropArea, imageSize, onCropAreaChange, externalOnSizeChange])

  // Mouse down on rectangle body - start dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('resize-handle')) {
      return // Handled by resize handle
    }
    
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX - cropArea.x, y: e.clientY - cropArea.y })
  }, [cropArea])

  // Touch start for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).classList.contains('resize-handle')) {
      return
    }
    
    e.preventDefault()
    setIsDragging(true)
    const touch = e.touches[0]
    setDragStart({ x: touch.clientX - cropArea.x, y: touch.clientY - cropArea.y })
  }, [cropArea])

  // Mouse down on resize handle
  const handleResizeStart = useCallback((e: React.MouseEvent, handle: ResizeHandle) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(handle)
    setDragStart({ x: e.clientX, y: e.clientY })
  }, [])

  // Mouse move - drag or resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return

      const container = containerRef.current
      const rect = container.getBoundingClientRect()
      const scaleX = imageSize.width / rect.width
      const scaleY = imageSize.height / rect.height

      if (isDragging) {
        const newX = (e.clientX - rect.left - dragStart.x) * scaleX
        const newY = (e.clientY - rect.top - dragStart.y) * scaleY
        
        // Constrain to image bounds
        const constrainedX = Math.max(0, Math.min(newX, imageSize.width - cropArea.width))
        const constrainedY = Math.max(0, Math.min(newY, imageSize.height - cropArea.height))
        
        const newCrop = { ...cropArea, x: constrainedX, y: constrainedY }
        setCropArea(newCrop)
        onCropAreaChange(newCrop)
      } else if (isResizing) {
        const deltaX = (e.clientX - dragStart.x) * scaleX
        const deltaY = (e.clientY - dragStart.y) * scaleY
        
        handleResize(isResizing, deltaX, deltaY)
        setDragStart({ x: e.clientX, y: e.clientY })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(null)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !containerRef.current) return
      
      const container = containerRef.current
      const rect = container.getBoundingClientRect()
      const scaleX = imageSize.width / rect.width
      const scaleY = imageSize.height / rect.height
      
      const touch = e.touches[0]
      const newX = (touch.clientX - rect.left - dragStart.x) * scaleX
      const newY = (touch.clientY - rect.top - dragStart.y) * scaleY
      
      const constrainedX = Math.max(0, Math.min(newX, imageSize.width - cropArea.width))
      const constrainedY = Math.max(0, Math.min(newY, imageSize.height - cropArea.height))
      
      const newCrop = { ...cropArea, x: constrainedX, y: constrainedY }
      setCropArea(newCrop)
      onCropAreaChange(newCrop)
    }

    const handleTouchEnd = () => {
      setIsDragging(false)
      setIsResizing(null)
    }

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove)
      document.addEventListener('touchend', handleTouchEnd)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isDragging, isResizing, dragStart, cropArea, imageSize, onCropAreaChange])

  // Handle resize logic
  const handleResize = useCallback((handle: ResizeHandle, deltaX: number, deltaY: number) => {
    const minSize = 100
    const aspectRatio = selectedSize.aspectRatio
    
    let newX = cropArea.x
    let newY = cropArea.y
    let newWidth = cropArea.width
    let newHeight = cropArea.height
    
    switch (handle) {
      case 'se': // Bottom-right
        newWidth += deltaX
        newHeight = newWidth / aspectRatio
        break
      case 'sw': // Bottom-left
        newWidth -= deltaX
        newHeight = newWidth / aspectRatio
        newX += deltaX
        break
      case 'ne': // Top-right
        newWidth += deltaX
        newHeight = newWidth / aspectRatio
        newY -= (newHeight - cropArea.height)
        break
      case 'nw': // Top-left
        newWidth -= deltaX
        newHeight = newWidth / aspectRatio
        newX += deltaX
        newY -= (newHeight - cropArea.height)
        break
    }
    
    // Apply minimum size constraint
    if (newWidth < minSize) {
      newWidth = minSize
      newHeight = minSize / aspectRatio
      
      // Adjust position back if we hit minimum
      if (handle === 'sw' || handle === 'nw') {
        newX = cropArea.x + cropArea.width - newWidth
      }
      if (handle === 'ne' || handle === 'nw') {
        newY = cropArea.y + cropArea.height - newHeight
      }
    }
    
    // Constrain to image bounds
    if (newX < 0) {
      newWidth += newX
      newHeight = newWidth / aspectRatio
      newX = 0
    }
    if (newY < 0) {
      newHeight += newY
      newWidth = newHeight * aspectRatio
      newY = 0
    }
    if (newX + newWidth > imageSize.width) {
      newWidth = imageSize.width - newX
      newHeight = newWidth / aspectRatio
    }
    if (newY + newHeight > imageSize.height) {
      newHeight = imageSize.height - newY
      newWidth = newHeight * aspectRatio
    }
    
    const newCrop = { x: newX, y: newY, width: newWidth, height: newHeight }
    setCropArea(newCrop)
    onCropAreaChange(newCrop)
  }, [cropArea, imageSize, selectedSize.aspectRatio, onCropAreaChange])

  return (
    <div className="size-selection">
      {/* Size buttons */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Select ID Photo Size</h3>
        <div className="flex gap-3">
          {SIZE_OPTIONS.map((size) => (
            <button
              key={size.id}
              data-testid={`size-${size.id}`}
              className={`px-6 py-3 rounded-lg border-2 transition-all ${
                selectedSize.id === size.id
                  ? 'border-blue-600 bg-blue-50 text-blue-700 selected'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
              onClick={() => handleSizeChange(size)}
            >
              <div className="font-semibold">{size.label}</div>
              <div className="text-sm">{size.dimensions}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Error messages */}
      {error === 'no-face-detected' && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="font-semibold">No face detected</p>
          <p className="text-sm">Please position the crop area manually to frame your face.</p>
        </div>
      )}
      {error === 'multiple-faces-detected' && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          <p className="font-semibold">Multiple faces detected</p>
          <p className="text-sm">Please ensure only one person is in the photo and adjust the crop area manually.</p>
        </div>
      )}

      {/* Image with crop overlay */}
      <div className="relative inline-block" ref={containerRef}>
        <img
          ref={imageRef}
          src={processedImageUrl}
          alt="Processed"
          data-testid="processed-image"
          className="max-w-full h-auto"
          style={{ display: 'block', maxHeight: '600px' }}
        />
        
        {/* Crop rectangle overlay */}
        {imageRef.current && (
          <div
            data-testid="crop-rectangle"
            className="absolute border-2 border-blue-500 cursor-move bg-blue-500 bg-opacity-10"
            style={{
              left: `${(cropArea.x / imageSize.width) * 100}%`,
              top: `${(cropArea.y / imageSize.height) * 100}%`,
              width: `${(cropArea.width / imageSize.width) * 100}%`,
              height: `${(cropArea.height / imageSize.height) * 100}%`,
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            {/* Resize handles */}
            <div
              data-testid="resize-handle-nw"
              className="resize-handle absolute w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-nw-resize"
              style={{ left: '-8px', top: '-8px' }}
              onMouseDown={(e) => handleResizeStart(e, 'nw')}
            />
            <div
              data-testid="resize-handle-ne"
              className="resize-handle absolute w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-ne-resize"
              style={{ right: '-8px', top: '-8px' }}
              onMouseDown={(e) => handleResizeStart(e, 'ne')}
            />
            <div
              data-testid="resize-handle-sw"
              className="resize-handle absolute w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-sw-resize"
              style={{ left: '-8px', bottom: '-8px' }}
              onMouseDown={(e) => handleResizeStart(e, 'sw')}
            />
            <div
              data-testid="resize-handle-se"
              className="resize-handle absolute w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-se-resize"
              style={{ right: '-8px', bottom: '-8px' }}
              onMouseDown={(e) => handleResizeStart(e, 'se')}
            />
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-sm text-gray-600">
        <p>• Drag the rectangle to reposition the crop area</p>
        <p>• Drag the corner handles to resize (aspect ratio is maintained)</p>
        <p>• The crop area shows where your ID photo will be extracted</p>
      </div>
    </div>
  )
}

/**
 * Calculate initial crop area based on detected face
 */
function calculateInitialCropArea(
  faceBox: FaceBox,
  aspectRatio: number,
  imageWidth: number,
  imageHeight: number
): CropArea {
  // Add padding around face (30% on each side)
  const padding = 0.3
  const faceWidth = faceBox.width
  const faceHeight = faceBox.height
  
  // Calculate target dimensions with padding
  const targetWidth = faceWidth * (1 + 2 * padding)
  const targetHeight = faceHeight * (1 + 2 * padding)
  
  // Adjust to match aspect ratio
  let cropWidth, cropHeight
  const faceAspectRatio = targetWidth / targetHeight
  
  if (faceAspectRatio > aspectRatio) {
    // Face is wider - use width and adjust height
    cropWidth = targetWidth
    cropHeight = cropWidth / aspectRatio
  } else {
    // Face is taller - use height and adjust width
    cropHeight = targetHeight
    cropWidth = cropHeight * aspectRatio
  }
  
  // Ensure minimum size and don't exceed image bounds
  const minSize = 100
  cropWidth = Math.max(minSize, Math.min(cropWidth, imageWidth))
  cropHeight = Math.max(minSize / aspectRatio, Math.min(cropHeight, imageHeight))
  
  // Center on face
  const faceCenterX = faceBox.x + faceBox.width / 2
  const faceCenterY = faceBox.y + faceBox.height / 2
  
  let cropX = faceCenterX - cropWidth / 2
  let cropY = faceCenterY - cropHeight / 2
  
  // Constrain to image bounds
  cropX = Math.max(0, Math.min(cropX, imageWidth - cropWidth))
  cropY = Math.max(0, Math.min(cropY, imageHeight - cropHeight))
  
  return { x: cropX, y: cropY, width: cropWidth, height: cropHeight }
}

/**
 * Calculate centered crop area when no face is detected
 */
function calculateCenteredCropArea(
  aspectRatio: number,
  imageWidth: number,
  imageHeight: number
): CropArea {
  // Use 40% of image width as default
  const cropWidth = imageWidth * 0.4
  const cropHeight = cropWidth / aspectRatio
  
  const cropX = (imageWidth - cropWidth) / 2
  const cropY = (imageHeight - cropHeight) / 2
  
  return { x: cropX, y: cropY, width: cropWidth, height: cropHeight }
}
