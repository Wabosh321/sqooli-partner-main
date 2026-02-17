# Jelly Logger System - Multi-Grade Cybersecurity Upgrade & Architecture Analysis

**Document Version**: 1.0  
**Date**: February 8, 2026  
**Scope**: Comprehensive analysis of jelly-logger-system with security enhancement roadmap

---

## Executive Summary

The current Jelly Logger system provides foundational structured logging with PII masking, context propagation, and multi-transport capabilities. This document analyzes the existing architecture and proposes a comprehensive upgrade pathway to transform it into an enterprise-grade, **multi-level cybersecurity logging and monitoring system** with tamper-evident storage, role-based access, encrypted transmission, anomaly detection, and SIEM integration.

**Key Findings**:

- ✅ Strong foundation: singleton pattern, context injection, extensible transports
- ⚠️ Security gaps: no encryption at rest/transit, no log tampering detection, limited access controls
- 🎯 Upgrade potential: clear extension points for security hardening via new transport layers and middleware

---

## 1. Current Architecture Overview

### 1.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Jelly Logger System (Current)                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                        Frontend Layer                             │   │
│  ├──────────────────────────────────────────────────────────────────┤   │
│  │  LoggerProvider (React Context)                                  │   │
│  │  ├─ useLogger() hook                                             │   │
│  │  └─ Auto-injects ConsoleTransport                               │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│           │                                                              │
│  ┌─────────▼──────────────────────────────────────────────────────────┐ │
│  │                        Core Layer                                   │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │  JellyLogger (Singleton)                                           │ │
│  │  ├─ Log Level Filtering (TRACE → FATAL)                          │ │
│  │  ├─ Entry Enrichment (timestamp, severity, context)              │ │
│  │  ├─ PII Masking & Sanitization                                   │ │
│  │  ├─ Buffering (in-memory, batch on size/time)                    │ │
│  │  └─ Transport Orchestration (dispatch to active transports)      │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│           │                                                              │
│     ┌─────┴────────────────────────────────────────────┐                │
│     │                Transport Layer                    │                │
│     ├──────────────────────────────────────────────────┤                │
│  ┌──▼─────┐  ┌──────────┐  ┌──────────────┐           │                │
│  │Console │  │   API    │  │  Database    │           │                │
│  │ Trans  │  │ Transport│  │  Transport   │           │                │
│  └────────┘  └──────────┘  └──────────────┘           │                │
│     │             │                │                    │                │
│  Browser      HTTP POST         Supabase               │                │
│  Console      /api/logs         PostgreSQL             │                │
│     │             │                │                    │                │
│  └────────────────┴────────────────┴────────────────────┘                │
│           │                                                              │
│  ┌────────▼──────────────────────────────────────────────────────────┐  │
│  │                   Backend Integration Layer                        │  │
│  ├────────────────────────────────────────────────────────────────────┤  │
│  │  Express Middleware (4 types)                                      │  │
│  │  ├─ createRequestLoggingMiddleware()      (HTTP request/response) │  │
│  │  ├─ createErrorLoggingMiddleware()        (error capture)         │  │
│  │  ├─ createContextMiddleware()             (user/session inject)   │  │
│  │  └─ createPerformanceMiddleware()         (slow response warn)    │  │
│  │                                                                     │  │
│  │  API Routes (3 endpoints)                                          │  │
│  │  ├─ POST /api/logs                        (ingest batches)        │  │
│  │  ├─ GET /api/logs                         (retrieve with filters) │  │
│  │  └─ GET /api/logs/stats                   (analytics)             │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│           │                                                              │
│  ┌────────▼──────────────────────────────────────────────────────────┐  │
│  │           Database Layer (PostgreSQL via Supabase)                 │  │
│  ├────────────────────────────────────────────────────────────────────┤  │
│  │  Table: logs (UUID id, timestamp, level, message, context, etc) │  │
│  │  ├─ Indexes (9x): timestamp, level, user_id, severity, etc      │  │
│  │  ├─ RLS Policies: authenticated SELECT, service_role INSERT/UPD │  │
│  │  └─ Analytics Functions:                                          │  │
│  │     ├─ get_error_stats(days)  → daily error trends              │  │
│  │     └─ get_log_summary(days)  → aggregated statistics            │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Core Components

| Component             | Location                                      | Purpose                | Current Capabilities                                         |
| --------------------- | --------------------------------------------- | ---------------------- | ------------------------------------------------------------ |
| **JellyLogger**       | `src/core/Logger.ts`                          | Singleton orchestrator | Buffering, level filtering, context management, PII masking  |
| **ILogEntry**         | `src/core/interfaces/ILogEntry.ts`            | Data contract          | 24 fields including user/session/request context             |
| **ILoggerConfig**     | `src/core/interfaces/ILoggerConfig.ts`        | Configuration          | 25+ settings (levels, batch size, redaction fields, etc)     |
| **ITransport**        | `src/core/interfaces/ITransport.ts`           | Extensibility          | send(), batch(), flush(), close() methods                    |
| **ConsoleTransport**  | `src/transports/ConsoleTransport.ts`          | Browser/Node console   | ANSI color-coded output                                      |
| **APITransport**      | `src/transports/APITransport.ts`              | HTTP ingestion         | Batched POST to `/api/logs` with retry logic                 |
| **DatabaseTransport** | `src/transports/DatabaseTransport.ts`         | Supabase persistence   | Batched INSERT to `logs` table                               |
| **expressMiddleware** | `src/backend/middleware/expressMiddleware.ts` | HTTP context capture   | 4 middleware factories for logging HTTP lifecycle            |
| **Log Routes**        | `src/api/routes/log.ts`                       | API handling           | Ingest, retrieve, stats, cleanup endpoints                   |
| **Sanitizers**        | `src/utils/sanitizers.ts`                     | PII masking            | Email, phone, card, SSN masking functions                    |
| **Database Schema**   | `database/schemas/logs.sql`                   | Persistence layer      | Table definition, indexes, RLS policies, analytics functions |

### 1.3 Key Architectural Patterns

#### Pattern 1: Singleton Logger with Lazy Initialization

```typescript
static getInstance(config?: ILoggerConfig): JellyLogger {
  if (!JellyLogger.instance && config) {
    JellyLogger.instance = new JellyLogger(config);
  }
  return JellyLogger.instance;
}
```

- **Benefit**: Single entry point, shared state across app
- **Limitation**: No multi-logger instance support (e.g., separate loggers per tenant)

#### Pattern 2: Context Injection & Propagation

```typescript
logger.setContext({ requestId, userId, sessionId, ... });
// All subsequent logs inherit this context
```

- **Benefit**: Automatic enrichment without parameter drilling
- **Limitation**: Mutable state, no context isolation in concurrent scenarios

#### Pattern 3: Transport Abstraction via ITransport Interface

```typescript
interface ITransport {
  send(logEntry): Promise<void>;
  batch(logEntries): Promise<void>;
  flush(): Promise<void>;
  close(): Promise<void>;
}
```

- **Benefit**: Extensible, allows custom destinations
- **Limitation**: No transport prioritization, error handling, or retry strateg y

#### Pattern 4: Middleware-Based HTTP Context Capture

```typescript
app.use(createRequestLoggingMiddleware(logger));
app.use(createContextMiddleware(logger));
app.use(createErrorLoggingMiddleware(logger));
```

- **Benefit**: Automatic collection of HTTP metadata
- **Limitation**: Limited to Express; no OpenTelemetry integration

---

## 2. Log Flow & Metadata Management

### 2.1 Lifecycle Phases with State Transitions

