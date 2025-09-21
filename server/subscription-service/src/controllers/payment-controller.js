const Subscription = require("../models/subscription");
const axios = require("axios");

const PAYPAL_API =
  process.env.NODE_ENV === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

async function getAccessToken() {
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  const response = await axios({
    method: "post",
    url: `${PAYPAL_API}/v1/oauth2/token`,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    },
    data: "grant_type=client_credentials",
  });

  return response.data.access_token;
}

//create new paypal order here

exports.createOrder = async (req, res) => {
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
            description: "Premium Design Subscription - Monthly",
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
  } catch (e) {
    console.error(
      "PayPal order creation error:",
      e.response?.data || e.message
    );
    res.status(500).json({
      success: false,
      message: "Error while creating paypal order",
      error: e.response?.data?.details || e.message,
    });
  }
};

exports.capturePayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const { userId } = req.user;

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
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Error while capturing paypal order",
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Error while verifying paypal payment",
    });
  }
};
