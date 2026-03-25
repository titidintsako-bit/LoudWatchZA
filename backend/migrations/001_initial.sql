-- LoudWatch ZA — Initial Database Migration
-- Run this in your Supabase SQL editor

-- Enable PostGIS for spatial queries
create extension if not exists postgis;

-- ─────────────────────────────────────────────
-- MUNICIPALITIES (master reference + pain index)
-- ─────────────────────────────────────────────
create table if not exists municipalities (
  id                 text primary key,        -- slug e.g. "city-of-cape-town"
  name               text not null,
  province           text not null,
  district           text,
  lat                double precision,
  lng                double precision,
  geom               geometry(Point, 4326),
  -- Pain index components
  audit_score        double precision default 3.0,   -- 1-5 scale
  unemployment_rate  double precision default 30.0,  -- percent
  loadshedding_days  double precision default 0,     -- days/month
  water_shortage     double precision default 0,     -- 0-1 flag
  blue_green_fail    double precision default 0,     -- 0-1 flag
  pain_score         double precision generated always as (
    (5 - audit_score) * 0.3
    + unemployment_rate * 0.0025  -- normalise 0-100 → 0-2.5
    + loadshedding_days  * 0.2
    + water_shortage * 0.15
    + blue_green_fail * 0.1
  ) stored,
  updated_at         timestamptz default now()
);

create index if not exists municipalities_geom_idx on municipalities using gist(geom);

-- ─────────────────────────────────────────────
-- DAM LEVELS
-- ─────────────────────────────────────────────
create table if not exists dam_levels (
  id             serial primary key,
  name           text not null,
  province       text,
  capacity_mcm   double precision,
  current_mcm    double precision,
  level_percent  double precision generated always as (
    case when capacity_mcm > 0 then (current_mcm / capacity_mcm) * 100 else 0 end
  ) stored,
  lat            double precision,
  lng            double precision,
  geom           geometry(Point, 4326),
  measured_at    date,
  updated_at     timestamptz default now()
);

create index if not exists dam_levels_geom_idx on dam_levels using gist(geom);

-- ─────────────────────────────────────────────
-- LOADSHEDDING CACHE
-- ─────────────────────────────────────────────
create table if not exists loadshedding_cache (
  id           serial primary key,
  stage        integer not null default 0,
  areas_affected integer default 0,
  raw_json     jsonb,
  fetched_at   timestamptz default now()
);

-- Only keep last 100 records
create or replace function trim_loadshedding_cache()
returns trigger language plpgsql as $$
begin
  delete from loadshedding_cache
  where id not in (
    select id from loadshedding_cache order by fetched_at desc limit 100
  );
  return null;
end;
$$;

create or replace trigger loadshedding_cache_trim
  after insert on loadshedding_cache
  for each row execute function trim_loadshedding_cache();

-- ─────────────────────────────────────────────
-- PROTESTS / INCIDENTS
-- ─────────────────────────────────────────────
create table if not exists protests (
  id           text primary key default gen_random_uuid()::text,
  title        text not null,
  description  text,
  category     text default 'protest',
  municipality text,
  province     text,
  lat          double precision,
  lng          double precision,
  geom         geometry(Point, 4326),
  source_url   text,
  incident_date date,
  created_at   timestamptz default now()
);

create index if not exists protests_geom_idx on protests using gist(geom);
create index if not exists protests_date_idx on protests(incident_date desc);

-- ─────────────────────────────────────────────
-- NEWS PINS
-- ─────────────────────────────────────────────
create table if not exists news_pins (
  id           text primary key default gen_random_uuid()::text,
  title        text not null,
  url          text unique,
  source       text,
  summary      text,
  sentiment    double precision default 0,  -- -1 to +1
  lat          double precision,
  lng          double precision,
  geom         geometry(Point, 4326),
  published_at timestamptz,
  created_at   timestamptz default now()
);

create index if not exists news_pins_geom_idx on news_pins using gist(geom);
create index if not exists news_pins_published_idx on news_pins(published_at desc);

-- Auto-delete news older than 7 days
create or replace function delete_old_news()
returns trigger language plpgsql as $$
begin
  delete from news_pins where published_at < now() - interval '7 days';
  return null;
