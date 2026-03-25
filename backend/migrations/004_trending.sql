-- Migration 004: Trending topics and province sentiment
-- Run against your Supabase project

-- Trending topics — hourly snapshots
CREATE TABLE IF NOT EXISTS trending_topics (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    rank        INTEGER NOT NULL,
    topic       TEXT NOT NULL,
    mentions    INTEGER NOT NULL DEFAULT 1,
    growth_pct  INTEGER NOT NULL DEFAULT 0,
    category    TEXT NOT NULL DEFAULT 'general',
    province    TEXT NOT NULL DEFAULT 'National',
    is_new      BOOLEAN NOT NULL DEFAULT false,
    articles    JSONB NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS trending_topics_computed_at_idx ON trending_topics(computed_at DESC);
CREATE INDEX IF NOT EXISTS trending_topics_rank_idx ON trending_topics(rank);

-- Province sentiment — hourly snapshots
CREATE TABLE IF NOT EXISTS province_sentiment (
    id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    computed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    province           TEXT NOT NULL,
    sentiment_score    NUMERIC(5,3) NOT NULL DEFAULT 0,
    article_count      INTEGER NOT NULL DEFAULT 0,
    top_topic          TEXT,
    UNIQUE (computed_at, province)
);

CREATE INDEX IF NOT EXISTS province_sentiment_computed_at_idx ON province_sentiment(computed_at DESC);
CREATE INDEX IF NOT EXISTS province_sentiment_province_idx ON province_sentiment(province);

-- Auto-delete trending data older than 30 days
CREATE OR REPLACE FUNCTION delete_old_trending() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM trending_topics WHERE computed_at < now() - INTERVAL '30 days';
    DELETE FROM province_sentiment WHERE computed_at < now() - INTERVAL '30 days';
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_delete_old_trending
    AFTER INSERT ON trending_topics
    EXECUTE PROCEDURE delete_old_trending();

-- Views
CREATE OR REPLACE VIEW latest_trending AS
    SELECT * FROM trending_topics
    WHERE computed_at = (SELECT MAX(computed_at) FROM trending_topics)
    ORDER BY rank;

CREATE OR REPLACE VIEW latest_province_sentiment AS
    SELECT * FROM province_sentiment
    WHERE computed_at = (SELECT MAX(computed_at) FROM province_sentiment)
    ORDER BY sentiment_score DESC;

-- RLS
ALTER TABLE trending_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE province_sentiment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read trending" ON trending_topics FOR SELECT USING (true);
CREATE POLICY "public read province_sentiment" ON province_sentiment FOR SELECT USING (true);
