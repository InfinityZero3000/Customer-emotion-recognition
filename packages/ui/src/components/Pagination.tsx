import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';

const paginationVariants = cva(
  'flex items-center justify-center space-x-1',
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

const pageButtonVariants = cva(
  'inline-flex items-center justify-center border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      size: {
        sm: 'px-2 py-1 text-sm min-w-[2rem] h-8',
        md: 'px-3 py-2 text-base min-w-[2.5rem] h-10',
        lg: 'px-4 py-3 text-lg min-w-[3rem] h-12',
      },
      variant: {
        default: 'rounded-md',
        pill: 'rounded-full',
      },
      active: {
        true: 'bg-primary-600 border-primary-600 text-white hover:bg-primary-700 hover:text-white',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
      active: false,
    },
  }
);

export interface PaginationProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof paginationVariants> {
  /**
   * Current page (1-based)
   */
  currentPage: number;
  /**
   * Total number of pages
   */
  totalPages: number;
  /**
   * Page change handler
   */
  onPageChange: (page: number) => void;
  /**
   * Number of visible page buttons around current page
   */
  siblingCount?: number;
  /**
   * Whether to show first/last page buttons
   */
  showFirstLast?: boolean;
  /**
   * Whether to show previous/next buttons
   */
  showPrevNext?: boolean;
  /**
   * Button variant
   */
  buttonVariant?: 'default' | 'pill';
  /**
   * Custom labels
   */
  labels?: {
    previous?: string;
    next?: string;
    first?: string;
    last?: string;
  };
  /**
   * Whether to show page info
   */
  showInfo?: boolean;
  /**
   * Total number of items (for info display)
   */
  totalItems?: number;
  /**
   * Items per page (for info display)
   */
  itemsPerPage?: number;
}

const Pagination = React.forwardRef<HTMLDivElement, PaginationProps>(
  ({ 
    className,
    size,
    currentPage,
    totalPages,
    onPageChange,
    siblingCount = 1,
    showFirstLast = true,
    showPrevNext = true,
    buttonVariant = 'default',
    labels = {
      previous: 'Previous',
      next: 'Next',
      first: 'First',
      last: 'Last',
    },
    showInfo = false,
    totalItems,
    itemsPerPage,
    ...props 
  }, ref) => {
    
    // Generate page numbers to display
    const generatePages = () => {
      const pages: (number | string)[] = [];
      
      // Always show first page
      if (showFirstLast) {
        pages.push(1);
      }
      
      // Calculate range around current page
      const startPage = Math.max(showFirstLast ? 2 : 1, currentPage - siblingCount);
      const endPage = Math.min(showFirstLast ? totalPages - 1 : totalPages, currentPage + siblingCount);
      
      // Add ellipsis after first page if needed
      if (showFirstLast && startPage > 2) {
        pages.push('...');
      }
      
      // Add pages around current page
      for (let i = startPage; i <= endPage; i++) {
        if (!showFirstLast || (i !== 1 && i !== totalPages)) {
          pages.push(i);
        }
      }
      
      // Add ellipsis before last page if needed
      if (showFirstLast && endPage < totalPages - 1) {
        pages.push('...');
      }
      
      // Always show last page
      if (showFirstLast && totalPages > 1) {
        pages.push(totalPages);
      }
      
      return pages;
    };

    const pages = generatePages();
    
    const handlePageClick = (page: number) => {
      if (page >= 1 && page <= totalPages && page !== currentPage) {
        onPageChange(page);
      }
    };

    if (totalPages <= 1) {
      return showInfo && totalItems ? (
        <div className="text-sm text-gray-600 text-center">
          Showing {totalItems} item{totalItems !== 1 ? 's' : ''}
        </div>
      ) : null;
    }

    const getItemRange = () => {
      if (!totalItems || !itemsPerPage) return null;
      
      const start = (currentPage - 1) * itemsPerPage + 1;
      const end = Math.min(currentPage * itemsPerPage, totalItems);
      
      return { start, end };
    };

    const itemRange = getItemRange();

    return (
      <div ref={ref} className={cn('flex flex-col items-center space-y-4', className)} {...props}>
        {/* Page Info */}
        {showInfo && itemRange && totalItems && (
          <div className="text-sm text-gray-600 text-center">
            Showing {itemRange.start} to {itemRange.end} of {totalItems} results
          </div>
        )}

        {/* Pagination Controls */}
        <nav className={cn(paginationVariants({ size }))}>
          {/* Previous Button */}
          {showPrevNext && (
            <button
              onClick={() => handlePageClick(currentPage - 1)}
              disabled={currentPage === 1}
              className={cn(
                pageButtonVariants({ size, variant: buttonVariant }),
                'mr-2'
              )}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">{labels.previous}</span>
            </button>
          )}

          {/* Page Numbers */}
          {pages.map((page, index) => (
            typeof page === 'number' ? (
              <button
                key={page}
                onClick={() => handlePageClick(page)}
                className={cn(
                  pageButtonVariants({ 
                    size, 
                    variant: buttonVariant, 
                    active: page === currentPage 
                  })
                )}
              >
                {page}
              </button>
            ) : (
              <span
                key={`ellipsis-${index}`}
                className={cn(
                  'inline-flex items-center justify-center text-gray-500',
                  size === 'sm' ? 'px-2 py-1 text-sm h-8' :
                  size === 'lg' ? 'px-4 py-3 text-lg h-12' :
                  'px-3 py-2 text-base h-10'
                )}
              >
                {page}
              </span>
            )
          ))}

          {/* Next Button */}
          {showPrevNext && (
            <button
              onClick={() => handlePageClick(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={cn(
                pageButtonVariants({ size, variant: buttonVariant }),
                'ml-2'
              )}
            >
              <span className="hidden sm:inline">{labels.next}</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </nav>

        {/* Jump to page (for large page counts) */}
        {totalPages > 10 && (
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-600">Go to page:</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (!isNaN(page)) {
                  handlePageClick(page);
                }
              }}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <span className="text-gray-600">of {totalPages}</span>
          </div>
        )}
      </div>
    );
  }
);

Pagination.displayName = 'Pagination';

export { Pagination, paginationVariants, pageButtonVariants };
