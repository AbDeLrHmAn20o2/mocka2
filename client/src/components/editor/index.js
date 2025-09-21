"use client";

import { useParams, useRouter } from "next/navigation";
import Canvas from "./canvas";
import Header from "./header";
import Sidebar from "./sidebar";
import { useCallback, useEffect, useState } from "react";
import { useEditorStore } from "@/store";
import { getUserDesignByID } from "@/services/design-service";
import { centerCanvas, cleanupEraserStrokes, resizeCanvas, resizeCanvasWithContainerAwareness, applyUndoRedoRestorationSequence, deletedSelectedObject, cloneSelectedObject, centerCanvasAfterLoad, forceCenterCanvas, ensureCanvasVisible, applyCanvasZoom } from "@/fabric/fabric-utils";
import Properties from "./properties";
import SubscriptionModal from "../subscription/premium-modal";

function MainEditor() {
  const params = useParams();
  const router = useRouter();
  const designId = params?.slug;

  const [isLoading, setIsLoading] = useState(!!designId);
  const [loadAttempted, setLoadAttempted] = useState(false);
  const [error, setError] = useState(null);
  const [pendingResize, setPendingResize] = useState(null); // Track pending resize operations

  // Helper function to manage loading overlay
  const showLoadingOverlay = () => {
    const loadingOverlay = document.getElementById('canvas-loading-overlay');
    if (loadingOverlay) {
      console.log('Showing loading overlay');
      loadingOverlay.style.display = 'flex';
    }
  };

  const hideLoadingOverlay = () => {
    const loadingOverlay = document.getElementById('canvas-loading-overlay');
    if (loadingOverlay) {
      console.log('Hiding loading overlay');
      loadingOverlay.style.display = 'none';
    }
  };

  // Helper function to show canvas
  const showCanvas = () => {
    if (!canvas || !canvas.wrapperEl) return;
    
    console.log('Showing canvas');
    const wrapper = canvas.wrapperEl;
    if (wrapper) {
      wrapper.style.display = 'block';
      wrapper.style.transition = 'opacity 0.3s ease-in-out';
      wrapper.style.visibility = 'visible';
      wrapper.style.opacity = '1';
    }
  };

  // Helper function to hide canvas
  const hideCanvas = () => {
    if (!canvas || !canvas.wrapperEl) return;
    
    console.log('Hiding canvas');
    const wrapper = canvas.wrapperEl;
    if (wrapper) {
      wrapper.style.visibility = 'hidden';
      wrapper.style.opacity = '0';
      wrapper.style.display = 'none';
    }
  };

  const {
    canvas,
    setDesignId,
    resetStore,
    setName,
    setShowProperties,
    showProperties,
    isEditing,
    setShowPremiumModal,
    showPremiumModal,
    markAsModified,
  } = useEditorStore();

  useEffect(() => {
    //reset the store
    resetStore();

    //set the design id

    if (designId) setDesignId(designId);

    return () => {
      resetStore();
    };
  }, []);

  useEffect(() => {
    setLoadAttempted(false);
    setError(null);
  }, [designId]);

  useEffect(() => {
    if (isLoading && !canvas && designId) {
      const timer = setTimeout(() => {
        if (isLoading) {
          console.log("Canvas init timeout");
          setIsLoading(false);
        }
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isLoading, canvas, designId]);

  useEffect(() => {
    if (canvas) {
      console.log("Canvas is now available in editor");
      
      // Handle any pending resize operations
      if (pendingResize) {
        console.log("Applying pending resize:", pendingResize);
        setTimeout(() => {
          resizeCanvas(canvas, pendingResize.width, pendingResize.height);
          setPendingResize(null);
        }, 300);
      }
    }
  }, [canvas, pendingResize]);

  //load the design ->
  const loadDesign = useCallback(async () => {
    if (!canvas || !designId || loadAttempted) {
      console.log("Load design skipped:", { 
        hasCanvas: !!canvas, 
        hasDesignId: !!designId, 
        loadAttempted 
      });
      return;
    }
    
    try {
      setIsLoading(true);
      setLoadAttempted(true);

      const response = await getUserDesignByID(designId);
      const design = response.data;

      if (design) {
        //update name
        setName(design.name);

        //set the design ID just incase after getting the data
        setDesignId(designId);

        // IMMEDIATELY hide canvas and show loading at the start
        hideCanvas();
        showLoadingOverlay();

        try {
          if (design.canvasData && canvas && typeof canvas.clear === 'function' && canvas.getElement) {
            // Additional safety checks for canvas element and context
            const canvasElement = canvas.getElement();
            const context = canvasElement ? canvasElement.getContext('2d') : null;
            
            if (!canvasElement || !context) {
              console.error("Canvas element or context not available");
              setError("Canvas not properly initialized");
              setIsLoading(false);
              return;
            }
            
            console.log("Canvas safety checks passed, clearing canvas");
            canvas.clear();
            
            // Load the JSON data first, then apply dimensions
            const canvasData =
              typeof design.canvasData === "string"
                ? JSON.parse(design.canvasData)
                : design.canvasData;

            const hasObjects = canvasData.objects && canvasData.objects.length > 0;

            if (canvasData.background) {
              canvas.backgroundColor = canvasData.background;
            } else {
              canvas.backgroundColor = "#ffffff";
            }

            if (!hasObjects) {
              // No objects, just set background and dimensions
              if (design.width && design.height) {
                console.log(`Setting canvas dimensions for empty design: ${design.width}x${design.height}`);
                setTimeout(() => {
                  // Simple resize followed by undo/redo restoration sequence
                  resizeCanvas(canvas, design.width, design.height);
                  
                  setTimeout(() => {
                    // Apply the exact same sequence that makes undo/redo work
                    applyUndoRedoRestorationSequence(canvas);
                    
                    // Show canvas when everything is complete and hide loading
                    setTimeout(() => {
                      console.log("About to show empty design canvas");
                      hideLoadingOverlay();
                      showCanvas();
                      console.log('Empty design setup completed and canvas shown');
                    }, 100);
                  }, 150);
                }, 200);
              } else {
                // Show canvas immediately for designs without dimensions
                setTimeout(() => {
                  const wrapper = canvas.wrapperEl;
                  if (wrapper) {
                    wrapper.style.visibility = 'visible';
                    wrapper.style.opacity = '1';
                  }
                }, 100);
              }
              canvas.renderAll();
              return true;
            }

            // Load objects and then apply dimensions
            canvas
              .loadFromJSON(design.canvasData)
              .then((canvas) => {
                console.log("Canvas JSON loaded successfully");
                
                // Clean up any eraser strokes to make them non-selectable
                cleanupEraserStrokes(canvas);
                
                // Apply canvas dimensions after loading with a delay to ensure everything is rendered
                let targetWidth = design.width;
                let targetHeight = design.height;
                
                // If design dimensions aren't available, try to get from canvas data
                if (!targetWidth || !targetHeight) {
                  if (canvasData.width && canvasData.height) {
                    targetWidth = canvasData.width;
                    targetHeight = canvasData.height;
                    console.log(`Using canvas data dimensions: ${targetWidth}x${targetHeight}`);
                  }
                }
                
                // Apply the dimensions using simple resize + undo/redo restoration
                if (targetWidth && targetHeight) {
                  setTimeout(() => {
                    console.log(`Simple resize attempt: ${targetWidth}x${targetHeight}`);
                    resizeCanvas(canvas, targetWidth, targetHeight);
                    
                    setTimeout(() => {
                      // Apply the exact same sequence that makes undo/redo work
                      applyUndoRedoRestorationSequence(canvas);
                      
                      // Show canvas only when everything is complete and hide loading
                      setTimeout(() => {
                        console.log("About to show canvas after loaded design");
                        hideLoadingOverlay();
                        showCanvas();
                        console.log("Canvas state properly restored and shown after design load");
                      }, 100);
                    }, 150);
                  }, 200);
                } else {
                  // For designs without specific dimensions, still ensure proper state
                  // Hide canvas during setup
                  hideCanvas();
                  
                  setTimeout(() => {
                    // Reset zoom using CSS transform for consistency
                    applyCanvasZoom(canvas, 1);
                    canvas.discardActiveObject();
                    canvas.calcOffset();
                    
                    // Ensure canvas visibility
                    try {
                      const lower = canvas.lowerCanvasEl;
                      const upper = canvas.upperCanvasEl;
                      const wrapper = canvas.wrapperEl;
                      const container = canvas.wrapperEl?.parentElement;

                      [lower, upper, wrapper, container].forEach((el) => {
                        if (el) {
                          el.style.opacity = "1";
                          el.style.visibility = "visible";
                          el.style.display = "block";
                        }
                      });
                    } catch (err) {
                      console.error("Error ensuring canvas visibility:", err);
                    }
                    
                    import('@/fabric/fabric-utils').then(({ centerCanvasAfterLoad, forceCenterCanvas }) => {
                      centerCanvasAfterLoad(canvas);
                      
                      // Show canvas now that everything is ready
                      setTimeout(() => {
                        hideLoadingOverlay();
                        showCanvas();
                        
                        // Backup force center for designs without dimensions
                        setTimeout(() => {
                          forceCenterCanvas(canvas);
                        }, 500);
                      }, 50);
                    });
                    canvas.requestRenderAll();
                  }, 200);
                }
              })
              .catch((err) => {
                console.error("Error loading canvas JSON:", err);
                setError("Failed to load design data");
                
                // Hide loading overlay on error
                hideLoadingOverlay();
                showCanvas();
              });
          } else if (canvas && typeof canvas.clear === 'function' && canvas.getElement) {
            console.log("no canvas data");
            
            // Additional safety checks before clearing
            try {
              const canvasElement = canvas.getElement();
              const context = canvasElement ? canvasElement.getContext('2d') : null;
              
              if (canvasElement && context) {
                canvas.clear();
                const width = design.width || 800;
                const height = design.height || 600;
                console.log(`Setting canvas dimensions to ${width}x${height} (no canvas data)`);
                
                // Set dimensions and background first
                canvas.setWidth(width);
                canvas.setHeight(height);
                canvas.backgroundColor = "#ffffff";
                canvas.renderAll();
                
                // Then apply simple resize + undo/redo restoration
                setTimeout(() => {
                  console.log("Simple resizeCanvas attempt for empty design");
                  resizeCanvas(canvas, width, height);
                  
                  setTimeout(() => {
                    // Apply the exact same sequence that makes undo/redo work
                    applyUndoRedoRestorationSequence(canvas);
                    
                    // Hide loading and show canvas for empty design
                    setTimeout(() => {
                      hideLoadingOverlay();
                      showCanvas();
                    }, 100);
                  }, 150);
                }, 100);
              } else {
                console.warn("Canvas element or context not available");
                setError("Canvas not properly initialized");
                hideLoadingOverlay();
                showCanvas();
              }
            } catch (err) {
              console.error("Error accessing canvas element:", err);
              setError("Failed to initialize canvas");
              hideLoadingOverlay();
              showCanvas();
            }
          } else {
            console.warn("Canvas not ready or invalid canvas object", { 
              hasCanvas: !!canvas,
              hasCanvasClear: canvas && typeof canvas.clear === 'function',
              hasCanvasElement: canvas && typeof canvas.getElement === 'function'
            });
            hideLoadingOverlay();
            showCanvas();
          }
        } catch (e) {
          console.error(("Error loading canvas", e));
          setError("Error loading canvas");
        } finally {
          setIsLoading(false);
          
          // Ensure loading overlay is hidden in all cases
          setTimeout(() => {
            hideLoadingOverlay();
          }, 50);
          
          // Final verification and resize after a longer delay
          if (design.width && design.height) {
            setTimeout(() => {
              if (canvas && canvas.getElement()) {
                const currentWidth = canvas.getWidth();
                const currentHeight = canvas.getHeight();
                console.log(`Current canvas size: ${currentWidth}x${currentHeight}, target: ${design.width}x${design.height}`);
                
                if (currentWidth !== design.width || currentHeight !== design.height) {
                  console.log("Canvas size mismatch detected, applying final resize");
                  resizeCanvas(canvas, design.width, design.height);
                }
              }
            }, 1000);
          }
        }
      } else {
        console.error("Design not found");
        setError("Design not found");
        hideLoadingOverlay();
        showCanvas();
      }

      console.log(response);
    } catch (e) {
      console.error("Failed to load design", e);
      setError("failed to load design");
      setIsLoading(false);
      hideLoadingOverlay();
      showCanvas();
    }
  }, [canvas, designId, loadAttempted, setDesignId]);

  useEffect(() => {
    if (designId && canvas && !loadAttempted) {
      console.log("Canvas and design ID available, loading design...");
      
      // Wait for canvas to be fully initialized and stable
      const validateCanvas = () => {
        return canvas && 
               canvas.getElement && 
               canvas.getElement() && 
               canvas.getElement().getContext &&
               canvas.getElement().getContext('2d') &&
               canvas.freeDrawingBrush; // Additional check for brush initialization
      };
      
      const attemptLoad = (attempt = 1, maxAttempts = 5) => {
        if (validateCanvas()) {
          console.log(`Canvas fully validated on attempt ${attempt}, loading design`);
          loadDesign();
        } else if (attempt < maxAttempts) {
          console.log(`Canvas not ready on attempt ${attempt}, retrying in ${attempt * 200}ms`);
          setTimeout(() => attemptLoad(attempt + 1, maxAttempts), attempt * 200);
        } else {
          console.error("Canvas failed to initialize properly after multiple attempts");
          setError("Canvas initialization failed - please refresh the page");
          setIsLoading(false);
        }
      };
      
      // Start validation attempts
      attemptLoad();
    } else if (!designId) {
      router.replace("/");
    }
  }, [canvas, designId, loadDesign, loadAttempted, router]);

  useEffect(() => {
    if (!canvas) return;

    const handleSelectionCreated = () => {
      const activeObject = canvas.getActiveObject();

      console.log(activeObject, "activeObject");

      if (activeObject) {
        setShowProperties(true);
      }
    };

    const handleSelectionCleared = () => {
      setShowProperties(false);
    };

    // Keyboard shortcuts for canvas resizing and object operations
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if user is typing in an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
        return;
      }

      // Delete key - delete selected objects
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        const activeObject = canvas?.getActiveObject();
        console.log("Delete key pressed");
        console.log("Canvas exists:", !!canvas);
        console.log("Active object exists:", !!activeObject);
        console.log("Active object type:", activeObject?.type);
        
        if (canvas && activeObject) {
          console.log("Calling deletedSelectedObject");
          deletedSelectedObject(canvas);
          markAsModified();
        } else {
          console.log("No canvas or active object - delete cancelled");
        }
        return;
      }

      // Ctrl/Cmd + D - duplicate selected objects
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        const activeObject = canvas?.getActiveObject();
        console.log("Ctrl+D pressed");
        console.log("Canvas exists:", !!canvas);
        console.log("Active object exists:", !!activeObject);
        console.log("Active object type:", activeObject?.type);
        
        if (canvas && activeObject) {
          console.log("Calling cloneSelectedObject");
          cloneSelectedObject(canvas);
          markAsModified();
        } else {
          console.log("No canvas or active object - duplicate cancelled");
        }
        return;
      }

      // Ctrl/Cmd + Plus/Minus for canvas resizing
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          // Increase canvas size by 10%
          const newWidth = Math.round(canvas.width * 1.1);
          const newHeight = Math.round(canvas.height * 1.1);
          if (newWidth <= 5000 && newHeight <= 5000) {
            canvas.setDimensions({ width: newWidth, height: newHeight });
            canvas.setWidth(newWidth);
            canvas.setHeight(newHeight);
            centerCanvas(canvas);
            canvas.renderAll();
            markAsModified();
          }
        } else if (e.key === '-') {
          e.preventDefault();
          // Decrease canvas size by 10%
          const newWidth = Math.round(canvas.width * 0.9);
          const newHeight = Math.round(canvas.height * 0.9);
          if (newWidth >= 100 && newHeight >= 100) {
            canvas.setDimensions({ width: newWidth, height: newHeight });
            canvas.setWidth(newWidth);
            canvas.setHeight(newHeight);
            centerCanvas(canvas);
            canvas.renderAll();
            markAsModified();
          }
        }
      }
    };

    // Set up event listeners
    const setupEventListeners = () => {
      canvas.on("selection:created", handleSelectionCreated);
      canvas.on("selection:updated", handleSelectionCreated);
      canvas.on("selection:cleared", handleSelectionCleared);
    };

    // Initial setup
    setupEventListeners();
    
    // Add keyboard listener
    document.addEventListener('keydown', handleKeyDown);

    // Re-setup listeners periodically to handle cases where they might be removed
    const interval = setInterval(() => {
      // Check if handlers are still attached by testing if they exist
      const events = canvas.__eventListeners;
      if (!events || !events["selection:created"] || events["selection:created"].length === 0) {
        console.log("Re-attaching selection event handlers");
        setupEventListeners();
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      document.removeEventListener('keydown', handleKeyDown);
      canvas.off("selection:created", handleSelectionCreated);
      canvas.off("selection:updated", handleSelectionCreated);
      canvas.off("selection:cleared", handleSelectionCleared);
    };
  }, [canvas, setShowProperties, markAsModified]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {isEditing && <Sidebar />}

        <div className="flex-1 flex flex-col overflow-hidden relative">
          <main 
            className="flex-1 overflow-hidden bg-[#f0f0f0] flex items-center justify-center"
            onClick={(e) => {
              // Clear selection when clicking on the main editor background (outside canvas)
              if (canvas && (e.target.classList.contains('bg-[#f0f0f0]') || 
                           e.target.tagName === 'MAIN')) {
                canvas.discardActiveObject();
                canvas.renderAll();
              }
            }}
          >
            <Canvas />
          </main>
        </div>
      </div>
      {showProperties && isEditing && <Properties />}
      <SubscriptionModal
        isOpen={showPremiumModal}
        onClose={setShowPremiumModal}
      />
    </div>
  );
}

export default MainEditor;
