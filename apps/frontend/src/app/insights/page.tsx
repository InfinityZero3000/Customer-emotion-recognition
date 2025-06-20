'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  Badge,
  Button,
  Skeleton,
  EmotionIndicator,
  Progress,
  AnalyticsDashboard,
  type EmotionHistoryEntry,
  type BarChartData,
  type LineChartDataset
} from '@repo/ui';

interface EmotionTrend {
  emotion: string;
  current: number;
  previous: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'stable';
}

interface TimePattern {
  hour: number;
  emotions: Record<string, number>;
  dominantEmotion: string;
  totalDetections: number;
}

interface InsightData {
  emotionTrends: EmotionTrend[];
  timePatterns: TimePattern[];
  totalSessions: number;
  averageSessionLength: number;
  mostActiveHour: number;
  emotionalStability: number; // 0-1 score
  recommendations: string[];
}

export default function InsightsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'quarter'>('week');
  const [refreshing, setRefreshing] = useState(false);

  // Mock user data
  const user = {
    name: 'Demo User',
    avatar: undefined,
  };

  useEffect(() => {
    loadInsights();
  }, [selectedTimeRange]);

  const loadInsights = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate mock insights data
      const emotions = ['happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'neutral'];
      
      const emotionTrends: EmotionTrend[] = emotions.map(emotion => {
        const current = Math.random() * 100;
        const previous = Math.random() * 100;
        const change = ((current - previous) / previous) * 100;
        
        return {
          emotion,
          current,
          previous,
          change,
          changeType: Math.abs(change) < 5 ? 'stable' : change > 0 ? 'increase' : 'decrease'
        };
      });

      const timePatterns: TimePattern[] = Array.from({ length: 24 }, (_, hour) => {
        const emotionDistribution: Record<string, number> = {};
        emotions.forEach(emotion => {
          emotionDistribution[emotion] = Math.random() * 10;
        });
        
        const dominantEmotion = Object.entries(emotionDistribution)
          .sort(([,a], [,b]) => b - a)[0][0];
        
        return {
          hour,
          emotions: emotionDistribution,
          dominantEmotion,
          totalDetections: Object.values(emotionDistribution).reduce((a, b) => a + b, 0)
        };
      });

      const recommendations = [
        "Your happiness levels peak around 2 PM - consider scheduling important meetings during this time.",
        "You show increased stress levels on Mondays. Try starting your week with relaxation techniques.",
        "Your emotional stability is excellent this week, maintaining consistent positive emotions.",
        "Consider taking breaks around 4 PM when stress levels tend to increase.",
        "Your weekend emotional patterns show great balance between relaxation and engagement."
      ];

      setInsights({
        emotionTrends,
        timePatterns,
        totalSessions: 127,
        averageSessionLength: 3.2,
        mostActiveHour: 14, // 2 PM
        emotionalStability: 0.78,
        recommendations: recommendations.slice(0, 3)
      });
      
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInsights();
    setRefreshing(false);
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return <span className="text-green-500">↗</span>;
      case 'decrease':
        return <span className="text-red-500">↘</span>;
      default:
        return <span className="text-gray-500">→</span>;
    }
  };

  const getStabilityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStabilityLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    return 'Needs Attention';
  };

  return (
    <MainLayout
      title="Emotion Insights"
      user={user}
      currentPage="insights" 
      onSettingsClick={() => console.log('Settings clicked')}
    >
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Emotion Analytics</h2>
            <p className="text-gray-600">Understand your emotional patterns and trends</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
              <option value="quarter">Past Quarter</option>
            </select>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full mr-2" />
              ) : (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              Refresh
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))
          ) : insights ? (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-primary-600 mb-2">
                    {insights.totalSessions}
                  </div>
                  <div className="text-sm text-gray-600">Total Sessions</div>
                  <div className="text-xs text-gray-500 mt-1">
                    This {selectedTimeRange}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {insights.averageSessionLength}m
                  </div>
                  <div className="text-sm text-gray-600">Avg Session Length</div>
                  <div className="text-xs text-gray-500 mt-1">
                    +12% from last {selectedTimeRange}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {formatHour(insights.mostActiveHour)}
                  </div>
                  <div className="text-sm text-gray-600">Most Active Hour</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Peak engagement time
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className={`text-3xl font-bold mb-2 ${getStabilityColor(insights.emotionalStability)}`}>
                    {(insights.emotionalStability * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-600">Emotional Stability</div>
                  <div className={`text-xs mt-1 ${getStabilityColor(insights.emotionalStability)}`}>
                    {getStabilityLabel(insights.emotionalStability)}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>

        {/* Emotion Trends */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Emotion Trends</h3>
            <p className="text-sm text-gray-600">
              Compare current {selectedTimeRange} with previous period
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-2 w-full mb-2" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            ) : insights ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {insights.emotionTrends.map((trend) => (
                  <div key={trend.emotion} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <EmotionIndicator 
                          emotion={trend.emotion as any}
                          size="sm"
                          showEmoji
                          hideLabel
                        />
                        <span className="font-medium capitalize">{trend.emotion}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {getChangeIcon(trend.changeType)}
                        <span className={`text-xs font-medium ${
                          trend.changeType === 'increase' ? 'text-green-600' :
                          trend.changeType === 'decrease' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {Math.abs(trend.change).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <Progress 
                      value={trend.current} 
                      max={100}
                      className="mb-2"
                      color={trend.emotion as any}
                    />
                    
                    <div className="text-xs text-gray-600">
                      Current: {trend.current.toFixed(1)}% • Previous: {trend.previous.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Time Patterns */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Daily Emotion Patterns</h3>
            <p className="text-sm text-gray-600">
              How your emotions change throughout the day
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-6 flex-1" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : insights ? (
              <div className="space-y-3">
                {insights.timePatterns
                  .filter(pattern => pattern.totalDetections > 2) // Only show active hours
                  .slice(0, 12) // Limit to 12 hours for better visualization
                  .map((pattern) => (
                    <div key={pattern.hour} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg">
                      <div className="w-16 text-sm font-medium text-gray-700">
                        {formatHour(pattern.hour)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <EmotionIndicator 
                            emotion={pattern.dominantEmotion as any}
                            size="sm"
                            showEmoji
                            hideLabel
                          />
                          <span className="text-sm capitalize font-medium">
                            {pattern.dominantEmotion}
                          </span>
                          <Badge variant="secondary" size="sm">
                            {pattern.totalDetections.toFixed(0)} detections
                          </Badge>
                        </div>
                        
                        <div className="flex space-x-1">
                          {Object.entries(pattern.emotions)
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 3)
                            .map(([emotion, value]) => (
                              <div 
                                key={emotion}
                                className="h-2 bg-gradient-to-r from-primary-200 to-primary-400 rounded-full"
                                style={{ width: `${(value / pattern.totalDetections) * 100}%` }}
                                title={`${emotion}: ${((value / pattern.totalDetections) * 100).toFixed(1)}%`}
                              />
                            ))}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        {((pattern.totalDetections / insights.totalSessions) * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">🤖 AI Insights & Recommendations</h3>
            <p className="text-sm text-gray-600">
              Personalized insights based on your emotion patterns
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 border border-gray-200 rounded-lg">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))}
              </div>
            ) : insights ? (
              <div className="space-y-4">
                {insights.recommendations.map((recommendation, index) => (
                  <div key={index} className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-primary-600 text-sm font-medium">
                          {index + 1}
                        </span>
                      </div>
                      <p className="text-sm text-primary-800 leading-relaxed">
                        {recommendation}
                      </p>
                    </div>
                  </div>
                ))}
                
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      💡 Want more detailed insights?
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Upgrade to Premium to get advanced emotion analytics, personalized coaching tips, and detailed behavioral pattern analysis.
                  </p>
                  <Button size="sm" variant="outline">
                    Learn More
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
