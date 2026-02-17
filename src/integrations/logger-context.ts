/**
 * Logger Context Helper - Enriches logs with device, session, and request data
 */

// Session ID persists for the current app session
let sessionId: string | null = null;

// Track correlation across related operations
let correlationId: string | null = null;

/**
 * Generate a UUID using Web Crypto API
 */
const generateUUID = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export interface LoggerContextData {
  userId?: string | null;
  sessionId?: string;
  requestId?: string;
  correlationId?: string;
  url?: string;
  userAgent?: string;
  ipAddress?: string | null;
  deviceInfo?: {
    platform?: string;
    screenWidth?: number;
    screenHeight?: number;
    timezone?: string;
    language?: string;
  };
}

/**
 * Get or create session ID for the current session
 */
export const getSessionId = (): string => {
  if (!sessionId) {
    sessionId = generateUUID();
    // Store in sessionStorage for persistence across page reloads
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        window.sessionStorage.setItem("logger_session_id", sessionId);
      } catch {
        // sessionStorage might be disabled
      }
    }
  }
  return sessionId;
};

/**
 * Restore session ID from storage
 */
export const restoreSessionId = (): void => {
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      const stored = window.sessionStorage.getItem("logger_session_id");
      if (stored) {
        sessionId = stored;
      }
    } catch {
      // sessionStorage might be disabled
    }
  }
};

/**
 * Get or create correlation ID for tracing related logs
 */
export const getCorrelationId = (): string => {
  if (!correlationId) {
    correlationId = generateUUID();
  }
  return correlationId;
};

/**
 * Set correlation ID (useful for linking related operations)
 */
export const setCorrelationId = (id: string): void => {
  correlationId = id;
};

/**
 * Capture device information
 */
export const captureDeviceInfo = () => {
  if (typeof window === "undefined") {
    return undefined;
  }

  return {
    platform: navigator.platform,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
  };
};

/**
 * Get current page URL
 */
export const getCurrentUrl = (): string | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }
  return window.location.href;
};

/**
 * Get user agent
 */
export const getUserAgent = (): string | undefined => {
  if (typeof navigator === "undefined") {
    return undefined;
  }
  return navigator.userAgent;
};

/**
 * Get client IP address (requires server-side or public API)
 * For browser-based logging, we'll try to get it from a metadata service
 */
export const getClientIpAddress = async (): Promise<string | null> => {
  try {
    // Try to get IP from a public API (non-blocking)
    const response = await fetch("https://api.ipify.org?format=json", {
      method: "GET",
      mode: "cors",
    });
    if (response.ok) {
      const data = await response.json();
      return data.ip || null;
    }
  } catch {
    // IP fetching failed, will be null
  }
  return null;
};

/**
 * Build complete logger context with all available data
 */
export const buildLoggerContext = async (
  userId?: string | null,
  overrides?: Partial<LoggerContextData>,
): Promise<LoggerContextData> => {
  restoreSessionId(); // Restore session if it exists

  return {
    userId: userId || null,
    sessionId: getSessionId(),
    requestId: generateUUID(),
    correlationId: getCorrelationId(),
    url: getCurrentUrl(),
    userAgent: getUserAgent(),
    ipAddress: await getClientIpAddress(),
    deviceInfo: captureDeviceInfo(),
    ...overrides,
  };
};

/**
 * Sync logger context (non-async version for synchronous logging)
 * Note: IP address will not be available in sync mode
 */
export const buildLoggerContextSync = (
  userId?: string | null,
  overrides?: Partial<LoggerContextData>,
): LoggerContextData => {
  restoreSessionId();

  return {
    userId: userId || null,
    sessionId: getSessionId(),
    requestId: generateUUID(),
    correlationId: getCorrelationId(),
    url: getCurrentUrl(),
    userAgent: getUserAgent(),
    ipAddress: null,
    deviceInfo: captureDeviceInfo(),
    ...overrides,
  };
};
