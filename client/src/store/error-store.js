"use client";

import { create } from "zustand";

// Error types
export const ERROR_TYPES = {
  NETWORK: "NETWORK",
  AUTH: "AUTH",
  SERVER: "SERVER",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  UNKNOWN: "UNKNOWN",
};

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: "LOW", // Non-blocking, show toast
  MEDIUM: "MEDIUM", // Blocking for specific feature
  HIGH: "HIGH", // App-wide blocking error
  CRITICAL: "CRITICAL", // Complete app failure
};

export const useErrorStore = create((set, get) => ({
  // Current active errors
  errors: [],

  // Global app state
  isOffline: false,
  serverStatus: "online", // 'online', 'degraded', 'offline'
  lastHealthCheck: null,

  // Auto-retry configuration
  retryAttempts: {},
  maxRetries: 3,
  retryDelay: 1000,

  // Add error to the store
  addError: (error) => {
    const errorId = Date.now().toString();
    const newError = {
      id: errorId,
      ...error,
      timestamp: Date.now(),
      acknowledged: false,
    };

    set((state) => ({
      errors: [...state.errors, newError],
    }));

    return errorId;
  },

  // Remove error from store
  removeError: (errorId) => {
    set((state) => ({
      errors: state.errors.filter((error) => error.id !== errorId),
    }));
  },

  // Clear all errors
  clearErrors: () => {
    set({ errors: [] });
  },

  // Acknowledge error (mark as seen)
  acknowledgeError: (errorId) => {
    set((state) => ({
      errors: state.errors.map((error) =>
        error.id === errorId ? { ...error, acknowledged: true } : error
      ),
    }));
  },

  // Update server status
  setServerStatus: (status) => {
    set({
      serverStatus: status,
      lastHealthCheck: Date.now(),
    });
  },

  // Set offline status
  setOfflineStatus: (isOffline) => {
    set({ isOffline });
  },

  // Increment retry attempt
  incrementRetry: (key) => {
    const current = get().retryAttempts[key] || 0;
    set((state) => ({
      retryAttempts: {
        ...state.retryAttempts,
        [key]: current + 1,
      },
    }));
    return current + 1;
  },

  // Reset retry attempts
  resetRetry: (key) => {
    set((state) => ({
      retryAttempts: {
        ...state.retryAttempts,
        [key]: 0,
      },
    }));
  },

  // Check if max retries reached
  isMaxRetriesReached: (key) => {
    const attempts = get().retryAttempts[key] || 0;
    return attempts >= get().maxRetries;
  },

  // Get errors by severity
  getErrorsBySeverity: (severity) => {
    return get().errors.filter((error) => error.severity === severity);
  },

  // Get unacknowledged errors
  getUnacknowledgedErrors: () => {
    return get().errors.filter((error) => !error.acknowledged);
  },
}));
