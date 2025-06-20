import React from 'react';
import { Chart, type ChartProps } from './Chart';
import { cn } from '../utils';

export interface LineChartData {
  label: string;
  value: number;
}

export interface LineChartDataset {
  name: string;
  data: LineChartData[];
  color?: string;
  emotion?: string;
}

export interface LineChartProps extends Omit<ChartProps, 'children'> {
  /**
   * Chart datasets
   */
  datasets: LineChartDataset[];
  /**
   * Maximum value for scaling
   */
  maxValue?: number;
  /**
   * Whether to show grid lines
   */
  showGrid?: boolean;
  /**
   * Whether to show dots on data points
   */
  showDots?: boolean;
  /**
   * Whether to fill area under line
   */
  filled?: boolean;
  /**
   * Line tension (0 = straight lines, 1 = curved)
   */
  tension?: number;
  /**
   * Point click handler
   */
  onPointClick?: (dataset: LineChartDataset, dataPoint: LineChartData, index: number) => void;
}

const emotionColors: Record<string, string> = {
  happy: '#10b981',
  sad: '#3b82f6',
  angry: '#ef4444',
  surprised: '#f59e0b',
  fearful: '#8b5cf6',
  disgusted: '#f97316',
  neutral: '#6b7280',
};

const defaultColors = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#f97316',
  '#6b7280',
];

const LineChart = React.forwardRef<HTMLDivElement, LineChartProps>(
  ({ 
    datasets, 
    maxValue, 
    showGrid = true, 
    showDots = true, 
    filled = false,
    tension = 0.3,
    onPointClick,
    ...chartProps 
  }, ref) => {
    const allValues = datasets.flatMap(dataset => dataset.data.map(d => d.value));
    const chartMaxValue = maxValue || Math.max(...allValues, 0);
    const chartMinValue = Math.min(...allValues, 0);
    const valueRange = chartMaxValue - chartMinValue;
    
    const getDatasetColor = (dataset: LineChartDataset, index: number) => {
      if (dataset.color) return dataset.color;
      if (dataset.emotion && emotionColors[dataset.emotion]) {
        return emotionColors[dataset.emotion];
      }
      return defaultColors[index % defaultColors.length];
    };

    const getYPosition = (value: number, height: number) => {
      if (valueRange === 0) return height / 2;
      return height - ((value - chartMinValue) / valueRange) * height;
    };

    const generateSVGPath = (dataset: LineChartDataset, width: number, height: number) => {
      if (dataset.data.length === 0) return '';
      
      const points = dataset.data.map((point, index) => ({
        x: (index / (dataset.data.length - 1)) * width,
        y: getYPosition(point.value, height),
      }));

      if (tension === 0) {
        // Straight lines
        let path = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
          path += ` L ${points[i].x} ${points[i].y}`;
        }
        return path;
      } else {
        // Curved lines (simplified Bezier curves)
        if (points.length < 2) return `M ${points[0].x} ${points[0].y}`;
        
        let path = `M ${points[0].x} ${points[0].y}`;
        
        for (let i = 1; i < points.length; i++) {
          const prev = points[i - 1];
          const curr = points[i];
          const next = points[i + 1];
          
          if (i === 1) {
            // First curve
            const cp1x = prev.x + (curr.x - prev.x) * tension;
            const cp1y = prev.y;
            const cp2x = curr.x - (next ? (next.x - prev.x) * tension * 0.5 : 0);
            const cp2y = curr.y;
            path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
          } else if (i === points.length - 1) {
            // Last curve
            const prevPrev = points[i - 2];
            const cp1x = prev.x + (curr.x - prevPrev.x) * tension * 0.5;
            const cp1y = prev.y;
            const cp2x = curr.x - (curr.x - prev.x) * tension;
            const cp2y = curr.y;
            path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
          } else {
            // Middle curves
            const prevPrev = points[i - 2];
            const cp1x = prev.x + (curr.x - prevPrev.x) * tension * 0.5;
            const cp1y = prev.y;
            const cp2x = curr.x - (next.x - prev.x) * tension * 0.5;
            const cp2y = curr.y;
            path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
          }
        }
        
        return path;
      }
    };

    return (
      <Chart ref={ref} {...chartProps}>
        <div className="p-4 h-full flex flex-col">
          <div className="flex-1 relative">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Grid lines */}
              {showGrid && (
                <g className="opacity-20">
                  {/* Horizontal grid lines */}
                  {[0, 25, 50, 75, 100].map(y => (
                    <line
                      key={`h-grid-${y}`}
                      x1="0"
                      y1={y}
                      x2="100"
                      y2={y}
                      stroke="currentColor"
                      strokeWidth="0.5"
                    />
                  ))}
                  {/* Vertical grid lines */}
                  {datasets[0]?.data.map((_, index) => {
                    const x = (index / (datasets[0].data.length - 1)) * 100;
                    return (
                      <line
                        key={`v-grid-${index}`}
                        x1={x}
                        y1="0"
                        x2={x}
                        y2="100"
                        stroke="currentColor"
                        strokeWidth="0.5"
                      />
                    );
                  })}
                </g>
              )}

              {/* Dataset lines and areas */}
              {datasets.map((dataset, datasetIndex) => {
                const color = getDatasetColor(dataset, datasetIndex);
                const path = generateSVGPath(dataset, 100, 100);
                
                return (
                  <g key={`dataset-${datasetIndex}`}>
                    {/* Filled area */}
                    {filled && path && (
                      <path
                        d={`${path} L 100 100 L 0 100 Z`}
                        fill={color}
                        fillOpacity="0.1"
                      />
                    )}
                    
                    {/* Line */}
                    {path && (
                      <path
                        d={path}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Data points */}
                    {showDots && dataset.data.map((point, pointIndex) => {
                      const x = (pointIndex / (dataset.data.length - 1)) * 100;
                      const y = getYPosition(point.value, 100);
                      
                      return (
                        <circle
                          key={`dot-${datasetIndex}-${pointIndex}`}
                          cx={x}
                          cy={y}
                          r="1.5"
                          fill={color}
                          stroke="white"
                          strokeWidth="1"
                          className={cn(
                            "transition-all duration-200",
                            onPointClick && "cursor-pointer hover:r-2"
                          )}
                          onClick={() => onPointClick?.(dataset, point, pointIndex)}
                        />
                      );
                    })}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Labels */}
          {datasets[0]?.data && (
            <div className="flex justify-between space-x-2 mt-3 pt-2 border-t border-gray-200">
              {datasets[0].data.map((point, index) => (
                <div 
                  key={`label-${index}`}
                  className="flex-1 text-center min-w-0"
                >
                  <span className="text-xs text-gray-600 truncate block">
                    {point.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Legend */}
          {datasets.length > 1 && (
            <div className="flex flex-wrap gap-4 mt-3 pt-2 border-t border-gray-200">
              {datasets.map((dataset, index) => (
                <div key={`legend-${index}`} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-0.5 rounded-full"
                    style={{ backgroundColor: getDatasetColor(dataset, index) }}
                  />
                  <span className="text-xs text-gray-600">{dataset.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Chart>
    );
  }
);

LineChart.displayName = 'LineChart';

export { LineChart };
