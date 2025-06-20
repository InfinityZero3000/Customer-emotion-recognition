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

interface StreamMessage {
  type: 'emotion_update' | 'recommendation_update' | 'user_pattern_update' | 'system_message';
  data: any;
  timestamp: number;
  sessionId?: string;
}

interface ProductRecommendation {
  category: string;
  confidence: number;
  products: Array<{
    id: number;
    name: string;
    price: number;
    category: string;
    rating: string;
    image: string;
  }>;
  reasoning: string;
}

export default function WebcamEmotionStream() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  const [emotion, setEmotion] = useState<EmotionDetectionResult | null>(null);
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [emotionHistory, setEmotionHistory] = useState<EmotionDetectionResult[]>([]);
  const [userPattern, setUserPattern] = useState<any>(null);
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const userId = 'demo_user_' + Math.random().toString(36).substr(2, 9);
  const sessionId = 'session_' + Math.random().toString(36).substr(2, 9);

  useEffect(() => {
    connectWebSocket();
    
    return () => {
      disconnectWebSocket();
      stopCamera();
    };
  }, []);

  const connectWebSocket = () => {
    try {
      // Connect to streaming service WebSocket
      wsRef.current = new WebSocket(`ws://localhost:8080?userId=${userId}&sessionId=${sessionId}`);
      
      wsRef.current.onopen = () => {
        setIsConnected(true);
        setError(null);
        console.log('Connected to emotion streaming service');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: StreamMessage = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        console.log('Disconnected from streaming service');
        
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
            connectWebSocket();
          }
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection to streaming service failed');
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      setError('Failed to connect to streaming service');
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  };

  const handleWebSocketMessage = (message: StreamMessage) => {
    switch (message.type) {
      case 'emotion_update':
        if (message.data.emotion) {
          setEmotion(message.data.emotion);
          
          // Add to history
          setEmotionHistory(prev => [message.data.emotion, ...prev.slice(0, 19)]);
        }
        break;
        
      case 'recommendation_update':
        if (message.data.recommendations || message.data.predictions) {
          const newRecommendations = message.data.recommendations || message.data.predictions;
          setRecommendations(newRecommendations);
        }
        break;
        
      case 'user_pattern_update':
        if (message.data.pattern) {
          setUserPattern(message.data.pattern);
        }
        break;
        
      case 'system_message':
        console.log('System message:', message.data.message);
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  };

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
    
    captureAndAnalyze();
    setTimeout(detectEmotionLoop, 3000); // Analyze every 3 seconds
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current || isLoading || !isConnected) return;
    
    try {
      setIsLoading(true);
      
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        // Send via WebSocket for real-time processing
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'detect_emotion',
            data: {
              image_data: imageData,
              user_id: userId,
              session_id: sessionId
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error in emotion detection:', error);
      setError('Failed to analyze emotion');
    } finally {
      setIsLoading(false);
    }
  };

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      happy: 'text-green-500 bg-green-100',
      sad: 'text-blue-500 bg-blue-100',
      angry: 'text-red-500 bg-red-100',
      fear: 'text-purple-500 bg-purple-100',
      surprise: 'text-yellow-600 bg-yellow-100',
      disgust: 'text-orange-500 bg-orange-100',
      neutral: 'text-gray-500 bg-gray-100'
    };
    return colors[emotion] || 'text-gray-500 bg-gray-100';
  };

  const requestEmotionHistory = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'get_emotion_history'
      }));
    }
  };

  const requestUserPattern = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'get_user_pattern'
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          🎭 Real-time Emotion Recognition & Product Recommendations
        </h1>
        
        {/* Connection Status */}
        <div className="flex justify-center mb-6">
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
            isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm font-medium">
              {isConnected ? 'Connected to Streaming Service' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Camera and Emotion Detection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Live Camera Feed</h2>
              
              <div className="relative mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full rounded-lg border-2 border-gray-200 shadow-sm"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Loading Overlay */}
                {isLoading && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-lg">
                    <div className="bg-white px-4 py-2 rounded-lg shadow-lg">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        <span className="text-sm font-medium">Analyzing...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Current Emotion Display */}
                {emotion && !isLoading && (
                  <div className="absolute top-4 left-4 px-4 py-2 rounded-lg shadow-lg bg-black/80 text-white">
                    <p className="text-lg font-bold">
                      {emotion.dominant_emotion.toUpperCase()}
                    </p>
                    <p className="text-sm opacity-80">
                      {(emotion.confidence * 100).toFixed(1)}% confident
                    </p>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex space-x-3">
                <button
                  onClick={isCapturing ? stopCamera : startCamera}
                  disabled={!isConnected}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isCapturing 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {isCapturing ? '🛑 Stop' : '📹 Start'}
                </button>
                
                <button
                  onClick={captureAndAnalyze}
                  disabled={!isCapturing || isLoading || !isConnected}
                  className="px-4 py-2 rounded-lg font-medium bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  🔍 Analyze
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </div>

            {/* Emotion Breakdown */}
            {emotion && (
              <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Emotion Analysis</h3>
                <div className="space-y-3">
                  {Object.entries(emotion.emotions).map(([emotionName, confidence]) => (
                    <div key={emotionName} className="flex items-center justify-between">
                      <span className={`capitalize px-2 py-1 rounded-full text-xs font-medium ${
                        getEmotionColor(emotionName)
                      }`}>
                        {emotionName}
                      </span>
                      <div className="flex items-center space-x-2 flex-1 ml-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              emotionName === emotion.dominant_emotion ? 'bg-blue-500' : 'bg-gray-400'
                            }`}
                            style={{ width: `${confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs w-12 text-right font-mono">
                          {(confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Product Recommendations */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  🛍️ Personalized Recommendations
                </h2>
                {recommendations.length > 0 && (
                  <span className="text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full">
                    {recommendations.length} categories available
                  </span>
                )}
              </div>
              
              {recommendations.length > 0 ? (
                <div className="space-y-6">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-medium capitalize text-gray-800">
                          {rec.category}
                        </h3>
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {(rec.confidence * 100).toFixed(0)}% match
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4">{rec.reasoning}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {rec.products.map((product) => (
                          <div key={product.id} className="border border-gray-100 rounded-lg p-3 hover:shadow-md transition-shadow">
                            <img 
                              src={product.image} 
                              alt={product.name}
                              className="w-full h-32 object-cover rounded-lg mb-2"
                            />
                            <h4 className="font-medium text-sm text-gray-800 mb-1">
                              {product.name}
                            </h4>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-green-600">
                                ${product.price}
                              </span>
                              <div className="flex items-center space-x-1">
                                <span className="text-yellow-500">⭐</span>
                                <span className="text-xs text-gray-600">{product.rating}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🤖</div>
                  <p className="text-gray-500">
                    Start emotion detection to get personalized recommendations
                  </p>
                </div>
              )}
            </div>

            {/* User Pattern & History */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Emotion History */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">📊 Recent History</h3>
                  <button 
                    onClick={requestEmotionHistory}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Refresh
                  </button>
                </div>
                
                {emotionHistory.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {emotionHistory.slice(0, 10).map((hist, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <span className={`px-2 py-1 rounded-full text-xs ${getEmotionColor(hist.dominant_emotion)}`}>
                          {hist.dominant_emotion}
                        </span>
                        <span className="text-xs text-gray-500">
                          {(hist.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No history available</p>
                )}
              </div>

              {/* User Pattern */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">🎯 Your Pattern</h3>
                  <button 
                    onClick={requestUserPattern}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Update
                  </button>
                </div>
                
                {userPattern ? (
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="text-gray-600">Total Sessions: </span>
                      <span className="font-medium">{userPattern.totalSessions}</span>
                    </div>
                    
                    {userPattern.dominantEmotions && Object.keys(userPattern.dominantEmotions).length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Most Common:</p>
                        <div className="space-y-1">
                          {Object.entries(userPattern.dominantEmotions)
                            .sort(([,a], [,b]) => (b as number) - (a as number))
                            .slice(0, 3)
                            .map(([emotion, count]) => (
                            <div key={emotion} className="flex items-center justify-between">
                              <span className={`px-2 py-1 rounded-full text-xs ${getEmotionColor(emotion)}`}>
                                {emotion}
                              </span>
                              <span className="text-xs text-gray-500">{count as number}×</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Building your emotional profile...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
