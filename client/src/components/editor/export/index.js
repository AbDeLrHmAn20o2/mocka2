"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  exportAsJson,
  exportAsPDF,
  exportAsPng,
  exportAsSVG,
} from "@/services/export-service";
import { useEditorStore } from "@/store";
import { isPremiumUser } from "@/lib/premium-utils";
import SubscriptionModal from "@/components/subscription/premium-modal";
import {
  Download,
  File,
  FileIcon,
  FileImage,
  FileJson,
  Loader2,
  Crown,
  Lock,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function ExportModal({ isOpen, onClose }) {
  const { canvas, userSubscription } = useEditorStore();

  const [selectedFormat, setSelectedFormat] = useState("png");
  const [isExporting, setIsExporting] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isUserPremium = isPremiumUser(userSubscription);

  const exportFormats = [
    {
      id: "png",
      name: "PNG Image",
      icon: FileImage,
      description: "Best for web and social media",
      isPremium: false,
    },
    {
      id: "svg",
      name: "SVG Vector",
      icon: FileIcon,
      description: "Scalable vector format",
      isPremium: true,
    },
    {
      id: "pdf",
      name: "PDF Document",
      icon: File,
      description: "Best for printing",
      isPremium: true,
    },
    {
      id: "json",
      name: "JSON Template",
      icon: FileJson,
      description: "Editable template format",
      isPremium: false,
    },
  ];

  const handleExport = async () => {
    if (!canvas) return;

    // Check if selected format requires premium
    const selectedExportFormat = exportFormats.find(
      (format) => format.id === selectedFormat
    );
    if (selectedExportFormat?.isPremium && !isUserPremium) {
      setShowUpgradeModal(true);
      return;
    }

    setIsExporting(true);

    try {
      let successFlag = false;

      switch (selectedFormat) {
        case "json":
          successFlag = exportAsJson(canvas, "JSON FileName");
          break;

        case "png":
          successFlag = exportAsPng(canvas, "PNG FileName");
          break;

        case "svg":
          successFlag = exportAsSVG(canvas, "SVG FileName");
          break;

        case "pdf":
          successFlag = exportAsPDF(canvas, "PDF FileName");
          break;

        default:
          break;
      }

      if (successFlag) {
        toast.success("Export Successful", {
          description: `Your design has been exported as ${selectedFormat.toUpperCase()}`,
        });
        setTimeout(() => {
          onClose();
        }, 500);
      }
    } catch (e) {
      toast.error("Export Failed", {
        description:
          "There was an error exporting your design. Please try again.",
      });
      console.error("Export failed:", e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFormatSelect = (formatId) => {
    const format = exportFormats.find((f) => f.id === formatId);
    if (format?.isPremium && !isUserPremium) {
      setShowUpgradeModal(true);
      return;
    }
    setSelectedFormat(formatId);
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={"sm:max-w-md"}>
          <DialogHeader>
            <DialogTitle className={"text-xl flex items-center gap-2"}>
              <Download className="h-5 w-5" />
              Export Design
              {isUserPremium && <Crown className="h-4 w-4 text-yellow-500" />}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <h3 className="text-xs font-medium mb-3">Choose Format</h3>
            <div className="grid grid-cols-2 gap-3">
              {exportFormats.map((exportFormat) => {
                const isLocked = exportFormat.isPremium && !isUserPremium;
                return (
                  <Card
                    key={exportFormat.id}
                    className={cn(
                      "cursor-pointer border transition-colors relative",
                      isLocked
                        ? "border-gray-200 bg-gray-50 opacity-75"
                        : "hover:bg-accent hover:text-accent-foreground",
                      selectedFormat === exportFormat.id && !isLocked
                        ? "border-primary bg-accent"
                        : "border-border"
                    )}
                    onClick={() => handleFormatSelect(exportFormat.id)}
                  >
                    <CardContent
                      className={"p-4 flex flex-col items-center text-center"}
                    >
                      {isLocked && (
                        <div className="absolute top-2 right-2">
                          <Lock className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                      <exportFormat.icon
                        className={cn(
                          "h-8 w-8 mb-2",
                          selectedFormat === exportFormat.id && !isLocked
                            ? "text-primary"
                            : isLocked
                            ? "text-gray-400"
                            : "text-muted-foreground"
                        )}
                      />
                      <h4
                        className={cn(
                          "font-medium text-sm",
                          isLocked && "text-gray-500"
                        )}
                      >
                        {exportFormat.name}
                        {exportFormat.isPremium && (
                          <Crown className="h-3 w-3 text-yellow-500 inline ml-1" />
                        )}
                      </h4>
                      <p
                        className={cn(
                          "mt-1 font-medium text-xs",
                          isLocked ? "text-gray-400" : "text-muted-foreground"
                        )}
                      >
                        {exportFormat.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {!isUserPremium && (
              <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">
                    Premium Features
                  </span>
                </div>
                <p className="text-xs text-purple-700">
                  Upgrade to premium to unlock SVG and PDF exports with high
                  resolution
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="min-w-[120px] bg-purple-700 text-white"
              variant="default"
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export {selectedFormat.toUpperCase()}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SubscriptionModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
}

export default ExportModal;