```
Application Code
        │
        ▼
┌─────────────────────────────────┐
│  1. Log Method Invocation       │
│  logger.info/error/warn/etc()   │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  2. Level Filtering             │
│  minLogLevel check              │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  3. Entry Enrichment            │
│  ├─ Generate ID (UUID)          │
│  ├─ Timestamp (NOW)             │
│  ├─ Severity calculation        │
│  └─ Context merge (from state)  │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  4. Security Processing         │
│  ├─ PII Masking (if enabled)    │
│  │  └─ email, phone, card, ssn  │
│  └─ Recursive sanitization      │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  5. Buffer Accumulation         │
│  ├─ Add to buffer[]             │
│  ├─ Check buffer size           │
│  └─ Trigger flush if needed     │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  6. Async Transport Dispatch    │
│  ├─ ConsoleTransport.send()     │
│  ├─ APITransport.send()         │
│  └─ DatabaseTransport.send()    │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  7. Periodic Flush (every 5s)   │
│  ├─ Batch logs (size 50)        │
│  ├─ Send to all active          │
│  │   transports                  │
│  └─ Clear buffer on success      │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  8. Persistent Storage          │
│  ├─ Database INSERT             │
│  ├─ RLS enforcement             │
│  └─ Index update                │
└─────────────────────────────────┘
```

### 2.2 ILogEntry Structure (24 Fields)

| Field           | Type         | Set By             | Use Case                      | Current Masking            |
| --------------- | ------------ | ------------------ | ----------------------------- | -------------------------- |
| `id`            | UUID         | Core               | Unique identifier             | N/A                        |
| `timestamp`     | ISO 8601     | Core               | Event timing                  | N/A                        |
| `level`         | enum(6)      | Logger method      | Log severity threshold        | N/A                        |
| `message`       | string       | Developer          | Human-readable description    | Conditional (redactFields) |
| `context`       | object       | setContext()       | User/request/session metadata | Optional (PII)             |
| `meta`          | object       | log method         | Custom application data       | Optional (PII)             |
| `stackTrace`    | string       | error() method     | Exception stack               | Conditional                |
| `durationMs`    | number       | middleware         | Performance timing            | N/A                        |
| `tags`          | string[]     | addTag()           | Categorization (GIN indexed)  | N/A                        |
| `severity`      | enum(4)      | Core               | Aggregation & alerting        | N/A                        |
| `source`        | string       | config.serviceName | Multi-service identification  | N/A                        |
| `userId`        | UUID         | setUser()          | User accountability           | N/A                        |
| `sessionId`     | UUID         | middleware         | User session correlation      | N/A                        |
| `requestId`     | UUID         | middleware         | HTTP request tracing          | N/A                        |
| `correlationId` | UUID         | Core               | Async operation linking       | N/A                        |
| `error`         | Error object | error() method     | Exception details             | N/A                        |
| `url`           | string       | middleware         | Accessed resource             | N/A                        |
| `userAgent`     | string       | middleware         | Client identification         | N/A                        |
| `ipAddress`     | INET         | middleware         | Source IP & geolocation       | N/A                        |
| `deviceInfo`    | object       | frontend hook      | Browser/device metadata       | Conditional                |
| `errorName`     | string       | from error object  | Exception type classification | N/A                        |
| `statusCode`    | number       | middleware         | HTTP response status          | N/A                        |
| `emailMasked`   | boolean      | Core               | PII mask flag                 | N/A                        |
| `createdAt`     | timestamp    | DB trigger         | Server insertion time         | N/A                        |

### 2.3 Context Propagation Mechanism

#### Frontend Context (React)

```typescript
// From LoggerProvider.tsx
logger.setContext({
  userId: userState.id, // from auth context
  sessionId: getOrCreateSessionId(), // from sessionStorage
  correlationId: getCorrelationId(), // app lifetime UUID
  deviceInfo: {
    userAgent,
    viewport: { width, height },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
  },
});
```

#### Backend Context (Express)

```typescript
// From expressMiddleware.ts
logger.setContext({
  requestId: req.headers["x-request-id"] || generateUUID(),
  method: req.method,
  path: req.path,
  ip: req.ip,
  sessionId: req.session?.id,
  userId: req.user?.id,
});

logger.setUser(req.user.id, {
  email: req.user.email, // Will be masked if maskPII=true
  role: req.user.role, // Not PII, kept as-is
});
```

#### Context Mergence in Log Entry

```typescript
// Internal: log() method merges contexts
const enriched: ILogEntry = {
  ...baseEntry,
  ...this.context, // Global context (user, session, request ID)
  ...contextParam, // Passed context parameter
  ...this.currentUser, // User data if set
  tags: Array.from(this.tags), // Active tags
};
```

**Implications for Security**:

- ✅ Automatic request tracing via requestId
- ✅ User accountability via userId + email(masked)
- ❌ No context isolation per tenant/workspace
- ❌ No sensitive data separation (all contexts merged without categorization)

---

## 3. Transport & Storage Mechanics

### 3.1 ConsoleTransport (Browser/Node)

**Location**: `src/transports/ConsoleTransport.ts`

**Operation**:

```typescript
async send(logEntry: ILogEntry): Promise<void> {
  const color = this.getLevelColor(entry.level);
  console.log(`%c[${entry.level}]`, `color: ${color}`, entry.message);
  // Outputs immediately, no batching
}

async batch(logEntries: ILogEntry[]): Promise<void> {
  console.group(`📦 Batch: ${logEntries.length} logs`);
  logEntries.forEach(entry => console.log(entry));
  console.groupEnd();
}
```

**Characteristics**:

- **Synchronous**: In same thread as caller
- **Immediate**: No buffering
- **Unencrypted**: Plain text to console stream
- **Ephemeral**: Lost on page refresh

**Security Assessment**:

- 🟡 **Low Risk**: Visible to developer tools, no persistent storage
- 🟡 **Info Disclosure**: Sensitive logs may appear in error reports if console exported

---

### 3.2 APITransport (HTTP Batch Ingestion)

**Location**: `src/transports/APITransport.ts`

**Operation**:

```typescript
async flush(): Promise<void> {
  const logsToSend = this.batchBuffer.splice(0, this.batchSize);

  const response = await fetch(this.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
    },
    body: JSON.stringify({
      logs: logsToSend,
      timestamp: new Date().toISOString(),
      batchSize: logsToSend.length,
    }),
  });

  if (!response.ok) {
    this.batchBuffer.unshift(...logsToSend);  // Retry on next flush
  }
}
```

**Characteristics**:

- **Batched**: 50 logs per request (configurable)
- **HTTP Plain Text**: No TLS requirement specified
- **Bearer Token Auth**: Optional, if provided
- **Retry Logic**: Simple prepend to buffer on failure
- **Concurrency Control**: Max 3 parallel requests

**Security Assessment**:

- 🔴 **Critical**: No TLS/HTTPS enforcement, logs transmitted in plaintext
- 🔴 **Critical**: No request signing or HMAC verification
- 🟡 **High**: Bearer token in plain HTTP easily intercepted
- 🟡 **High**: No rate limiting protection
- 🟢 **OK**: Async, doesn't block main thread

**Vulnerabilities**:

1. **Man-in-the-Middle (MITM)**: Attacker intercepts logs
   - Fix: Enforce HTTPS, validate certificate
2. **Unauthorized Access**: Anyone with endpoint URL can POST logs
   - Fix: Stronger auth (OAuth2, TLS client cert)
3. **Log Tampering**: Attacker modifies logs in transit
   - Fix: Add HMAC-based integrity checking
4. **Replay Attack**: Attacker captures and resubmits old batch
   - Fix: Add nonce/timestamp verification, idempotency key

---

### 3.3 DatabaseTransport (Supabase PostgreSQL)

**Location**: `src/transports/DatabaseTransport.ts`

