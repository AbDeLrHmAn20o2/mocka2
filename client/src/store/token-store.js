"use client";

import { getSession, signOut } from "next-auth/react";
import { create } from "zustand";

// Token refresh store
export const useTokenStore = create((set, get) => ({
  // Token state
  accessToken: null,
  refreshToken: null,
  tokenExpiresAt: null,
  isRefreshing: false,
  refreshAttempts: 0,
  maxRefreshAttempts: 3,

  // Session state
  sessionWarningShown: false,
  autoSaveEnabled: true,
  lastActivity: Date.now(),

  // Set tokens
  setTokens: (tokens) => {
    set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: tokens.expiresAt,
      refreshAttempts: 0,
      sessionWarningShown: false,
    });
  },

  // Clear tokens
  clearTokens: () => {
    set({
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      isRefreshing: false,
      refreshAttempts: 0,
      sessionWarningShown: false,
    });
  },

  // Set refreshing state
  setRefreshing: (isRefreshing) => {
    set({ isRefreshing });
  },

  // Increment refresh attempts
  incrementRefreshAttempts: () => {
    const current = get().refreshAttempts;
    set({ refreshAttempts: current + 1 });
    return current + 1;
  },

  // Update last activity
  updateLastActivity: () => {
    set({ lastActivity: Date.now() });
  },

  // Check if token is about to expire (within 5 minutes)
  isTokenExpiringSoon: () => {
    const { tokenExpiresAt } = get();
    if (!tokenExpiresAt) return false;

    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() + fiveMinutes >= tokenExpiresAt;
  },

  // Check if token is expired
  isTokenExpired: () => {
    const { tokenExpiresAt } = get();
    if (!tokenExpiresAt) return false;

    return Date.now() >= tokenExpiresAt;
  },

  // Get time until expiration
  getTimeUntilExpiration: () => {
    const { tokenExpiresAt } = get();
    if (!tokenExpiresAt) return 0;

    return Math.max(0, tokenExpiresAt - Date.now());
  },

  // Set session warning shown
  setSessionWarningShown: (shown) => {
    set({ sessionWarningShown: shown });
  },

  // Toggle auto-save
  setAutoSaveEnabled: (enabled) => {
    set({ autoSaveEnabled: enabled });
  },
}));
