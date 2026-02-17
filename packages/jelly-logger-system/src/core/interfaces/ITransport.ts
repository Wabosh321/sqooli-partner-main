/**
 * ITransport - Transport interface for log handlers
 */
import { ILogEntry } from "./ILogEntry";

export interface ITransport {
  name: string;
  enabled: boolean;
  send(logEntry: ILogEntry): Promise<void>;
  batch(logEntries: ILogEntry[]): Promise<void>;
  flush(): Promise<void>;
  close(): Promise<void>;
}