**Operation**:

```typescript
async flush(): Promise<void> {
  const logsToInsert = this.batchBuffer.splice(0, this.batchSize);

  const { error } = await this.supabaseClient
    .from('logs')
    .insert(logsToInsert.map(log => this.formatLogForDatabase(log)));

  if (error) {
    // Log is silently lost on error
    console.error('[DatabaseTransport] Insert error:', error);
    // ISSUE: No retry buffer
  }
}
```

**Characteristics**:

- **Direct DB Access**: Via Supabase client SDK
- **RLS Enforcement**: Rows filtered by auth.role()
- **Indexed**: 9 indexes on timestamp, level, user_id, severity, etc.
- **Batched**: 50 logs per INSERT
- **No Error Recovery**: Logs lost if insert fails

**Database Schema**:

```sql
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  level VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  meta JSONB DEFAULT '{}'::jsonb,
  stack_trace TEXT,
  duration_ms INTEGER,
  tags VARCHAR(50)[],
  severity VARCHAR(20) NOT NULL,
  source VARCHAR(50) NOT NULL,
  user_id UUID,
  session_id UUID,
  request_id UUID,
  correlation_id UUID,
  url TEXT,
  user_agent TEXT,
  ip_address INET,
  device_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
CREATE POLICY "Enable read access for authenticated users" ON logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for service role" ON logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for service role" ON logs
  FOR DELETE USING (auth.role() = 'service_role');
```

**Security Assessment**:

- 🟡 **Medium**: RLS provides basic access control
- 🔴 **Critical**: No encryption at rest (PostgreSQL needs pgcrypto extension)
- 🟡 **High**: No log integrity verification (tamper detection)
- 🟡 **High**: No retention/purge audit trail
- 🟢 **OK**: Service role INSERT prevents user-initiated direct writes
- 🔴 **Critical**: No column-level encryption for sensitive fields
- 🟡 **High**: All authenticated users can SELECT all logs (no data classification)

**Vulnerabilities**:

1. **Unauthorized Data Access**: Any authenticated user can query all logs
   - Fix: Implement multi-tenant RLS, classify logs by sensitivity
2. **Plaintext Storage**: Logs stored unencrypted at rest
   - Fix: Encrypt PII columns with per-field keys
3. **Tampering Detection**: No way to detect if logs were modified post-insertion
   - Fix: Add Merkle tree or HMAC signature chain
4. **Audit Trail Loss**: No record of who accessed/deleted logs
   - Fix: Create `log_access_audit` table, track all queries
5. **No Retention Policy**: Logs accumulate indefinitely
   - Fix: Implement time-based purge with audit trail

**Index Analysis**:

```sql
-- Performance: Good coverage for typical queries
idx_logs_timestamp         -- SELECT * FROM logs WHERE timestamp > NOW() - '1 day'
idx_logs_level             -- WHERE level = 'ERROR'
idx_logs_user_id           -- WHERE user_id = 'user-123'
idx_logs_source            -- WHERE source = 'service-name'
idx_logs_severity          -- WHERE severity IN ('HIGH', 'CRITICAL')
idx_logs_request_id        -- WHERE request_id = 'req-123'
idx_logs_tags              -- WHERE tags @> ARRAY['auth', 'error']
idx_logs_context_gin       -- WHERE context ->> 'userId' = 'user-123'
idx_logs_timestamp_level   -- Composite: trending errors by time
```

---

## 4. Security Vulnerability Assessment

### 4.1 Threat Model

**Threat Actors**:

1. **External Attacker**: Network access, no auth credentials
2. **Insider (Employee)**: Valid DB access, network access
3. **Compromised Application**: Full application code execution
4. **Data Subject**: User accessing own data improperly

**Attack Surfaces**:

1. **Network Transit**: APITransport HTTP channel
2. **Database Storage**: Plaintext logs in PostgreSQL
3. **Logging API**: Unauthorized log submission
4. **Context Injection**: Malicious context data
5. **Log Correlation**: Linking logs across users/sessions
6. **Metadata Leakage**: Stack traces, URLs revealing secrets

### 4.2 Critical Vulnerabilities

| Severity    | Vulnerability                 | Current State                         | CVSS Impact                    |
| ----------- | ----------------------------- | ------------------------------------- | ------------------------------ |
| 🔴 CRITICAL | HTTP Plaintext Transport      | No TLS enforcement                    | 9.1 (Network Confidentiality)  |
| 🔴 CRITICAL | No Log Integrity Verification | No HMAC/signature                     | 8.6 (Availability + Integrity) |
| 🔴 CRITICAL | No Encryption at Rest         | PostgreSQL plaintext                  | 9.0 (Confidentiality)          |
| 🔴 CRITICAL | Insufficient Access Control   | All users can read all logs           | 7.5 (Confidentiality)          |
| 🟡 HIGH     | No Request Authentication     | Any client can POST to /api/logs      | 8.2 (Integrity)                |
| 🟡 HIGH     | No Rate Limiting              | Denial of service via log spam        | 6.5 (Availability)             |
| 🟡 HIGH     | PII in Context Fields         | Email/phone logged despite masking    | 6.5 (Confidentiality)          |
| 🟡 HIGH     | No Audit Trail                | Untracked data access/deletion        | 6.1 (Accountability)           |
| 🟡 HIGH     | No Log Retention Policy       | Indefinite storage, compliance risk   | 5.9 (Compliance)               |
| 🟠 MEDIUM   | Weak API Key Auth             | Bearer token easily leaked            | 6.2 (Auth Bypass)              |
| 🟠 MEDIUM   | Context Isolation Missing     | Concurrent context mutation conflicts | 5.3 (Escalation)               |
| 🟠 MEDIUM   | No Anomaly Detection          | Silent data exfiltration possible     | 5.4 (Detection Gap)            |

---

## 5. Proposed Multi-Grade Cybersecurity Enhancements

### 5.1 Log Classification & Sensitivity Levels

**Objective**: Implement a 4-grade classification system to enforce differential access controls and encryption strategies.

#### Grade 1: PUBLIC (Open Data)

- Service metrics, timing, aggregated stats
- No user identifiers
- Example: `"Service started", "Request duration: 245ms"`
- **Retention**: 30 days
- **Access**: Any authenticated user
- **Encryption**: At rest only (bulk)

#### Grade 2: INTERNAL (Operational)

- Error messages, warnings, debug traces
- Generic user context (user_id, role)
- Example: `"Auth failed", "Database timeout"`
- **Retention**: 90 days
- **Access**: Services + operators (role-based)
- **Encryption**: At rest + transit TLS

#### Grade 3: CONFIDENTIAL (Sensitive)

- PII-related logs (even masked), security events, audit events
- User emails, phone numbers, transaction IDs
- Example: `"User login from new device", "Password reset requested"`
- **Retention**: 1 year + archive
- **Access**: Security team + admins only
- **Encryption**: End-to-end encrypted, separate key per log entry

#### Grade 4: SECRET (Highly Sensitive)

- Authentication credentials (tokens, API keys), financial data, health info
- Should never be logged, but if captured: triple-encrypted
- Example: `"OAuth token refresh", "Credit card validation"`
- **Retention**: 3 years (compliance), then shred
- **Access**: C-level audit team, cryptographic key management
- **Encryption**: Hardware Security Module (HSM) keys

#### Implementation in ILogEntry

```typescript
interface ILogEntry {
  // ... existing fields ...

  // NEW: Security classification
  classification?: "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "SECRET";
  // NEW: Encryption marker
  encryptedFields?: string[]; // ['context.email', 'meta.ssn']
  // NEW: Access restrictions
  requiredRoles?: string[]; // ['security_admin', 'compliance_officer']
  // NEW: Cryptographic integrity
  integrityHash?: string; // HMAC-SHA256 of log + nonce
  // NEW: Tamper detection
  signatureChain?: string; // HMAC chain to previous log for sequence verification
}
```

