"use client";

import { centerCanvas } from "@/fabric/fabric-utils";
import { saveCanvasState } from "@/services/design-service";
import { debounce } from "lodash";
import { create } from "zustand";

export const useEditorStore = create((set, get) => ({
  canvas: null,
  setCanvas: (canvas) => {
    set({ canvas });
    if (canvas) {
      centerCanvas(canvas);
    }
  },

  designId: null,
  setDesignId: (id) => set({ designId: id }),

  isEditing: true,
  setIsEditing: (flag) => set({ isEditing: flag }),

  name: "Untitled Design",
  setName: (value) => set({ name: value }),

  showProperties: false,
  setShowProperties: (flag) => set({ showProperties: flag }),

  saveStatus: "saved",
  setSaveStatus: (status) => set({ saveStatus: status }),
  lastModified: Date.now(),
  lastSaved: Date.now(),
  saveError: null,
  isModified: false,

  markAsModified: () => {
    const designId = get().designId;

    if (designId) {
      set({
        lastModified: Date.now(),
        saveStatus: "Saving...",
        isModified: true,
      });

      // Trigger auto-save
      get().debouncedSaveToServer();
    } else {
      console.warn("No design ID available - skipping auto-save");
      // Still mark as modified for UI feedback, but don't try to save
      set({
        lastModified: Date.now(),
        saveStatus: "Modified",
        isModified: true,
      });
    }
  },

  saveToServer: async () => {
    const designId = get().designId;
    const canvas = get().canvas;

    if (!canvas || !designId) {
      return null;
    }

    try {
      const savedDesign = await saveCanvasState(canvas, designId, get().name);

      set({
        saveStatus: "Saved",
        isModified: false,
        lastSaved: Date.now(),
        saveError: null,
      });

      return savedDesign;
    } catch (e) {
      console.error("Auto-save failed:", e);
      set({
        saveStatus: "Save Failed",
        saveError: e.message,
      });
      return null;
    }
  },

  // Enhanced auto-save with error handling
  debouncedSaveToServer: debounce(async () => {
    const state = get();
    const { canvas, designId, name } = state;

    if (!canvas || !designId) {
      console.warn("Cannot auto-save: missing canvas or design ID");
      return;
    }

    try {
      set({ saveStatus: "Saving..." });

      const savedDesign = await saveCanvasState(canvas, designId, name);

      set({
        saveStatus: "Saved",
        isModified: false,
        lastSaved: Date.now(),
        saveError: null,
      });

    } catch (error) {
      console.error("Auto-save failed:", error);
      set({
        saveStatus: "Save Failed",
        saveError: error.message,
      });

      // Don't throw error for auto-save failures
      // The user can manually save later
    }
  }, 3000), // Save after 3 seconds of inactivity (more professional)

  userSubscription: null,
  setUserSubscription: (data) => set({ userSubscription: data }),

  userDesigns: [],
  setUserDesigns: (data) => set({ userDesigns: data }),

  userDesignsLoading: false,
  setUserDesignsLoading: (flag) => set({ userDesignsLoading: flag }),

  showPremiumModal: false,
  setShowPremiumModal: (flag) => set({ showPremiumModal: flag }),

  showDesignsModal: false,
  setShowDesignsModal: (flag) => set({ showDesignsModal: flag }),

  showTemplatesModal: false,
  setShowTemplatesModal: (flag) => set({ showTemplatesModal: flag }),

  showCanzatModal: false,
  setShowCanzatModal: (flag) => set({ showCanzatModal: flag }),

  resetStore: () => {
    set({
      canvas: null,
      designId: null,
      isEditing: true,
      name: "Untitled Design",
      showProperties: false,
      saveStatus: "Saved",
      isModified: false,
      lastModified: Date.now(),
    });
  },
}));
