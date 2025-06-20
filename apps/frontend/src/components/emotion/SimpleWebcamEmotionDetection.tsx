'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '../toast/SimpleToastProvider';
import { type EmotionType } from '@repo/shared-types';
import { useApp, type EmotionDetection } from '../../contexts/AppContext';

interface CameraSettings {
  width: number;
  height: number;
  facingMode: 'user' | 'environment';
}

export interface SimpleWebcamEmotionDetectionProps {
  autoDetectionInterval?: number;
  autoDetection?: boolean;
  cameraSettings?: Partial<CameraSettings>;
  className?: string;
}

interface EmotionResult {
  emotion: string;
  confidence: number;
  allEmotions: Record<string, number>;
  timestamp: number;
}

const SimpleWebcamEmotionDetection: React.FC<SimpleWebcamEmotionDetectionProps> = ({
  autoDetectionInterval = 3000,
  autoDetection = false,
  cameraSettings = {},
  className = '',
}) => {
  const { state, addEmotionDetection } = useApp();
  const { addToast } = useToast();
  
  // Local state
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentResult, setCurrentResult] = useState<EmotionResult | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Settings
  const [settings, setSettings] = useState<CameraSettings>({
    width: cameraSettings.width || 640,
    height: cameraSettings.height || 480,
    facingMode: cameraSettings.facingMode || 'user',
  });

  // Get available devices on mount
  useEffect(() => {
    getAvailableDevices();
  }, []);

  // Auto-detection effect
  useEffect(() => {
    if (autoDetection && isStreaming && !isDetecting) {
      intervalRef.current = setInterval(() => {
        captureFrame();
      }, autoDetectionInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoDetection, isStreaming, isDetecting, autoDetectionInterval]);

  // Handle emotion detection results
  useEffect(() => {
    if (currentResult) {
      addEmotionDetection(currentResult.emotion, currentResult.confidence);
      
      // Show toast notification
      addToast(`Emotion Detected: ${currentResult.emotion} (${(currentResult.confidence * 100).toFixed(1)}%)`);
    }
  }, [currentResult, addEmotionDetection, addToast]);

  // Show error toast when error occurs
  useEffect(() => {
    if (error) {
      addToast(`Camera Error: ${error}`);
    }
  }, [error, addToast]);

  const getAvailableDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableDevices(videoDevices);
    } catch (error) {
      console.error('Error getting devices:', error);
    }
  };

  const startCamera = async () => {
    try {
      setError(null);
      
      const constraints: MediaStreamConstraints = {
        video: {
          width: settings.width,
          height: settings.height,
          facingMode: settings.facingMode,
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsStreaming(true);
      addToast('Camera started successfully');
    } catch (error: any) {
      console.error('Camera access denied:', error);
      setError(
        error.name === 'NotAllowedError' 
          ? 'Camera access denied. Please allow camera access to use emotion detection.'
          : 'Failed to start camera. Please check your camera and try again.'
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsStreaming(false);
    setCurrentResult(null);
    addToast('Camera stopped');
  };

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current || isDetecting) return;

    setIsDetecting(true);

    try {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      // Set canvas dimensions to match video
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      // Draw current frame
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      // Convert to blob for upload
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        try {
          const formData = new FormData();
          formData.append('image', blob, 'frame.jpg');

          // TODO: Replace with actual API endpoint
          const response = await fetch('/api/emotion-detection', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const result = await response.json();
            setCurrentResult({
              emotion: result.emotion,
              confidence: result.confidence,
              allEmotions: result.allEmotions || {},
              timestamp: Date.now(),
            });
          } else {
            console.error('Emotion detection failed');
            addToast('Emotion detection failed');
          }
        } catch (error) {
          console.error('Error sending frame:', error);
          addToast('Network error during emotion detection');
        } finally {
          setIsDetecting(false);
        }
      }, 'image/jpeg', 0.8);
    } catch (error) {
      console.error('Error capturing frame:', error);
      setIsDetecting(false);
      addToast('Failed to capture frame');
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2 text-gray-800">Emotion Detection</h2>
        <p className="text-gray-600">Real-time emotion recognition using your camera</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Camera Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Camera Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        {!isStreaming ? (
          <button
            onClick={startCamera}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Camera
          </button>
        ) : (
          <button
            onClick={stopCamera}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Stop Camera
          </button>
        )}

        {isStreaming && (
          <button
            onClick={captureFrame}
            disabled={isDetecting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            {isDetecting ? 'Detecting...' : 'Detect Emotion'}
          </button>
        )}
      </div>

      {/* Camera Display */}
      <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-6">
        <video
          ref={videoRef}
          className="w-full h-auto"
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="hidden"
        />
        
        {!isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">Camera not started</p>
            </div>
          </div>
        )}
      </div>

      {/* Current Result */}
      {currentResult && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Latest Detection</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-blue-700">Emotion:</span>
              <span className="font-semibold text-blue-800 capitalize">{currentResult.emotion}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-700">Confidence:</span>
              <span className="font-semibold text-blue-800">{(currentResult.confidence * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-700">Time:</span>
              <span className="font-semibold text-blue-800">
                {new Date(currentResult.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Detection History */}
      {state.emotionHistory.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Recent Detections</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {state.emotionHistory.slice(-5).reverse().map((detection: EmotionDetection, index: number) => (
              <div key={detection.id || index} className="flex justify-between items-center py-2 px-3 bg-white rounded border">
                <span className="capitalize text-gray-700">{detection.emotion}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{(detection.confidence * 100).toFixed(1)}%</span>
                  <span className="text-xs text-gray-400">
                    {new Date(detection.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleWebcamEmotionDetection;
