import { shapeDefinitions } from "./shapes/shape-definitions";
import { createShape } from "./shapes/shape-factory";

/**
 * Wait for container to be properly rendered and measured
 */
const waitForContainerReady = (containerEl) => {
  return new Promise((resolve) => {
    const checkContainer = () => {
      if (!containerEl) {
        console.log('Container element not found, using fallback dimensions');
        resolve({ width: 800, height: 600 }); // fallback
        return;
      }

      const rect = containerEl.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(containerEl);
      
      console.log('Checking container readiness:', {
        rect: { width: rect.width, height: rect.height },
        client: { width: containerEl.clientWidth, height: containerEl.clientHeight },
        visibility: computedStyle.visibility,
        display: computedStyle.display
      });
      
      // Check if container has proper dimensions and is visible
      if (rect.width > 0 && rect.height > 0 && 
          computedStyle.visibility !== 'hidden' && 
          computedStyle.display !== 'none') {
        console.log('Container is ready:', {
          width: containerEl.clientWidth,
          height: containerEl.clientHeight
        });
        resolve({
          width: containerEl.clientWidth,
          height: containerEl.clientHeight,
          rect: rect
        });
      } else {
        // Container not ready, check again after a short delay
        console.log('Container not ready, checking again in 50ms');
        setTimeout(checkContainer, 50);
      }
    };

    // Initial check after a small delay to allow for DOM rendering
    setTimeout(checkContainer, 100);
  });
};

export const initializeFabric = async (canvasEl, containerEl) => {
  try {
    const { Canvas, PencilBrush } = await import("fabric");

    // Wait for container to be properly measured before canvas initialization
    console.log('Waiting for container to be ready...');
    const containerInfo = await waitForContainerReady(containerEl);
    console.log('Container ready with dimensions:', containerInfo);

    // Additional wait to ensure DOM is fully stable
    await new Promise(resolve => setTimeout(resolve, 200));

    const canvas = new Canvas(canvasEl, {
      preserveObjectStacking: true,
      isDrawingMode: false,
      renderOnAddRemove: true,
      // Enable multi-selection with better visual feedback
      selection: true,
      selectionBorderColor: "rgba(100, 150, 255, 0.9)",
      selectionLineWidth: 2,
      selectionColor: "rgba(100, 150, 255, 0.2)",
      selectionDashArray: [5, 5],
      // Enable individual object selection within groups
      subTargetCheck: true,
      // Allow selection to start from any point
      allowTouchScrolling: false,
      // Set a reasonable default size that can be adjusted
      width: 800,
      height: 600,
      // Enable high-DPI support for crisp rendering
      enableRetinaScaling: true,
    });

    // Configure canvas for high-quality rendering on all devices
    const devicePixelRatio = window.devicePixelRatio || 1;
    const context = canvas.getContext();
    
    // Always enable high-quality rendering
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    
    // For high-DPI displays, ensure crisp rendering
    if (devicePixelRatio > 1) {
      // Set canvas to render at device resolution
      const canvasEl = canvas.getElement();
      canvasEl.style.imageRendering = 'auto';
      canvasEl.style.imageRendering = '-webkit-optimize-contrast';
      canvasEl.style.imageRendering = 'crisp-edges';
      canvasEl.style.imageRendering = 'pixelated';
      canvasEl.style.imageRendering = 'auto'; // Reset to auto for best quality
    }

    //drawing init
    const brush = new PencilBrush(canvas);
    brush.color = "#000000";
    brush.width = 5;
    canvas.freeDrawingBrush = brush;

    // Initialize zoom level using Fabric.js for crisp rendering
    canvas.setZoom(1);
    canvas.zoomLevel = 1;
    
    setTimeout(() => {
      centerCanvas(canvas, false);
      
      // Enable mouse interactions after centering
      setTimeout(() => {
        const cleanup = enableCanvasMouseInteractions(canvas);
        // Store cleanup function on canvas for later removal
        canvas.mouseInteractionsCleanup = cleanup;
      }, 100);
    }, 100);

    return canvas;
  } catch (e) {
    console.error("Failed to load fabric", e);
    return null;
  }
};

export const centerCanvas = (canvas, preserveZoom = false) => {
  if (!canvas || !canvas.wrapperEl) return;

  const canvasWrapper = canvas.wrapperEl;
  const container = canvasWrapper.parentElement;

  // Ensure wrapper has proper dimensions
  canvasWrapper.style.width = `${canvas.width}px`;
  canvasWrapper.style.height = `${canvas.height}px`;

  if (container) {
    // Calculate viewport dimensions and canvas dimensions
    const viewportWidth = container.clientWidth;
    const viewportHeight = container.clientHeight;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Get current zoom level
    const zoomLevel = (preserveZoom && canvas.zoomLevel) ? canvas.zoomLevel : 1;
    
    // Calculate scaled dimensions for container layout
    const scaledCanvasWidth = canvasWidth * zoomLevel;
    const scaledCanvasHeight = canvasHeight * zoomLevel;
    
    // Calculate container content dimensions with generous padding
    const paddingWidth = Math.max(400, viewportWidth * 0.5);
    const paddingHeight = Math.max(300, viewportHeight * 0.5);
    
    const contentWidth = scaledCanvasWidth + paddingWidth;
    const contentHeight = scaledCanvasHeight + paddingHeight;
    
    // Ensure container can scroll to accommodate canvas with padding
    container.style.position = 'relative';
    container.style.overflow = 'auto';
    
    // Create or update phantom container for proper scroll dimensions
    let phantomContainer = container.querySelector('.canvas-phantom-container');
    if (!phantomContainer) {
      phantomContainer = document.createElement('div');
      phantomContainer.className = 'canvas-phantom-container';
      phantomContainer.style.position = 'absolute';
      phantomContainer.style.top = '0';
      phantomContainer.style.left = '0';
      phantomContainer.style.pointerEvents = 'none';
      phantomContainer.style.visibility = 'hidden';
      container.appendChild(phantomContainer);
    }
    
    // Set phantom container size to match scaled content
    phantomContainer.style.width = `${contentWidth}px`;
    phantomContainer.style.height = `${contentHeight}px`;
    
    // Set wrapper positioning to center within the scrollable content
    canvasWrapper.style.position = 'absolute';
    canvasWrapper.style.left = `${paddingWidth / 2}px`;
    canvasWrapper.style.top = `${paddingHeight / 2}px`;
    
    // Apply zoom transform if present
    canvasWrapper.style.transform = zoomLevel !== 1 ? `scale(${zoomLevel})` : 'none';
    
    if (zoomLevel !== 1) {
      canvasWrapper.style.transformOrigin = 'center center';
      // Anti-aliasing for zoom
      canvasWrapper.style.imageRendering = 'crisp-edges';
      canvasWrapper.style.backfaceVisibility = 'hidden';
    }
    
    // Create or update a content spacer to define the scrollable area
    let spacer = container.querySelector('.canvas-spacer');
    if (!spacer) {
      spacer = document.createElement('div');
      spacer.className = 'canvas-spacer';
      spacer.style.position = 'absolute';
      spacer.style.pointerEvents = 'none';
      spacer.style.zIndex = '-1';
      container.appendChild(spacer);
    }
    
    spacer.style.width = `${contentWidth}px`;
    spacer.style.height = `${contentHeight}px`;
    spacer.style.left = '0px';
    spacer.style.top = '0px';
    
    // Center the scroll position immediately for better UX
    const targetScrollLeft = Math.max(0, (contentWidth - viewportWidth) / 2);
    const targetScrollTop = Math.max(0, (contentHeight - viewportHeight) / 2);
    
    // Apply centering immediately without setTimeout for smoother experience
    container.scrollLeft = targetScrollLeft;
    container.scrollTop = targetScrollTop;
    
    // Force a second centering after a small delay to ensure precision
    setTimeout(() => {
      container.scrollLeft = targetScrollLeft;
      container.scrollTop = targetScrollTop;
    }, 25);
    
    if (!preserveZoom) {
      canvas.zoomLevel = 1;
    }
  }
};

