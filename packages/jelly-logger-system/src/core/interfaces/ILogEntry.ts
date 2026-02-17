/**
 * ILogEntry - Core log entry interface
 */
export interface ILogEntry {
  id?: string;
  timestamp: number | Date;
  level: string;
  message: string;
  context?: Record<string, any>;
  meta?: Record<string, any>;
  stackTrace?: string;
  durationMs?: number;
  tags?: string[];
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  source?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  correlationId?: string;
  error?: Error;
  url?: string;
  userAgent?: string;
  ipAddress?: string;
  deviceInfo?: Record<string, any>;
}
