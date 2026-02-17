/**
 * JellyLogger - Main logger class (singleton pattern)
 */
import { ILogEntry } from "./interfaces/ILogEntry";
import { ILoggerConfig } from "./interfaces/ILoggerConfig";
import { ITransport } from "./interfaces/ITransport";
import { LogLevel, LOG_LEVEL_PRIORITY } from "./LogLevel";

export class JellyLogger {
  private static instance: JellyLogger;
  private config: Required<ILoggerConfig>;
  private transports: Map<string, ITransport> = new Map();
  private buffer: ILogEntry[] = [];
  private context: Record<string, any> = {};
  private tags: Set<string> = new Set();
  private currentUser?: { id: string; data?: Record<string, any> };
  private flushTimer?: ReturnType<typeof setInterval>;

  private constructor(config: ILoggerConfig) {
    this.config = this.normalizeConfig(config);
    this.setupFlushInterval();
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: ILoggerConfig): JellyLogger {
    if (!JellyLogger.instance && config) {
      JellyLogger.instance = new JellyLogger(config);
    } else if (!JellyLogger.instance) {
      throw new Error(
        "Logger not initialized. Call getInstance with config first.",
      );
    }
    return JellyLogger.instance;
  }

  /**
   * Normalize configuration with defaults
   */
  private normalizeConfig(config: ILoggerConfig): Required<ILoggerConfig> {
    return {
      serviceName: config.serviceName,
      serviceVersion: config.serviceVersion || "1.0.0",
      environment: config.environment || "production",
      debugMode: config.debugMode || false,
      maskPII: config.maskPII || true,
      redactFields: config.redactFields || [
        "password",
        "token",
        "email",
        "phone",
        "ssn",
      ],
      autoCaptureErrors: config.autoCaptureErrors ?? true,
      autoCaptureEvents: config.autoCaptureEvents ?? true,
      captureUser: config.captureUser ?? true,
      captureDevice: config.captureDevice ?? true,
      captureNetwork: config.captureNetwork ?? false,
      batchSize: config.batchSize || 50,
      flushInterval: config.flushInterval || 5000,
      maxBufferSize: config.maxBufferSize || 1000,
      enableConsole: config.enableConsole ?? true,
      enableDatabase: config.enableDatabase ?? false,
      enableAPI: config.enableAPI ?? false,
      apiEndpoint: config.apiEndpoint || "",
      databaseUrl: config.databaseUrl || "",
      minLogLevel: config.minLogLevel || LogLevel.DEBUG,
      tags: config.tags || [],
      customContext: config.customContext || {},
    };
  }

  /**
   * Add transport
   */
  addTransport(transport: ITransport): void {
    this.transports.set(transport.name, transport);
    if (this.config.debugMode) {
      console.log(`[Logger] Added transport: ${transport.name}`);
    }
  }

  /**
   * Remove transport
   */
  removeTransport(name: string): void {
    this.transports.delete(name);
  }

  /**
   * Log at INFO level
   */
  info(
    message: string,
    context?: Record<string, any>,
    meta?: Record<string, any>,
  ): void {
    this.log(LogLevel.INFO, message, context, meta);
  }