/**
 * Center canvas specifically after design loading
 */
export const centerCanvasAfterLoad = (canvas) => {
  if (!canvas || !canvas.wrapperEl) return;

  // Wait for DOM to settle before centering
  setTimeout(() => {
    centerCanvas(canvas, false);
    
    // Additional delay for smooth scroll behavior
    setTimeout(() => {
      const container = canvas.wrapperEl.parentElement;
      if (container) {
        // Ensure scroll position is properly centered with smooth behavior
        const viewportWidth = container.clientWidth;
        const viewportHeight = container.clientHeight;
        const scrollWidth = container.scrollWidth;
        const scrollHeight = container.scrollHeight;
        
        const targetScrollLeft = Math.max(0, (scrollWidth - viewportWidth) / 2);
        const targetScrollTop = Math.max(0, (scrollHeight - viewportHeight) / 2);
        
        container.scrollTo({
          left: targetScrollLeft,
          top: targetScrollTop,
          behavior: 'smooth'
        });
      }
    }, 100);
  }, 200); // Increased delay to ensure everything is properly initialized
};

/**
 * Force center canvas immediately (useful for debugging or manual centering)
 */
export const forceCenterCanvas = (canvas) => {
  if (!canvas || !canvas.wrapperEl) {
    console.warn('Cannot center canvas: canvas or wrapper element not available');
    return;
  }

  const container = canvas.wrapperEl.parentElement;
  if (!container) {
    console.warn('Cannot center canvas: container element not found');
    return;
  }

  console.log(`Forcing canvas center for ${canvas.width}x${canvas.height} canvas`);
  
  // Apply centering immediately without delays
  centerCanvas(canvas, false);
  
  // Force scroll to center immediately
  const viewportWidth = container.clientWidth;
  const viewportHeight = container.clientHeight;
  const scrollWidth = container.scrollWidth;
  const scrollHeight = container.scrollHeight;
  
  const targetScrollLeft = Math.max(0, (scrollWidth - viewportWidth) / 2);
  const targetScrollTop = Math.max(0, (scrollHeight - viewportHeight) / 2);
  
  container.scrollLeft = targetScrollLeft;
  container.scrollTop = targetScrollTop;
  
  console.log(`Canvas centered - scroll to ${targetScrollLeft}, ${targetScrollTop}`);
};

/**
 * Ensure canvas DOM elements stay visible and properly sized
 * This is the same function used by undo/redo to restore proper canvas state
 */
export const ensureCanvasVisible = (canvas) => {
  if (!canvas || !canvas.wrapperEl) {
    console.warn('Cannot ensure canvas visibility: canvas or wrapper element not available');
    return;
  }

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

    // Ensure canvas has proper dimensions even when empty
    if (lower) {
      lower.style.minWidth = canvas.width + "px";
      lower.style.minHeight = canvas.height + "px";
    }
    if (upper) {
      upper.style.minWidth = canvas.width + "px";
      upper.style.minHeight = canvas.height + "px";
    }
  } catch (error) {
    console.error("Error ensuring canvas visibility:", error);
  }
};

/**
 * Enable mouse wheel zoom and drag-to-pan functionality
 */
