-- Push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint        text UNIQUE NOT NULL,
  p256dh          text,
  auth            text,
  subscription_json jsonb NOT NULL,
  created_at      timestamptz DEFAULT now(),
  last_seen_at    timestamptz DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_push_subs_endpoint ON push_subscriptions (endpoint);

-- RLS: service role only (no public reads)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Auto-clean subscriptions not seen in 90 days
CREATE OR REPLACE FUNCTION prune_stale_push_subscriptions()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM push_subscriptions WHERE last_seen_at < now() - interval '90 days';
END;
$$;
