const express = require("express");
const axios = require("axios");

const router = express.Router();

// Test PayPal credentials endpoint
router.get("/test", async (req, res) => {
  try {
    const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
    const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
    const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL;

    // Debug info (without exposing full secrets)
    const debugInfo = {
      hasClientId: !!CLIENT_ID,
      hasClientSecret: !!CLIENT_SECRET,
      hasBaseUrl: !!PAYPAL_BASE_URL,
      clientIdLength: CLIENT_ID ? CLIENT_ID.length : 0,
      clientSecretLength: CLIENT_SECRET ? CLIENT_SECRET.length : 0,
      baseUrl: PAYPAL_BASE_URL,
      environment: process.env.NODE_ENV,
    };

    if (!CLIENT_ID || !CLIENT_SECRET) {
      return res.status(400).json({
        success: false,
        error: "PayPal credentials not configured",
        debug: debugInfo
      });
    }

    // Test the actual PayPal API call
    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
    
    const response = await axios({
      method: "post",
      url: `${PAYPAL_BASE_URL}/v1/oauth2/token`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${auth}`,
      },
      data: "grant_type=client_credentials",
      timeout: 10000,
    });

    res.json({
      success: true,
      message: "PayPal credentials are working!",
      debug: debugInfo,
      tokenReceived: !!response.data.access_token
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
      debug: {
        hasClientId: !!process.env.PAYPAL_CLIENT_ID,
        hasClientSecret: !!process.env.PAYPAL_CLIENT_SECRET,
        hasBaseUrl: !!process.env.PAYPAL_BASE_URL,
        clientIdLength: process.env.PAYPAL_CLIENT_ID ? process.env.PAYPAL_CLIENT_ID.length : 0,
        clientSecretLength: process.env.PAYPAL_CLIENT_SECRET ? process.env.PAYPAL_CLIENT_SECRET.length : 0,
        baseUrl: process.env.PAYPAL_BASE_URL,
        environment: process.env.NODE_ENV,
      }
    });
  }
});

module.exports = router;