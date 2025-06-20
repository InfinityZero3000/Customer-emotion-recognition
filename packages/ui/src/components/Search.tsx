'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/index';

const searchVariants = cva(
  'relative w-full',
  {
    variants: {
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  category?: string;
  icon?: React.ReactNode;
  data?: any;
}

export interface SearchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'results'>, VariantProps<typeof searchVariants> {
  /**
   * Search results to display
   */
  results?: SearchResult[];
  /**
   * Whether to show results dropdown
   */
  showResults?: boolean;
  /**
   * Loading state
   */
  loading?: boolean;
  /**
   * Search value
   */
  value?: string;
  /**
   * Search change handler
   */
  onSearch?: (query: string) => void;
  /**
   * Result selection handler
   */
  onResultSelect?: (result: SearchResult) => void;
  /**
   * Clear handler
   */
  onClear?: () => void;
  /**
   * Debounce delay in milliseconds
   */
  debounceDelay?: number;
  /**
   * Custom empty state message
   */
  emptyMessage?: string;
  /**
   * Custom loading message
   */
  loadingMessage?: string;
}

const Search = React.forwardRef<HTMLInputElement, SearchProps>(
  ({ 
    className,
    size,
    results = [],
    showResults = true,
    loading = false,
    placeholder = "Search...",
    value: controlledValue,
    onSearch,
    onResultSelect,
    onClear,
    debounceDelay = 300,
    emptyMessage = "No results found",
    loadingMessage = "Searching...",
    ...props 
  }, ref) => {
    const [internalValue, setInternalValue] = useState(controlledValue || '');
    const [showDropdown, setShowDropdown] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const searchValue = controlledValue !== undefined ? controlledValue : internalValue;

    useEffect(() => {
      if (controlledValue !== undefined) {
        setInternalValue(controlledValue);
      }
    }, [controlledValue]);

    useEffect(() => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (searchValue && onSearch) {
        debounceRef.current = setTimeout(() => {
          onSearch(searchValue);
        }, debounceDelay);
      }

      return () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
      };
    }, [searchValue, onSearch, debounceDelay]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current &&
          !inputRef.current.contains(event.target as Node)
        ) {
          setShowDropdown(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      
      setShowDropdown(newValue.length > 0 && showResults);
      setHighlightedIndex(-1);
      
      if (props.onChange) {
        props.onChange(e);
      }
    };

    const handleInputFocus = () => {
      if (searchValue.length > 0 && showResults) {
        setShowDropdown(true);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showDropdown || results.length === 0) {
        if (props.onKeyDown) {
          props.onKeyDown(e);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : results.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && results[highlightedIndex]) {
            handleResultSelect(results[highlightedIndex]);
          }
          break;
        case 'Escape':
          setShowDropdown(false);
          setHighlightedIndex(-1);
          break;
        default:
          if (props.onKeyDown) {
            props.onKeyDown(e);
          }
      }
    };

    const handleResultSelect = (result: SearchResult) => {
      setShowDropdown(false);
      setHighlightedIndex(-1);
      onResultSelect?.(result);
    };

    const handleClear = () => {
      if (controlledValue === undefined) {
        setInternalValue('');
      }
      setShowDropdown(false);
      setHighlightedIndex(-1);
      onClear?.();
    };

    const inputSizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-4 py-3 text-lg',
    };

    return (
      <div className={cn(searchVariants({ size }), className)}>
        <div className="relative">
          <input
            ref={ref || inputRef}
            type="text"
            value={searchValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              'w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              inputSizeClasses[size || 'md'],
              searchValue ? 'pr-20' : 'pr-10'
            )}
            {...props}
          />

          {/* Search Icon */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <div className="flex items-center space-x-1">
              {loading && (
                <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full" />
              )}
              
              {searchValue && !loading && (
                <button
                  onClick={handleClear}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  type="button"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Results Dropdown */}
        {showDropdown && showResults && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
          >
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-primary-600 rounded-full mx-auto mb-2" />
                {loadingMessage}
              </div>
            ) : results.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {emptyMessage}
              </div>
            ) : (
              <div className="py-1">
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultSelect(result)}
                    className={cn(
                      'w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0',
                      highlightedIndex === index && 'bg-gray-50'
                    )}
                  >
                    <div className="flex items-start space-x-3">
                      {result.icon && (
                        <div className="flex-shrink-0 mt-1">
                          {result.icon}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {result.title}
                          </h4>
                          {result.category && (
                            <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                              {result.category}
                            </span>
                          )}
                        </div>
                        {result.description && (
                          <p className="text-sm text-gray-500 truncate mt-1">
                            {result.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

Search.displayName = 'Search';

export { Search, searchVariants };
