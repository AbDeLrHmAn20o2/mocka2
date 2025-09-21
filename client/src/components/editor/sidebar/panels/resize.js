"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEditorStore } from "@/store";
import {
  Maximize2,
  Monitor,
  Smartphone,
  Tablet,
  Square,
  Crop,
} from "lucide-react";
import { useState, useEffect } from "react";

const presetSizes = [
  { name: "Instagram Post", width: 1080, height: 1080, icon: Square },
  { name: "Instagram Story", width: 1080, height: 1920, icon: Smartphone },
  { name: "Facebook Post", width: 1200, height: 630, icon: Monitor },
  { name: "Twitter Header", width: 1500, height: 500, icon: Monitor },
  { name: "LinkedIn Post", width: 1200, height: 627, icon: Monitor },
  { name: "A4 Document", width: 2480, height: 3508, icon: Monitor },
  { name: "Business Card", width: 1050, height: 600, icon: Square },
  { name: "Web Banner", width: 1920, height: 400, icon: Monitor },
];

function ResizePanel() {
  const { canvas, markAsModified } = useEditorStore();
  const [customWidth, setCustomWidth] = useState(800);
  const [customHeight, setCustomHeight] = useState(600);

  useEffect(() => {
    if (canvas) {
      setCustomWidth(canvas.width || 800);
      setCustomHeight(canvas.height || 600);
    }
  }, [canvas]);

  const handlePresetResize = (width, height) => {
    if (!canvas) return;

    canvas.setDimensions({ width, height });
    canvas.renderAll();
    markAsModified();

    setCustomWidth(width);
    setCustomHeight(height);
  };

  const handleCustomResize = () => {
    if (!canvas) return;

    const width = Math.max(100, Math.min(5000, customWidth));
    const height = Math.max(100, Math.min(5000, customHeight));

    canvas.setDimensions({ width, height });
    canvas.renderAll();
    markAsModified();
  };

  const handleFitToContent = () => {
    if (!canvas) return;

    const objects = canvas.getObjects();
    if (objects.length === 0) return;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    objects.forEach((obj) => {
      const bound = obj.getBoundingRect();
      minX = Math.min(minX, bound.left);
      minY = Math.min(minY, bound.top);
      maxX = Math.max(maxX, bound.left + bound.width);
      maxY = Math.max(maxY, bound.top + bound.height);
    });

    const padding = 50;
    const newWidth = Math.max(200, maxX - minX + padding * 2);
    const newHeight = Math.max(200, maxY - minY + padding * 2);

    canvas.setDimensions({ width: newWidth, height: newHeight });
    canvas.renderAll();
    markAsModified();

    setCustomWidth(newWidth);
    setCustomHeight(newHeight);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Canvas Size</h3>
          <p className="text-sm text-slate-600">
            Resize your canvas to fit your needs
          </p>
        </div>

        {/* Current Size */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-800">
              Current Size
            </span>
            <Crop className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-lg font-bold text-slate-700">
            {canvas?.width || 800} × {canvas?.height || 600} px
          </p>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleFitToContent}
            className="w-full py-4 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Maximize2 className="mr-3 h-5 w-5" />
            <span className="font-semibold">Fit to Content</span>
          </Button>
        </div>

        {/* Preset Sizes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Popular Sizes
            </h4>
            <span className="text-xs text-slate-500">
              {presetSizes.length} presets
            </span>
          </div>

          <div className="space-y-2">
            {presetSizes.map((preset, index) => {
              const IconComponent = preset.icon;
              return (
                <button
                  key={index}
                  onClick={() =>
                    handlePresetResize(preset.width, preset.height)
                  }
                  className="w-full p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md group text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 group-hover:bg-blue-100 rounded-lg flex items-center justify-center transition-colors">
                        <IconComponent className="w-4 h-4 text-slate-600 group-hover:text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">
                          {preset.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {preset.width} × {preset.height} px
                        </p>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Crop className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Size */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Custom Size
          </h4>

          <div className="bg-white p-4 border border-slate-200 rounded-xl space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">
                  Width
                </Label>
                <Input
                  type="number"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(Number(e.target.value))}
                  className="w-full"
                  min="100"
                  max="5000"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">
                  Height
                </Label>
                <Input
                  type="number"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(Number(e.target.value))}
                  className="w-full"
                  min="100"
                  max="5000"
                />
              </div>
            </div>

            <Button
              onClick={handleCustomResize}
              className="w-full bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-600 rounded-xl font-medium transition-all duration-300"
            >
              Apply Custom Size
            </Button>
          </div>
        </div>

        {/* Tips */}
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
          <p className="text-xs text-indigo-800 font-medium">📏 Resize Tips</p>
          <p className="text-xs text-indigo-700 mt-1">
            Use preset sizes for social media posts, or create custom dimensions
            for your specific needs
          </p>
        </div>
      </div>
    </div>
  );
}

export default ResizePanel;
