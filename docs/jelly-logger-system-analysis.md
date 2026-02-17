## JELLY LOGGER SYSTEM ANALYSIS

### 1. EXECUTIVE SUMMARY
This document analyzes the Jelly Logger integration inside the SqooliPartner project. It covers three core files: `src/hooks/useAuth.ts`, `src/integrations/logger-context.ts`, and `src/integrations/logger-setup.ts`. The analysis explains responsibilities, integration points, initialization flow, context propagation, and usage examples for React components and hooks.

### 2. COMPONENT BREAKDOWN

#### 2.1 useAuth.ts Analysis
- **Purpose**: The `useAuth` hook centralizes authentication detection and normalized user/partner state for the app. It unifies verification steps and provides a refetch method for re-checking auth.
- **Key Exports**: `useAuth()` — React hook returning `UseAuthReturn` with `{ user, partner, loading, error, isFirstLogin, loginMethod, refetch }`.
- **Dependencies**:
  - Internal: `../types/auth.types` (type defs), `../lib/supabase` (supabase client), `../utils/verifyAuthData` (helpers: `initializeAuthContext`, `fetchPartnerData`, `verifyAuthenticatedUser`).
  - External: `@jelly/logger` via `useLogger` hook to instrument startup logs.
- **Core Logic**:
  - Initializes a logger (with a safe fallback if provider missing).
  - Maintains React state for `laravelUser`, `supabaseUser`, `partner`, `loading`, and `error`.
  - Defines `initAuth()` which calls `initializeAuthContext()` to obtain `user`, `partner`, and `isAuthenticated`.
  - If authenticated, it normalizes the returned user into a `ConvexUser` shape, sets partner state (if present) and toggles loading accordingly.
  - Errors are caught, logged through the logger, and stored in `error` state.
- **Integration Points**:
  - Calls `initializeAuthContext()` from `utils/verifyAuthData` — this is the bridge to Laravel/Supabase verification logic.
  - Uses `useLogger()` to write informational and error logs about auth lifecycle (initialization, completion, failure).
  - Exposes `refetch` (the `initAuth` function) for components to re-run authentication checks.

#### 2.2 logger-context.ts Analysis
- **Purpose**: Provide utilities that build and manage contextual metadata for logs (session id, correlation id, device info, URL, user agent, IP address, etc.). Contains both async and synchronous builders for contexts.
- **Key Exports**:
  - `getSessionId()` / `restoreSessionId()` — manage a session-scoped UUID persisted in `sessionStorage`.
  - `getCorrelationId()` / `setCorrelationId()` — correlation id management for request-tracing.
  - `generateUUID()` — generator using `crypto.randomUUID()` with fallback.
  - `captureDeviceInfo()`, `getCurrentUrl()`, `getUserAgent()`, `getClientIpAddress()` — environment metadata helpers.
  - `buildLoggerContext(userId?, overrides?) : Promise<LoggerContextData>` — asynchronous full context builder (includes IP lookup).
  - `buildLoggerContextSync(userId?, overrides?) : LoggerContextData` — synchronous variant (does not include IP).
- **Dependencies**: purely browser APIs (`crypto`, `navigator`, `window`) and `fetch` for IP retrieval. No external npm dependencies.
- **Core Logic**:
  - Centralizes how contextual fields are created, validated, and persisted.
  - IP fetching uses `https://api.ipify.org?format=json` as a best-effort non-blocking call.
  - Two builders exist to allow both synchronous log paths and enriched async log paths.
- **Integration Points**:
  - Consumed by `logger-setup.ts` for enriching and validating log payloads before persistence.
  - Should be invoked by application-level instrumentation to attach user/session/correlation data.

#### 2.3 logger-setup.ts Analysis
- **Purpose**: Initialize and configure the Jelly Logger instance and intercept logger methods to insert logs directly into Supabase database.
- **Key Exports**:
  - `setupLogger(): JellyLogger` — create and configure a `JellyLogger` singleton.
  - `getLogger(): JellyLogger` — getter which ensures initialization.
  - `initializeLogger(): void` — shorthand to ensure logger setup at app startup.
