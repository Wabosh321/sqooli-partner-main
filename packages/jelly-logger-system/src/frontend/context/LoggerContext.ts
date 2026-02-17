/**
 * LoggerContext - React context for logger
 */
import { createContext, ReactNode } from "react";
import { ILoggerContext } from "../../core/interfaces/ILoggerContext";
import { ILogEntry } from "../../core/interfaces/ILogEntry";

export const LoggerContext = createContext<ILoggerContext | undefined>(
  undefined,
);

/**
 * Default logger context implementation
 */
export class DefaultLoggerContext implements ILoggerContext {
  private logger: any;

  constructor(logger: any) {
    this.logger = logger;
  }

  info(
    message: string,
    context?: Record<string, any>,
    meta?: Record<string, any>,
  ): void {
    this.logger.info(message, context, meta);
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    this.logger.error(message, context, error);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.logger.warn(message, context);
  }

  debug(message: string, context?: Record<string, any>): void {
    this.logger.debug(message, context);
  }

  captureError(error: Error, context?: Record<string, any>): void {
    this.logger.captureError(error, context);
  }

  captureEvent(eventName: string, data?: Record<string, any>): void {
    this.logger.captureEvent(eventName, data);
  }

  setUser(userId: string, userData?: Record<string, any>): void {
    this.logger.setUser(userId, userData);
  }

  clearUser(): void {
    this.logger.clearUser();
  }

  setContext(context: Record<string, any>): void {
    this.logger.setContext(context);
  }

  addTag(tag: string): void {
    this.logger.addTag(tag);
  }

  removeTag(tag: string): void {
    this.logger.removeTag(tag);
  }

  getBufferedLogs(): ILogEntry[] {
    return this.logger.getBufferedLogs();
  }

  clearBuffer(): void {
    this.logger.clearBuffer();
  }
}
