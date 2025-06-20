'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  EmotionHistory, 
  Badge,
  Button,
  Skeleton,
  EmotionIndicator,
  type EmotionHistoryEntry 
} from '@repo/ui';

interface HistoryFilter {
  emotion?: string;
  dateRange?: 'today' | 'week' | 'month' | 'all';
  minConfidence?: number;
}

interface EmotionStats {
  totalSessions: number;
  mostFrequentEmotion: string;
  averageConfidence: number;
  emotionBreakdown: Record<string, number>;
  timeSpentDetecting: number; // in minutes
}

export default function HistoryPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [emotionHistory, setEmotionHistory] = useState<EmotionHistoryEntry[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<EmotionHistoryEntry[]>([]);
  const [stats, setStats] = useState<EmotionStats | null>(null);
  const [filter, setFilter] = useState<HistoryFilter>({ dateRange: 'all' });
  const [exportLoading, setExportLoading] = useState(false);

  // Mock user data
  const user = {
    name: 'Demo User',
    avatar: undefined,
  };

  useEffect(() => {
    loadHistoryData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filter, emotionHistory]);

  const loadHistoryData = async () => {
    setIsLoading(true);
    try {
      // Try to fetch from FastAPI backend directly (real database)
      try {
        console.log('Fetching emotion history from FastAPI backend...');
        const response = await fetch('http://localhost:8000/emotions/history');
        
        if (response.ok) {
          const result = await response.json();
          console.log('FastAPI history response:', result);
          
          if (result.history && Array.isArray(result.history)) {
            const realHistory = result.history.map((item: any) => ({
              emotion: item.emotion,
              confidence: item.confidence,
              timestamp: item.timestamp,
              id: item.id,
              source: item.source,
              num_faces: item.num_faces,
              allEmotions: item.allEmotions
            }));
            
            setEmotionHistory(realHistory);
            
            // Calculate stats from real data
            const emotionCounts: Record<string, number> = {};
            let totalConfidence = 0;
            
            realHistory.forEach(entry => {
              emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + 1;
              totalConfidence += entry.confidence;
            });

            const mostFrequent = Object.entries(emotionCounts)
              .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral';

            setStats({
              totalSessions: realHistory.length,
              mostFrequentEmotion: mostFrequent,
              averageConfidence: realHistory.length > 0 ? totalConfidence / realHistory.length : 0,
              emotionBreakdown: emotionCounts,
              timeSpentDetecting: Math.floor(realHistory.length * 2.5),
            });
            
            console.log('✅ Successfully loaded real emotion history from database');
            return; // Exit early if API call succeeded
          }
        }
      } catch (apiError) {
        console.warn('FastAPI call failed:', apiError);
      }
      
      // Try to fetch from API fallback
      const response = await fetch('/api/emotion-history');
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setEmotionHistory(result.data);
          
          // Calculate stats from API data
          const emotionCounts: Record<string, number> = {};
          let totalConfidence = 0;
          
          result.data.forEach((entry: any) => {
            emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + 1;
            totalConfidence += entry.confidence;
          });

          const mostFrequent = Object.entries(emotionCounts)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral';

          setStats({
            totalSessions: result.data.length,
            mostFrequentEmotion: mostFrequent,
            averageConfidence: totalConfidence / result.data.length,
            emotionBreakdown: emotionCounts,
            timeSpentDetecting: Math.floor(result.data.length * 2.5), // ~2.5 minutes per session
          });
          
          return; // Exit early if API call succeeded
        }
      }
      
      // Fallback to mock data if API fails
      console.warn('⚠️ All APIs failed, using mock data as last resort');
      
      // Generate mock history data (fallback)
      const mockHistory: EmotionHistoryEntry[] = Array.from({ length: 50 }, (_, i) => {
        const emotions = ['happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'neutral'];
        const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
        const randomDate = new Date();
        randomDate.setHours(randomDate.getHours() - Math.floor(Math.random() * 168)); // Past week
        
        return {
          emotion: randomEmotion as any,
          confidence: 0.6 + Math.random() * 0.4, // 60-100%
          timestamp: randomDate.toISOString(),
        };
      }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setEmotionHistory(mockHistory);
      
      // Calculate stats
      const emotionCounts: Record<string, number> = {};
      let totalConfidence = 0;
      
      mockHistory.forEach(entry => {
        emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + 1;
        totalConfidence += entry.confidence;
      });

      const mostFrequent = Object.entries(emotionCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral';

      setStats({
        totalSessions: mockHistory.length,
        mostFrequentEmotion: mostFrequent,
        averageConfidence: totalConfidence / mockHistory.length,
        emotionBreakdown: emotionCounts,
        timeSpentDetecting: Math.floor(mockHistory.length * 2.5), // ~2.5 minutes per session
      });
      
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...emotionHistory];

    // Filter by emotion
    if (filter.emotion && filter.emotion !== 'all') {
      filtered = filtered.filter(entry => entry.emotion === filter.emotion);
    }

    // Filter by date range
    if (filter.dateRange && filter.dateRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      
      switch (filter.dateRange) {
        case 'today':
          cutoff.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoff.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoff.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(entry => new Date(entry.timestamp) >= cutoff);
    }

    // Filter by confidence
    if (filter.minConfidence) {
      filtered = filtered.filter(entry => entry.confidence >= filter.minConfidence);
    }

    setFilteredHistory(filtered);
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create CSV content
      const csvContent = [
        'Timestamp,Emotion,Confidence',
        ...filteredHistory.map(entry => 
          `${entry.timestamp},${entry.emotion},${(entry.confidence * 100).toFixed(1)}%`
        )
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `emotion-history-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const clearHistory = async () => {
    if (window.confirm('Are you sure you want to clear all emotion history? This action cannot be undone.')) {
      setEmotionHistory([]);
      setStats(null);
    }
  };

  return (
    <MainLayout
      title="Emotion History"
      user={user}
      currentPage="history" 
      onSettingsClick={() => console.log('Settings clicked')}
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))
          ) : stats ? (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-primary-600 mb-2">
                    {stats.totalSessions}
                  </div>
                  <div className="text-sm text-gray-600">Total Sessions</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 flex items-center space-x-3">
                  <EmotionIndicator 
                    emotion={stats.mostFrequentEmotion as any}
                    size="sm"
                    showEmoji
                    hideLabel
                  />
                  <div>
                    <div className="text-lg font-semibold capitalize">
                      {stats.mostFrequentEmotion}
                    </div>
                    <div className="text-sm text-gray-600">Most Frequent</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {(stats.averageConfidence * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Avg Confidence</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {stats.timeSpentDetecting}m
                  </div>
                  <div className="text-sm text-gray-600">Time Spent</div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-semibold">Filter & Export</h3>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExport}
                  disabled={exportLoading || filteredHistory.length === 0}
                >
                  {exportLoading ? (
                    <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full mr-2" />
                  ) : (
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  Export CSV
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearHistory}
                  disabled={emotionHistory.length === 0}
                  className="text-red-600 hover:text-red-700"
                >
                  Clear History
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Emotion Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emotion
                </label>
                <select
                  value={filter.emotion || 'all'}
                  onChange={(e) => setFilter(prev => ({ ...prev, emotion: e.target.value === 'all' ? undefined : e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Emotions</option>
                  <option value="happy">Happy</option>
                  <option value="sad">Sad</option>
                  <option value="angry">Angry</option>
                  <option value="surprised">Surprised</option>
                  <option value="fearful">Fearful</option>
                  <option value="disgusted">Disgusted</option>
                  <option value="neutral">Neutral</option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Period
                </label>
                <select
                  value={filter.dateRange || 'all'}
                  onChange={(e) => setFilter(prev => ({ ...prev, dateRange: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                </select>
              </div>

              {/* Confidence Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Confidence
                </label>
                <select
                  value={filter.minConfidence || ''}
                  onChange={(e) => setFilter(prev => ({ ...prev, minConfidence: e.target.value ? parseFloat(e.target.value) : undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Any Confidence</option>
                  <option value="0.5">50%+</option>
                  <option value="0.7">70%+</option>
                  <option value="0.8">80%+</option>
                  <option value="0.9">90%+</option>
                </select>
              </div>
            </div>
            
            {filteredHistory.length !== emotionHistory.length && (
              <div className="mt-4 flex items-center space-x-2">
                <Badge variant="secondary">
                  {filteredHistory.length} of {emotionHistory.length} entries
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setFilter({ dateRange: 'all' })}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* History Timeline */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Emotion Timeline</h3>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : filteredHistory.length > 0 ? (
              <EmotionHistory
                entries={filteredHistory}
                maxEntries={50}
                showTimestamp
                groupByTime
                showConfidence
                onEntryClick={(entry) => console.log('Entry clicked:', entry)}
              />
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-gray-500 mb-4">
                  {emotionHistory.length === 0 
                    ? "No emotion history found" 
                    : "No entries match your current filters"
                  }
                </p>
                <p className="text-sm text-gray-400">
                  {emotionHistory.length === 0
                    ? "Start using emotion detection to build your history"
                    : "Try adjusting your filters to see more results"
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emotion Breakdown */}
        {stats && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Emotion Breakdown</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                {Object.entries(stats.emotionBreakdown).map(([emotion, count]) => (
                  <div key={emotion} className="text-center">
                    <EmotionIndicator 
                      emotion={emotion as any}
                      size="lg"
                      showEmoji
                      hideLabel
                    />
                    <div className="mt-2">
                      <div className="text-lg font-semibold">{count}</div>
                      <div className="text-xs text-gray-600 capitalize">{emotion}</div>
                      <div className="text-xs text-gray-500">
                        {((count / stats.totalSessions) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
