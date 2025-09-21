"use client";

import { useRouter } from "next/navigation";
import DesignPreview from "./design-preview";
import { DesignThumbnail } from "./design-thumbnail";
import { Trash2, FileText } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { deleteDesign, getUserDesigns } from "@/services/design-service";
import { useEditorStore } from "@/store";
import { useState } from "react";

function DesignList({
  listOfDesigns,
  isLoading,
  isModalView,
  setShowDesignsModal,
}) {
  const router = useRouter();
  const { setUserDesigns } = useEditorStore();
  const [deletingDesigns, setDeletingDesigns] = useState(new Set());
  const [deleteError, setDeleteError] = useState(null);

  // Helper function to format date (Figma style)
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) return "Today";
      if (diffDays === 2) return "Yesterday";
      if (diffDays <= 7) return `${diffDays - 1}d ago`;
      if (diffDays <= 30) return `${Math.ceil(diffDays / 7)}w ago`;

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "—";
    }
  };

  async function fetchUserDesigns() {
    try {
      const result = await getUserDesigns();
      if (result?.success) setUserDesigns(result?.data);
    } catch (error) {
      console.error("Error fetching designs:", error);
      throw error;
    }
  }

  const handleDeleteDesign = async (getCurrentDesignId) => {
    // Prevent multiple clicks if already deleting
    if (deletingDesigns.has(getCurrentDesignId)) return;

    // Add design ID to deleting set
    setDeletingDesigns((prev) => new Set(prev).add(getCurrentDesignId));
    setDeleteError(null);

    try {
      const response = await deleteDesign(getCurrentDesignId);

      if (response.success) {
        await fetchUserDesigns();
      }
    } catch (error) {
      console.error("Error deleting design:", error);
      setDeleteError(error);
      // Show error message to user
      // You can use a toast notification here if available
    } finally {
      // Remove design ID from deleting set
      setDeletingDesigns((prev) => {
        const newSet = new Set(prev);
        newSet.delete(getCurrentDesignId);
        return newSet;
      });
    }
  };

  // Modern loading state
  if (isLoading)
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-gradient-to-br from-slate-100 to-blue-100 border border-slate-200 rounded-2xl animate-pulse shadow-sm"
          ></div>
        ))}
      </div>
    );

  return (
    <div className={`${isModalView ? "p-4" : ""}`}>
      {!listOfDesigns.length ? (
        // Modern empty state
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-32 h-32 bg-gradient-to-br from-slate-100 to-blue-100 border-2 border-dashed border-slate-300 rounded-3xl flex items-center justify-center mb-8 shadow-lg">
            <FileText className="w-12 h-12 text-slate-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-3">
            No designs yet
          </h3>
          <p className="text-slate-600 text-center max-w-sm text-lg leading-relaxed">
            Your creative journey starts here. Choose a template above to begin
            crafting something amazing.
          </p>
        </div>
      ) : (
        // Modern design grid
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {listOfDesigns.map((design, index) => (
            <div key={design._id} className="group">
              {/* Modern card design */}
              <div className="relative">
                {/* Thumbnail container */}
                <div
                  onClick={() => {
                    router.push(`/editor/${design?._id}`);
                    isModalView ? setShowDesignsModal(false) : null;
                  }}
                  className="aspect-square w-full border-2 border-slate-200 rounded-2xl overflow-hidden cursor-pointer hover:border-blue-400 transition-all duration-300 group shadow-lg hover:shadow-2xl bg-white"
                >
                  {design?.canvasData ? (
                    <DesignPreview key={design._id} design={design} />
                  ) : (
                    <DesignThumbnail design={design} />
                  )}

                  {/* Modern hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                {/* Delete button - elegant positioning */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDesign(design?._id);
                    }}
                    className={`w-8 h-8 bg-white/95 backdrop-blur-sm border-2 border-slate-200 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                      deletingDesigns.has(design._id)
                        ? "cursor-not-allowed opacity-50"
                        : "hover:bg-red-50 hover:border-red-300 hover:text-red-600 hover:scale-110"
                    }`}
                    disabled={deletingDesigns.has(design._id)}
                  >
                    {deletingDesigns.has(design._id) ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                </div>
              </div>

              {/* Modern file info */}
              <div className="mt-3 px-1">
                <h3 className="text-sm font-bold text-slate-800 truncate">
                  {design.name}
                </h3>
                <span className="text-xs text-slate-500 mt-1 block font-medium">
                  {formatDate(design.updatedAt || design.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DesignList;