- **Dependencies**:
  - External: `@jelly/logger` (`JellyLogger`, `ConsoleTransport`).
  - Internal: `../lib/supabase` (supabase client), `./logger-context` (context creation utilities).
- **Core Logic**:
  - Builds `JellyLogger` with options including masking rules, capture toggles, batching, environment-driven `minLogLevel`, and built-in console transport.
  - Wraps `info`, `warn`, `error`, and `debug` functions on the logger to call `insertLogToSupabase(...)` prior to forwarding to original transports.
  - `insertLogToSupabase(...)`:
    - Builds enriched synchronous context and then awaits `getClientIpAddress()` to include IP (attempts to include IP even for what began as sync path).
    - Generates tags based on message content and level.
    - Validates common IDs (UUID regex) before mapping to DB columns.
    - Builds log payload with fields such as timestamp, level, message, context, stack_trace, severity, source, user/session/request/correlation IDs, url, user_agent, ip_address, device_info, tags, and duration_ms.
    - Inserts into Supabase `logs` table via `supabase.from('logs').insert([logData])` and logs to `console.error` on failure.
- **Integration Points**:
  - On initialization, it is intended to be invoked at app startup (via `initializeLogger()`) so that `useLogger()` consumers get the configured instance.
  - `useAuth` uses `useLogger()` which ultimately depends on this setup to ensure logs are captured to Supabase.

### 3. SYSTEM ARCHITECTURE
High-level flow:

- App startup -> call `initializeLogger()` to create `JellyLogger` singleton and attach transports.
- App components/hooks call `useLogger()` (provided by `@jelly/logger`) to get the logger instance.
- `useAuth()` during mount calls `initAuth()` and logs auth lifecycle events using `logger.info` / `logger.error`.
- Intercepted logger methods call `insertLogToSupabase()` which uses `logger-context` helpers to build contextual metadata (sessionId, correlationId, deviceInfo, url, userAgent, ipAddress).
- `insertLogToSupabase()` writes structured rows into Supabase `logs` table.

Context/data flow diagram (textual):

- User action / page load
  -> `useAuth` invokes `initializeAuthContext()`
  -> `useLogger()` used in `useAuth` and other components
  -> `logger-setup` intercepts log calls
  -> `logger-context` is used to enrich logs
  -> Supabase `logs` table receives enriched, validated payloads

### 4. USAGE WORKFLOWS

#### 4.1 Initialization Sequence
1. On app startup call `initializeLogger()` (or import `getLogger()` lazily).
2. `setupLogger()` constructs `JellyLogger` with environment-driven options and console transport.
3. Logger methods are wrapped so every log triggers `insertLogToSupabase()` (async insert) and original transports.
4. Components call `useLogger()` to obtain the logger instance. `useAuth` calls `initAuth()` and logs lifecycle messages.

#### 4.2 Authentication-Aware Logging
Flow: `useAuth` obtains normalized `authUser` and `authPartner` → calls `logger.info(...)` with contextual info (user id) → `insertLogToSupabase()` calls `buildLoggerContextSync(userId)` then augments with async IP and persists to DB.

#### 4.3 Context Propagation
- `logger-context` maintains session and correlation ids across lifetime via `sessionStorage` and in-memory variables.
- Consumers should pass `userId` into logger context (or rely on `captureUser` configuration if `@jelly/logger` provides user capture integration).
- Correlation id can be set with `setCorrelationId()` for cross-request grouping.

### 5. CONFIGURATION REFERENCE

#### 5.1 Environment Variables (observed)
- `import.meta.env.DEV` — toggles debug options and `minLogLevel`.
- `import.meta.env.MODE` — environment name used when initializing `JellyLogger`.

Suggested environment variables to add (not currently present but useful):
- `LOG_LEVEL` — override `minLogLevel` (DEBUG/INFO/WARN/ERROR).
- `LOG_DB_ENABLED` — toggle DB inserts (true/false).
- `LOG_BATCH_SIZE` / `LOG_FLUSH_INTERVAL` — override batching options.