#### Database Schema Updates

```sql
-- Add classification columns
ALTER TABLE logs ADD COLUMN classification VARCHAR(20) DEFAULT 'INTERNAL';
ALTER TABLE logs ADD COLUMN encrypted_fields TEXT[] DEFAULT '{}';
ALTER TABLE logs ADD COLUMN required_roles TEXT[] DEFAULT '{}';
ALTER TABLE logs ADD COLUMN integrity_hash VARCHAR(64);
ALTER TABLE logs ADD COLUMN signature_chain VARCHAR(64);

-- Create index for classification filtering
CREATE INDEX idx_logs_classification ON logs(classification);

-- Create immutable audit table for log access
CREATE TABLE logs_access_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id UUID NOT NULL REFERENCES logs(id) ON DELETE CASCADE,
  accessed_by UUID NOT NULL REFERENCES auth.users(id),
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  access_type VARCHAR(20) NOT NULL,  -- 'SELECT', 'EXPORT', etc.
  ip_address INET,
  user_agent TEXT,
  CONSTRAINT immutable_audit CHECK (accessed_at = NOW())
);

-- RLS policy: only service role or audit team can read audit
CREATE POLICY "Audit access" ON logs_access_audit
  FOR SELECT USING (auth.role() = 'service_role' OR
                    EXISTS(SELECT 1 FROM auth.users WHERE id = auth.uid() AND role = 'audit_admin'));
```

### 5.2 Encryption at Rest & in Transit

#### Requirement 1: HTTPS/TLS for All Transports

**APITransport Enhancement**:

```typescript
export class SecureAPITransport implements ITransport {
  private endpoint: URL;
  private tlsConfig: {
    minVersion: "TLSv1.3";
    certificate?: string; // Client cert path
    key?: string; // Client key path
  };

  constructor(endpoint: string, options: SecureTransportConfig) {
    this.endpoint = new URL(endpoint);

    // Enforce HTTPS
    if (this.endpoint.protocol !== "https:") {
      throw new Error("SecureAPITransport requires HTTPS endpoint");
    }

    this.tlsConfig = options.tlsConfig || { minVersion: "TLSv1.3" };
  }

  async send(logEntry: ILogEntry): Promise<void> {
    // Implementation validates TLS certificate pinning
    // Prevents downgrade attacks
  }
}
```

**Certificate Pinning**:

```typescript
const pinnedCerts = [
  "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=", // Production cert
  "sha256/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb=", // Backup cert
];

const agent = new https.Agent({
  ca: pinnedCerts,
  maxVersion: "TLSv1.3",
  minVersion: "TLSv1.3",
});

const response = await fetch(endpoint, { agent });
```

#### Requirement 2: At-Rest Encryption (PostgreSQL pgcrypto)

**Enable pgcrypto**:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create master key (generated once, stored in AWS Secrets Manager or KMS)
-- In Supabase: use Database > Extensions > pgcrypto

-- Encrypt sensitive columns at insertion time
CREATE OR REPLACE FUNCTION encrypt_log_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Only encrypt if classification = 'CONFIDENTIAL' or 'SECRET'
  IF NEW.classification IN ('CONFIDENTIAL', 'SECRET') THEN
    -- Encrypt context JSONB field
    NEW.context := pgp_sym_encrypt(
      NEW.context::TEXT,
      (SELECT get_config('app.encryption.master_key')),
      'compress-algo=1, cipher-algo=aes256'
    )::JSONB;

    -- Encrypt meta JSONB field
    NEW.meta := pgp_sym_encrypt(
      NEW.meta::TEXT,
      (SELECT get_config('app.encryption.master_key')),
      'compress-algo=1, cipher-algo=aes256'
    )::JSONB;

    -- Encrypt message only if contains PII
    IF NEW.message ~* '([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|(\d{3}-\d{2}-\d{4})' THEN
      NEW.message := pgp_sym_encrypt(
        NEW.message,
        (SELECT get_config('app.encryption.master_key')),
        'compress-algo=1, cipher-algo=aes256'
      )::TEXT;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER encrypt_logs_trigger BEFORE INSERT ON logs
FOR EACH ROW EXECUTE FUNCTION encrypt_log_entry();
```

**Decryption on Read**:

```sql
-- Create view that transparently decrypts
CREATE OR REPLACE VIEW logs_decrypted AS
SELECT
  id,
  timestamp,
  level,
  CASE
    WHEN classification IN ('CONFIDENTIAL', 'SECRET') THEN
      pgp_sym_decrypt(
        message,
        (SELECT get_config('app.encryption.master_key'))
      )::TEXT
    ELSE message
  END AS message,
  CASE
    WHEN classification IN ('CONFIDENTIAL', 'SECRET') THEN
      pgp_sym_decrypt(
        context::TEXT,
        (SELECT get_config('app.encryption.master_key'))
      )::JSONB
    ELSE context
  END AS context,
  -- ... other fields ...
  classification,
  required_roles
FROM logs
WHERE classification = 'PUBLIC' OR 'CONFIDENTIAL' = ANY(required_roles)
  OR EXISTS(
    SELECT 1 FROM auth.users WHERE id = auth.uid() AND role = 'audit_admin'
  );
```

**Encryption Key Management**:

```
┌─────────────────────────────────────────┐
│  Master Encryption Key (MEK)            │
│  ├─ Storage: AWS Secrets Manager        │
│  ├─ Rotation: Quarterly                 │
│  ├─ Access: Service role only           │
│  └─ Audit: All accesses logged          │
│                                          │
│  ↓ (Retrieved at app startup)           │
│                                          │
│  Environment Variable: ENCRYPTION_MEK   │
│  (Injected into Supabase Edge Functions)│
│                                          │
│  ↓ (Used for all pgcrypto operations)   │
│                                          │
│  Database Column Encryption             │
│  ├─ CONFIDENTIAL logs                   │
│  └─ SECRET logs                         │
└─────────────────────────────────────────┘
```

### 5.3 Request Authentication & Authorization

#### Enhancement 1: API Key Hashing & Validation

```typescript
// Backend: Issue API key
async function issueAPIKey(serviceName: string): Promise<{ apiKey: string }> {
  const rawKey = crypto.randomBytes(32).toString("base64");
  const hashedKey = crypto.createHash("sha256").update(rawKey).digest("hex");

  // Store only hash in database
  await db.apiKeys.insert({
    id: crypto.randomUUID(),
    service_name: serviceName,
    key_hash: hashedKey,
    created_at: new Date(),
    last_used: null,
    enabled: true,
  });

  // Return raw key to caller (only once)
  return { apiKey: rawKey };
}

// Middleware: Validate API key
const validateAPIKey = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization" });
  }

  const rawKey = authHeader.slice(7);
  const hashedKey = crypto.createHash("sha256").update(rawKey).digest("hex");

  const apiKey = db.apiKeys.findOne({ key_hash: hashedKey, enabled: true });
  if (!apiKey) {
    return res.status(403).json({ error: "Invalid API key" });
  }

  // Record usage
  apiKey.last_used = new Date();
  req.serviceId = apiKey.id;
  req.serviceName = apiKey.service_name;

  next();
};
```

#### Enhancement 2: HMAC-Based Request Signing

```typescript
// Client: Sign request with secret
function signLogBatch(logs: ILogEntry[], secret: string): string {
  const payload = JSON.stringify(logs);
  const timestamp = Date.now().toString();
  const message = `${timestamp}.${payload}`;

  return crypto.createHmac("sha256", secret).update(message).digest("base64");
}

