const errorHandler = (err, req, res, next) => {
  console.error("🚨 Error occurred:", {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    userAgent: req.get("User-Agent"),
    ip: req.ip,
  });

  // Default error response
  let statusCode = err.statusCode || 500;
  let errorResponse = {
    error: "Internal Server Error",
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred",
    timestamp: new Date().toISOString(),
    requestId: req.headers["x-request-id"],
  };

  // Handle specific error types
  if (err.name === "ValidationError") {
    statusCode = 400;
    errorResponse = {
      error: "Validation Error",
      code: "VALIDATION_ERROR",
      message: "Invalid input data",
      details: Object.values(err.errors).map((e) => e.message),
      timestamp: new Date().toISOString(),
    };
  }

  if (err.name === "CastError") {
    statusCode = 400;
    errorResponse = {
      error: "Invalid ID",
      code: "INVALID_ID",
      message: "The provided ID is not valid",
      timestamp: new Date().toISOString(),
    };
  }

  if (err.code === 11000) {
    statusCode = 409;
    errorResponse = {
      error: "Duplicate Entry",
      code: "DUPLICATE_ENTRY",
      message: "Resource already exists",
      timestamp: new Date().toISOString(),
    };
  }

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    errorResponse = {
      error: "Invalid Token",
      code: "INVALID_TOKEN",
      message: "The provided token is invalid",
      timestamp: new Date().toISOString(),
    };
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    errorResponse = {
      error: "Token Expired",
      code: "TOKEN_EXPIRED",
      message: "The provided token has expired",
      timestamp: new Date().toISOString(),
    };
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === "production" && statusCode === 500) {
    errorResponse.message = "Internal server error occurred";
    // Remove stack trace and sensitive info
    delete errorResponse.details;
  } else if (process.env.NODE_ENV !== "production") {
    // Include stack trace in development
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;
