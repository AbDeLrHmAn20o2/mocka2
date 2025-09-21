"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addImageToCanvas } from "@/fabric/fabric-utils";
import { fetchWithAuth } from "@/services/base-service";
import { uploadFileWithAuth, deleteMediaFromLibrary } from "@/services/upload-service";
import { useEditorStore } from "@/store";
import { Loader2, Upload, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

function UploadPanel() {
  const { canvas } = useEditorStore();

  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userUploads, setUserUploads] = useState([]);
  const [deletingIds, setDeletingIds] = useState(new Set());

  const { data: session, status } = useSession();

  const fetchUserUploads = useCallback(async () => {
    if (status !== "authenticated" || !session?.idToken) return;

    try {
      setIsLoading(true);
      const data = await fetchWithAuth("/v1/media/get");
      setUserUploads(data?.data || []);
    } catch (e) {
      console.error("Error fetching uploads:", e);
    } finally {
      setIsLoading(false);
    }
  }, [status, session?.idToken]);

  useEffect(() => {
    if (status === "authenticated") fetchUserUploads();
  }, [status, fetchUserUploads]);

  const handleFileUpload = async (e) => {
    console.log(e.target.files);
    const file = e.target.files[0];

    setIsUploading(true);

    try {
      const result = await uploadFileWithAuth(file);

      setUserUploads((prev) => [result?.data, ...prev]);

      console.log(result);
    } catch (e) {
      console.error("Error while uploading the file");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleAddImage = (imageUrl) => {
    if (!canvas) return;
    addImageToCanvas(canvas, imageUrl);
  };

  const handleDeleteImage = async (mediaId, mediaName) => {
    if (deletingIds.has(mediaId)) return; // Prevent double-clicks

    try {
      setDeletingIds(prev => new Set(prev).add(mediaId));
      
      const response = await deleteMediaFromLibrary(mediaId);
      
      if (response.success) {
        // Remove from local state
        setUserUploads(prev => prev.filter(item => item._id !== mediaId));
        toast.success("Image deleted successfully");
      } else {
        throw new Error("Failed to delete image");
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Failed to delete image");
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(mediaId);
        return newSet;
      });
    }
  };

  console.log("userUploads:", userUploads.length, "deletingIds:", deletingIds.size);

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            Media Library
          </h3>
          <p className="text-sm text-slate-600">
            Upload and manage your images
          </p>
        </div>

        {/* Upload Action */}
        <div className="space-y-3">
          <Label
            className={`w-full flex items-center justify-center gap-3 py-5 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white
          rounded-xl cursor-pointer font-semibold transition-all duration-300 shadow-lg hover:shadow-xl ${
            isUploading ? "opacity-70 cursor-not-allowed" : ""
          }`}
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
            <span>{isUploading ? "Uploading..." : "Upload Image"}</span>
            <Input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </Label>
          <p className="text-xs text-slate-500 text-center">
            Supports PNG, JPG, JPEG, WebP, SVG
          </p>
        </div>

        {/* Your Uploads */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Your Library
            </h4>
            {userUploads.length > 0 && (
              <span className="text-xs text-slate-500">
                {userUploads.length} images
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-8 bg-white border-2 border-dashed border-slate-200 rounded-xl">
              <div className="text-center">
                <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin text-slate-400" />
                <p className="text-sm text-slate-600 font-medium">
                  Loading your uploads...
                </p>
              </div>
            </div>
          ) : userUploads.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {userUploads.map((imageData, index) => (
                <div
                  key={imageData._id || index}
                  className="relative w-full h-24 border-2 border-gray-300 rounded-lg overflow-hidden bg-white group"
                >
                  <img
                    src={imageData.url}
                    alt={imageData.name || 'Uploaded image'}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => handleAddImage(imageData.url)}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `<div class="w-full h-full bg-red-200 flex items-center justify-center text-xs">Failed: ${imageData.name}</div>`;
                    }}
                  />
                  
                  {/* Delete button - always visible for now */}
                  <div className="absolute top-1 right-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteImage(imageData._id, imageData.name);
                      }}
                      disabled={deletingIds.has(imageData._id)}
                      className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      title="Delete image"
                    >
                      {deletingIds.has(imageData._id) ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Label
              className="text-center p-8 bg-white border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all duration-300"
            >
              <div className="flex flex-col items-center">
                <Upload className="w-8 h-8 mx-auto mb-3 text-slate-400" />
                <p className="text-sm text-slate-600 font-medium mb-1">
                  No uploads yet
                </p>
                <p className="text-xs text-slate-500">
                  Upload your first image to get started
                </p>
              </div>
              <Input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </Label>
          )}
        </div>

        {/* Tips */}
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
          <p className="text-xs text-indigo-800 font-medium">📸 Upload Tips</p>
          <p className="text-xs text-indigo-700 mt-1">
            Use high-resolution images for crisp designs. Click any image to add
            it to your canvas
          </p>
        </div>
      </div>
    </div>
  );
}

export default UploadPanel;
