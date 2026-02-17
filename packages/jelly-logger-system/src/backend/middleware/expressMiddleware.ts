/**
 * Request Logging Middleware - Express middleware for request logging
 */
import { JellyLogger } from "../../core/Logger";

export const createRequestLoggingMiddleware = (logger: JellyLogger) => {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    const requestId = req.headers["x-request-id"] || generateRequestId();

    // Add request ID to logger context
    logger.setContext({
      requestId,
      method: req.method,
      path: req.path,
      ip: req.ip,
    });

    // Log incoming request
    logger.info("HTTP Request", {
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      requestId,
    });

    // Capture original send function
    const originalSend = res.send;

    // Override send to log response
    res.send = function (data: any) {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      logger.info("HTTP Response", {
        method: req.method,
        path: req.path,
        statusCode,
        durationMs: duration,
        requestId,
      });

      // Call original send
      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Error Logging Middleware - Express middleware for error logging
 */
export const createErrorLoggingMiddleware = (logger: JellyLogger) => {
  return (err: any, req: any, res: any, next: any) => {
    const requestId = req.headers["x-request-id"] || generateRequestId();

    logger.error(
      "HTTP Error",
      {
        method: req.method,
        path: req.path,
        statusCode: err.statusCode || 500,
        message: err.message,
        requestId,
        stack: err.stack,
      },
      err,
    );

    // Pass error to next middleware
    next(err);
  };
};

/**
 * Context Middleware - Add user/session context to logger
 */
export const createContextMiddleware = (logger: JellyLogger) => {
  return (req: any, res: any, next: any) => {
    const userId = req.user?.id || req.headers["x-user-id"];
    const sessionId = req.session?.id || req.headers["x-session-id"];

    if (userId) {
      logger.setUser(userId, {
        email: req.user?.email,
        role: req.user?.role,
      });
    }

    logger.setContext({
      sessionId,
      userId,
      timestamp: Date.now(),
    });

    next();
  };
};

/**
 * Performance Monitoring Middleware
 */
export const createPerformanceMiddleware = (logger: JellyLogger) => {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - startTime;

      if (duration > 1000) {
        logger.warn("Slow Response", {
          method: req.method,
          path: req.path,
          durationMs: duration,
          threshold: 1000,
        });
      }
    });

    next();
  };
};

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
