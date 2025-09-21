"use client";

import { getSession, signOut } from "next-auth/react";
import { toast } from "sonner";
import {
  useErrorStore,
  ERROR_TYPES,
  ERROR_SEVERITY,
} from "@/store/error-store";

// Enhanced error handler
export class ErrorHandler {
  static instance = null;

  constructor() {
    if (ErrorHandler.instance) {
      return ErrorHandler.instance;
    }

    this.errorStore = useErrorStore.getState();
    this.setupOnlineStatusListener();
    this.setupPeriodicHealthCheck();

    ErrorHandler.instance = this;
  }

  // Handle different types of errors
  async handleError(error, context = {}) {
    console.error("Error occurred:", error, "Context:", context);

    const errorInfo = this.categorizeError(error);

    // Handle based on error type
    switch (errorInfo.type) {
      case ERROR_TYPES.AUTH:
        return this.handleAuthError(error, context);
      case ERROR_TYPES.TOKEN_EXPIRED:
        return this.handleTokenExpiredError(error, context);
      case ERROR_TYPES.NETWORK:
        return this.handleNetworkError(error, context);
      case ERROR_TYPES.SERVER:
        return this.handleServerError(error, context);
      default:
        return this.handleUnknownError(error, context);
    }
  }

  // Categorize error based on various factors
  categorizeError(error) {
    // Token expired
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === "TOKEN_EXPIRED"
    ) {
      return {
        type: ERROR_TYPES.TOKEN_EXPIRED,
        severity: ERROR_SEVERITY.HIGH,
        retryable: false,
      };
    }

    // Authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      return {
        type: ERROR_TYPES.AUTH,
        severity: ERROR_SEVERITY.HIGH,
        retryable: false,
      };
    }

    // Server errors
    if (error.response?.status >= 500) {
      return {
        type: ERROR_TYPES.SERVER,
        severity: ERROR_SEVERITY.MEDIUM,
        retryable: true,
      };
    }

    // Network errors
    if (
      !error.response ||
      error.code === "ECONNABORTED" ||
      error.code === "ENOTFOUND" ||
      error.code === "ECONNREFUSED"
    ) {
      return {
        type: ERROR_TYPES.NETWORK,
        severity: ERROR_SEVERITY.MEDIUM,
        retryable: true,
      };
    }

    return {
      type: ERROR_TYPES.UNKNOWN,
      severity: ERROR_SEVERITY.LOW,
      retryable: false,
    };
  }

  // Handle authentication errors (only show if TokenManager isn't handling it)
  async handleAuthError(error, context) {
    // Check if this is a simple 401 - let TokenManager handle it silently
    if (error.response?.status === 401 && !error.response?.data?.forceLogout) {
      console.log("401 error - letting TokenManager handle silently");
      return { handled: false }; // Let TokenManager handle it
    }

    const errorId = this.errorStore.addError({
      type: ERROR_TYPES.AUTH,
      severity: ERROR_SEVERITY.HIGH,
      message: "Authentication failed",
      description: "Please sign in again to continue",
      context,
    });

    // Only show toast for explicit auth failures
    toast.error("Authentication Error", {
      description: "Please sign in to continue.",
      action: {
        label: "Sign In",
        onClick: () => this.redirectToLogin(),
      },
    });

    return { handled: true, errorId };
  }

  // Handle token expired errors (only for explicit expiry, not routine refresh)
  async handleTokenExpiredError(error, context) {
    // Only handle if explicitly marked as expired (not routine expiry)
    if (!error.response?.data?.forceLogout) {
      console.log("Token expiry - letting TokenManager handle silently");
      return { handled: false }; // Let TokenManager handle it
    }

    const errorId = this.errorStore.addError({
      type: ERROR_TYPES.TOKEN_EXPIRED,
      severity: ERROR_SEVERITY.HIGH,
      message: "Session expired",
      description: "Your session has expired. Signing you out...",
      context,
    });

    // Only show toast for forced logout scenarios
    toast.error("Session Expired", {
      description: "Your session has expired. You will be redirected to login.",
    });

    // Auto sign out after a short delay
    setTimeout(async () => {
      await this.redirectToLogin();
    }, 2000);

    return { handled: true, errorId };
  }

  // Handle network errors
  async handleNetworkError(error, context) {
    const errorId = this.errorStore.addError({
      type: ERROR_TYPES.NETWORK,
      severity: ERROR_SEVERITY.MEDIUM,
      message: this.getNetworkErrorMessage(error),
      description: "Check your internet connection",
      context,
      retryable: true,
    });

    // Update server status
    this.errorStore.setServerStatus("offline");

    // Show toast for network issues
    toast.error("Connection Problem", {
      description: this.getNetworkErrorMessage(error),
      duration: 5000,
    });

    return { handled: true, errorId, retryable: true };
  }

  // Handle server errors
  async handleServerError(error, context) {
    const errorId = this.errorStore.addError({
      type: ERROR_TYPES.SERVER,
      severity: ERROR_SEVERITY.MEDIUM,
      message: "Server error occurred",
      description: this.getServerErrorMessage(error),
      context,
      retryable: true,
    });

    // Update server status
    this.errorStore.setServerStatus("degraded");

    toast.error("Server Error", {
      description: this.getServerErrorMessage(error),
      duration: 5000,
    });

    return { handled: true, errorId, retryable: true };
  }

  // Handle unknown errors
  async handleUnknownError(error, context) {
    const errorId = this.errorStore.addError({
      type: ERROR_TYPES.UNKNOWN,
      severity: ERROR_SEVERITY.LOW,
      message: "Something went wrong",
      description: error.message || "An unexpected error occurred",
      context,
    });

    toast.error("Error", {
      description: "Something went wrong. Please try again.",
      duration: 3000,
    });

    return { handled: true, errorId };
  }

  // Get user-friendly network error messages
  getNetworkErrorMessage(error) {
    if (error.code === "ECONNABORTED") {
      return "Request timed out. Please check your internet connection.";
    }
    if (error.code === "ENOTFOUND") {
      return "Cannot reach the server. Please check your internet connection.";
    }
    if (error.code === "ECONNREFUSED") {
      return "Server is temporarily unavailable. Please try again later.";
    }
    return "Network connection problem. Please check your internet.";
  }

  // Get user-friendly server error messages
  getServerErrorMessage(error) {
    const status = error.response?.status;
    if (status === 500) {
      return "Server is experiencing issues. We're working to fix it.";
    }
    if (status === 502 || status === 503) {
      return "Service is temporarily unavailable. Please try again in a moment.";
    }
    if (status === 504) {
      return "Server response timed out. Please try again.";
    }
    return "Server error occurred. Please try again later.";
  }

  // Redirect to login
  async redirectToLogin() {
    try {
      await signOut({
        redirect: true,
        callbackUrl: "/login?error=session_expired",
      });
    } catch (error) {
      console.error("Error during sign out:", error);
      window.location.href = "/login?error=session_expired";
    }
  }

  // Setup online/offline status listener
  setupOnlineStatusListener() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        this.errorStore.setOfflineStatus(false);
        this.errorStore.setServerStatus("online");
        toast.success("Connection Restored", {
          description: "You are back online",
        });
      });

      window.addEventListener("offline", () => {
        this.errorStore.setOfflineStatus(true);
        this.errorStore.setServerStatus("offline");
        toast.error("Connection Lost", {
          description: "You are currently offline",
        });
      });
    }
  }

  // Setup periodic health check
  setupPeriodicHealthCheck() {
    if (typeof window !== "undefined") {
      setInterval(async () => {
        await this.performHealthCheck();
      }, 30000); // Check every 30 seconds
    }
  }

  // Perform health check
  async performHealthCheck() {
    try {
      const response = await fetch("/api/health", {
        method: "HEAD",
        timeout: 5000,
      });

      if (response.ok) {
        this.errorStore.setServerStatus("online");
      } else {
        this.errorStore.setServerStatus("degraded");
      }
    } catch (error) {
      this.errorStore.setServerStatus("offline");
    }
  }

  // Retry mechanism with exponential backoff
  async retryWithBackoff(operation, context = {}) {
    const retryKey = context.retryKey || "default";
    const maxRetries = context.maxRetries || this.errorStore.maxRetries;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        this.errorStore.resetRetry(retryKey);
        return result;
      } catch (error) {
        console.error(`Retry attempt ${attempt}/${maxRetries} failed:`, error);

        if (attempt === maxRetries) {
          return this.handleError(error, { ...context, finalAttempt: true });
        }

        // Exponential backoff delay
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();