export const enableCanvasMouseInteractions = (canvas) => {
  if (!canvas || !canvas.wrapperEl) return;

  const wrapper = canvas.wrapperEl;
  const container = wrapper.parentElement;
  
  if (!container) return;

  // Mouse wheel zoom configuration
  const minZoom = 0.1;
  const maxZoom = 5.0;
  const zoomStep = 0.1;
  
  // Drag state
  let isDragging = false;
  let dragStart = { x: 0, y: 0 };
  let scrollStart = { left: 0, top: 0 };

  // Mouse wheel zoom handler - DISABLED to allow normal page scrolling
  // const handleWheel = (e) => {
  //   e.preventDefault();
  //   
  //   if (!canvas.zoomLevel) canvas.zoomLevel = 1;
  //   
  //   const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
  //   const newZoom = Math.min(Math.max(canvas.zoomLevel + delta, minZoom), maxZoom);
  //   
  //   if (newZoom !== canvas.zoomLevel) {
  //     // Get mouse position relative to container
  //     const rect = container.getBoundingClientRect();
  //     const mouseX = e.clientX - rect.left;
  //     const mouseY = e.clientY - rect.top;
  //     
  //     // Calculate current center point in the scrollable content
  //     const currentCenterX = container.scrollLeft + mouseX;
  //     const currentCenterY = container.scrollTop + mouseY;
  //     
  //     // Store old zoom for ratio calculation
  //     const oldZoom = canvas.zoomLevel;
  //     
  //     // Apply new zoom
  //     applyCanvasZoom(canvas, newZoom);
  //     
  //     // Calculate how much the content size changed
  //     const zoomRatio = newZoom / oldZoom;
  //     
  //     // Adjust scroll position to keep the mouse point centered
  //     setTimeout(() => {
  //       const newCenterX = currentCenterX * zoomRatio;
  //       const newCenterY = currentCenterY * zoomRatio;
  //       
  //       container.scrollLeft = Math.max(0, newCenterX - mouseX);
  //       container.scrollTop = Math.max(0, newCenterY - mouseY);
  //     }, 10);
  //     
  //     console.log(`Wheel zoom: ${newZoom.toFixed(2)}`);
  //   }
  // };

  // Mouse down handler - start drag
  const handleMouseDown = (e) => {
    // Don't allow dragging when in drawing mode
    if (canvas && canvas.isDrawingMode) {
      return;
    }
    
    // Allow dragging if clicking on container background, canvas wrapper, or empty canvas area
    const isClickableArea = 
      e.target === container || 
      e.target === wrapper || 
      (e.target.tagName === 'CANVAS' && (!canvas.getActiveObject() || e.ctrlKey || e.metaKey));
    
    if (isClickableArea) {
      isDragging = true;
      dragStart = { x: e.clientX, y: e.clientY };
      scrollStart = { left: container.scrollLeft, top: container.scrollTop };
      
      container.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none'; // Prevent text selection during drag
      e.preventDefault();
    }
  };

  // Mouse move handler - perform drag
  const handleMouseMove = (e) => {
    // Don't allow dragging when in drawing mode
    if (canvas && canvas.isDrawingMode) {
      return;
    }
    
    if (!isDragging) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    // Calculate new scroll positions with boundaries check
    const newScrollLeft = Math.max(0, Math.min(
      container.scrollWidth - container.clientWidth, 
      scrollStart.left - deltaX
    ));
    const newScrollTop = Math.max(0, Math.min(
      container.scrollHeight - container.clientHeight, 
      scrollStart.top - deltaY
    ));
    
    container.scrollLeft = newScrollLeft;
    container.scrollTop = newScrollTop;
    
    e.preventDefault();
  };

  // Mouse up handler - end drag
  const handleMouseUp = (e) => {
    // Always handle mouse up to reset state, regardless of drawing mode
    if (isDragging) {
      isDragging = false;
      container.style.cursor = 'default';
      document.body.style.userSelect = ''; // Restore text selection
    }
  };

  // Keyboard handler for canvas movement
  const handleKeyDown = (e) => {
    // Only handle keys when canvas container has focus or no input is active
    const isInputActive = document.activeElement && 
      (document.activeElement.tagName === 'INPUT' || 
       document.activeElement.tagName === 'TEXTAREA' || 
       document.activeElement.contentEditable === 'true');
    
    if (isInputActive) return;
    
    const moveStep = 50; // pixels to move
    let moved = false;
    
    switch (e.key) {
      case 'ArrowLeft':
        // Left arrow should move canvas view left (scroll right)
        container.scrollLeft = Math.min(
          container.scrollWidth - container.clientWidth, 
          container.scrollLeft + moveStep
        );
        moved = true;
        break;
      case 'ArrowRight':
        // Right arrow should move canvas view right (scroll left)
        container.scrollLeft = Math.max(0, container.scrollLeft - moveStep);
        moved = true;
        break;
      case 'ArrowUp':
        // Up arrow should move canvas view up (scroll down)
        container.scrollTop = Math.min(
          container.scrollHeight - container.clientHeight, 
          container.scrollTop + moveStep
        );
        moved = true;
        break;
      case 'ArrowDown':
        // Down arrow should move canvas view down (scroll up)
        container.scrollTop = Math.max(0, container.scrollTop - moveStep);
        moved = true;
        break;
    }
    
    if (moved) {
      e.preventDefault();
    }
  };

  // Add event listeners (wheel listener disabled for normal page scrolling)
  // container.addEventListener('wheel', handleWheel, { passive: false });
  container.addEventListener('mousedown', handleMouseDown);
  container.addEventListener('mousemove', handleMouseMove);
  container.addEventListener('mouseup', handleMouseUp);
  container.addEventListener('mouseleave', handleMouseUp); // Stop drag if mouse leaves container
  document.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    // container.removeEventListener('wheel', handleWheel);
    container.removeEventListener('mousedown', handleMouseDown);
    container.removeEventListener('mousemove', handleMouseMove);
    container.removeEventListener('mouseup', handleMouseUp);
    container.removeEventListener('mouseleave', handleMouseUp);
    document.removeEventListener('keydown', handleKeyDown);
  };
};

/**
 * Calculate optimal zoom level to fit canvas in viewport
 */
export const calculateOptimalZoom = (canvas, containerEl) => {
  if (!canvas || !containerEl) return 1;

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  
  // Get available space (subtract space for sidebars, headers, etc.)
  const availableWidth = window.innerWidth - 400; // Account for sidebars
  const availableHeight = window.innerHeight - 150; // Account for header/footer
  
  // Calculate container space
  const containerWidth = containerEl.clientWidth || availableWidth;
  const containerHeight = containerEl.clientHeight || availableHeight;
  
  // Calculate zoom ratios for both dimensions
  const zoomX = Math.min(containerWidth * 0.8 / canvasWidth, 2); // Max 200% zoom
  const zoomY = Math.min(containerHeight * 0.8 / canvasHeight, 2); // Max 200% zoom
  
  // Use the smaller ratio to ensure it fits in both dimensions
  const optimalZoom = Math.min(zoomX, zoomY, 1); // Never zoom more than 100% for initial view
  
  console.log(`Optimal zoom calculated: ${optimalZoom.toFixed(2)} for canvas ${canvasWidth}x${canvasHeight} in space ${containerWidth}x${containerHeight}`);
  
  return Math.max(optimalZoom, 0.1); // Minimum 10% zoom
};

/**
 * Apply zoom to canvas with proper centering
 */
export const applyCanvasZoom = (canvas, zoomLevel) => {
  if (!canvas || !canvas.wrapperEl) return;

  // Use CSS transform for viewport zoom with enhanced blur prevention
  const wrapper = canvas.wrapperEl;
  
  // Apply CSS transform for visual zoom
  wrapper.style.transform = `scale(${zoomLevel})`;
  wrapper.style.transformOrigin = 'center center';
  
  // Anti-aliasing and blur prevention techniques
  wrapper.style.imageRendering = 'crisp-edges';
  wrapper.style.imageRendering = '-webkit-optimize-contrast';
  wrapper.style.backfaceVisibility = 'hidden';
  wrapper.style.perspective = '1000px';
  
  // Store zoom level for reference
  canvas.zoomLevel = zoomLevel;
  
  // Enhanced high-quality rendering for canvas elements
  const devicePixelRatio = window.devicePixelRatio || 1;
  const lowerCanvas = canvas.lowerCanvasEl;
  const upperCanvas = canvas.upperCanvasEl;
  
  [lowerCanvas, upperCanvas].forEach(canvasEl => {
    if (canvasEl) {
      const context = canvasEl.getContext('2d');
      
      // High-quality rendering settings
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      
      // Additional blur prevention for canvas
      canvasEl.style.imageRendering = 'crisp-edges';
      canvasEl.style.imageRendering = '-webkit-optimize-contrast';
      
      // For high-DPI displays, render at higher resolution
      if (devicePixelRatio > 1) {
        const computedStyle = window.getComputedStyle(canvasEl);
        const width = parseInt(computedStyle.width, 10);
        const height = parseInt(computedStyle.height, 10);
        
        // Set actual canvas size at device pixel ratio
        canvasEl.width = width * devicePixelRatio;
        canvasEl.height = height * devicePixelRatio;
        
        // Scale context to match device pixel ratio
        context.scale(devicePixelRatio, devicePixelRatio);
        
        // Keep CSS size the same
        canvasEl.style.width = width + 'px';
        canvasEl.style.height = height + 'px';
      }
    }
  });
  
  // Force re-render to apply changes
  canvas.requestRenderAll();
  
  console.log(`Canvas zoom applied: ${zoomLevel.toFixed(2)} (CSS transform with blur prevention)`);
};

