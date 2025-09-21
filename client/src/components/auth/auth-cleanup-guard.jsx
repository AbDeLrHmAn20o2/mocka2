"use client";

import { useEffect } from "react";
import { emergencyAuthCleanup, checkForStaleSession } from "@/utils/auth-cleanup";

export function AuthCleanupGuard({ children }) {
  useEffect(() => {
    // Immediate check for stale sessions on mount
    const needsCleanup = checkForStaleSession();
    
    if (needsCleanup) {
      // Component will handle redirect, don't render children
      return;
    }

    // Additional check: if we detect repeated failed requests, force cleanup
    let failedRequestCount = 0;
    const maxFailedRequests = 3;

    const handleFetch = (event) => {
      // Monitor fetch requests for authentication failures
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        try {
          const response = await originalFetch(...args);
          
          // If we get 401 responses, count them
          if (response.status === 401) {
            failedRequestCount++;
            console.log(`🚨 Auth failure detected (${failedRequestCount}/${maxFailedRequests})`);
            
            // If we get too many auth failures, force cleanup
            if (failedRequestCount >= maxFailedRequests) {
              console.log("🚨 Too many auth failures, forcing emergency cleanup");
              emergencyAuthCleanup();
              return response;
            }
          } else if (response.ok) {
            // Reset counter on successful requests
            failedRequestCount = 0;
          }
          
          return response;
        } catch (error) {
          console.error("Fetch error:", error);
          throw error;
        }
      };
    };

    // Apply fetch monitoring
    handleFetch();

    // Set up interval to check for stale sessions periodically
    const staleCheckInterval = setInterval(() => {
      checkForStaleSession();
    }, 30000); // Check every 30 seconds

    return () => {
      clearInterval(staleCheckInterval);
    };
  }, []);

  return children;
}
