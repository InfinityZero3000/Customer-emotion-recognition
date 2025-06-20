import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Width of the skeleton
   */
  width?: string | number;
  /**
   * Height of the skeleton
   */
  height?: string | number;
  /**
   * Shape variant
   */
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  /**
   * Number of lines (for text variant)
   */
  lines?: number;
  /**
   * Whether to animate
   */
  animate?: boolean;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ 
    className = '', 
    width, 
    height, 
    variant = 'text', 
    lines = 1,
    animate = true,
    style,
    ...props 
  }, ref) => {
    // Base animation classes
    const animationClass = animate ? 'animate-pulse' : '';
    
    // Variant classes
    const variantClasses = {
      text: 'rounded',
      circular: 'rounded-full',
      rectangular: '',
      rounded: 'rounded-lg',
    };

    // Default dimensions based on variant
    const getDefaultDimensions = () => {
      switch (variant) {
        case 'text':
          return { width: '100%', height: '1rem' };
        case 'circular':
          return { width: '3rem', height: '3rem' };
        case 'rectangular':
          return { width: '100%', height: '8rem' };
        case 'rounded':
          return { width: '100%', height: '8rem' };
        default:
          return { width: '100%', height: '1rem' };
      }
    };

    const defaultDimensions = getDefaultDimensions();
    
    const skeletonStyle = {
      width: width || defaultDimensions.width,
      height: height || defaultDimensions.height,
      ...style,
    };

    // For text variant with multiple lines
    if (variant === 'text' && lines > 1) {
      return (
        <div ref={ref} className={`space-y-2 ${className}`} {...props}>
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              className={`bg-gray-300 ${variantClasses[variant]} ${animationClass}`}
              style={{
                width: index === lines - 1 ? '75%' : '100%',
                height: height || '1rem',
              }}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={`bg-gray-300 ${variantClasses[variant]} ${animationClass} ${className}`}
        style={skeletonStyle}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

// Skeleton components for common use cases
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-4 border border-gray-200 rounded-lg ${className}`}>
    <div className="flex items-center space-x-4 mb-4">
      <Skeleton variant="circular" width="3rem" height="3rem" />
      <div className="flex-1">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
    <Skeleton variant="rectangular" height="8rem" className="mb-4" />
    <Skeleton variant="text" lines={3} />
  </div>
);

export const SkeletonList: React.FC<{ items?: number; className?: string }> = ({ 
  items = 5, 
  className = '' 
}) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-center space-x-4">
        <Skeleton variant="circular" width="2.5rem" height="2.5rem" />
        <div className="flex-1">
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="60%" />
        </div>
        <Skeleton variant="rectangular" width="5rem" height="2rem" />
      </div>
    ))}
  </div>
);

export const SkeletonProfile: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex flex-col items-center text-center ${className}`}>
    <Skeleton variant="circular" width="6rem" height="6rem" className="mb-4" />
    <Skeleton variant="text" width="12rem" className="mb-2" />
    <Skeleton variant="text" width="8rem" className="mb-4" />
    <div className="flex space-x-2">
      <Skeleton variant="rounded" width="5rem" height="2.5rem" />
      <Skeleton variant="rounded" width="5rem" height="2.5rem" />
    </div>
  </div>
);

export { Skeleton };