// POST /api/logs
const request = await fetch("https://api.sqooli.com/logs", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "X-Signature": signLogBatch(logs, sessionSecret),
    "X-Timestamp": Date.now().toString(),
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ logs }),
});

// Server: Verify signature
const verifyRequest = (req: Request): boolean => {
  const timestamp = parseInt(req.headers["x-timestamp"] as string);
  const signature = req.headers["x-signature"] as string;

  // Prevent replay: timestamp must be recent (5 minute window)
  if (Math.abs(Date.now() - timestamp) > 5 * 60 * 1000) {
    return false;
  }

  const payload = JSON.stringify(req.body.logs);
  const message = `${timestamp}.${payload}`;

  const expectedSignature = crypto
    .createHmac("sha256", req.serviceSecret)
    .update(message)
    .digest("base64");

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );
};
```

#### Enhancement 3: OAuth2 / OpenID Connect

```typescript
// Use OAuth2 for service-to-service authentication
// Replace simple Bearer token with JW T containing:
// - iss: issuer (identity provider)
// - sub: subject (service ID)
// - aud: audience (log ingestion service)
// - exp: expiration (1 hour)
// - client_assertion: request signing proof

const verifyJWT = (token: string): JWTPayload => {
  return jwt.verify(token, publicKey, {
    issuer: "https://auth.sqooli.com",
    audience: "https://logs-api.sqooli.com",
    algorithms: ["RS256"],
  });
};
```

### 5.4 Rate Limiting & Throttling

**Issue**: No protection against log flooding (DoS).

**Solution**:

```typescript
import {
  RateLimiterMemory,
  RateLimiterStoreRedis,
} from "rate-limiter-flexible";

// Production: Use Redis-backed distributed rate limiter
const rateLimiter = new RateLimiterStoreRedis({
  storeClient: redisClient,
  keyPrefix: "log-api",
  points: 10000, // 10k logs
  duration: 60, // per minute
  blockDurationSec: 300, // 5 min block on breach
});

async function applyRateLimit(req: Request, res: Response, next: NextFunction) {
  const key = `${req.serviceId}:${req.ip}`;
  const logCount = req.body.logs?.length || 1;

  try {
    await rateLimiter.consume(key, logCount);
    next();
  } catch (rejRes) {
    if (rejRes instanceof Error) {
      return res.status(429).json({
        error: "Rate limit exceeded",
        retryAfter: Math.ceil(rejRes.remainingPoints),
      });
    }
  }
}

// Middleware order
app.use(validateAPIKey);
app.use(applyRateLimit);
app.post("/api/logs", ingestLogs);
```

### 5.5 Tamper Detection & Log Integrity

**Issue**: No way to detect if logs were modified after insertion.

**Solution: HMAC Signature Chain**

```typescript
async function computeLogIntegrity(
  log: ILogEntry,
  previousLogHash?: string
): Promise<{ integrityHash: string; signatureChain: string }> {
  // Step 1: Compute HMAC of log content
  const logContent = JSON.stringify({
    timestamp: log.timestamp,
    level: log.level,
    message: log.message,
    context: log.context,
    source: log.source,
    userId: log.userId,
  });

  const masterKey = process.env.LOG_INTEGRITY_KEY || '';
  const integrityHash = crypto
    .createHmac('sha256', masterKey)
    .update(logContent)
    .digest('hex');

  // Step 2: Chain to previous log for forward integrity
  // This creates a Merkle chain that makes retroactive tampering impossible
  const signatureChain = crypto
    .createHmac('sha256', masterKey)
    .update(`${previousLogHash}:${integrityHash}`)
    .digest('hex');

  return { integrityHash, signatureChain };
}

// Database trigger for automatic computation
CREATE OR REPLACE FUNCTION compute_log_integrity()
RETURNS TRIGGER AS $$
DECLARE
  prev_hash VARCHAR(64);
  last_log logs%ROWTYPE;
BEGIN
  -- Get previous log's signature for chaining
  SELECT integrity_hash INTO prev_hash
  FROM logs
  WHERE id < NEW.id
  ORDER BY id DESC
  LIMIT 1;

  -- Compute integrity hashes
  NEW.integrity_hash := encode(
    hmac(
      json_build_object(
        'timestamp', NEW.timestamp,
        'level', NEW.level,
        'message', NEW.message,
        'source', NEW.source
      )::TEXT,
      current_setting('app.log_integrity_key'),
      'sha256'
    ),
    'hex'
  );

  NEW.signature_chain := encode(
    hmac(
      COALESCE(prev_hash, '') || ':' || NEW.integrity_hash,
      current_setting('app.log_integrity_key'),
      'sha256'
    ),
    'hex'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER integrity_trigger BEFORE INSERT ON logs
FOR EACH ROW EXECUTE FUNCTION compute_log_integrity();
```

**Verification Query**:

```sql
-- Verify integrity chain is unbroken
WITH log_chain AS (
  SELECT
    id,
    timestamp,
    integrity_hash,
    signature_chain,
    LAG(integrity_hash) OVER (ORDER BY timestamp) as prev_hash
  FROM logs
  WHERE created_at > NOW() - INTERVAL '24 hours'
)
SELECT
  id,
  CASE
    WHEN encode(
      hmac(
        COALESCE(prev_hash, '') || ':' || integrity_hash,
        'APP_KEY',
        'sha256'
      ),
      'hex'
    ) = signature_chain THEN 'VALID'
    ELSE 'INVALID - TAMPERED'
  END as integrity_status
FROM log_chain
ORDER BY timestamp DESC;
```

### 5.6 Anomaly Detection & Security Monitoring

**New Transport: SecurityMonitorTransport**

```typescript
export class SecurityMonitorTransport implements ITransport {
  name = "security-monitor";
  enabled = true;

  async send(logEntry: ILogEntry): Promise<void> {
    // Real-time anomaly detection
    await this.detectAnomalies(logEntry);
  }

  private async detectAnomalies(log: ILogEntry): Promise<void> {
    // Pattern 1: Excessive errors from single user
    if (log.level === "ERROR") {
      const recentErrors = await this.countRecentLogs(
        "ERROR",
        log.userId,
        5, // minutes
      );

      if (recentErrors > 10) {
        await this.raiseAlert({
          type: "EXCESSIVE_ERRORS",
          severity: "HIGH",
          affectedUser: log.userId,
          count: recentErrors,
          threshold: 10,
        });
      }
    }

    // Pattern 2: Failed authentication spike
    if (log.message.includes("Authentication failed")) {
      const failedAttempts = await this.countRecentLogs(
        "WARN",
        null, // any user
        1, // minute
        "Authentication failed",
      );

      if (failedAttempts > 50) {
        await this.raiseAlert({
          type: "AUTH_ATTACK_SUSPECTED",
          severity: "CRITICAL",
          attemptCount: failedAttempts,
          pattern: "Brute force attempt detected",
        });
      }
    }

    // Pattern 3: Unusual geographic access
    const userCountries = await this.getUserCountryHistory(log.userId);
    if (this.isImprobableTravelDistance(userCountries)) {
      await this.raiseAlert({
        type: "IMPOSSIBLE_TRAVEL",
        severity: "HIGH",
        affectedUser: log.userId,
        lastCountry: userCountries[0],
        currentCountry: log.ipAddress,
      });
    }

    // Pattern 4: Data exfiltration (high volume reads/exports)
    if (log.message === "Logs exported" && log.meta?.recordCount > 10000) {
      await this.raiseAlert({
        type: "SUSPICIOUS_DATA_EXPORT",
        severity: "CRITICAL",
        actor: log.userId,
        recordCount: log.meta.recordCount,
        destinationIP: log.ipAddress,
      });
    }
  }

  private async raiseAlert(alert: SecurityAlert): Promise<void> {
    // Send to SIEM system (Splunk, Datadog, Wazuh, etc.)
    await fetch("https://siem.sqooli.com/api/alerts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SIEM_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...alert,
        timestamp: new Date().toISOString(),
        source: "jelly-logger",
      }),
    });

    // Also escalate high/critical to Slack/PagerDuty
    if (alert.severity === "CRITICAL") {
      await this.notifySecurityTeam(alert);
    }
  }

  private async notifySecurityTeam(alert: SecurityAlert): Promise<void> {
    // PagerDuty escalation
    await fetch("https://api.pagerduty.com/incidents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAGERDUTY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        incident: {
          type: "incident",
          title: `[SECURITY] ${alert.type}`,
          body: {
            type: "incident_body",
            details: JSON.stringify(alert),
          },
          urgency: alert.severity === "CRITICAL" ? "high" : "low",
        },
      }),
    });
  }

  async batch(logEntries: ILogEntry[]): Promise<void> {
    for (const entry of logEntries) {
      await this.send(entry);
    }
  }

  async flush(): Promise<void> {}
  async close(): Promise<void> {}

  private async countRecentLogs(
    level: string,
    userId?: string,
    minutes: number = 5,
    messagePattern?: string,
  ): Promise<number> {
    const query = `
      SELECT COUNT(*) as count FROM logs
      WHERE level = $1
        AND timestamp > NOW() - (${minutes} || ' minutes')::INTERVAL
        ${userId ? " AND user_id = $2" : ""}
        ${messagePattern ? ` AND message ILIKE '%${messagePattern}%'` : ""}
    `;

    const result = await db.query(query, [level, ...(userId ? [userId] : [])]);
    return result.rows[0].count;
  }

  private async getUserCountryHistory(userId: string): Promise<string[]> {
    // Use GeoIP database to convert IP to country
    // For demo, return array of countries from logs
    const records = await db.query(
      `
      SELECT DISTINCT
        (geoip(ip_address::INET)).country_name as country
      FROM logs
      WHERE user_id = $1
      ORDER BY timestamp DESC
      LIMIT 10
    `,
      [userId],
    );

    return records.rows.map((r) => r.country);
  }

  private isImprobableTravelDistance(countries: string[]): boolean {
    if (countries.length < 2) return false;

    // Haversine distance calculation
    // If user appears in USA and Singapore within 2 hours, impossible
    const distance = this.calculateDistance(countries[0], countries[1]);
    const maxSpeed = 900; // km/h (max commercial aircraft)

    return distance > maxSpeed * 2; // 2 hour window
  }

  private calculateDistance(from: string, to: string): number {
    // Implement Haversine formula or use geolocation API
    // Simplified for demo
    const distances: Record<string, Record<string, number>> = {
      USA: { Singapore: 13600, UK: 5500 },
      UK: { Singapore: 10900, USA: 5500 },
    };

    return distances[from]?.[to] || 0;
  }
}
```

### 5.7 Role-Based Access Control (RBAC) for Logs

**Database RLS Enhancement**:

```sql
-- Create roles table
CREATE TABLE log_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_classification VARCHAR(20) NOT NULL,
  can_read BOOLEAN DEFAULT false,
  can_export BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, log_classification)
);

