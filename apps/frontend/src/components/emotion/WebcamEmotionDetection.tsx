'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  Button, 
  Badge, 
  EmotionIndicator, 
  ConfidenceBar,
  Modal,
  Tooltip
} from '@repo/ui';
import { useToast } from '../toast/SimpleToastProvider';
import { type EmotionType } from '@repo/shared-types';
import { useApp, type EmotionDetection } from '../../contexts/AppContext';

interface CameraSettings {
  width: number;
  height: number;
  facingMode: 'user' | 'environment';
}

export interface WebcamEmotionDetectionProps {
  autoDetectionInterval?: number;
  autoDetection?: boolean;
  showConfidenceBreakdown?: boolean;
  cameraSettings?: Partial<CameraSettings>;
  className?: string;
}

interface EmotionResult {
  emotion: string;
  confidence: number;
  allEmotions: Record<string, number>;
  timestamp: number;
}

const WebcamEmotionDetection: React.FC<WebcamEmotionDetectionProps> = ({
  autoDetectionInterval = 3000,
  autoDetection = false,
  showConfidenceBreakdown = true,
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
  const [showSettings, setShowSettings] = useState(false);
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
    } catch (error: any) {
      console.error('Camera access denied:', error);
      setError(
        error.name === 'NotAllowedError' 
          ? 'Camera access denied. Please allow camera access to use emotion detection.'
          : 'Failed to access camera. Please check your camera permissions and try again.'
      );
    }
  };

  const stopCamera = () => {
    setIsStreaming(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current || isDetecting) return;

    try {
      setIsDetecting(true);
      setError(null);

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to blob and send to API
        canvas.toBlob(async (blob: Blob | null) => {
          if (blob) {
            const formData = new FormData();
            formData.append('image', blob, 'capture.jpg');

            try {
              const response = await fetch('http://localhost:8080/api/v1/detect-emotion', {
                method: 'POST',
                body: formData,
              });

              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }

              const result = await response.json();
              
              if (result.emotions) {
                const emotionResult: EmotionResult = {
                  emotion: result.dominant_emotion,
                  confidence: result.confidence,
                  allEmotions: result.emotions,
                  timestamp: Date.now(),
                };

                setCurrentResult(emotionResult);
              }
            } catch (error) {
              console.error('Error detecting emotion:', error);
              setError('Failed to analyze emotion. Please try again.');
            }
          }
        }, 'image/jpeg', 0.8);
      }
    } catch (error) {
      console.error('Error in emotion detection:', error);
      setError('Failed to capture image for analysis.');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleCameraToggle = async () => {
    if (isStreaming) {
      stopCamera();
    } else {
      await startCamera();
    }
  };

  const handleDeviceChange = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (isStreaming) {
      stopCamera();
      setTimeout(() => startCamera(), 100);
    }
  };

  const getConnectionStatusBadge = () => {
    if (isStreaming && autoDetection) {
      return <Badge className="bg-green-100 text-green-800 animate-pulse">Live</Badge>;
    } else if (isStreaming) {
      return <Badge className="bg-blue-100 text-blue-800">Connected</Badge>;
    } else if (error) {
      return <Badge className="bg-red-100 text-red-800">Error</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800">Disconnected</Badge>;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Camera Controls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold">Live Camera Feed</h3>
              {getConnectionStatusBadge()}
            </div>
            <div className="flex items-center space-x-2">
              {/* Device selector */}
              {availableDevices.length > 1 && (
                <select
                  value={selectedDeviceId}
                  onChange={(e) => handleDeviceChange(e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                  disabled={isDetecting}
                >
                  <option value="">Default camera</option>
                  {availableDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${device.deviceId.slice(0, 8)}...`}
                    </option>
                  ))}
                </select>
              )}

              {/* Settings button */}
              <Tooltip content="Camera settings">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Button>
              </Tooltip>

              {/* Start/Stop button */}
              <Button
                variant={isStreaming ? "outline" : "primary"}
                onClick={handleCameraToggle}
                className="min-w-[80px]"
              >
                {isStreaming ? 'Stop' : 'Start'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
            {isStreaming ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                
                {/* Manual capture button */}
                <div className="absolute top-4 right-4">
                  <Button
                    size="sm"
                    onClick={captureFrame}
                    disabled={isDetecting}
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30"
                  >
                    {isDetecting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </Button>
                </div>

                {/* Auto-detection indicator */}
                {autoDetection && (
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-blue-100 text-blue-800 animate-pulse">
                      Auto-detecting...
                    </Badge>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-medium">Camera Off</p>
                <p className="text-sm">Click "Start" to begin emotion detection</p>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-red-800">Camera Error</h4>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Emotion Display */}
      {state.currentEmotion && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Current Emotion</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <EmotionIndicator
                emotion={state.currentEmotion.emotion as EmotionType}
                confidence={state.currentEmotion.confidence}
                size="lg"
              />
              
              {showConfidenceBreakdown && currentResult && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Confidence Breakdown</h4>
                  <ConfidenceBar
                    emotions={currentResult.allEmotions}
                    animated
                  />
                </div>
              )}
              
              <div className="text-xs text-gray-500">
                Detected at {new Date(state.currentEmotion.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Camera Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Camera Settings"
        size="md"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resolution
            </label>
            <select
              value={`${settings.width}x${settings.height}`}
              onChange={(e) => {
                const [width, height] = e.target.value.split('x').map(Number);
                setSettings(prev => ({ ...prev, width, height }));
              }}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="640x480">640 × 480 (SD)</option>
              <option value="1280x720">1280 × 720 (HD)</option>
              <option value="1920x1080">1920 × 1080 (Full HD)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Camera Direction
            </label>
            <select
              value={settings.facingMode}
              onChange={(e) => {
                setSettings(prev => ({ ...prev, facingMode: e.target.value as 'user' | 'environment' }));
              }}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="user">Front Camera</option>
              <option value="environment">Back Camera</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Cameras
            </label>
            <select
              value={selectedDeviceId}
              onChange={(e) => handleDeviceChange(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Default camera</option>
              {availableDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${device.deviceId.slice(0, 8)}...`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowSettings(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WebcamEmotionDetection;
