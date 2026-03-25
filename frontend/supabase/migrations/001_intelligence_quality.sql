-- ============================================================
-- LoudWatch ZA — Intelligence Quality System
-- Migration 001: Add quality metadata to news_items
-- ============================================================

-- Add intelligence quality columns to news_items
ALTER TABLE news_items
  ADD COLUMN IF NOT EXISTS source_tier         varchar(10)  DEFAULT 'tier4',
  ADD COLUMN IF NOT EXISTS convergence_status  varchar(20)  DEFAULT 'SINGLE_SOURCE',
  ADD COLUMN IF NOT EXISTS convergence_score   decimal(4,3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source_count        integer      DEFAULT 1,
  ADD COLUMN IF NOT EXISTS verified            boolean      DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS verification_reason text         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS groq_confidence     decimal(4,3) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS plain_summary       text         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS requires_verification boolean    DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_sa_relevant      boolean      DEFAULT true;

-- Index for convergence queries
CREATE INDEX IF NOT EXISTS idx_news_convergence
  ON news_items (convergence_status, published_at DESC);

-- Index for trust-tier queries
CREATE INDEX IF NOT EXISTS idx_news_source_tier
  ON news_items (source_tier, published_at DESC);

-- Index for SA relevance filter (exclude non-SA content fast)
CREATE INDEX IF NOT EXISTS idx_news_sa_relevant
  ON news_items (is_sa_relevant, published_at DESC)
  WHERE is_sa_relevant = true;

-- ============================================================
-- Story clusters table
-- Groups related articles and tracks convergence over time
-- ============================================================
CREATE TABLE IF NOT EXISTS story_clusters (
  id                uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  topic             varchar(200) NOT NULL,
  category          varchar(50),
  convergence_status varchar(20) DEFAULT 'SINGLE_SOURCE',
  convergence_score decimal(4,3) DEFAULT 0,
  source_count      integer      DEFAULT 1,
  tier1_count       integer      DEFAULT 0,
  tier2_count       integer      DEFAULT 0,
  velocity_per_hour decimal(6,2) DEFAULT 0,
  first_seen        timestamptz  DEFAULT now(),
  last_seen         timestamptz  DEFAULT now(),
  article_ids       uuid[]       DEFAULT '{}',
  created_at        timestamptz  DEFAULT now(),
  updated_at        timestamptz  DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clusters_status
  ON story_clusters (convergence_status, last_seen DESC);

CREATE INDEX IF NOT EXISTS idx_clusters_velocity
  ON story_clusters (velocity_per_hour DESC)
  WHERE convergence_status IN ('BREAKING', 'CONFIRMED');

-- ============================================================
-- Backfill: classify existing articles by source URL
-- Updates source_tier for any existing rows
-- ============================================================
UPDATE news_items SET source_tier = CASE
  WHEN source_url ILIKE '%reuters.com%'       THEN 'tier1'
  WHEN source_url ILIKE '%apnews.com%'        THEN 'tier1'
  WHEN source_url ILIKE '%statssa.gov.za%'    THEN 'tier1'
  WHEN source_url ILIKE '%gov.za%'            THEN 'tier1'
  WHEN source_url ILIKE '%eskom.co.za%'       THEN 'tier1'
  WHEN source_url ILIKE '%dailymaverick%'     THEN 'tier2'
  WHEN source_url ILIKE '%amabhungane%'       THEN 'tier2'
  WHEN source_url ILIKE '%groundup.org.za%'   THEN 'tier2'
  WHEN source_url ILIKE '%news24.com%'        THEN 'tier2'
  WHEN source_url ILIKE '%sabcnews.com%'      THEN 'tier2'
  WHEN source_url ILIKE '%ewn.co.za%'         THEN 'tier2'
  WHEN source_url ILIKE '%businessday%'       THEN 'tier2'
  WHEN source_url ILIKE '%moneyweb%'          THEN 'tier2'
  WHEN source_url ILIKE '%iol.co.za%'         THEN 'tier3'
  WHEN source_url ILIKE '%citizen.co.za%'     THEN 'tier3'
  WHEN source_url ILIKE '%sowetanlive%'        THEN 'tier3'
  WHEN source_url ILIKE '%mg.co.za%'          THEN 'tier3'
  ELSE 'tier4'
END
WHERE source_tier = 'tier4';

-- Backfill convergence_status based on tier
UPDATE news_items SET
  convergence_status = CASE
    WHEN source_tier IN ('tier1', 'tier2') THEN 'CONFIRMED'
    WHEN source_tier = 'tier3'             THEN 'EMERGING'
    ELSE 'SINGLE_SOURCE'
  END,
  verified = CASE
    WHEN source_tier IN ('tier1', 'tier2') THEN true
    ELSE NULL
  END
WHERE convergence_status = 'SINGLE_SOURCE';
