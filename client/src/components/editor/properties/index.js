"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { fontManager } from "@/utils/font-manager";
import {
  cloneSelectedObject,
  deletedSelectedObject,
  debugSelection,
} from "@/fabric/fabric-utils";
import { useEditorStore } from "@/store";
import {
  Bold,
  Copy,
  FlipHorizontal,
  FlipVertical,
  Italic,
  MoveDown,
  MoveUp,
  Trash,
  Underline,
} from "lucide-react";
import { useEffect, useState } from "react";

//all states one by one -> reason for tutorial ->

function Properties() {
  const { canvas, markAsModified } = useEditorStore();
  //active object
  const [selectedObject, setSelectedObject] = useState(null);
  const [objectType, setObjectType] = useState("");

  //common
  const [opacity, setOpacity] = useState(100);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  //text
  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontWeight, setFontWeight] = useState("normal");
  const [fontStyle, setFontStyle] = useState("normal");
  const [underline, setUnderline] = useState(false);
  const [textColor, setTextColor] = useState("#000000");
  const [textBackgroundColor, setTextBackgroundColor] = useState("");
  const [letterSpacing, setLetterSpacing] = useState(0);
  
  // Font system state
  const [availableFonts, setAvailableFonts] = useState([]);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  const [fillColor, setFillColor] = useState("#ffffff");
  const [borderColor, setBorderColor] = useState("#000000");
  const [borderWidth, setBorderWidth] = useState(0);
  const [borderStyle, setBorderStyle] = useState("solid");

  const [filter, setFilter] = useState("none");
  const [blur, setBlur] = useState(0);

  useEffect(() => {
    if (!canvas) return;
    
    // Initialize font system
    const initializeFonts = async () => {
      try {
        const fonts = await fontManager.initialize();
        setAvailableFonts(fonts);
        setFontsLoaded(true);
        console.log('✅ Fonts loaded in properties panel:', fonts.length);
      } catch (error) {
        console.error('❌ Failed to load fonts in properties panel:', error);
        setAvailableFonts(['Arial', 'Helvetica', 'Times New Roman']); // Fallback
        setFontsLoaded(true);
      }
    };

    if (!fontsLoaded) {
      initializeFonts();
    }

    const handleSelectionCreated = () => {
      const activeObject = canvas.getActiveObject();

      if (activeObject) {
        console.log(activeObject.type, "activeObjecttype");

        setSelectedObject(activeObject);
        //update common properties
        setOpacity(Math.round(activeObject.opacity * 100) || 100);
        setWidth(Math.round(activeObject.width * activeObject.scaleX));
        setHeight(Math.round(activeObject.height * activeObject.scaleY));
        setBorderColor(activeObject.stroke || "#000000");
        setBorderWidth(activeObject.strokeWidth || 0);

        //check based on type
        if (activeObject.type === "i-text") {
          setObjectType("text");

          setText(activeObject.text || "");
          setFontSize(activeObject.fontSize || 24);
          setFontFamily(activeObject.fontFamily || "Arial");
          setFontWeight(activeObject.fontWeight || "normal");
          setFontStyle(activeObject.fontStyle || "normal");
          setUnderline(activeObject.underline || false);
          setTextColor(activeObject.fill || "#000000");
          setTextBackgroundColor(activeObject.backgroundColor || "");
          setLetterSpacing(activeObject.charSpacing || 0);
        } else if (activeObject.type === "image") {
          setObjectType("image");

          if (activeObject.filters && activeObject.filters.length > 0) {
            const filterObj = activeObject.filters[0];
            if (filterObj.type === "Grayscale") setFilter("grayscale");
            else if (filterObj.type === "Sepia") setFilter("sepia");
            else if (filterObj.type === "Invert") setFilter("invert");
            else if (filterObj.type === "Blur") {
              setFilter("blur");
              setBlur(filterObj.blur * 100 || 0);
            } else setFilter("none");
          }

          if (activeObject.strokeDashArray) {
            if (
              activeObject.strokeDashArray[0] === 5 &&
              activeObject.strokeDashArray[1] === 5
            ) {
              setBorderStyle("dashed");
            } else if (
              activeObject.strokeDashArray[0] === 2 &&
              activeObject.strokeDashArray[1] === 2
            ) {
              setBorderStyle("dotted");
            } else {
              setBorderStyle("solid");
            }
          }
        } else if (activeObject.type === "path") {
          setObjectType("path");

          if (activeObject.strokeDashArray) {
            if (
              activeObject.strokeDashArray[0] === 5 &&
              activeObject.strokeDashArray[1] === 5
            ) {
              setBorderStyle("dashed");
            } else if (
              activeObject.strokeDashArray[0] === 2 &&
              activeObject.strokeDashArray[1] === 2
            ) {
              setBorderStyle("dotted");
            } else {
              setBorderStyle("solid");
            }
          }
        } else {
          setObjectType("shape");

          if (activeObject.fill && typeof activeObject.fill === "string") {
            setFillColor(activeObject.fill);
          }

          if (activeObject.strokeDashArray) {
            if (
              activeObject.strokeDashArray[0] === 5 &&
              activeObject.strokeDashArray[1] === 5
            ) {
              setBorderStyle("dashed");
            } else if (
              activeObject.strokeDashArray[0] === 2 &&
              activeObject.strokeDashArray[1] === 2
            ) {
              setBorderStyle("dotted");
            } else {
              setBorderStyle("solid");
            }
          }
        }
      }
    };

    const handleSelectionCleared = () => {};

    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      handleSelectionCreated();
    }

    canvas.on("selection:created", handleSelectionCreated);
    canvas.on("selection:updated", handleSelectionCreated);
    canvas.on("object:modified", handleSelectionCreated);
    canvas.on("selection:cleared", handleSelectionCleared);

    return () => {
      canvas.off("selection:created", handleSelectionCreated);
      canvas.off("selection:updated", handleSelectionCreated);
      canvas.off("object:modified", handleSelectionCreated);
      canvas.off("selection:cleared", handleSelectionCleared);
    };
  }, [canvas, fontsLoaded]);

  const updateObjectProperty = (property, value) => {
    if (!canvas || !selectedObject) return;

    selectedObject.set(property, value);
    canvas.renderAll();
    markAsModified();
  };

  //opacity
  const handleOpacityChange = (value) => {
    const newValue = Number(value[0]);
    setOpacity(newValue);
    updateObjectProperty("opacity", newValue / 100);
  };

  //duplicate
  const handleDuplicate = async () => {
    if (!canvas || !selectedObject) return;
    await cloneSelectedObject(canvas);
    markAsModified();
  };

  //delete
  const handleDelete = () => {
    if (!canvas || !selectedObject) return;
    console.log("Delete button clicked from properties panel");
    debugSelection(canvas);
    deletedSelectedObject(canvas);
    markAsModified();
  };

  //arrangements
  const handleBringToFront = () => {
    if (!canvas || !selectedObject) return;
    canvas.bringObjectToFront(selectedObject);
    canvas.renderAll();
    markAsModified();
  };

  const handleSendToBack = () => {
    if (!canvas || !selectedObject) return;
    canvas.sendObjectToBack(selectedObject);
    canvas.renderAll();
    markAsModified();
  };

  //Flip H and Flip V

  const handleFlipHorizontal = () => {
    if (!canvas || !selectedObject) return;
    const flipX = !selectedObject.flipX;
    updateObjectProperty("flipX", flipX);
  };

  const handleFlipVertical = () => {
    if (!canvas || !selectedObject) return;
    const flipY = !selectedObject.flipY;
    updateObjectProperty("flipY", flipY);
  };

  const handleTextChange = (event) => {
    const newText = event.target.value;
    setText(newText);
    updateObjectProperty("text", newText);
  };

  const handleFontSizeChange = (e) => {
    const newSize = Number(e.target.value);
    setFontSize(newSize);
    updateObjectProperty("fontSize", newSize);
  };

  const handleFontFamilyChange = async (value) => {
    setFontFamily(value);
    
    // Load the font if it's not already loaded
    try {
      await fontManager.loadFont(value);
      fontManager.addToRecent(value);
    } catch (error) {
      console.error('Failed to load font:', error);
    }
    
    updateObjectProperty("fontFamily", value);
  };

  const handleToggleBold = () => {
    const newWeight = fontWeight === "bold" ? "normal" : "bold";
    setFontWeight(newWeight);
    updateObjectProperty("fontWeight", newWeight);
  };

  const handleToggleItalic = () => {
    const newStyle = fontStyle === "italic" ? "normal" : "italic";
    setFontStyle(newStyle);
    updateObjectProperty("fontStyle", newStyle);
  };

  const handleToggleUnderline = () => {
    const newUnderline = !underline;
    setUnderline(newUnderline);
    updateObjectProperty("underline", newUnderline);
  };

  const handleToggleTextColorChange = (e) => {
    const newTextColor = e.target.value;
    setTextColor(newTextColor);
    updateObjectProperty("fill", newTextColor);
  };

  const handleToggleTextBackgroundColorChange = (e) => {
    const newTextBgColor = e.target.value;
    setTextBackgroundColor(newTextBgColor);
    updateObjectProperty("backgroundColor", newTextBgColor);
  };

  const handleLetterSpacingChange = (value) => {
    const newSpacing = value[0];
    setLetterSpacing(newSpacing);
    updateObjectProperty("charSpacing", newSpacing);
  };

  const handleFillColorChange = (event) => {
    const newFillColor = event.target.value;
    setFillColor(newFillColor);
    updateObjectProperty("fill", newFillColor);
  };

  const handleBorderColorChange = (event) => {
    const newBorderColor = event.target.value;
    setBorderColor(newBorderColor);
    updateObjectProperty("stroke", newBorderColor);
  };

  const handleBorderWidthChange = (value) => {
    const newBorderWidth = value[0];
    setBorderWidth(newBorderWidth);
    updateObjectProperty("strokeWidth", newBorderWidth);
  };

  const handleBorderStyleChange = (value) => {
    setBorderStyle(value);

    let strokeDashArray = null;

    if (value === "dashed") {
      strokeDashArray = [5, 5];
    } else if (value === "dotted") {
      strokeDashArray = [2, 2];
    }

    updateObjectProperty("strokeDashArray", strokeDashArray);
  };

  const handleImageFilterChange = async (value) => {
    setFilter(value);

    if (!canvas || !selectedObject || selectedObject.type !== "image") return;
    try {
      canvas.discardActiveObject();

      const { filters } = await import("fabric");

      selectedObject.filters = [];

      switch (value) {
        case "grayscale":
          selectedObject.filters.push(new filters.Grayscale());

          break;
        case "sepia":
          selectedObject.filters.push(new filters.Sepia());

          break;
        case "invert":
          selectedObject.filters.push(new filters.Invert());

          break;
        case "blur":
          selectedObject.filters.push(new filters.Blur({ blur: blur / 100 }));

          break;
        case "none":
        default:
          break;
      }

      selectedObject.applyFilters();

      canvas.setActiveObject(selectedObject);
      canvas.renderAll();
      markAsModified();
    } catch (e) {
      console.error("Failed to apply filters");
    }
  };

  const handleBlurChange = async (value) => {
    const newBlurValue = value[0];
    setBlur(newBlurValue);

    if (
      !canvas ||
      !selectedObject ||
      selectedObject.type !== "image" ||
      filter !== "blur"
    )
      return;

    try {
      const { filters } = await import("fabric");

      selectedObject.filters = [new filters.Blur({ blur: newBlurValue / 100 })];
      selectedObject.applyFilters();
      canvas.renderAll();
      markAsModified();
    } catch (error) {
      console.error("Error while applying blur !", e);
    }
  };

  return (
    <div className="fixed right-0 top-[56px] bottom-[0px] w-[320px] bg-gradient-to-b from-slate-50 to-white border-l border-slate-200 z-10 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="font-semibold text-slate-800">Properties</span>
        </div>
        {selectedObject && (
          <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-md capitalize">
            {objectType}
          </div>
        )}
      </div>

      <div className="h-[calc(100%-73px)] overflow-auto">
        {!selectedObject ? (
          <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <div className="w-8 h-8 border-2 border-dashed border-slate-400 rounded-lg"></div>
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">No Selection</h3>
            <p className="text-sm text-slate-600">
              Select an object to edit its properties
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {/* Transform Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
                  Transform
                </h3>
              </div>

              {/* Size */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-700">
                    Width
                  </Label>
                  <div className="h-10 px-3 py-2 border border-slate-200 rounded-lg flex items-center bg-slate-50 font-mono text-sm text-slate-700">
                    {width}px
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-700">
                    Height
                  </Label>
                  <div className="h-10 px-3 py-2 border border-slate-200 rounded-lg flex items-center bg-slate-50 font-mono text-sm text-slate-700">
                    {height}px
                  </div>
                </div>
              </div>

              {/* Opacity */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-medium text-slate-700">
                    Opacity
                  </Label>
                  <div className="px-2 py-1 bg-slate-100 rounded-md">
                    <span className="text-xs font-medium text-slate-700">
                      {opacity}%
                    </span>
                  </div>
                </div>
                <div className="px-1">
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={[opacity]}
                    onValueChange={handleOpacityChange}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleFlipHorizontal}
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-xs font-medium"
                >
                  <FlipHorizontal className="h-4 w-4 mr-1.5" />
                  Flip H
                </Button>
                <Button
                  onClick={handleFlipVertical}
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-xs font-medium"
                >
                  <FlipVertical className="h-4 w-4 mr-1.5" />
                  Flip V
                </Button>
              </div>
            </div>

            {/* Layer Management */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
                  Layers
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleBringToFront}
                  variant="outline"
                  size="sm"
                  className="h-10 border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-xs font-medium flex-col gap-1"
                >
                  <MoveUp className="h-4 w-4" />
                  <span>To Front</span>
                </Button>
                <Button
                  onClick={handleSendToBack}
                  variant="outline"
                  size="sm"
                  className="h-10 border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-xs font-medium flex-col gap-1"
                >
                  <MoveDown className="h-4 w-4" />
                  <span>To Back</span>
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
                  Actions
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleDuplicate}
                  variant="default"
                  size="sm"
                  className="h-10 bg-blue-500 hover:bg-blue-600 text-xs font-medium flex-col gap-1"
                >
                  <Copy className="h-4 w-4" />
                  <span>Duplicate</span>
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="destructive"
                  size="sm"
                  className="h-10 text-xs font-medium flex-col gap-1"
                >
                  <Trash className="h-4 w-4" />
                  <span>Delete</span>
                </Button>
              </div>
            </div>

            {/* Text Properties */}
            {objectType === "text" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
                    Typography
                  </h3>
                </div>

                {/* Text Content */}
                <div className="space-y-3">
                  <Label className="text-xs font-medium text-slate-700">
                    Content
                  </Label>
                  <Textarea
                    value={text}
                    onChange={handleTextChange}
                    className="min-h-[80px] resize-none border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                    placeholder="Enter your text..."
                  />
                </div>

                {/* Font Settings */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-700">
                        Size
                      </Label>
                      <Input
                        value={fontSize}
                        onChange={handleFontSizeChange}
                        className="h-10 text-center font-mono border-slate-200 focus:border-blue-300"
                        type="number"
                        min="8"
                        max="200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-700">
                        Letter Spacing
                      </Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          min={-200}
                          max={800}
                          step={10}
                          value={[letterSpacing]}
                          onValueChange={handleLetterSpacingChange}
                          className="flex-1"
                        />
                        <span className="text-xs font-mono text-slate-600 w-8">
                          {letterSpacing}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Font Family */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">
                      Font Family
                    </Label>
                    <Select
                      value={fontFamily}
                      onValueChange={handleFontFamilyChange}
                    >
                      <SelectTrigger className="h-10 border-slate-200 focus:border-blue-300">
                        <SelectValue placeholder="Select Font" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {availableFonts.map((fontItem) => (
                          <SelectItem
                            key={fontItem}
                            value={fontItem}
                            style={{ fontFamily: fontItem }}
                            className="py-2"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span>{fontItem}</span>
                              {fontManager.getFontInfo(fontItem)?.category === 'custom' && (
                                <span className="text-xs text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded ml-2">
                                  Custom
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Text Styles */}
                  <div className="space-y-3">
                    <Label className="text-xs font-medium text-slate-700">
                      Style
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        variant={fontWeight === "bold" ? "default" : "outline"}
                        size="sm"
                        onClick={handleToggleBold}
                        className={`w-10 h-10 p-0 ${
                          fontWeight === "bold"
                            ? "bg-blue-500 hover:bg-blue-600 text-white"
                            : "border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                        }`}
                      >
                        <Bold className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={fontStyle === "italic" ? "default" : "outline"}
                        size="sm"
                        onClick={handleToggleItalic}
                        className={`w-10 h-10 p-0 ${
                          fontStyle === "italic"
                            ? "bg-blue-500 hover:bg-blue-600 text-white"
                            : "border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                        }`}
                      >
                        <Italic className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={underline ? "default" : "outline"}
                        size="sm"
                        onClick={handleToggleUnderline}
                        className={`w-10 h-10 p-0 ${
                          underline
                            ? "bg-blue-500 hover:bg-blue-600 text-white"
                            : "border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                        }`}
                      >
                        <Underline className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-700">
                        Text Color
                      </Label>
                      <div className="relative">
                        <div
                          className="w-full h-10 rounded-lg border-2 border-slate-200 cursor-pointer transition-all hover:border-blue-300"
                          style={{ backgroundColor: textColor }}
                        >
                          <Input
                            type="color"
                            value={textColor}
                            onChange={handleToggleTextColorChange}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </div>
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-white rounded text-xs font-mono text-slate-600">
                          {textColor.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-slate-700">
                        Background
                      </Label>
                      <div className="relative">
                        <div
                          className="w-full h-10 rounded-lg border-2 border-slate-200 cursor-pointer transition-all hover:border-blue-300"
                          style={{
                            backgroundColor: textBackgroundColor || "#ffffff",
                            backgroundImage: textBackgroundColor
                              ? "none"
                              : "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                            backgroundSize: "8px 8px",
                            backgroundPosition:
                              "0 0, 0 4px, 4px -4px, -4px 0px",
                          }}
                        >
                          <Input
                            type="color"
                            value={textBackgroundColor || "#ffffff"}
                            onChange={handleToggleTextBackgroundColorChange}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Shape Properties */}
            {objectType === "shape" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
                    Appearance
                  </h3>
                </div>

                {/* Fill & Stroke Colors */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">
                      Fill Color
                    </Label>
                    <div className="relative">
                      <div
                        className="w-full h-12 rounded-lg border-2 border-slate-200 cursor-pointer transition-all hover:border-blue-300 shadow-sm"
                        style={{ backgroundColor: fillColor }}
                      >
                        <Input
                          type="color"
                          value={fillColor}
                          onChange={handleFillColorChange}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-white rounded text-xs font-mono text-slate-600">
                        {fillColor.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">
                      Stroke Color
                    </Label>
                    <div className="relative">
                      <div
                        className="w-full h-12 rounded-lg border-2 border-slate-200 cursor-pointer transition-all hover:border-blue-300 shadow-sm"
                        style={{ backgroundColor: borderColor }}
                      >
                        <Input
                          type="color"
                          value={borderColor}
                          onChange={handleBorderColorChange}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-white rounded text-xs font-mono text-slate-600">
                        {borderColor.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stroke Width */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-medium text-slate-700">
                      Stroke Width
                    </Label>
                    <div className="px-2 py-1 bg-slate-100 rounded-md">
                      <span className="text-xs font-medium text-slate-700">
                        {borderWidth}px
                      </span>
                    </div>
                  </div>
                  <div className="px-1">
                    <Slider
                      min={0}
                      max={20}
                      step={1}
                      value={[borderWidth]}
                      onValueChange={handleBorderWidthChange}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Stroke Style */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-700">
                    Stroke Style
                  </Label>
                  <Select
                    value={borderStyle}
                    onValueChange={handleBorderStyleChange}
                  >
                    <SelectTrigger className="h-10 border-slate-200 focus:border-blue-300">
                      <SelectValue placeholder="Select Style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-0.5 bg-slate-600"></div>
                          <span>Solid</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="dashed">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-0.5 bg-slate-600"
                            style={{
                              backgroundImage:
                                "repeating-linear-gradient(to right, currentColor 0, currentColor 3px, transparent 3px, transparent 6px)",
                            }}
                          ></div>
                          <span>Dashed</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="dotted">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-0.5 bg-slate-600"
                            style={{
                              backgroundImage:
                                "repeating-linear-gradient(to right, currentColor 0, currentColor 1px, transparent 1px, transparent 3px)",
                            }}
                          ></div>
                          <span>Dotted</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Image Properties */}
            {objectType === "image" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="w-1.5 h-1.5 bg-pink-500 rounded-full"></div>
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
                    Image Effects
                  </h3>
                </div>

                {/* Border Settings */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">
                      Border Color
                    </Label>
                    <div className="relative">
                      <div
                        className="w-full h-12 rounded-lg border-2 border-slate-200 cursor-pointer transition-all hover:border-blue-300 shadow-sm"
                        style={{ backgroundColor: borderColor }}
                      >
                        <Input
                          type="color"
                          value={borderColor}
                          onChange={handleBorderColorChange}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-white rounded text-xs font-mono text-slate-600">
                        {borderColor.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Border Width */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-medium text-slate-700">
                        Border Width
                      </Label>
                      <div className="px-2 py-1 bg-slate-100 rounded-md">
                        <span className="text-xs font-medium text-slate-700">
                          {borderWidth}px
                        </span>
                      </div>
                    </div>
                    <div className="px-1">
                      <Slider
                        min={0}
                        max={20}
                        step={1}
                        value={[borderWidth]}
                        onValueChange={handleBorderWidthChange}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Border Style */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">
                      Border Style
                    </Label>
                    <Select
                      value={borderStyle}
                      onValueChange={handleBorderStyleChange}
                    >
                      <SelectTrigger className="h-10 border-slate-200 focus:border-blue-300">
                        <SelectValue placeholder="Select Style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solid">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-0.5 bg-slate-600"></div>
                            <span>Solid</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="dashed">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-0.5 bg-slate-600"
                              style={{
                                backgroundImage:
                                  "repeating-linear-gradient(to right, currentColor 0, currentColor 3px, transparent 3px, transparent 6px)",
                              }}
                            ></div>
                            <span>Dashed</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="dotted">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-0.5 bg-slate-600"
                              style={{
                                backgroundImage:
                                  "repeating-linear-gradient(to right, currentColor 0, currentColor 1px, transparent 1px, transparent 3px)",
                              }}
                            ></div>
                            <span>Dotted</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Image Filters */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">
                      Filter Effect
                    </Label>
                    <Select
                      value={filter}
                      onValueChange={handleImageFilterChange}
                    >
                      <SelectTrigger className="h-10 border-slate-200 focus:border-blue-300">
                        <SelectValue placeholder="Choose Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gradient-to-br from-slate-200 to-slate-300 rounded"></div>
                            <span>None</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="grayscale">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gradient-to-br from-gray-300 to-gray-500 rounded"></div>
                            <span>Grayscale</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="sepia">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gradient-to-br from-yellow-200 to-amber-400 rounded"></div>
                            <span>Sepia</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="invert">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gradient-to-br from-purple-400 to-blue-500 rounded"></div>
                            <span>Invert</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="blur">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gradient-to-br from-blue-200 to-indigo-400 rounded blur-[1px]"></div>
                            <span>Blur</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {filter === "blur" && (
                    <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs font-medium text-blue-800">
                          Blur Intensity
                        </Label>
                        <div className="px-2 py-1 bg-blue-100 rounded-md">
                          <span className="text-xs font-medium text-blue-800">
                            {blur}%
                          </span>
                        </div>
                      </div>
                      <div className="px-1">
                        <Slider
                          min={0}
                          max={100}
                          step={1}
                          value={[blur]}
                          onValueChange={handleBlurChange}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Path Properties */}
            {objectType === "path" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
                  <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
                    Path Styling
                  </h3>
                </div>

                {/* Stroke Settings */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">
                      Stroke Color
                    </Label>
                    <div className="relative">
                      <div
                        className="w-full h-12 rounded-lg border-2 border-slate-200 cursor-pointer transition-all hover:border-blue-300 shadow-sm"
                        style={{ backgroundColor: borderColor }}
                      >
                        <Input
                          type="color"
                          value={borderColor}
                          onChange={handleBorderColorChange}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-white rounded text-xs font-mono text-slate-600">
                        {borderColor.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Stroke Width */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-medium text-slate-700">
                        Stroke Width
                      </Label>
                      <div className="px-2 py-1 bg-slate-100 rounded-md">
                        <span className="text-xs font-medium text-slate-700">
                          {borderWidth}px
                        </span>
                      </div>
                    </div>
                    <div className="px-1">
                      <Slider
                        min={0}
                        max={20}
                        step={1}
                        value={[borderWidth]}
                        onValueChange={handleBorderWidthChange}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Stroke Style */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">
                      Stroke Style
                    </Label>
                    <Select
                      value={borderStyle}
                      onValueChange={handleBorderStyleChange}
                    >
                      <SelectTrigger className="h-10 border-slate-200 focus:border-blue-300">
                        <SelectValue placeholder="Select Style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solid">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-0.5 bg-slate-600"></div>
                            <span>Solid</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="dashed">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-0.5 bg-slate-600"
                              style={{
                                backgroundImage:
                                  "repeating-linear-gradient(to right, currentColor 0, currentColor 3px, transparent 3px, transparent 6px)",
                              }}
                            ></div>
                            <span>Dashed</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="dotted">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-0.5 bg-slate-600"
                              style={{
                                backgroundImage:
                                  "repeating-linear-gradient(to right, currentColor 0, currentColor 1px, transparent 1px, transparent 3px)",
                              }}
                            ></div>
                            <span>Dotted</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Properties;
