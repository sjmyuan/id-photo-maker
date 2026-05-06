/**
 * Type definitions for ID Photo Maker
 */

/**
 * Status of the face detection check performed after image upload.
 * - 'idle'      : no image has been uploaded yet
 * - 'detecting' : detection request is in-flight
 * - 'valid'     : exactly one face found – image is usable
 * - 'invalid'   : zero or multiple faces found – image is unusable
 */
export type FaceDetectionStatus = 'idle' | 'detecting' | 'valid' | 'invalid'

/**
 * Printer margins in millimeters
 * Represents the non-printable area at the edges of paper where printers cannot physically print
 */
export interface PaperMargins {
  top: number    // Top margin in mm
  bottom: number // Bottom margin in mm
  left: number   // Left margin in mm
  right: number  // Right margin in mm
}
