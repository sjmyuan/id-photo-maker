export interface ValidationResult {
  isValid: boolean
  fileSize: number
  needsScaling: boolean
  dimensions: {
    width: number
    height: number
  }
  errors: string[]
  warnings: string[]
}

const VALID_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes

/**
 * Validates an image file for size, format, and dimensions
 * Returns validation result with errors and warnings
 */
export async function validateImageFile(file: File): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Check file type
  if (!VALID_MIME_TYPES.includes(file.type)) {
    errors.push('Invalid file type. Only JPEG, PNG, and WebP are supported.')
    return {
      isValid: false,
      fileSize: file.size,
      needsScaling: false,
      dimensions: { width: 0, height: 0 },
      errors,
      warnings,
    }
  }

  // Check file size
  const needsScaling = file.size > MAX_FILE_SIZE
  if (needsScaling) {
    warnings.push('File size exceeds 10MB. Image will be automatically scaled down.')
  }

  // Load image to get dimensions
  try {
    const dimensions = await loadImageDimensions(file)
    
    return {
      isValid: true,
      fileSize: file.size,
      needsScaling,
      dimensions,
      errors,
      warnings,
    }
  } catch {
    errors.push('Failed to load image file.')
    return {
      isValid: false,
      fileSize: file.size,
      needsScaling: false,
      dimensions: { width: 0, height: 0 },
      errors,
      warnings,
    }
  }
}

/**
 * Loads image and extracts dimensions
 * @private
 */
function loadImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({
        width: img.width,
        height: img.height,
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}
