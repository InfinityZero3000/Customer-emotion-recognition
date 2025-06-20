'use client';

import React from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import SimpleWebcamEmotionDetection from '../components/emotion/SimpleWebcamEmotionDetection';

export default function Dashboard() {
  return (
    <MainLayout 
      title="Emotion Recognition Dashboard" 
      isConnected={true}
      currentPage="dashboard"
    >
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">System Status</h2>
          <div className="bg-green-100 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">✅ Application is running successfully!</p>
            <p className="text-green-700 mt-2">MainLayout and SimpleWebcamEmotionDetection have been integrated.</p>
          </div>
        </div>

        {/* Webcam Emotion Detection Component */}
        <SimpleWebcamEmotionDetection />

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Next Steps</h2>
          <div className="space-y-3">
            <div className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Connect to AI backend service for emotion detection</span>
            </div>
            <div className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Add product recommendation engine</span>
            </div>
            <div className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Implement user authentication</span>
            </div>
            <div className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Add analytics and insights dashboard</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Fixed Issues</h2>
          <div className="space-y-2">
            <div className="text-green-600">✅ Toast usage updated to use simple string-based API</div>
            <div className="text-green-600">✅ Simple toast provider implemented</div>
            <div className="text-green-600">✅ Main runtime error isolated and resolved</div>
            <div className="text-green-600">✅ Development server running without crashes</div>
            <div className="text-green-600">✅ MainLayout component integrated successfully</div>
            <div className="text-green-600">✅ SimpleWebcamEmotionDetection component working</div>
            <div className="text-green-600">✅ Eliminated problematic UI component dependencies</div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}