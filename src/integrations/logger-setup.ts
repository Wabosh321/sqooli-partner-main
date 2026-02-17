/**
 * Logger Setup Integration - Initialize Jelly Logger with Supabase transport
 * Uses method interception to capture all log calls and insert directly to database
 */
import { JellyLogger, ConsoleTransport } from "@jelly/logger";
import { supabase } from "../lib/supabase";
import { buildLoggerContextSync, getClientIpAddress } from "./logger-context";

let loggerInstance: JellyLogger | null = null;

/**
 * Insert log entry directly to Supabase
 */
async function insertLogToSupabase(
  level: string,
  message: string,
  context?: Record<string, unknown>,
  error?: Error,
): Promise<void> {
  try {
    const startTime = Date.now();

    // Extract user ID from context
    const userId = (context?.userId as string) || null;

    // Build enriched context with all fields
    const enrichedContext = buildLoggerContextSync(userId);

    // Fetch IP synchronously (wait for result before insert)
    const ipAddress = await getClientIpAddress();
    if (ipAddress) {
      enrichedContext.ipAddress = ipAddress;
    }

    // Generate tags based on message and level
    const tags = generateTags(message, level);

    // Calculate duration
    const duration = Date.now() - startTime;

    // Validate IDs and map to database columns
    const safeUserId = isValidUUID(userId) ? userId : null;
    const safeSessionId = isValidUUID(enrichedContext.sessionId as unknown)
      ? (enrichedContext.sessionId as string)
      : null;
    const safeRequestId = isValidUUID(enrichedContext.requestId as unknown)
      ? (enrichedContext.requestId as string)
      : null;
    const safeCorrelationId = isValidUUID(
      enrichedContext.correlationId as unknown,
    )
      ? (enrichedContext.correlationId as string)
      : null;

    const logData = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      context: {
        ...context,
        ...enrichedContext,
      },
      meta: context?.meta || {},
      stack_trace: error?.stack || null,
      severity: mapLevelToSeverity(level),
      source: "sqooli-partner-portal",
      user_id: safeUserId,
      session_id: safeSessionId,
      request_id: safeRequestId,
      correlation_id: safeCorrelationId,
      url: enrichedContext.url || null,
      user_agent: enrichedContext.userAgent || null,
      ip_address: ipAddress || null,
      device_info: enrichedContext.deviceInfo || null,
      tags: tags && tags.length > 0 ? tags : null,
      duration_ms: duration > 0 ? duration : null,
    };

    // Insert into Supabase
    const { error: insertError } = await supabase
      .from("logs")
      .insert([logData]);

    if (insertError) {
      console.error("[Logger] Supabase insert error:", insertError);
    }
  } catch (err) {
    console.error("[Logger] Error inserting to Supabase:", err);
  }
}

/**
 * Generate tags based on message and log level
 */
function generateTags(message: string, level: string): string[] {
  const tags: string[] = [];

  // Add level-based tags
  if (level === "ERROR" || level === "FATAL") {
    tags.push("error");
  } else if (level === "WARN") {
    tags.push("warning");
  } else if (level === "INFO") {
    tags.push("info");
  } else if (level === "DEBUG") {
    tags.push("debug");
  }

  // Add category-based tags from message content
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("auth")) {
    tags.push("auth");
  }
  if (lowerMessage.includes("login")) {
    tags.push("login");
  }
  if (lowerMessage.includes("partner")) {
    tags.push("partner");
  }
  if (lowerMessage.includes("initialized")) {
    tags.push("initialization");
  }
  if (lowerMessage.includes("completed")) {
    tags.push("completed");
  }
  if (lowerMessage.includes("failed")) {
    tags.push("failed");
  }
  if (lowerMessage.includes("error")) {
    tags.push("error-event");
  }
  if (lowerMessage.includes("validation")) {
    tags.push("validation");
  }

  // Return unique tags
  return Array.from(new Set(tags));
}

/**
 * Validate whether a value is a UUID (v4 style)
 */
function isValidUUID(value: unknown): value is string {
  if (!value || typeof value !== "string") return false;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

function mapLevelToSeverity(level: string): string {
  const levelMap: Record<string, string> = {
    DEBUG: "LOW",
    INFO: "MEDIUM",
    WARN: "HIGH",
    ERROR: "CRITICAL",
    FATAL: "CRITICAL",
  };
  return levelMap[level.toUpperCase()] || "MEDIUM";
}

export const setupLogger = (): JellyLogger => {
  if (loggerInstance) {
    return loggerInstance;
  }

  const logger = JellyLogger.getInstance({
    serviceName: "sqooli-partner-portal",
    serviceVersion: "1.0.0",
    environment: import.meta.env.MODE || "production",
    debugMode: import.meta.env.DEV,
    maskPII: true,
    redactFields: [
      "password",
      "token",
      "email",
      "phone",
      "ssn",
      "apiKey",
      "accessToken",
      "refreshToken",
    ],
    autoCaptureErrors: true,
    autoCaptureEvents: true,
    captureUser: true,
    captureDevice: true,
    batchSize: 50,
    flushInterval: 5000,
    maxBufferSize: 1000,
    enableConsole: true,
    enableDatabase: true,
    minLogLevel: import.meta.env.DEV ? "DEBUG" : "INFO",
  });

  // Add console transport
  logger.addTransport(new ConsoleTransport());

  // Wrap logger methods to intercept and send to Supabase
  const originalInfo = logger.info.bind(logger);
  const originalWarn = logger.warn.bind(logger);
  const originalError = logger.error.bind(logger);
  const originalDebug = logger.debug.bind(logger);

  logger.info = function (message: string, context?: Record<string, unknown>) {
    insertLogToSupabase("INFO", message, context);
    return originalInfo(message, context);
  } as any;

  logger.warn = function (message: string, context?: Record<string, unknown>) {
    insertLogToSupabase("WARN", message, context);
    return originalWarn(message, context);
  } as any;

  logger.error = function (
    message: string,
    context?: Record<string, unknown>,
    error?: Error,
  ) {
    insertLogToSupabase("ERROR", message, context, error);
    return originalError(message, context, error);
  } as any;

  logger.debug = function (message: string, context?: Record<string, unknown>) {
    insertLogToSupabase("DEBUG", message, context);
    return originalDebug(message, context);
  } as any;

  loggerInstance = logger;

  logger.info("Logger initialized", {
    environment: import.meta.env.MODE,
    debugMode: import.meta.env.DEV,
  });

  return logger;
};

export const getLogger = (): JellyLogger => {
  if (!loggerInstance) {
    return setupLogger();
  }
  return loggerInstance;
};

/**
 * Initialize logger on app startup
 */
export const initializeLogger = (): void => {
  setupLogger();
};
