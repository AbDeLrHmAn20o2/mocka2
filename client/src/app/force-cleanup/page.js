"use client";

import { useEffect } from "react";
import { emergencyAuthCleanup } from "@/utils/auth-cleanup";

export default function ForceCleanupPage() {
  useEffect(() => {
    // Force emergency cleanup on this page
    const cleanup = () => {
      console.log("🚨 Force cleanup page triggered");
      emergencyAuthCleanup();
    };

    // Immediate cleanup
    cleanup();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          🚨 Cleaning Up Authentication...
        </h1>
        <p className="text-gray-600 mb-4">
          Clearing stale session data and redirecting to login.
        </p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  );
}
