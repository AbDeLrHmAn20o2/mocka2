"use client";

import { useEffect, useRef, useState, useMemo } from "react";

function DesignPreview({ design }) {
  // Create unique canvas ID for each component instance
  const canvasId = useMemo(() => `canvas-${design._id}-${Math.random().toString(36).substr(2, 9)}`, [design._id]);
  const fabricCanvasRef = useRef(null);
  const canvasElementRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const cleanupRef = useRef(false);

  // Cleanup function
  const cleanupCanvas = () => {
    if (cleanupRef.current) return; // Already cleaned up
    cleanupRef.current = true;

    if (fabricCanvasRef.current) {
      try {
        // More thorough cleanup
        const canvas = fabricCanvasRef.current;
        
        // Remove all objects first
        canvas.clear();
        
        // Remove all event listeners
        canvas.off();
        
        // Dispose the canvas
        canvas.dispose();
        
        // Clear reference
        fabricCanvasRef.current = null;
      } catch (e) {
        // Silent cleanup error - just clear the reference
        fabricCanvasRef.current = null;
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    cleanupRef.current = false; // Reset cleanup flag
    
    const timer = setTimeout(async () => {
      if (!isMounted) return;
      
      try {
        setIsLoading(true);
        setHasError(false);
        
        // Clean up any existing canvas
        cleanupCanvas();
        cleanupRef.current = false; // Reset after cleanup
        
        // Get canvas element
        const canvasElement = canvasElementRef.current;
        if (!canvasElement || !isMounted) return;

        const fabric = await import("fabric");
        if (!isMounted) return;

        // Get design dimensions
        const designWidth = design.width || 800;
        const designHeight = design.height || 600;
        
        // Create a preview canvas that adapts to the design size
        const maxPreviewWidth = 160;
        const maxPreviewHeight = 120;
        
        // Calculate aspect ratio and determine preview dimensions
        const designAspectRatio = designWidth / designHeight;
        
        let previewWidth, previewHeight;
        
        if (designAspectRatio > (maxPreviewWidth / maxPreviewHeight)) {
          // Design is wider - constrain by width
          previewWidth = maxPreviewWidth;
          previewHeight = maxPreviewWidth / designAspectRatio;
        } else {
          // Design is taller - constrain by height
          previewHeight = maxPreviewHeight;
          previewWidth = maxPreviewHeight * designAspectRatio;
        }

        // Create canvas using direct element reference (not ID)
        const designPreviewCanvas = new fabric.StaticCanvas(canvasElement, {
          width: Math.round(previewWidth),
          height: Math.round(previewHeight),
          renderOnAddRemove: true,
          backgroundColor: '#ffffff'
        });

        if (!isMounted) {
          designPreviewCanvas.dispose();
          return;
        }

        fabricCanvasRef.current = designPreviewCanvas;

        // Parse canvas data
        let canvasData;
        try {
          canvasData =
            typeof design.canvasData === "string"
              ? JSON.parse(design.canvasData)
              : design.canvasData;
        } catch (innerErr) {
          console.error("Error parsing canvas data for design:", design._id);
          if (isMounted) {
            setHasError(true);
            setIsLoading(false);
          }
          return;
        }

        if (
          canvasData === undefined ||
          canvasData === null ||
          canvasData?.objects?.length === 0
        ) {
          // Empty design - show background color
          designPreviewCanvas.backgroundColor = canvasData?.background || "#f3f4f6";
          designPreviewCanvas.requestRenderAll();
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        // Set background if available
        if (canvasData.background) {
          designPreviewCanvas.backgroundColor = canvasData.background;
        }

        // Load design objects with proper scaling
        designPreviewCanvas.loadFromJSON(canvasData, () => {
          if (!isMounted) return;
          
          try {
            // Calculate scale to fit entire design
            const scale = Math.min(previewWidth / designWidth, previewHeight / designHeight);

            // Use zoom and viewport transform for proper scaling
            const zoom = scale;
            designPreviewCanvas.setZoom(zoom);
            
            // Center the content
            const scaledWidth = designWidth * scale;
            const scaledHeight = designHeight * scale;
            const offsetX = (previewWidth - scaledWidth) / 2;
            const offsetY = (previewHeight - scaledHeight) / 2;
            
            designPreviewCanvas.setViewportTransform([zoom, 0, 0, zoom, offsetX, offsetY]);
            
            if (isMounted) {
              designPreviewCanvas.requestRenderAll();
              setIsLoading(false);
            }
          } catch (error) {
            console.error(`Error rendering design ${design._id}:`, error);
            if (isMounted) {
              setHasError(true);
              setIsLoading(false);
            }
          }
        });
      } catch (e) {
        console.error("Error rendering design preview:", e);
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      cleanupCanvas();
    };
  }, [design?._id, canvasId]);

  return (
    <div className="relative flex items-center justify-center bg-gray-50 w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {hasError && !isLoading && (
        <div className="flex flex-col items-center justify-center text-gray-400 p-4">
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-xs">Preview Error</span>
        </div>
      )}
      
      <canvas
        ref={canvasElementRef}
        id={canvasId}
        className="block"
        style={{ 
          display: isLoading ? 'none' : 'block',
          maxWidth: '100%',
          maxHeight: '100%',
          filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
          borderRadius: '4px'
        }}
      />
    </div>
  );
}

export default DesignPreview;
