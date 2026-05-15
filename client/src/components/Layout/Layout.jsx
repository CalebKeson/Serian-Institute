// src/components/Layout/Layout.jsx - SIMPLIFIED BUT OPTIMIZED
import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Sticky Sidebar - Desktop only */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Mobile header - Reduced padding and better spacing */}
        <header className="md:hidden bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center space-x-2">
              <div className="h-7 w-7 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs">SI</span>
              </div>
              <span className="font-semibold text-gray-900 text-sm">Serian Institute</span>
            </div>
            {/* Simple menu button - you can add mobile sidebar toggle later */}
            <div className="h-7 w-7 rounded-lg bg-gray-100 flex items-center justify-center">
              <div className="w-4 h-0.5 bg-gray-600 mb-1"></div>
              <div className="w-4 h-0.5 bg-gray-600"></div>
            </div>
          </div>
        </header>
        
        {/* Page Content - Responsive padding */}
        <main className="flex-1 overflow-x-hidden">
          {/* Responsive padding: smaller on mobile, larger on desktop */}
          <div className="p-3 sm:p-4 md:p-5 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;