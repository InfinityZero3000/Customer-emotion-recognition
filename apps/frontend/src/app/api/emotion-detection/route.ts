import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || 'http://localhost:8000';

// Mock emotion detection for development
const mockEmotionDetection = () => {
  const emotions = ['happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'neutral'];
  const selectedEmotion = emotions[Math.floor(Math.random() * emotions.length)];
  const confidence = 0.6 + Math.random() * 0.4; // 60-100%
  
  const allEmotions: Record<string, number> = {};
  emotions.forEach(emotion => {
    if (emotion === selectedEmotion) {
      allEmotions[emotion] = confidence;
    } else {
      allEmotions[emotion] = Math.random() * 0.4; // 0-40%
    }
  });

  return {
    emotion: selectedEmotion,
    confidence: parseFloat(confidence.toFixed(3)),
    allEmotions,
    timestamp: Date.now(),
    source: 'next_js_mock' // Indicate this is mock data
  };
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    
    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Try to connect to FastAPI service first
    try {
      const fastAPIFormData = new FormData();
      fastAPIFormData.append('file', image); // FastAPI expects 'file' not 'image'

      console.log(`Attempting to connect to FastAPI at: ${FASTAPI_BASE_URL}/emotion/detect`);

      const response = await fetch(`${FASTAPI_BASE_URL}/emotion/detect`, {
        method: 'POST',
        body: fastAPIFormData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('FastAPI response received:', result);
        return NextResponse.json({
          ...result,
          source: 'fastapi'
        });
      } else {
        console.warn(`FastAPI service returned ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.warn('FastAPI service connection failed:', error);
    }

    // Fallback to mock data if FastAPI service is not available
    console.log('Using mock data as fallback');
    const mockResult = mockEmotionDetection();
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return NextResponse.json(mockResult);

  } catch (error) {
    console.error('Emotion detection error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
