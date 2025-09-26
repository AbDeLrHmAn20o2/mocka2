const Design = require("../models/design");
const { validationResult } = require("express-validator");

// Utility function to generate thumbnail from canvas data
const generateThumbnailFromCanvas = async (canvasData, width = 200, height = 200) => {
  try {
    // If no server-side canvas generation is available, 
    // we can return a placeholder or let the frontend handle it
    return null;
  } catch (error) {
    console.error("Error generating thumbnail:", error);
    return null;
  }
};

const designController = {
  // Get all designs for a user
  async getUserDesigns(req, res, next) {
    try {
      const userId = req.user.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const designs = await Design.find({ userId })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("_id name width height category isPremium tags thumbnail createdAt updatedAt canvasData"); // Include canvasData for previews

      const total = await Design.countDocuments({ userId });

      res.status(200).json({
        success: true,
        data: designs,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: designs.length,
          totalItems: total,
        },
      });
    } catch (error) {
      console.error("Error fetching designs:", error);
      next(error);
    }
  },

  // Get specific design by ID
  async getUserDesignById(req, res, next) {
    try {
      const userId = req.user.userId;
      const designId = req.params.id;

      const design = await Design.findOne({ _id: designId, userId });

      if (!design) {
        return res.status(404).json({
          success: false,
          error: "Design not found",
          message: "Design not found or you don't have permission to view it.",
          code: "DESIGN_NOT_FOUND",
        });
      }

      // Validate and fix canvasData if needed
      if (design.canvasData) {
        try {
          // Test if canvasData can be parsed
          const parsedCanvasData = typeof design.canvasData === 'string' 
            ? JSON.parse(design.canvasData) 
            : design.canvasData;

          // Ensure objects array exists
          if (!parsedCanvasData.objects) {
            console.warn(`Design ${designId} has canvasData without objects array, adding empty array`);
            parsedCanvasData.objects = [];
            
            // Update the design with fixed canvasData
            design.canvasData = JSON.stringify(parsedCanvasData);
            await design.save();
          }
        } catch (parseError) {
          console.error(`Invalid canvasData JSON for design ${designId}:`, parseError);
          // Set default empty canvas structure
          design.canvasData = JSON.stringify({
            version: "5.3.0",
            objects: [],
            background: "#ffffff"
          });
          await design.save();
        }
      } else {
        console.warn(`Design ${designId} has no canvasData, setting default`);
        // Set default canvas structure for designs without canvasData
        design.canvasData = JSON.stringify({
          version: "5.3.0", 
          objects: [],
          background: "#ffffff"
        });
        await design.save();
      }

      res.status(200).json({
        success: true,
        data: design,
      });
    } catch (error) {
      console.error("Error fetching design by ID:", error);
      next(error);
    }
  },

  // Create or update design
  async saveDesign(req, res, next) {
    try {
      const userId = req.user.userId;
      const {
        designId,
        name,
        canvasData,
        width,
        height,
        category,
        isPremium,
        tags,
        thumbnail,
      } = req.body;

      // Validation
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Invalid input",
          message: "Design name is required",
          code: "MISSING_NAME",
        });
      }

      if (!width || !height || width <= 0 || height <= 0) {
        return res.status(400).json({
          success: false,
          error: "Invalid dimensions",
          message: "Valid width and height are required",
          code: "INVALID_DIMENSIONS",
        });
      }

      if (designId) {
        // Update existing design
        const design = await Design.findOne({ _id: designId, userId });
        if (!design) {
          return res.status(404).json({
            success: false,
            error: "Design not found",
            message:
              "Design not found or you don't have permission to edit it.",
            code: "DESIGN_NOT_FOUND",
          });
        }

        // Update fields
        if (name) design.name = name.trim();
        if (canvasData) {
          // Validate and fix canvasData structure
          try {
            const parsedCanvasData = typeof canvasData === 'string' 
              ? JSON.parse(canvasData) 
              : canvasData;
            
            // Ensure required properties exist
            if (!parsedCanvasData.objects) {
              parsedCanvasData.objects = [];
            }
            if (!parsedCanvasData.version) {
              parsedCanvasData.version = "5.3.0";
            }
            
            design.canvasData = JSON.stringify(parsedCanvasData);
          } catch (parseError) {
            console.error("Invalid canvasData provided:", parseError);
            return res.status(400).json({
              success: false,
              error: "Invalid canvas data",
              message: "Canvas data is not valid JSON",
              code: "INVALID_CANVAS_DATA",
            });
          }
        }
        if (width) design.width = width;
        if (height) design.height = height;
        if (category) design.category = category;
        if (isPremium !== undefined) design.isPremium = isPremium;
        if (tags) design.tags = tags;
        if (thumbnail) design.thumbnail = thumbnail;

        design.updatedAt = Date.now();
        const updatedDesign = await design.save();

        return res.status(200).json({
          success: true,
          data: updatedDesign,
          message: "Design updated successfully",
        });
      } else {
        // Create new design
        let processedCanvasData = canvasData;
        
        // Validate and fix canvasData structure for new designs
        if (canvasData) {
          try {
            const parsedCanvasData = typeof canvasData === 'string' 
              ? JSON.parse(canvasData) 
              : canvasData;
            
            // Ensure required properties exist
            if (!parsedCanvasData.objects) {
              parsedCanvasData.objects = [];
            }
            if (!parsedCanvasData.version) {
              parsedCanvasData.version = "5.3.0";
            }
            
            processedCanvasData = JSON.stringify(parsedCanvasData);
          } catch (parseError) {
            console.error("Invalid canvasData provided for new design:", parseError);
            return res.status(400).json({
              success: false,
              error: "Invalid canvas data",
              message: "Canvas data is not valid JSON",
              code: "INVALID_CANVAS_DATA",
            });
          }
        } else {
          // Set default canvas structure if no canvasData provided
          processedCanvasData = JSON.stringify({
            version: "5.3.0",
            objects: [],
            background: "#ffffff"
          });
        }

        const newDesign = new Design({
          userId,
          name: name.trim(),
          width,
          height,
          canvasData: processedCanvasData,
          category: category || "General",
          isPremium: isPremium || false,
          tags: tags || [],
          thumbnail,
        });

        const savedDesign = await newDesign.save();
        return res.status(201).json({
          success: true,
          data: savedDesign,
          message: "Design created successfully",
        });
      }
    } catch (error) {
      console.error("Error saving design:", error);
      next(error);
    }
  },

  // Update specific design
  async updateDesign(req, res, next) {
    try {
      const userId = req.user.userId;
      const designId = req.params.id;
      const updates = req.body;

      const design = await Design.findOne({ _id: designId, userId });
      if (!design) {
        return res.status(404).json({
          success: false,
          error: "Design not found",
          message: "Design not found or you don't have permission to edit it.",
          code: "DESIGN_NOT_FOUND",
        });
      }

      // Apply updates
      Object.keys(updates).forEach((key) => {
        if (updates[key] !== undefined && key !== "_id" && key !== "userId") {
          design[key] = updates[key];
        }
      });

      design.updatedAt = Date.now();
      const updatedDesign = await design.save();

      res.status(200).json({
        success: true,
        data: updatedDesign,
        message: "Design updated successfully",
      });
    } catch (error) {
      console.error("Error updating design:", error);
      next(error);
    }
  },

  // Delete design
  async deleteDesign(req, res, next) {
    try {
      const userId = req.user.userId;
      const designId = req.params.id;

      const design = await Design.findOne({ _id: designId, userId });
      if (!design) {
        return res.status(404).json({
          success: false,
          error: "Design not found",
          message:
            "Design not found or you don't have permission to delete it.",
          code: "DESIGN_NOT_FOUND",
        });
      }

      await Design.deleteOne({ _id: designId });

      res.status(200).json({
        success: true,
        message: "Design deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting design:", error);
      next(error);
    }
  },

  // Duplicate design
  async duplicateDesign(req, res, next) {
    try {
      const userId = req.user.userId;
      const designId = req.params.id;

      const originalDesign = await Design.findOne({ _id: designId, userId });
      if (!originalDesign) {
        return res.status(404).json({
          success: false,
          error: "Design not found",
          message:
            "Design not found or you don't have permission to duplicate it.",
          code: "DESIGN_NOT_FOUND",
        });
      }

      const duplicateDesign = new Design({
        userId,
        name: `${originalDesign.name} (Copy)`,
        canvasData: originalDesign.canvasData, // Already stored as string
        width: originalDesign.width,
        height: originalDesign.height,
        category: originalDesign.category,
        isPremium: originalDesign.isPremium,
        tags: [...(originalDesign.tags || [])],
        thumbnail: originalDesign.thumbnail,
      });

      const savedDuplicate = await duplicateDesign.save();

      res.status(201).json({
        success: true,
        data: savedDuplicate,
        message: "Design duplicated successfully",
      });
    } catch (error) {
      console.error("Error duplicating design:", error);
      next(error);
    }
  },

  // Get designs by category
  async getDesignsByCategory(req, res, next) {
    try {
      const userId = req.user.userId;
      const category = req.params.category;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const designs = await Design.find({ userId, category })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("_id name width height category isPremium tags thumbnail createdAt updatedAt canvasData"); // Include canvasData for previews

      const total = await Design.countDocuments({ userId, category });

      res.status(200).json({
        success: true,
        data: designs,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: designs.length,
          totalItems: total,
        },
      });
    } catch (error) {
      console.error("Error fetching designs by category:", error);
      next(error);
    }
  },

  // Create design from template
  async createFromTemplate(req, res, next) {
    try {
      const userId = req.user.userId;
      const { templateData, name } = req.body;

      if (!templateData) {
        return res.status(400).json({
          success: false,
          error: "Template data required",
          message: "Template data is required to create design",
          code: "MISSING_TEMPLATE_DATA",
        });
      }

      // Parse template data if it's a string
      let parsedTemplateData;
      try {
        parsedTemplateData = typeof templateData === 'string' ? JSON.parse(templateData) : templateData;
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          error: "Invalid template data",
          message: "Template data is not valid JSON",
          code: "INVALID_TEMPLATE_DATA",
        });
      }

      // Ensure template has required canvas structure
      if (!parsedTemplateData.objects) {
        parsedTemplateData.objects = [];
      }
      if (!parsedTemplateData.version) {
        parsedTemplateData.version = "5.3.0";
      }

      // Extract design properties from template
      const designName = name || parsedTemplateData.templateInfo?.name || "Untitled Design";
      const width = parsedTemplateData.width || 800;
      const height = parsedTemplateData.height || 600;
      const category = parsedTemplateData.templateInfo?.category || "General";
      const isPremium = parsedTemplateData.isPremium || false;

      // Create new design from template
      const newDesign = new Design({
        userId,
        name: designName,
        width,
        height,
        canvasData: JSON.stringify(parsedTemplateData),
        category,
        isPremium,
        tags: [],
        thumbnail: null, // Will be generated client-side if needed
      });

      const savedDesign = await newDesign.save();

      return res.status(201).json({
        success: true,
        data: savedDesign,
        message: "Design created from template successfully",
      });
    } catch (error) {
      console.error("Error creating design from template:", error);
      next(error);
    }
  },

  // Generate thumbnail for a design
  async generateThumbnail(req, res, next) {
    try {
      const userId = req.user.userId;
      const designId = req.params.id;
      const { thumbnailData } = req.body;

      const design = await Design.findOne({ _id: designId, userId });
      if (!design) {
        return res.status(404).json({
          success: false,
          error: "Design not found",
          message: "Design not found or you don't have permission to edit it.",
          code: "DESIGN_NOT_FOUND",
        });
      }

      // Update thumbnail if provided
      if (thumbnailData) {
        design.thumbnail = thumbnailData;
        design.updatedAt = Date.now();
        await design.save();
      }

      res.status(200).json({
        success: true,
        data: design,
        message: "Thumbnail updated successfully",
      });
    } catch (error) {
      console.error("Error generating thumbnail:", error);
      next(error);
    }
  },

  // Fix corrupted designs - utility endpoint to repair canvasData issues
  async fixCorruptedDesigns(req, res, next) {
    try {
      const userId = req.user.userId;
      
      // Find all designs for the user
      const designs = await Design.find({ userId });
      let fixedCount = 0;
      let errors = [];

      for (const design of designs) {
        try {
          let needsUpdate = false;
          
          if (!design.canvasData) {
            // Design has no canvasData
            design.canvasData = JSON.stringify({
              version: "5.3.0",
              objects: [],
              background: "#ffffff"
            });
            needsUpdate = true;
          } else {
            // Test if canvasData can be parsed
            try {
              const parsedCanvasData = typeof design.canvasData === 'string' 
                ? JSON.parse(design.canvasData) 
                : design.canvasData;

              // Ensure objects array exists
              if (!parsedCanvasData.objects) {
                parsedCanvasData.objects = [];
                needsUpdate = true;
              }
              
              // Ensure version exists
              if (!parsedCanvasData.version) {
                parsedCanvasData.version = "5.3.0";
                needsUpdate = true;
              }
              
              if (needsUpdate) {
                design.canvasData = JSON.stringify(parsedCanvasData);
              }
            } catch (parseError) {
              // Invalid JSON - replace with default structure
              design.canvasData = JSON.stringify({
                version: "5.3.0",
                objects: [],
                background: "#ffffff"
              });
              needsUpdate = true;
            }
          }
          
          if (needsUpdate) {
            await design.save();
            fixedCount++;
          }
        } catch (error) {
          errors.push({
            designId: design._id,
            error: error.message
          });
        }
      }

      res.status(200).json({
        success: true,
        message: `Fixed ${fixedCount} designs`,
        data: {
          totalDesigns: designs.length,
          fixedCount,
          errors
        }
      });
    } catch (error) {
      console.error("Error fixing corrupted designs:", error);
      next(error);
    }
  },
};

module.exports = designController;
