const axios = require("axios");
const {
  uploadMediaToCloudinary,
  generateImageVariations,
} = require("../utils/cloudinary");
const Media = require("../models/media");

// Use OpenAI DALL-E as the primary AI image generator (more reliable than Stability AI)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const STABILITY_API_KEY = process.env.STABILITY_API_KEY;

const aiImageController = {
  async generateImageFromAIAndUploadToDB(req, res, next) {
    try {
      const { prompt, style = "natural", size = "1024x1024" } = req.body;
      const { userId } = req.user;

      console.log(
        `AI Image Generation Request - User: ${userId}, Prompt: ${prompt}`
      );

      let imageUrl = null;
      let generatedImage = null;

      // Try OpenAI DALL-E first (more reliable)
      if (OPENAI_API_KEY) {
        try {
          const openaiResponse = await axios.post(
            "https://api.openai.com/v1/images/generations",
            {
              prompt: prompt,
              model: "dall-e-3",
              n: 1,
              size: size,
              quality: "standard",
              style: style,
            },
            {
              headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json",
              },
              timeout: 60000, // 1 minute timeout
            }
          );

          if (openaiResponse.data.data && openaiResponse.data.data[0]) {
            imageUrl = openaiResponse.data.data[0].url;
            console.log("✅ Image generated using OpenAI DALL-E");
          }
        } catch (openaiError) {
          console.warn(
            "⚠️ OpenAI DALL-E failed, trying Stability AI:",
            openaiError.message
          );
        }
      }

      // Fallback to Stability AI if OpenAI fails or isn't configured
      if (!imageUrl && STABILITY_API_KEY) {
        try {
          const stabilityResponse = await axios.post(
            `https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image`,
            {
              text_prompts: [{ text: prompt }],
              height: 1024,
              width: 1024,
              steps: 30,
              samples: 1,
              cfg_scale: 7,
            },
            {
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${STABILITY_API_KEY}`,
              },
              timeout: 60000,
            }
          );

          generatedImage = stabilityResponse.data.artifacts[0];
          if (generatedImage) {
            console.log("✅ Image generated using Stability AI");
          }
        } catch (stabilityError) {
          console.error("❌ Stability AI also failed:", stabilityError.message);
          throw new Error("Both AI services failed to generate image");
        }
      }

      if (!imageUrl && !generatedImage) {
        return res.status(503).json({
          success: false,
          error: "AI service unavailable",
          message:
            "AI image generation services are currently unavailable. Please try again later.",
          code: "AI_SERVICE_UNAVAILABLE",
        });
      }

      let imageBuffer;
      let filename;

      if (imageUrl) {
        // Download image from OpenAI URL
        const imageResponse = await axios.get(imageUrl, {
          responseType: "arraybuffer",
          timeout: 30000,
        });
        imageBuffer = Buffer.from(imageResponse.data);
        filename = `ai-openai-${Date.now()}.png`;
      } else {
        // Convert base64 from Stability AI
        imageBuffer = Buffer.from(generatedImage.base64, "base64");
        filename = `ai-stability-${Date.now()}.png`;
      }

      // Create file object for Cloudinary upload
      const file = {
        buffer: imageBuffer,
        originalname: filename,
        mimetype: "image/png",
        size: imageBuffer.length,
      };

      // Upload to Cloudinary
      const cloudinaryResult = await uploadMediaToCloudinary(file, {
        folder: `mocko-designs/${userId}/ai-generated`,
        resource_type: "image",
        tags: ["ai-generated", "dall-e", "stability-ai"],
      });

      // Generate image variations
      const imageVariations = generateImageVariations(
        cloudinaryResult.public_id
      );

      // Save to database
      const newMedia = new Media({
        userId,
        name: `AI: ${prompt.substring(0, 50)}${
          prompt.length > 50 ? "..." : ""
        }`,
        cloudinaryId: cloudinaryResult.public_id,
        url: cloudinaryResult.secure_url,
        secureUrl: cloudinaryResult.secure_url,
        mimeType: "image/png",
        size: imageBuffer.length,
        width: cloudinaryResult.width || 1024,
        height: cloudinaryResult.height || 1024,
        format: cloudinaryResult.format,
        resourceType: "image",
        folder: cloudinaryResult.folder,
        tags: ["ai-generated"],
      });

      const savedMedia = await newMedia.save();

      res.status(201).json({
        success: true,
        data: {
          ...savedMedia.toObject(),
          variations: imageVariations,
        },
        metadata: {
          prompt,
          service: imageUrl ? "openai" : "stability",
          seed: generatedImage?.seed,
          style,
          size,
        },
        message: "AI image generated and uploaded successfully",
      });
    } catch (error) {
      console.error("AI Image Generation Error:", error);

      if (error.code === "ECONNABORTED") {
        return res.status(408).json({
          success: false,
          error: "Request timeout",
          message:
            "AI image generation took too long. Please try again with a simpler prompt.",
          code: "AI_TIMEOUT",
        });
      }

      if (error.response?.status === 429) {
        return res.status(429).json({
          success: false,
          error: "Rate limit exceeded",
          message:
            "Too many AI generation requests. Please wait before trying again.",
          code: "AI_RATE_LIMIT",
        });
      }

      if (error.response?.status === 400) {
        return res.status(400).json({
          success: false,
          error: "Invalid prompt",
          message:
            "The AI service rejected your prompt. Please try a different prompt.",
          code: "AI_INVALID_PROMPT",
        });
      }

      next(error);
    }
  },
};

module.exports = aiImageController;
