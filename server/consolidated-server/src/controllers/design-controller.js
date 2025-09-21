const Design = require("../models/design");
const { validationResult } = require("express-validator");

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
        .select("-canvasData"); // Don't include canvas data in list view for performance

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
        if (canvasData) design.canvasData = canvasData;
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
        const newDesign = new Design({
          userId,
          name: name.trim(),
          width,
          height,
          canvasData,
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
        canvasData: originalDesign.canvasData,
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
        .select("-canvasData");

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
};

module.exports = designController;
