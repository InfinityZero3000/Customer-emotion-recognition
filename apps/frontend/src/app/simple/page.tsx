'use client';

import React from 'react';
import { Button, Card, CardContent, CardHeader, Badge } from '@repo/ui';

function SimpleTestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Component Test</h1>
      
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <h2>Card Test</h2>
          </CardHeader>
          <CardContent>
            <p>This card should work fine.</p>
            <div className="flex gap-2 mt-4">
              <Button>Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
            </div>
            <div className="flex gap-2 mt-2">
              <Badge>Default Badge</Badge>
              <Badge variant="secondary">Secondary Badge</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default SimpleTestPage;
