"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { uploadFileWithAuth } from "@/services/upload-service";
import { saveDesign } from "@/services/design-service";
import { useEditorStore } from "@/store";
import { centerCanvas } from "@/fabric/fabric-utils";
import { FileUp, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

function ImportDesignPanel() {
  const [isUploading, setIsUploading] = useState(false);
  const { canvas } = useEditorStore();
  const router = useRouter();

  const handleDesignFileUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setIsUploading(true);

    try {
      if (file.type === "application/json") {
        // Handle JSON canvas data
        const text = await file.text();
        let canvasData;

        try {
          canvasData = JSON.parse(text);
        } catch (parseError) {
          console.error("Invalid JSON file:", parseError);
          alert("Invalid JSON file. Please check the file format.");
          return;
        }

        // Validate that it's a proper canvas data structure
        if (!canvasData.objects && !canvasData.version) {
          alert("This doesn't appear to be a valid canvas JSON file.");
          return;
        }

        // Create new design with imported canvas data
        const designData = {
          name: file.name.replace(".json", "") || "Imported Design",
          canvasData: text,
          width: canvasData.width || 800,
          height: canvasData.height || 600,
          category: "Imported",
        };

        console.log("Creating design with data:", designData);
        const newDesign = await saveDesign(designData);

        if (newDesign?.success) {
          console.log("Design created successfully:", newDesign.data);
          // Add a small delay to ensure the design is saved before redirecting
          setTimeout(() => {
            router.push(`/editor/${newDesign?.data?._id}`);
          }, 300);
        } else {
          alert("Failed to create design. Please try again.");
        }
      } else if (file.type.startsWith("image/")) {
        // Handle image files - convert to design
        const uploadResult = await uploadFileWithAuth(file);

        if (uploadResult?.data?.url) {
          // Create canvas data with the uploaded image
          const canvasData = {
            version: "5.3.0",
            objects: [
              {
                type: "image",
                version: "5.3.0",
                originX: "left",
                originY: "top",
                left: 50,
                top: 50,
                width: 400,
                height: 300,
                src: uploadResult.data.url,
                id: `image-${Date.now()}`,
              },
            ],
            background: "#ffffff",
            width: 800,
            height: 600,
          };

          const designData = {
            name: file.name.replace(/\.[^/.]+$/, ""),
            canvasData: JSON.stringify(canvasData),
            width: 800,
            height: 600,
            category: "Imported",
          };

          const newDesign = await saveDesign(designData);

          if (newDesign?.success) {
            // Add a small delay to ensure the design is saved before redirecting
            setTimeout(() => {
              router.push(`/editor/${newDesign?.data?._id}`);
            }, 100);
          }
        }
      }
    } catch (e) {
      console.error("Error importing design:", e);
      alert(`Failed to import design: ${e.message || "Unknown error"}`);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleCanvasImport = async (e) => {
    const file = e.target.files[0];

    if (!file || !canvas) return;

    setIsUploading(true);

    try {
      if (file.type === "application/json") {
        const text = await file.text();
        let canvasData;

        try {
          canvasData = JSON.parse(text);
        } catch (parseError) {
          console.error("Invalid JSON file:", parseError);
          alert("Invalid JSON file. Please check the file format.");
          return;
        }

        // Validate that it's a proper canvas data structure
        if (!canvasData.objects && !canvasData.version) {
          alert("This doesn't appear to be a valid canvas JSON file.");
          return;
        }

        // Store current canvas dimensions before import
        const currentWidth = canvas.width || 800;
        const currentHeight = canvas.height || 600;

        // Set canvas dimensions from imported data, fallback to current or defaults
        const newWidth = canvasData.width || currentWidth;
        const newHeight = canvasData.height || currentHeight;

        console.log(`Setting canvas dimensions to ${newWidth}x${newHeight}`);

        // Clear canvas first
        canvas.clear();

        // Set background color
        canvas.backgroundColor = canvasData.background || "#ffffff";

        // Update canvas dimensions
        canvas.setDimensions({
          width: newWidth,
          height: newHeight,
        });

        // Set the canvas wrapper dimensions too
        canvas.setWidth(newWidth);
        canvas.setHeight(newHeight);

        // Load into current canvas
        console.log("Loading canvas data...", {
          width: newWidth,
          height: newHeight,
        });

        canvas
          .loadFromJSON(canvasData)
          .then(async (loadedCanvas) => {
            console.log("Canvas JSON loaded successfully");

            // Ensure eraser strokes remain non-selectable
            ensureEraserStrokesNonSelectable(loadedCanvas);

            // Re-center the canvas after loading (same as fabric-utils)
            centerCanvas(loadedCanvas);

            // Force a complete re-render
            loadedCanvas.requestRenderAll();

            // Add a small delay and try to select all objects to make them visible
            setTimeout(async () => {
              const objects = loadedCanvas.getObjects();
              console.log(`Found ${objects.length} objects after import`);

              if (objects.length > 0) {
                try {
                  // Import ActiveSelection from fabric
                  const { ActiveSelection } = await import("fabric");

                  // Temporarily disable selection event handlers to prevent properties panel flashing
                  const handleSelectionCreated = () => {};
                  const handleSelectionCleared = () => {};

                  // Remove existing handlers temporarily
                  loadedCanvas.off("selection:created");
                  loadedCanvas.off("selection:updated");
                  loadedCanvas.off("selection:cleared");

                  // Add temporary empty handlers
                  loadedCanvas.on("selection:created", handleSelectionCreated);
                  loadedCanvas.on("selection:updated", handleSelectionCreated);
                  loadedCanvas.on("selection:cleared", handleSelectionCleared);

                  // Create a selection of all objects to ensure they're visible
                  const selection = new ActiveSelection(objects, {
                    canvas: loadedCanvas,
                  });
                  loadedCanvas.setActiveObject(selection);
                  loadedCanvas.requestRenderAll();

                  // Clear selection and restore event handlers
                  setTimeout(() => {
                    loadedCanvas.discardActiveObject();
                    loadedCanvas.requestRenderAll();

                    // Remove temporary handlers
                    loadedCanvas.off(
                      "selection:created",
                      handleSelectionCreated
                    );
                    loadedCanvas.off(
                      "selection:updated",
                      handleSelectionCreated
                    );
                    loadedCanvas.off(
                      "selection:cleared",
                      handleSelectionCleared
                    );

                    // Note: The main editor will re-attach the proper handlers
                    console.log(
                      "Import selection cleared, handlers will be restored by main editor"
                    );
                  }, 100);
                } catch (e) {
                  console.error("Error creating selection:", e);
                  // Fallback: skip the selection entirely
                  console.log("Falling back to simple render");
                  loadedCanvas.requestRenderAll();
                }
              }
            }, 100);

            console.log("Design loaded into current canvas successfully");

            // Mark the canvas as modified to trigger auto-save
            const { markAsModified } = useEditorStore.getState();
            markAsModified();

            console.log("Canvas marked as modified, auto-save triggered");
          })
          .catch((error) => {
            console.error("Error loading canvas JSON:", error);
          });

        alert("Design imported to current canvas successfully!");
      }
    } catch (e) {
      console.error("Error importing to canvas:", e);
      alert(`Failed to import to canvas: ${e.message || "Unknown error"}`);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            Import Files
          </h3>
          <p className="text-sm text-slate-600">
            Import designs and media into your canvas
          </p>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          {/* Import to Current Canvas */}
          {canvas && (
            <Label
              className={`w-full flex items-center justify-center gap-3 py-5 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white
              rounded-xl cursor-pointer font-semibold transition-all duration-300 shadow-lg hover:shadow-xl ${
                isUploading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <FileUp className="w-5 h-5" />
              )}
              <span>
                {isUploading ? "Importing..." : "Add to Current Canvas"}
              </span>
              <Input
                type="file"
                className="hidden"
                accept=".json"
                onChange={handleCanvasImport}
                disabled={isUploading}
              />
            </Label>
          )}
        </div>

        {/* Supported Formats */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Supported Formats
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="p-4 bg-white border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-800">
                  JSON Files
                </span>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                  .json
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Fabric.js canvas data and design exports
              </p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-800">
                  Images
                </span>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                  .png .jpg .svg
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Converted to design elements automatically
              </p>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
          <p className="text-xs text-indigo-800 font-medium">💡 Import Tips</p>
          <p className="text-xs text-indigo-700 mt-1">
            For best results, use exported JSON files from this editor or import
            high-quality images
          </p>
        </div>
      </div>
    </div>
  );
}

export default ImportDesignPanel;