-- Enhanced RLS: classification-aware access
CREATE POLICY "Read logs by classification" ON logs
  FOR SELECT
  USING (
    -- PUBLIC logs: anyone can read
    classification = 'PUBLIC' OR
    -- INTERNAL logs: services and operators
    (classification = 'INTERNAL' AND EXISTS(
      SELECT 1 FROM log_roles
      WHERE user_id = auth.uid()
        AND log_classification = 'INTERNAL'
        AND can_read = true
    )) OR
    -- CONFIDENTIAL logs: security team only
    (classification = 'CONFIDENTIAL' AND EXISTS(
      SELECT 1 FROM log_roles
      WHERE user_id = auth.uid()
        AND log_classification = 'CONFIDENTIAL'
        AND can_read = true
    )) OR
    -- SECRET logs: C-level audit only
    (classification = 'SECRET' AND EXISTS(
      SELECT 1 FROM log_roles
      WHERE user_id = auth.uid()
        AND log_classification = 'SECRET'
        AND can_read = true
    ))
  );

-- Grant read access to security team
INSERT INTO log_roles (user_id, log_classification, can_read, can_export)
SELECT id, 'CONFIDENTIAL', true, true
FROM auth.users
WHERE role = 'security_admin';

INSERT INTO log_roles (user_id, log_classification, can_read, can_export)
SELECT id, 'SECRET', true, false
FROM auth.users
WHERE role = 'audit_admin';
```

### 5.8 Audit Logging & Compliance

**Audit Trail Table**:

```sql
CREATE TABLE log_access_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_by UUID NOT NULL REFERENCES auth.users(id),
  accessed_resource VARCHAR(255) NOT NULL,  -- 'logs', 'log_stats', etc.
  action VARCHAR(20) NOT NULL,              -- 'SELECT', 'EXPORT', 'DELETE'
  filters JSONB,                            -- Query filters applied
  record_count INTEGER,                     -- Rows affected
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(20) DEFAULT 'SUCCESS',
  error_message TEXT,
  accessed_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (accessed_at);

-- Create monthly partitions for retention management
CREATE TABLE log_access_audit_202602 PARTITION OF log_access_audit
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- Immutable: append-only via trigger
CREATE OR REPLACE FUNCTION audit_log_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO log_access_audit (
    accessed_by,
    accessed_resource,
    action,
    ip_address,
    user_agent,
    status
  ) VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    TG_OP,
    inet_client_addr(),
    current_setting('application_name'),
    'SUCCESS'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on SELECT query (via pg_stat_statements extension)
-- Trigger on DELETE for actual deletion tracking
CREATE TRIGGER audit_log_delete BEFORE DELETE ON logs
FOR EACH STATEMENT EXECUTE FUNCTION audit_log_access();
```

**Compliance Reporting**:

```sql
-- Who accessed what logs during a specific period
SELECT
  u.email,
  aaa.action,
  aaa.filters ->> 'classification' as log_classification,
  COUNT(*) as access_count,
  ARRAY_AGG(DISTINCT aaa.ip_address) as source_ips
FROM log_access_audit aaa
JOIN auth.users u ON aaa.accessed_by = u.id
WHERE aaa.accessed_at > NOW() - INTERVAL '30 days'
  AND aaa.action IN ('SELECT', 'EXPORT')
