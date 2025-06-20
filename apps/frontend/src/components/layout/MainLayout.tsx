import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar, type SidebarItem } from './Sidebar';

export interface MainLayoutProps {
  /**
   * Page content
   */
  children: React.ReactNode;
  /**
   * Page title
   */
  title?: string;
  /**
   * Whether the system is connected
   */
  isConnected?: boolean;
  /**
   * Current user
   */
  user?: {
    name?: string;
    avatar?: string;
  };
  /**
   * Current page identifier for active state
   */
  currentPage?: string;
  /**
   * Settings click handler
   */
  onSettingsClick?: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title,
  isConnected = false,
  user,
  currentPage = 'dashboard',
  onSettingsClick,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Navigation items for sidebar
  const sidebarItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/',
      active: currentPage === 'dashboard',
      description: 'Real-time emotion detection',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m8 5 4-4 4 4" />
        </svg>
      ),
    },
    {
      id: 'history',
      label: 'History',
      href: '/history',
      active: currentPage === 'history',
      description: 'Emotion timeline & patterns',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'insights',
      label: 'Insights',
      href: '/insights',
      active: currentPage === 'insights',
      description: 'Analytics & trends',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'recommendations',
      label: 'Recommendations',
      href: '/recommendations',
      active: currentPage === 'recommendations',
      description: 'Product suggestions',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      href: '/settings',
      active: currentPage === 'settings',
      description: 'Preferences & privacy',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  // Header navigation items
  const headerNavItems = [
    { label: 'Dashboard', href: '/', active: currentPage === 'dashboard' },
    { label: 'History', href: '/history', active: currentPage === 'history' },
    { label: 'Insights', href: '/insights', active: currentPage === 'insights' },
  ];

  const handleSidebarItemClick = (item: SidebarItem) => {
    // Navigate to the item's href
    if (typeof window !== 'undefined') {
      window.location.href = item.href;
    }
    
    // Close mobile sidebar
    setShowMobileSidebar(false);
  };

  const handleMobileMenuToggle = () => {
    setShowMobileSidebar(!showMobileSidebar);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header
        isConnected={isConnected}
        user={user}
        navigationItems={headerNavItems}
        showMobileMenu={showMobileSidebar}
        onMobileMenuToggle={handleMobileMenuToggle}
        onSettingsClick={onSettingsClick}
      />

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <Sidebar
          items={sidebarItems}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onItemClick={handleSidebarItemClick}
          showOnMobile={showMobileSidebar}
        />

        {/* Mobile sidebar overlay */}
        {showMobileSidebar && (
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowMobileSidebar(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="h-full">
            {title && (
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              </div>
            )}
            <div className="p-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export { MainLayout };