end;
$$;

create or replace trigger news_pins_auto_delete
  after insert on news_pins
  for each statement execute function delete_old_news();

-- ─────────────────────────────────────────────
-- CRIME HEATMAP
-- ─────────────────────────────────────────────
create table if not exists crime_heatmap (
  id           serial primary key,
  category     text,
  municipality text,
  province     text,
  count        integer,
  lat          double precision,
  lng          double precision,
  geom         geometry(Point, 4326),
  period_year  integer,
  period_q     text,
  updated_at   timestamptz default now()
);

create index if not exists crime_geom_idx on crime_heatmap using gist(geom);

-- ─────────────────────────────────────────────
-- MUNICIPAL AUDITS (AGSA)
-- ─────────────────────────────────────────────
create table if not exists municipal_audits (
  id              serial primary key,
  municipality_id text references municipalities(id) on delete cascade,
  municipality    text not null,
  province        text,
  outcome         text not null,  -- "Clean Audit", "Unqualified", "Qualified", "Adverse", "Disclaimer"
  score           double precision,  -- 1-5: Clean=5, Disclaimer=1
  financial_year  text,
  year            integer,
  findings        jsonb,
  updated_at      timestamptz default now(),
  unique(municipality, financial_year)
);

-- ─────────────────────────────────────────────
-- UNEMPLOYMENT (Stats SA QLFS)
-- ─────────────────────────────────────────────
create table if not exists unemployment_data (
  id              serial primary key,
  municipality_id text references municipalities(id) on delete cascade,
  municipality    text not null,
  province        text,
  rate            double precision not null,  -- percent
  year            integer,
  quarter         text,
  source          text default 'Stats SA QLFS',
  updated_at      timestamptz default now(),
  unique(municipality, year, quarter)
);

-- ─────────────────────────────────────────────
-- AI BRIEFS
-- ─────────────────────────────────────────────
create table if not exists ai_briefs (
  id           serial primary key,
  brief        text not null,
  topics       text[] default '{}',
  model        text,
  prompt_hash  text,
  generated_at timestamptz default now()
);

create index if not exists ai_briefs_generated_idx on ai_briefs(generated_at desc);

-- ─────────────────────────────────────────────
-- CROWDSOURCE REPORTS
-- ─────────────────────────────────────────────
create table if not exists crowdsource_reports (
  id           text primary key default gen_random_uuid()::text,
  issue_type   text not null,
  description  text not null,
  municipality text,
  lat          double precision,
  lng          double precision,
  geom         geometry(Point, 4326),
  contact      text,
  status       text default 'pending',
  created_at   timestamptz default now()
);

create index if not exists reports_geom_idx on crowdsource_reports using gist(geom);

-- ─────────────────────────────────────────────
-- SEED DATA: Reference municipalities (top 20)
-- ─────────────────────────────────────────────
insert into municipalities (id, name, province, lat, lng) values
  ('city-of-cape-town',        'City of Cape Town',       'Western Cape',  -33.9249, 18.4241),
  ('city-of-johannesburg',     'City of Johannesburg',    'Gauteng',       -26.2041, 28.0473),
  ('city-of-tshwane',          'City of Tshwane',         'Gauteng',       -25.7479, 28.2293),
  ('ekurhuleni',               'Ekurhuleni',              'Gauteng',       -26.3032, 28.4241),
  ('ethekwini',                'eThekwini (Durban)',       'KwaZulu-Natal', -29.8587, 31.0218),
  ('nelson-mandela-bay',       'Nelson Mandela Bay',      'Eastern Cape',  -33.9608, 25.6022),
  ('buffalo-city',             'Buffalo City',            'Eastern Cape',  -32.9816, 27.8617),
  ('mangaung',                 'Mangaung',                'Free State',    -29.1219, 26.2143),
  ('msunduzi',                 'Msunduzi (Pietermaritzburg)', 'KwaZulu-Natal', -29.6167, 30.3833),
  ('sol-plaatje',              'Sol Plaatje (Kimberley)', 'Northern Cape', -28.7282, 24.7499),
  ('polokwane',                'Polokwane',               'Limpopo',       -23.9045, 29.4689),
  ('mbombela',                 'Mbombela (Nelspruit)',    'Mpumalanga',    -25.4753, 30.9694),
  ('rustenburg',               'Rustenburg',              'North West',    -25.6594, 27.2418),
  ('drakenstein',              'Drakenstein (Paarl)',     'Western Cape',  -33.7278, 19.0145),
  ('stellenbosch',             'Stellenbosch',            'Western Cape',  -33.9321, 18.8602),
  ('george',                   'George',                  'Western Cape',  -33.9633, 22.4613),
  ('emfuleni',                 'Emfuleni (Vereeniging)',  'Gauteng',       -26.6667, 27.9167),
  ('matjhabeng',               'Matjhabeng (Welkom)',     'Free State',    -27.9743, 26.7432),
  ('lephalale',                'Lephalale',               'Limpopo',       -23.6833, 27.7167),
  ('steve-tshwete',            'Steve Tshwete (Middelburg)', 'Mpumalanga', -25.7667, 29.4667)
