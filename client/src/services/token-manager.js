"use client";

import { getSession, signOut } from "next-auth/react";
import { useTokenStore } from "@/store/token-store";
import { useEditorStore } from "@/store";
import { toast } from "sonner";
import { logger, LOG_CATEGORIES } from "@/utils/logger";

class TokenManager {
  constructor() {
    this.refreshTimer = null;
    this.activityTimer = null;
    this.warningTimer = null;
    this.autoSaveTimer = null;
    this._isHandlingFailure = false;
    this._failureTimeout = null;
    this._initializationAttempts = 0;
    this._maxInitAttempts = 3;

    // Bind methods
    this.startTokenRefreshCycle = this.startTokenRefreshCycle.bind(this);
    this.refreshToken = this.refreshToken.bind(this);
    this.handleUserActivity = this.handleUserActivity.bind(this);
    this.autoSaveWork = this.autoSaveWork.bind(this);

    // Initialize with error handling
    this.safeInitialize();
  }

  // Safe initialization with retry logic
  async safeInitialize() {
    try {
      this.setupActivityListeners();
      this.setupAutoSave();
      
      // Check for extremely stale sessions on startup
      const { checkForStaleSession } = await import("@/utils/auth-cleanup");
      if (checkForStaleSession()) {
        console.log("🚨 Stale session detected during initialization - cleanup triggered");
        return; // Don't continue initialization if cleanup is needed
      }
      
    } catch (error) {
      console.error("❌ Failed to initialize TokenManager:", error);
      this._initializationAttempts++;
      
      if (this._initializationAttempts < this._maxInitAttempts) {
        console.log(`🔄 Retrying initialization (attempt ${this._initializationAttempts + 1}/${this._maxInitAttempts})...`);
        setTimeout(() => this.safeInitialize(), 2000);
      } else {
        console.error("🚨 TokenManager initialization failed after maximum attempts");
      }
    }
  }

  // Initialize token management
  async initialize() {
    try {
      console.log("🔄 Initializing TokenManager...");
      
      const session = await getSession();
      if (!session) {
        console.log("ℹ️ No active session found");
        return false;
      }

      const tokenStore = useTokenStore.getState();

      // Set initial tokens with validation
      const expiresAt = session.expires
        ? new Date(session.expires).getTime()
        : Date.now() + 60 * 60 * 1000; // 1 hour default

      // Validate expiration time is reasonable
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;
      
      if (timeUntilExpiry <= 0) {
        console.warn("⚠️ Session already expired during initialization");
        // Try to get fresh session immediately
        const freshSession = await getSession();
        if (!freshSession) {
          console.log("❌ Cannot get fresh session");
          return false;
        }
      }

      tokenStore.setTokens({
        accessToken: session.accessToken || session.idToken,
        refreshToken: session.refreshToken,
        expiresAt: expiresAt,
      });

      // Start refresh cycle
      this.startTokenRefreshCycle();

      console.log("✅ TokenManager initialized successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize token manager:", error);
      
      // Try emergency cleanup if initialization fails
      try {
        const { emergencyAuthCleanup } = await import("@/utils/auth-cleanup");
        emergencyAuthCleanup();
      } catch (cleanupError) {
        console.error("❌ Emergency cleanup also failed:", cleanupError);
      }
      
      return false;
    }
  }

