"use client";

import { useSession } from "next-auth/react";
import Banner from "@/components/home/banner";
import DesignTypes from "@/components/home/design-types";
import CustomTemplates from "@/components/home/custom-templates";
import CustomCanzat from "@/components/home/custom-canzat";
import DesignModal from "@/components/home/designs-modal";
import TemplatesModal from "@/components/home/templates-modal";
import CanzatModal from "@/components/home/canzat-modal";
import Header from "@/components/home/header";
import RecentDesigns from "@/components/home/recent-designs";
import SideBar from "@/components/home/sidebar";
import SubscriptionModal from "@/components/subscription/premium-modal";
import { LoadingPage } from "@/components/ui/loading-spinner";
import { ConnectionError } from "@/components/ui/connection-error";
import { useErrorHandler } from "@/components/ui/global-error-display";
import { useSessionManager } from "@/components/ui/session-status";
import { getUserDesigns } from "@/services/design-service";
import { getUserSubscription } from "@/services/subscription-service";
import { useEditorStore } from "@/store";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Home() {
  const { data: session, status } = useSession();
  const {
    setUserSubscription,
    setUserDesigns,
    showPremiumModal,
    setShowPremiumModal,
    showDesignsModal,
    setShowDesignsModal,
    showTemplatesModal,
    setShowTemplatesModal,
    showCanzatModal,
    setShowCanzatModal,
    userDesigns,
    setUserDesignsLoading,
    userDesignsLoading,
  } = useEditorStore();

  const { handleError } = useErrorHandler();
  const { extendSession } = useSessionManager();
  const [initialLoading, setInitialLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(null);

  const fetchUserSubscription = async () => {
    // Only fetch if user is authenticated
    if (status !== "authenticated" || !session?.idToken) {
      console.log("No authenticated session, setting default free subscription");
      setUserSubscription({ isPremium: false, premiumSince: null });
      return;
    }

    try {
      console.log("Fetching user subscription...");
      const response = await getUserSubscription();
      console.log("Subscription response:", response);

      if (response?.success && response?.data) {
        setUserSubscription(response.data);
        console.log("User subscription set:", response.data);

        // Show notification if subscription has expired
        if (
          response.data.message &&
          response.data.message.includes("expired")
        ) {
          toast.warning("Premium Subscription Expired", {
            description: response.data.message,
            duration: 5000,
          });
        }
      } else {
        console.warn(
          "Subscription fetch unsuccessful, setting default free subscription"
        );
        // Set default subscription for free users
        setUserSubscription({ isPremium: false, premiumSince: null });
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
      // Use the enhanced error handler
      await handleError(error, {
        context: "fetchUserSubscription",
        operation: "subscription_fetch",
      });
      // Set default subscription for free users when API fails
      console.log("Setting default free subscription due to error");
      setUserSubscription({ isPremium: false, premiumSince: null });
      throw error; // Re-throw to handle in the calling function
    }
  };

  async function fetchUserDesigns() {
    // Only fetch if user is authenticated
    if (status !== "authenticated" || !session?.idToken) {
      console.log("No authenticated session, skipping designs fetch");
      setUserDesigns([]);
      setUserDesignsLoading(false);
      return;
    }

    setUserDesignsLoading(true);
    try {
      const result = await getUserDesigns();

      if (result?.success) {
        setUserDesigns(result?.data);
      }
    } catch (error) {
      console.error("Error fetching designs:", error);
      await handleError(error, {
        context: "fetchUserDesigns",
        operation: "designs_fetch",
      });
      throw error; // Re-throw to handle in the calling function
    } finally {
      setUserDesignsLoading(false);
    }
  }

  const initializeData = async () => {
    console.log("initializeData called with status:", status, "hasSession:", !!session);
    
    setConnectionError(null);

    try {
      // Wait for session status to be determined
      if (status === "loading") {
        console.log("Session still loading, waiting...");
        setInitialLoading(true);
        return; // Still loading, don't fetch data yet
      }

      setInitialLoading(true);

      // If not authenticated, set defaults and finish loading
      if (status === "unauthenticated" || !session) {
        console.log("User not authenticated, setting default values");
        setUserSubscription({ isPremium: false, premiumSince: null });
        setUserDesigns([]);
        setUserDesignsLoading(false);
        setInitialLoading(false);
        return;
      }

      // Fetch both subscription and designs in parallel only if authenticated
      console.log("User authenticated, fetching data...");
      await Promise.allSettled([fetchUserSubscription(), fetchUserDesigns()]);
      console.log("Data fetching completed");
    } catch (error) {
      console.error("Error in initializeData:", error);
      await handleError(error, {
        context: "initializeData",
        operation: "app_initialization",
        critical: true,
      });
      setConnectionError(error);
    } finally {
      setInitialLoading(false);
      console.log("initializeData completed, initialLoading set to false");
    }
  };

  useEffect(() => {
    initializeData();
  }, [status]); // Only re-run when session status changes, not the session object itself

  // Show loading page during initial load
  if (status === "loading") {
    return <LoadingPage message="Checking authentication..." />;
  }

  if (initialLoading) {
    return <LoadingPage message="Loading your workspace..." />;
  }

  // Show connection error if initial load failed
  if (connectionError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ConnectionError
          onRetry={initializeData}
          message="Failed to load workspace data"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <SideBar />
      <div className="flex-1 flex flex-col ml-[72px]">
        <Header />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 overflow-y-auto pt-20 pb-8 scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400">
          <div className="max-w-7xl mx-auto relative z-10">
            <Banner />
            <DesignTypes />
            <CustomTemplates />
            <CustomCanzat />
            <RecentDesigns />
          </div>
        </main>
      </div>
      <SubscriptionModal
        isOpen={showPremiumModal}
        onClose={setShowPremiumModal}
      />
      <DesignModal
        isOpen={showDesignsModal}
        onClose={setShowDesignsModal}
        userDesigns={userDesigns}
        setShowDesignsModal={setShowDesignsModal}
        userDesignsLoading={userDesignsLoading}
      />
      <TemplatesModal
        isOpen={showTemplatesModal}
        onClose={setShowTemplatesModal}
        setShowTemplatesModal={setShowTemplatesModal}
      />
      <CanzatModal
        isOpen={showCanzatModal}
        onClose={setShowCanzatModal}
        setShowCanzatModal={setShowCanzatModal}
      />
    </div>
  );
}
