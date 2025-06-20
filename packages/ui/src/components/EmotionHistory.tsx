import React from 'react';
import { Card, CardContent, CardHeader } from './Card';
import { EmotionIndicator } from './EmotionIndicator';
import { Badge } from './Badge';
import { type EmotionType, type EmotionHistoryEntry } from '@repo/shared-types';

export interface EmotionHistoryProps {
  /**
   * Array of emotion history entries
   */
  entries: EmotionHistoryEntry[];
  /**
   * Maximum number of entries to display
   */
  maxEntries?: number;
  /**
   * Whether to show timestamps
   */
  showTimestamp?: boolean;
  /**
   * Whether to show page context
   */
  showContext?: boolean;
  /**
   * Whether to group by time periods
   */
  groupByTime?: boolean;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Click handler for individual entries
   */
  onEntryClick?: (entry: EmotionHistoryEntry) => void;
  /**
   * Whether to show in compact mode
   */
  compact?: boolean;
}

const EmotionHistory: React.FC<EmotionHistoryProps> = ({
  entries,
  maxEntries = 20,
  showTimestamp = true,
  showContext = false,
  groupByTime = false,
  className = '',
  onEntryClick,
  compact = false,
}) => {
  // Limit entries to maxEntries
  const displayEntries = entries.slice(0, maxEntries);

  // Group entries by time if requested
  const groupedEntries = groupByTime ? groupEntriesByTime(displayEntries) : null;

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    
    return date.toLocaleDateString();
  };

  // Handle entry click
  const handleEntryClick = (entry: EmotionHistoryEntry) => {
    if (onEntryClick) {
      onEntryClick(entry);
    }
  };

  // Render individual entry
  const renderEntry = (entry: EmotionHistoryEntry, index: number) => {
    const isClickable = !!onEntryClick;
    
    return (
      <div
        key={`${entry.timestamp}-${index}`}
        className={`
          flex items-center justify-between p-3 rounded-lg transition-colors
          ${isClickable ? 'cursor-pointer hover:bg-gray-50' : ''}
          ${compact ? 'py-2' : 'py-3'}
        `}
        onClick={() => handleEntryClick(entry)}
      >
        <div className="flex items-center space-x-3 flex-1">
          <EmotionIndicator
            emotion={entry.emotion as EmotionType}
            confidence={entry.confidence}
            size={compact ? 'sm' : 'md'}
            showConfidence={!compact}
            animated={false}
          />
          
          {showContext && entry.pageUrl && (
            <Badge variant="outline" size="sm">
              Page: {new URL(entry.pageUrl).pathname}
            </Badge>
          )}
        </div>
        
        {showTimestamp && (
          <span className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
            {formatTimestamp(entry.timestamp)}
          </span>
        )}
      </div>
    );
  };

  // Render grouped entries
  const renderGroupedEntries = () => {
    if (!groupedEntries) return null;

    return Object.entries(groupedEntries).map(([period, periodEntries]) => (
      <div key={period} className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 px-3">
          {period}
        </h3>
        <div className="space-y-1">
          {periodEntries.map((entry, index) => renderEntry(entry, index))}
        </div>
      </div>
    ));
  };

  if (displayEntries.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500">No emotion history available</p>
          <p className="text-sm text-gray-400 mt-1">
            Start detecting emotions to build your history
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {!compact && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Emotion History</h2>
            <Badge variant="secondary" size="sm">
              {displayEntries.length} {displayEntries.length === 1 ? 'entry' : 'entries'}
            </Badge>
          </div>
        </CardHeader>
      )}
      
      <CardContent className={compact ? 'p-3' : 'p-6 pt-0'}>
        <div className={`
          max-h-96 overflow-y-auto 
          ${compact ? 'space-y-1' : 'space-y-2'}
        `}>
          {groupByTime ? renderGroupedEntries() : (
            displayEntries.map((entry, index) => renderEntry(entry, index))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to group entries by time periods
function groupEntriesByTime(entries: EmotionHistoryEntry[]): Record<string, EmotionHistoryEntry[]> {
  const groups: Record<string, EmotionHistoryEntry[]> = {};
  const now = new Date();
  
  entries.forEach(entry => {
    const entryDate = new Date(entry.timestamp);
    const diffInHours = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60));
    
    let period: string;
    if (diffInHours < 1) {
      period = 'Last hour';
    } else if (diffInHours < 24) {
      period = 'Today';
    } else if (diffInHours < 48) {
      period = 'Yesterday';
    } else if (diffInHours < 168) {
      period = 'This week';
    } else {
      period = 'Older';
    }
    
    if (!groups[period]) {
      groups[period] = [];
    }
    groups[period].push(entry);
  });
  
  return groups;
}

export { EmotionHistory };