#### 5.2 Customization Options
- `redactFields` list in `setupLogger()` can be extended to mask additional PII.
- Add feature flag `enableDatabase` to disable DB inserts for local development.
- Hook into transports by adding custom Transports to `JellyLogger` (file, remote, or fallback endpoints).

### 6. BEST PRACTICES & PATTERNS
1. Use `buildLoggerContextSync()` for quick synchronous logs and `buildLoggerContext()` when you can await async enrichment.
2. Call `setCorrelationId()` at the start of important flows (e.g., when a user opens a checkout flow) to group logs.
3. Avoid expensive synchronous operations in wrapped logger functions; `insertLogToSupabase()` already batches, so prefer lightweight context and let background tasks enrich additional data.

### 7. TROUBLESHOOTING

#### Common Issues
1. `sessionStorage` or `navigator` undefined in SSR -> guard code already present.
2. IP lookup failures due to client network restrictions -> `getClientIpAddress()` returns `null` on failure.
3. DB inserts failing due to schema discrepancies -> inspect Supabase `logs` table schema and validate inserted fields.

#### Debugging Tips
1. Temporarily enable `enableConsole` in `JellyLogger` to inspect messages locally.
2. Wrap `insertLogToSupabase` with additional console logging on insert errors to reveal payload shapes.

### 8. EXAMPLE IMPLEMENTATIONS
Example 1: Component with auth-aware logging

```typescript
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLogger } from '@jelly/logger';

export function Dashboard(): JSX.Element {
  const logger = useLogger();
  const { user, loading } = useAuth();

  React.useEffect(() => {
    if (!loading) {
      logger.info('Dashboard loaded', { userId: user?.id ?? 'guest' });
    }
  }, [loading, user, logger]);

  return <div>Welcome</div>;
}
```

Example 2: Auth-context integrated logging (custom metadata)

```typescript
const logger = useLogger();
const { user } = useAuth();

logger.info('User performed action', {
  userId: user?.id,
  partnerId: user?.partner_id,
  meta: { action: 'export_csv', recordCount: 123 },
});
```

Example 3: Custom log scenario with error

```typescript
try {
  await performSensitiveOp();
} catch (err) {
  logger.error('Sensitive operation failed', { userId: user?.id }, err as Error);
}
```

Example 4: Environment-specific init (suggested)

```typescript
import { initializeLogger, getLogger } from '../integrations/logger-setup';

if (import.meta.env.MODE !== 'test') {
  initializeLogger();
}

const logger = getLogger();
```

### 9. SECURITY CONSIDERATIONS
- `setupLogger()` already configures `redactFields` to mask sensitive keys (passwords, tokens, email, phone etc.). Consider expanding this list for domain-specific PII.
- When storing logs in Supabase, ensure RLS and retention policies are applied to prevent unauthorized access.
- Avoid logging full user payloads; instead log identifiers and limited metadata.

### 10. PERFORMANCE IMPACT
- Synchronous wrapping of log methods calls `insertLogToSupabase()` which performs async operations: building context and calling Supabase insert. Because wrapping returns immediately to original transports but still enqueues the DB insert, overhead per-call depends on batching and network latency.
- `setupLogger()` uses `batchSize`, `flushInterval`, and `maxBufferSize` to mitigate overhead. Keep `minLogLevel` stricter in production to limit log volume.
- To reduce front-end overhead:
  - Disable DB inserts in local/dev using a flag.
  - Move heavy enrichment (like IP lookup) to a backend worker if possible.

### 11. ALTERNATIVES & EXTENSIONS
- Alternatives: Winston, pino, Sentry (for error aggregation), or hosted logging (Logflare, Datadog).
- Extensions:
  - Add a server-side ingestion endpoint to accept batched logs from client and perform trusted enrichment server-side.
  - Add structured schema validation before DB insert to avoid schema drift.

---

This file is created as docs/jelly-logger-system-analysis.md with the above content.
