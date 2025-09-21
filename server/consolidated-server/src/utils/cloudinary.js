const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadMediaToCloudinary = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: "auto",
      folder: "mocko-designs",
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      quality: "auto",
      fetch_format: "auto",
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(file.buffer);
  });
};

const deleteMediaFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw error;
  }
};

const getCloudinaryUrl = (publicId, transformations = {}) => {
  return cloudinary.url(publicId, {
    secure: true,
    ...transformations,
  });
};

// Generate optimized URLs for different use cases
const generateImageVariations = (publicId) => {
  return {
    original: getCloudinaryUrl(publicId),
    thumbnail: getCloudinaryUrl(publicId, {
      width: 150,
      height: 150,
      crop: "fill",
      quality: "auto",
    }),
    medium: getCloudinaryUrl(publicId, {
      width: 500,
      height: 500,
      crop: "limit",
      quality: "auto",
    }),
    large: getCloudinaryUrl(publicId, {
      width: 1200,
      height: 1200,
      crop: "limit",
      quality: "auto",
    }),
  };
};

module.exports = {
  uploadMediaToCloudinary,
  deleteMediaFromCloudinary,
  getCloudinaryUrl,
  generateImageVariations,
  cloudinary,
};
