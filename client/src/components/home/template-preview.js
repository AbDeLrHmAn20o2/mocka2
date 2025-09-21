"use client";

import { useEffect, useRef, useState, useMemo } from "react";

function TemplatePreview({
  templateFile,
  width,
  height,
  className = "",
  context = "default",
  isPremium = false,
}) {
  const canvasElementRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const cleanupRef = useRef(false);
  
  // Create unique canvas ID for each component instance
  const canvasId = useMemo(() => 
    `template-preview-${context}-${templateFile?.replace(/[^a-zA-Z0-9]/g, "-")}-${Math.random().toString(36).substr(2, 9)}`,
    [templateFile, context]
  );

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

        // Wait for DOM to be fully ready
        await new Promise((resolve) => setTimeout(resolve, 50));
        if (!canvasElement || !isMounted) {
          return;
        }

        // Check if canvas is already initialized
        if (canvasElement._fabric) {
          console.warn(
            `Canvas ${canvasId} already has fabric instance, disposing first`
          );
          try {
            canvasElement._fabric.dispose();
            delete canvasElement._fabric;
          } catch (e) {
            console.error("Error disposing existing fabric instance:", e);
          }
        }

        // Additional safety check for existing canvas context
        const existingCanvas = canvasElement.querySelector("canvas");
        if (existingCanvas && existingCanvas !== canvasElement) {
          console.warn(`Removing existing canvas element from ${canvasId}`);
          existingCanvas.remove();
        }

        // Create a preview canvas that will contain the entire design
        const maxPreviewWidth = 160;
        const maxPreviewHeight = 120;

        // Calculate aspect ratio and determine preview dimensions
        const templateAspectRatio = width / height;

        let previewWidth, previewHeight;

        if (templateAspectRatio > maxPreviewWidth / maxPreviewHeight) {
          // Template is wider - constrain by width
          previewWidth = maxPreviewWidth;
          previewHeight = maxPreviewWidth / templateAspectRatio;
        } else {
          // Template is taller - constrain by height
          previewHeight = maxPreviewHeight;
          previewWidth = maxPreviewHeight * templateAspectRatio;
        }

        try {
          const previewCanvas = new fabric.StaticCanvas(canvasElement, {
            width: Math.round(previewWidth),
            height: Math.round(previewHeight),
            renderOnAddRemove: true,
            backgroundColor: "#ffffff",
          });

          if (!isMounted) {
            previewCanvas.dispose();
            return;
          }

          fabricCanvasRef.current = previewCanvas;
        } catch (canvasError) {
          console.error(
            `Error creating fabric canvas for ${canvasId}:`,
            canvasError
          );
          if (isMounted) {
            setHasError(true);
            setIsLoading(false);
          }
          return;
        }

        // Set explicit viewport size to match canvas size
        fabricCanvasRef.current.setViewportTransform([1, 0, 0, 1, 0, 0]);

        // Load template data
        if (templateFile && isMounted) {
          try {
            console.log(
              `Loading template: ${templateFile} (${width}x${height})`
            );
            const response = await fetch(`/examples/${templateFile}`);
            if (!response.ok) {
              throw new Error(`Failed to load template: ${response.status}`);
            }

            if (!isMounted) return;

            const templateData = await response.json();
            console.log(
              `Template data loaded for ${templateFile}, objects:`,
              templateData.objects?.length || 0
            );

            // Set background if available
            if (templateData.background) {
              fabricCanvasRef.current.backgroundColor = templateData.background;
            } else {
              fabricCanvasRef.current.backgroundColor = "#ffffff";
            }

            // Load template objects
            fabricCanvasRef.current.loadFromJSON(templateData, () => {
              if (!isMounted) return;

              try {
                // Calculate scale to fit entire design
                const scale = Math.min(
                  previewWidth / width,
                  previewHeight / height
                );

                console.log(
                  `Template: ${templateFile}, Original: ${width}x${height}, Preview: ${previewWidth}x${previewHeight}, Scale: ${scale}`
                );

                // Set the canvas viewport to show the entire original design scaled down
                const zoom = scale;
                fabricCanvasRef.current.setZoom(zoom);

                // Set viewport transform to center the content
                const scaledWidth = width * scale;
                const scaledHeight = height * scale;
                const offsetX = (previewWidth - scaledWidth) / 2;
                const offsetY = (previewHeight - scaledHeight) / 2;

                fabricCanvasRef.current.setViewportTransform([
                  zoom,
                  0,
                  0,
                  zoom,
                  offsetX,
                  offsetY,
                ]);

                if (isMounted) {
                  fabricCanvasRef.current.requestRenderAll();
                  setIsLoading(false);
                }

                console.log(
                  `Template ${templateFile} loaded with zoom: ${zoom}`
                );
              } catch (error) {
                console.error(
                  `Error rendering template ${templateFile}:`,
                  error
                );
                if (isMounted) {
                  setHasError(true);
                  setIsLoading(false);
                }
              }
            });
          } catch (error) {
            console.error("Error loading template:", error);
            if (isMounted) {
              setHasError(true);
              // Show a colored background as fallback
              fabricCanvasRef.current.backgroundColor = "#f3f4f6";
              fabricCanvasRef.current.requestRenderAll();
              setIsLoading(false);
            }
          }
        } else if (isMounted) {
          // No template file, show placeholder
          fabricCanvasRef.current.backgroundColor = "#f3f4f6";
          fabricCanvasRef.current.requestRenderAll();
          setIsLoading(false);
        }
      } catch (e) {
        console.error("Error rendering template preview:", e);
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);

      // Enhanced cleanup
      if (fabricCanvasRef.current) {
        try {
          // Clear all objects first
          fabricCanvasRef.current.clear();

          // Remove all event listeners
          fabricCanvasRef.current.off();

          // Dispose the canvas
          if (typeof fabricCanvasRef.current.dispose === "function") {
            fabricCanvasRef.current.dispose();
          }

          fabricCanvasRef.current = null;
        } catch (e) {
          // Force set to null even if dispose fails
          fabricCanvasRef.current = null;
        }
      }
    };
  }, [templateFile, width, height]);

  return (
    <div
      className={`relative flex items-center justify-center bg-gray-50 ${className}`}
    >
      {/* Premium Badge */}
      {isPremium && (
        <div className="absolute top-1 right-1 z-20 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs px-2 py-1 rounded-full shadow-lg">
          <svg
            className="w-3 h-3 inline mr-1"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          PRO
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {hasError && !isLoading && (
        <div className="flex flex-col items-center justify-center text-gray-400 p-4">
          <svg
            className="w-6 h-6 mb-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <span className="text-xs">Preview Error</span>
        </div>
      )}

      <canvas
        ref={canvasElementRef}
        id={canvasId}
        className="block"
        style={{
          display: isLoading ? "none" : "block",
          maxWidth: "100%",
          maxHeight: "100%",
          filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))",
          borderRadius: "4px",
        }}
      />
    </div>
  );
}

export default TemplatePreview;
