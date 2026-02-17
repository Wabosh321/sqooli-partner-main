/**
 * ILoggerContext - Frontend context interface
 */
import { ReactNode } from "react";
import { ILoggerConfig } from "./ILoggerConfig";
import { ILogEntry } from "./ILogEntry";

export interface ILoggerContext {
  info(
    message: string,
    context?: Record<string, any>,
    meta?: Record<string, any>,
  ): void;
  error(message: string, context?: Record<string, any>, error?: Error): void;
  warn(message: string, context?: Record<string, any>): void;
  debug(message: string, context?: Record<string, any>): void;
  captureError(error: Error, context?: Record<string, any>): void;
  captureEvent(eventName: string, data?: Record<string, any>): void;
  setUser(userId: string, userData?: Record<string, any>): void;
  clearUser(): void;
  setContext(context: Record<string, any>): void;
  addTag(tag: string): void;
  removeTag(tag: string): void;
  getBufferedLogs(): ILogEntry[];
  clearBuffer(): void;
}

export interface LoggerProviderProps {
  children: ReactNode;
  config?: Partial<ILoggerConfig>;
}
