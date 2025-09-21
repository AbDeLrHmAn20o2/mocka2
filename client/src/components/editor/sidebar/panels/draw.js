"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { brushSizes, drawingPanelColorPresets } from "@/config";
import {
  toggleDrawingMode,
  toggleEraseMode,
  updateDrawingBrush,
} from "@/fabric/fabric-utils";
import { useEditorStore } from "@/store";
import {
  Droplets,
  EraserIcon,
  Minus,
  Paintbrush,
  Palette,
  PencilIcon,
  Plus,
} from "lucide-react";
import { useState, useEffect } from "react";

function DrawingPanel({ isActive }) {
  const { canvas } = useEditorStore();
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [drawingColor, setDrawingColor] = useState(""); // No default color selected
  const [brushWidth, setBrushWidth] = useState(5);
  const [eraserSize, setEraserSize] = useState(10);
  const [drawingOpacity, setDrawingOpacity] = useState(100);
  const [activeTab, setActiveTab] = useState("colors");

  // Auto-enable drawing mode when component becomes active
  useEffect(() => {
    const handleModeChange = () => {
      if (canvas) {
        if (isActive && !isDrawingMode && drawingColor) {
          // Enable drawing mode when panel becomes active and color is selected
          setIsDrawingMode(true);
          toggleDrawingMode(canvas, true, drawingColor, brushWidth);
          // Apply current opacity
          updateDrawingBrush(canvas, { opacity: drawingOpacity / 100 });
        } else if (!isActive && (isDrawingMode || isErasing)) {
          // Disable drawing mode or eraser when panel becomes inactive or closed
          // Add a small delay to allow for smooth animation
          const timer = setTimeout(async () => {
            setIsDrawingMode(false);

            // If eraser is active, disable it properly
            if (isErasing) {
              console.log("Disabling eraser due to panel inactive");
              setIsErasing(false);
              await toggleEraseMode(canvas, false, "", brushWidth);
            }

            toggleDrawingMode(canvas, false, drawingColor, brushWidth);
            // Remove custom cursor when panel is closed
            if (canvas.upperCanvasEl) {
              canvas.upperCanvasEl.style.cursor = "default";
            }
          }, 150);

          return () => clearTimeout(timer);
        }
      }
    };

    handleModeChange();
  }, [
    canvas,
    isActive,
    drawingColor,
    brushWidth,
    isDrawingMode,
    drawingOpacity,
    isErasing,
  ]);

  // Add ESC key listener to reset drawing color
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isActive && isDrawingMode) {
        // Reset to no color selected and disable drawing mode
        setDrawingColor("");
        setIsDrawingMode(false);
        if (canvas) {
          toggleDrawingMode(canvas, false, "", brushWidth);
        }
      }
    };

    if (isActive) {
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isActive, isDrawingMode, canvas, brushWidth]);

  // Add listener for panel reset when switching to other panels
  useEffect(() => {
    const handleResetDrawPanel = async () => {
      // Reset draw panel state when switching to another panel
      setDrawingColor("");
      setIsDrawingMode(false);

      // If eraser is active, disable it properly
      if (isErasing) {
        console.log("Disabling eraser due to panel switch");
        setIsErasing(false);
        if (canvas) {
          await toggleEraseMode(canvas, false, "", brushWidth);
        }
      }

      if (canvas) {
        toggleDrawingMode(canvas, false, "", brushWidth);
        // Reset cursor when switching panels
        if (canvas.upperCanvasEl) {
          canvas.upperCanvasEl.style.cursor = "default";
        }
      }
    };

    window.addEventListener("resetDrawPanel", handleResetDrawPanel);
    return () => {
      window.removeEventListener("resetDrawPanel", handleResetDrawPanel);
    };
  }, [canvas, brushWidth, isErasing]);

  // Handle custom cursor for eraser mode
  useEffect(() => {
    if (!canvas || !canvas.upperCanvasEl) return;

    const updateCursor = () => {
      if (isErasing) {
        // Create circular cursor for eraser
        const size = eraserSize;
        const cursor = `url("data:image/svg+xml,${encodeURIComponent(`
          <svg xmlns='http://www.w3.org/2000/svg' width='${size * 2}' height='${
          size * 2
        }' viewBox='0 0 ${size * 2} ${size * 2}'>
            <circle cx='${size}' cy='${size}' r='${
          size - 2
        }' fill='none' stroke='black' stroke-width='2'/>
            <circle cx='${size}' cy='${size}' r='${
          size - 4
        }' fill='none' stroke='white' stroke-width='1'/>
          </svg>
        `)}) ${size} ${size}, crosshair`;
        canvas.upperCanvasEl.style.cursor = cursor;
      } else if (isDrawingMode) {
        // Default drawing cursor
        canvas.upperCanvasEl.style.cursor = "crosshair";
      } else {
        // Default cursor
        canvas.upperCanvasEl.style.cursor = "default";
      }
    };

    updateCursor();

    // Cleanup function
    return () => {
      if (canvas.upperCanvasEl) {
        canvas.upperCanvasEl.style.cursor = "default";
      }
    };
  }, [canvas, isErasing, eraserSize, isDrawingMode]);

  const handleToggleDrawingMode = () => {
    if (!canvas) return;
    const newMode = !isDrawingMode;
    setIsDrawingMode(newMode);

    if (newMode && isErasing) {
      setIsErasing(false);
    }

    toggleDrawingMode(canvas, newMode, drawingColor, brushWidth);
  };

  const handleDrawingColorChange = (color) => {
    setDrawingColor(color);

    // Auto-enable drawing mode when color is selected
    if (canvas && !isDrawingMode && isActive) {
      setIsDrawingMode(true);
      toggleDrawingMode(canvas, true, color, brushWidth);
      // Apply current opacity
      updateDrawingBrush(canvas, { opacity: drawingOpacity / 100 });
    } else if (canvas && isDrawingMode && !isErasing) {
      updateDrawingBrush(canvas, { color, opacity: drawingOpacity / 100 });
    }
  };

  const handleBrushWidthChange = (width) => {
    setBrushWidth(width);
    if (canvas && isDrawingMode) {
      updateDrawingBrush(canvas, { width: isErasing ? width * 2 : width });
    }
  };

  const handleDrawingOpacityChange = (value) => {
    const opacity = Number(value[0]);
    console.log("Opacity changed:", opacity);
    setDrawingOpacity(opacity);
    if (canvas && isDrawingMode && drawingColor) {
      console.log("Updating brush opacity:", opacity / 100);
      updateDrawingBrush(canvas, {
        color: drawingColor,
        opacity: opacity / 100,
      });
    }
  };

  const handleTabChange = async (value) => {
    setActiveTab(value);
    if (value === "erase") {
      // Automatically activate eraser when erase tab is selected
      if (!isErasing) {
        console.log("Auto-activating eraser from tab change");
        const newErasing = true;
        setIsErasing(newErasing);

        if (canvas) {
          console.log("Enabling eraser mode...");
          setIsDrawingMode(false); // Disable drawing mode for eraser
          const result = await toggleEraseMode(
            canvas,
            true,
            drawingColor || "#000000",
            eraserSize
          );
          console.log("Eraser mode toggle result:", result);
        }
      }
    } else if (isErasing) {
      // Deactivate eraser mode when switching to other tabs
      console.log("Deactivating eraser from tab change");
      setIsErasing(false);
      if (drawingColor) {
        setIsDrawingMode(true);
        await toggleEraseMode(canvas, false, drawingColor, brushWidth);
        updateDrawingBrush(canvas, { opacity: drawingOpacity / 100 });
      } else {
        setIsDrawingMode(false);
        await toggleEraseMode(canvas, false, drawingColor, brushWidth);
      }
    }
  };

  const handleToggleErasing = async () => {
    if (!canvas) {
      console.error("Canvas not available");
      return;
    }

    console.log("Toggle erasing called, current state:", isErasing);
    console.log("Canvas state:", {
      isDrawingMode: canvas.isDrawingMode,
      freeDrawingBrush: !!canvas.freeDrawingBrush,
      brushColor: canvas.freeDrawingBrush?.color,
      brushWidth: canvas.freeDrawingBrush?.width,
    });

    const newErasing = !isErasing;
    setIsErasing(newErasing);

    if (newErasing) {
      console.log("Enabling eraser mode...");
      // Enable eraser mode - disable drawing mode since eraser handles its own events
      setIsDrawingMode(false);
      const result = await toggleEraseMode(
        canvas,
        true,
        drawingColor || "#000000",
        eraserSize
      );
      console.log("Eraser mode toggle result:", result);

      // Double check canvas state after eraser activation
      console.log("Canvas state after eraser activation:", {
        isDrawingMode: canvas.isDrawingMode,
        _isEraserMode: canvas._isEraserMode,
        eraserWidth: canvas._eraserWidth,
      });
    } else {
      console.log("Disabling eraser mode...");
      // Disable eraser mode and return to drawing if color is selected
      if (drawingColor) {
        setIsDrawingMode(true);
        await toggleEraseMode(canvas, false, drawingColor, brushWidth);
        updateDrawingBrush(canvas, { opacity: drawingOpacity / 100 });
      } else {
        setIsDrawingMode(false);
        await toggleEraseMode(canvas, false, drawingColor, brushWidth);
      }
    }
  };

  const handleEraserSizeChange = (size) => {
    setEraserSize(size);
    if (canvas && isErasing) {
      updateDrawingBrush(canvas, { width: size });
      // Update cursor size immediately
      const cursor = `url("data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns='http://www.w3.org/2000/svg' width='${size * 2}' height='${
        size * 2
      }' viewBox='0 0 ${size * 2} ${size * 2}'>
          <circle cx='${size}' cy='${size}' r='${
        size - 2
      }' fill='none' stroke='black' stroke-width='2'/>
          <circle cx='${size}' cy='${size}' r='${
        size - 4
      }' fill='none' stroke='white' stroke-width='1'/>
        </svg>
      `)}) ${size} ${size}, crosshair`;
      if (canvas.upperCanvasEl) {
        canvas.upperCanvasEl.style.cursor = cursor;
      }
    }
  };

  const handleEraserSizeInputChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= 100) {
      handleEraserSizeChange(value);
    }
  };

  return (
    <div className="p-4">
      {!drawingColor && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            📝 Select a color to start drawing
          </p>
        </div>
      )}
      <div className="space-y-5">
        <Tabs
          defaultValue="colors"
          className={"w-full"}
          value={activeTab}
          onValueChange={handleTabChange}
        >
          <TabsList className={"grid grid-cols-3 mb-4"}>
            <TabsTrigger value="colors">
              <Palette className="mr-2 h-4 w-4" />
              Colors
            </TabsTrigger>
            <TabsTrigger value="brush">
              <Paintbrush className="mr-2 h-4 w-4" />
              Brush
            </TabsTrigger>
            <TabsTrigger value="erase">
              <EraserIcon className="mr-2 h-4 w-4" />
              Erase
            </TabsTrigger>
          </TabsList>
          <TabsContent value="colors">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Color Palette</Label>
                <div
                  className="w-6 h-6 rounded-full border shadow-sm"
                  style={{ backgroundColor: drawingColor }}
                />
              </div>
              <div className="grid grid-cols-5 gap-2">
                {drawingPanelColorPresets.map((color) => (
                  <div key={color}>
                    <button
                      className={`w-10 h-10 rounded-full border transition-transform cursor-pointer
                            hover:scale-110 ${
                              color === drawingColor
                                ? "ring-1 ring-offset-2 ring-primary"
                                : ""
                            }
                            `}
                      onClick={() => handleDrawingColorChange(color)}
                      style={{ backgroundColor: color }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex mt-5 space-x-2">
                <div className="relative">
                  <Input
                    type="color"
                    value={drawingColor}
                    onChange={(e) => handleDrawingColorChange(e.target.value)}
                    className={"w-12 h-10 p-1 cursor-pointer"}
                    disabled={isErasing}
                  />
                </div>
                <Input
                  type="text"
                  value={drawingColor}
                  onChange={(e) => handleDrawingColorChange(e.target.value)}
                  className={"flex-1"}
                  disabled={isErasing}
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="brush" className={"space-y-4"}>
            <div className="space-y-3">
              <Label className={"block text-sm font-semibold"}>
                Brush Size
              </Label>
              <div className="flex items-center space-x-3">
                <Minus className="h-4 w-4 text-gray-500" />
                <Slider
                  value={[brushWidth]}
                  min={1}
                  max={30}
                  step={1}
                  onValueChange={(value) => handleBrushWidthChange(value[0])}
                  className="flex-1"
                />
                <Plus className="h-4 w-4 text-gray-500" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {brushSizes.map((size) => (
                  <Button
                    key={size.value}
                    variant={size.value === brushWidth ? "default" : "outline"}
                    className={"px-2 py-1 h-auto"}
                    onClick={() => handleBrushWidthChange(size.value)}
                  >
                    {size.label}
                  </Button>
                ))}
              </div>
              <div className="space-y-2 mt-4">
                <div className="flex justify-between">
                  <Label className={"font-medium"}>
                    <Droplets className="mr-2 h-4 w-4" />
                    Opacity
                  </Label>
                  <span className="text-sm font-medium">{drawingOpacity}%</span>
                </div>
                <Slider
                  value={[drawingOpacity]}
                  min={1}
                  max={100}
                  step={1}
                  onValueChange={(value) => handleDrawingOpacityChange(value)}
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="erase" className={"space-y-4"}>
            <div className="space-y-4">
              {/* Eraser Status */}
              <div className="p-3 rounded-lg border bg-red-50 border-red-200">
                <p className="text-sm font-medium text-red-800">
                  🖊️ Eraser mode is active - Draw to erase objects
                </p>
              </div>

              {/* Eraser Size Controls */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="font-semibold">Eraser Size</Label>
                  <span className="text-sm font-medium text-gray-500">
                    {eraserSize}px
                  </span>
                </div>

                {/* Eraser Size Slider */}
                <div className="flex items-center space-x-3">
                  <Minus className="h-4 w-4 text-gray-500" />
                  <Slider
                    value={[eraserSize]}
                    min={1}
                    max={100}
                    step={1}
                    onValueChange={(value) => handleEraserSizeChange(value[0])}
                    className="flex-1"
                  />
                  <Plus className="h-4 w-4 text-gray-500" />
                </div>

                {/* Eraser Size Input */}
                <div className="space-y-2">
                  <Label className="text-sm">Size (1-100 pixels)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={eraserSize}
                    onChange={handleEraserSizeInputChange}
                    className="w-full"
                    placeholder="Enter size..."
                  />
                </div>

                {/* Quick Size Presets */}
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {[5, 15, 25, 50].map((size) => (
                    <Button
                      key={size}
                      variant={size === eraserSize ? "default" : "outline"}
                      className="px-2 py-1 h-auto text-xs"
                      onClick={() => handleEraserSizeChange(size)}
                    >
                      {size}px
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default DrawingPanel;
