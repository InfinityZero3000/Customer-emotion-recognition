'use client';

import React from 'react';

const DebugPage = () => {
  console.log('DebugPage rendering...');
  
  // Test what's actually exported from @repo/ui
  React.useEffect(() => {
    import('@repo/ui').then((uiModule) => {
      console.log('UI Module exports:', Object.keys(uiModule));
      console.log('Button:', uiModule.Button);
      console.log('Card:', uiModule.Card);
      console.log('CardContent:', uiModule.CardContent);
      console.log('CardHeader:', uiModule.CardHeader);
      console.log('EmotionHistory:', uiModule.EmotionHistory);
      console.log('ProductCard:', uiModule.ProductCard);
      console.log('Badge:', uiModule.Badge);
    }).catch((error) => {
      console.error('Failed to import @repo/ui:', error);
    });
  }, []);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Component Imports</h1>
      
      <div className="space-y-4">
        <p>✅ If you can see this, basic React rendering works.</p>
        <p>Check browser console for detailed import information.</p>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold">Debug Info:</h2>
          <p>Check the browser console to see all exports from @repo/ui</p>
          <p>Main page components being tested: Card, CardContent, CardHeader, EmotionHistory, ProductCard, Badge, Button</p>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;
