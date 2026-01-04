import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useModelLoading } from './useModelLoading'
import * as faceDetectionService from '../services/faceDetectionService'
import * as u2netService from '../services/u2netService'
import type * as ort from 'onnxruntime-web'

// Mock the service modules
vi.mock('../services/faceDetectionService')
vi.mock('../services/u2netService')

describe('useModelLoading', () => {
  const mockU2NetModel: u2netService.U2NetModel = {
    session: {} as ort.InferenceSession,
    status: 'loaded',
  }
  
  const mockFaceDetectionModel: faceDetectionService.FaceDetectionModel = {
    detector: {} as faceDetectionService.FaceDetectionModel['detector'],
    status: 'loaded',
  }

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
    
    // Reset localStorage
    localStorage.clear()
    
    // Setup default mock implementations
    vi.mocked(u2netService.loadU2NetModel).mockResolvedValue(mockU2NetModel)
    vi.mocked(faceDetectionService.loadFaceDetectionModel).mockResolvedValue(mockFaceDetectionModel)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should start with loading states true and models null', () => {
      const { result } = renderHook(() => useModelLoading())

      expect(result.current.isLoadingU2Net).toBe(true)
      expect(result.current.isLoadingFaceDetection).toBe(true)
      expect(result.current.u2netModel).toBeNull()
      expect(result.current.faceDetectionModel).toBeNull()
    })
  })

  describe('model loading', () => {
    it('should load both models successfully', async () => {
      const { result } = renderHook(() => useModelLoading())

      await waitFor(() => {
        expect(result.current.isLoadingU2Net).toBe(false)
        expect(result.current.isLoadingFaceDetection).toBe(false)
      })

      expect(result.current.u2netModel).toBe(mockU2NetModel)
      expect(result.current.faceDetectionModel).toBe(mockFaceDetectionModel)
      expect(u2netService.loadU2NetModel).toHaveBeenCalledTimes(1)
      expect(faceDetectionService.loadFaceDetectionModel).toHaveBeenCalledTimes(1)
    })

    it('should use default u2netp model when no localStorage value is set', async () => {
      renderHook(() => useModelLoading())

      await waitFor(() => {
        expect(u2netService.loadU2NetModel).toHaveBeenCalledWith('/u2netp.onnx')
      })
    })

    it('should use u2net model from localStorage when set', async () => {
      localStorage.setItem('selectedU2NetModel', 'u2net')
      
      renderHook(() => useModelLoading())

      await waitFor(() => {
        expect(u2netService.loadU2NetModel).toHaveBeenCalledWith('/u2net.onnx')
      })
    })

    it('should handle U2Net model loading failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new Error('Failed to load U2Net model')
      vi.mocked(u2netService.loadU2NetModel).mockRejectedValue(error)

      const { result } = renderHook(() => useModelLoading())

      await waitFor(() => {
        expect(result.current.isLoadingU2Net).toBe(false)
      })

      expect(result.current.u2netModel).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load U2Net model:', error)
      
      consoleErrorSpy.mockRestore()
    })

    it('should handle face detection model loading failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new Error('Failed to load face detection model')
      vi.mocked(faceDetectionService.loadFaceDetectionModel).mockRejectedValue(error)

      const { result } = renderHook(() => useModelLoading())

      await waitFor(() => {
        expect(result.current.isLoadingFaceDetection).toBe(false)
      })

      expect(result.current.faceDetectionModel).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load face detection model:', error)
      
      consoleErrorSpy.mockRestore()
    })

    it('should continue loading other models if one fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new Error('U2Net failed')
      vi.mocked(u2netService.loadU2NetModel).mockRejectedValue(error)

      const { result } = renderHook(() => useModelLoading())

      await waitFor(() => {
        expect(result.current.isLoadingU2Net).toBe(false)
        expect(result.current.isLoadingFaceDetection).toBe(false)
      })

      // U2Net should fail but face detection should succeed
      expect(result.current.u2netModel).toBeNull()
      expect(result.current.faceDetectionModel).toBe(mockFaceDetectionModel)
      
      consoleErrorSpy.mockRestore()
    })
  })

  describe('loading state transitions', () => {
    it('should transition isLoadingU2Net from true to false', async () => {
      const { result } = renderHook(() => useModelLoading())

      expect(result.current.isLoadingU2Net).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoadingU2Net).toBe(false)
      })
    })

    it('should transition isLoadingFaceDetection from true to false', async () => {
      const { result } = renderHook(() => useModelLoading())

      expect(result.current.isLoadingFaceDetection).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoadingFaceDetection).toBe(false)
      })
    })

    it('should set loading states to false even when models fail to load', async () => {
      vi.mocked(u2netService.loadU2NetModel).mockRejectedValue(new Error('Failed'))
      vi.mocked(faceDetectionService.loadFaceDetectionModel).mockRejectedValue(new Error('Failed'))
      vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useModelLoading())

      await waitFor(() => {
        expect(result.current.isLoadingU2Net).toBe(false)
        expect(result.current.isLoadingFaceDetection).toBe(false)
      })

      vi.mocked(console.error).mockRestore()
    })
  })

  describe('hook lifecycle', () => {
    it('should only load models once on mount', async () => {
      const { result, rerender } = renderHook(() => useModelLoading())

      await waitFor(() => {
        expect(result.current.isLoadingU2Net).toBe(false)
        expect(result.current.isLoadingFaceDetection).toBe(false)
      })

      // Rerender the hook
      rerender()

      // Should not call load functions again
      expect(u2netService.loadU2NetModel).toHaveBeenCalledTimes(1)
      expect(faceDetectionService.loadFaceDetectionModel).toHaveBeenCalledTimes(1)
    })
  })
})
