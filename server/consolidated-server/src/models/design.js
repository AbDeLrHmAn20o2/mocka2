const mongoose = require("mongoose");

const DesignSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 100,
    },
    canvasData: {
      type: String,
      required: false,
    },
    width: {
      type: Number,
      required: true,
      min: 1,
      max: 10000,
    },
    height: {
      type: Number,
      required: true,
      min: 1,
      max: 10000,
    },
    category: {
      type: String,
      default: "General",
      maxlength: 50,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    tags: [
      {
        type: String,
        maxlength: 30,
      },
    ],
    thumbnail: {
      type: String,
      required: false,
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

// Compound index for user queries
DesignSchema.index({ userId: 1, updatedAt: -1 });
DesignSchema.index({ userId: 1, category: 1 });

// Pre-save middleware to update timestamp
DesignSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Design = mongoose.models.Design || mongoose.model("Design", DesignSchema);
module.exports = Design;
