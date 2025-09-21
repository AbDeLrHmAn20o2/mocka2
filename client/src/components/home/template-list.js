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
import TemplatePreview from "./template-preview";
import { useTemplates } from "@/hooks/useTemplates";
import { loadTemplateData } from "@/services/template-service";

function TemplateList({
  setShowTemplatesModal,
  isModalView = false,
  showAll = false,
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(null);
  const [showMoreTemplates, setShowMoreTemplates] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { userSubscription, userDesigns } = useEditorStore();

  // Use dynamic templates hook
  const { 
    templates: customTemplates, 
    loading: templatesLoading, 
    error: templatesError
  } = useTemplates();

  const isUserPremium = isPremiumUser(userSubscription);
  const designCount = userDesigns?.length || 0;

  const handleSelectTemplate = async (template) => {
    if (loading) return;

    // Check if user has reached the free tier limit (5 designs) and is not premium
    if (!isUserPremium && designCount >= 5) {
      console.log(
        "Blocking template selection - premium required for unlimited designs"
      );
      setShowUpgradeModal(true);
      return;
    }

    // Check if template is premium and user doesn't have premium access
    if (template.isPremium && !isUserPremium) {
      setShowUpgradeModal(true);
      return;
    }

    try {
      setLoading(true);
      setLoadingTemplate(template.id);

      console.log(
        `Loading template: ${template.name} from ${template.fileName}`
      );

      // Load the template JSON data using the service
      const canvasData = await loadTemplateData(template.fileName);
      console.log("Template data loaded:", canvasData);

      // Check if the template file itself has premium flag and double-check
      if (canvasData.isPremium && !isUserPremium) {
        setShowUpgradeModal(true);
        return;
      }

      // Validate the canvas data
      if (!canvasData || typeof canvasData !== "object") {
        throw new Error("Invalid template data format");
      }

      // Use dimensions from the canvas data if available, fallback to template config
      const canvasWidth = canvasData.width || template.width;
      const canvasHeight = canvasData.height || template.height;

      // Create a new design with the template data
      const initialDesignData = {
        name: `${template.name} Design`,
        canvasData: JSON.stringify(canvasData),
        width: canvasWidth,
        height: canvasHeight,
        category: template.category,
      };

      console.log("Creating design with data:", initialDesignData);

      const newDesign = await saveDesign(initialDesignData);
      console.log("Design creation result:", newDesign);

      if (newDesign?.success) {
        // Close modal if in modal view
        if (isModalView && setShowTemplatesModal) {
          setShowTemplatesModal(false);
        }
        router.push(`/editor/${newDesign?.data?._id}`);
      } else {
        throw new Error(
          newDesign?.message || "Failed to create design from template"
        );
      }
    } catch (error) {
      console.error("Error loading template:", error);
      toast.error("Failed to load template", {
        description:
          error.message || "Please check your connection and try again.",
      });
    } finally {
      setLoading(false);
      setLoadingTemplate(null);
    }
  };

  // Determine which templates to show
  const templatesToShow =
    showAll || showMoreTemplates
      ? customTemplates
      : customTemplates.slice(0, 5);

  const hasMoreTemplates = customTemplates.length > 5;

  // Loading state for templates
  if (templatesLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <p className="text-slate-500 mt-4">Loading templates...</p>
      </div>
    );
  }

  // Error state for templates
  if (templatesError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-slate-500 text-center">
          <p className="text-lg mb-2 text-red-500">Failed to load templates</p>
          <p className="text-sm">{templatesError}</p>
        </div>
      </div>
    );
  }

  // No templates state
  if (!customTemplates || customTemplates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-slate-500 text-center">
          <p className="text-lg mb-2">No templates available</p>
          <p className="text-sm">Add JSON template files to /public/examples/ folder</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`${isModalView ? "p-6" : ""}`}>
        {/* Templates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {templatesToShow.map((template) => {
            return (
              <div
                key={`${template.id}-${isModalView ? "modal" : "home"}`}
                onClick={() => handleSelectTemplate(template)}
                className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 hover:border-purple-400 hover:scale-105"
              >
                {/* Template Preview */}
                <div className="aspect-[4/3] bg-white flex items-center justify-center relative overflow-hidden border-b border-slate-100 p-3">
                <TemplatePreview
                  key={`${template.id}-preview-${
                    isModalView ? "modal" : "home"
                  }`}
                  templateFile={template.fileName}
                  width={template.width}
                  height={template.height}
                  className="w-full h-full"
                  context={isModalView ? "modal" : "home"}
                  isPremium={template.isPremium}
                />

                {/* Loading overlay */}
                {loadingTemplate === template.id && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <LoadingSpinner size="md" className="text-white" />
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              {/* Template Info */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-slate-800 text-sm group-hover:text-purple-600 transition-colors">
                    {template.name}
                  </h3>
                  {template.isPremium && (
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs px-2 py-1 rounded-full">
                      PRO
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {template.width} × {template.height}
                </p>
              </div>
            </div>
            );
          })}
        </div>

        {/* Show More Button - only show on home page (not modal view) */}
        {/* Show More Button - only show on home page (not modal view) */}
        {!isModalView && !showAll && hasMoreTemplates && !showMoreTemplates && (
          <div className="flex justify-center mt-8">
            <Button
              onClick={() => setShowTemplatesModal(true)}
              variant="outline"
              size="lg"
              className="bg-white hover:bg-purple-50 text-purple-600 border-purple-200 hover:border-purple-300 font-semibold px-8 py-3 rounded-full"
            >
              Show More Templates
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

export default TemplateList;
