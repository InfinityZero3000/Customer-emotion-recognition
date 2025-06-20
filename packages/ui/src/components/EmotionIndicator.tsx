import React from 'react';
import { Badge } from './Badge';
import { type EmotionType } from '@repo/shared-types';

export interface EmotionIndicatorProps {
  /**
   * The detected emotion
   */
  emotion: EmotionType;
  /**
   * Confidence level (0-1)
   */
  confidence: number;
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Whether to show confidence percentage
   */
  showConfidence?: boolean;
  /**
   * Whether to animate the indicator
   */
  animated?: boolean;
  /**
   * Custom className
   */
  className?: string;
}

// Emotion emoji mapping
const emotionEmojis: Record<EmotionType, string> = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  surprise: '😲',
  fear: '😨',
  disgust: '🤢',
  neutral: '😐',
  unknown: '❓',
};

// Emotion color mapping
const emotionColors: Record<EmotionType, string> = {
  happy: '#10b981',
  sad: '#3b82f6',
  angry: '#ef4444',
  surprise: '#f59e0b',
  fear: '#8b5cf6',
  disgust: '#f97316',
  neutral: '#6b7280',
  unknown: '#9ca3af',
};

const EmotionIndicator: React.FC<EmotionIndicatorProps> = ({
  emotion,
  confidence,
  size = 'md',
  showConfidence = true,
  animated = true,
  className = '',
}) => {
  const confidencePercentage = Math.round(confidence * 100);
  
  // Size classes
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  // Animation classes
  const animationClass = animated ? 'animate-emotion-pulse' : '';
  
  // Get emotion color
  const emotionColor = emotionColors[emotion];
  
  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      {/* Emotion Badge */}
      <Badge
        variant={emotion}
        size={size === 'lg' ? 'lg' : 'default'}
        className={`${animationClass} ${sizeClasses[size]}`}
        icon={
          <span 
            className="text-base"
            style={{ color: emotionColor }}
          >
            {emotionEmojis[emotion]}
          </span>
        }
      >
        <span className="capitalize font-medium">{emotion}</span>
      </Badge>
      
      {/* Confidence Indicator */}
      {showConfidence && (
        <div className="flex items-center space-x-1">
          <div className="flex items-center">
            <span className={`font-medium ${sizeClasses[size]}`}>
              {confidencePercentage}%
            </span>
          </div>
          
          {/* Confidence Bar */}
          <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${confidencePercentage}%`,
                backgroundColor: emotionColor,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export { EmotionIndicator, emotionEmojis, emotionColors };
