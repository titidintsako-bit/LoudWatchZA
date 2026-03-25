export const SA_CENTER = { lat: -28.5, lng: 24.0 }
export const SA_ZOOM = 5.5
export const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'http://localhost:8000'
export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
export const BASEMAP_URL =
  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

export const POPULATION_BASE = 63_108_000
export const BIRTHS_PER_DAY = 3940
export const BIRTHS_PER_MS = BIRTHS_PER_DAY / 86_400_000

/**
 * Poll cycle buckets.
 * FAST   — 60s  : real-time feeds (aircraft HTTP fallback, ships, loadshedding)
 * SLOW   — 5min : enriched feeds (news, protests, markets, exchange rate)
 * HOURLY — 1h   : aggregate indexes (trending, pain index)
 * DAILY  — 6h   : slow-changing data (dams) — full daily refresh handled by backend
 *
 * WebSocket connections (aircraft, ships) push updates in <1s when available;
 * the HTTP interval is only the polling fallback.
 */
export const POLL_CYCLES = {
  FAST:   60_000,
  SLOW:   300_000,
  HOURLY: 3_600_000,
  DAILY:  21_600_000,
} as const

export const REFRESH_INTERVALS = {
  loadshedding: POLL_CYCLES.FAST,
  aircraft:     POLL_CYCLES.FAST,     // WS primary; HTTP fallback
  ships:        POLL_CYCLES.FAST,     // WS primary; HTTP fallback
  news:         POLL_CYCLES.SLOW,
  protests:     POLL_CYCLES.SLOW,
  exchangeRate: POLL_CYCLES.SLOW,
  painIndex:    POLL_CYCLES.HOURLY,
  dams:         POLL_CYCLES.DAILY,
  gpsJamming:   POLL_CYCLES.DAILY,
}

export const SA_PROVINCES = [
  'Gauteng',
  'KwaZulu-Natal',
  'Western Cape',
  'Eastern Cape',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Free State',
  'Northern Cape',
]

export const PROVINCE_COLORS: Record<string, string> = {
  Gauteng: 'var(--accent)',
  'KwaZulu-Natal': 'var(--normal)',
  'Western Cape': '#7b2fff',
  'Eastern Cape': 'var(--critical)',
  Limpopo: 'var(--warning)',
  Mpumalanga: '#ff6b35',
  'North West': '#00bcd4',
  'Free State': '#e91e63',
  'Northern Cape': '#8bc34a',
}

export const STAGE_COLORS = [
  '#1a2a1a', // 0 — no loadshedding
  'var(--warning)', // 1
  'var(--warning)', // 2
  '#ff5500', // 3
  'var(--critical)', // 4
  '#cc0033', // 5
  '#990022', // 6
  '#660011', // 7
  '#330000', // 8
]

export const ZOOM_PRESETS = {
  SA: { zoom: 5.5, center: [-28.5, 24.0] as [number, number] },
  Gauteng: { zoom: 9, center: [-26.2, 28.0] as [number, number] },
  KZN: { zoom: 8, center: [-29.5, 30.5] as [number, number] },
  CapeTown: { zoom: 10, center: [-33.9, 18.4] as [number, number] },
  Durban: { zoom: 10, center: [-29.8, 31.0] as [number, number] },
}

// SASSA grant amounts — effective April 2025 (2025/26 budget, updated annually April)
export const SASSA_GRANTS: Array<{ type: string; amount: number; payDay: number; icon: string }> = [
  { type: 'SRD R370', amount: 370, payDay: 25, icon: '💰' },
  { type: 'Old Age Pension', amount: 2190, payDay: 3, icon: '👴' },
  { type: 'Disability Grant', amount: 2190, payDay: 3, icon: '♿' },
  { type: 'Child Support', amount: 560, payDay: 10, icon: '🧒' },
]

// ── MILITARY BASES ──────────────────────────────────────────────────────────
import type { MilitaryBase, GovtBuilding, BorderPost, SANPark } from '@/types'

export const SAAF_BASES: MilitaryBase[] = [
  { id: 'waterkloof', name: 'AFB Waterkloof', branch: 'SAAF', lat: -25.8300, lng: 28.2225, description: 'Primary VVIP transport & fighter base, Centurion' },
  { id: 'overberg', name: 'AFB Overberg', branch: 'SAAF', lat: -34.5528, lng: 20.5028, description: 'Test flight centre, Bredasdorp' },
  { id: 'ysterplaat', name: 'AFB Ysterplaat', branch: 'SAAF', lat: -33.9042, lng: 18.4981, description: 'Maritime patrol & transport, Cape Town' },
  { id: 'langebaanweg', name: 'AFB Langebaanweg', branch: 'SAAF', lat: -32.9683, lng: 18.1600, description: 'Air Defence, West Coast' },
  { id: 'makhado', name: 'AFB Makhado', branch: 'SAAF', lat: -23.1500, lng: 29.9269, description: 'Fighter base (Gripen), Limpopo' },
]

