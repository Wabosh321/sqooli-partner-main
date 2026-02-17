/**
 * DatabaseTransport - Logs to Supabase database
 */
import { ILogEntry } from "../core/interfaces/ILogEntry";
import { ITransport } from "../core/interfaces/ITransport";

export class DatabaseTransport implements ITransport {
  name = "database";
  enabled = true;
  private supabaseClient?: any;
  private batchBuffer: ILogEntry[] = [];
  private batchSize = 50;
  private flushTimer?: NodeJS.Timeout;

  constructor(supabaseClient?: any, batchSize: number = 50) {
    this.supabaseClient = supabaseClient;
    this.batchSize = batchSize;
    this.setupFlushInterval();
  }

  /**
   * Set Supabase client
   */
  setSupabaseClient(client: any): void {
    this.supabaseClient = client;
  }

  /**
   * Send single log entry
   */
  async send(logEntry: ILogEntry): Promise<void> {
    if (!this.supabaseClient) {
      console.warn("[DatabaseTransport] Supabase client not configured");
      return;
    }

    this.batchBuffer.push(logEntry);

    if (this.batchBuffer.length >= this.batchSize) {
      await this.flush();
    }
  }

  /**
   * Batch send logs
   */
  async batch(logEntries: ILogEntry[]): Promise<void> {
    if (!this.supabaseClient) {
      console.warn("[DatabaseTransport] Supabase client not configured");
      return;
    }

    for (const entry of logEntries) {
      this.batchBuffer.push(entry);
    }

    if (this.batchBuffer.length >= this.batchSize) {
      await this.flush();
    }
  }

  /**
   * Flush buffered logs to database
   */
  async flush(): Promise<void> {
    if (this.batchBuffer.length === 0 || !this.supabaseClient) {
      return;
    }

    const logsToInsert = this.batchBuffer.splice(0, this.batchSize);

    try {
      const { error } = await this.supabaseClient
        .from("logs")
        .insert(logsToInsert.map((log) => this.formatLogForDatabase(log)));

      if (error) {
        console.error("[DatabaseTransport] Insert error:", error);
      }
    } catch (error) {
      console.error("[DatabaseTransport] Error inserting logs:", error);
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
   * Format log entry for database insertion
   */
  private formatLogForDatabase(entry: ILogEntry): any {
    return {
      timestamp: new Date(entry.timestamp).toISOString(),
      level: entry.level,
      message: entry.message,
      context: entry.context || {},
      meta: entry.meta || {},
      stack_trace: entry.stackTrace || null,
      duration_ms: entry.durationMs || null,
      tags: entry.tags || [],
      severity: entry.severity || "MEDIUM",
      source: entry.source || "unknown",
      user_id: entry.userId || null,
      session_id: entry.sessionId || null,
      request_id: entry.requestId || null,
      correlation_id: entry.correlationId || null,
    };
  }

  /**
   * Setup automatic flush interval
   */
  private setupFlushInterval(): void {
    if (typeof setInterval !== "undefined") {
      this.flushTimer = setInterval(async () => {
        await this.flush().catch((err) => {
          console.error("[DatabaseTransport] Flush error:", err);
        });
      }, 5000);
    }
  }
}
