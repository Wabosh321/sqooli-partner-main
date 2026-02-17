-- =============================================
-- JELLY LOGGER - SUPABASE DATABASE SCHEMA
-- =============================================

-- Create logs table
CREATE TABLE IF NOT EXISTS logs (
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

-- Create indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_source ON logs(source);
CREATE INDEX IF NOT EXISTS idx_logs_severity ON logs(severity);
CREATE INDEX IF NOT EXISTS idx_logs_request_id ON logs(request_id);
CREATE INDEX IF NOT EXISTS idx_logs_tags ON logs USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_logs_context_gin ON logs USING GIN(context);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp_level ON logs(timestamp DESC, level);

-- Enable Row Level Security
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read access for authenticated users" ON logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for service role" ON logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Enable update access for service role" ON logs
  FOR UPDATE USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable delete access for service role" ON logs
  FOR DELETE USING (auth.role() = 'service_role');

-- Function to get error statistics
CREATE OR REPLACE FUNCTION get_error_stats(days INTEGER DEFAULT 7)
RETURNS TABLE(
  date DATE,
  error_count BIGINT,
  unique_users BIGINT,
  most_common_error TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(l.timestamp) as date,
    COUNT(*) as error_count,
    COUNT(DISTINCT l.user_id) as unique_users,
    (SELECT l2.message FROM logs l2 
     WHERE DATE(l2.timestamp) = DATE(l.timestamp) 
       AND l2.level = 'ERROR'
     GROUP BY l2.message 
     ORDER BY COUNT(*) DESC 
     LIMIT 1) as most_common_error
  FROM logs l
  WHERE l.level = 'ERROR'
    AND l.timestamp >= NOW() - (days || ' days')::INTERVAL
  GROUP BY DATE(l.timestamp)
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get log summary
CREATE OR REPLACE FUNCTION get_log_summary(days INTEGER DEFAULT 7)
RETURNS TABLE(
  total_logs BIGINT,
  by_level JSONB,
  by_severity JSONB,
  by_source JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_logs,
    jsonb_object_agg(
      COALESCE(l.level, 'UNKNOWN'),
      COUNT(*)
    ) as by_level,
    jsonb_object_agg(
      COALESCE(l.severity, 'UNKNOWN'),
      COUNT(*)
    ) as by_severity,
    jsonb_object_agg(
      COALESCE(l.source, 'UNKNOWN'),
      COUNT(*)
    ) as by_source
  FROM logs l
  WHERE l.timestamp >= NOW() - (days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old logs
CREATE OR REPLACE FUNCTION cleanup_old_logs(days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM logs
  WHERE timestamp < NOW() - (days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- View for recent errors
CREATE OR REPLACE VIEW recent_errors AS
SELECT
  id,
  timestamp,
  message,
  level,
  severity,
  source,
  user_id,
  context,
  stack_trace
FROM logs
WHERE level IN ('ERROR', 'FATAL')
  AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- View for performance warnings
CREATE OR REPLACE VIEW performance_warnings AS
SELECT
  id,
  timestamp,
  message,
  request_id,
  duration_ms,
  source
FROM logs
WHERE duration_ms > 1000
  AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY duration_ms DESC;

-- Create trigger to automatically trim old logs (optional)
CREATE OR REPLACE FUNCTION auto_cleanup_logs()
RETURNS TRIGGER AS $$
BEGIN
  -- Keep only last 90 days of logs
  DELETE FROM logs WHERE timestamp < NOW() - INTERVAL '90 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to run on INSERT
CREATE TRIGGER logs_cleanup_trigger
  AFTER INSERT ON logs
  FOR EACH ROW
  WHEN (random() < 0.01) -- Run 1% of the time to avoid overhead
  EXECUTE FUNCTION auto_cleanup_logs();
