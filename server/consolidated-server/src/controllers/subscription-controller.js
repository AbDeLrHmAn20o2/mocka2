const Subscription = require("../models/subscription");

// Helper function to check if subscription has expired
const isSubscriptionExpired = (premiumSince, billingCycle = "monthly") => {
  if (!premiumSince) return true;

  const now = new Date();
  const subscriptionDate = new Date(premiumSince);

  if (billingCycle === "yearly") {
    // For yearly subscriptions
    const yearsDiff = now.getFullYear() - subscriptionDate.getFullYear();
    const monthDiff = now.getMonth() - subscriptionDate.getMonth();
    const dayDiff = now.getDate() - subscriptionDate.getDate();

    return (
      yearsDiff > 1 ||
      (yearsDiff === 1 && (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)))
    );
  } else {
    // For monthly subscriptions
    const monthsDiff =
      (now.getFullYear() - subscriptionDate.getFullYear()) * 12 +
      (now.getMonth() - subscriptionDate.getMonth());

    const dayDiff = now.getDate() - subscriptionDate.getDate();
    const isExpired = monthsDiff > 1 || (monthsDiff === 1 && dayDiff >= 0);

    if (isExpired) {
      console.log(
        `Subscription expired: Started ${subscriptionDate.toDateString()}, checked ${now.toDateString()}, ${monthsDiff} months + ${dayDiff} days`
      );
    }

    return isExpired;
  }
};

