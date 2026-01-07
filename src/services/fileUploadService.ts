/**
 * File Upload Service
 * Single Responsibility: Handle file upload operations and URL management
 */

export interface UploadedFile {
  file: File
  url: string
}

/**
 * Service for handling file uploads and URL creation
 */
export class FileUploadService {
  private uploadedUrls: Set<string> = new Set()

  /**
   * Handle file upload and create object URL
   */
  handleUpload(file: File): UploadedFile {
    const url = URL.createObjectURL(file)
    this.uploadedUrls.add(url)

    return {
      file,
      url,
    }
  }

  /**
   * Revoke a specific URL
   */
  revokeUrl(url: string): void {
    if (this.uploadedUrls.has(url)) {
      URL.revokeObjectURL(url)
      this.uploadedUrls.delete(url)
    }
  }

  /**
   * Revoke all tracked URLs
   */
  revokeAllUrls(): void {
    this.uploadedUrls.forEach((url) => {
      URL.revokeObjectURL(url)
    })
    this.uploadedUrls.clear()
  }

  /**
   * Create a temporary URL for a file (not tracked)
   */
  createTemporaryUrl(file: File): string {
    return URL.createObjectURL(file)
  }

  /**
   * Create a temporary URL from a blob (not tracked)
   */
  createTemporaryBlobUrl(blob: Blob): string {
    return URL.createObjectURL(blob)
  }

  /**
   * Cleanup - call when service is no longer needed
   */
  cleanup(): void {
    this.revokeAllUrls()
  }
}
