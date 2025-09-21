const Subscription = require("../models/subscription");
const axios = require("axios");

const PAYPAL_API =
  process.env.NODE_ENV === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// PayPal API helper functions
async function getAccessToken() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("PayPal credentials not configured");
  }

  try {
    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
      "base64"
    );

    const response = await axios({
      method: "post",
      url: `${PAYPAL_API}/v1/oauth2/token`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${auth}`,
      },
      data: "grant_type=client_credentials",
      timeout: 10000,
    });

    return response.data.access_token;
  } catch (error) {
    console.error(
      "PayPal access token error:",
      error.response?.data || error.message
    );
    throw new Error("Failed to get PayPal access token");
  }
}

const paymentController = {
  // Create PayPal order (simple one-time payment - matches original)
  async createOrder(req, res) {
    try {
      const {
        amount = 60,
        currency = "USD",
        billingCycle = "monthly",
      } = req.body;

      const accessToken = await getAccessToken();

      const response = await axios({
        method: "post",
        url: `${PAYPAL_API}/v2/checkout/orders`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        data: {
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: currency,
                value: amount.toString(),
              },
              description: `Premium Design Subscription - ${billingCycle}`,
            },
          ],
          application_context: {
            return_url: `${FRONTEND_URL}/subscription/success`,
            cancel_url: `${FRONTEND_URL}/subscription/cancel`,
          },
        },
      });

      const order = response.data;
      const approvalLink = order.links.find(
        (link) => link.rel === "approve"
      ).href;

      res.status(200).json({
        success: true,
        data: {
          orderId: order.id,
          approvalLink,
        },
      });
    } catch (error) {
      console.error(
        "PayPal order creation error:",
        error.response?.data || error.message
      );
      res.status(500).json({
        success: false,
        message: "Error while creating paypal order",
        error: error.response?.data?.details || error.message,
      });
    }
  },

  // Create PayPal subscription (alias for createOrder to maintain compatibility)
  async createSubscription(req, res) {
    return this.createOrder(req, res);
  },

  // Capture PayPal payment (matches original)
  async capturePayment(req, res) {
    try {
      const { orderId } = req.body;
      const { userId } = req.user;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          error: "Missing order ID",
          message: "PayPal order ID is required",
          code: "MISSING_ORDER_ID",
        });
      }

      const accessToken = await getAccessToken();

      const response = await axios({
        method: "post",
        url: `${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const captureData = response.data;

      if (captureData.status !== "COMPLETED") {
        return res.status(400).json({
          success: false,
          error: "Payment not completed",
          message: "PayPal payment was not completed successfully",
          code: "PAYMENT_NOT_COMPLETED",
        });
      }

      const captureId = captureData.purchase_units[0].payments.captures[0].id;

      let subscription = await Subscription.findOne({ userId });

      if (!subscription) {
        subscription = new Subscription({ userId });
      }

      // Set premium with current date for monthly billing cycle
      const subscriptionDate = new Date();
      subscription.isPremium = true;
      subscription.premiumSince = subscriptionDate;
      subscription.paymentId = captureId;

      await subscription.save();

      console.log(
        `User ${userId} upgraded to premium. Subscription starts: ${subscriptionDate.toISOString()}`
      );

      res.status(200).json({
        success: true,
        data: {
          isPremium: true,
          premiumSince: subscriptionDate,
          paymentId: captureId,
          message: "Premium subscription activated successfully!",
        },
      });
    } catch (error) {
      console.error(
        "PayPal capture error:",
        error.response?.data || error.message
      );

      if (error.response?.status === 422) {
        return res.status(422).json({
          success: false,
          error: "Order cannot be captured",
          message:
            "This PayPal order cannot be captured. It may have already been processed.",
          code: "ORDER_NOT_CAPTURABLE",
        });
      }

      res.status(500).json({
        success: false,
        message: "Error while capturing paypal order",
      });
    }
  },

  // Verify payment (placeholder from original)
  async verifyPayment(req, res) {
    try {
      // Placeholder implementation
      res.status(200).json({
        success: true,
        message: "Payment verification endpoint",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error while verifying paypal payment",
      });
    }
  },
};

module.exports = paymentController;