/**
 * Center canvas content while preserving zoom
 */
export const centerCanvasWithZoom = (canvas) => {
  if (!canvas || !canvas.wrapperEl) return;
  
  const zoom = canvas.getZoom();
  const container = canvas.wrapperEl.parentElement;
  
  if (container) {
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Calculate center position accounting for zoom
    const centerX = (containerWidth / 2) / zoom;
    const centerY = (containerHeight / 2) / zoom;
    
    // Set viewport transform to center the content
    const vpt = canvas.viewportTransform.slice();
    vpt[4] = centerX - (canvas.getWidth() / 2);
    vpt[5] = centerY - (canvas.getHeight() / 2);
    
    canvas.setViewportTransform(vpt);
    canvas.requestRenderAll();
  }
};

/**
 * Auto-fit canvas to viewport with optimal zoom
 */
export const autoFitCanvas = (canvas, containerEl) => {
  if (!canvas || !containerEl) return;

  try {
    // Calculate optimal zoom
    const optimalZoom = calculateOptimalZoom(canvas, containerEl);
    
    // Center the canvas first
    centerCanvas(canvas);
    
    // Then apply optimal zoom
    setTimeout(() => {
      applyCanvasZoom(canvas, optimalZoom);
    }, 100);
    
    console.log(`Auto-fit applied: zoom ${optimalZoom.toFixed(2)} for ${canvas.width}x${canvas.height} canvas`);
    
  } catch (error) {
    console.error('Error in auto-fit canvas:', error);
  }
};

/**
 * Reset zoom and re-fit canvas - useful when template changes
 */
export const resetAndFitCanvas = (canvas, containerEl) => {
  if (!canvas || !canvas.wrapperEl) return;

  try {
    // Reset any existing transforms
    const wrapper = canvas.wrapperEl;
    wrapper.style.transform = 'translate(-50%, -50%)';
    canvas.zoomLevel = 1;
    
    // Re-apply auto-fit
    requestAnimationFrame(() => {
      autoFitCanvas(canvas, containerEl);
    });
    
    console.log('Canvas zoom reset and re-fitted');
    
  } catch (error) {
    console.error('Error resetting canvas zoom:', error);
  }
};

export const resizeCanvas = (canvas, width, height) => {
  if (!canvas) {
    console.error("ResizeCanvas: Canvas is null or undefined");
    return false;
  }

  if (!width || !height || width <= 0 || height <= 0) {
    console.error("ResizeCanvas: Invalid dimensions", { width, height });
    return false;
  }

  try {
    console.log(`ResizeCanvas: Attempting to resize to ${width}x${height}`);

    // Validate canvas element exists
    const canvasElement = canvas.getElement ? canvas.getElement() : null;
    if (!canvasElement) {
      console.error("ResizeCanvas: Canvas element not found");
      return false;
    }

    const oldWidth = canvas.getWidth();
    const oldHeight = canvas.getHeight();
    console.log(`ResizeCanvas: Current size ${oldWidth}x${oldHeight} -> Target size ${width}x${height}`);

    // Update canvas dimensions using multiple methods for reliability
    canvas.setDimensions({ width, height });
    canvas.setWidth(width);
    canvas.setHeight(height);

    // Update the actual DOM element dimensions
    canvasElement.width = width;
    canvasElement.style.width = `${width}px`;
    canvasElement.height = height;
    canvasElement.style.height = `${height}px`;

    // Re-center the canvas while preserving current zoom level
    centerCanvas(canvas, true);

    // Force re-render
    canvas.requestRenderAll();

    console.log(`Canvas successfully resized to ${width}x${height} with zoom ${(canvas.zoomLevel || 1).toFixed(2)} preserved`);
    
    // Verify the resize actually worked
    setTimeout(() => {
      const actualWidth = canvas.getWidth();
      const actualHeight = canvas.getHeight();
      if (actualWidth !== width || actualHeight !== height) {
        console.warn(`Resize verification failed: expected ${width}x${height}, got ${actualWidth}x${actualHeight}`);
      } else {
        console.log(`Resize verification passed: ${actualWidth}x${actualHeight}`);
      }
    }, 100);
    
    return true;
  } catch (error) {
    console.error("Error resizing canvas:", error);
    return false;
  }
};

/**
 * Container-aware canvas resizing that waits for proper container measurement
 */
export const resizeCanvasWithContainerAwareness = async (canvas, width, height) => {
  if (!canvas || !canvas.wrapperEl) {
    console.error("resizeCanvasWithContainerAwareness: Canvas or wrapper not available");
    return false;
  }

  try {
    console.log(`Starting container-aware resize to ${width}x${height}`);
    
    // Wait for container to be properly measured
    const containerEl = canvas.wrapperEl.parentElement;
    const containerInfo = await waitForContainerReady(containerEl);
    console.log(`Container-aware resize: container ${containerInfo.width}x${containerInfo.height}, target canvas ${width}x${height}`);

    // Hide canvas during resize to prevent visual glitches
    const wrapper = canvas.wrapperEl;
    if (wrapper) {
      wrapper.style.visibility = 'hidden';
      wrapper.style.opacity = '0';
    }

    // Additional wait to ensure DOM is stable
    await new Promise(resolve => setTimeout(resolve, 100));

    // Now resize with proper container context
    console.log('Applying canvas resize...');
    const result = resizeCanvas(canvas, width, height);
    
    // Wait for resize to complete
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Additional step: ensure canvas is properly centered after resize
    console.log('Applying undo/redo restoration sequence...');
    
    // Apply the EXACT same sequence as undo/redo which works correctly
    ensureCanvasVisible(canvas);
    canvas.discardActiveObject();
    canvas.calcOffset();
    centerCanvas(canvas);
    
    // Wait for centering to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Force visibility and proper state
    if (wrapper) {
      wrapper.style.transition = 'opacity 0.3s ease-in-out';
      wrapper.style.visibility = 'visible';
      wrapper.style.opacity = '1';
    }
    
    canvas.requestRenderAll();
    console.log(`Container-aware resize completed: ${canvas.getWidth()}x${canvas.getHeight()}`);
    
    return result;
  } catch (error) {
    console.error("Error in container-aware resize:", error);
    return false;
  }
};

