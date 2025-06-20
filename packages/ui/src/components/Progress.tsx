import React from 'react';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The progress value (0-100)
   */
  value?: number;
  /**
   * Maximum value (default: 100)
   */
  max?: number;
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Visual variant
   */
  variant?: 'default' | 'emotion' | 'success' | 'warning' | 'error';
  /**
   * Whether to show the value as text
   */
  showValue?: boolean;
  /**
   * Whether to animate the progress
   */
  animated?: boolean;
  /**
   * Custom color for emotion-based progress
   */
  emotionColor?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ 
    className = '', 
    value = 0, 
    max = 100, 
    size = 'md',
    variant = 'default',
    showValue = false,
    animated = false,
    emotionColor,
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    
    // Size classes
    const sizeClasses = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
    };
    
    // Variant classes for the track
    const trackClasses = {
      default: 'bg-gray-200',
      emotion: 'bg-gray-200',
      success: 'bg-green-200',
      warning: 'bg-yellow-200',
      error: 'bg-red-200',
    };
    
    // Variant classes for the fill
    const fillClasses = {
      default: 'bg-primary-500',
      emotion: emotionColor ? '' : 'bg-blue-500',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      error: 'bg-red-500',
    };
    
    const animationClass = animated ? 'transition-all duration-500 ease-out' : '';
    
    return (
      <div ref={ref} className={`w-full ${className}`} {...props}>
        {showValue && (
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
        <div 
          className={`
            relative overflow-hidden rounded-full 
            ${sizeClasses[size]} 
            ${trackClasses[variant]}
          `}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        >
          <div
            className={`
              h-full rounded-full transition-all duration-300 ease-out
              ${fillClasses[variant]}
              ${animationClass}
            `}
            style={{
              width: `${percentage}%`,
              backgroundColor: variant === 'emotion' && emotionColor ? emotionColor : undefined,
            }}
          />
          {animated && (
            <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
          )}
        </div>
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export { Progress };
