/**
 * APITransport - Logs to external API endpoint
 */
import { ILogEntry } from "../core/interfaces/ILogEntry";
import { ITransport } from "../core/interfaces/ITransport";

export class APITransport implements ITransport {
  name = "api";
  enabled = true;
  private endpoint: string;
  private apiKey?: string;
  private batchBuffer: ILogEntry[] = [];
  private batchSize = 50;
  private flushTimer?: NodeJS.Timeout;
  private requestsInFlight = 0;
  private maxConcurrentRequests = 3;

  constructor(endpoint: string, apiKey?: string, batchSize: number = 50) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
    this.batchSize = batchSize;
    this.setupFlushInterval();
  }

  /**
   * Send single log entry
   */
  async send(logEntry: ILogEntry): Promise<void> {
    this.batchBuffer.push(logEntry);

    if (this.batchBuffer.length >= this.batchSize) {
      await this.flush();
    }
  }

  /**
   * Batch send logs
   */
  async batch(logEntries: ILogEntry[]): Promise<void> {
    for (const entry of logEntries) {
      this.batchBuffer.push(entry);
    }

    if (this.batchBuffer.length >= this.batchSize) {
      await this.flush();
    }
  }

  /**
   * Flush buffered logs to API
   */
  async flush(): Promise<void> {
    if (this.batchBuffer.length === 0 || !this.endpoint) {
      return;
    }

    // Wait if too many requests in flight
    while (this.requestsInFlight >= this.maxConcurrentRequests) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const logsToSend = this.batchBuffer.splice(0, this.batchSize);

    this.requestsInFlight++;

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (this.apiKey) {
        headers["Authorization"] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(this.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          logs: logsToSend.map((log) => this.formatLogForAPI(log)),
          timestamp: new Date().toISOString(),
          batchSize: logsToSend.length,
        }),
      });

      if (!response.ok) {
        console.error(
          `[APITransport] HTTP ${response.status}: ${response.statusText}`,
        );
      }
    } catch (error) {
      console.error("[APITransport] Error sending logs:", error);
      // Re-add logs to buffer if sending failed
      this.batchBuffer.unshift(...logsToSend);
    } finally {
      this.requestsInFlight--;
    }
  }

  /**
   * Close transport
   */
  async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flush();
  }

  /**
   * Format log entry for API
   */
  private formatLogForAPI(entry: ILogEntry): any {
    return {
      id: entry.id,
      timestamp: new Date(entry.timestamp).toISOString(),
      level: entry.level,
      message: entry.message,
      context: entry.context || {},
      meta: entry.meta || {},
      stackTrace: entry.stackTrace,
      durationMs: entry.durationMs,
      tags: entry.tags,
      severity: entry.severity,
      source: entry.source,
      userId: entry.userId,
      sessionId: entry.sessionId,
      requestId: entry.requestId,
      correlationId: entry.correlationId,
      url: entry.url,
      userAgent: entry.userAgent,
    };
  }

  /**
   * Setup automatic flush interval
   */
  private setupFlushInterval(): void {
    if (typeof setInterval !== "undefined") {
      this.flushTimer = setInterval(async () => {
        await this.flush().catch((err) => {
          console.error("[APITransport] Flush error:", err);
        });
      }, 5000);
    }
  }
}