/**
 * Apply the exact same canvas restoration sequence used by undo/redo
 * This restores proper canvas state and centering
 */
export const applyUndoRedoRestorationSequence = (canvas) => {
  if (!canvas) return;
  
  console.log('Applying undo/redo restoration sequence...');
  
  // This is the exact sequence from undo/redo that works correctly
  ensureCanvasVisible(canvas);
  canvas.discardActiveObject();
  canvas.calcOffset();
  centerCanvas(canvas);
  
  // Additional step: force center after a small delay to ensure perfect positioning
  setTimeout(() => {
    centerCanvas(canvas);
    canvas.requestRenderAll();
    console.log('Canvas properly centered and rendered');
  }, 50);
  
  console.log('Undo/redo restoration sequence completed');
};

export const addShapeToCanvas = async (canvas, shapeType, customProps = {}) => {
  if (!canvas) return null;
  try {
    const fabricModule = await import("fabric");

    const shape = createShape(fabricModule, shapeType, shapeDefinitions, {
      left: 100,
      top: 100,
      ...customProps,
    });

    if (shape) {
      shape.id = `${shapeType}-${Date.now()}`;
      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.renderAll();
      return shape;
    }
  } catch (e) {}
};

export const addTextToCanvas = async (
  canvas,
  text,
  options = {},
  withBackground = false
) => {
  if (!canvas) return null;

  try {
    const { IText } = await import("fabric");

    const defaultProps = {
      left: 100,
      top: 100,
      fontSize: 24,
      fontFamily: "Arial",
      fill: "#000000",
      padding: withBackground ? 10 : 0,
      textAlign: "left",
      id: `text-${Date.now()}`,
    };

    const textObj = new IText(text, {
      ...defaultProps,
      ...options,
    });

    canvas.add(textObj);
    canvas.setActiveObject(textObj);
    canvas.renderAll();

    return textObj;
  } catch (e) {
    return null;
  }
};

export const addImageToCanvas = async (canvas, imageUrl) => {
  if (!canvas) return null;

  try {
    const { Image: FabricImage } = await import("fabric");

    let imgObj = new Image();
    imgObj.crossOrigin = "Anonymous";
    imgObj.src = imageUrl;

    return new Promise((resolve, reject) => {
      imgObj.onload = () => {
        let image = new FabricImage(imgObj);
        image.set({
          id: `image-${Date.now()}`,
          top: 100,
          left: 100,
          padding: 10,
          cornorSize: 10,
        });

        const maxDimension = 400;

        if (image.width > maxDimension || image.height > maxDimension) {
          if (image.width > image.height) {
            const scale = maxDimension / image.width;
            image.scale(scale);
          } else {
            const scale = maxDimension / image.height;
            image.scale(scale);
          }
        }

        canvas.add(image);
        canvas.setActiveObject(image);
        canvas.renderAll();
        resolve(image);
      };

      imgObj.onerror = () => {
        reject(new Error("Failed to load image", imageUrl));
      };
    });
  } catch (error) {
    console.error("Error adding image");

    return null;
  }
};

export const toggleDrawingMode = (
  canvas,
  isDrawingMode,
  drawingColor = "#000000",
  brushWidth = 5
) => {
  if (!canvas) return null;

  try {
    console.log("Toggle drawing mode:", isDrawingMode, "color:", drawingColor);

    canvas.isDrawingMode = isDrawingMode;
    if (isDrawingMode) {
      canvas.freeDrawingBrush.color = drawingColor;
      canvas.freeDrawingBrush.width = brushWidth;

      // Clear eraser mode when switching to regular drawing
      canvas._isEraserMode = false;

      console.log(
        "Drawing mode enabled - color:",
        canvas.freeDrawingBrush.color
      );
    } else {
      console.log("Drawing mode disabled");
    }

    return true;
  } catch (e) {
    console.error("Error toggling drawing mode:", e);
    return false;
  }
};

export const toggleEraseMode = async (
  canvas,
  isErasing,
  previousColor = "#000000",
  eraserWidth = 20
) => {
  if (!canvas) return false;

  try {
    if (isErasing) {
      console.log("Activating eraser mode");

      // Disable drawing mode first
      canvas.isDrawingMode = false;
      canvas.selection = false;

      // Set eraser mode flag
      canvas._isEraserMode = true;
      canvas._eraserWidth = eraserWidth;

      // Change cursor to indicate eraser mode
      canvas.defaultCursor = "crosshair";
      canvas.moveCursor = "crosshair";

      // Set up eraser event handlers
      setupEraserEvents(canvas, eraserWidth);

      console.log("Eraser mode activated");
    } else {
      console.log("Deactivating eraser mode");

      // Clear eraser mode
      canvas._isEraserMode = false;
      canvas.selection = true;

      // Restore normal cursor
      canvas.defaultCursor = "default";
      canvas.moveCursor = "move";

      // Remove eraser event handlers
      removeEraserEvents(canvas);

      // Restore normal drawing mode if needed
      canvas.isDrawingMode = false;

      console.log("Eraser mode deactivated");
    }

    return true;
  } catch (e) {
    console.error("Error toggling erase mode:", e);
    return false;
  }
};

