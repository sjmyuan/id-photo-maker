/**
 * ImagePreview Component
 * A reusable component for displaying images with consistent styling
 */

export interface ImagePreviewProps {
  imageUrl: string // URL of the image to display
  alt?: string // Alt text for the image
}

export function ImagePreview({ imageUrl, alt = 'Preview image' }: ImagePreviewProps) {
  return (
    <div 
      className="bg-gray-100 p-4 rounded-lg flex justify-center items-center"
      data-testid="image-preview-container"
    >
      <img 
        src={imageUrl} 
        alt={alt} 
        className="max-w-full max-h-64 object-contain border border-gray-300 shadow-sm"
        data-testid="image-preview"
      />
    </div>
  )
}
