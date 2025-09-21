"use client";

import { Button } from "@/components/ui/button";
import { textPresets } from "@/config";
import { addTextToCanvas } from "@/fabric/fabric-utils";
import { useEditorStore } from "@/store";
import { Type } from "lucide-react";

function TextPanel() {
  const { canvas } = useEditorStore();

  const handleAddCustomTextBox = () => {
    if (!canvas) return;

    addTextToCanvas(canvas, "Enter text here", { fontSize: 24 });
  };

  const handleAddPresetText = (currentPreset) => {
    if (!canvas) return;
    addTextToCanvas(canvas, currentPreset.text, currentPreset);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Text Tools</h3>
          <p className="text-sm text-slate-600">
            Add and style text in your design
          </p>
        </div>

        {/* Quick Text Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleAddCustomTextBox}
            className="w-full py-4 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Type className="mr-3 h-5 w-5" />
            <span className="font-semibold">Add Text Box</span>
          </Button>
        </div>

        {/* Text Presets */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Text Styles
            </h4>
            <span className="text-xs text-slate-500">
              {textPresets.length} presets
            </span>
          </div>

          <div className="space-y-3">
            {textPresets.map((preset, index) => (
              <button
                className="w-full text-left p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md group"
                key={index}
                onClick={() => handleAddPresetText(preset)}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex-1 truncate"
                    style={{
                      fontSize: `${Math.min(preset.fontSize / 1.8, 20)}px`,
                      fontWeight: preset.fontWeight,
                      fontStyle: preset.fontStyle || "normal",
                      fontFamily: preset.fontFamily,
                      color: preset.fill || "#1e293b",
                    }}
                  >
                    {preset.text}
                  </div>
                  <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Type className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center space-x-3 text-xs text-slate-500">
                  <span>{preset.fontFamily}</span>
                  <span>•</span>
                  <span>{preset.fontSize}px</span>
                  <span>•</span>
                  <span className="capitalize">{preset.fontWeight}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
          <p className="text-xs text-indigo-800 font-medium">✨ Pro Tip</p>
          <p className="text-xs text-indigo-700 mt-1">
            Select text and use the properties panel to customize fonts, colors,
            and spacing
          </p>
        </div>
      </div>
    </div>
  );
}

export default TextPanel;
