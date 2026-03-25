export interface LoadsheddingStatus {
  stage: number
  updated_at: string
  areas_affected: number
  next_change_at?: string
}

export interface Dam {
  id: string
  name: string
  level_percent: number
  capacity_mcm: number
  current_mcm: number
  lat: number
  lng: number
  province: string
  updated_at: string
  week_change_pct: number
  last_year_pct: number
}

export interface Municipality {
  id: string
  demarcation_code?: string
  name: string
  province: string
  lat: number
  lng: number
  audit_score: number
  unemployment_rate: number
  loadshedding_days: number
  water_shortage: number
  blue_green_fail: number
  pain_score: number
  no_piped_water_pct?: number
  no_electricity_pct?: number
  no_sanitation_pct?: number
  ghs_service_fail_score?: number
  food_insecure_pct?: number
  financial_distress_score?: number
  budget_underspend_pct?: number
  manager_name?: string
  manager_email?: string
  manager_phone?: string
  population?: number
}

export interface CrimePoint {
  lat: number
  lng: number
  intensity: number
  category: string
  station_name: string
  province: string
  count: number
  per_100k?: number
}

export interface AuditRecord {
  name: string
  province: string
  outcome: string
  score: number
  year: number
  financial_distress_score?: number
}

export interface UnemploymentRecord {
  name: string
  province: string
  rate: number
  year: number
  quarter: string
  trend: 'up' | 'down' | 'stable'
}

export interface Incident {
  id: string
  title: string
  lat: number
  lng: number
  date: string
  description: string
  category: string
  municipality: string
  province: string
  severity: 'low' | 'medium' | 'high'
  actor?: string
  fatalities?: number
}

export interface NewsArticle {
  id: string
  title: string
  url: string
  source: string
  lat: number
  lng: number
  published_at: string
  sentiment: number
  summary: string
  image_url?: string
  province?: string
  municipality?: string
  category?: string
  source_logo?: string
  tags?: string[]
  is_breaking?: boolean
  severity?: 'low' | 'medium' | 'high'
  // Intelligence quality fields
  source_tier?: 'tier1' | 'tier2' | 'tier3' | 'tier4'
  convergence_status?: 'CONFIRMED' | 'BREAKING' | 'EMERGING' | 'SINGLE_SOURCE' | 'FILTERED' | 'REJECTED'
  convergence_score?: number
  source_count?: number
  verified?: boolean | null
  verification_reason?: string | null
  groq_confidence?: number
  plain_summary?: string | null
  requires_verification?: boolean
  is_sa_relevant?: boolean
}

export interface Aircraft {
  icao24: string
  callsign: string
  lat: number
  lng: number
  altitude_m: number
  velocity_ms: number
  heading: number
  aircraft_type: string
  registration: string
  on_ground: boolean
  origin_country: string
}

export interface Vessel {
  mmsi: string
  name: string
  lat: number
  lng: number
  speed_kts: number
  heading: number
  vessel_type: string
  flag: string
  destination: string
  cargo_type?: string
}

export interface DossierData {
  municipality: string
  province: string
  pain_score: number
  loadshedding_stage: number
  dam_level: number | null
  unemployment_rate: number
  protest_count_7d: number
  news_count_7d: number
  audit_outcome: string
  lat: number
  lng: number
  population?: number
  manager_name?: string
  manager_email?: string
  manager_phone?: string
}

export interface LayerState {
  loadshedding: boolean
  painIndex: boolean
  dams: boolean
  crime: boolean
  audits: boolean
  unemployment: boolean
  protests: boolean
  news: boolean
  aircraft: boolean
  ships: boolean
  serviceAccess: boolean
  noElectricity: boolean
  noPipedWater: boolean
  noSanitation: boolean
  hungerIndex: boolean
  gdp: boolean
  budget: boolean
  population: boolean
  military: boolean
  govtHQ: boolean
  conservation: boolean
  borderMigration: boolean
  wanted: boolean
  gpsJamming: boolean
  nasaSatellite: boolean
}

export interface WantedPerson {
  id: string
  full_name: string
  photo_url?: string
  crime_category?: string
  charges?: string
  last_known_location?: string
  province?: string
  lat?: number
  lng?: number
  case_number?: string
  station?: string
  is_missing: boolean
  date_added: string
  is_active: boolean
  source_url?: string
  scrape_key?: string
}

export interface MilitaryBase {
  id: string
  name: string
  branch: 'SAAF' | 'Navy' | 'Army'
  lat: number
  lng: number
  description: string
}

export interface GovtBuilding {
  id: string
  name: string
  type: 'national' | 'premier' | 'municipal'
  province: string
  lat: number
  lng: number
  occupant?: string
  phone?: string
}

export interface BorderPost {
  id: string
  name: string
  country: string
  lat: number
  lng: number
  status: 'open' | 'restricted' | 'closed'
  vehicles_daily?: number
}

export interface SANPark {
  id: string
  name: string
  type: 'national_park' | 'marine_protected' | 'world_heritage'
  lat: number
  lng: number
  area_km2?: number
  province: string
  visitors_pa?: number
}

export interface GoodNewsItem {
  id: string
  title: string
  url: string
  summary?: string
  published_at: string
  image_url?: string
  category?: string
}

export interface LoadsheddingStreak {
  province: string
  days: number
  since: string
  isNational: boolean
}

export interface SearchResult {
  name: string
  type: 'municipality' | 'province' | 'dam' | 'suburb' | 'airport' | 'port'
  lat: number
  lng: number
  province: string
  description?: string
}

export interface GHSRecord {
  municipality: string
  province: string
  pct_no_piped_water: number
  pct_no_electricity: number
  pct_no_flush_toilet: number
  pct_food_insecure: number
  service_fail_score: number
}

export interface CensusRecord {
  municipality: string
  province: string
  pop_total: number
  pct_no_electricity: number
  pct_no_piped_water: number
  pct_no_sanitation: number
  median_income: number
}

export interface ProvincePopulation {
  province: string
  population: number
  year: number
}

export interface HungerRecord {
  municipality: string
  province: string
  lat: number
  lng: number
  food_insecure_pct: number
}

export interface ExchangeRate {
  usd: number
  eur: number
  gbp: number
  updatedAt: string
  usdChange: number
}

export interface PetrolPrice {
  unleaded95: number
  unleaded93: number
  diesel50ppm: number
  nextChangeDate: string
  daysUntilChange: number
  changeAmounts?: { unleaded95: number }
}

export interface SASSAGrant {
  type: string
  amount: number
  nextPaymentDate: string
  daysUntil: number
}

export interface NewsCluster {
  topic: string
  count: number
  articles: NewsArticle[]
}

export interface ProvinceSummary {
  province: string
  unemploymentTrend: 'up' | 'down' | 'stable'
  waterStress: 'high' | 'medium' | 'low'
  protestCount: number
  loadshedding: number
  painScore: number
}
