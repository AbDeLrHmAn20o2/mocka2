"use client";

import { customizeBoundingBox, initializeFabric, initializeHistoryManagement } from "@/fabric/fabric-utils";
import { useEditorStore } from "@/store";
import { useEffect, useRef } from "react";

function Canvas() {
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const initAttemptedRef = useRef(false);

  const { setCanvas, markAsModified } = useEditorStore();

  useEffect(() => {
    const cleanUpCanvas = () => {
      if (fabricCanvasRef.current) {
        try {
          // Clean up mouse interactions first
          if (fabricCanvasRef.current.mouseInteractionsCleanup) {
            fabricCanvasRef.current.mouseInteractionsCleanup();
          }
          
          fabricCanvasRef.current.off("object:added");
          fabricCanvasRef.current.off("object:modified");
          fabricCanvasRef.current.off("object:removed");
          fabricCanvasRef.current.off("path:created");
          fabricCanvasRef.current.off("mouse:down");
        } catch (e) {
          console.error("Error removing event listeners", e);
        }

        try {
          fabricCanvasRef.current.dispose();
        } catch (e) {
          console.error("Error disposing canvas", e);
        }

        fabricCanvasRef.current = null;
        setCanvas(null);
      }
    };

    cleanUpCanvas();

    //reset init flag
    initAttemptedRef.current = false;

    //init our canvas
    const initcanvas = async () => {
      if (
        typeof window === "undefined" ||
        !canvasRef.current ||
        initAttemptedRef.current
      ) {
        return;
      }

      initAttemptedRef.current = true;

      try {
        console.log("Initializing Fabric.js canvas...");
        const fabricCanvas = await initializeFabric(
          canvasRef.current,
          canvasContainerRef.current
        );

        if (!fabricCanvas) {
          console.error("Failed to initialize Fabric.js canvas");
          return;
        }

        // Additional validation to ensure canvas is properly set up
        if (!fabricCanvas.getElement || !fabricCanvas.getElement()) {
          console.error("Canvas element not properly initialized");
          return;
        }

        // Test canvas context availability
        const canvasElement = fabricCanvas.getElement();
        const context = canvasElement.getContext('2d');
        if (!context) {
          console.error("Canvas 2D context not available");
          return;
        }

        fabricCanvasRef.current = fabricCanvas;
        //set the canvas in store
        setCanvas(fabricCanvas);

        console.log("Canvas init is done and set in store");

        //apply custom style for the controls
        customizeBoundingBox(fabricCanvas);

        //initialize undo/redo functionality
        initializeHistoryManagement(fabricCanvas);

        //set up event listeners
        const handleCanvasChange = () => {
          // Only mark as modified if we're not in the middle of undo/redo
          if (!fabricCanvas.isPerformingHistory) {
            markAsModified();
          }
        };

        const handleMouseDown = (e) => {
          // Clear selection when clicking on empty canvas area (not on an object)
          if (!e.target || e.target === fabricCanvas.lowerCanvasEl) {
            fabricCanvas.discardActiveObject();
            fabricCanvas.renderAll();
          }
        };

        fabricCanvas.on("object:added", handleCanvasChange);
        fabricCanvas.on("object:modified", handleCanvasChange);
        fabricCanvas.on("object:removed", handleCanvasChange);
        fabricCanvas.on("path:created", handleCanvasChange);
        fabricCanvas.on("mouse:down", handleMouseDown);
      } catch (e) {
        console.error("Failed to init canvas", e);
        // Reset the init flag so it can be tried again
        initAttemptedRef.current = false;
      }
    };

    const timer = setTimeout(() => {
      initcanvas();
    }, 50);

    return () => {
      clearTimeout(timer);
      cleanUpCanvas();
    };
  }, []);

  return (
    <div
      className="relative w-full h-full min-h-[400px] overflow-auto"
      ref={canvasContainerRef}
      onClick={(e) => {
        // Clear selection when clicking outside the canvas or on the container background
        if (fabricCanvasRef.current && 
           (e.target === canvasContainerRef.current || 
            e.target.classList.contains('canvas-container') ||
            (!e.target.closest('canvas') && !fabricCanvasRef.current.getActiveObject()))) {
          fabricCanvasRef.current.discardActiveObject();
          fabricCanvasRef.current.renderAll();
        }
      }}
      style={{ 
        backgroundColor: '#f8f9fa',
        cursor: 'default',
        userSelect: 'none' // Prevent text selection during drag
      }}
    >
      {/* Loading overlay for smooth transitions */}
      <div 
        id="canvas-loading-overlay"
        className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10"
        style={{ display: 'none' }}
      >
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <p className="text-gray-600 text-sm">Preparing canvas...</p>
        </div>
      </div>
      <canvas ref={canvasRef} />
    </div>
  );
}

export default Canvas;
