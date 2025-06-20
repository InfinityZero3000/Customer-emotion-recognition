import React from 'react';
import { Chart, type ChartProps } from './Chart';
import { cn } from '../utils';

export interface BarChartData {
  label: string;
  value: number;
  color?: string;
  emotion?: string;
}

export interface BarChartProps extends Omit<ChartProps, 'children'> {
  /**
   * Chart data
   */
  data: BarChartData[];
  /**
   * Maximum value for scaling
   */
  maxValue?: number;
  /**
   * Whether to show values on bars
   */
  showValues?: boolean;
  /**
   * Whether to show labels
   */
  showLabels?: boolean;
  /**
   * Bar color theme
   */
  colorTheme?: 'primary' | 'emotion' | 'rainbow';
  /**
   * Bar click handler
   */
  onBarClick?: (data: BarChartData, index: number) => void;
}

const emotionColors: Record<string, string> = {
  happy: 'bg-emerald-500',
  sad: 'bg-blue-500',
  angry: 'bg-red-500',
  surprised: 'bg-yellow-500',
  fearful: 'bg-purple-500',
  disgusted: 'bg-orange-500',
  neutral: 'bg-gray-500',
};

const rainbowColors = [
  'bg-red-500',
  'bg-orange-500',
  'bg-yellow-500',
  'bg-green-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-purple-500',
];

const BarChart = React.forwardRef<HTMLDivElement, BarChartProps>(
  ({ 
    data, 
    maxValue, 
    showValues = true, 
    showLabels = true, 
    colorTheme = 'primary',
    onBarClick,
    ...chartProps 
  }, ref) => {
    const chartMaxValue = maxValue || Math.max(...data.map(d => d.value));
    
    const getBarColor = (item: BarChartData, index: number) => {
      if (item.color) return item.color;
      
      switch (colorTheme) {
        case 'emotion':
          return item.emotion ? emotionColors[item.emotion] || 'bg-gray-500' : 'bg-primary-500';
        case 'rainbow':
          return rainbowColors[index % rainbowColors.length];
        default:
          return 'bg-primary-500';
      }
    };

    return (
      <Chart ref={ref} {...chartProps}>
        <div className="p-4 h-full flex flex-col">
          <div className="flex-1 flex items-end justify-between space-x-2">
            {data.map((item, index) => {
              const height = chartMaxValue > 0 ? (item.value / chartMaxValue) * 100 : 0;
              const barColor = getBarColor(item, index);
              
              return (
                <div 
                  key={`${item.label}-${index}`}
                  className="flex-1 flex flex-col items-center min-w-0"
                >
                  <div className="w-full flex flex-col items-center">
                    {/* Value label */}
                    {showValues && (
                      <div className="text-xs font-medium text-gray-700 mb-1">
                        {typeof item.value === 'number' 
                          ? item.value % 1 === 0 
                            ? item.value.toString()
                            : item.value.toFixed(1)
                          : item.value
                        }
                      </div>
                    )}
                    
                    {/* Bar */}
                    <div className="w-full flex justify-center">
                      <div
                        className={cn(
                          'w-full max-w-12 rounded-t-sm transition-all duration-300 hover:opacity-80',
                          barColor,
                          onBarClick && 'cursor-pointer hover:scale-105'
                        )}
                        style={{ height: `${height}%`, minHeight: height > 0 ? '4px' : '0px' }}
                        onClick={() => onBarClick?.(item, index)}
                        title={`${item.label}: ${item.value}`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Labels */}
          {showLabels && (
            <div className="flex justify-between space-x-2 mt-3 pt-2 border-t border-gray-200">
              {data.map((item, index) => (
                <div 
                  key={`label-${item.label}-${index}`}
                  className="flex-1 text-center min-w-0"
                >
                  <span className="text-xs text-gray-600 truncate block">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Chart>
    );
  }
);

BarChart.displayName = 'BarChart';

export { BarChart };
