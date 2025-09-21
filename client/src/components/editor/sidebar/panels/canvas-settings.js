"use cliimport { Settings, Maximize } from 'lucide-react';nt";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEditorStore } from "@/store";
import { resizeCanvas } from "@/fabric/fabric-utils";
import { Settings, Maximize, Minimize } from "lucide-react";
import { useState, useEffect } from "react";

function CanvasSettings() {
  const { canvas, markAsModified } = useEditorStore();
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(600);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");

  // Preset sizes
  const presetSizes = [
    { name: "Square (800x800)", width: 800, height: 800 },
    { name: "Landscape (1200x800)", width: 1200, height: 800 },
    { name: "Portrait (800x1200)", width: 800, height: 1200 },
    { name: "YouTube Thumbnail (1280x720)", width: 1280, height: 720 },
    { name: "Instagram Post (1080x1080)", width: 1080, height: 1080 },
    { name: "Instagram Story (1080x1920)", width: 1080, height: 1920 },
    { name: "Facebook Cover (1200x630)", width: 1200, height: 630 },
    { name: "Twitter Header (1500x500)", width: 1500, height: 500 },
    { name: "Business Card (350x200)", width: 350, height: 200 },
    { name: "A4 (595x842)", width: 595, height: 842 },
    { name: "Custom", width: 0, height: 0 }
  ];

  // Update state when canvas changes
  useEffect(() => {
    if (canvas) {
      setCanvasWidth(canvas.width || 800);
      setCanvasHeight(canvas.height || 600);
      setBackgroundColor(canvas.backgroundColor || "#ffffff");
    }
  }, [canvas]);

  const updateCanvasSize = (width, height) => {
    if (!canvas) return;
    
    const success = resizeCanvas(canvas, width, height);
    
    if (success) {
      // Update state
      setCanvasWidth(width);
      setCanvasHeight(height);
      
      // Mark as modified
      markAsModified();
    } else {
      alert("حدث خطأ أثناء تغيير حجم مساحة العمل");
    }
  };

  const updateBackgroundColor = (color) => {
    if (!canvas) return;
    
    try {
      canvas.backgroundColor = color;
      canvas.renderAll();
      setBackgroundColor(color);
      markAsModified();
    } catch (error) {
      console.error("Error updating background color:", error);
    }
  };

  const handlePresetChange = (preset) => {
    const selectedPreset = presetSizes.find(p => p.name === preset);
    if (selectedPreset && selectedPreset.width > 0) {
      updateCanvasSize(selectedPreset.width, selectedPreset.height);
    }
  };

  const handleCustomSize = () => {
    const width = parseInt(canvasWidth);
    const height = parseInt(canvasHeight);
    
    if (width > 0 && height > 0 && width <= 5000 && height <= 5000) {
      updateCanvasSize(width, height);
    } else {
      alert("يرجى إدخال أبعاد صحيحة (1-5000 بكسل)");
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Canvas Settings</h3>
      </div>

      {/* Preset Sizes */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Preset Sizes</Label>
        <Select onValueChange={handlePresetChange}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a preset size" />
          </SelectTrigger>
          <SelectContent>
            {presetSizes.map((preset) => (
              <SelectItem key={preset.name} value={preset.name}>
                {preset.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Custom Size */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Custom Size</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Width (px)</Label>
            <Input
              type="number"
              value={canvasWidth}
              onChange={(e) => setCanvasWidth(e.target.value)}
              min="1"
              max="5000"
              className="text-center"
            />
          </div>
          <div>
            <Label className="text-xs">Height (px)</Label>
            <Input
              type="number"
              value={canvasHeight}
              onChange={(e) => setCanvasHeight(e.target.value)}
              min="1"
              max="5000"
              className="text-center"
            />
          </div>
        </div>
        <Button 
          onClick={handleCustomSize}
          className="w-full"
          size="sm"
        >
          Apply Custom Size
        </Button>
      </div>

      {/* Background Color */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Background Color</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={backgroundColor}
            onChange={(e) => updateBackgroundColor(e.target.value)}
            className="w-12 h-8 p-1 border rounded"
          />
          <Input
            type="text"
            value={backgroundColor}
            onChange={(e) => updateBackgroundColor(e.target.value)}
            placeholder="#ffffff"
            className="flex-1 text-sm"
          />
        </div>
      </div>

      {/* Current Info */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-600">
          <div>Current Size: {canvasWidth} × {canvasHeight} px</div>
          <div>Aspect Ratio: {(canvasWidth / canvasHeight).toFixed(2)}:1</div>
        </div>
      </div>
    </div>
  );
}

export default CanvasSettings;
