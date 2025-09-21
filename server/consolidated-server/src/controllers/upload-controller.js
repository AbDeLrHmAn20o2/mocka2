const {
  uploadMediaToCloudinary,
  deleteMediaFromCloudinary,
  generateImageVariations,
} = require("../utils/cloudinary");
const Media = require("../models/media");

const uploadController = {
  // Upload single media file
  async uploadMedia(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No file provided",
          message: "No file found in request",
          code: "NO_FILE",
        });
      }

      const { originalname, mimetype, size } = req.file;
      const { userId } = req.user;

      // Upload to Cloudinary
      const cloudinaryResult = await uploadMediaToCloudinary(req.file, {
        folder: `mocko-designs/${userId}`,
        resource_type: "auto",
      });

      // Generate image variations for different use cases
      const imageVariations = generateImageVariations(
        cloudinaryResult.public_id
      );

      // Create media record in database
      const newMedia = new Media({
        userId,
        name: originalname,
        cloudinaryId: cloudinaryResult.public_id,
        url: cloudinaryResult.secure_url,
        secureUrl: cloudinaryResult.secure_url,
        mimeType: mimetype,
        size,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        format: cloudinaryResult.format,
        resourceType: cloudinaryResult.resource_type,
        folder: cloudinaryResult.folder,
      });

      const savedMedia = await newMedia.save();

      res.status(201).json({
        success: true,
        data: {
          ...savedMedia.toObject(),
          variations: imageVariations,
        },
        message: "File uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading media:", error);
      next(error);
    }
  },

  // Upload multiple media files
  async uploadMultipleMedia(req, res, next) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No files provided",
          message: "No files found in request",
          code: "NO_FILES",
        });
      }

      const { userId } = req.user;
      const uploadPromises = req.files.map(async (file) => {
        try {
          const cloudinaryResult = await uploadMediaToCloudinary(file, {
            folder: `mocko-designs/${userId}`,
            resource_type: "auto",
          });

          const newMedia = new Media({
            userId,
            name: file.originalname,
            cloudinaryId: cloudinaryResult.public_id,
            url: cloudinaryResult.secure_url,
            secureUrl: cloudinaryResult.secure_url,
            mimeType: file.mimetype,
            size: file.size,
            width: cloudinaryResult.width,
            height: cloudinaryResult.height,
            format: cloudinaryResult.format,
            resourceType: cloudinaryResult.resource_type,
            folder: cloudinaryResult.folder,
          });

          return await newMedia.save();
        } catch (error) {
          console.error(`Error uploading file ${file.originalname}:`, error);
          return { error: error.message, filename: file.originalname };
        }
      });

      const results = await Promise.all(uploadPromises);
      const successful = results.filter((result) => !result.error);
      const failed = results.filter((result) => result.error);

      res.status(207).json({
        // 207 Multi-Status
        success: true,
        data: successful,
        failed: failed,
        message: `${successful.length} files uploaded successfully${
          failed.length > 0 ? `, ${failed.length} failed` : ""
        }`,
      });
    } catch (error) {
      console.error("Error uploading multiple media:", error);
      next(error);
    }
  },

  // Get all media for user
  async getAllMediasByUser(req, res, next) {
    try {
      const { userId } = req.user;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      const resourceType = req.query.type; // Filter by resource type

      const query = { userId };
      if (resourceType) {
        query.resourceType = resourceType;
      }

      const medias = await Media.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Media.countDocuments(query);

      res.status(200).json({
        success: true,
        data: medias,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: medias.length,
          totalItems: total,
        },
      });
    } catch (error) {
      console.error("Error fetching user media:", error);
      next(error);
    }
  },

  // Get media by ID
  async getMediaById(req, res, next) {
    try {
      const { id } = req.params;
      const { userId } = req.user;

      const media = await Media.findOne({ _id: id, userId });

      if (!media) {
        return res.status(404).json({
          success: false,
          error: "Media not found",
          message: "Media not found or you don't have permission to view it",
          code: "MEDIA_NOT_FOUND",
        });
      }

      // Generate image variations for display
      const imageVariations = generateImageVariations(media.cloudinaryId);

      res.status(200).json({
        success: true,
        data: {
          ...media.toObject(),
          variations: imageVariations,
        },
      });
    } catch (error) {
      console.error("Error fetching media by ID:", error);
      next(error);
    }
  },

  // Delete media
  async deleteMedia(req, res, next) {
    try {
      const { id } = req.params;
      const { userId } = req.user;

      const media = await Media.findOne({ _id: id, userId });

      if (!media) {
        return res.status(404).json({
          success: false,
          error: "Media not found",
          message: "Media not found or you don't have permission to delete it",
          code: "MEDIA_NOT_FOUND",
        });
      }

      // Delete from Cloudinary
      try {
        await deleteMediaFromCloudinary(media.cloudinaryId);
      } catch (cloudinaryError) {
        console.warn("Failed to delete from Cloudinary:", cloudinaryError);
        // Continue with database deletion even if Cloudinary deletion fails
      }

      // Delete from database
      await Media.deleteOne({ _id: id });

      res.status(200).json({
        success: true,
        message: "Media deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting media:", error);
      next(error);
    }
  },

  // Search media
  async searchMedia(req, res, next) {
    try {
      const { query } = req.params;
      const { userId } = req.user;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const searchQuery = {
        userId,
        $or: [
          { name: { $regex: query, $options: "i" } },
          { tags: { $regex: query, $options: "i" } },
        ],
      };

      const medias = await Media.find(searchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Media.countDocuments(searchQuery);

      res.status(200).json({
        success: true,
        data: medias,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: medias.length,
          totalItems: total,
        },
      });
    } catch (error) {
      console.error("Error searching media:", error);
      next(error);
    }
  },

  // Update media metadata
  async updateMediaMetadata(req, res, next) {
    try {
      const { id } = req.params;
      const { userId } = req.user;
      const { name, tags, isPublic } = req.body;

      const media = await Media.findOne({ _id: id, userId });

      if (!media) {
        return res.status(404).json({
          success: false,
          error: "Media not found",
          message: "Media not found or you don't have permission to update it",
          code: "MEDIA_NOT_FOUND",
        });
      }

      // Update allowed fields
      if (name) media.name = name;
      if (tags) media.tags = tags;
      if (isPublic !== undefined) media.isPublic = isPublic;

      const updatedMedia = await media.save();

      res.status(200).json({
        success: true,
        data: updatedMedia,
        message: "Media updated successfully",
      });
    } catch (error) {
      console.error("Error updating media metadata:", error);
      next(error);
    }
  },

  // Validate AI request middleware
  validateAIRequest(req, res, next) {
    const { prompt } = req.body;

    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid prompt",
        message: "AI image prompt is required",
        code: "MISSING_PROMPT",
      });
    }

    if (prompt.length > 1000) {
      return res.status(400).json({
        success: false,
        error: "Prompt too long",
        message: "AI image prompt must be less than 1000 characters",
        code: "PROMPT_TOO_LONG",
      });
    }

    next();
  },
};

module.exports = uploadController;
