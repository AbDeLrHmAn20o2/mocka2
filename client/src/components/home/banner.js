"use client";

import { Crown } from "lucide-react";
import { Button } from "../ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useState } from "react";
import { saveDesign } from "@/services/design-service";
import { useRouter } from "next/navigation";
import { useEditorStore } from "@/store";
import { toast } from "sonner";
import SubscriptionModal from "@/components/subscription/premium-modal";

function Banner() {
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const router = useRouter();
  const { userSubscription, userDesigns } = useEditorStore();

  const handleCreateNewDesign = async () => {
    // Check if user has reached the free tier limit and is not premium
    const isPremium = userSubscription?.isPremium === true;
    const designCount = userDesigns?.length || 0;

    // If userSubscription is null/undefined, assume free tier (allow creation if under 5)
    const shouldAllowCreation =
      !userSubscription || designCount < 5 || isPremium;

    if (!shouldAllowCreation) {
      setShowUpgradeModal(true);
      return;
    }

    if (loading) return;

    try {
      setLoading(true);

      const initialDesignData = {
        name: "Untitled design - Custom Canvas",
        canvasData: null,
        width: 800,
        height: 600,
        category: "custom",
      };

      const newDesign = await saveDesign(initialDesignData);

      if (newDesign?.success) {
        router.push(`/editor/${newDesign?.data?._id}`);
      } else {
        throw new Error("Failed to create new design");
      }
    } catch (error) {
      console.error("Error creating design:", error);
      toast.error("Failed to create design", {
        description: "Please check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white p-8 md:p-12 text-center shadow-2xl border border-slate-800/50">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
        <div
          className="absolute bottom-10 right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/3 w-24 h-24 bg-slate-500/10 rounded-full blur-xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row justify-center items-center mb-4">
          <div className="bg-gradient-to-r from-blue-400 to-indigo-400 p-3 rounded-2xl mb-4 sm:mb-0 sm:mr-4 shadow-lg">
            <Crown className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-blue-200 via-indigo-200 to-slate-200 bg-clip-text text-transparent">
                Design Beyond
              </span>
              <br />
              <span className="text-white">Imagination</span>
            </h1>
          </div>
        </div>

        <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
          Create stunning visuals with our professional design tools.
          <span className="text-indigo-200 font-medium">
            {" "}
            Turn your ideas into reality.
          </span>
        </p>

        <Button
          onClick={handleCreateNewDesign}
          disabled={loading}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-75 disabled:hover:scale-100 text-lg"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" className="mr-3 text-white" />
              Creating Your Canvas...
            </>
          ) : (
            "Start Creating Now"
          )}
        </Button>
      </div>
      
      {/* Upgrade Modal */}
      <SubscriptionModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
      />
    </div>
  );
}

export default Banner;
