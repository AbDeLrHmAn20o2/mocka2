const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: "Access denied! No Token provided",
    });
  }

  try {
    // Quick pre-check: if token is obviously malformed or too old, reject immediately
    const now = Math.floor(Date.now() / 1000);
    
    // Try to decode token payload without verification for quick staleness check
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      
      // If token is more than 2 hours past expiry, reject immediately
      if (payload.exp && (now - payload.exp) > 2 * 60 * 60) {
        console.log(`🚨 Rejecting extremely stale token: ${now} vs ${payload.exp} (${now - payload.exp} seconds old)`);
        return res.status(401).json({
          error: "Token is extremely stale. Please login again.",
          code: "TOKEN_EXTREMELY_STALE",
          details: "Token is more than 2 hours past expiry. Fresh authentication required.",
        });
      }
    } catch (decodeError) {
      console.log("Failed to decode token for staleness check:", decodeError.message);
      // Continue with normal verification if decode fails
    }

    // Add clock tolerance for token verification (10 minutes for better reliability)
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
      // Increase clock skew tolerance to handle server time differences better
      clockSkew: 600, // 10 minutes in seconds
    });

    const payload = ticket.getPayload();

    // Additional manual expiry check with increased tolerance
    const expiry = payload.exp;
    const clockTolerance = 600; // 10 minutes

    if (now > expiry + clockTolerance) {
      throw new Error(`Token expired: ${now} > ${expiry + clockTolerance}`);
    }

    //add user info to req.user
    req.user = {
      userId: payload["sub"],
      email: payload["email"],
      name: payload["name"],
    };

    //Add User ID to headers for downstream services
    req.headers["x-user-id"] = payload["sub"];

    //optional
    req.headers["x-user-email"] = payload["email"];
    req.headers["x-user-name"] = payload["name"];

    next();
  } catch (err) {
    console.error("Token verification failed", err);

    // Check specific error types for better handling
    const errorMessage = err.message || "";

    if (
      errorMessage.includes("Token used too late") ||
      errorMessage.includes("Token expired") ||
      errorMessage.includes("exp")
    ) {
      return res.status(401).json({
        error: "Token expired! Please login again.",
        code: "TOKEN_EXPIRED",
        details:
          "Your session has expired. Please refresh the page and sign in again.",
      });
    }

    if (errorMessage.includes("extremely stale")) {
      return res.status(401).json({
        error: "Token is extremely stale! Please login again.",
        code: "TOKEN_EXTREMELY_STALE",
        details:
          "Token is far beyond expiry. Fresh authentication required.",
      });
    }

    if (
      errorMessage.includes("Token used before") ||
      errorMessage.includes("iat")
    ) {
      return res.status(401).json({
        error: "Token not yet valid! Please check your system time.",
        code: "TOKEN_TOO_EARLY",
        details:
          "There may be a clock synchronization issue. Please try again in a moment.",
      });
    }

    if (errorMessage.includes("audience") || errorMessage.includes("aud")) {
      return res.status(401).json({
        error: "Token audience mismatch!",
        code: "INVALID_AUDIENCE",
        details: "Token was issued for a different application.",
      });
    }

    // Generic token validation error
    res.status(401).json({
      error: "Invalid Token!",
      code: "INVALID_TOKEN",
      details: "The provided authentication token is not valid.",
    });
  }
}

module.exports = authMiddleware;
