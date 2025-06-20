'use client';

import React from 'react';

// Test each import individually to find the culprit
export default function MainPageSimple() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simplified Main Page</h1>
      
      <div className="space-y-4">
        <TestMainLayout />
        <TestWebcamEmotion />
        <TestBasicComponents />
      </div>
    </div>
  );
}

function TestMainLayout() {
  try {
    const { MainLayout } = require('../components/layout/MainLayout');
    return (
      <div className="p-4 border">
        <h2 className="font-semibold mb-2 text-green-600">MainLayout Test - OK</h2>
        <p>MainLayout component imported successfully</p>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-4 border border-red-500">
        <h2 className="font-semibold mb-2 text-red-600">MainLayout Test - ERROR</h2>
        <pre className="text-sm text-red-500">{String(error)}</pre>
      </div>
    );
  }
}

function TestWebcamEmotion() {
  try {
    const { WebcamEmotionDetection } = require('../components/emotion/WebcamEmotionDetection');
    return (
      <div className="p-4 border">
        <h2 className="font-semibold mb-2 text-green-600">WebcamEmotionDetection Test - OK</h2>
        <p>WebcamEmotionDetection component imported successfully</p>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-4 border border-red-500">
        <h2 className="font-semibold mb-2 text-red-600">WebcamEmotionDetection Test - ERROR</h2>
        <pre className="text-sm text-red-500">{String(error)}</pre>
      </div>
    );
  }
}

function TestBasicComponents() {
  try {
    const { 
      Card, 
      CardContent, 
      CardHeader, 
      EmotionHistory, 
      ProductCard, 
      Badge,
      Button
    } = require('@repo/ui');
    
    return (
      <div className="p-4 border">
        <h2 className="font-semibold mb-2 text-green-600">Basic UI Components Test - OK</h2>
        <p>All UI components imported successfully</p>
        <div className="mt-2 space-x-2">
          <Button>Test Button</Button>
          <Badge>Test Badge</Badge>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-4 border border-red-500">
        <h2 className="font-semibold mb-2 text-red-600">Basic UI Components Test - ERROR</h2>
        <pre className="text-sm text-red-500">{String(error)}</pre>
      </div>
    );
  }
}
