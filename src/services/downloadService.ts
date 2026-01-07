/**
 * Download Service
 * Single Responsibility: Handle file download operations
 */

import { embedDPIMetadata } from '../utils/dpiMetadata'

/**
 * Service for handling file downloads
 */
export class DownloadService {
  /**
   * Download image from URL with DPI metadata
   */
  async downloadImageFromUrl(
    imageUrl: string,
    filename: string,
    dpi: number = 300
  ): Promise<void> {
    // Fetch the image blob
    const response = await fetch(imageUrl)
    const blob = await response.blob()

    // Embed DPI metadata
    const blobWithDPI = await embedDPIMetadata(blob, dpi)

    // Create download link
    this.triggerDownload(blobWithDPI, filename)
  }

  /**
   * Download canvas as image with DPI metadata
   */
  async downloadCanvas(
    canvas: HTMLCanvasElement,
    filename: string,
    dpi: number = 300,
    mimeType: string = 'image/png'
  ): Promise<void> {
    const blob = await this.canvasToBlob(canvas, mimeType)
    const blobWithDPI = await embedDPIMetadata(blob, dpi)

    this.triggerDownload(blobWithDPI, filename)
  }

  /**
   * Download blob directly
   */
  downloadBlob(blob: Blob, filename: string): void {
    this.triggerDownload(blob, filename)
  }

  /**
   * Convert canvas to blob
   */
  private async canvasToBlob(canvas: HTMLCanvasElement, mimeType: string): Promise<Blob> {
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create blob from canvas'))
          }
        },
        mimeType
      )
    })
  }

  /**
   * Trigger browser download
   */
  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }
}
