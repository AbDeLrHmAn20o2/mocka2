const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

// Health check endpoint
router.get("/", async (req, res) => {
  const healthCheck = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: "2.0.0",
    services: {
      api: "operational",
      database: "checking...",
      cloudinary: process.env.CLOUDINARY_CLOUD_NAME
        ? "configured"
        : "not configured",
      paypal: process.env.PAYPAL_CLIENT_ID ? "configured" : "not configured",
      googleAuth: process.env.GOOGLE_CLIENT_ID
        ? "configured"
        : "not configured",
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + " MB",
    },
  };

  try {
    // Check database connection
    const dbState = mongoose.connection.readyState;
    const dbStatus = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    healthCheck.services.database = dbStatus[dbState] || "unknown";

    if (dbState === 1) {
      // If connected, test with a simple query
      await mongoose.connection.db.admin().ping();
      healthCheck.services.database = "operational";
    }

    res.status(200).json(healthCheck);
  } catch (error) {
    console.error("Health check database error:", error);
    healthCheck.status = "degraded";
    healthCheck.services.database = "error";
    healthCheck.error = error.message;

    res.status(503).json(healthCheck);
  }
});

// Detailed health check for monitoring systems
router.get("/detailed", async (req, res) => {
  const startTime = Date.now();

  const detailedCheck = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    responseTime: 0,
    checks: {
      database: { status: "checking...", responseTime: 0 },
      memory: { status: "checking...", usage: 0 },
      disk: { status: "checking...", available: "unknown" },
    },
  };

  try {
    // Database check
    const dbStartTime = Date.now();
    await mongoose.connection.db.admin().ping();
    detailedCheck.checks.database = {
      status: "healthy",
      responseTime: Date.now() - dbStartTime,
      connection:
        mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    };

    // Memory check
    const memUsage = process.memoryUsage();
    const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    detailedCheck.checks.memory = {
      status: memPercent > 90 ? "warning" : "healthy",
      usage: Math.round(memPercent),
      heap: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024),
        total: Math.round(memUsage.heapTotal / 1024 / 1024),
      },
    };

    detailedCheck.responseTime = Date.now() - startTime;

    // Determine overall status
    const hasUnhealthy = Object.values(detailedCheck.checks).some(
      (check) => check.status === "error" || check.status === "unhealthy"
    );
    const hasWarnings = Object.values(detailedCheck.checks).some(
      (check) => check.status === "warning"
    );

    if (hasUnhealthy) {
      detailedCheck.status = "unhealthy";
    } else if (hasWarnings) {
      detailedCheck.status = "warning";
    }

    res
      .status(detailedCheck.status === "unhealthy" ? 503 : 200)
      .json(detailedCheck);
  } catch (error) {
    console.error("Detailed health check error:", error);
    detailedCheck.status = "unhealthy";
    detailedCheck.error = error.message;
    detailedCheck.responseTime = Date.now() - startTime;

    res.status(503).json(detailedCheck);
  }
});

module.exports = router;
