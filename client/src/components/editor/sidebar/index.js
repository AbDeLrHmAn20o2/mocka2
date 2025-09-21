"use client";

import {
  ArrowLeft,
  ChevronLeft,
  Shapes,
  Type,
  Image,
  Download,
  Layers,
  Paintbrush,
  MousePointer,
  Hand,
  Crop,
} from "lucide-react";
import { useState, useEffect } from "react";
import ElementsPanel from "./panels/elements";
import TextPanel from "./panels/text";
import UploadPanel from "./panels/upload";
import DrawingPanel from "./panels/draw";
import SettingsPanel from "./panels/settings";
import ImportDesignPanel from "./panels/import";
import CanvasSettings from "./panels/canvas-settings";
import { useEditorStore } from "@/store";

function Sidebar() {
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [activeSidebar, setActiveSidebar] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  const sidebarItems = [
    {
      id: "elements",
      icon: Shapes,
      label: "Shapes",
      panel: () => <ElementsPanel isActive={activeSidebar === "elements"} />,
    },
    {
      id: "text",
      icon: Type,
      label: "Text",
      panel: () => <TextPanel isActive={activeSidebar === "text"} />,
    },
    {
      id: "uploads",
      icon: Image,
      label: "Images",
      panel: () => <UploadPanel isActive={activeSidebar === "uploads"} />,
    },
    {
      id: "draw",
      icon: Paintbrush,
      label: "Draw",
      panel: () => <DrawingPanel isActive={activeSidebar === "draw"} />,
    },
    {
      id: "import",
      icon: Download,
      label: "Import",
      panel: () => <ImportDesignPanel isActive={activeSidebar === "import"} />,
    },
    {
      id: "canvas",
      icon: Crop,
      label: "Resize",
      panel: () => <CanvasSettings isActive={activeSidebar === "canvas"} />,
    },
  ];

  const handleItemClick = (id) => {
    // If clicking on the same item that's already active and not collapsed, close it
    if (id === activeSidebar && !isPanelCollapsed && !isOpening) {
      setIsClosing(true);
      // Start closing animation
      setTimeout(() => {
        setActiveSidebar(null);
        setIsClosing(false);
      }, 300); // Match animation duration
      return;
    }

    // If switching to a different panel, reset draw panel state
    if (activeSidebar === "draw" && id !== "draw") {
      // Dispatch a custom event to reset draw panel
      window.dispatchEvent(new CustomEvent("resetDrawPanel"));
    }

    // If opening a new panel or the same panel when it's closed
    setIsOpening(true);
    setIsClosing(false);
    setActiveSidebar(id);
    setIsPanelCollapsed(false);

    // Reset opening state after animation
    setTimeout(() => {
      setIsOpening(false);
    }, 300);
  };

  const closeSecondaryPanel = () => {
    setIsClosing(true);
    setTimeout(() => {
      setActiveSidebar(null);
      setIsClosing(false);
    }, 300);
  };

  const togglePanelCollapse = (e) => {
    e.stopPropagation();
    setIsPanelCollapsed(!isPanelCollapsed);
  };

  const activeItem = sidebarItems.find((item) => item.id === activeSidebar);

  return (
    <div className="flex h-full">
      <aside className="sidebar">
        {sidebarItems.map((item) => (
          <div
            onClick={() => handleItemClick(item.id)}
            key={item.id}
            className={`sidebar-item ${
              activeSidebar === item.id ? "active" : ""
            }`}
          >
            <item.icon className="sidebar-item-icon h-5 w-5" />
            <span className="sidebar-item-label">{item.label}</span>
          </div>
        ))}
      </aside>
      {(activeSidebar || isClosing) && (
        <div
          className={`secondary-panel ${isPanelCollapsed ? "collapsed" : ""} ${
            isClosing ? "closing" : ""
          } ${isOpening ? "opening" : ""}`}
          style={{
            overflow: "hidden",
            // Only apply manual styles when not animating
            ...(isOpening || isClosing
              ? {}
              : {
                  width: isPanelCollapsed ? "0" : "320px",
                  opacity: isPanelCollapsed ? 0 : 1,
                  transform: isPanelCollapsed
                    ? "translateX(-100%)"
                    : "translateX(0)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }),
          }}
        >
          <div className="panel-header">
            <button className="back-button" onClick={closeSecondaryPanel}>
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="panel-title">{activeItem?.label}</span>
          </div>
          <div className="panel-content">{activeItem?.panel()}</div>
          <button className="collapse-button" onClick={togglePanelCollapse}>
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
