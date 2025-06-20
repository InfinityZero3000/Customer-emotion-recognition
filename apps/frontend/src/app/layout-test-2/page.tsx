'use client';

import React from 'react';

// Test if MainLayout can be imported without issues
import { MainLayout } from '../../components/layout/MainLayout';

export default function LayoutTest2() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Layout Test 2 - MainLayout Import</h1>
      <div className="bg-green-100 border border-green-200 rounded-lg p-4">
        <p className="text-green-800">✅ MainLayout imported successfully!</p>
      </div>
      
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Testing MainLayout Usage:</h2>
        <MainLayout title="Test Page" isConnected={true}>
          <div className="bg-blue-100 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">This content is inside MainLayout</p>
          </div>
        </MainLayout>
      </div>
    </div>
  );
}
