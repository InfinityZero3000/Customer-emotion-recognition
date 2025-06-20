'use client';

import React from 'react';

export default function ComponentTest() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Component Import Test</h1>
      
      <div className="space-y-4">
        {/* Test individual component imports */}
        <TestCard />
        <TestButton />
        <TestBadge />
        <TestEmotionHistory />
        <TestProductCard />
      </div>
    </div>
  );
}

// Test Card components
function TestCard() {
  try {
    const { Card, CardContent, CardHeader } = require('@repo/ui');
    return (
      <div className="p-4 border">
        <h2 className="font-semibold mb-2">Card Test</h2>
        <Card>
          <CardHeader>Card Header</CardHeader>
          <CardContent>Card Content</CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-4 border border-red-500">
        <h2 className="font-semibold mb-2 text-red-600">Card Test - ERROR</h2>
        <pre className="text-sm text-red-500">{String(error)}</pre>
      </div>
    );
  }
}

// Test Button
function TestButton() {
  try {
    const { Button } = require('@repo/ui');
    return (
      <div className="p-4 border">
        <h2 className="font-semibold mb-2">Button Test</h2>
        <Button>Test Button</Button>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-4 border border-red-500">
        <h2 className="font-semibold mb-2 text-red-600">Button Test - ERROR</h2>
        <pre className="text-sm text-red-500">{String(error)}</pre>
      </div>
    );
  }
}

// Test Badge
function TestBadge() {
  try {
    const { Badge } = require('@repo/ui');
    return (
      <div className="p-4 border">
        <h2 className="font-semibold mb-2">Badge Test</h2>
        <Badge>Test Badge</Badge>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-4 border border-red-500">
        <h2 className="font-semibold mb-2 text-red-600">Badge Test - ERROR</h2>
        <pre className="text-sm text-red-500">{String(error)}</pre>
      </div>
    );
  }
}

// Test EmotionHistory
function TestEmotionHistory() {
  try {
    const { EmotionHistory } = require('@repo/ui');
    return (
      <div className="p-4 border">
        <h2 className="font-semibold mb-2">EmotionHistory Test</h2>
        <EmotionHistory entries={[]} />
      </div>
    );
  } catch (error) {
    return (
      <div className="p-4 border border-red-500">
        <h2 className="font-semibold mb-2 text-red-600">EmotionHistory Test - ERROR</h2>
        <pre className="text-sm text-red-500">{String(error)}</pre>
      </div>
    );
  }
}

// Test ProductCard
function TestProductCard() {
  try {
    const { ProductCard } = require('@repo/ui');
    return (
      <div className="p-4 border">
        <h2 className="font-semibold mb-2">ProductCard Test</h2>
        <ProductCard
          title="Test Product"
          description="Test Description"
          price={99.99}
          category="test"
          onRecommend={() => {}}
        />
      </div>
    );
  } catch (error) {
    return (
      <div className="p-4 border border-red-500">
        <h2 className="font-semibold mb-2 text-red-600">ProductCard Test - ERROR</h2>
        <pre className="text-sm text-red-500">{String(error)}</pre>
      </div>
    );
  }
}
