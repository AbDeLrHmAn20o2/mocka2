"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { useEditorStore } from "@/store";
import {
  ChevronDown,
  Download,
  Eye,
  Loader2,
  LogOut,
  Pencil,
  Save,
  SaveOff,
  Share,
  Star,
  Undo,
  Redo,
  Palette,
  ZoomIn,
  ZoomOut,
  Maximize,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import ExportModal from "../export";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { applyCanvasZoom, resetAndFitCanvas } from "@/fabric/fabric-utils";

function Header() {
  const {
    isEditing,
    setIsEditing,
    name,
    setName,
    canvas,
    saveStatus,
    markAsModified,
    designId,
    userDesigns,
    userSubscription,
    setShowPremiumModal,
  } = useEditorStore();
  const { data: session } = useSession();
  const [showExportModal, setShowExportModal] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Update undo/redo button states
  useEffect(() => {
    const updateButtonStates = () => {
      if (canvas && canvas.historyUndo && canvas.historyRedo) {
        const newCanUndo = canvas.historyUndo.length > 1;
        const newCanRedo = canvas.historyRedo.length > 0;

        console.log(
          "Updating button states - Undo length:",
          canvas.historyUndo.length,
          "Redo length:",
          canvas.historyRedo.length
        );
        console.log("Can Undo:", newCanUndo, "Can Redo:", newCanRedo);

        setCanUndo(newCanUndo);
        setCanRedo(newCanRedo);
      } else {
        setCanUndo(false);
        setCanRedo(false);
      }
    };

    // Initial update
    updateButtonStates();

    // Listen for history changes
    if (canvas) {
      canvas.on("history:changed", updateButtonStates);

      return () => {
        canvas.off("history:changed", updateButtonStates);
      };
    }
  }, [canvas]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isEditing || !canvas) return;

      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }

      // Redo: Ctrl+Y or Cmd+Y or Ctrl+Shift+Z or Cmd+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z")
      ) {
        e.preventDefault();
        handleRedo();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [canvas, isEditing, canUndo, canRedo]);

  const handleLogout = () => {
    signOut();
  };

  useEffect(() => {
    if (!canvas) return;
    canvas.selection = isEditing;
    canvas.getObjects().forEach((obj) => {
      obj.selectable = isEditing;
      obj.evented = isEditing;
    });
  }, [isEditing]);

  useEffect(() => {
    if (!canvas || !designId) return;
    markAsModified();
  }, [name, canvas, designId]);

  const handleUndo = () => {
    console.log(
      "Undo button clicked. Can undo:",
      canUndo,
      "History length:",
      canvas?.historyUndo?.length
    );
    if (canvas && canvas.undo && canUndo && !canvas.isPerformingHistory) {
      try {
        canvas.undo();
        markAsModified();
      } catch (error) {
        console.error("Undo operation failed:", error);
      }
    }
  };

  const handleRedo = () => {
    console.log(
      "Redo button clicked. Can redo:",
      canRedo,
      "Redo length:",
      canvas?.historyRedo?.length
    );
    if (canvas && canvas.redo && canRedo && !canvas.isPerformingHistory) {
      try {
        canvas.redo();
        markAsModified();
      } catch (error) {
        console.error("Redo operation failed:", error);
      }
    }
  };

  const handleZoomIn = () => {
    if (!canvas || !canvas.wrapperEl) return;
    
    const currentZoom = canvas.zoomLevel || 1;
    const newZoom = Math.min(currentZoom * 1.2, 3); // Max 300% zoom
    
    applyCanvasZoom(canvas, newZoom);
  };

  const handleZoomOut = () => {
    if (!canvas || !canvas.wrapperEl) return;
    
    const currentZoom = canvas.zoomLevel || 1;
    const newZoom = Math.max(currentZoom / 1.2, 0.1); // Min 10% zoom
    
    applyCanvasZoom(canvas, newZoom);
  };

  const handleZoomFit = () => {
    if (!canvas || !canvas.wrapperEl) return;
    
    const container = canvas.wrapperEl.parentElement;
    if (container) {
      resetAndFitCanvas(canvas, container);
    }
  };

  const handleExport = () => {
    const isPremium = userSubscription?.isPremium === true;

    if (!isPremium) {
      // Show premium upgrade modal for non-premium users
      toast.error("Premium Feature Required", {
        description:
          "Export functionality is available for Premium members only. Upgrade now to unlock all export formats!",
        duration: 4000,
      });

      // Show the premium modal to guide user to upgrade
      setShowPremiumModal(true);
      return;
    }

    // For premium users, proceed with export
    setShowExportModal(true);
  };

  return (
    <TooltipProvider>
      <header className="h-16 border-b border-slate-200/80 bg-white/90 backdrop-blur-md flex items-center px-6 shadow-sm">
        {/* Left Section - Brand and Controls */}
        <div className="flex items-center space-x-4 flex-1">
          {/* Modern Mocko Brand Logo with Tooltip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={"/"}
                className="flex items-center space-x-3 group cursor-pointer"
              >
                <div className="flex flex-col">
                  <h1 className="text-xl font-black bg-gradient-to-r from-slate-800 via-blue-600 to-indigo-600 bg-clip-text text-transparent leading-none tracking-tight">
                    Mocko
                  </h1>
                  <span className="text-xs font-medium text-slate-500 leading-none mt-0.5">
                    Design Studio
                  </span>
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300 border border-blue-400/20">
                  <Palette className="w-4 h-4 text-white" />
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="bg-slate-800 text-white border-slate-700"
            >
              <p>Go to Home</p>
            </TooltipContent>
          </Tooltip>

          {/* Mode Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild="true">
              <button className="flex items-center px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all duration-300 border border-slate-200">
                <span className="text-sm font-medium">
                  {isEditing ? "Editing" : "Viewing"}
                </span>
                <ChevronDown className="ml-2 h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="bg-white/95 backdrop-blur-md border-slate-200 shadow-xl rounded-2xl"
            >
              <DropdownMenuItem
                onClick={() => setIsEditing(true)}
                className="hover:bg-slate-50 rounded-xl mx-1 my-1"
              >
                <Pencil className="mr-3 h-4 w-4 text-slate-500" />
                <span className="font-medium">Editing</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsEditing(false)}
                className="hover:bg-slate-50 rounded-xl mx-1 my-1"
              >
                <Eye className="mr-3 h-4 w-4 text-slate-500" />
                <span className="font-medium">Viewing</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Save Button */}
            <button
              className="flex items-center justify-center w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-300 border border-slate-200"
              title={saveStatus !== "Saving..." ? "Save" : saveStatus}
              disabled={saveStatus === "Saving..."}
            >
              {saveStatus === "Saving..." ? (
                <Loader2 className="h-5 w-5 animate-spin text-slate-600" />
              ) : (
                <Save
                  className={cn(
                    "h-5 w-5 text-slate-600",
                    saveStatus === "Saved" && "text-green-600"
                  )}
                />
              )}
            </button>

            {/* Undo/Redo buttons */}
            {isEditing && (
              <>
                <button
                  onClick={handleUndo}
                  className="flex items-center justify-center w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-300 border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  title="Undo (Ctrl/Cmd + Z)"
                  disabled={!canUndo}
                >
                  <Undo className="w-5 h-5 text-slate-600" />
                </button>
                <button
                  onClick={handleRedo}
                  className="flex items-center justify-center w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all duration-300 border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  title="Redo (Ctrl/Cmd + Y)"
                  disabled={!canRedo}
                >
                  <Redo className="w-5 h-5 text-slate-600" />
                </button>
                
                {/* Zoom controls */}
                <div className="flex items-center space-x-1 px-2 py-1 bg-slate-50 rounded-xl border border-slate-200">
                  <button
                    onClick={handleZoomOut}
                    className="flex items-center justify-center w-8 h-8 hover:bg-slate-200 rounded-lg transition-all duration-200 cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4 text-slate-600" />
                  </button>
                  <button
                    onClick={handleZoomFit}
                    className="flex items-center justify-center w-8 h-8 hover:bg-slate-200 rounded-lg transition-all duration-200 cursor-pointer"
                    title="Fit to Screen"
                  >
                    <Maximize className="w-4 h-4 text-slate-600" />
                  </button>
                  <button
                    onClick={handleZoomIn}
                    className="flex items-center justify-center w-8 h-8 hover:bg-slate-200 rounded-lg transition-all duration-200 cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </>
            )}

            {/* Export Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleExport}
                  className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl relative cursor-pointer ${
                    userSubscription?.isPremium
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                      : "bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-yellow-900"
                  }`}
                  title={
                    userSubscription?.isPremium
                      ? "Export Design"
                      : "Export (Premium Feature)"
                  }
                >
                  <Download className="w-5 h-5" />
                  {!userSubscription?.isPremium && (
                    <Star className="w-3 h-3 absolute -top-1 -right-1 text-yellow-900" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="bg-slate-800 text-white border-slate-700"
              >
                <p>
                  {userSubscription?.isPremium
                    ? "Export your design in multiple formats"
                    : "Premium feature - Upgrade to export designs"}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Center Section - Design Name */}
        <div className="flex justify-center flex-1">
          <Input
            className="w-full max-w-md text-center font-medium bg-slate-50/80 border-slate-200/60 rounded-2xl focus-visible:ring-blue-500 transition-all duration-300"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Design name..."
          />
        </div>

        {/* Right Section - Premium and User */}
        <div className="flex items-center space-x-4 flex-1 justify-end">
          {/* Premium Button */}
          <button
            onClick={() => setShowPremiumModal(true)}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-yellow-900 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Star className="mr-2 h-4 w-4" />
            <span className="text-sm">
              {!userSubscription?.isPremium
                ? "Upgrade To Premium"
                : "Premium Member"}
            </span>
          </button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger aschild="true">
              <div className="flex items-center space-x-3 p-2 rounded-2xl hover:bg-slate-50 transition-all duration-300 cursor-pointer">
                <Avatar className="ring-2 ring-slate-200 hover:ring-blue-300 transition-all duration-300">
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold">
                    {session?.user?.name?.[0] || "U"}
                  </AvatarFallback>
                  <AvatarImage
                    src={session?.user?.image || "/placeholder-user.jpg"}
                  />
                </Avatar>
                <span className="text-sm font-bold text-slate-700 hidden lg:block">
                  {session?.user?.name || "User"}
                </span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-white/95 backdrop-blur-md border-slate-200 shadow-xl rounded-2xl"
            >
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer hover:bg-slate-50 rounded-xl mx-1 my-1"
              >
                <LogOut className="mr-3 w-4 h-4 text-slate-500" />
                <span className="font-bold text-slate-700">Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <ExportModal isOpen={showExportModal} onClose={setShowExportModal} />
      </header>
    </TooltipProvider>
  );
}

export default Header;
