const express = require("express");
const multer = require("multer");
const uploadController = require("../controllers/upload-controller");
const aiImageController = require("../controllers/ai-image-controller");
const authMiddleware = require("../middleware/auth-middleware");

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 5, // Maximum 5 files per request
  },
  fileFilter: (req, file, cb) => {
    // Allow images and common design file formats
    const allowedMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "application/pdf",
      "application/json", // For canvas data
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  },
});

// Apply authentication to all media routes
router.use(authMiddleware);

// POST /api/v1/media/upload - Upload single file
router.post(
  "/upload",
  (req, res, next) => {
    upload.single("file")(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            error: "File too large",
            message: "File size must be less than 50MB",
            code: "FILE_TOO_LARGE",
          });
        }
        return res.status(400).json({
          success: false,
          error: "Upload error",
          message: err.message,
          code: "UPLOAD_ERROR",
        });
      } else if (err) {
        return res.status(500).json({
          success: false,
          error: "Server error",
          message: err.message,
          code: "SERVER_ERROR",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No file provided",
          message: "No file found in request",
          code: "NO_FILE",
        });
      }

      next();
    });
  },
  uploadController.uploadMedia
);

// POST /api/v1/media/upload/multiple - Upload multiple files
router.post(
  "/upload/multiple",
  upload.array("files", 5), // Maximum 5 files
  uploadController.uploadMultipleMedia
);

// GET /api/v1/media - Get all user media
router.get("/", uploadController.getAllMediasByUser);

// GET /api/v1/media/:id - Get specific media by ID
router.get("/:id", uploadController.getMediaById);

// DELETE /api/v1/media/:id - Delete specific media
router.delete("/:id", uploadController.deleteMedia);

// POST /api/v1/media/ai-image-generate - Generate AI image
router.post(
  "/ai-image-generate",
  uploadController.validateAIRequest,
  aiImageController.generateImageFromAIAndUploadToDB
);

// GET /api/v1/media/search/:query - Search media by name/tags
router.get("/search/:query", uploadController.searchMedia);

// PUT /api/v1/media/:id - Update media metadata
router.put("/:id", uploadController.updateMediaMetadata);

module.exports = router;
