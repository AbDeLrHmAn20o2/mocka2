"use client";

import { designTypes } from "@/config";
import { saveDesign } from "@/services/design-service";
import { useEditorStore } from "@/store";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { isPremiumUser } from "@/lib/premium-utils";
import SubscriptionModal from "@/components/subscription/premium-modal";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

function DesignTypes() {
  const { userDesigns, userSubscription } = useEditorStore();
  const [currentSelectedType, setCurrentSelectedType] = useState(-1);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isUserPremium = isPremiumUser(userSubscription);
  const designCount = userDesigns?.length || 0;

  const handleCreateNewDesign = async (getCurrentType, index) => {
    setCurrentSelectedType(index);

    // Check if user has reached the free tier limit (5 designs) and is not premium
    if (!isUserPremium && designCount >= 5) {
      console.log(
        "Blocking design creation - premium required for unlimited designs"
      );
      setShowUpgradeModal(true);
      setCurrentSelectedType(-1);
      return;
    }

    console.log("Allowing design creation");

    if (loading) return;

    try {
      setLoading(true);

      const initialDesignData = {
        name: getCurrentType.label,
        canvasData: null,
        width: getCurrentType.width,
        height: getCurrentType.height,
        category: getCurrentType.label,
      };

      console.log("Creating design with type:", getCurrentType);
      console.log("Design data:", initialDesignData);

      const newDesign = await saveDesign(initialDesignData);
      console.log("Design creation response:", newDesign);

      if (newDesign?.success) {
        router.push(`/editor/${newDesign?.data?._id}`);
      } else {
        throw new Error(newDesign?.message || "Failed to create new design");
      }
    } catch (error) {
      console.error("Error creating design:", error);
      toast.error("Failed to create design", {
        description: "Please check your connection and try again.",
      });
    } finally {
      setLoading(false);
      setCurrentSelectedType(-1);
    }
  };
  return (
    <>
      <div className="flex justify-center mt-16">
        <div className="w-full max-w-6xl">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-3">
              Choose Your Size
            </h2>
            <p className="text-slate-600 text-lg">
              Start with a template designed for your creative vision
            </p>
            {!isUserPremium && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto">
                <p className="text-sm text-blue-800">
                  <strong>Free Plan:</strong> Create up to 5 designs • 
                  <span className="text-blue-600 ml-1">Upgrade for unlimited designs</span>
                </p>
              </div>
            )}
          </div>

          {/* Design Type Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-8">
            {designTypes.map((type, index) => {
              return (
                <div
                  onClick={() => handleCreateNewDesign(type, index)}
                  key={index}
                  className="flex cursor-pointer flex-col items-center group transition-all duration-300 hover:scale-110"
                >
                  <div className="relative">
                    <div
                      className={`${type.bgColor} w-20 h-20 rounded-3xl flex items-center justify-center mb-4 shadow-lg transition-all duration-300 border border-white/20 group-hover:shadow-2xl`}
                    >
                      {type.icon}
                    </div>
                    {/* Glow effect on hover */}
                    <div
                      className={`absolute inset-0 ${type.bgColor} w-20 h-20 rounded-3xl opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300`}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold items-center flex gap-2 text-center text-slate-700 group-hover:text-slate-900 transition-colors">
                    {loading && currentSelectedType === index && (
                      <LoadingSpinner size="sm" />
                    )}
                    <div className="flex flex-col items-center">
                      <span>{type.label}</span>
                      <span className="text-xs text-slate-500 mt-1">
                        {type.width} × {type.height}
                      </span>
                    </div>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <SubscriptionModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
}

export default DesignTypes;
