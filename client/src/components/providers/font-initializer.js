"use client";

import { useEffect, useState } from "react";
import { fontManager } from "@/utils/font-manager";

/**
 * Font Initializer Component
 * Initializes the font system when the app loads
 */
export function FontInitializer({ children }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeFonts = async () => {
      try {
        console.log('🎨 Initializing font system...');
        const fonts = await fontManager.initialize();
        console.log(`✅ Font system ready with ${fonts.length} fonts`);
        setIsInitialized(true);
      } catch (error) {
        console.error('❌ Font system initialization failed:', error);
        setIsInitialized(true); // Still allow app to load with fallback fonts
      } finally {
        setIsLoading(false);
      }
    };

    initializeFonts();
  }, []);

  // Show loading state for critical font loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center space-y-4">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-800">Loading Fonts</h3>
            <p className="text-sm text-slate-600">Preparing typography system...</p>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

/**
 * Font Status Display Component (for development)
 * Shows current font loading status
 */
export function FontStatusDisplay() {
  const [fontStats, setFontStats] = useState({});

  useEffect(() => {
    const updateStats = () => {
      setFontStats({
        total: fontManager.getFontFamilies().length,
        categorized: fontManager.getCategorizedFonts(),
        recent: fontManager.getRecentFonts(),
        initialized: fontManager.isInitialized
      });
    };

    updateStats();
    
    // Update every 5 seconds
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs font-mono z-50 max-w-xs">
      <div className="space-y-1">
        <div className="font-semibold text-blue-300">Font System Status</div>
        <div>Status: {fontStats.initialized ? '✅ Ready' : '⏳ Loading'}</div>
        <div>Total Fonts: {fontStats.total || 0}</div>
        {fontStats.categorized && (
          <div className="text-xs text-gray-300">
            <div>System: {fontStats.categorized.system?.length || 0}</div>
            <div>Google: {fontStats.categorized.google?.length || 0}</div>
            <div>Custom: {fontStats.categorized.custom?.length || 0}</div>
            <div>Recent: {fontStats.recent?.length || 0}</div>
          </div>
        )}
      </div>
    </div>
  );
}