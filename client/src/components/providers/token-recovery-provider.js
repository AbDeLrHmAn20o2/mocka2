"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { tokenManager } from "@/services/token-manager";
import { logger, LOG_CATEGORIES } from "@/utils/logger";
import { useTokenStore } from "@/store/token-store";
import { toast } from "sonner";

/**
 * Token Recovery Provider - monitors and handles token issues
 * This component should wrap your main application
 */
export function TokenRecoveryProvider({ children }) {
  const { data: session, status } = useSession();
  const [isInitialized, setIsInitialized] = useState(false);
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);
  const maxRecoveryAttempts = 3;

  useEffect(() => {
    let mounted = true;

    const initializeTokenManagement = async () => {
      if (status === "loading") {
        return; // Wait for session to load
      }

      if (!session && status === "unauthenticated") {
        logger.info(LOG_CATEGORIES.AUTH, "User not authenticated, skipping token management");
        setIsInitialized(true);
        return;
      }

      if (session && !isInitialized) {
        logger.info(LOG_CATEGORIES.TOKEN, "Initializing token management", {
          sessionStatus: status,
          hasSession: !!session,
          sessionExpires: session?.expires,
        });

        try {
          const success = await tokenManager.initialize();
          
          if (mounted) {
            if (success) {
              logger.info(LOG_CATEGORIES.TOKEN, "Token management initialized successfully");
              setIsInitialized(true);
              setRecoveryAttempts(0);
            } else {
              throw new Error("Token manager initialization failed");
            }
          }
        } catch (error) {
          logger.error(LOG_CATEGORIES.TOKEN, "Failed to initialize token management", {
            attempt: recoveryAttempts + 1,
            maxAttempts: maxRecoveryAttempts,
          }, error);

          if (mounted && recoveryAttempts < maxRecoveryAttempts) {
            setRecoveryAttempts(prev => prev + 1);
            
            // Retry with exponential backoff
            setTimeout(() => {
              if (mounted) {
                initializeTokenManagement();
              }
            }, Math.pow(2, recoveryAttempts) * 1000);
          } else if (mounted) {
            logger.critical(LOG_CATEGORIES.TOKEN, "Max initialization attempts reached", {
              attempts: recoveryAttempts,
            });
            
            toast.error("Authentication Setup Failed", {
              description: "Unable to set up authentication. Please refresh the page.",
              duration: 8000,
              action: {
                label: "Refresh",
                onClick: () => window.location.reload(),
              },
            });
          }
        }
      }
    };

    initializeTokenManagement();

    return () => {
      mounted = false;
    };
  }, [session, status, isInitialized, recoveryAttempts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isInitialized) {
        logger.info(LOG_CATEGORIES.TOKEN, "Cleaning up token management");
        tokenManager.destroy();
      }
    };
  }, [isInitialized]);

  return children;
}

/**
 * Token Status Indicator - shows current token status for debugging
 * Only renders in development
 */
export function TokenStatusIndicator() {
  const tokenStore = useTokenStore();
  const [isVisible, setIsVisible] = useState(false);

  // Only show in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Show/hide with Ctrl+Shift+T
      const handleKeyboard = (event) => {
        if (event.ctrlKey && event.shiftKey && event.key === 'T') {
          setIsVisible(prev => !prev);
        }
      };

      window.addEventListener('keydown', handleKeyboard);
      return () => window.removeEventListener('keydown', handleKeyboard);
    }
  }, []);

  if (process.env.NODE_ENV !== 'development' || !isVisible) {
    return null;
  }

  const timeUntilExpiration = tokenStore.getTimeUntilExpiration();
  const minutes = Math.floor(timeUntilExpiration / (1000 * 60));
  const seconds = Math.floor((timeUntilExpiration % (1000 * 60)) / 1000);

  const getStatusColor = () => {
    if (tokenStore.isTokenExpired()) return 'bg-red-500';
    if (tokenStore.isTokenExpiringSoon()) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (tokenStore.isRefreshing) return 'Refreshing...';
    if (tokenStore.isTokenExpired()) return 'Expired';
    if (tokenStore.isTokenExpiringSoon()) return `Expiring (${minutes}:${seconds.toString().padStart(2, '0')})`;
    return `Active (${minutes}:${seconds.toString().padStart(2, '0')})`;
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-sm font-mono z-50">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
        <span>Token: {getStatusText()}</span>
      </div>
      
      <div className="text-xs text-gray-300 space-y-1">
        <div>Attempts: {tokenStore.refreshAttempts}/{tokenStore.maxRefreshAttempts}</div>
        <div>Auto-save: {tokenStore.autoSaveEnabled ? 'ON' : 'OFF'}</div>
      </div>

      <div className="mt-2 flex gap-2">
        <button
          onClick={() => tokenManager.refreshToken()}
          disabled={tokenStore.isRefreshing}
          className="px-2 py-1 bg-blue-600 rounded text-xs hover:bg-blue-700 disabled:opacity-50"
        >
          Refresh
        </button>
        
        <button
          onClick={() => {
            const logs = logger.getRecentLogs(50, LOG_CATEGORIES.TOKEN);
            console.table(logs);
            toast.info("Token logs printed to console");
          }}
          className="px-2 py-1 bg-gray-600 rounded text-xs hover:bg-gray-700"
        >
          Debug
        </button>
      </div>

      <div className="mt-1 text-xs text-gray-400">
        Press Ctrl+Shift+T to hide
      </div>
    </div>
  );
}

/**
 * Error Recovery Boundary - catches and handles React errors gracefully
 */
export class ErrorRecoveryBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    logger.critical(LOG_CATEGORIES.ERROR, "React error boundary caught error", {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.constructor.name,
    }, error);

    this.setState({
      error,
      errorInfo,
    });

    // Try to recover automatically after a delay
    setTimeout(() => {
      if (this.state.hasError) {
        logger.info(LOG_CATEGORIES.ERROR, "Attempting automatic recovery from error");
        this.setState({ hasError: false, error: null, errorInfo: null });
      }
    }, 3000);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h2>
            
            <p className="text-gray-600 mb-6">
              The application encountered an unexpected error. 
              We're attempting to recover automatically.
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Reload Page
              </button>
              
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Try Again
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left text-sm">
                <summary className="cursor-pointer text-gray-500">Error Details</summary>
                <pre className="mt-2 text-red-600 text-xs overflow-auto bg-gray-100 p-2 rounded">
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}