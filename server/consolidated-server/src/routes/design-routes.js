const express = require("express");
const designController = require("../controllers/design-controller");
const authMiddleware = require("../middleware/auth-middleware");

const router = express.Router();

// Apply authentication to all design routes
router.use(authMiddleware);

// GET /api/v1/designs - Get all user designs
router.get("/", designController.getUserDesigns);

// GET /api/v1/designs/:id - Get specific design by ID
router.get("/:id", designController.getUserDesignById);

// POST /api/v1/designs - Create or update design
router.post("/", designController.saveDesign);

// PUT /api/v1/designs/:id - Update specific design
router.put("/:id", designController.updateDesign);

// DELETE /api/v1/designs/:id - Delete specific design
router.delete("/:id", designController.deleteDesign);

// POST /api/v1/designs/:id/duplicate - Duplicate a design
router.post("/:id/duplicate", designController.duplicateDesign);

// GET /api/v1/designs/category/:category - Get designs by category
router.get("/category/:category", designController.getDesignsByCategory);

// POST /api/v1/designs/template - Create design from template
router.post("/template", designController.createFromTemplate);

// POST /api/v1/designs/:id/thumbnail - Generate/update thumbnail for a design
router.post("/:id/thumbnail", designController.generateThumbnail);

// POST /api/v1/designs/fix-corrupted - Fix corrupted designs (utility endpoint)
router.post("/fix-corrupted", designController.fixCorruptedDesigns);

module.exports = router;
