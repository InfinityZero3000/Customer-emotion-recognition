import React from 'react';
import { Progress } from './Progress';
import { emotionColors } from './EmotionIndicator';
import { type EmotionType } from '@repo/shared-types';

export interface ConfidenceBarProps {
  /**
   * Object containing emotion names and their confidence values
   */
  emotions: Record<string, number>;
  /**
   * The dominant emotion
   */
  dominantEmotion?: string;
  /**
   * Whether to show percentage values
   */
  showValues?: boolean;
  /**
   * Whether to animate the bars
   */
  animated?: boolean;
  /**
   * Maximum number of emotions to display
   */
  maxEmotions?: number;
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Custom className
   */
  className?: string;
}

const ConfidenceBar: React.FC<ConfidenceBarProps> = ({
  emotions,
  dominantEmotion,
  showValues = true,
  animated = true,
  maxEmotions = 7,
  size = 'md',
  className = '',
}) => {
  // Sort emotions by confidence (highest first)
  const sortedEmotions = Object.entries(emotions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxEmotions);

  // Size classes
  const sizeClasses = {
    sm: {
      bar: 'h-1',
      text: 'text-xs',
      spacing: 'space-y-1',
    },
    md: {
      bar: 'h-2',
      text: 'text-sm',
      spacing: 'space-y-2',
    },
    lg: {
      bar: 'h-3',
      text: 'text-base',
      spacing: 'space-y-3',
    },
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`w-full ${currentSize.spacing} ${className}`}>
      {sortedEmotions.map(([emotion, confidence]) => {
        const percentage = Math.round(confidence * 100);
        const isEmotionType = emotion in emotionColors;
        const emotionColor = isEmotionType 
          ? emotionColors[emotion as EmotionType] 
          : '#6b7280';
        const isDominant = emotion === dominantEmotion;
        
        return (
          <div key={emotion} className="w-full">
            <div className="flex items-center justify-between mb-1">
              <span 
                className={`
                  capitalize font-medium
                  ${currentSize.text}
                  ${isDominant ? 'text-gray-900 font-semibold' : 'text-gray-600'}
                `}
              >
                {emotion}
              </span>
              {showValues && (
                <span 
                  className={`
                    font-mono
                    ${currentSize.text}
                    ${isDominant ? 'text-gray-900 font-semibold' : 'text-gray-500'}
                  `}
                >
                  {percentage}%
                </span>
              )}
            </div>
            
            <div className="relative">
              <Progress
                value={percentage}
                variant="emotion"
                emotionColor={emotionColor}
                animated={animated}
                className={`
                  ${currentSize.bar}
                  ${isDominant ? 'ring-2 ring-offset-1' : ''}
                `}
                style={{
                  '--ring-color': emotionColor,
                } as React.CSSProperties}
              />
              
              {/* Glow effect for dominant emotion */}
              {isDominant && animated && (
                <div 
                  className="absolute inset-0 rounded-full opacity-50 animate-pulse"
                  style={{
                    boxShadow: `0 0 10px ${emotionColor}`,
                  }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export { ConfidenceBar };
