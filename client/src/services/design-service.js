import { fetchWithAuth } from "./base-service";

export async function getUserDesigns() {
  return fetchWithAuth("/v1/designs");
}

export async function getUserDesignByID(designId) {
  return fetchWithAuth(`/v1/designs/${designId}`);
}

export async function saveDesign(designData, designId = null) {
  return fetchWithAuth(`/v1/designs`, {
    method: "POST",
    body: {
      ...designData,
      designId,
    },
  });
}

export async function deleteDesign(designId) {
  return fetchWithAuth(`/v1/designs/${designId}`, {
    method: "DELETE",
  });
}

export async function saveCanvasState(
  canvas,
  designId = null,
  title = "Untitled Design"
) {
  if (!canvas) return false;

  try {
    const canvasData = canvas.toJSON(["id", "filters"]);
    
    // Generate thumbnail for design preview
    let thumbnail = null;
    try {
      // Create a smaller version for thumbnail (max 300x300)
      const originalZoom = canvas.getZoom();
      const maxThumbnailSize = 300;
      const canvasWidth = canvas.width || 800;
      const canvasHeight = canvas.height || 600;
      
      // Calculate scale to fit within thumbnail bounds
      const scale = Math.min(maxThumbnailSize / canvasWidth, maxThumbnailSize / canvasHeight);
      const thumbnailWidth = Math.round(canvasWidth * scale);
      const thumbnailHeight = Math.round(canvasHeight * scale);
      
      // Temporarily adjust canvas for thumbnail
      canvas.setZoom(scale);
      canvas.setDimensions({
        width: thumbnailWidth,
        height: thumbnailHeight
      });
      
      // Generate thumbnail as data URL
      thumbnail = canvas.toDataURL({
        format: 'jpeg',
        quality: 0.8,
        multiplier: 1
      });
      
      // Restore original canvas settings
      canvas.setZoom(originalZoom);
      canvas.setDimensions({
        width: canvasWidth,
        height: canvasHeight
      });
      canvas.requestRenderAll();
      
    } catch (thumbnailError) {
      console.warn("Failed to generate thumbnail:", thumbnailError);
      // Continue without thumbnail if generation fails
    }

    const designData = {
      name: title,
      canvasData: JSON.stringify(canvasData),
      width: canvas.width,
      height: canvas.height,
      thumbnail: thumbnail
    };

    return saveDesign(designData, designId);
  } catch (error) {
    console.error("Error saving canvas state:", error);
    throw error;
  }
}
