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
    this._tokenRetryCount = 0;
    this._maxTokenRetries = 3;
    this._backoffDelay = 1000; // Start with 1 second

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
        console.log(
          "🚨 Stale session detected during initialization - cleanup triggered"
        );
        return; // Don't continue initialization if cleanup is needed
      }
    } catch (error) {
      console.error("❌ Failed to initialize TokenManager:", error);
      this._initializationAttempts++;

      if (this._initializationAttempts < this._maxInitAttempts) {
        console.log(
          `🔄 Retrying initialization (attempt ${
            this._initializationAttempts + 1
          }/${this._maxInitAttempts})...`
        );
        setTimeout(
          () => this.safeInitialize(),
          this._backoffDelay * this._initializationAttempts
        );
      } else {
        console.error(
          "💀 TokenManager initialization failed after maximum attempts"
        );
        this.handleCriticalFailure();
      }
    }
  }

  // Enhanced token refresh with exponential backoff
  async refreshToken(forceRefresh = false) {
    try {
      // Check if we're already handling a failure
      if (this._isHandlingFailure) {
        console.log("⏸️ Skipping token refresh - handling failure");
        return null;
      }

      console.log(
        `🔄 Refreshing token (force: ${forceRefresh}, attempt: ${
          this._tokenRetryCount + 1
        })`
      );

      const session = await getSession();

      if (!session) {
        console.warn("⚠️ No session found during token refresh");
        this.handleTokenFailure("NO_SESSION");
        return null;
      }

      // Validate token structure
      if (!this.validateTokenStructure(session.idToken)) {
        console.error("❌ Invalid token structure detected");
        this.handleTokenFailure("INVALID_TOKEN_STRUCTURE");
        return null;
      }

      // Check token expiry with buffer
      const tokenPayload = this.decodeToken(session.idToken);
      const now = Math.floor(Date.now() / 1000);
      const bufferTime = 300; // 5 minutes buffer

      if (tokenPayload.exp && tokenPayload.exp - now < bufferTime) {
        console.warn(
          `⚠️ Token expires soon: ${tokenPayload.exp - now} seconds remaining`
        );

        // Try to get a fresh session
        const freshSession = await getSession();
        if (freshSession && freshSession.idToken !== session.idToken) {
          console.log("✅ Got fresh token from session refresh");
          this._tokenRetryCount = 0; // Reset retry count on success
          return freshSession.idToken;
        } else {
          console.warn("⚠️ Could not get fresh token, proceeding with current");
        }
      }

      // Update token store
      const { setCurrentToken, setLastRefresh } = useTokenStore.getState();
      setCurrentToken(session.idToken);
      setLastRefresh(Date.now());

      this._tokenRetryCount = 0; // Reset retry count on success
      console.log("✅ Token refreshed successfully");

      return session.idToken;
    } catch (error) {
      console.error("❌ Token refresh failed:", error);
      this._tokenRetryCount++;

      if (this._tokenRetryCount < this._maxTokenRetries) {
        const delay =
          this._backoffDelay * Math.pow(2, this._tokenRetryCount - 1);
        console.log(
          `🔄 Retrying token refresh in ${delay}ms (attempt ${this._tokenRetryCount}/${this._maxTokenRetries})`
        );

        setTimeout(() => {
          this.refreshToken(forceRefresh);
        }, delay);
      } else {
        console.error("💀 Max token refresh attempts reached");
        this.handleTokenFailure("MAX_RETRIES_EXCEEDED");
      }

      return null;
    }
  }

  // Validate token structure
  validateTokenStructure(token) {
    if (!token || typeof token !== "string") {
      return false;
    }

    const parts = token.split(".");
    if (parts.length !== 3) {
      return false;
    }

    try {
      // Try to decode the payload
      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      return payload.sub && payload.exp && payload.iat;
    } catch (error) {
      return false;
    }
  }

  // Decode token payload
  decodeToken(token) {
    try {
      const payload = token.split(".")[1];
      const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
      return JSON.parse(decoded);
    } catch (error) {
      console.error("Failed to decode token:", error);
      return {};
    }
  }

  // Enhanced activity tracking
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

    const throttledHandler = this.throttle(this.handleUserActivity, 1000);

    events.forEach((event) => {
      document.addEventListener(event, throttledHandler, { passive: true });
    });

    // Listen for visibility changes
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        console.log("👁️ Tab became visible - checking session");
        this.handleUserActivity();
      }
    });

    // Listen for online/offline status
    window.addEventListener("online", () => {
      console.log("🌐 Connection restored - refreshing token");
      this.refreshToken(true);
    });

    console.log("✅ Activity listeners set up");
  }

  // Enhanced auto-save with error handling
  setupAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = setInterval(async () => {
      try {
        await this.autoSaveWork();
      } catch (error) {
        console.error("❌ Auto-save failed:", error);
      }
    }, 30000); // Auto-save every 30 seconds

    console.log("✅ Auto-save set up (30s interval)");
  }

  // Enhanced auto-save logic
  async autoSaveWork() {
    try {
      const { canvas, designId } = useEditorStore.getState();

      if (!canvas || !designId) {
        return; // Nothing to save
      }

      // Check if there are unsaved changes
      const canvasData = canvas.toJSON();
      const lastSavedData = localStorage.getItem(`design_${designId}_backup`);

      if (lastSavedData) {
        const lastSaved = JSON.parse(lastSavedData);
        if (
          JSON.stringify(canvasData) === JSON.stringify(lastSaved.canvasData)
        ) {
          return; // No changes since last save
        }
      }

      // Save to localStorage as backup
      const backupData = {
        designId,
        canvasData,
        timestamp: Date.now(),
      };

      localStorage.setItem(
        `design_${designId}_backup`,
        JSON.stringify(backupData)
      );
      console.log("💾 Auto-save completed (local backup)");
    } catch (error) {
      console.error("❌ Auto-save error:", error);
    }
  }

  // Handle token failures with better recovery
  async handleTokenFailure(reason) {
    if (this._isHandlingFailure) {
      console.log("⏸️ Already handling token failure");
      return;
    }

    this._isHandlingFailure = true;
    console.error(`🚨 Token failure: ${reason}`);

    try {
      // Clear existing timers
      this.clearAllTimers();

      // Try emergency cleanup
      const { emergencyAuthCleanup } = await import("@/utils/auth-cleanup");
      await emergencyAuthCleanup();

      // Show user-friendly error
      toast.error("Session expired", {
        description: "Please sign in again to continue.",
        duration: 5000,
        action: {
          label: "Sign In",
          onClick: () => window.location.reload(),
        },
      });

      // Force sign out after delay
      this._failureTimeout = setTimeout(async () => {
        try {
          await signOut({ callbackUrl: "/" });
        } catch (error) {
          console.error("Sign out failed:", error);
          window.location.href = "/";
        }
      }, 3000);
    } catch (error) {
      console.error("❌ Error handling token failure:", error);
      // Force reload as last resort
      window.location.reload();
    }
  }

  // Handle critical system failures
  handleCriticalFailure() {
    console.error("💀 Critical TokenManager failure - emergency cleanup");

    try {
      this.clearAllTimers();

      toast.error("System Error", {
        description: "A critical error occurred. Please refresh the page.",
        duration: 10000,
        action: {
          label: "Refresh",
          onClick: () => window.location.reload(),
        },
      });
    } catch (error) {
      console.error("Failed to handle critical failure:", error);
      // Force reload as absolute last resort
      setTimeout(() => window.location.reload(), 5000);
    }
  }

  // Utility: throttle function
  throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;

    return function (...args) {
      const currentTime = Date.now();

      if (currentTime - lastExecTime > delay) {
        func.apply(this, args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func.apply(this, args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  }

  // Clean up all timers
  clearAllTimers() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    if (this._failureTimeout) {
      clearTimeout(this._failureTimeout);
      this._failureTimeout = null;
    }
  }

  // Start enhanced token refresh cycle
  startTokenRefreshCycle() {
    this.clearAllTimers();

    // Immediate refresh to validate current token
    this.refreshToken(true);

    // Set up regular refresh cycle (every 20 minutes)
    this.refreshTimer = setInterval(() => {
      this.refreshToken(false);
    }, 20 * 60 * 1000);

    console.log("✅ Token refresh cycle started (20min intervals)");
  }

  // Handle user activity
  async handleUserActivity() {
    try {
      const session = await getSession();

      if (!session) {
        console.warn("⚠️ No session during activity check");
        return;
      }

      // Update last activity time
      const { setLastActivity } = useTokenStore.getState();
      setLastActivity(Date.now());

      // Check if token needs refresh
      const tokenPayload = this.decodeToken(session.idToken);
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = tokenPayload.exp - now;

      // Refresh if less than 10 minutes remaining
      if (timeUntilExpiry < 600) {
        console.log(
          "🔄 Refreshing token due to activity and approaching expiry"
        );
        this.refreshToken(true);
      }
    } catch (error) {
      console.error("❌ Error handling user activity:", error);
    }
  }

  // Cleanup method
  cleanup() {
    this.clearAllTimers();
    this._isHandlingFailure = false;
    console.log("🧹 TokenManager cleaned up");
  }
}

// Create singleton instance
export const tokenManager = new TokenManager();

export default tokenManager;
