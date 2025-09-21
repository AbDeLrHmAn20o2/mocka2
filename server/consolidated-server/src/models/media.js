const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 255,
    },
    cloudinaryId: {
      type: String,
      required: true,
      unique: true,
    },
    url: {
      type: String,
      required: true,
    },
    secureUrl: {
      type: String,
      required: false,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
      min: 0,
    },
    width: {
      type: Number,
      required: false,
      min: 0,
    },
    height: {
      type: Number,
      required: false,
      min: 0,
    },
    format: {
      type: String,
      required: false,
    },
    resourceType: {
      type: String,
      enum: ["image", "video", "raw", "auto"],
      default: "image",
    },
    folder: {
      type: String,
      default: "mocko-designs",
    },
    tags: [
      {
        type: String,
        maxlength: 30,
      },
    ],
    isPublic: {
      type: Boolean,
      default: false,
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
mediaSchema.index({ userId: 1, createdAt: -1 });
mediaSchema.index({ userId: 1, resourceType: 1 });

const Media = mongoose.models.Media || mongoose.model("Media", mediaSchema);
module.exports = Media;
