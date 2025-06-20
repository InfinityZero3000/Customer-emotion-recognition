import React from 'react';
import { Badge } from '@repo/ui';

export interface SidebarItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  active?: boolean;
  badge?: string | number;
  description?: string;
}

export interface SidebarProps {
  /**
   * Sidebar navigation items
   */
  items: SidebarItem[];
  /**
   * Whether the sidebar is collapsed
   */
  isCollapsed?: boolean;
  /**
   * Toggle collapsed state
   */
  onToggleCollapse?: () => void;
  /**
   * Item click handler
   */
  onItemClick?: (item: SidebarItem) => void;
  /**
   * Whether to show on mobile
   */
  showOnMobile?: boolean;
  /**
   * Custom className
   */
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  items,
  isCollapsed = false,
  onToggleCollapse,
  onItemClick,
  showOnMobile = false,
  className = '',
}) => {
  const handleItemClick = (item: SidebarItem) => {
    if (onItemClick) {
      onItemClick(item);
    }
  };

  return (
    <aside className={`
      bg-white border-r border-gray-200 shadow-sm transition-all duration-300
      ${isCollapsed ? 'w-16' : 'w-64'}
      ${showOnMobile ? 'block' : 'hidden lg:block'}
      ${className}
    `}>
      <div className="h-full flex flex-col">
        {/* Collapse Toggle */}
        {onToggleCollapse && (
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={onToggleCollapse}
              className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg 
                className={`w-5 h-5 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
              {!isCollapsed && (
                <span className="ml-2 text-sm font-medium text-gray-600">
                  Collapse
                </span>
              )}
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2">
          {items.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => handleItemClick(item)}
                className={`
                  w-full flex items-center px-3 py-2 rounded-lg text-left transition-all duration-200
                  group relative
                  ${item.active
                    ? 'bg-primary-100 text-primary-700 border border-primary-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }
                  ${isCollapsed ? 'justify-center' : 'justify-start'}
                `}
                title={isCollapsed ? item.label : undefined}
              >
                {/* Icon */}
                <div className={`flex-shrink-0 ${!isCollapsed && 'mr-3'}`}>
                  {item.icon}
                </div>

                {/* Label and Badge */}
                {!isCollapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">
                          {item.label}
                        </span>
                        {item.badge && (
                          <Badge 
                            variant={item.active ? 'default' : 'secondary'} 
                            size="sm"
                            className="ml-2"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="
                    absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md
                    opacity-0 group-hover:opacity-100 transition-opacity duration-200
                    whitespace-nowrap z-50 pointer-events-none
                  ">
                    {item.label}
                    {item.badge && (
                      <span className="ml-2 px-1 py-0.5 bg-white/20 rounded text-xs">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className={`p-4 border-t border-gray-200 ${isCollapsed && 'text-center'}`}>
          <div className={`text-xs text-gray-500 ${isCollapsed ? 'hidden' : 'block'}`}>
            <p className="font-medium">Emotion Recognition System</p>
            <p>v2.0.0</p>
          </div>
          {isCollapsed && (
            <div className="w-6 h-6 bg-gradient-to-br from-primary-400 to-primary-600 rounded mx-auto" />
          )}
        </div>
      </div>
    </aside>
  );
};

export { Sidebar, type SidebarItem };
