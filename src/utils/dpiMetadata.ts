/**
 * DPI Metadata Utility
 * Embeds DPI metadata into PNG image blobs
 * 
 * Note: PNG format stores DPI as pixels per meter in pHYs chunk.
 * Formula: pixels_per_meter = dpi * 39.3701 (inches to meters conversion)
 */

/**
 * Create PNG pHYs chunk with DPI metadata
 * @param dpi - DPI value
 * @returns Uint8Array containing the pHYs chunk
 */
function createPHYsChunk(dpi: number): Uint8Array {
  // Convert DPI to pixels per meter
  const pixelsPerMeter = Math.round(dpi * 39.3701)
  
  // pHYs chunk structure:
  // - 4 bytes: chunk length (9)
  // - 4 bytes: chunk type "pHYs"
  // - 4 bytes: pixels per unit, X axis
  // - 4 bytes: pixels per unit, Y axis  
  // - 1 byte: unit specifier (1 = meter)
  // - 4 bytes: CRC
  
  const chunk = new Uint8Array(21)
  const view = new DataView(chunk.buffer)
  
  // Length (9 bytes of data)
  view.setUint32(0, 9, false)
  
  // Chunk type "pHYs"
  chunk[4] = 0x70  // 'p'
  chunk[5] = 0x48  // 'H'
  chunk[6] = 0x59  // 'Y'
  chunk[7] = 0x73  // 's'
  
  // Pixels per unit X
  view.setUint32(8, pixelsPerMeter, false)
  
  // Pixels per unit Y
  view.setUint32(12, pixelsPerMeter, false)
  
  // Unit specifier (1 = meter)
  chunk[16] = 1
  
  // Calculate CRC for chunk type + data
  const crc = calculateCRC(chunk.slice(4, 17))
  view.setUint32(17, crc, false)
  
  return chunk
}

/**
 * Calculate CRC32 checksum for PNG chunks
 * @param data - Data to calculate CRC for
 * @returns CRC32 checksum
 */
function calculateCRC(data: Uint8Array): number {
  let crc = 0xFFFFFFFF
  
  for (let i = 0; i < data.length; i++) {
    crc = crc ^ data[i]
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xEDB88320
      } else {
        crc = crc >>> 1
      }
    }
  }
  
  return (crc ^ 0xFFFFFFFF) >>> 0
}

/**
 * Embed DPI metadata into a PNG blob
 * 
 * @param blob - The PNG image blob
 * @param dpi - The DPI value to embed
 * @returns A new PNG blob with embedded DPI metadata
 * 
 * Implementation:
 * 1. Load image to canvas to get pixel data
 * 2. Convert canvas to PNG blob
 * 3. Parse PNG binary and inject pHYs chunk after IHDR
 */
export async function embedDPIMetadata(blob: Blob, dpi: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)

    img.onload = async () => {
      try {
        // Create canvas with same dimensions as image
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          throw new Error('Failed to get canvas context')
        }

        // Draw the image to canvas
        ctx.drawImage(img, 0, 0)

        // Convert canvas to blob
        canvas.toBlob(
          async (resultBlob) => {
            URL.revokeObjectURL(url)
            if (!resultBlob) {
              reject(new Error('Failed to create blob from canvas'))
              return
            }

            try {
              // Read the PNG data
              const arrayBuffer = await resultBlob.arrayBuffer()
              const pngData = new Uint8Array(arrayBuffer)

              // PNG signature is 8 bytes
              const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
              
              // Verify PNG signature
              if (pngData.length < 8 || !pngData.slice(0, 8).every((v, i) => v === PNG_SIGNATURE[i])) {
                reject(new Error('Invalid PNG file'))
                return
              }

              // Find IHDR chunk (should be right after signature)
              // IHDR structure: 4 bytes length + 4 bytes "IHDR" + data + 4 bytes CRC
              const ihdrLength = new DataView(pngData.buffer).getUint32(8, false)
              const ihdrEnd = 8 + 4 + 4 + ihdrLength + 4 // length field + type + data + CRC

              // Create pHYs chunk
              const physChunk = createPHYsChunk(dpi)

              // Construct new PNG: signature + IHDR + pHYs + rest
              const newPng = new Uint8Array(pngData.length + physChunk.length)
              newPng.set(pngData.slice(0, ihdrEnd), 0)
              newPng.set(physChunk, ihdrEnd)
              newPng.set(pngData.slice(ihdrEnd), ihdrEnd + physChunk.length)

              // Create new blob with DPI metadata
              const finalBlob = new Blob([newPng], { type: 'image/png' })
              resolve(finalBlob)
            } catch (error) {
              reject(error)
            }
          },
          'image/png',
          1.0 // Maximum quality
        )
      } catch (error) {
        URL.revokeObjectURL(url)
        reject(error)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}
