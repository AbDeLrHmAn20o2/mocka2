"use client";

import { useEffect } from "react";
import { useErrorStore, ERROR_SEVERITY } from "@/store/error-store";
import { WifiOff, Server, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GlobalErrorDisplay() {
  const {
    errors,
    isOffline,
    serverStatus,
    removeError,
    acknowledgeError,
    getErrorsBySeverity,
  } = useErrorStore();

  // Show critical errors as blocking overlay
  const criticalErrors = getErrorsBySeverity(ERROR_SEVERITY.CRITICAL);
  const highErrors = getErrorsBySeverity(ERROR_SEVERITY.HIGH);

  // Show offline status
  if (isOffline || serverStatus === "offline") {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <WifiOff className="w-5 h-5" />
          <div>
            <span className="font-semibold">No Internet Connection</span>
            <span className="ml-2 text-red-100">
              Please check your connection and try again
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Show server degraded status
  if (serverStatus === "degraded") {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Server className="w-5 h-5" />
          <div>
            <span className="font-semibold">Service Issues</span>
            <span className="ml-2 text-yellow-100">
              We're experiencing some issues. Some features may be unavailable.
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Show critical errors as full-screen overlay
  if (criticalErrors.length > 0) {
    const error = criticalErrors[0];
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {error.message}
          </h2>

          <p className="text-gray-600 mb-6">{error.description}</p>

          <div className="space-y-3">
            <Button onClick={() => window.location.reload()} className="w-full">
              Reload Page
            </Button>

            <Button
              onClick={() => removeError(error.id)}
              variant="outline"
              className="w-full"
            >
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show high severity errors as top banner
  if (highErrors.length > 0) {
    const error = highErrors[0];
    return (
      <div className="fixed top-0 left-0 right-0 z-40 bg-red-500 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <span className="font-semibold">{error.message}</span>
            {error.description && (
              <span className="ml-2 text-red-100">{error.description}</span>
            )}
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => removeError(error.id)}
          className="text-white hover:bg-red-600 flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return null;
}

// Hook to use error handling in components
export function useErrorHandler() {
  const errorStore = useErrorStore();

  const handleError = async (error, context = {}) => {
    const { errorHandler } = await import("@/services/error-handler");
    return errorHandler.handleError(error, context);
  };

  const showError = (message, description, severity = ERROR_SEVERITY.LOW) => {
    return errorStore.addError({
      message,
      description,
      severity,
      timestamp: Date.now(),
    });
  };

  const clearErrors = () => {
    errorStore.clearErrors();
  };

  return {
    handleError,
    showError,
    clearErrors,
    errors: errorStore.errors,
    isOffline: errorStore.isOffline,
    serverStatus: errorStore.serverStatus,
  };
}