// Set up eraser event handlers
const setupEraserEvents = (canvas, eraserWidth) => {
  let isErasing = false;

  // Create custom eraser cursor
  const createEraserCursor = (size) => {
    const cursorSize = Math.max(16, Math.min(size, 50)); // Clamp size for visibility
    const svgData = `<svg xmlns='http://www.w3.org/2000/svg' width='${cursorSize}' height='${cursorSize}' viewBox='0 0 ${cursorSize} ${cursorSize}'>
        <circle cx='${cursorSize / 2}' cy='${cursorSize / 2}' r='${
      cursorSize / 2 - 2
    }' fill='rgba(255,0,0,0.1)' stroke='rgba(255,0,0,0.8)' stroke-width='2'/>
        <line x1='${cursorSize / 2 - 4}' y1='${cursorSize / 2}' x2='${
      cursorSize / 2 + 4
    }' y2='${cursorSize / 2}' stroke='red' stroke-width='2'/>
        <line x1='${cursorSize / 2}' y1='${cursorSize / 2 - 4}' x2='${
      cursorSize / 2
    }' y2='${cursorSize / 2 + 4}' stroke='red' stroke-width='2'/>
      </svg>`;

    return `url("data:image/svg+xml,${encodeURIComponent(svgData)}") ${
      cursorSize / 2
    } ${cursorSize / 2}, crosshair`;
  };

  // Set eraser cursor
  const eraserCursor = createEraserCursor(eraserWidth);
  canvas.defaultCursor = eraserCursor;
  canvas.moveCursor = eraserCursor;

  // Mouse down - start erasing
  const onMouseDown = (e) => {
    if (!canvas._isEraserMode) return;

    isErasing = true;
    const pointer = canvas.getPointer(e.e);

    // Start erasing at this position
    performErasureAtPoint(canvas, pointer, canvas._eraserWidth || eraserWidth);
    canvas.renderAll();
  };

  // Mouse move - continue erasing
  const onMouseMove = (e) => {
    if (!canvas._isEraserMode) return;

    const pointer = canvas.getPointer(e.e);

    // Continue erasing if mouse is down
    if (isErasing) {
      performErasureAtPoint(
        canvas,
        pointer,
        canvas._eraserWidth || eraserWidth
      );
      canvas.renderAll();
    }
  };

  // Mouse up - stop erasing
  const onMouseUp = () => {
    if (!canvas._isEraserMode) return;
    isErasing = false;
  };

  // Mouse out - stop erasing
  const onMouseOut = () => {
    if (!canvas._isEraserMode) return;
    isErasing = false;
  };

  // Store event handlers for removal later
  canvas._eraserEvents = {
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseOut,
  };

  // Add event listeners
  canvas.on("mouse:down", onMouseDown);
  canvas.on("mouse:move", onMouseMove);
  canvas.on("mouse:up", onMouseUp);
  canvas.on("mouse:out", onMouseOut);
};

// Remove eraser event handlers
const removeEraserEvents = (canvas) => {
  if (canvas._eraserEvents) {
    canvas.off("mouse:down", canvas._eraserEvents.onMouseDown);
    canvas.off("mouse:move", canvas._eraserEvents.onMouseMove);
    canvas.off("mouse:up", canvas._eraserEvents.onMouseUp);
    canvas.off("mouse:out", canvas._eraserEvents.onMouseOut);

    delete canvas._eraserEvents;
  }

  // Reset cursor to default
  canvas.defaultCursor = "default";
  canvas.moveCursor = "move";
};

// Update eraser cursor size
const updateEraserCursor = (canvas, size) => {
  if (!canvas._isEraserMode) return;

  const cursorSize = Math.max(16, Math.min(size, 50));
  const svgData = `<svg xmlns='http://www.w3.org/2000/svg' width='${cursorSize}' height='${cursorSize}' viewBox='0 0 ${cursorSize} ${cursorSize}'>
      <circle cx='${cursorSize / 2}' cy='${cursorSize / 2}' r='${
    cursorSize / 2 - 2
  }' fill='rgba(255,0,0,0.1)' stroke='rgba(255,0,0,0.8)' stroke-width='2'/>
      <line x1='${cursorSize / 2 - 4}' y1='${cursorSize / 2}' x2='${
    cursorSize / 2 + 4
  }' y2='${cursorSize / 2}' stroke='red' stroke-width='2'/>
      <line x1='${cursorSize / 2}' y1='${cursorSize / 2 - 4}' x2='${
    cursorSize / 2
  }' y2='${cursorSize / 2 + 4}' stroke='red' stroke-width='2'/>
    </svg>`;

  const eraserCursor = `url("data:image/svg+xml,${encodeURIComponent(
    svgData
  )}") ${cursorSize / 2} ${cursorSize / 2}, crosshair`;
  canvas.defaultCursor = eraserCursor;
  canvas.moveCursor = eraserCursor;
};

// Perform erasure at a specific point
const performErasureAtPoint = (canvas, point, eraserWidth) => {
  const objectsToRemove = [];
  const eraserRadius = eraserWidth / 2;

  canvas.getObjects().forEach((obj) => {
    // Skip eraser indicators and other non-erasable objects
    if (obj.isEraserIndicator || obj.excludeFromExport) return;

    // Check if object intersects with eraser circle
    const objBounds = obj.getBoundingRect();

    // Simple circle-rectangle intersection check
    const closestX = Math.max(
      objBounds.left,
      Math.min(point.x, objBounds.left + objBounds.width)
    );
    const closestY = Math.max(
      objBounds.top,
      Math.min(point.y, objBounds.top + objBounds.height)
    );

    const distance = Math.sqrt(
      (point.x - closestX) * (point.x - closestX) +
        (point.y - closestY) * (point.y - closestY)
    );

    if (distance < eraserRadius) {
      objectsToRemove.push(obj);
    }
  });

  // Remove intersecting objects
  objectsToRemove.forEach((obj) => {
    canvas.remove(obj);
  });
};

export const updateDrawingBrush = (canvas, properties = {}) => {
  if (!canvas) return false;

  try {
    const { color, width, opacity } = properties;

    // Handle eraser mode separately
    if (canvas._isEraserMode) {
      if (width !== undefined) {
        canvas._eraserWidth = width;
        updateEraserCursor(canvas, width);
        console.log("Eraser width updated:", width);
      }
      return true;
    }

    // For normal drawing mode, ensure we have a brush
    if (!canvas.freeDrawingBrush) return false;

    if (width !== undefined) {
      canvas.freeDrawingBrush.width = width;
    }

    // Handle color and opacity together
    if (color !== undefined || opacity !== undefined) {
      let finalColor = color || canvas.freeDrawingBrush.color || "#000000";
      let finalOpacity = opacity !== undefined ? opacity : 1;

      // If color is already in rgba format, extract the base color
      if (finalColor.startsWith("rgba")) {
        const rgbaMatch = finalColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (rgbaMatch) {
          finalColor = `#${parseInt(rgbaMatch[1])
            .toString(16)
            .padStart(2, "0")}${parseInt(rgbaMatch[2])
            .toString(16)
            .padStart(2, "0")}${parseInt(rgbaMatch[3])
            .toString(16)
            .padStart(2, "0")}`;
        }
      }

      // Convert hex to RGB
      if (finalColor.startsWith("#")) {
        const hexColor = finalColor.replace("#", "");
        const r = parseInt(hexColor.substr(0, 2), 16);
        const g = parseInt(hexColor.substr(2, 2), 16);
        const b = parseInt(hexColor.substr(4, 2), 16);

        if (finalOpacity < 1) {
          canvas.freeDrawingBrush.color = `rgba(${r}, ${g}, ${b}, ${finalOpacity})`;
        } else {
          canvas.freeDrawingBrush.color = finalColor;
        }
      } else {
        canvas.freeDrawingBrush.color = finalColor;
      }
    }

    console.log("Updated brush:", {
      color: canvas.freeDrawingBrush.color,
      width: canvas.freeDrawingBrush.width,
    });

    return true;
  } catch (e) {
    console.error("Error updating drawing brush:", e);
    return false;
  }
};

