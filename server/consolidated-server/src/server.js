require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

// Import routes
const designRoutes = require("./routes/design-routes");
const uploadRoutes = require("./routes/upload-routes");
const subscriptionRoutes = require("./routes/subscription-routes");
const healthRoutes = require("./routes/health-routes");
const paypalTestRoutes = require("./routes/paypal-test-routes");

// Import middleware
const errorHandler = require("./middleware/error-handler");
const requestLogger = require("./middleware/request-logger");

const app = express();
const PORT = process.env.PORT || 5000;

// Global error handlers for process
process.on("uncaughtException", (error) => {
  console.error("🚨 Uncaught Exception:", error);
  console.error("Stack trace:", error.stack);
  // Don't exit the process in production - log and continue
  if (process.env.NODE_ENV !== "production") {
    process.exit(1);
  }
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(
    "🚨 Unhandled Promise Rejection at:",
    promise,
    "reason:",
    reason
  );
  // Don't exit the process in production - log and continue
  if (process.env.NODE_ENV !== "production") {
    process.exit(1);
  }
});

// Graceful shutdown handlers
process.on("SIGTERM", () => {
  console.log("📋 SIGTERM received, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("📋 SIGINT received, shutting down gracefully...");
  process.exit(0);
});

// Database connection with retry logic
const connectToDatabase = async () => {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 0,
        maxIdleTimeMS: 30000,
        bufferCommands: false,
        retryWrites: true,
        retryReads: true,
      });
      console.log("✅ Connected to MongoDB");
      break;
    } catch (error) {
      retries++;
      console.error(
        `❌ MongoDB connection attempt ${retries} failed:`,
        error.message
      );
      if (retries === maxRetries) {
        console.error("💀 Max retries reached. Exiting...");
        process.exit(1);
      }
      // Wait before retrying (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, retries) * 1000)
      );
    }
  }
};

// Initialize database connection
connectToDatabase();

// Rate limiting for production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 1000 : 10000, // Limit each IP to 1000 requests per windowMs in production
  message: {
    error: "Too many requests",
    message: "Too many requests from this IP, please try again later",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security and performance middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false, // Allow for file uploads and external resources
  })
);

app.use(compression()); // Enable gzip compression

// CORS configuration for international access
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests from any origin in development
    if (process.env.NODE_ENV === "development") {
      return callback(null, true);
    }

    // Production CORS configuration
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      process.env.FRONTEND_URL_PRODUCTION,
      "https://mocko-designs.vercel.app",
      "https://www.mocko-designs.com",
      // Add your production domains
    ].filter(Boolean);

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Cache-Control",
    "X-Request-ID",
    "x-request-timestamp",
    "Accept-Language",
  ],
  exposedHeaders: ["X-Request-ID"],
  maxAge: 86400, // Cache preflight response for 24 hours
};

app.use(cors(corsOptions));
app.use(limiter);

// Body parsing middleware with increased limits for file uploads
app.use(
  express.json({
    limit: "50mb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "50mb",
  })
);

// Request logging middleware
app.use(requestLogger);

// Trust proxy for accurate IP addresses in production
app.set("trust proxy", 1);

// Health check endpoint (should be before authentication)
app.use("/health", healthRoutes);
app.use("/api/health", healthRoutes);

// PayPal test endpoint (for debugging)
app.use("/paypal", paypalTestRoutes);

// Primary API routes (what frontend expects)
app.use("/v1/designs", designRoutes);
app.use("/v1/media", uploadRoutes);
app.use("/v1/subscription", subscriptionRoutes);

// Alternative API routes with versioning
app.use("/api/v1/designs", designRoutes);
app.use("/api/v1/media", uploadRoutes);
app.use("/api/v1/subscription", subscriptionRoutes);

// Legacy API routes for backward compatibility
app.use("/api/designs", designRoutes);
app.use("/api/media", uploadRoutes);
app.use("/api/subscription", subscriptionRoutes);

// API info endpoint
app.get("/api", (req, res) => {
  res.json({
    name: "Mocko Designs API",
    version: "2.0.0",
    description:
      "Consolidated backend for design, upload, and subscription services",
    endpoints: {
      health: "/health",
      designs: "/api/v1/designs",
      media: "/api/v1/media",
      subscription: "/api/v1/subscription",
    },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// 404 handler for undefined routes
app.use("*", (req, res) => {
  console.log(`❓ Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: "Route not found",
    code: "NOT_FOUND",
    message: `The requested route ${req.method} ${req.originalUrl} was not found`,
    timestamp: new Date().toISOString(),
    availableRoutes: [
      "GET /health",
      "GET /api",
      "GET /api/v1/designs",
      "POST /api/v1/designs",
      "GET /api/v1/media",
      "POST /api/v1/media/upload",
      "GET /api/v1/subscription",
    ],
  });
});

// Global error handling middleware (must be last)
app.use(errorHandler);

// Start server with enhanced error handling
const server = app.listen(PORT, () => {
  console.log("🚀 ====================================");
  console.log(`🚀 Mocko Designs Backend Server Started`);
  console.log(`🚀 ====================================`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🗄️  Database: ${process.env.MONGO_URI ? "Connected" : "Not configured"}`
  );
  console.log(
    `🌐 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`
  );
  console.log(
    `☁️  Cloudinary: ${
      process.env.CLOUDINARY_CLOUD_NAME ? "Configured" : "Not configured"
    }`
  );
  console.log(
    `💳 PayPal: ${
      process.env.PAYPAL_CLIENT_ID ? "Configured" : "Not configured"
    }`
  );
  console.log(
    `🔐 Google Auth: ${
      process.env.GOOGLE_CLIENT_ID ? "Configured" : "Not configured"
    }`
  );
  console.log("🚀 ====================================");
  console.log(`🔗 API Documentation: http://localhost:${PORT}/api`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
  console.log("🚀 ====================================");
});

// Server error handling
server.on("error", (error) => {
  console.error("🚨 Server error:", error);
  if (error.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use`);
    console.error(
      "💡 Try running: npm run stop or change the PORT environment variable"
    );
  }
});

// Graceful server shutdown
const gracefulShutdown = () => {
  console.log("🛑 Graceful shutdown initiated...");
  server.close(() => {
    console.log("🚪 HTTP server closed");
    mongoose.connection.close(false, () => {
      console.log("🗄️ MongoDB connection closed");
      process.exit(0);
    });
  });
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Export for testing
module.exports = app;
