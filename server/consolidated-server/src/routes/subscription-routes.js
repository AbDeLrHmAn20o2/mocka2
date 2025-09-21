const express = require("express");
const subscriptionController = require("../controllers/subscription-controller");
const paymentController = require("../controllers/payment-controller");
const authMiddleware = require("../middleware/auth-middleware");

const router = express.Router();

// Test endpoint without authentication for debugging PayPal
router.post(
  "/test-paypal",
  (req, res, next) => {
    // Mock user object for testing
    req.user = {
      userId: "test-user-123",
      email: "test@example.com",
      name: "Test User",
    };
    next();
  },
  paymentController.createOrder
);

// Apply authentication to all other subscription routes
router.use(authMiddleware);

// GET /api/v1/subscription - Get user subscription status
router.get("/", subscriptionController.getSubscription);

// POST /api/v1/subscription/create-subscription - Create new subscription (matches original)
router.post("/create-subscription", paymentController.createOrder);

// POST /api/v1/subscription/create-order - Create PayPal order
router.post("/create-order", paymentController.createOrder);

// POST /api/v1/subscription/capture-order - Capture PayPal payment
router.post("/capture-order", paymentController.capturePayment);

// POST /api/v1/subscription/cancel - Cancel subscription
router.post("/cancel", subscriptionController.cancelSubscription);

// POST /api/v1/subscription/reactivate - Reactivate subscription
router.post("/reactivate", subscriptionController.reactivateSubscription);

// GET /api/v1/subscription/billing-history - Get billing history
router.get("/billing-history", subscriptionController.getBillingHistory);

// PayPal webhook handler - temporarily disabled until webhook handling is implemented
// router.post("/webhook/paypal", paymentController.handlePayPalWebhook);

// Development/Testing routes (only available in non-production)
if (process.env.NODE_ENV !== "production") {
  // POST /api/v1/subscription/test/make-premium - Make user premium for testing
  router.post("/test/make-premium", subscriptionController.makePremiumTest);

  // POST /api/v1/subscription/test/remove-premium - Remove premium for testing
  router.post("/test/remove-premium", subscriptionController.removePremiumTest);

  // POST /api/v1/subscription/test/set-last-month - Set premium to last month for testing
  router.post(
    "/test/set-last-month",
    subscriptionController.setPremiumLastMonthTest
  );
}

module.exports = router;
