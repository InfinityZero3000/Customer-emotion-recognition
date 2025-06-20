import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';

const chartVariants = cva(
  'relative overflow-hidden rounded-lg',
  {
    variants: {
      variant: {
        default: 'bg-white border border-gray-200',
        card: 'bg-white border border-gray-200 shadow-sm',
        minimal: 'bg-transparent',
      },
      size: {
        sm: 'h-32',
        md: 'h-48',
        lg: 'h-64',
        xl: 'h-80',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface ChartProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof chartVariants> {
  /**
   * Chart title
   */
  title?: string;
  /**
   * Chart description
   */
  description?: string;
  /**
   * Whether to show chart loading state
   */
  loading?: boolean;
  /**
   * Custom loading component
   */
  loadingComponent?: React.ReactNode;
}

const Chart = React.forwardRef<HTMLDivElement, ChartProps>(
  ({ className, variant, size, title, description, loading, loadingComponent, children, ...props }, ref) => {
    const defaultLoading = (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-primary-600 rounded-full"></div>
      </div>
    );

    return (
      <div className="space-y-2">
        {(title || description) && (
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            )}
            {description && (
              <p className="text-sm text-gray-600">{description}</p>
            )}
          </div>
        )}
        
        <div
          ref={ref}
          className={cn(chartVariants({ variant, size }), className)}
          {...props}
        >
          {loading && (loadingComponent || defaultLoading)}
          {children}
        </div>
      </div>
    );
  }
);

Chart.displayName = 'Chart';

export { Chart, chartVariants };
