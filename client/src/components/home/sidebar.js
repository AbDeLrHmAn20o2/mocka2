"use client";

import { saveDesign } from "@/services/design-service";
import { useEditorStore } from "@/store";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CreditCard, FolderOpen, Home, Plus, Layout, Sparkles } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { isPremiumUser } from "@/lib/premium-utils";

function SideBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { 
    setShowPremiumModal, 
    setShowDesignsModal, 
    setShowTemplatesModal,
    setShowCanzatModal,
    userSubscription,
    userDesigns 
  } = useEditorStore();
  const [loading, setLoading] = useState(false);

  // Check if we're on the home page
  const isHomePage = pathname === "/";

  const isUserPremium = isPremiumUser(userSubscription);
  const designCount = userDesigns?.length || 0;

  const handleCreateNewDesign = async () => {
    if (loading) return;

    // Check if user has reached the free tier limit (5 designs) and is not premium
    if (!isUserPremium && designCount >= 5) {
      setShowPremiumModal(true);
      return;
    }

    try {
      setLoading(true);

      const initialDesignData = {
        name: "Untitled design - Youtube Thumbnail",
        canvasData: null,
        width: 825,
        height: 465,
        category: "youtube_thumbnail",
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
    <aside className="w-[72px] bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700 flex flex-col items-center py-6 fixed left-0 top-0 h-full z-30 shadow-2xl">
      <div
        onClick={handleCreateNewDesign}
        className="flex flex-col items-center"
      >
        <button
          disabled={loading}
          className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white hover:from-blue-400 hover:to-indigo-400 transition-all duration-300 disabled:opacity-75 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/25 hover:scale-110 border border-blue-400/20"
        >
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <Plus className="w-6 h-6" />
          )}
        </button>
        <div className="text-xs font-bold text-center mt-2 text-slate-300">
          {loading ? "Creating..." : "Create"}
        </div>
      </div>
      <nav className="mt-8 flex flex-col items-center space-y-4 w-full px-2">
        {[
          {
            icon: <Home className="h-6 w-6" />,
            label: "Home",
            active: isHomePage,
          },
          {
            icon: <FolderOpen className="h-6 w-6" />,
            label: "Projects",
            active: false,
          },
          // Only show Templates and Canzat buttons on home page
          ...(isHomePage
            ? [
                {
                  icon: <Layout className="h-6 w-6" />,
                  label: "Templates",
                  active: false,
                },
                {
                  icon: <Sparkles className="h-6 w-6" />,
                  label: "Canzat",
                  active: false,
                },
              ]
            : []),
          {
            icon: <CreditCard className="h-6 w-6" />,
            label: "Billing",
            active: false,
          },
        ].map((menuItem, index) => (
          <div
            onClick={
              menuItem.label === "Billing"
                ? () => setShowPremiumModal(true)
                : menuItem.label === "Projects"
                ? () => setShowDesignsModal(true)
                : menuItem.label === "Templates"
                ? () => setShowTemplatesModal(true)
                : menuItem.label === "Canzat"
                ? () => setShowCanzatModal(true)
                : null
            }
            key={index}
            className="flex cursor-pointer flex-col items-center w-full"
          >
            <div
              className={`w-full flex flex-col items-center py-3 rounded-2xl transition-all duration-300 ${
                menuItem.active
                  ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400 border border-blue-500/30"
                  : "text-slate-400 hover:bg-slate-700/50 hover:text-white"
              }`}
            >
              <div className="relative">{menuItem.icon}</div>
              <span className="text-xs font-bold mt-1">{menuItem.label}</span>
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default SideBar;
