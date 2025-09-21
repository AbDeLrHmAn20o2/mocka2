import { fetchWithAuth } from "./base-service";

// Subscription configuration
export const SUBSCRIPTION_CONFIG = {
  price: 60, // $60 per month
  currency: "USD",
  billingCycle: "monthly",
  features: {
    unlimitedDesigns: true,
    premiumTemplates: true,
    exportFeatures: true,
    prioritySupport: true,
  },
};

export async function getUserSubscription() {
  try {
    return await fetchWithAuth(`/v1/subscription`);
  } catch (error) {
    console.warn("Subscription service error:", error);
    // Return default free subscription if service is unavailable
    return {
      success: true,
      data: {
        isPremium: false,
        premiumSince: null,
        nextBillingDate: null,
      },
    };
  }
}

// Create PayPal subscription (monthly billing)
export async function createPaypalSubscription() {
  try {
    return await fetchWithAuth(`/v1/subscription/create-subscription`, {
      method: "POST",
      body: {
        amount: SUBSCRIPTION_CONFIG.price,
        currency: SUBSCRIPTION_CONFIG.currency,
        billingCycle: SUBSCRIPTION_CONFIG.billingCycle,
      },
    });
  } catch (error) {
    console.error("PayPal subscription creation error:", error);
    throw new Error(
      "Unable to create PayPal subscription. Please try again later."
    );
  }
}

// Create PayPal order (alternative endpoint)
export async function createPaypalOrder() {
  try {
    return await fetchWithAuth(`/v1/subscription/create-order`, {
      method: "POST",
      body: {
        amount: SUBSCRIPTION_CONFIG.price,
        currency: SUBSCRIPTION_CONFIG.currency,
      },
    });
  } catch (error) {
    console.error("PayPal order creation error:", error);
    throw new Error("Unable to create PayPal order. Please try again later.");
  }
}

// Capture PayPal payment and activate subscription
export async function capturePaypalOrder(orderId) {
  return fetchWithAuth(`/v1/subscription/capture-order`, {
    method: "POST",
    body: {
      orderId,
    },
  });
}

// Cancel subscription
export async function cancelSubscription() {
  return fetchWithAuth(`/v1/subscription/cancel`, {
    method: "POST",
  });
}

// Check subscription status
export async function checkSubscriptionStatus() {
  return fetchWithAuth(`/v1/subscription/status`);
}

// Get subscription billing history
export async function getBillingHistory() {
  return fetchWithAuth(`/v1/subscription/billing-history`);
}
