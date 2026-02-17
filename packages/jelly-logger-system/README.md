# Jelly Logger System

Comprehensive logging system with frontend and backend support.

## Features

- **Multi-transport support**: Console, Database (Supabase), API
- **Frontend context**: React hooks and context for component logging
- **Backend middleware**: Express.js middleware for request/error logging
- **PII masking**: Automatic redaction of sensitive data
- **Batching**: Efficient log buffering and batch sending
- **Error tracking**: Full error capture with stack traces
- **Performance monitoring**: Request duration tracking

## Installation

```bash
npm install @jelly/logger
```

## Basic Usage

### Frontend

```typescript
import { LoggerProvider, useLogger } from '@jelly/logger';

function App() {
  return (
    <LoggerProvider config={{ serviceName: 'my-app' }}>
      <YourApp />
    </LoggerProvider>
  );
}

function MyComponent() {
  const logger = useLogger();

  const handleClick = () => {
    logger.info('Button clicked', { userId: '123' });
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

### Backend

```typescript
import { JellyLogger, createRequestLoggingMiddleware } from "@jelly/logger";
import express from "express";

const logger = JellyLogger.getInstance({
  serviceName: "my-api",
});

const app = express();
app.use(createRequestLoggingMiddleware(logger));

app.get("/api/data", (req, res) => {
  logger.info("Data endpoint hit");
  res.json({ data: [] });
});
```

## Configuration

See [ILoggerConfig](src/core/interfaces/ILoggerConfig.ts) for full configuration options.