  // Start automatic token refresh cycle (professional approach)
  startTokenRefreshCycle() {
    this.clearTimers();

    const tokenStore = useTokenStore.getState();
    const timeUntilExpiration = tokenStore.getTimeUntilExpiration();

    if (timeUntilExpiration <= 0) {
      // Token already expired - try silent refresh
      this.refreshTokenSilently();
      return;
    }

    // Schedule silent refresh 2 minutes before expiration (like Figma/Canva)
    const refreshTime = Math.max(0, timeUntilExpiration - 2 * 60 * 1000);
    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshTokenSilently();
      }, refreshTime);
    }

    // Only show warning if refresh fails and < 1 minute left
    const criticalWarningTime = Math.max(
      0,
      timeUntilExpiration - 1 * 60 * 1000
    );
    if (criticalWarningTime > refreshTime) {
      this.warningTimer = setTimeout(() => {
        this.showCriticalSessionWarning();
      }, criticalWarningTime);
    }
  }

  // Silent token refresh (like professional editors)
  async refreshTokenSilently() {
    const tokenStore = useTokenStore.getState();

    if (tokenStore.isRefreshing) {
      logger.debug(LOG_CATEGORIES.TOKEN, "Refresh already in progress, skipping");
      return; // Already refreshing
    }

    logger.tokenRefreshStarted({ 
      isExpired: tokenStore.isTokenExpired(),
      isExpiringSoon: tokenStore.isTokenExpiringSoon(),
      timeUntilExpiration: tokenStore.getTimeUntilExpiration() 
    });

    try {
      tokenStore.setRefreshing(true);

      // Get fresh session
      const session = await getSession();

      if (!session) {
        throw new Error("No session available");
      }

      logger.debug(LOG_CATEGORIES.TOKEN, "Fresh session obtained", {
        hasAccessToken: !!session.accessToken,
        hasIdToken: !!session.idToken,
        hasRefreshToken: !!session.refreshToken,
        expires: session.expires
      });

      // Update tokens
      tokenStore.setTokens({
        accessToken: session.accessToken || session.idToken,
        refreshToken: session.refreshToken,
        expiresAt: session.expires
          ? new Date(session.expires).getTime()
          : Date.now() + 60 * 60 * 1000,
      });

      // Restart refresh cycle
      this.startTokenRefreshCycle();

      logger.tokenRefreshCompleted(true);
    } catch (error) {
      logger.tokenRefreshCompleted(false, { 
        error: error.message, 
        attempts: tokenStore.refreshAttempts + 1 
      });

      const attempts = tokenStore.incrementRefreshAttempts();

      if (attempts >= tokenStore.maxRefreshAttempts) {
        logger.error(LOG_CATEGORIES.TOKEN, "Max refresh attempts reached, handling failure", {
          attempts,
          maxAttempts: tokenStore.maxRefreshAttempts
        });
        this.handleRefreshFailure();
      } else {
        logger.warn(LOG_CATEGORIES.TOKEN, `Refresh attempt ${attempts} failed, retrying`, {
          nextRetryIn: 5000 * attempts
        });
        setTimeout(() => {
          this.refreshTokenSilently();
        }, 5000 * attempts);
      }
    } finally {
      tokenStore.setRefreshing(false);
    }
  }

  // Public method for manual refresh (called from UI)
  async refreshToken() {
    await this.refreshTokenSilently();

    // Only show success message when user manually triggers refresh
    toast.success("Session Extended", {
      description: "Your session has been extended.",
      duration: 2000,
    });
  }

  // Critical session warning (only shown when < 1 minute left and refresh failed)
  showCriticalSessionWarning() {
    const tokenStore = useTokenStore.getState();

    if (tokenStore.sessionWarningShown) {
      return; // Already shown
    }

    tokenStore.setSessionWarningShown(true);

    const timeLeft = Math.ceil(
      tokenStore.getTimeUntilExpiration() / (1000 * 60)
    ); // Minutes

    if (timeLeft <= 1) {
      toast.error("Session Expiring", {
        description: `Your session expires in ${timeLeft} minute. Click to extend.`,
        duration: 0, // Don't auto-dismiss
        action: {
          label: "Extend Session",
          onClick: () => this.refreshToken(),
        },
      });
    }
  }

  // Handle token expiration (called from base service) - UNIFIED METHOD
  async handleTokenExpired() {
    console.log("🔄 Handling token expiration...");
    
    const tokenStore = useTokenStore.getState();
    
    // Prevent multiple simultaneous refresh attempts
    if (tokenStore.isRefreshing) {
      console.log("⏳ Refresh already in progress, waiting...");
      // Wait for current refresh to complete
      let waitTime = 0;
      while (tokenStore.isRefreshing && waitTime < 10000) { // Max 10 seconds
        await new Promise(resolve => setTimeout(resolve, 500));
        waitTime += 500;
      }
      return !tokenStore.isTokenExpired();
    }
    
    try {
      // Try silent refresh first
      await this.refreshTokenSilently();
      
      // Check if refresh was successful
      if (tokenStore.isTokenExpired()) {
        console.warn("🚨 Token still expired after refresh attempt");
        await this.handleRefreshFailure();
        return false;
      }
      
      console.log("✅ Token successfully refreshed");
      return true;
    } catch (error) {
      console.error("❌ Failed to handle token expiration:", error);
      await this.handleRefreshFailure();
      return false;
    }
  }

  // Handle refresh failure (only after multiple attempts)
  async handleRefreshFailure() {
    console.log("🚨 Handling refresh failure - preparing for graceful logout");
    
    // Prevent multiple simultaneous failure handlers
    if (this._isHandlingFailure) {
      console.log("⏳ Failure handler already running");
      return;
    }
    
    this._isHandlingFailure = true;
    
    try {
      const editorStore = useEditorStore.getState();

      // Auto-save current work if in editor (silent operation)
      if (editorStore.designId && editorStore.canvas && editorStore.isModified) {
        console.log("💾 Attempting to auto-save before logout...");
        try {
          await this.autoSaveWork();
          console.log("✅ Work auto-saved successfully");
        } catch (error) {
          console.error("❌ Failed to auto-save before session expiry:", error);
        }
      }

      // Clear any existing failure timeout to prevent duplication
      if (this._failureTimeout) {
        clearTimeout(this._failureTimeout);
        this._failureTimeout = null;
      }

      // Show minimal, professional session expired message (like Figma)
      toast.error("Session Expired", {
        id: "session-expired", // Prevent duplicate toasts
        description: "Please sign in again to continue. Your work has been saved.",
        duration: 8000,
        action: {
          label: "Sign In",
          onClick: () => this.signOutGracefully(),
        },
      });

      // Redirect after delay to give user time to see the message
      this._failureTimeout = setTimeout(() => {
        this.signOutGracefully();
      }, 8000);
      
    } finally {
      // Reset flag after a delay to prevent infinite loops
      setTimeout(() => {
        this._isHandlingFailure = false;
      }, 1000);
    }
  }

  // Graceful sign out with work preservation
  async signOutGracefully() {
    try {
      // Clear tokens
      const tokenStore = useTokenStore.getState();
      tokenStore.clearTokens();

      // Sign out
      await signOut({
        redirect: true,
        callbackUrl: "/login?message=session_expired&auto_saved=true",
      });
    } catch (error) {
      console.error("Error during sign out:", error);
      // Force redirect if sign out fails
      window.location.href = "/login?message=session_expired";
    }
  }

  // Setup user activity listeners
  setupActivityListeners() {
    if (typeof window === "undefined") return;

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    events.forEach((event) => {
      window.addEventListener(event, this.handleUserActivity, true);
    });
  }

  // Handle user activity
  handleUserActivity() {
    const tokenStore = useTokenStore.getState();
    tokenStore.updateLastActivity();
  }

  // Setup auto-save functionality (less frequent, like professional editors)
  setupAutoSave() {
    // Auto-save every 2 minutes instead of 30 seconds
    this.autoSaveTimer = setInterval(() => {
      this.autoSaveWork();
    }, 120000); // 2 minutes
  }

  // Auto-save current work
  async autoSaveWork() {
    const tokenStore = useTokenStore.getState();
    const editorStore = useEditorStore.getState();

    if (!tokenStore.autoSaveEnabled) return;
    if (!editorStore.designId || !editorStore.canvas) return;
    if (!editorStore.isModified) return;

    try {
      // Use the existing auto-save mechanism
      if (typeof editorStore.debouncedSaveToServer === "function") {
        await editorStore.debouncedSaveToServer();
      }
    } catch (error) {
      console.error("Auto-save failed:", error);
      // Don't show error to user for background saves
    }
  }

  // Clear all timers
  clearTimers() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }
  }

  // Cleanup
  destroy() {
    console.log("🧹 Cleaning up TokenManager...");
    
    this.clearTimers();

    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    
    if (this._failureTimeout) {
      clearTimeout(this._failureTimeout);
      this._failureTimeout = null;
    }

    // Remove activity listeners
    if (typeof window !== "undefined") {
      const events = [
        "mousedown",
        "mousemove",
        "keypress",
        "scroll",
        "touchstart",
        "click",
      ];
      events.forEach((event) => {
        window.removeEventListener(event, this.handleUserActivity, true);
      });
    }
    
    // Reset flags
    this._isHandlingFailure = false;
    
    console.log("✅ TokenManager cleanup completed");
  }

  // Get session status for UI (professional thresholds)
  getSessionStatus() {
    const tokenStore = useTokenStore.getState();
    const timeLeft = tokenStore.getTimeUntilExpiration();

    if (timeLeft <= 0) {
      return { status: "expired", timeLeft: 0 };
    } else if (timeLeft <= 2 * 60 * 1000) {
      // 2 minutes - critical
      return { status: "expiring", timeLeft };
    } else if (timeLeft <= 5 * 60 * 1000) {
      // 5 minutes - approaching
      return { status: "warning", timeLeft };
    } else {
      return { status: "active", timeLeft };
    }
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();
