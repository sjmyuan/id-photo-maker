/**
 * Face Detection Service Tests
 * Tests for TensorFlow.js face-detection integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as faceDetection from '@tensorflow-models/face-detection'
import {
  loadFaceDetectionModel,
  detectFaces,
} from './faceDetectionService'

// Mock @tensorflow-models/face-detection
vi.mock('@tensorflow-models/face-detection', () => ({
  SupportedModels: {
    MediaPipeFaceDetector: 'MediaPipeFaceDetector',
  },
  createDetector: vi.fn(),
}))

describe('faceDetectionService', () => {
  describe('loadFaceDetectionModel', () => {
    it('should load the face detection model successfully', async () => {
      const mockDetector = {
        estimateFaces: vi.fn(),
        dispose: vi.fn(),
      }
      
      vi.mocked(faceDetection.createDetector).mockResolvedValue(mockDetector as unknown as faceDetection.FaceDetector)

      const model = await loadFaceDetectionModel()

      expect(faceDetection.createDetector).toHaveBeenCalledWith(
        faceDetection.SupportedModels.MediaPipeFaceDetector,
        expect.any(Object)
      )
      expect(model.detector).toBe(mockDetector)
      expect(model.status).toBe('loaded')
    })

    it('should throw error when model fails to load', async () => {
      vi.mocked(faceDetection.createDetector).mockRejectedValue(new Error('Model not found'))

      await expect(loadFaceDetectionModel()).rejects.toThrow(
        'Failed to load face detection model'
      )
    })
  })

  describe('detectFaces', () => {
    let mockDetector: {
      estimateFaces: ReturnType<typeof vi.fn>
      dispose: ReturnType<typeof vi.fn>
      reset: ReturnType<typeof vi.fn>
    }
    let mockImage: HTMLImageElement

    beforeEach(() => {
      mockDetector = {
        estimateFaces: vi.fn(),
        dispose: vi.fn(),
        reset: vi.fn(),
      }

      // Create a mock image
      mockImage = new Image()
      mockImage.width = 640
      mockImage.height = 480
    })

    it('should detect single face and return bounding box', async () => {
      // Mock TensorFlow face detection output
      const mockFaces = [
        {
          box: {
            xMin: 192,
            yMin: 96,
            width: 256,
            height: 288,
          },
          keypoints: [],
        },
      ]

      mockDetector.estimateFaces.mockResolvedValue(mockFaces)

      const result = await detectFaces(
        { detector: mockDetector as unknown as faceDetection.FaceDetector, status: 'loaded' },
        mockImage
      )

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
      // Mock TensorFlow output: no faces
      mockDetector.estimateFaces.mockResolvedValue([])

      const result = await detectFaces(
        { detector: mockDetector as unknown as faceDetection.FaceDetector, status: 'loaded' },
        mockImage
      )

      expect(result.faces.length).toBe(0)
      expect(result.error).toBe('no-face-detected')
    })

    it('should return error when multiple faces are detected', async () => {
      // Mock TensorFlow output: multiple faces
      const mockFaces = [
        {
          box: {
            xMin: 100,
            yMin: 50,
            width: 150,
            height: 200,
          },
          keypoints: [],
        },
        {
          box: {
            xMin: 400,
            yMin: 150,
            width: 150,
            height: 200,
          },
          keypoints: [],
        },
      ]

      mockDetector.estimateFaces.mockResolvedValue(mockFaces)

      const result = await detectFaces(
        { detector: mockDetector as unknown as faceDetection.FaceDetector, status: 'loaded' },
        mockImage
      )

      expect(result.faces.length).toBeGreaterThan(1)
      expect(result.error).toBe('multiple-faces-detected')
    })

    it('should handle detection errors gracefully', async () => {
      mockDetector.estimateFaces.mockRejectedValue(new Error('Inference failed'))

      await expect(
        detectFaces(
          { detector: mockDetector as unknown as faceDetection.FaceDetector, status: 'loaded' },
          mockImage
        )
      ).rejects.toThrow('Face detection failed')
    })

    it('should use default confidence threshold of 0.7', async () => {
      const mockFaces = [
        {
          box: {
            xMin: 100,
            yMin: 100,
            width: 200,
            height: 200,
          },
          keypoints: [],
        },
      ]

      mockDetector.estimateFaces.mockResolvedValue(mockFaces)

      await detectFaces(
        { detector: mockDetector as unknown as faceDetection.FaceDetector, status: 'loaded' },
        mockImage
      )

      expect(mockDetector.estimateFaces).toHaveBeenCalledWith(mockImage)
    })

    it('should scale bounding boxes correctly', async () => {
      const mockFaces = [
        {
          box: {
            xMin: 160,
            yMin: 120,
            width: 320,
            height: 240,
          },
          keypoints: [],
        },
      ]

      mockDetector.estimateFaces.mockResolvedValue(mockFaces)

      const result = await detectFaces(
        { detector: mockDetector as unknown as faceDetection.FaceDetector, status: 'loaded' },
        mockImage
      )

      const face = result.faces[0]
      expect(face.x).toBeGreaterThanOrEqual(0)
      expect(face.y).toBeGreaterThanOrEqual(0)
      expect(face.x + face.width).toBeLessThanOrEqual(mockImage.width)
      expect(face.y + face.height).toBeLessThanOrEqual(mockImage.height)
    })
  })
})