export const NAVY_BASES: MilitaryBase[] = [
  { id: 'simonstown', name: 'SAS Simonsberg', branch: 'Navy', lat: -34.1936, lng: 18.4285, description: 'SA Navy HQ & submarine base, Simon\'s Town' },
  { id: 'durban_naval', name: 'HMSAS Durban', branch: 'Navy', lat: -29.8555, lng: 30.9728, description: 'Durban Naval Base, Salisbury Island' },
]

export const ALL_MILITARY_BASES: MilitaryBase[] = [...SAAF_BASES, ...NAVY_BASES]

// ── GOVERNMENT BUILDINGS ─────────────────────────────────────────────────────
export const NATIONAL_GOVT_BUILDINGS: GovtBuilding[] = [
  { id: 'union_buildings', name: 'Union Buildings', type: 'national', province: 'Gauteng', lat: -25.7434, lng: 28.2122, occupant: 'Presidency of the Republic' },
  { id: 'parliament', name: 'Parliament of South Africa', type: 'national', province: 'Western Cape', lat: -33.9248, lng: 18.4162, occupant: 'National Assembly & NCOP' },
  { id: 'concourt', name: 'Constitutional Court', type: 'national', province: 'Gauteng', lat: -26.2046, lng: 28.0526, occupant: 'Chief Justice' },
]

// Premiers as of post-May 2024 elections (6th Administration / GNU)
export const PREMIER_OFFICES: GovtBuilding[] = [
  { id: 'premier_gp', name: 'Gauteng Provincial Government', type: 'premier', province: 'Gauteng', lat: -25.7461, lng: 28.1871, occupant: 'Premier: Panyaza Lesufi (ANC)' },
  { id: 'premier_kzn', name: 'KwaZulu-Natal Office of the Premier', type: 'premier', province: 'KwaZulu-Natal', lat: -29.6006, lng: 30.3794, occupant: 'Premier: Thamsanqa Ntuli (ANC)' },
  { id: 'premier_wc', name: 'Western Cape Office of the Premier', type: 'premier', province: 'Western Cape', lat: -33.9249, lng: 18.4241, occupant: 'Premier: Alan Winde (DA)' },
  { id: 'premier_ec', name: 'Eastern Cape Office of the Premier', type: 'premier', province: 'Eastern Cape', lat: -32.8488, lng: 27.4305, occupant: 'Premier: Oscar Mabuyane (ANC)' },
  { id: 'premier_lp', name: 'Limpopo Office of the Premier', type: 'premier', province: 'Limpopo', lat: -23.8980, lng: 29.4486, occupant: 'Premier: Phophi Ramathuba (ANC)' },
  { id: 'premier_mp', name: 'Mpumalanga Office of the Premier', type: 'premier', province: 'Mpumalanga', lat: -25.4636, lng: 30.9726, occupant: 'Premier: Mandla Ndlovu (ANC)' },
  { id: 'premier_nw', name: 'North West Office of the Premier', type: 'premier', province: 'North West', lat: -25.8508, lng: 25.6472, occupant: 'Premier: Lazarus Mokgosi (ANC)' },
  { id: 'premier_fs', name: 'Free State Office of the Premier', type: 'premier', province: 'Free State', lat: -29.1199, lng: 26.2146, occupant: 'Premier: Mxolisi Dukwana (ANC)' },
  { id: 'premier_nc', name: 'Northern Cape Office of the Premier', type: 'premier', province: 'Northern Cape', lat: -28.7416, lng: 24.7680, occupant: 'Premier: Zamani Saul (ANC)' },
]

export const ALL_GOVT_BUILDINGS: GovtBuilding[] = [...NATIONAL_GOVT_BUILDINGS, ...PREMIER_OFFICES]

// ── BORDER POSTS ─────────────────────────────────────────────────────────────
export const BORDER_POSTS: BorderPost[] = [
  { id: 'beitbridge', name: 'Beitbridge', country: 'Zimbabwe', lat: -22.2166, lng: 29.9833, status: 'open', vehicles_daily: 5000 },
  { id: 'lebombo', name: 'Lebombo / Ressano Garcia', country: 'Mozambique', lat: -25.3333, lng: 32.0833, status: 'open', vehicles_daily: 1800 },
  { id: 'oshoek', name: 'Oshoek / Ngwenya', country: 'Eswatini', lat: -26.0833, lng: 31.1333, status: 'open', vehicles_daily: 900 },
  { id: 'maseru', name: 'Maseru Bridge', country: 'Lesotho', lat: -29.4500, lng: 27.5000, status: 'open', vehicles_daily: 1200 },
  { id: 'kopfontein', name: 'Kopfontein / Tlokweng', country: 'Botswana', lat: -25.7167, lng: 26.4833, status: 'open', vehicles_daily: 700 },
  { id: 'vioolsdrift', name: 'Vioolsdrift / Noordoewer', country: 'Namibia', lat: -28.7667, lng: 17.6333, status: 'open', vehicles_daily: 400 },
  { id: 'skilpadshek', name: 'Skilpadshek / Ramatlabama', country: 'Botswana', lat: -25.5833, lng: 26.0833, status: 'open', vehicles_daily: 600 },
  { id: 'nakop', name: 'Nakop / Ariamsvlei', country: 'Namibia', lat: -28.0167, lng: 19.9833, status: 'open', vehicles_daily: 300 },
]

