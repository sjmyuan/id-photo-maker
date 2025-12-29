/**
 * Scale an image file to a target file size by reducing dimensions
 * @param file - The image file to scale
 * @param targetMaxSizeMB - The target maximum file size in MB
 * @returns A promise that resolves to the scaled image as a Blob
 */
export async function scaleImageToTarget(
  file: File,
  targetMaxSizeMB: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      try {
        // Calculate scale factor based on file size ratio
        const currentSizeMB = file.size / (1024 * 1024)
        const sizeRatio = targetMaxSizeMB / currentSizeMB
        const scaleFactor = Math.sqrt(sizeRatio) * 0.9 // Slightly aggressive to ensure we're under target
        
        // Calculate new dimensions maintaining aspect ratio
        const newWidth = Math.floor(img.width * scaleFactor)
        const newHeight = Math.floor(img.height * scaleFactor)
        
        // Create canvas with new dimensions
        const canvas = document.createElement('canvas')
        canvas.width = newWidth
        canvas.height = newHeight
        
        // Draw scaled image
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }
        
        ctx.drawImage(img, 0, 0, newWidth, newHeight)
        
        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to convert canvas to blob'))
            }
          },
          file.type,
          0.9 // Quality setting for JPEG
        )
      } catch (error) {
        reject(error)
      } finally {
        URL.revokeObjectURL(img.src)
      }
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error('Failed to load image'))
    }
    
    img.src = URL.createObjectURL(file)
  })
}
