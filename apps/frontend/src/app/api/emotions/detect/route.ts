import { NextRequest, NextResponse } from 'next/server';

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

    // Forward to AI service
    const aiServiceFormData = new FormData();
    aiServiceFormData.append('image', image);

    const response = await fetch('http://localhost:8000/emotions/detect-image', {
      method: 'POST',
      body: aiServiceFormData,
    });

    if (!response.ok) {
      throw new Error(`AI Service error: ${response.status}`);
    }

    const result = await response.json();
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Emotion detection API error:', error);
    return NextResponse.json(
      { error: 'Failed to detect emotion' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Emotion Detection API',
    methods: ['POST'],
    description: 'Send image as form-data with key "image"'
  });
}
