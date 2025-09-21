"use client";

import { addShapeToCanvas } from "@/fabric/fabric-utils";
import {
  shapeDefinitions,
  shapeTypes,
} from "@/fabric/shapes/shape-definitions";
import { useEditorStore } from "@/store";
import { useEffect, useRef, useState } from "react";

function ElementsPanel() {
  const { canvas } = useEditorStore();
  const miniCanvasRef = useRef({});
  const canvasElementRef = useRef({});
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isInitialized) return;

    const timer = setTimeout(async () => {
      try {
        const fabric = await import("fabric");

        for (const shapeType of shapeTypes) {
          const canvasElement = canvasElementRef.current[shapeType];
          if (!canvasElement) continue;
          const canvasId = `mini-canvas-${shapeType}`;
          canvasElement.id = canvasId;

          try {
            const definition = shapeDefinitions[shapeType];

            const miniCanvas = new fabric.StaticCanvas(canvasId, {
              width: 100,
              height: 100,
              backgroundColor: "transparent",
              renderOnAddRemove: true,
            });

            miniCanvasRef.current[shapeType] = miniCanvas;
            definition.thumbnail(fabric, miniCanvas);
            miniCanvas.renderAll();
          } catch (definitionErr) {
            console.error("Error while creating definition", definitionErr);
          }
        }
        setIsInitialized(true);
      } catch (e) {
        console.error("failed to init", e);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isInitialized]);

  useEffect(() => {
    return () => {
      Object.values(miniCanvasRef.current).forEach((miniCanvas) => {
        if (miniCanvas && typeof miniCanvas.dispose === "function") {
          try {
            miniCanvas.dispose();
          } catch (e) {
            console.error("Error disposing canvas", e);
          }
        }
      });

      miniCanvasRef.current = {};
      setIsInitialized(false);
    };
  }, []);

  const setCanvasRef = (getCurrentElement, shapeType) => {
    if (getCurrentElement) {
      canvasElementRef.current[shapeType] = getCurrentElement;
    }
  };

  const handleShapeClick = (type) => {
    addShapeToCanvas(canvas, type);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            Basic Shapes
          </h3>
          <p className="text-sm text-slate-600">
            Click to add shapes to your design
          </p>
        </div>

        {/* Quick Add Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => handleShapeClick("rectangle")}
            className="flex flex-col items-center p-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all duration-300 group"
          >
            <div className="w-8 h-8 bg-blue-500 rounded-lg mb-2 group-hover:scale-110 transition-transform"></div>
            <span className="text-xs font-medium text-slate-700">
              Rectangle
            </span>
          </button>
          <button
            onClick={() => handleShapeClick("circle")}
            className="flex flex-col items-center p-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all duration-300 group"
          >
            <div className="w-8 h-8 bg-blue-500 rounded-full mb-2 group-hover:scale-110 transition-transform"></div>
            <span className="text-xs font-medium text-slate-700">Circle</span>
          </button>
        </div>

        {/* Shape Grid */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            All Shapes
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {shapeTypes.map((shapeType) => (
              <div key={shapeType} className="group">
                <button
                  onClick={() => handleShapeClick(shapeType)}
                  className="w-full p-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-full h-16 bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden">
                      <canvas
                        width="100"
                        height="100"
                        ref={(el) => setCanvasRef(el, shapeType)}
                        className="max-w-full max-h-full"
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-700 capitalize">
                      {shapeType.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-xs text-blue-800 font-medium">💡 Tip</p>
          <p className="text-xs text-blue-700 mt-1">
            Double-click any shape to customize its properties
          </p>
        </div>
      </div>
    </div>
  );
}

export default ElementsPanel;
