import React from 'react';

export type BadgeVariant = 
  | 'default' 
  | 'secondary' 
  | 'destructive' 
  | 'outline'
  | 'happy' 
  | 'sad' 
  | 'angry' 
  | 'surprise' 
  | 'fear' 
  | 'disgust' 
  | 'neutral' 
  | 'unknown';

export type BadgeSize = 'default' | 'sm' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Visual style variant
   */
  variant?: BadgeVariant;
  /**
   * Size variant
   */
  size?: BadgeSize;
  /**
   * Whether to show a pulse animation
   */
  pulse?: boolean;
  /**
   * Icon to display before the text
   */
  icon?: React.ReactNode;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ 
    className = '', 
    variant = 'default', 
    size = 'default', 
    pulse = false, 
    icon, 
    children, 
    ...props 
  }, ref) => {
    // Base classes
    const baseClasses = 'inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
    
    // Variant classes
    const variantClasses = {
      default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
      secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
      destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
      outline: 'text-foreground border-input',
      // Emotion-specific variants
      happy: 'border-transparent bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
      sad: 'border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200',
      angry: 'border-transparent bg-red-100 text-red-800 hover:bg-red-200',
      surprise: 'border-transparent bg-amber-100 text-amber-800 hover:bg-amber-200',
      fear: 'border-transparent bg-violet-100 text-violet-800 hover:bg-violet-200',
      disgust: 'border-transparent bg-orange-100 text-orange-800 hover:bg-orange-200',
      neutral: 'border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200',
      unknown: 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100',
    };
    
    // Size classes
    const sizeClasses = {
      default: 'px-2.5 py-0.5 text-xs',
      sm: 'px-2 py-0.5 text-xs',
      lg: 'px-3 py-1 text-sm',
    };
    
    const pulseClass = pulse ? 'animate-pulse' : '';
    
    return (
      <div
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${pulseClass} ${className}`}
        {...props}
      >
        {icon && <span className="mr-1">{icon}</span>}
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
