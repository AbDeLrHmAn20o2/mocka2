"use client";

import { useState } from "react";
import { WifiOff, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "./button";

export function ConnectionError({ onRetry, message = "Connection failed" }) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="bg-red-50 rounded-full p-6 mb-4">
        <WifiOff className="w-12 h-12 text-red-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Connection Problem
      </h3>
      <p className="text-gray-600 text-center max-w-sm mb-6">
        {message}. Please check your internet connection and try again.
      </p>
      <Button
        onClick={handleRetry}
        disabled={isRetrying}
        className="flex items-center gap-2"
      >
        <RefreshCw className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`} />
        {isRetrying ? "Retrying..." : "Try Again"}
      </Button>
    </div>
  );
}

export function ErrorMessage({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-yellow-50 rounded-full p-4 mb-4">
        <AlertCircle className="w-8 h-8 text-yellow-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Something went wrong
      </h3>
      <p className="text-gray-600 text-center max-w-sm mb-4">
        {error?.message || "An unexpected error occurred"}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
}