export const UNHCR_OFFICES = [
  { id: 'unhcr_pta', name: 'UNHCR South Africa (Pretoria)', lat: -25.7479, lng: 28.2293, type: 'UNHCR' },
  { id: 'unhcr_jhb', name: 'UNHCR Johannesburg', lat: -26.1955, lng: 28.0366, type: 'UNHCR' },
  { id: 'unhcr_ct', name: 'UNHCR Cape Town', lat: -33.9248, lng: 18.4241, type: 'UNHCR' },
]

// ── CONSERVATION & NATURE ────────────────────────────────────────────────────
export const SANPARKS: SANPark[] = [
  { id: 'kruger', name: 'Kruger National Park', type: 'national_park', lat: -23.9884, lng: 31.5547, area_km2: 19485, province: 'Limpopo / Mpumalanga', visitors_pa: 1_500_000 },
  { id: 'table_mountain', name: 'Table Mountain National Park', type: 'national_park', lat: -34.0476, lng: 18.4712, area_km2: 221, province: 'Western Cape', visitors_pa: 4_200_000 },
  { id: 'hluhluwe', name: 'Hluhluwe-iMfolozi Park', type: 'world_heritage', lat: -28.1034, lng: 31.9273, area_km2: 960, province: 'KwaZulu-Natal', visitors_pa: 260_000 },
  { id: 'addo', name: 'Addo Elephant National Park', type: 'national_park', lat: -33.4808, lng: 25.7497, area_km2: 1640, province: 'Eastern Cape', visitors_pa: 350_000 },
  { id: 'karoo', name: 'Karoo National Park', type: 'national_park', lat: -32.2939, lng: 22.5166, area_km2: 760, province: 'Western Cape', visitors_pa: 80_000 },
  { id: 'kgalagadi', name: 'Kgalagadi Transfrontier Park', type: 'national_park', lat: -26.5000, lng: 20.6667, area_km2: 9591, province: 'Northern Cape', visitors_pa: 50_000 },
  { id: 'augrabies', name: 'Augrabies Falls National Park', type: 'national_park', lat: -28.5965, lng: 20.3413, area_km2: 550, province: 'Northern Cape', visitors_pa: 40_000 },
  { id: 'garden_route', name: 'Garden Route National Park', type: 'national_park', lat: -33.9906, lng: 22.5910, area_km2: 1210, province: 'Western Cape', visitors_pa: 400_000 },
  { id: 'mountain_zebra', name: 'Mountain Zebra National Park', type: 'national_park', lat: -32.2494, lng: 25.4350, area_km2: 284, province: 'Eastern Cape', visitors_pa: 30_000 },
  { id: 'isimangaliso', name: 'iSimangaliso Wetland Park', type: 'world_heritage', lat: -27.8500, lng: 32.7000, area_km2: 3280, province: 'KwaZulu-Natal', visitors_pa: 200_000 },
]

export const MARINE_PROTECTED_AREAS: SANPark[] = [
  { id: 'de_hoop_mpa', name: 'De Hoop MPA', type: 'marine_protected', lat: -34.4726, lng: 20.4309, area_km2: 700, province: 'Western Cape' },
  { id: 'isimangaliso_mpa', name: 'iSimangaliso MPA', type: 'marine_protected', lat: -27.8500, lng: 32.8500, area_km2: 156, province: 'KwaZulu-Natal' },
  { id: 'aliwal_shoal', name: 'Aliwal Shoal MPA', type: 'marine_protected', lat: -30.2000, lng: 30.8500, area_km2: 110, province: 'KwaZulu-Natal' },
  { id: 'tsitsikamma', name: 'Tsitsikamma MPA', type: 'marine_protected', lat: -34.0200, lng: 23.6900, area_km2: 320, province: 'Eastern Cape' },
]

export const ALL_CONSERVATION_SITES: SANPark[] = [...SANPARKS, ...MARINE_PROTECTED_AREAS]

// Border & migration news keywords
export const BORDER_MIGRATION_KEYWORDS = [
  'deportation', 'border', 'Home Affairs', 'undocumented', 'refugee',
  'asylum', 'UNHCR', 'immigration', 'Beitbridge', 'repatriation',
  'foreign nationals', 'DHA', 'permit',
]

// Parliament in session: Feb–Jun, Aug–Nov
export function isParliamentInSession(date = new Date()): boolean {
  const m = date.getMonth() + 1
  return (m >= 2 && m <= 6) || (m >= 8 && m <= 11)
}

// Petrol prices — last known values, updated monthly from DMRE announcements
// The /api/petrol-prices route attempts live fetching first; these are fallback only
export const PETROL_95_ULP = 21.63
export const PETROL_93_ULP = 21.40
export const DIESEL_50PPM = 19.92
export const NEXT_PETROL_CHANGE = '2025-08-06'
export const PETROL_EFFECTIVE_DATE = '2025-07-02'
