"use client";

import { useState } from "react";
import Image from "next/image";

function CanzatPreview({
  canzatItem,
  width = 300,
  height = 200,
  className = "",
  context = "default",
  isPremium = false,
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Use the image path directly from the canzat item
  const imageSrc = canzatItem?.imagePath || canzatItem?.thumbnail;

  return (
    <div 
      className={`relative ${className}`}
      style={{ width, height }}
    >
      {/* Loading state */}
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center"
          style={{ width, height }}
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Error state */}
      {hasError && !isLoading && (
        <div 
          className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center"
          style={{ width, height }}
        >
          <div className="text-center text-gray-500">
            <div className="text-2xl mb-2">🖼️</div>
            <div className="text-sm">Preview not available</div>
          </div>
        </div>
      )}

      {/* Image preview */}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={canzatItem?.name || "Canzat preview"}
          className={`w-full h-full object-cover rounded-lg ${isLoading || hasError ? 'opacity-0' : 'opacity-100'}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ 
            transition: 'opacity 0.3s ease',
            width,
            height
          }}
        />
      )}
    </div>
  );
}

export default CanzatPreview;
