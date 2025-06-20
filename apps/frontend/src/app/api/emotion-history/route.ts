import { NextRequest, NextResponse } from 'next/server';

// This would typically come from a database
// For now, we'll return mock data but in the correct format
export async function GET(request: NextRequest) {
  try {
    // In a real app, this would query your database
    // For now, return the same mock data but indicate it's from API
    
    const mockHistory = Array.from({ length: 50 }, (_, i) => {
      const emotions = ['happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'neutral'];
      const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
      const randomDate = new Date();
      randomDate.setHours(randomDate.getHours() - Math.floor(Math.random() * 168)); // Past week
      
      return {
        id: `history_${i}`,
        emotion: randomEmotion,
        confidence: 0.6 + Math.random() * 0.4, // 60-100%
        timestamp: randomDate.toISOString(),
        source: 'database' // Indicate this would come from database
      };
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      success: true,
      data: mockHistory,
      total: mockHistory.length,
      source: 'api-mock' // This indicates it's from API but still mock data
    });

  } catch (error) {
    console.error('History fetch error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch emotion history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emotion, confidence, timestamp } = body;

    if (!emotion || confidence === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: emotion, confidence' },
        { status: 400 }
      );
    }

    // In a real app, this would save to database
    console.log('Saving emotion detection:', { emotion, confidence, timestamp });

    return NextResponse.json({
      success: true,
      message: 'Emotion detection saved',
      id: `detection_${Date.now()}`,
      source: 'api-save'
    });

  } catch (error) {
    console.error('Save emotion error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save emotion detection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
