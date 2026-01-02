/**
 * Crop Editor with Integrated Size Selection
 * Combines ID photo size selection with draggable/resizable crop rectangle
 * and DPI warning for print quality validation
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { calculateDPI } from '../../utils/dpiCalculation'

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
  physicalWidth: number // width in millimeters
  physicalHeight: number // height in millimeters
}

const SIZE_OPTIONS: SizeOption[] = [
  { id: '1-inch', label: '1 Inch', dimensions: '25×35mm', aspectRatio: 25 / 35, physicalWidth: 25, physicalHeight: 35 }, // 0.714
  { id: '2-inch', label: '2 Inch', dimensions: '35×49mm', aspectRatio: 35 / 49, physicalWidth: 35, physicalHeight: 49 }, // 0.714
  { id: '3-inch', label: '3 Inch', dimensions: '35×52mm', aspectRatio: 35 / 52, physicalWidth: 35, physicalHeight: 52 }, // 0.673
]

// Export SIZE_OPTIONS for external use
export { SIZE_OPTIONS }

export interface CropEditorProps {
  processedImageUrl: string
  initialCropArea: CropArea | null // Initial crop area calculated from face detection
  onCropAreaChange: (cropArea: CropArea) => void
  selectedSize: SizeOption // Required: external size control
}

type ResizeHandle = 'ne' | 'nw' | 'se' | 'sw'
type ViewMode = 'full' | 'crop'

export function CropEditor({
  processedImageUrl,
  initialCropArea,
  onCropAreaChange,
  selectedSize,
}: CropEditorProps) {
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 200, height: 280 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState<ResizeHandle | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [viewMode, setViewMode] = useState<ViewMode>('full')
  
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate DPI based on current crop area and selected size
  const dpiInfo = useMemo(() => {
    if (!cropArea.width || !cropArea.height || !selectedSize.physicalWidth || !selectedSize.physicalHeight) {
      return null
    }
    
    return calculateDPI(
      cropArea.width,
      cropArea.height,
      selectedSize.physicalWidth,
      selectedSize.physicalHeight
    )
  }, [cropArea.width, cropArea.height, selectedSize.physicalWidth, selectedSize.physicalHeight])

  // Check if DPI is below 300
  const showDPIWarning = dpiInfo && dpiInfo.minDPI < 300

  // Calculate zoom transform for crop view mode
  const imageContainerTransform = useMemo(() => {
    if (viewMode !== 'crop' || !imageSize.width || !imageSize.height) {
      return undefined
    }

    // Calculate the center of the crop area
    const cropCenterX = cropArea.x + cropArea.width / 2
    const cropCenterY = cropArea.y + cropArea.height / 2

    // Calculate scale to fit crop area to viewport (with some padding)
    // We want the crop area to fill most of the view
    const viewportPadding = 0.9 // Use 90% of viewport
    const scaleX = (imageSize.width * viewportPadding) / cropArea.width
    const scaleY = (imageSize.height * viewportPadding) / cropArea.height
    const scale = Math.min(scaleX, scaleY)

    // Calculate translation to center the crop area
    // We need to move the image so the crop center is at the image center
    const translateX = ((imageSize.width / 2 - cropCenterX) / imageSize.width) * 100
    const translateY = ((imageSize.height / 2 - cropCenterY) / imageSize.height) * 100

    return `scale(${scale}) translate(${translateX}%, ${translateY}%)`
  }, [viewMode, cropArea, imageSize])

  // Initialize crop area from provided initialCropArea
  useEffect(() => {
    if (imageRef.current) {
      const img = imageRef.current
      const imgWidth = img.naturalWidth
      const imgHeight = img.naturalHeight
      // Guard: only initialize if image dimensions are valid
      if (!imgWidth || !imgHeight) return

      setImageSize({ width: imgWidth, height: imgHeight })

      if (initialCropArea) {
        // Use the provided initial crop area
        setCropArea(initialCropArea)
        onCropAreaChange(initialCropArea)
      } else {
        // Fallback: center the crop area if no initial crop provided
        const fallbackCrop = calculateCenteredCropArea(selectedSize.aspectRatio, imgWidth, imgHeight)
        setCropArea(fallbackCrop)
        onCropAreaChange(fallbackCrop)
      }
    }
  }, [processedImageUrl, initialCropArea, selectedSize.aspectRatio, onCropAreaChange])



  // Watch for external size changes and adjust crop area accordingly
  useEffect(() => {
    // Skip if this is the initial mount or if crop area isn't set yet
    if (!cropArea.width || !cropArea.height || !imageSize.width || !imageSize.height) return

    // Calculate the center of current crop area
    const centerX = cropArea.x + cropArea.width / 2
    const centerY = cropArea.y + cropArea.height / 2
    
    // Calculate new dimensions maintaining the larger dimension
    let newWidth, newHeight
    const currentAspectRatio = cropArea.width / cropArea.height
    
    if (selectedSize.aspectRatio > currentAspectRatio) {
      // New size is wider - keep height, adjust width
      newHeight = cropArea.height
      newWidth = newHeight * selectedSize.aspectRatio
    } else {
      // New size is taller - keep width, adjust height
      newWidth = cropArea.width
      newHeight = newWidth / selectedSize.aspectRatio
    }
    
    // Constrain to image bounds
    const maxWidth = imageSize.width
    const maxHeight = imageSize.height
    
    if (newWidth > maxWidth) {
      newWidth = maxWidth
      newHeight = newWidth / selectedSize.aspectRatio
    }
    if (newHeight > maxHeight) {
      newHeight = maxHeight
      newWidth = newHeight * selectedSize.aspectRatio
    }
    
    const newX = Math.max(0, Math.min(centerX - newWidth / 2, maxWidth - newWidth))
    const newY = Math.max(0, Math.min(centerY - newHeight / 2, maxHeight - newHeight))
    
    // Only update if aspect ratio actually changed
    const newAspectRatio = newWidth / newHeight
    if (Math.abs(newAspectRatio - currentAspectRatio) > 0.001) {
      const newCrop = { x: newX, y: newY, width: newWidth, height: newHeight }
      setCropArea(newCrop)
      onCropAreaChange(newCrop)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSize.aspectRatio, imageSize.width, imageSize.height, onCropAreaChange])

  // Mouse down on rectangle body - start dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('resize-handle')) {
      return // Handled by resize handle
    }
    
    e.preventDefault()
    setIsDragging(true)
    // Store the offset between pointer and crop area origin in image coordinates
    if (imageRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const scaleX = imageSize.width / rect.width
      const scaleY = imageSize.height / rect.height
      const pointerX = (e.clientX - rect.left) * scaleX
      const pointerY = (e.clientY - rect.top) * scaleY
      setDragStart({ x: pointerX - cropArea.x, y: pointerY - cropArea.y })
    } else {
      setDragStart({ x: 0, y: 0 })
    }
  }, [cropArea, imageSize.width, imageSize.height])

  // Touch start for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).classList.contains('resize-handle')) {
      return
    }
    
    e.preventDefault()
    setIsDragging(true)
    const touch = e.touches[0]
    if (imageRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const scaleX = imageSize.width / rect.width
      const scaleY = imageSize.height / rect.height
      const pointerX = (touch.clientX - rect.left) * scaleX
      const pointerY = (touch.clientY - rect.top) * scaleY
      setDragStart({ x: pointerX - cropArea.x, y: pointerY - cropArea.y })
    } else {
      setDragStart({ x: 0, y: 0 })
    }
  }, [cropArea, imageSize.width, imageSize.height])

  // Mouse down on resize handle
  const handleResizeStart = useCallback((e: React.MouseEvent, handle: ResizeHandle) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(handle)
    setDragStart({ x: e.clientX, y: e.clientY })
  }, [])

  // Handle resize logic
  const handleResize = useCallback((handle: ResizeHandle, deltaX: number) => {
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

  // Mouse move - drag or resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return

      const container = containerRef.current
      const rect = container.getBoundingClientRect()
      const scaleX = imageSize.width / rect.width
      const scaleY = imageSize.height / rect.height

      if (isDragging) {
        // Calculate pointer position in image coordinates
        const pointerX = (e.clientX - rect.left) * scaleX
        const pointerY = (e.clientY - rect.top) * scaleY
        // Subtract the offset to get the new crop origin
        const newX = pointerX - dragStart.x
        const newY = pointerY - dragStart.y
        // Constrain to image bounds
        const constrainedX = Math.max(0, Math.min(newX, imageSize.width - cropArea.width))
        const constrainedY = Math.max(0, Math.min(newY, imageSize.height - cropArea.height))
        const newCrop = { ...cropArea, x: constrainedX, y: constrainedY }
        setCropArea(newCrop)
        onCropAreaChange(newCrop)
      } else if (isResizing) {
        const deltaX = (e.clientX - dragStart.x) * scaleX
        
        handleResize(isResizing, deltaX)
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
  }, [isDragging, isResizing, dragStart, cropArea, imageSize, onCropAreaChange, handleResize])

  return (
    <div className="crop-editor">
      {/* Image with crop overlay */}
      <div className="relative inline-block" ref={containerRef}>
        {/* DPI Warning - positioned absolutely to not affect layout */}
        {showDPIWarning && dpiInfo && (
          <div 
            className="absolute bottom-2 left-2 right-2 z-20 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded shadow-lg"
            data-testid="dpi-warning"
          >
            <p className="font-semibold text-xs">Resolution Warning</p>
            <p className="text-xs">
              Current crop area provides approximately {Math.round(dpiInfo.minDPI)} DPI. 
              For optimal print quality, 300 DPI is recommended. 
              Consider increasing the crop area size or using a higher resolution image.
            </p>
          </div>
        )}
        
        {/* View mode toggle controls */}
        <div 
          data-testid="view-mode-controls"
          className="absolute top-2 right-2 z-10 flex gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-md"
        >
          <button
            onClick={() => setViewMode('full')}
            className={`p-2 rounded transition-all ${
              viewMode === 'full' 
                ? 'bg-blue-500 text-white ring-2 ring-blue-600' 
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            aria-label="Show full image"
            title="Show full image"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              className="w-5 h-5"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M9 3v18"/>
              <path d="M15 3v18"/>
              <path d="M3 9h18"/>
              <path d="M3 15h18"/>
            </svg>
          </button>
          <button
            onClick={() => setViewMode('crop')}
            className={`p-2 rounded transition-all ${
              viewMode === 'crop' 
                ? 'bg-blue-500 text-white ring-2 ring-blue-600' 
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            aria-label="Zoom to crop"
            title="Zoom to crop area"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              className="w-5 h-5"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
              <path d="M11 8v6"/>
              <path d="M8 11h6"/>
            </svg>
          </button>
        </div>
        
        {/* Overflow container to clip zoomed content */}
        <div className="overflow-hidden relative inline-block">
          <div
            data-testid="image-container"
            className="transition-transform duration-300 ease-in-out origin-center relative inline-block"
            style={{
              transform: imageContainerTransform,
            }}
          >
            <img
              ref={imageRef}
              src={processedImageUrl}
              alt="Processed"
            data-testid="processed-image"
            className="max-w-full max-h-[70vh] object-contain"
            style={{ display: 'block' }}
          />
          
          {/* Dark overlay outside crop area */}
          {imageRef.current && (
            <>
              {/* Consistent dark overlay using four divs */}
              {/* Top overlay */}
              <div
                data-testid="crop-overlay-top"
                className="absolute left-0 right-0 bg-black/50 pointer-events-none"
                style={{
                  top: 0,
                  height: `${(cropArea.y / imageSize.height) * 100}%`,
                }}
              />
              {/* Bottom overlay */}
              <div
                data-testid="crop-overlay-bottom"
                className="absolute left-0 right-0 bg-black/50 pointer-events-none"
                style={{
                  top: `${((cropArea.y + cropArea.height) / imageSize.height) * 100}%`,
                  height: `${100 - ((cropArea.y + cropArea.height) / imageSize.height) * 100}%`,
                }}
              />
              {/* Left overlay */}
              <div
                data-testid="crop-overlay-left"
                className="absolute bg-black/50 pointer-events-none"
                style={{
                  left: 0,
                  width: `${(cropArea.x / imageSize.width) * 100}%`,
                  top: `${(cropArea.y / imageSize.height) * 100}%`,
                  height: `${(cropArea.height / imageSize.height) * 100}%`,
                }}
              />
              {/* Right overlay */}
              <div
                data-testid="crop-overlay-right"
                className="absolute bg-black/50 pointer-events-none"
                style={{
                  left: `${((cropArea.x + cropArea.width) / imageSize.width) * 100}%`,
                  width: `${100 - ((cropArea.x + cropArea.width) / imageSize.width) * 100}%`,
                  top: `${(cropArea.y / imageSize.height) * 100}%`,
                  height: `${(cropArea.height / imageSize.height) * 100}%`,
                }}
              />
            </>
          )}
          
          {/* Crop rectangle overlay */}
          {imageRef.current && (
            <div
              data-testid="crop-rectangle"
              className="absolute border-2 border-blue-500 cursor-move"
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
        </div>
      </div>
    </div>
  )
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
