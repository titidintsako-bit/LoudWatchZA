-- ── GHS (General Household Survey) ──────────────────────────────────────
create table if not exists ghs_data (
  id                  serial primary key,
  province            text not null,
  municipality        text not null,
  pct_no_piped_water  double precision default 0,
  pct_no_electricity  double precision default 0,
  pct_no_flush_toilet double precision default 0,
  pct_food_insecure   double precision default 0,
  survey_year         integer default 2023,
  updated_at          timestamptz default now(),
  unique(municipality, survey_year)
);

-- ── Census 2022 ──────────────────────────────────────────────────────────
create table if not exists census2022 (
  id                  serial primary key,
  municipality        text not null unique,
  province            text,
  pop_total           bigint default 0,
  pct_no_electricity  double precision default 0,
  pct_no_piped_water  double precision default 0,
  pct_no_sanitation   double precision default 0,
  median_income       double precision default 0,
  updated_at          timestamptz default now()
);

-- ── Mid-year population estimates ───────────────────────────────────────
create table if not exists population_estimates (
  id            serial primary key,
  province      text not null unique,
  population    bigint not null,
  year          integer not null,
  updated_at    timestamptz default now()
);

-- ── Update municipalities table with new columns ─────────────────────────
alter table municipalities
  add column if not exists no_piped_water_pct  double precision default 0,
  add column if not exists no_electricity_pct  double precision default 0,
  add column if not exists no_sanitation_pct   double precision default 0,
  add column if not exists ghs_service_fail_score double precision default 0,
  add column if not exists food_insecure_pct   double precision default 0;

-- Drop old generated column, add new one with 8 dimensions
alter table municipalities drop column if exists pain_score;
alter table municipalities add column pain_score double precision generated always as (
  (5 - audit_score)           * 0.20
  + unemployment_rate * 0.0020 * 0.20   -- normalise % → 0-1 range approx
  + loadshedding_days * 0.2   * 0.15
  + water_shortage            * 0.10
  + no_piped_water_pct * 0.01 * 0.10
  + no_electricity_pct * 0.01 * 0.10
  + no_sanitation_pct  * 0.01 * 0.08
  + ghs_service_fail_score    * 0.07
) stored;

-- ── Row Level Security ───────────────────────────────────────────────────
alter table ghs_data               enable row level security;
alter table census2022             enable row level security;
alter table population_estimates   enable row level security;
create policy "public read ghs"        on ghs_data             for select using (true);
create policy "public read census2022" on census2022           for select using (true);
create policy "public read population" on population_estimates for select using (true);