on conflict (id) do nothing;

-- Update geom from lat/lng for all municipalities
update municipalities
set geom = st_setsrid(st_makepoint(lng, lat), 4326)
where lat is not null and lng is not null and geom is null;

-- ─────────────────────────────────────────────
-- SEED DATA: Major South African dams
-- ─────────────────────────────────────────────
insert into dam_levels (name, province, capacity_mcm, current_mcm, lat, lng, measured_at) values
  ('Vaal Dam',          'Gauteng/Free State',  2602.0, 1690.0, -26.9167, 28.1167, current_date),
  ('Gariep Dam',        'Free State',          5340.0, 3200.0, -30.5500, 25.5333, current_date),
  ('Vanderkloof Dam',   'Northern Cape',       3171.0, 2100.0, -29.9833, 24.7667, current_date),
  ('Theewaterskloof',   'Western Cape',        480.2,  260.0,  -34.0167, 19.2500, current_date),
  ('Pongolapoort Dam',  'KwaZulu-Natal',       2457.0, 1800.0, -27.3333, 31.9667, current_date),
  ('Midmar Dam',        'KwaZulu-Natal',       235.5,  175.0,  -29.5167, 30.2167, current_date),
  ('Sterkfontein Dam',  'Free State',          2617.0, 2100.0, -28.3500, 28.9833, current_date),
  ('Tzaneen Dam',       'Limpopo',             157.2,  120.0,  -23.8167, 30.1667, current_date)
on conflict do nothing;

-- Update geom for dams
update dam_levels
set geom = st_setsrid(st_makepoint(lng, lat), 4326)
where lat is not null and lng is not null and geom is null;

-- ─────────────────────────────────────────────
-- SEED DATA: Municipal audits (2022/23 outcomes)
-- ─────────────────────────────────────────────
insert into municipal_audits (municipality, province, outcome, score, financial_year, year)
values
  ('City of Cape Town',       'Western Cape',  'Clean Audit',  5, '2022/23', 2023),
  ('Stellenbosch',            'Western Cape',  'Clean Audit',  5, '2022/23', 2023),
  ('City of Johannesburg',    'Gauteng',       'Qualified',    3, '2022/23', 2023),
  ('City of Tshwane',         'Gauteng',       'Unqualified',  4, '2022/23', 2023),
  ('Ekurhuleni',              'Gauteng',       'Unqualified',  4, '2022/23', 2023),
  ('eThekwini (Durban)',      'KwaZulu-Natal', 'Qualified',    3, '2022/23', 2023),
  ('Nelson Mandela Bay',      'Eastern Cape',  'Adverse',      2, '2022/23', 2023),
  ('Buffalo City',            'Eastern Cape',  'Disclaimer',   1, '2022/23', 2023),
  ('Mangaung',                'Free State',    'Disclaimer',   1, '2022/23', 2023),
  ('Matjhabeng (Welkom)',     'Free State',    'Disclaimer',   1, '2022/23', 2023),
  ('Emfuleni (Vereeniging)',  'Gauteng',       'Disclaimer',   1, '2022/23', 2023),
  ('Msunduzi (Pietermaritzburg)', 'KwaZulu-Natal', 'Qualified', 3, '2022/23', 2023),
  ('Polokwane',               'Limpopo',       'Unqualified',  4, '2022/23', 2023)
