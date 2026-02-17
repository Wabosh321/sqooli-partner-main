/**
 * ILoggerConfig - Configuration interface for Logger
 */
export interface ILoggerConfig {
  serviceName: string;
  serviceVersion?: string;
  environment?: string;
  debugMode?: boolean;
  maskPII?: boolean;
  redactFields?: string[];
  autoCaptureErrors?: boolean;
  autoCaptureEvents?: boolean;
  captureUser?: boolean;
  captureDevice?: boolean;
  captureNetwork?: boolean;
  batchSize?: number;
  flushInterval?: number;
  maxBufferSize?: number;
  enableConsole?: boolean;
  enableDatabase?: boolean;
  enableAPI?: boolean;
  apiEndpoint?: string;
  databaseUrl?: string;
  minLogLevel?: string;
  tags?: string[];
  customContext?: Record<string, any>;
}
