/**
 * ConsoleTransport - Logs to browser/node console
 */
import { ILogEntry } from "../core/interfaces/ILogEntry";
import { ITransport } from "../core/interfaces/ITransport";

export class ConsoleTransport implements ITransport {
  name = "console";
  enabled = true;

  async send(logEntry: ILogEntry): Promise<void> {
    const timestamp = new Date(logEntry.timestamp).toISOString();
    const level = logEntry.level;
    const message = logEntry.message;
    const context = logEntry.context || {};
    const meta = logEntry.meta || {};

    const logData = {
      timestamp,
      level,
      message,
      context,
      meta,
      severity: logEntry.severity,
      source: logEntry.source,
      tags: logEntry.tags,
      userId: logEntry.userId,
      url: logEntry.url,
    };

    switch (level) {
      case "ERROR":
      case "FATAL":
        console.error(`[${level}] ${message}`, logData, logEntry.error);
        break;
      case "WARN":
        console.warn(`[${level}] ${message}`, logData);
        break;
      case "DEBUG":
      case "TRACE":
        console.debug(`[${level}] ${message}`, logData);
        break;
      default:
        console.log(`[${level}] ${message}`, logData);
    }
  }

  async batch(logEntries: ILogEntry[]): Promise<void> {
    console.group(`[BATCH] ${logEntries.length} logs`);
    for (const entry of logEntries) {
      await this.send(entry);
    }
    console.groupEnd();
  }

  async flush(): Promise<void> {
    // Console doesn't need flushing
  }

  async close(): Promise<void> {
    // Console doesn't need closing
  }
}