  /**
   * Log at ERROR level
   */
  error(message: string, context?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, undefined, error);
  }

  /**
   * Log at WARN level
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log at DEBUG level
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log at TRACE level
   */
  trace(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.TRACE, message, context);
  }

  /**
   * Log at FATAL level
   */
  fatal(message: string, context?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.FATAL, message, context, undefined, error);
  }

  /**
   * Capture error with context
   */
  captureError(error: Error, context?: Record<string, any>): void {
    this.error(error.message, { ...context, errorName: error.name }, error);
  }

  /**
   * Capture event
   */
  captureEvent(eventName: string, data?: Record<string, any>): void {
    this.info(`EVENT: ${eventName}`, data, { isEvent: true });
  }

  /**
   * Set current user
   */
  setUser(userId: string, userData?: Record<string, any>): void {
    this.currentUser = { id: userId, data: userData };
  }

  /**
   * Clear user
   */
  clearUser(): void {
    this.currentUser = undefined;
  }

  /**
   * Set context
   */
  setContext(context: Record<string, any>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Add tag
   */
  addTag(tag: string): void {
    this.tags.add(tag);
  }

  /**
   * Remove tag
   */
  removeTag(tag: string): void {
    this.tags.delete(tag);
  }

  /**
   * Get buffered logs
   */
  getBufferedLogs(): ILogEntry[] {
    return [...this.buffer];
  }

  /**
   * Clear buffer
   */
  clearBuffer(): void {
    this.buffer = [];
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    meta?: Record<string, any>,
    error?: Error,
  ): void {
    // Check log level
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: ILogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level: level,
      message: this.maskPII(message),
      context: this.maskPII(context || {}),
      meta: meta || {},
      severity: this.getSeverity(level),
      source: this.config.serviceName,
      tags: Array.from(this.tags),
      ...this.getEnvironmentData(),
    };

    if (error) {
      entry.stackTrace = error.stack;
      entry.error = error;
    }

    if (this.currentUser) {
      entry.userId = this.currentUser.id;
    }

    // Add to buffer
    this.buffer.push(entry);

    // Send to transports immediately or batch
    this.sendToTransports(entry);

    // Log to console if enabled
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Check if buffer needs flushing
    if (this.buffer.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const minPriority = LOG_LEVEL_PRIORITY[this.config.minLogLevel];
    const currentPriority = LOG_LEVEL_PRIORITY[level];
    return currentPriority >= minPriority;
  }

  /**
   * Send to all active transports
   */
  private async sendToTransports(entry: ILogEntry): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const transport of this.transports.values()) {
      if (transport.enabled) {
        promises.push(
          transport.send(entry).catch((err) => {
            console.error(`[Logger] Transport error (${transport.name}):`, err);
          }),
        );
      }
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }

  /**
   * Flush buffered logs to transports
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    const logsToFlush = [...this.buffer];
    this.buffer = [];

    const promises: Promise<void>[] = [];

    for (const transport of this.transports.values()) {
      if (transport.enabled) {
        promises.push(
          transport.batch(logsToFlush).catch((err) => {
            console.error(
              `[Logger] Transport batch error (${transport.name}):`,
              err,
            );
          }),
        );
      }
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }

  /**
   * Setup automatic flush interval
   */
  private setupFlushInterval(): void {
    if (typeof setInterval !== "undefined") {
      this.flushTimer = setInterval(() => {
        this.flush().catch((err) =>
          console.error("[Logger] Flush error:", err),
        );
      }, this.config.flushInterval);
    }
  }

  /**
   * Close logger and flush all logs
   */
  async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    await this.flush();

    for (const transport of this.transports.values()) {
      await transport.close().catch((err) => {
        console.error(
          `[Logger] Transport close error (${transport.name}):`,
          err,
        );
      });
    }
  }

  /**
   * Get environment data (user, device, etc.)
   */
  private getEnvironmentData(): Partial<ILogEntry> {
    const data: Partial<ILogEntry> = {
      ...this.context,
    };

    if (typeof window !== "undefined") {
      data.url = window.location.href;
      data.userAgent = navigator.userAgent;
    }

    return data;
  }

  /**
   * Log to console
   */
  private logToConsole(entry: ILogEntry): void {
    const style = this.getConsoleStyle(entry.level);
    const timestamp = new Date(entry.timestamp).toISOString();
    const prefix = `[${entry.level}] ${timestamp}`;

    console.log(`%c${prefix}`, style, entry.message, entry.context, entry.meta);

    if (entry.error) {
      console.error(entry.error);
    }
  }

  /**
   * Get console style based on log level
   */
  private getConsoleStyle(level: string): string {
    const styles: Record<string, string> = {
      [LogLevel.TRACE]: "color: #888;",
      [LogLevel.DEBUG]: "color: #0066cc;",
      [LogLevel.INFO]: "color: #009900;",
      [LogLevel.WARN]: "color: #ff9900; font-weight: bold;",
      [LogLevel.ERROR]: "color: #cc0000; font-weight: bold;",
      [LogLevel.FATAL]:
        "color: #660000; font-weight: bold; background: #ffcccc;",
    };
    return styles[level] || "color: inherit;";
  }

  /**
   * Mask PII in data
   */
  private maskPII(data: any): any {
    if (!this.config.maskPII) {
      return data;
    }

    if (typeof data !== "object" || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.maskPII(item));
    }

    const masked: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (this.config.redactFields.includes(key.toLowerCase())) {
        masked[key] = "***REDACTED***";
      } else if (typeof value === "object") {
        masked[key] = this.maskPII(value);
      } else {
        masked[key] = value;
      }
    }

    return masked;
  }

  /**
   * Get severity level
   */
  private getSeverity(level: LogLevel): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
    const severityMap: Record<
      LogLevel,
      "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    > = {
      [LogLevel.TRACE]: "LOW",
      [LogLevel.DEBUG]: "LOW",
      [LogLevel.INFO]: "MEDIUM",
      [LogLevel.WARN]: "HIGH",
      [LogLevel.ERROR]: "HIGH",
      [LogLevel.FATAL]: "CRITICAL",
    };
    return severityMap[level];
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