const subscriptionController = {
  // Get user subscription status
  async getSubscription(req, res, next) {
    try {
      const userId = req.user.userId;
      console.log("Getting subscription for user ID:", userId);

      let subscription = await Subscription.findOne({ userId });

      if (!subscription) {
        // Create default free subscription
        subscription = new Subscription({
          userId,
          plan: "free",
          isActive: true,
        });
        await subscription.save();
      }

      // Check if premium subscription has expired
      let isPremiumActive = subscription.isPremium && subscription.isActive;
      let subscriptionMessage = null;
      let nextBillingDate = null;

      if (subscription.isPremium && subscription.premiumSince) {
        const isExpired = isSubscriptionExpired(
          subscription.premiumSince,
          subscription.billingCycle
        );

        if (isExpired) {
          console.log(
            `Subscription expired for user ${userId}. Premium since: ${subscription.premiumSince}`
          );

          // Automatically expire the subscription but keep history
          subscription.isPremium = false;
          subscription.isActive = false;
          subscription.canceledAt = new Date();
          await subscription.save();

          isPremiumActive = false;
          subscriptionMessage =
            "Your premium subscription has expired. Please renew to continue enjoying premium features.";
        } else {
          // Calculate next billing date
          const premiumDate = new Date(subscription.premiumSince);
          if (subscription.billingCycle === "yearly") {
            nextBillingDate = new Date(
              premiumDate.setFullYear(premiumDate.getFullYear() + 1)
            );
          } else {
            nextBillingDate = new Date(
              premiumDate.setMonth(premiumDate.getMonth() + 1)
            );
          }
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          isPremium: isPremiumActive,
          premiumSince: subscription.premiumSince,
          nextBillingDate,
          plan: subscription.plan,
          billingCycle: subscription.billingCycle,
          isActive: subscription.isActive,
          userId: userId,
          message: subscriptionMessage,
        },
      });
    } catch (error) {
      console.error("Error getting subscription:", error);
      next(error);
    }
  },

  // Cancel subscription
  async cancelSubscription(req, res, next) {
    try {
      const userId = req.user.userId;
      const { reason } = req.body;

      const subscription = await Subscription.findOne({ userId });

      if (!subscription || !subscription.isPremium) {
        return res.status(404).json({
          success: false,
          error: "No active subscription",
          message: "No active premium subscription found to cancel",
          code: "NO_ACTIVE_SUBSCRIPTION",
        });
      }

      // Set cancellation but keep access until period ends
      subscription.cancelAt = subscription.nextBillingDate || new Date();
      subscription.metadata = {
        ...subscription.metadata,
        cancelReason: reason,
        canceledOn: new Date(),
      };

      await subscription.save();

      res.status(200).json({
        success: true,
        message:
          "Subscription will be canceled at the end of the current billing period",
        data: {
          cancelAt: subscription.cancelAt,
          remainingDays: Math.ceil(
            (subscription.cancelAt - new Date()) / (1000 * 60 * 60 * 24)
          ),
        },
      });
    } catch (error) {
      console.error("Error canceling subscription:", error);
      next(error);
    }
  },

  // Reactivate subscription
  async reactivateSubscription(req, res, next) {
    try {
      const userId = req.user.userId;

      const subscription = await Subscription.findOne({ userId });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: "Subscription not found",
          message: "No subscription found for this user",
          code: "SUBSCRIPTION_NOT_FOUND",
        });
      }

      if (subscription.isPremium && subscription.isActive) {
        return res.status(400).json({
          success: false,
          error: "Already active",
          message: "Subscription is already active",
          code: "ALREADY_ACTIVE",
        });
      }

      // Reactivate subscription
      subscription.isActive = true;
      subscription.cancelAt = null;
      subscription.canceledAt = null;

      await subscription.save();

      res.status(200).json({
        success: true,
        message: "Subscription reactivated successfully",
        data: subscription,
      });
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      next(error);
    }
  },

  // Get billing history
  async getBillingHistory(req, res, next) {
    try {
      const userId = req.user.userId;

      const subscription = await Subscription.findOne({ userId });

      if (!subscription) {
        return res.status(200).json({
          success: true,
          data: [],
          message: "No billing history found",
        });
      }

      // In a real implementation, you'd have a separate payments/transactions table
      // For now, return basic subscription info
      const history = [
        {
          date: subscription.premiumSince,
          amount: subscription.billingCycle === "yearly" ? 600 : 60, // $600/year or $60/month
          currency: "USD",
          status: "completed",
          paymentId: subscription.paymentId,
          plan: subscription.plan,
          billingCycle: subscription.billingCycle,
        },
      ].filter((item) => item.date); // Only include if there's a payment date

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      console.error("Error getting billing history:", error);
      next(error);
    }
  },

  // Development/Testing functions
  async makePremiumTest(req, res, next) {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        success: false,
        error: "Not allowed in production",
        code: "PRODUCTION_FORBIDDEN",
      });
    }

    try {
      const userId = req.user.userId;

      let subscription = await Subscription.findOne({ userId });
      if (!subscription) {
        subscription = new Subscription({ userId });
      }

      subscription.isPremium = true;
      subscription.premiumSince = new Date();
      subscription.plan = "premium";
      subscription.billingCycle = "monthly";
      subscription.isActive = true;
      subscription.paymentId = `test-${Date.now()}`;

      await subscription.save();

      res.status(200).json({
        success: true,
        message: "User made premium for testing",
        data: subscription,
      });
    } catch (error) {
      console.error("Error making user premium (test):", error);
      next(error);
    }
  },

  async removePremiumTest(req, res, next) {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        success: false,
        error: "Not allowed in production",
        code: "PRODUCTION_FORBIDDEN",
      });
    }

    try {
      const userId = req.user.userId;

      const subscription = await Subscription.findOne({ userId });
      if (subscription) {
        subscription.isPremium = false;
        subscription.plan = "free";
        subscription.isActive = true;
        subscription.canceledAt = new Date();
        await subscription.save();
      }

      res.status(200).json({
        success: true,
        message: "Premium status removed for testing",
        data: subscription,
      });
    } catch (error) {
      console.error("Error removing premium (test):", error);
      next(error);
    }
  },

  async setPremiumLastMonthTest(req, res, next) {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        success: false,
        error: "Not allowed in production",
        code: "PRODUCTION_FORBIDDEN",
      });
    }

    try {
      const userId = req.user.userId;

      let subscription = await Subscription.findOne({ userId });
      if (!subscription) {
        subscription = new Subscription({ userId });
      }

      // Set premium to last month to test expiration
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      subscription.isPremium = true;
      subscription.premiumSince = lastMonth;
      subscription.plan = "premium";
      subscription.billingCycle = "monthly";
      subscription.isActive = true;
      subscription.paymentId = `test-expired-${Date.now()}`;

      await subscription.save();

      res.status(200).json({
        success: true,
        message: "Premium set to last month for expiration testing",
        data: subscription,
      });
    } catch (error) {
      console.error("Error setting premium to last month (test):", error);
      next(error);
    }
  },
};

module.exports = subscriptionController;
