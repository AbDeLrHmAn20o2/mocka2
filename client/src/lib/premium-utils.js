"use client";

/**
 * Utility functions for handling premium features
 */

/**
 * Check if user has premium access
 * @param {Object} userSubscription - User subscription object
 * @returns {boolean} - Whether user has premium access
 */
export function isPremiumUser(userSubscription) {
  return userSubscription?.isPremium === true;
}

/**
 * Check if user had premium subscription that expired
 * @param {Object} userSubscription - User subscription object
 * @returns {boolean} - Whether user had premium but it expired
 */
export function hasExpiredPremium(userSubscription) {
  return (
    userSubscription?.isPremium === false &&
    userSubscription?.premiumSince !== null &&
    userSubscription?.premiumSince !== undefined
  );
}

/**
 * Get subscription status information
 * @param {Object} userSubscription - User subscription object
 * @returns {Object} - Subscription status info
 */
export function getSubscriptionStatus(userSubscription) {
  if (isPremiumUser(userSubscription)) {
    return {
      status: "active",
      message: "Premium subscription active",
      showUpgrade: false,
    };
  } else if (hasExpiredPremium(userSubscription)) {
    return {
      status: "expired",
      message:
        "Premium subscription expired. Renew to continue enjoying premium features.",
      showUpgrade: true,
      isRenewal: true,
    };
  } else {
    return {
      status: "free",
      message: "Free account - Upgrade to unlock premium features",
      showUpgrade: true,
      isRenewal: false,
    };
  }
}

/**
 * Check if template requires premium access
 * @param {Object} template - Template object
 * @returns {boolean} - Whether template is premium
 */
export function isPremiumTemplate(template) {
  return template?.isPremium === true;
}

/**
 * Check if user can access a premium template
 * @param {Object} template - Template object
 * @param {Object} userSubscription - User subscription object
 * @returns {boolean} - Whether user can access the template
 */
export function canAccessTemplate(template, userSubscription) {
  if (!isPremiumTemplate(template)) {
    return true; // Free templates are always accessible
  }

  return isPremiumUser(userSubscription);
}

/**
 * Check if canvas data contains premium content
 * @param {string|Object} canvasData - Canvas data (string or parsed object)
 * @returns {boolean} - Whether canvas contains premium content
 */
export function containsPremiumContent(canvasData) {
  try {
    const data =
      typeof canvasData === "string" ? JSON.parse(canvasData) : canvasData;
    return data?.isPremium === true || data?.templateInfo?.isPremium === true;
  } catch (error) {
    console.warn("Error parsing canvas data for premium check:", error);
    return false; // If we can't parse, assume it's not premium
  }
}

/**
 * Get premium feature access message
 * @param {string} featureName - Name of the premium feature
 * @returns {Object} - Toast notification config
 */
export function getPremiumAccessMessage(featureName = "feature") {
  return {
    title: "Premium Feature",
    description: `This ${featureName} requires a Premium subscription to use.`,
    action: {
      label: "Upgrade to Premium",
      onClick: () => {
        // This will be handled by the component using this utility
        return { showPremiumModal: true };
      },
    },
  };
}

/**
 * Filter templates based on user subscription
 * @param {Array} templates - Array of template objects
 * @param {Object} userSubscription - User subscription object
 * @param {boolean} showPremiumOnly - Whether to show only premium templates
 * @returns {Array} - Filtered templates
 */
export function filterTemplatesBySubscription(
  templates,
  userSubscription,
  showPremiumOnly = false
) {
  if (showPremiumOnly) {
    return templates.filter((template) => isPremiumTemplate(template));
  }

  const isPremium = isPremiumUser(userSubscription);

  if (isPremium) {
    return templates; // Premium users can see all templates
  }

  // Free users can see all templates but premium ones will be restricted
  return templates;
}

/**
 * Get template categories with premium counts
 * @param {Array} templates - Array of template objects
 * @returns {Object} - Categories with counts
 */
export function getTemplateCategoriesWithCounts(templates) {
  const categories = {};

  templates.forEach((template) => {
    const category = template.category || "uncategorized";

    if (!categories[category]) {
      categories[category] = {
        total: 0,
        premium: 0,
        free: 0,
      };
    }

    categories[category].total++;

    if (isPremiumTemplate(template)) {
      categories[category].premium++;
    } else {
      categories[category].free++;
    }
  });

  return categories;
}
