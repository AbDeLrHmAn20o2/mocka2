import { Loader2 } from "lucide-react";

export function LoadingSpinner({ size = "default", className = "" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    default: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  return (
    <Loader2
      className={`animate-spin text-purple-600 ${sizeClasses[size]} ${className}`}
    />
  );
}

export function LoadingOverlay({ message = "Loading..." }) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center space-y-4">
        <LoadingSpinner size="xl" />
        <p className="text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
}

export function LoadingCard({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="relative">
        <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-3xl p-8 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10"></div>
          <div className="relative">
            <LoadingSpinner size="xl" />
          </div>
          {/* Decorative elements */}
          <div className="absolute top-2 right-2 w-4 h-4 bg-purple-200 rounded-full opacity-60 animate-pulse"></div>
          <div
            className="absolute bottom-2 left-2 w-3 h-3 bg-blue-200 rounded-full opacity-60 animate-pulse"
            style={{ animationDelay: "0.5s" }}
          ></div>
        </div>
      </div>
      <p className="text-gray-600 font-medium text-lg">{message}</p>
      <p className="text-gray-400 text-sm mt-2">
        Please wait while we fetch your creative works
      </p>
    </div>
  );
}

export function LoadingPage({ message = "Loading your workspace..." }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center space-y-6 max-w-md w-full mx-4">
        <div className="bg-purple-100 rounded-full p-4">
          <LoadingSpinner size="xl" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {message}
          </h2>
          <p className="text-gray-500">Please wait while we load your data</p>
        </div>
      </div>
    </div>
  );
}
