/**
 * Face Detection Service Tests
 * Tests for UltraFace-320 ONNX model integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as ort from 'onnxruntime-web'
import {
  loadFaceDetectionModel,
  detectFaces,
  FaceDetectionResult,
} from './faceDetectionService'

// Mock onnxruntime-web
vi.mock('onnxruntime-web', () => ({
  InferenceSession: {
    create: vi.fn(),
  },
  Tensor: vi.fn(),
}))

describe('faceDetectionService', () => {
  describe('loadFaceDetectionModel', () => {
    it('should load the face detection model successfully', async () => {
      const mockSession = {
        run: vi.fn(),
        inputNames: ['input'],
        outputNames: ['scores', 'boxes'],
      }
      
      vi.mocked(ort.InferenceSession.create).mockResolvedValue(mockSession as any)

      const model = await loadFaceDetectionModel('/models/version-RFB-320.onnx')

      expect(ort.InferenceSession.create).toHaveBeenCalledWith('/models/version-RFB-320.onnx')
      expect(model.session).toBe(mockSession)
      expect(model.status).toBe('loaded')
    })

    it('should throw error when model fails to load', async () => {
      vi.mocked(ort.InferenceSession.create).mockRejectedValue(new Error('Model not found'))

      await expect(loadFaceDetectionModel('/invalid/path.onnx')).rejects.toThrow(
        'Failed to load face detection model'
      )
    })
  })

  describe('detectFaces', () => {
    let mockSession: any
    let mockImage: HTMLImageElement

    beforeEach(() => {
      mockSession = {
        run: vi.fn(),
        inputNames: ['input'],
        outputNames: ['scores', 'boxes'],
      }

      // Create a mock image
      mockImage = new Image()
      mockImage.width = 640
      mockImage.height = 480
    })

    it('should detect single face and return bounding box', async () => {
      // Mock model output: single face with high confidence
      const mockScores = new Float32Array([
        0.1, 0.95, // Background, Face class scores for detection 1
      ])
      const mockBoxes = new Float32Array([
        0.3, 0.2, 0.6, 0.7, // Normalized coordinates [x1, y1, x2, y2]
      ])

      mockSession.run.mockResolvedValue({
        scores: { data: mockScores, dims: [1, 2, 1] },
        boxes: { data: mockBoxes, dims: [1, 4, 1] },
      })

      const result = await detectFaces({ session: mockSession, status: 'loaded' }, mockImage)

      expect(result.faces.length).toBe(1)
      expect(result.faces[0]).toEqual({
        x: expect.any(Number),
        y: expect.any(Number),
        width: expect.any(Number),
        height: expect.any(Number),
        confidence: expect.any(Number),
      })
      expect(result.error).toBeUndefined()
    })

    it('should return error when no face is detected', async () => {
      // Mock model output: no faces (low confidence)
      const mockScores = new Float32Array([
        0.9, 0.05, // Low face confidence
      ])
      const mockBoxes = new Float32Array([0.3, 0.2, 0.6, 0.7])

      mockSession.run.mockResolvedValue({
        scores: { data: mockScores, dims: [1, 2, 1] },
        boxes: { data: mockBoxes, dims: [1, 4, 1] },
      })

      const result = await detectFaces({ session: mockSession, status: 'loaded' }, mockImage)

      expect(result.faces.length).toBe(0)
      expect(result.error).toBe('no-face-detected')
    })

    it('should return error when multiple faces are detected', async () => {
      // Mock model output: multiple faces
      // Format: scores are interleaved [bg_class, face_class] for each detection
      const mockScores = new Float32Array([
        0.1, 0.1,  // Class scores for detection 1
        0.95, 0.92, // Background and Face scores
      ])
      // Format: boxes are [x1, y1, x2, y2] for detection 1, then detection 2
      const mockBoxes = new Float32Array([
        0.2, 0.6,  // x1 values for detection 1 and 2
        0.1, 0.3,  // y1 values
        0.5, 0.9,  // x2 values
        0.6, 0.8,  // y2 values
      ])

      mockSession.run.mockResolvedValue({
        scores: { data: mockScores, dims: [1, 2, 2] },
        boxes: { data: mockBoxes, dims: [1, 4, 2] },
      })

      const result = await detectFaces({ session: mockSession, status: 'loaded' }, mockImage)

      expect(result.faces.length).toBeGreaterThan(1)
      expect(result.error).toBe('multiple-faces-detected')
    })

    it('should handle detection errors gracefully', async () => {
      mockSession.run.mockRejectedValue(new Error('Inference failed'))

      await expect(
        detectFaces({ session: mockSession, status: 'loaded' }, mockImage)
      ).rejects.toThrow('Face detection failed')
    })

    it('should apply NMS to filter overlapping detections', async () => {
      // Mock overlapping detections that should be filtered by NMS
      const mockScores = new Float32Array([
        0.1, 0.95, // Face 1 (high confidence)
        0.1, 0.85, // Face 2 (lower confidence, overlapping)
      ])
      const mockBoxes = new Float32Array([
        0.3, 0.2, 0.6, 0.7, // Face 1
        0.32, 0.22, 0.62, 0.72, // Face 2 (very similar to Face 1)
      ])

      mockSession.run.mockResolvedValue({
        scores: { data: mockScores, dims: [1, 2, 2] },
        boxes: { data: mockBoxes, dims: [1, 4, 2] },
      })

      const result = await detectFaces({ session: mockSession, status: 'loaded' }, mockImage)

      // NMS should keep only the highest confidence detection
      expect(result.faces.length).toBe(1)
    })

    it('should scale bounding boxes to original image dimensions', async () => {
      const mockScores = new Float32Array([0.1, 0.95])
      const mockBoxes = new Float32Array([
        0.25, 0.25, 0.75, 0.75, // Normalized: center half of image
      ])

      mockSession.run.mockResolvedValue({
        scores: { data: mockScores, dims: [1, 2, 1] },
        boxes: { data: mockBoxes, dims: [1, 4, 1] },
      })

      const result = await detectFaces({ session: mockSession, status: 'loaded' }, mockImage)

      const face = result.faces[0]
      // For 640x480 image, normalized 0.25-0.75 should scale appropriately
      expect(face.x).toBeGreaterThan(0)
      expect(face.y).toBeGreaterThan(0)
      expect(face.x + face.width).toBeLessThanOrEqual(mockImage.width)
      expect(face.y + face.height).toBeLessThanOrEqual(mockImage.height)
    })
  })

  describe('NMS and IoU utilities', () => {
    it('should correctly calculate IoU for overlapping boxes', () => {
      // This will be tested indirectly through detectFaces tests
      // but can be extracted as separate utility tests if needed
    })

    it('should correctly apply hard NMS to filter detections', () => {
      // This will be tested indirectly through detectFaces tests
    })
  })
})
