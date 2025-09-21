const Subscription = require("../models/subscription");

// Helper function to check if subscription has expired
const isSubscriptionExpired = (premiumSince) => {
  if (!premiumSince) return true;

  const now = new Date();
  const subscriptionDate = new Date(premiumSince);

  // Calculate the difference in months
  const monthsDiff =
    (now.getFullYear() - subscriptionDate.getFullYear()) * 12 +
    (now.getMonth() - subscriptionDate.getMonth());

  // Check if we're past the subscription day in the current month
  const dayDiff = now.getDate() - subscriptionDate.getDate();

  // Expired if more than 1 month has passed, or exactly 1 month and we're past the subscription day
  const isExpired = monthsDiff > 1 || (monthsDiff === 1 && dayDiff >= 0);

  if (isExpired) {
    console.log(
      `Subscription expired: Started ${subscriptionDate.toDateString()}, checked ${now.toDateString()}, ${monthsDiff} months + ${dayDiff} days`
    );
  }

  return isExpired;
};

exports.getSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log("Current User ID:", userId); // Log user ID for testing

    let subscription = await Subscription.findOne({ userId });

    if (!subscription) {
      subscription = new Subscription({ userId });
    }

    // Check if premium subscription has expired (monthly subscription)
    let isPremiumActive = subscription.isPremium;
    let subscriptionMessage = null;

    if (
      subscription.isPremium &&
      isSubscriptionExpired(subscription.premiumSince)
    ) {
      console.log(
        `Subscription expired for user ${userId}. Premium since: ${subscription.premiumSince}`
      );

      // Automatically expire the subscription
      subscription.isPremium = false;
      // Keep premiumSince and paymentId for billing history
      await subscription.save();

      isPremiumActive = false;
      subscriptionMessage =
        "Your premium subscription has expired. Please renew to continue enjoying premium features.";
    }

    return res.status(200).json({
      success: true,
      data: {
        isPremium: isPremiumActive,
        premiumSince: subscription.premiumSince,
        userId: userId, // Return user ID for testing
        message: subscriptionMessage,
      },
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Some error occured",
    });
  }
};
