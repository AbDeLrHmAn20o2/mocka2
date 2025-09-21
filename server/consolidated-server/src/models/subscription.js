const mongoose = require("mongoose");

const SubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    isPremium: {
      type: Boolean,
      default: false,
      index: true,
    },
    paymentId: {
      type: String,
      required: false,
    },
    subscriptionId: {
      type: String,
      required: false,
    },
    premiumSince: {
      type: Date,
      required: false,
    },
    nextBillingDate: {
      type: Date,
      required: false,
    },
    plan: {
      type: String,
      enum: ["free", "premium", "pro"],
      default: "free",
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },
    paymentMethod: {
      type: String,
      enum: ["paypal", "stripe", "manual"],
      default: "paypal",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    cancelAt: {
      type: Date,
      required: false,
    },
    canceledAt: {
      type: Date,
      required: false,
    },
    trialEndsAt: {
      type: Date,
      required: false,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to update timestamp
SubscriptionSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for premium user queries
SubscriptionSchema.index({ isPremium: 1, isActive: 1 });

const Subscription =
  mongoose.models.Subscription ||
  mongoose.model("Subscription", SubscriptionSchema);

module.exports = Subscription;