export const cloneSelectedObject = async (canvas) => {
  if (!canvas) return;

  const activeObject = canvas.getActiveObject();
  if (!activeObject) {
    console.log("No active object found for cloning");
    return;
  }

  // Debug logging
  console.log("Cloning - Active object type:", activeObject.type);

  try {
    // Check if it's a multi-selection (ActiveSelection) - check both case variations
    if (
      activeObject.type === "activeSelection" ||
      activeObject.type === "activeselection"
    ) {
      console.log("Cloning multiple selected objects");

      // Get all objects in the selection BEFORE clearing selection
      const objectsToClone = activeObject.getObjects().slice(); // Create a copy
      console.log(
        "Objects to clone:",
        objectsToClone.map((obj) => obj.type)
      );
      console.log("Number of objects to clone:", objectsToClone.length);

      const clonedObjects = [];

      // First, discard the current selection
      canvas.discardActiveObject();

      // Clone each object individually
      for (let i = 0; i < objectsToClone.length; i++) {
        const obj = objectsToClone[i];
        console.log(`Cloning object ${i + 1}: ${obj.type}`);

        try {
          const clonedObj = await obj.clone();

          clonedObj.set({
            left: obj.left + 20,
            top: obj.top + 20,
            id: `${obj.type || "object"}-${Date.now()}-${i}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
          });

          canvas.add(clonedObj);
          clonedObjects.push(clonedObj);
          console.log(
            `Successfully cloned and added object: ${clonedObj.type}`
          );
        } catch (cloneError) {
          console.error(`Error cloning object ${i + 1}:`, cloneError);
        }
      }

      // Create a new selection with the cloned objects if we have any
      if (clonedObjects.length > 0) {
        try {
          // Import fabric to create ActiveSelection
          const { ActiveSelection } = await import("fabric");

          // Create a new selection with the cloned objects
          const selection = new ActiveSelection(clonedObjects, {
            canvas: canvas,
          });

          canvas.setActiveObject(selection);
          canvas.renderAll();

          console.log(
            `Successfully cloned ${clonedObjects.length} objects and created new selection`
          );
        } catch (selectionError) {
          console.error("Error creating new selection:", selectionError);
          // Fallback: just select the first cloned object
          if (clonedObjects.length > 0) {
            canvas.setActiveObject(clonedObjects[0]);
          }
          canvas.renderAll();
        }
      }

      return clonedObjects;
    } else {
      // Single object cloning
      console.log("Cloning single selected object:", activeObject.type);
      const clonedObj = await activeObject.clone();

      clonedObj.set({
        left: activeObject.left + 20,
        top: activeObject.top + 20,
        id: `${activeObject.type || "object"}-${Date.now()}`,
      });

      canvas.add(clonedObj);
      canvas.setActiveObject(clonedObj);
      canvas.renderAll();

      console.log("Successfully cloned single object");
      return clonedObj;
    }
  } catch (e) {
    console.error("Error while cloning", e);
    return null;
  }
};

export const debugSelection = (canvas) => {
  if (!canvas) {
    console.log("DEBUG: No canvas provided");
    return;
  }

  const activeObject = canvas.getActiveObject();
  console.log("=== SELECTION DEBUG ===");
  console.log("Canvas selection enabled:", canvas.selection);
  console.log("Active object exists:", !!activeObject);

  if (activeObject) {
    console.log("Active object type:", activeObject.type);
    console.log("Active object constructor:", activeObject.constructor.name);

    // Fix the condition - check for 'activeSelection' not 'activeselection'
    if (
      activeObject.type === "activeSelection" ||
      activeObject.type === "activeselection"
    ) {
      const objects = activeObject.getObjects();
      console.log("Multi-selection detected!");
      console.log("Number of objects in selection:", objects.length);
      console.log(
        "Objects in selection:",
        objects.map((obj) => obj.type)
      );
    } else {
      console.log("Single object selected:", activeObject.type);
    }
  } else {
    console.log("No object selected");
  }
  console.log("=====================");
};

export const deletedSelectedObject = async (canvas) => {
  if (!canvas) return;

  // Debug selection first
  debugSelection(canvas);

  const activeObject = canvas.getActiveObject();
  if (!activeObject) {
    console.log("No active object found for deletion");
    return;
  }

  // Debug logging
  console.log("Active object type:", activeObject.type);
  console.log("Active object:", activeObject);

  try {
    // Check if it's a multi-selection (ActiveSelection) - check both case variations
    if (
      activeObject.type === "activeSelection" ||
      activeObject.type === "activeselection"
    ) {
      console.log("Deleting multiple selected objects");

      // Get all objects in the selection BEFORE clearing the selection
      const objectsToRemove = activeObject.getObjects().slice(); // Create a copy of the array
      console.log(
        "Objects to remove:",
        objectsToRemove.map((obj) => obj.type)
      );

      // IMPORTANT: First discard the active selection to ungrouping the objects
      canvas.discardActiveObject();

      // Then remove each object individually from the canvas
      objectsToRemove.forEach((obj, index) => {
        console.log(`Removing object ${index + 1}: ${obj.type}`);
        canvas.remove(obj);
      });

      // Re-render the canvas
      canvas.renderAll();

      console.log(`Successfully deleted ${objectsToRemove.length} objects`);
    } else {
      // Single object deletion
      console.log("Deleting single selected object:", activeObject.type);
      canvas.remove(activeObject);
      canvas.discardActiveObject();
      canvas.renderAll();
      console.log("Successfully deleted single object");
    }

    return true;
  } catch (e) {
    console.error("Error while deleting", e);
    return false;
  }
};

export const customizeBoundingBox = (canvas) => {
  if (!canvas) return;

  try {
    canvas.on("object:added", (e) => {
      if (e.target) {
        // Skip eraser indicators and excluded objects
        if (e.target.isEraserIndicator || e.target.excludeFromExport) {
          return;
        }

        // Apply normal bounding box styling to all regular objects
        e.target.set({
          borderColor: "#00ffe7",
          cornerColor: "#000000",
          cornerStrokeColor: "#00ffe7",
          cornerSize: 10,
          transparentCorners: false,
        });
      }
    });

    canvas.getObjects().forEach((obj) => {
      obj.set({
        borderColor: "#00ffe7",
        cornerColor: "#000000",
        cornerStrokeColor: "#00ffe7",
        cornerSize: 10,
        transparentCorners: false,
      });
    });

    canvas.renderAll();
  } catch (e) {
    console.error("Failed to customise bounding box", e);
  }
};

// Simple and reliable Undo/Redo functionality
export const initializeHistoryManagement = (canvas) => {
  if (!canvas) return;

  // Initialize history arrays
  canvas.historyUndo = [];
  canvas.historyRedo = [];
  canvas.isPerformingHistory = false;
  canvas.mods = 0;

  // Use the exported ensureCanvasVisible function

  // Save initial state with zoom level
  const initialCanvasData = canvas.toJSON();
  const initialState = JSON.stringify({
    canvas: initialCanvasData,
    zoomLevel: canvas.zoomLevel || 1
  });
  canvas.historyUndo.push(initialState);

  // Ensure initial empty state is properly visible
  canvas.backgroundColor = canvas.backgroundColor || "#ffffff";
  ensureCanvasVisible(canvas);
  canvas.renderAll();

  // Save state function with better debouncing and zoom preservation
  const saveState = () => {
    if (canvas.isPerformingHistory) return;

    canvas.mods++;
    
    // Create a state object that includes both canvas data and zoom level
    const canvasData = canvas.toJSON();
    const currentState = JSON.stringify({
      canvas: canvasData,
      zoomLevel: canvas.zoomLevel || 1
    });

    // Only save if different from last state
    if (canvas.historyUndo[canvas.historyUndo.length - 1] !== currentState) {
      canvas.historyUndo.push(currentState);
      canvas.historyRedo = []; // Clear redo history

      // Limit history size
      if (canvas.historyUndo.length > 50) {
        canvas.historyUndo.shift();
      }

      // Use setTimeout to ensure fire event happens after current operation
      setTimeout(() => {
        canvas.fire("history:changed");
      }, 0);
    }
  };

  // Undo function with better async handling
  canvas.undo = () => {
    if (canvas.historyUndo.length > 1 && !canvas.isPerformingHistory) {
      canvas.isPerformingHistory = true;

      // Move current state to redo
      const currentState = canvas.historyUndo.pop();
      canvas.historyRedo.push(currentState);

      // Get previous state
      const previousState = canvas.historyUndo[canvas.historyUndo.length - 1];
      
      // Parse the state to get both canvas data and zoom level
      const parsedState = JSON.parse(previousState);
      const canvasData = parsedState.canvas || parsedState; // Fallback for old format
      const savedZoomLevel = parsedState.zoomLevel || 1;

      // Clear any pending save operations
      clearTimeout(canvas.saveTimeout);

      // Load previous state with promise-based approach
      try {
        canvas
          .loadFromJSON(canvasData)
          .then(() => {
            // Clean up any eraser strokes after undo
            cleanupEraserStrokes(canvas);

            // Restore zoom level first
            canvas.zoomLevel = savedZoomLevel;

            // Clean up and render
            ensureCanvasVisible(canvas);
            canvas.discardActiveObject();
            canvas.calcOffset();
            centerCanvas(canvas, true); // Preserve zoom level during undo

            // Handle empty canvas
            const objectsData = canvasData.objects || [];
            if (!objectsData || objectsData.length === 0) {
              canvas.backgroundColor = canvas.backgroundColor || "#ffffff";
            }

            canvas.requestRenderAll();
            canvas.isPerformingHistory = false;
            canvas.fire("history:changed");
          })
          .catch((err) => {
            console.error("Undo operation failed:", err);
            canvas.isPerformingHistory = false;
          });
      } catch (err) {
        console.error("Undo operation failed:", err);
        canvas.isPerformingHistory = false;
      }
    }
  };

  // Redo function with better async handling
  canvas.redo = () => {
    if (canvas.historyRedo.length > 0 && !canvas.isPerformingHistory) {
      canvas.isPerformingHistory = true;

      // Get state from redo
      const redoState = canvas.historyRedo.pop();
      canvas.historyUndo.push(redoState);
      
      // Parse the state to get both canvas data and zoom level
      const parsedState = JSON.parse(redoState);
      const canvasData = parsedState.canvas || parsedState; // Fallback for old format
      const savedZoomLevel = parsedState.zoomLevel || 1;

      // Clear any pending save operations
      clearTimeout(canvas.saveTimeout);

      // Load redo state with promise-based approach
      try {
        canvas
          .loadFromJSON(canvasData)
          .then(() => {
            // Clean up any eraser strokes after redo
            cleanupEraserStrokes(canvas);

            // Restore zoom level first
            canvas.zoomLevel = savedZoomLevel;

            // Clean up and render
            ensureCanvasVisible(canvas);
            canvas.discardActiveObject();
            canvas.calcOffset();
            centerCanvas(canvas, true); // Preserve zoom level during redo

            // Handle empty canvas
            const objectsData = canvasData.objects || [];
            if (!objectsData || objectsData.length === 0) {
              canvas.backgroundColor = canvas.backgroundColor || "#ffffff";
            }

            canvas.requestRenderAll();
            canvas.isPerformingHistory = false;
            canvas.fire("history:changed");
          })
          .catch((err) => {
            console.error("Redo operation failed:", err);
            canvas.isPerformingHistory = false;
          });
      } catch (err) {
        console.error("Redo operation failed:", err);
        canvas.isPerformingHistory = false;
      }
    }
  };

  // Set up event listeners with proper debouncing
  const events = [
    "object:added",
    "object:removed",
    "object:modified",
    "path:created",
  ];

  events.forEach((event) => {
    canvas.on(event, (e) => {
      // Don't save history during undo/redo operations
      if (canvas.isPerformingHistory) return;

      // For drawing operations, add a longer debounce
      const debounceTime = event === "path:created" ? 500 : 300;

      // Clear any existing timeout
      clearTimeout(canvas.saveTimeout);

      // Set new timeout
      canvas.saveTimeout = setTimeout(() => {
        if (!canvas.isPerformingHistory) {
          saveState();
        }
      }, debounceTime);
    });
  });

  console.log("History management initialized");
};

// Utility function to clean up eraser indicators and temporary objects
export const cleanupEraserStrokes = (canvas) => {
  if (!canvas) return;

  try {
    // Remove eraser indicators and other temporary objects
    const objectsToRemove = canvas
      .getObjects()
      .filter(
        (obj) =>
          obj.isEraserIndicator ||
          obj.excludeFromExport ||
          (obj.type === "path" &&
            (obj.stroke === "#ffffff" || obj.fill === "#ffffff"))
      );

    objectsToRemove.forEach((obj) => canvas.remove(obj));
    canvas.renderAll();
  } catch (error) {
    console.error("Error cleaning up eraser objects:", error);
  }
};
