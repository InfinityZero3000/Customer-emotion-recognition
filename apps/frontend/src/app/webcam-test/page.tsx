'use client';

import React from 'react';

// Test if SimpleWebcamEmotionDetection can be imported without issues
import SimpleWebcamEmotionDetection from '../../components/emotion/SimpleWebcamEmotionDetection';

export default function WebcamTest() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Webcam Component Test</h1>
      <div className="bg-green-100 border border-green-200 rounded-lg p-4 mb-6">
        <p className="text-green-800">✅ SimpleWebcamEmotionDetection imported successfully!</p>
      </div>
      
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Testing SimpleWebcamEmotionDetection Usage:</h2>
        <SimpleWebcamEmotionDetection />
      </div>
    </div>
  );
}