on conflict (municipality, financial_year) do nothing;

-- ─────────────────────────────────────────────
-- SEED DATA: Unemployment rates (Q3 2024)
-- ─────────────────────────────────────────────
insert into unemployment_data (municipality, province, rate, year, quarter) values
  ('City of Cape Town',    'Western Cape',  20.1, 2024, 'Q3'),
  ('City of Johannesburg', 'Gauteng',       28.5, 2024, 'Q3'),
  ('City of Tshwane',      'Gauteng',       26.2, 2024, 'Q3'),
  ('Ekurhuleni',           'Gauteng',       32.4, 2024, 'Q3'),
  ('eThekwini (Durban)',   'KwaZulu-Natal', 35.6, 2024, 'Q3'),
  ('Nelson Mandela Bay',   'Eastern Cape',  42.1, 2024, 'Q3'),
  ('Buffalo City',         'Eastern Cape',  45.8, 2024, 'Q3'),
  ('Mangaung',             'Free State',    38.9, 2024, 'Q3'),
  ('Matjhabeng (Welkom)',  'Free State',    52.3, 2024, 'Q3'),
  ('Emfuleni',             'Gauteng',       48.7, 2024, 'Q3'),
  ('Polokwane',            'Limpopo',       33.2, 2024, 'Q3'),
  ('Mbombela (Nelspruit)', 'Mpumalanga',    36.8, 2024, 'Q3'),
  ('Rustenburg',           'North West',    29.4, 2024, 'Q3'),
  ('Sol Plaatje',          'Northern Cape', 31.5, 2024, 'Q3')
on conflict (municipality, year, quarter) do nothing;

-- ─────────────────────────────────────────────
-- VIEWS
-- ─────────────────────────────────────────────

-- Pain index leaderboard view
create or replace view pain_index_leaderboard as
select
  m.id,
  m.name,
  m.province,
  m.lat,
  m.lng,
  m.audit_score,
  m.unemployment_rate,
  m.loadshedding_days,
  m.water_shortage,
  m.blue_green_fail,
  m.pain_score,
  a.outcome as audit_outcome,
  u.rate as unemployment_rate_latest
from municipalities m
left join municipal_audits a on a.municipality = m.name and a.financial_year = '2022/23'
left join unemployment_data u on u.municipality = m.name and u.year = 2024 and u.quarter = 'Q3'
order by m.pain_score desc nulls last;

-- Recent news view
create or replace view recent_news as
select *
from news_pins
where published_at > now() - interval '48 hours'
order by published_at desc
limit 200;

-- Active protests view (last 30 days)
create or replace view active_protests as
select *
from protests
where incident_date > current_date - interval '30 days'
order by incident_date desc;

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
alter table municipalities         enable row level security;
alter table dam_levels             enable row level security;
alter table loadshedding_cache     enable row level security;
alter table protests               enable row level security;
alter table news_pins              enable row level security;
alter table crime_heatmap          enable row level security;
alter table municipal_audits       enable row level security;
alter table unemployment_data      enable row level security;
alter table ai_briefs              enable row level security;
alter table crowdsource_reports    enable row level security;

-- Public read-only policies (anon key can read)
create policy "public read municipalities"      on municipalities         for select using (true);
create policy "public read dam_levels"          on dam_levels             for select using (true);
create policy "public read loadshedding_cache"  on loadshedding_cache     for select using (true);
create policy "public read protests"            on protests               for select using (true);
create policy "public read news_pins"           on news_pins              for select using (true);
create policy "public read crime_heatmap"       on crime_heatmap          for select using (true);
create policy "public read municipal_audits"    on municipal_audits       for select using (true);
create policy "public read unemployment"        on unemployment_data      for select using (true);
create policy "public read ai_briefs"           on ai_briefs              for select using (true);
create policy "public insert reports"           on crowdsource_reports    for insert with check (true);

-- Service role can do anything (bypasses RLS by default)