GROUP BY u.email, aaa.action, aaa.filters ->> 'classification'
ORDER BY access_count DESC;
```

---

## 6. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2) - CRITICAL FIXES

**Objectives**: Address CRITICAL vulnerabilities before scaling.

| Task         | Component                              | Complexity | Dependencies    |
| ------------ | -------------------------------------- | ---------- | --------------- |
| 1.1          | Enforce HTTPS for APITransport         | Low        | None            |
| 1.2          | Implement API Key hashing & validation | Low        | Auth middleware |
| 1.3          | Add HMAC request signing               | Medium     | 1.2             |
| 1.4          | Enable pgcrypto in PostgreSQL          | Low        | DB access       |
| 1.5          | Create log classification enum         | Low        | None            |
| 1.6          | Add rate limiting middleware           | Medium     | Redis setup     |
| **Subtotal** | **6 tasks**                            | **4 days** | **DevOps + DB** |

### Phase 2: Encryption & Integrity (Weeks 3-4) - HIGH PRIORITY

| Task         | Component                                                 | Complexity | Dependencies    |
| ------------ | --------------------------------------------------------- | ---------- | --------------- |
| 2.1          | Implement column encryption (CONFIDENTIAL, SECRET)        | High       | 1.4             |
| 2.2          | Create encryption key management system (AWS KMS/Secrets) | High       | DevOps          |
| 2.3          | Compute HMAC signature chain for tamper detection         | High       | 2.1             |
| 2.4          | Create logs_access_audit table & RLS                      | Medium     | DB DDL          |
| 2.5          | Implement transparent decryption view                     | Medium     | 2.1             |
| 2.6          | Add certificate pinning to APITransport                   | Medium     | 1.1             |
| **Subtotal** | **6 tasks**                                               | **8 days** | **All Phase 1** |

### Phase 3: Access Control & Monitoring (Weeks 5-6) - MEDIUM

| Task         | Component                                              | Complexity | Dependencies  |
| ------------ | ------------------------------------------------------ | ---------- | ------------- |
| 3.1          | Create log_roles table & RBAC for classifications      | Medium     | 1.5, DB DDL   |
| 3.2          | Implement SecurityMonitorTransport (anomaly detection) | High       | Core logger   |
| 3.3          | Integrate with SIEM (Splunk/Datadog)                   | Medium     | 3.2, API keys |
| 3.4          | Create audit logging interface & triggers              | Medium     | 2.4           |
| 3.5          | Implement PagerDuty escalation for CRITICAL alerts     | Low        | 3.2           |
| 3.6          | Enhanced RLS policies for classification-aware access  | Medium     | 3.1           |
| **Subtotal** | **6 tasks**                                            | **7 days** | **Phase 2**   |

### Phase 4: Features & Optimization (Weeks 7-8) - NICE-TO-HAVE

| Task         | Component                                        | Complexity | Dependencies  |
| ------------ | ------------------------------------------------ | ---------- | ------------- |
| 4.1          | OAuth2/JWT authentication for service-to-service | Medium     | 1.3           |
| 4.2          | Multi-tenant log isolation                       | High       | 3.1           |
| 4.3          | Encryption key rotation automation               | High       | 2.2           |
| 4.4          | Log retention and purge automation               | Medium     | DB policies   |
| 4.5          | Dashboard for monitoring audit access patterns   | Low        | 2.4           |
| 4.6          | Frontend consent dialog for CONFIDENTIAL logging | Medium     | React context |
| **Subtotal** | **6 tasks**                                      | **7 days** | **All prior** |

### Gantt Timeline

```
Week 1-2: ████ Phase 1 (CRITICAL)
Week 3-4: ████████ Phase 2 (Encryption, Audit)
Week 5-6: ██████████ Phase 3 (RBAC, Monitoring)
Week 7-8: ████████ Phase 4 (Features)
─────────────────────────────────────
Total: 8 weeks, 25 FTE-days, 2 engineers
```

---

## 7. Potential Risks & Mitigations

### Risk Matrix

| Risk                                        | Probability | Impact   | Mitigation                                                                  |
| ------------------------------------------- | ----------- | -------- | --------------------------------------------------------------------------- |
| **Encryption key compromise**               | Low         | CRITICAL | HSM-backed key storage, key rotation quarterly, access auditing             |
| **Performance degradation from encryption** | Medium      | HIGH     | Benchmark AES-256-GCM, implement caching layer, selective encryption        |
| **API rate limiter false positives**        | High        | MEDIUM   | Tune thresholds per service, whitelist trusted IPS, circuit breaker         |
| **Database migration failures**             | Medium      | HIGH     | Staging environment testing, RTO <30min, automated rollback script          |
| **SIEM integration overload**               | Low         | MEDIUM   | Batch alerts, severity filtering, backoff strategy                          |
| **Log data extraction during migration**    | Low         | CRITICAL | Encryption before any data move, no logs printed to stdout                  |
| **Timezone/timestamp inconsistencies**      | Low         | MEDIUM   | Enforce UTC-only, validate at ingestion, sync NTP                           |
| **PII redaction bypass**                    | Low         | HIGH     | Regex fuzzing, automated PII scanning pre-insert, human audit               |
| **Audit trail tampering**                   | Very Low    | CRITICAL | Immutable partitioned tables, sequence checking, cryptographic verification |
| **Retrograde compatibility breakage**       | Medium      | MEDIUM   | Versioned API endpoints, feature flags, gradual rollout                     |

### Mitigation Strategies

#### 1. Performance Testing

```
Baseline (Before Encryption):
- 1000 logs/sec throughput
- 45ms avg latency
- 2% CPU overhead

Target (After Encryption):
- 800 logs/sec (acceptable, 20% degradation)
- 65ms avg latency (+20ms for crypto)
- 8% CPU overhead (+6%)

Test Matrix:
├─ Single-threaded writes (SQLite/local)
├─ Batch insert (PostgreSQL 50x batches)
├─ Concurrent reads (10 parallel connections)
├─ Decryption view on large result sets (10k rows)
└─ Index performance under encryption
```

#### 2. Key Rotation Without Downtime

```sql
-- Step 1: Introduce new key, keep old key available
INSERT INTO encryption_keys (id, key_material, algorithm, status, active)
VALUES ('key-2026-02', new_key_bytes, 'aes256-gcm', 'active', false);

-- Step 2: Re-encrypt all logs with new key (background job, weeks 1-2)
UPDATE logs
SET context = pgp_sym_encrypt(
  pgp_sym_decrypt(context, old_key),
  new_key,
  'compress-algo=1, cipher-algo=aes256'
)
WHERE encryption_key_id = 'key-2026-01'
LIMIT 1000;  -- Batch to avoid lock contention

-- Step 3: Mark new key as active, deprecate old key
UPDATE encryption_keys SET active = true WHERE id = 'key-2026-02';
UPDATE encryption_keys SET active = false, deprecated_at = NOW() WHERE id = 'key-2026-01';

-- Step 4: Purge old key after 30-day grace period
DELETE FROM encryption_keys WHERE deprecated_at < NOW() - INTERVAL '30 days';
```

#### 3. Staged Rollout with Feature Flags

```typescript
interface LoggerConfig {
  // Phased enablement flags
  enableClassification?: boolean; // Phase 1
  enableEncryption?: boolean; // Phase 2
  enableAuditLogging?: boolean; // Phase 3
  enableAnomalyDetection?: boolean; // Phase 3
  enableRBAC?: boolean; // Phase 2

  // Gradual percentage rollout
  encryptionRolloutPercent?: 0 | 25 | 50 | 75 | 100; // Week 5, 6, 7, etc.
}

// Usage in logger
if (
  this.config.enableEncryption &&
  Math.random() * 100 < this.config.encryptionRolloutPercent
) {
  // Encrypt this specific log entry
  entry = await encryptSensitiveFields(entry);
}
```

---

## 8. Future-Proof Extensibility Recommendations

### 8.1 Transport Plugin Ecosystem

**Vision**: Enable third-party transport implementations without core logger changes.

```typescript
// Define plugin interface
export interface ILoggerPlugin {
  name: string;
  version: string;
  requires: string[]; // List of required plugins

  install(logger: JellyLogger): void;
  uninstall(logger: JellyLogger): void;
}

// Example: Elasticsearch Transport Plugin
export class ElasticsearchTransportPlugin implements ILoggerPlugin {
  name = "elasticsearch-transport";
  version = "1.0.0";
  requires = ["base-logger@>=1.0.0"];

  install(logger: JellyLogger): void {
    const esTransport = new ElasticsearchTransport(process.env.ES_ENDPOINT, {
      indexPrefix: "logs",
      bulkSize: 100,
      refreshInterval: 5000,
    });

    logger.addTransport(esTransport);
  }

