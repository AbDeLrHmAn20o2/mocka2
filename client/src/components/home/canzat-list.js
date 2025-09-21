"use client";

import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { saveDesign } from "@/services/design-service";
import { useEditorStore } from "@/store";
import { isPremiumUser } from "@/lib/premium-utils";
import SubscriptionModal from "@/components/subscription/premium-modal";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useCanzat } from "@/hooks/useCanzat";
import CanzatPreview from "./canzat-preview";

function CanzatList({
  setShowCanzatModal,
  isModalView = false,
  showAll = false,
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingCanzat, setLoadingCanzat] = useState(null);
  const [showMoreCanzat, setShowMoreCanzat] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { userSubscription, userDesigns } = useEditorStore();

  // Use dynamic canzat hook
  const { 
    canzatItems, 
    loading: canzatLoading, 
    error: canzatError
  } = useCanzat();

  const isUserPremium = isPremiumUser(userSubscription);
  const designCount = userDesigns?.length || 0;

  const handleSelectCanzat = async (canzatItem) => {
    if (loading) return;

    // Check if user has reached the free tier limit (5 designs) and is not premium
    if (!isUserPremium && designCount >= 5) {
      console.log(
        "Blocking canzat selection - premium required for unlimited designs"
      );
      setShowUpgradeModal(true);
      return;
    }

    // Check if canzat is premium and user doesn't have premium access
    if (canzatItem.isPremium && !isUserPremium) {
      console.log(
        "Blocking premium canzat selection - premium subscription required"
      );
      setShowUpgradeModal(true);
      return;
    }

    try {
      setLoading(true);
      setLoadingCanzat(canzatItem.id);

      console.log(
        `Creating new design with canzat image: ${canzatItem.name} from ${canzatItem.imagePath}`
      );

      // Load the image to get its actual dimensions
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      const imageLoadPromise = new Promise((resolve, reject) => {
        img.onload = () => {
          resolve({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.onerror = () => {
          reject(new Error("Failed to load image"));
        };
        img.src = canzatItem.imagePath;
      });

      const { width: imageWidth, height: imageHeight } = await imageLoadPromise;
      
      console.log(`Image dimensions: ${imageWidth}x${imageHeight}`);

      // Create a basic canvas structure with the image as an object using actual dimensions
      const canvasData = {
        version: "5.3.0",
        objects: [
          {
            type: "image",
            version: "5.3.0",
            left: 0,
            top: 0,
            width: imageWidth,
            height: imageHeight,
            scaleX: 1,
            scaleY: 1,
            angle: 0,
            flipX: false,
            flipY: false,
            opacity: 1,
            visible: true,
            src: canzatItem.imagePath,
            crossOrigin: "anonymous",
            selectable: true,
            evented: true,
            name: "canzat-base-image"
          }
        ],
        background: "#ffffff",
        width: imageWidth,
        height: imageHeight
      };

      console.log("Created canvas data with actual image dimensions:", canvasData);

      // Use the actual image dimensions for the canvas
      const canvasWidth = imageWidth;
      const canvasHeight = imageHeight;

      // Create a new design with the canzat image data
      const initialDesignData = {
        name: `${canzatItem.name} Design`,
        canvasData: JSON.stringify(canvasData),
        width: canvasWidth,
        height: canvasHeight,
        category: canzatItem.category,
      };

      console.log("Creating design with actual image dimensions:", initialDesignData);

      const newDesign = await saveDesign(initialDesignData);
      console.log("Design creation result:", newDesign);

      if (newDesign?.success) {
        // Close modal if in modal view (same as templates)
        if (isModalView && setShowCanzatModal) {
          setShowCanzatModal(false);
        }
        router.push(`/editor/${newDesign?.data?._id}`);
      } else {
        throw new Error(
          newDesign?.message || "Failed to create design from canzat"
        );
      }
    } catch (error) {
      console.error("Error loading canzat:", error);
      toast.error("Failed to load canzat", {
        description:
          error.message || "Please check your connection and try again.",
      });
    } finally {
      setLoading(false);
      setLoadingCanzat(null);
    }
  };

  // Show loading state
  if (canzatLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-slate-600">Loading canzat items...</span>
      </div>
    );
  }

  // Show error state
  if (canzatError) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">Failed to load canzat items</p>
        <p className="text-slate-500 text-sm">{canzatError}</p>
      </div>
    );
  }

  // No canzat items state
  if (!canzatItems || canzatItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-slate-500 text-center">
          <p className="text-lg mb-2">No canzat items available</p>
          <p className="text-sm">Add JSON canzat files to /public/canzat/ folder</p>
        </div>
      </div>
    );
  }

  // Determine how many canzat items to show
  const itemsToShow = showAll || isModalView 
    ? canzatItems 
    : showMoreCanzat 
    ? canzatItems 
    : canzatItems.slice(0, 5);

  const hasMoreCanzat = canzatItems.length > 5;

  return (
    <>
      <div className={`${isModalView ? "p-6" : ""}`}>
        {/* Canzat Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {itemsToShow.map((canzatItem) => {
            return (
              <div
                key={`${canzatItem.id}-${isModalView ? "modal" : "home"}`}
                onClick={() => handleSelectCanzat(canzatItem)}
                className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 hover:border-purple-400 hover:scale-105"
              >
                {/* Canzat Preview */}
                <div className="aspect-[4/3] bg-white flex items-center justify-center relative overflow-hidden border-b border-slate-100 p-3">
                  <CanzatPreview
                    key={`${canzatItem.id}-preview-${
                      isModalView ? "modal" : "home"
                    }`}
                    canzatItem={canzatItem}
                    width={300}
                    height={200}
                    className="w-full h-full"
                    context={isModalView ? "modal" : "home"}
                    isPremium={canzatItem.isPremium}
                  />

                  {/* Loading overlay */}
                  {loadingCanzat === canzatItem.id && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <LoadingSpinner size="md" className="text-white" />
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                {/* Canzat Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-slate-800 text-sm group-hover:text-purple-600 transition-colors">
                      {canzatItem.name}
                    </h3>
                    {canzatItem.isPremium && (
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs px-2 py-1 rounded-full">
                        PRO
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {canzatItem.width} × {canzatItem.height}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Show More Button - only show on home page (not modal view) */}
        {!isModalView && !showAll && hasMoreCanzat && !showMoreCanzat && (
          <div className="flex justify-center mt-8">
            <Button
              onClick={() => setShowCanzatModal(true)}
              variant="outline"
              size="lg"
              className="bg-white hover:bg-purple-50 text-purple-600 border-purple-200 hover:border-purple-300 font-semibold px-8 py-3 rounded-full"
            >
              Show More Canzat Items
            </Button>
          </div>
        )}
      </div>

      <SubscriptionModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
}

export default CanzatList;
