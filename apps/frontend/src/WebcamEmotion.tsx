'use client';

import { useEffect, useRef, useState } from 'react';

// Local emotion data interface
interface EmotionData {
  dominant_emotion: string;
  confidence: number;
  emotions?: Record<string, number>;
  timestamp?: string;
}

interface EmotionDetectionResult {
  emotions: Record<string, number>;
  dominant_emotion: string;
  confidence: number;
  timestamp: string;
}

export default function WebcamEmotion() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [emotion, setEmotion] = useState<EmotionDetectionResult | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setIsCapturing(true);
      
      // Start emotion detection loop
      detectEmotionLoop();
    } catch (error) {
      console.error('Camera access denied:', error);
      setError('Camera access denied. Please allow camera access to use emotion detection.');
    }
  };

  const stopCamera = () => {
    setIsCapturing(false);
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const detectEmotionLoop = () => {
    if (!isCapturing) return;
    
    captureFrame();
    setTimeout(detectEmotionLoop, 2000); // Detect every 2 seconds
  };

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current || isLoading) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to blob
        canvas.toBlob(async (blob) => {
          if (blob) {
            const formData = new FormData();
            formData.append('image', blob, 'frame.jpg');
            
            try {
              // Send to emotion detection API
              const response = await fetch('http://localhost:8000/emotions/detect-image', {
                method: 'POST',
                body: formData
              });
              
              if (response.ok) {
                const result = await response.json();
                setEmotion(result);
              } else {
                throw new Error(`API Error: ${response.status}`);
              }
            } catch (error) {
              console.error('Emotion detection API error:', error);
              setError('Failed to detect emotion. Please check if the AI service is running.');
            }
          }
        }, 'image/jpeg', 0.8);
      }
    } catch (error) {
      console.error('Frame capture error:', error);
      setError('Failed to capture frame from camera.');
    } finally {
      setIsLoading(false);
    }
  };

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      happy: 'text-green-500',
      sad: 'text-blue-500',
      angry: 'text-red-500',
      fear: 'text-purple-500',
      surprise: 'text-yellow-500',
      disgust: 'text-orange-500',
      neutral: 'text-gray-500'
    };
    return colors[emotion] || 'text-gray-500';
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Real-time Emotion Recognition</h1>
      
      {/* Camera View */}
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full max-w-md rounded-lg border-2 border-gray-300 shadow-lg"
        />
        <canvas
          ref={canvasRef}
          className="hidden"
        />
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
            <div className="bg-white px-4 py-2 rounded-lg">
              <p className="text-sm font-medium">Analyzing...</p>
            </div>
          </div>
        )}
        
        {/* Emotion Display */}
        {emotion && !isLoading && (
          <div className="absolute top-4 left-4 bg-black/80 text-white px-4 py-3 rounded-lg">
            <p className={`text-lg font-bold ${getEmotionColor(emotion.dominant_emotion)}`}>
              {emotion.dominant_emotion.toUpperCase()}
            </p>
            <p className="text-sm opacity-80">
              Confidence: {(emotion.confidence * 100).toFixed(1)}%
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex space-x-4">
        <button
          onClick={isCapturing ? stopCamera : startCamera}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            isCapturing 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isCapturing ? 'Stop Camera' : 'Start Camera'}
        </button>
        
        <button
          onClick={captureFrame}
          disabled={!isCapturing || isLoading}
          className="px-6 py-2 rounded-lg font-medium bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Detect Now
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Emotion Details */}
      {emotion && (
        <div className="w-full max-w-md">
          <h3 className="text-lg font-semibold mb-3">Emotion Breakdown</h3>
          <div className="space-y-2">
            {Object.entries(emotion.emotions).map(([emotionName, confidence]) => (
              <div key={emotionName} className="flex justify-between items-center">
                <span className={`capitalize ${getEmotionColor(emotionName)}`}>
                  {emotionName}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${emotionName === emotion.dominant_emotion ? 'bg-blue-500' : 'bg-gray-400'}`}
                      style={{ width: `${confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs w-12 text-right">
                    {(confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
