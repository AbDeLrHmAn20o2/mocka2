const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Add request ID to headers for tracking
  req.headers["x-request-id"] = requestId;

  // Log incoming request
  console.log(
    `📥 ${req.method} ${
      req.originalUrl
    } - ${new Date().toISOString()} [${requestId}]`
  );

  // Log additional details for uploads
  if (req.method === "POST" && req.originalUrl.includes("upload")) {
    console.log(
      `📎 Upload request detected - Content-Type: ${req.get("Content-Type")}`
    );
  }

  // Log request completion
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const status = res.statusCode;
    const statusEmoji = status >= 500 ? "🚨" : status >= 400 ? "⚠️" : "✅";

    console.log(
      `📤 ${statusEmoji} ${req.method} ${req.originalUrl} - ${status} (${duration}ms) [${requestId}]`
    );

    // Log slow requests
    if (duration > 5000) {
      console.warn(
        `🐌 Slow request detected: ${req.method} ${req.originalUrl} took ${duration}ms`
      );
    }
  });

  next();
};

module.exports = requestLogger;
