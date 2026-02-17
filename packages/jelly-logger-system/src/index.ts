/**
 * Main export file for Jelly Logger
 */

// Core
export { JellyLogger } from "./core/Logger";
export { LogLevel } from "./core/LogLevel";

// Interfaces
export type { ILogEntry } from "./core/interfaces/ILogEntry";
export type { ILoggerConfig } from "./core/interfaces/ILoggerConfig";
export type { ITransport } from "./core/interfaces/ITransport";
export type { ILoggerContext } from "./core/interfaces/ILoggerContext";

// Transports
export { ConsoleTransport } from "./transports/ConsoleTransport";
export { DatabaseTransport } from "./transports/DatabaseTransport";
export { APITransport } from "./transports/APITransport";

// Frontend
export { LoggerProvider } from "./frontend/context/LoggerProvider";
export { useLogger } from "./frontend/hooks/useLogger";
export { LoggerContext } from "./frontend/context/LoggerContext";

// Backend
export {
  createRequestLoggingMiddleware,
  createErrorLoggingMiddleware,
  createContextMiddleware,
  createPerformanceMiddleware,
} from "./backend/middleware/expressMiddleware";

// API
export { createLogRoutes } from "./api/routes/log";

// Utils
export {
  maskEmail,
  maskPhone,
  maskCard,
  maskSSN,
  sanitizeAuthData,
  sanitizeUserData,
} from "./utils/sanitizers";
