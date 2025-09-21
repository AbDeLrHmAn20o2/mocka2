"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { colorPresets } from "@/config";
import { centerCanvas } from "@/fabric/fabric-utils";
import { useEditorStore } from "@/store";
import { Check, Palette } from "lucide-react";
import { useState } from "react";

function SettingsPanel() {
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const { canvas, markAsModified } = useEditorStore();

  const handleColorChange = (event) => {
    setBackgroundColor(event.target.value);
  };

  const handleColorPresetApply = (getCurrentColor) => {
    setBackgroundColor(getCurrentColor);
  };

  const handleApplyChanges = () => {
    if (!canvas) return;
    canvas.set("backgroundColor", backgroundColor);
    canvas.renderAll();

    centerCanvas(canvas);
    markAsModified();
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            Canvas Settings
          </h3>
          <p className="text-sm text-slate-600">
            Customize your canvas background
          </p>
        </div>

        {/* Background Color Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-blue-500" />
            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Background Color
            </h4>
          </div>

          {/* Color Presets */}
          <div className="space-y-3">
            <div className="grid grid-cols-6 gap-3">
              {colorPresets.map((color) => (
                <TooltipProvider key={color}>
                  <Tooltip>
                    <TooltipTrigger asChild="true">
                      <button
                        className={`w-10 h-10 rounded-xl border-2 transition-all duration-300 hover:scale-110 hover:shadow-lg cursor-pointer ${
                          color === backgroundColor
                            ? "ring-2 ring-blue-500 ring-offset-2 border-blue-500"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => handleColorPresetApply(color)}
                      >
                        {color === backgroundColor && (
                          <Check className="w-5 h-5 text-white mx-auto drop-shadow-lg" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{color}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>

            {/* Custom Color Picker */}
            <div className="bg-white p-4 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Input
                    type="color"
                    value={backgroundColor}
                    onChange={handleColorChange}
                    className="w-12 h-12 p-1 cursor-pointer border-2 border-slate-200 rounded-lg"
                  />
                </div>
                <Input
                  type="text"
                  value={backgroundColor}
                  onChange={handleColorChange}
                  className="flex-1 font-mono text-sm"
                  placeholder="#FFFFFF"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Click the color square or enter a hex code
              </p>
            </div>
          </div>
        </div>

        {/* Apply Button */}
        <div className="space-y-3">
          <Button
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={handleApplyChanges}
          >
            Apply Changes
          </Button>
        </div>

        {/* Tips */}
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
          <p className="text-xs text-indigo-800 font-medium">🎨 Design Tips</p>
          <p className="text-xs text-indigo-700 mt-1">
            Choose backgrounds that complement your design elements. Light
            backgrounds work best for text-heavy designs
          </p>
        </div>
      </div>
    </div>
  );
}

export default SettingsPanel;
