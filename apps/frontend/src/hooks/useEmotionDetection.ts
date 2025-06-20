import { useState, useEffect, useRef, useCallback } from 'react';
import { useEmotionDetection } from '../contexts/AppContext';

export interface EmotionDetectionResult {
  emotion: string;
  confidence: number;
  allEmotions: Record<string, number>;
  timestamp: number;
}

export interface UseEmotionDetectionOptions {
  autoStart?: boolean;
  interval?: number;
  confidenceThreshold?: number;
  deviceId?: string;
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
}

export interface UseEmotionDetectionReturn {
  // Camera state
  stream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  isStreaming: boolean;
  
  // Detection state
  isDetecting: boolean;
  currentResult: EmotionDetectionResult | null;
  error: string | null;
  
  // Controls
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  startDetection: () => void;
  stopDetection: () => void;
  captureFrame: () => Promise<EmotionDetectionResult | null>;
  
  // Device management
  availableDevices: MediaDeviceInfo[];
  switchDevice: (deviceId: string) => Promise<void>;
  
  // Settings
  updateSettings: (settings: Partial<UseEmotionDetectionOptions>) => void;
}

export const useEmotionDetectionCamera = (
  options: UseEmotionDetectionOptions = {}
): UseEmotionDetectionReturn => {
  const {
    autoStart = false,
    interval = 5000,
    confidenceThreshold = 0.6,
    deviceId,
    width = 640,
    height = 480,
    facingMode = 'user',
  } = options;

  // App context
  const { addEmotionDetection, setDetecting, setError } = useEmotionDetection();

  // Local state
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [currentResult, setCurrentResult] = useState<EmotionDetectionResult | null>(null);
  const [error, setErrorState] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [settings, setSettings] = useState(options);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Get available camera devices
  const getAvailableDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableDevices(videoDevices);
    } catch (err) {
      console.error('Failed to get available devices:', err);
    }
  }, []);

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      setErrorState(null);
      setError(null);

      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: settings.deviceId || deviceId,
          width: { ideal: settings.width || width },
          height: { ideal: settings.height || height },
          facingMode: settings.facingMode || facingMode,
        },
        audio: false,
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = newStream;
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsStreaming(true);
        };
      }

      // Get available devices after successful stream
      await getAvailableDevices();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start camera';
      setErrorState(errorMessage);
      setError(errorMessage);
      console.error('Camera start error:', err);
    }
  }, [settings, deviceId, width, height, facingMode, getAvailableDevices, setError]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    setIsStreaming(false);
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Capture frame from video and convert to base64
  const captureFrame = useCallback(async (): Promise<EmotionDetectionResult | null> => {
    if (!videoRef.current || !isStreaming) {
      return null;
    }

    try {
      // Create canvas if not exists
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }

      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Send to emotion detection API
      const response = await fetch('/api/emotion/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData.split(',')[1], // Remove data:image/jpeg;base64, prefix
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Detection API error: ${response.status}`);
      }

      const data = await response.json();
      
      const result: EmotionDetectionResult = {
        emotion: data.emotion,
        confidence: data.confidence,
        allEmotions: data.allEmotions || {},
        timestamp: Date.now(),
      };

      setCurrentResult(result);
      
      // Add to global state if confidence is high enough
      if (result.confidence >= (settings.confidenceThreshold || confidenceThreshold)) {
        addEmotionDetection(result.emotion, result.confidence);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to capture frame';
      setErrorState(errorMessage);
      setError(errorMessage);
      console.error('Frame capture error:', err);
      return null;
    }
  }, [isStreaming, settings.confidenceThreshold, confidenceThreshold, addEmotionDetection, setError]);

  // Start detection loop
  const startDetection = useCallback(() => {
    if (isDetecting || !isStreaming) {
      return;
    }

    setIsDetecting(true);
    setDetecting(true);
    
    const runDetection = async () => {
      await captureFrame();
      
      if (detectionIntervalRef.current) {
        detectionIntervalRef.current = setTimeout(runDetection, settings.interval || interval);
      }
    };

    runDetection();
  }, [isDetecting, isStreaming, captureFrame, settings.interval, interval, setDetecting]);

  // Stop detection loop
  const stopDetection = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearTimeout(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    
    setIsDetecting(false);
    setDetecting(false);
  }, [setDetecting]);

  // Switch camera device
  const switchDevice = useCallback(async (newDeviceId: string) => {
    const wasDetecting = isDetecting;
    
    if (wasDetecting) {
      stopDetection();
    }
    
    setSettings(prev => ({ ...prev, deviceId: newDeviceId }));
    
    // Restart camera with new device
    await startCamera();
    
    if (wasDetecting) {
      setTimeout(startDetection, 1000); // Small delay to ensure camera is ready
    }
  }, [isDetecting, stopDetection, startCamera, startDetection]);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<UseEmotionDetectionOptions>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Auto-start camera if enabled
  useEffect(() => {
    if (autoStart) {
      startCamera();
    }
    
    return () => {
      stopDetection();
      stopCamera();
    };
  }, [autoStart, startCamera, stopDetection, stopCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (detectionIntervalRef.current) {
        clearTimeout(detectionIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle visibility change to pause/resume detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (isDetecting) {
          stopDetection();
        }
      } else {
        if (isStreaming && !isDetecting) {
          // Resume detection after a short delay
          setTimeout(startDetection, 1000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isDetecting, isStreaming, stopDetection, startDetection]);

  return {
    // Camera state
    stream,
    videoRef,
    isStreaming,
    
    // Detection state
    isDetecting,
    currentResult,
    error,
    
    // Controls
    startCamera,
    stopCamera,
    startDetection,
    stopDetection,
    captureFrame,
    
    // Device management
    availableDevices,
    switchDevice,
    
    // Settings
    updateSettings,
  };
};