  uninstall(logger: JellyLogger): void {
    logger.removeTransport("elasticsearch");
  }
}

// Registry for discovering/loading plugins
const pluginRegistry = new PluginRegistry();
pluginRegistry.register(ElasticsearchTransportPlugin);
pluginRegistry.register(DatadogTransportPlugin);
pluginRegistry.register(SiemTransportPlugin);

// Load at runtime
const logger = JellyLogger.getInstance(config);
pluginRegistry.installAll(logger);
```

### 8.2 Structured Logging with OpenTelemetry

**Vision**: Integrate with industry-standard observability framework.

```typescript
// Install OpenTelemetry SDKs
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import {
  ConsoleSpanExporter,
  BatchSpanProcessor,
} from "@opentelemetry/sdk-trace-node";

const sdk = new NodeSDK({
  instrumentations: [getNodeAutoInstrumentations()],
  traceExporter: new ConsoleSpanExporter(),
});

sdk.start();

// Bridge Jelly Logger to OpenTelemetry
export class OpenTelemetryTransport implements ITransport {
  name = "otel";
  enabled = true;
  private tracer = trace.getTracer("jelly-logger");

  async send(logEntry: ILogEntry): Promise<void> {
    const span = this.tracer.startSpan(`log.${logEntry.level.toLowerCase()}`, {
      attributes: { ...logEntry },
    });

    span.addEvent("log_generated", {
      "log.message": logEntry.message,
      "log.level": logEntry.level,
      "log.source": logEntry.source,
    });

    span.end();
  }

  async batch(logEntries: ILogEntry[]): Promise<void> {
    const span = this.tracer.startSpan("logs.batch", {
      attributes: { "batch.size": logEntries.length },
    });

    for (const entry of logEntries) {
      await this.send(entry);
    }

    span.end();
  }

  async flush(): Promise<void> {}
  async close(): Promise<void> {}
}
```

### 8.3 Log Filtering & Transformation Pipeline

**Vision**: Allow middleware-style log transformations before transmission.

```typescript
export interface ILogTransformer {
  name: string;
  transform(entry: ILogEntry): ILogEntry | null;
  priority: number; // Higher = runs first
}

// Example transformers
class SensitiveDataRedactor implements ILogTransformer {
  name = "redact-sensitive";
  priority = 100; // Runs first

  transform(entry: ILogEntry): ILogEntry {
    // Remove credit card numbers, API keys, etc.
    if (entry.message.match(/\d{16}/)) {
      entry.message = entry.message.replace(/\d{16}/g, "****-****-****-****");
    }
    return entry;
  }
}

class PersistenceLocationDecider implements ILogTransformer {
  name = "routing";
  priority = 50;

  transform(entry: ILogEntry): ILogEntry | null {
    // Route CRITICAL logs to immediate-alert transport
    if (entry.severity === "CRITICAL") {
      entry.transportIds = ["immediate-alert", "database"];
      return entry;
    }

    // Drop DEBUG logs in production
    if (entry.level === "DEBUG" && process.env.NODE_ENV === "production") {
      return null; // Skip this log
    }

    return entry;
  }
}

// Usage
const logger = JellyLogger.getInstance(config);
logger.addTransformer(new SensitiveDataRedactor());
logger.addTransformer(new PersistenceLocationDecider());
```

### 8.4 Log Querying & Analytics DSL

**Vision**: Provide high-level query language for log analysis (like Splunk SPL).

```typescript
// Example: Custom query language
const query = `
  level=ERROR AND source=auth-service
  | stats count() as error_count BY user_id
  | where error_count > 5
  | top 10 by error_count
`;

const results = await logger.query(query);
// Returns: [
//   { user_id: 'user-123', error_count: 47 },
//   { user_id: 'user-456', error_count: 23 },
//   ...
// ]

// Alternative: Fluent API
const results = await logger
  .query()
  .where("level", "=", "ERROR")
  .where("source", "=", "auth-service")
  .groupBy("user_id")
  .aggregate("count")
  .having("count", ">", 5)
  .sortBy("count", "desc")
  .limit(10)
  .execute();
```

### 8.5 Multi-Tenant Log Isolation

**Vision**: Support complete data isolation for SaaS deployments.

```typescript
interface MultiTenantLoggerConfig extends ILoggerConfig {
  tenantId: string; // Identifier for this tenant
  tenantEncryptionKey?: string; // Per-tenant key
  tenantDataRetention?: number; // Days
  tenantRateLimits?: {
    logsPerSecond: number;
    storageGBPerMonth: number;
  };
}

class MultiTenantLogger {
  private loggers: Map<string, JellyLogger> = new Map();

  getLogger(tenantId: string): JellyLogger {
    if (!this.loggers.has(tenantId)) {
      this.loggers.set(
        tenantId,
        JellyLogger.getInstance({
          serviceName: `${this.serviceName}:${tenantId}`,
          customContext: { tenantId },
        }),
      );
    }
    return this.loggers.get(tenantId)!;
  }
}

// Express middleware for tenant routing
const multiTenantLogging = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const tenantId = req.headers["x-tenant-id"] as string;
  const logger = mtLogger.getLogger(tenantId);
  req.logger = logger;
  next();
};

app.use(multiTenantLogging);

// Usage in route
app.get("/api/data", (req: Request, res: Response) => {
  req.logger.info("Fetching data"); // Automatically isolated to tenant
});
```

---

## 9. Conclusion & Recommendations

### Key Takeaways

1. **Current State**: Jelly Logger provides a solid, extensible foundation with context propagation and multi-transport support.

2. **Security Gaps**: Critical vulnerabilities exist in transport security (HTTP plaintext), storage encryption, access control, and tampering detection.

3. **Upgrade Path**: A phased, 8-week roadmap can systematically address CRITICAL→HIGH→MEDIUM risks while maintaining compatibility.

4. **Future-Proof**: Architecture allows seamless integration with OpenTelemetry, plugin ecosystem, and multi-tenant deployments.

### Recommended Implementation Priority

**Immediate (Week 1)**:

- ✅ HTTPS enforcement
- ✅ API key validation
- ✅ Rate limiting

**Short-term (Weeks 2-4)**:

- ✅ Column encryption (pgcrypto)
- ✅ HMAC signature chain
- ✅ Access audit logging

**Medium-term (Weeks 5-6)**:

- ✅ Role-based access control
- ✅ Anomaly detection
- ✅ SIEM integration

**Long-term (Weeks 7-8 & beyond)**:

- ✅ OAuth2 integration
- ✅ Multi-tenant isolation
- ✅ OpenTelemetry bridge
- ✅ Self-hosted deployment options

### Success Metrics

| Metric                                         | Target                      | Timeline |
| ---------------------------------------------- | --------------------------- | -------- |
| Encryption coverage (CONFIDENTIAL+SECRET logs) | 95%+                        | Week 4   |
| MTTR for security incidents                    | <15 minutes                 | Week 6   |
| Audit trail completeness                       | 100% of data access tracked | Week 4   |
| Role-based access enforcement                  | All classifications         | Week 3   |
| Anomaly detection false positive rate          | <5%                         | Week 6   |
| API TLS adoption                               | 100% of clients             | Week 1   |
| Log tampering detection success                | 100% (cryptographic)        | Week 4   |

### Contact & Support

For questions on this upgrade roadmap, contact:

- **Security Lead**: security@sqooli.com
- **Architecture**: arch@sqooli.com
- **Database**: dba@sqooli.com

---

**Document Approval**:

- [ ] Security Team
- [ ] Architecture Review
- [ ] Database Administration
- [ ] Compliance Officer
- [ ] Engineering Leadership

---

**Version History**:

- **v1.0** (Feb 8, 2026): Initial comprehensive analysis and upgrade roadmap
