"use client";

import { useEffect, useState } from "react";
import { useTokenStore } from "@/store/token-store";
import { tokenManager } from "@/services/token-manager";

export function SessionStatus() {
  const [isVisible, setIsVisible] = useState(false);
  const [sessionStatus, setSessionStatus] = useState({
    status: "active",
    timeLeft: 0,
  });

  useEffect(() => {
    // Only show status widget when session is actually at risk
    const updateStatus = () => {
      const status = tokenManager.getSessionStatus();
      setSessionStatus(status);

      // Only show the widget when session is expiring soon (less than 2 minutes)
      setIsVisible(
        status.status === "expiring" && status.timeLeft <= 2 * 60 * 1000
      );
    };

    updateStatus();
    // Check less frequently to avoid constant updates
    const interval = setInterval(updateStatus, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const formatTimeLeft = (milliseconds) => {
    const minutes = Math.ceil(milliseconds / (1000 * 60));
    return `${minutes}m`;
  };

  // Don't render anything unless session is critically low
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg shadow-sm">
        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
        <span className="text-sm text-amber-700">
          Session expires in {formatTimeLeft(sessionStatus.timeLeft)}
        </span>
        <button
          onClick={() => tokenManager.refreshToken()}
          className="text-xs px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded transition-colors"
        >
          Extend
        </button>
      </div>
    </div>
  );
}

// Hook for session management
export function useSessionManager() {
  const tokenStore = useTokenStore();

  useEffect(() => {
    // Initialize token manager when component mounts
    tokenManager.initialize();

    return () => {
      // Cleanup when component unmounts
      tokenManager.destroy();
    };
  }, []);

  const extendSession = async () => {
    await tokenManager.refreshToken();
  };

  const enableAutoSave = (enabled) => {
    tokenStore.setAutoSaveEnabled(enabled);
  };

  return {
    extendSession,
    enableAutoSave,
    sessionStatus: tokenManager.getSessionStatus(),
    isRefreshing: tokenStore.isRefreshing,
    autoSaveEnabled: tokenStore.autoSaveEnabled,
  };
}
