"use client";

/**
 * Emergency auth cleanup utility
 * This will forcefully clear all stale authentication data
 * and redirect users to fresh login
 */

export const emergencyAuthCleanup = () => {
  if (typeof window === "undefined") return;

  console.log("🚨 Emergency auth cleanup initiated...");

  try {
    // Clear all localStorage data
    localStorage.clear();
    
    // Clear all sessionStorage data
    sessionStorage.clear();
    
    // Clear all cookies related to authentication
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
      
      // Clear NextAuth cookies and any auth-related cookies
      if (name.includes("next-auth") || 
          name.includes("__Secure-next-auth") ||
          name.includes("authjs") ||
          name.includes("session") ||
          name.includes("token")) {
        // Clear for current domain
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        // Also clear for parent domain
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
      }
    });

    // Clear indexedDB if it exists
    if (window.indexedDB) {
      indexedDB.databases?.().then(databases => {
        databases.forEach(db => {
          indexedDB.deleteDatabase(db.name);
        });
      }).catch(console.error);
    }

    // Clear service worker cache if it exists
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister();
        });
      }).catch(console.error);
    }

    console.log("✅ Auth cleanup completed");
    
    // Force redirect to login with cleanup flag - use replace to prevent back button
    window.location.replace("/login?force_fresh=true&cleanup=true&timestamp=" + Date.now());
    
  } catch (error) {
    console.error("Error during auth cleanup:", error);
    // Fallback: just redirect to login
    window.location.replace("/login?fallback=true&timestamp=" + Date.now());
  }
};

// Auto-cleanup if extremely stale token detected
export const checkForStaleSession = () => {
  if (typeof window === "undefined") return;

  try {
    // Check if there's a very old session
    const authState = localStorage.getItem("nextauth.message");
    const tokenData = localStorage.getItem("token-store");
    
    if (tokenData) {
      const parsed = JSON.parse(tokenData);
      const now = Date.now();
      
      // If token is more than 2 hours old, force cleanup
      if (parsed.state?.tokenExpiresAt && (now - parsed.state.tokenExpiresAt) > 2 * 60 * 60 * 1000) {
        console.log("🚨 Extremely stale session detected, forcing cleanup...");
        emergencyAuthCleanup();
        return true;
      }
    }
  } catch (error) {
    console.error("Error checking session staleness:", error);
  }
  
  return false;
};

// Export for use in other components
export default emergencyAuthCleanup;
