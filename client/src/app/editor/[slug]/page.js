"use client";

import MainEditor from "@/components/editor";
import { getUserDesigns, getUserDesignByID } from "@/services/design-service";
import { getUserSubscription } from "@/services/subscription-service";
import { useEditorStore } from "@/store";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function EditorPage() {
  const { setUserSubscription, setUserDesigns, setDesignId, userSubscription } =
    useEditorStore();
  const params = useParams();
  const router = useRouter();
  const designId = params?.slug;
  const [isVerifying, setIsVerifying] = useState(true);
  const [canAccess, setCanAccess] = useState(false);

  const fetchUserSubscription = async () => {
    const response = await getUserSubscription();

    if (response.success) setUserSubscription(response.data);
    return response.data;
  };

  async function fetchUserDesigns() {
    const result = await getUserDesigns();

    if (result?.success) setUserDesigns(result?.data);
  }

  // Function to check if design is premium and user has access
  const verifyDesignAccess = async (subscription) => {
    try {
      // Get the design details
      const designResponse = await getUserDesignByID(designId);

      if (!designResponse?.success) {
        toast.error("Design not found");
        router.push("/");
        return false;
      }

      const design = designResponse.data;

      // Check if design was created from a premium template
      if (design?.canvasData) {
        try {
          const canvasData = JSON.parse(design.canvasData);

          // Check if this design came from a premium template
          if (canvasData?.isPremium && !subscription?.isPremium) {
            toast.error("Premium Design Access Required", {
              description:
                "This design requires a Premium subscription to edit.",
              action: {
                label: "Upgrade to Premium",
                onClick: () => {
                  const { setShowPremiumModal } = useEditorStore.getState();
                  setShowPremiumModal(true);
                },
              },
            });

            // Redirect back to home after showing error
            setTimeout(() => {
              router.push("/");
            }, 2000);

            return false;
          }
        } catch (parseError) {
          console.log(
            "Could not parse canvas data for premium check:",
            parseError
          );
          // If we can't parse, allow access (assume it's not premium)
        }
      }

      return true;
    } catch (error) {
      console.error("Error verifying design access:", error);
      // On error, allow access to avoid blocking legitimate users
      return true;
    }
  };

  useEffect(() => {
    const initializeEditor = async () => {
      if (!designId) {
        setIsVerifying(false);
        return;
      }

      try {
        // Set the design ID from URL params
        setDesignId(designId);

        // Fetch user subscription and designs
        const subscription = await fetchUserSubscription();
        await fetchUserDesigns();

        // Verify access to this specific design
        const hasAccess = await verifyDesignAccess(subscription);
        setCanAccess(hasAccess);
      } catch (error) {
        console.error("Error initializing editor:", error);
        toast.error("Failed to load design");
        router.push("/");
      } finally {
        setIsVerifying(false);
      }
    };

    initializeEditor();
  }, [designId]);

  // Show loading while verifying access
  if (isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading design...</p>
        </div>
      </div>
    );
  }

  // Don't render editor if access is denied
  if (!canAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Access Restricted
          </h2>
          <p className="text-gray-600">
            This design requires a Premium subscription to edit.
          </p>
        </div>
      </div>
    );
  }

  return <MainEditor />;
}
