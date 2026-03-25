// Client-side news classifier — zero API cost, runs in browser
// 9 categories + SA geo-location database (30+ locations)

export type NewsCategory =
  | 'LOADSHEDDING'
  | 'WATER'
  | 'CRIME'
  | 'UNREST'
  | 'POLITICAL'
  | 'ECONOMY'
  | 'JUDICIARY'
  | 'HEALTH'
  | 'TRANSPORT'
  | 'POSITIVE'

export interface ClassifiedArticle {
  category: NewsCategory | null
  categoryColor: string
  province: string | null
  municipality: string | null
  lat: number
  lng: number
  severity: 'low' | 'medium' | 'high'
  tags: string[]
  is_breaking: boolean
}

// ── Category rules ────────────────────────────────────────────────────────────
const CATEGORY_RULES: Array<{
  cat: NewsCategory
  keywords: string[]
  color: string
  severity: 'low' | 'medium' | 'high'
}> = [
  {
    cat: 'LOADSHEDDING',
    keywords: ['loadshedding', 'load-shedding', 'load shedding', 'eskom', 'power cut', 'power outage', 'stage 1', 'stage 2', 'stage 3', 'stage 4', 'stage 5', 'stage 6', 'electricity', 'blackout', 'power supply', 'substation', 'generator', 'grid', 'rotational cuts'],
    color: '#f5a623',
    severity: 'medium',
  },
  {
    cat: 'WATER',
    keywords: ['water shortage', 'water crisis', 'day zero', 'drought', 'dam level', 'water cut', 'no water', 'water supply', 'reservoir', 'water outage', 'sewage', 'water protest', 'water restrictions', 'borehole', 'rainfall deficit'],
    color: '#00d4ff',
    severity: 'medium',
  },
  {
    cat: 'CRIME',
    keywords: ['murder', 'robbery', 'hijack', 'hijacking', 'shooting', 'killed', 'arrested', 'suspect', 'police', 'crime', 'rape', 'assault', 'burglary', 'kidnap', 'gang', 'drug bust', 'saps', 'interpol', 'fugitive', 'syndicate', 'heist'],
    color: '#e8364a',
    severity: 'high',
  },
  {
    cat: 'UNREST',
    keywords: ['protest', 'march', 'strike', 'unrest', 'riot', 'shutdown', 'violence', 'demonstration', 'blockade', 'barricade', 'toyi-toyi', 'community protest', 'service delivery protest', 'workers strike', 'union', 'cosatu'],
    color: '#ff6b35',
    severity: 'high',
  },
  {
    cat: 'POLITICAL',
    keywords: ['parliament', 'anc', ' da ', ' eff ', 'ramaphosa', 'zuma', 'minister', 'cabinet', 'president', 'government', 'election', 'vote', 'party', 'policy', 'bill passed', 'budget speech', 'national assembly', 'ncop', 'constituency', 'premier', 'municipality council'],
    color: '#9b6bff',
    severity: 'low',
  },
  {
    cat: 'ECONOMY',
    keywords: ['economy', 'gdp', 'inflation', 'unemployment', 'rand', 'interest rate', 'repo rate', 'sarb', 'reserve bank', 'budget', 'tax', 'recession', 'growth', 'jobs', 'retrenchment', 'jse', 'investment', 'trade', 'exports', 'petrol price', 'fuel price', 'sars', 'treasury'],
    color: '#00c875',
    severity: 'low',
  },
  {
    cat: 'JUDICIARY',
    keywords: ['court', 'judgment', 'ruling', 'sentence', 'convicted', 'acquitted', 'appeal', 'constitutional court', 'high court', 'supreme court', 'npa', 'prosecutor', 'ndpp', 'hawks', 'afu', 'asset forfeiture', 'state capture', 'corruption', 'tender fraud', 'zondo commission'],
    color: '#c8a200',
    severity: 'medium',
  },
  {
    cat: 'HEALTH',
    keywords: ['health', 'hospital', 'clinic', 'doctor', 'nurse', 'disease', 'outbreak', 'epidemic', 'pandemic', 'vaccine', 'hiv', 'aids', 'tb', 'cholera', 'malaria', 'mental health', 'nhis', 'nhi', 'medical', 'treatment', 'drug shortage', 'surgery'],
    color: '#e040fb',
    severity: 'medium',
  },
  {
    cat: 'TRANSPORT',
    keywords: ['transnet', 'prasa', 'metrorail', 'train', 'bus', 'taxi', 'road', 'highway', 'accident', 'crash', 'potholes', 'freight', 'port', 'durban port', 'cape town port', 'airline', 'saa', 'airways', 'airport', 'n1', 'n2', 'n3'],
    color: '#4fc3f7',
    severity: 'medium',
  },
  {
    cat: 'POSITIVE',
    keywords: ['record', 'achievement', 'award', 'success', 'breakthrough', 'good news', 'improvement', 'investment announced', 'jobs created', 'growth', 'tourism boom', 'world cup', 'springbok', 'bafana', 'proteas', 'save', 'rescued', 'donated', 'new school', 'new hospital', 'solar', 'renewable'],
    color: '#69f0ae',
    severity: 'low',
  },
]

// ── Breaking news indicators ───────────────────────────────────────────────────
const BREAKING_INDICATORS = [
  'breaking', 'urgent', 'just in', 'developing', 'alert:', 'explosion', 'attack',
  'state of emergency', 'martial law', 'assassination', 'coup', 'mass casualty',
  'national disaster', 'breaking news',
]

// ── SA Geo-location database ──────────────────────────────────────────────────
interface GeoEntry {
  name: string
  aliases?: string[]
  lat: number
  lng: number
  province: string
  municipality?: string
}

const SA_GEO_DB: GeoEntry[] = [
  // Gauteng
  { name: 'johannesburg', aliases: ['joburg', 'jozi', 'jo\'burg'], lat: -26.2041, lng: 28.0473, province: 'Gauteng', municipality: 'City of Johannesburg' },
  { name: 'pretoria', aliases: ['tshwane'], lat: -25.7479, lng: 28.2293, province: 'Gauteng', municipality: 'City of Tshwane' },
  { name: 'soweto', lat: -26.2672, lng: 27.8589, province: 'Gauteng', municipality: 'City of Johannesburg' },
  { name: 'sandton', lat: -26.1076, lng: 28.0567, province: 'Gauteng', municipality: 'City of Johannesburg' },
  { name: 'ekurhuleni', aliases: ['east rand', 'germiston', 'boksburg'], lat: -26.3, lng: 28.16, province: 'Gauteng', municipality: 'Ekurhuleni' },
  { name: 'centurion', lat: -25.8601, lng: 28.1881, province: 'Gauteng', municipality: 'City of Tshwane' },
  { name: 'randburg', lat: -26.0947, lng: 27.9982, province: 'Gauteng', municipality: 'City of Johannesburg' },
  { name: 'roodepoort', lat: -26.1618, lng: 27.8724, province: 'Gauteng', municipality: 'City of Johannesburg' },
  { name: 'alexandra', lat: -26.1038, lng: 28.0896, province: 'Gauteng', municipality: 'City of Johannesburg' },
  { name: 'mamelodi', lat: -25.7305, lng: 28.3681, province: 'Gauteng', municipality: 'City of Tshwane' },
  { name: 'midrand', lat: -25.9935, lng: 28.1282, province: 'Gauteng', municipality: 'City of Johannesburg' },
  // KwaZulu-Natal
  { name: 'durban', aliases: ['ethekwini', 'eThekwini'], lat: -29.8587, lng: 31.0218, province: 'KwaZulu-Natal', municipality: 'eThekwini' },
  { name: 'pietermaritzburg', aliases: ['pmb', 'msunduzi'], lat: -29.6006, lng: 30.3794, province: 'KwaZulu-Natal', municipality: 'Msunduzi' },
  { name: 'newcastle', lat: -27.7567, lng: 29.9318, province: 'KwaZulu-Natal' },
  { name: 'richards bay', lat: -28.7833, lng: 32.0833, province: 'KwaZulu-Natal' },
  { name: 'umhlanga', lat: -29.7255, lng: 31.0804, province: 'KwaZulu-Natal', municipality: 'eThekwini' },
  { name: 'chatsworth', lat: -29.9225, lng: 30.9261, province: 'KwaZulu-Natal', municipality: 'eThekwini' },
  { name: 'umlazi', lat: -29.9725, lng: 30.8948, province: 'KwaZulu-Natal', municipality: 'eThekwini' },
  // Western Cape
  { name: 'cape town', aliases: ['ct', 'capetown', 'cpt'], lat: -33.9249, lng: 18.4241, province: 'Western Cape', municipality: 'City of Cape Town' },
  { name: 'stellenbosch', lat: -33.9321, lng: 18.8602, province: 'Western Cape' },
  { name: 'george', lat: -33.9631, lng: 22.4617, province: 'Western Cape' },
  { name: 'bellville', lat: -33.9, lng: 18.6333, province: 'Western Cape', municipality: 'City of Cape Town' },
  { name: 'mitchells plain', lat: -34.0455, lng: 18.6203, province: 'Western Cape', municipality: 'City of Cape Town' },
  { name: 'khayelitsha', lat: -34.0337, lng: 18.6832, province: 'Western Cape', municipality: 'City of Cape Town' },
  { name: 'paarl', lat: -33.7245, lng: 18.9598, province: 'Western Cape' },
  { name: 'worcester', lat: -33.6449, lng: 19.4466, province: 'Western Cape' },
  // Eastern Cape
  { name: 'gqeberha', aliases: ['port elizabeth', 'pe'], lat: -33.9608, lng: 25.6022, province: 'Eastern Cape', municipality: 'Nelson Mandela Bay' },
  { name: 'east london', aliases: ['buffalo city'], lat: -32.9968, lng: 27.8628, province: 'Eastern Cape', municipality: 'Buffalo City' },
  { name: 'mthatha', lat: -31.5892, lng: 28.7847, province: 'Eastern Cape' },
  // Limpopo
  { name: 'polokwane', aliases: ['pietersburg'], lat: -23.9045, lng: 29.4688, province: 'Limpopo', municipality: 'Polokwane' },
  { name: 'lephalale', lat: -23.6844, lng: 27.7124, province: 'Limpopo' },
  // Mpumalanga
  { name: 'nelspruit', aliases: ['mbombela'], lat: -25.4654, lng: 30.9854, province: 'Mpumalanga', municipality: 'Mbombela' },
  { name: 'witbank', aliases: ['emalahleni'], lat: -25.8702, lng: 29.2397, province: 'Mpumalanga', municipality: 'eMalahleni' },
  // North West
  { name: 'rustenburg', lat: -25.6672, lng: 27.2421, province: 'North West', municipality: 'Rustenburg' },
  { name: 'mahikeng', aliases: ['mafikeng', 'mmabatho'], lat: -25.8508, lng: 25.6472, province: 'North West' },
  // Free State
  { name: 'bloemfontein', aliases: ['mangaung'], lat: -29.1199, lng: 26.2146, province: 'Free State', municipality: 'Mangaung' },
  { name: 'welkom', lat: -27.9774, lng: 26.7338, province: 'Free State' },
  // Northern Cape
  { name: 'kimberley', lat: -28.7282, lng: 24.7499, province: 'Northern Cape', municipality: 'Sol Plaatje' },
  { name: 'upington', lat: -28.4478, lng: 21.2561, province: 'Northern Cape' },
  // Provinces
  { name: 'gauteng', lat: -26.2041, lng: 28.0473, province: 'Gauteng' },
  { name: 'kwazulu-natal', aliases: ['kwazulu natal', 'kzn'], lat: -29.5, lng: 30.5, province: 'KwaZulu-Natal' },
  { name: 'western cape', lat: -33.2, lng: 21.8, province: 'Western Cape' },
  { name: 'eastern cape', lat: -32.2, lng: 26.5, province: 'Eastern Cape' },
  { name: 'limpopo', lat: -23.9, lng: 29.4, province: 'Limpopo' },
  { name: 'mpumalanga', lat: -25.5, lng: 30.5, province: 'Mpumalanga' },
  { name: 'north west', lat: -25.8, lng: 25.6, province: 'North West' },
  { name: 'free state', lat: -28.5, lng: 26.5, province: 'Free State' },
  { name: 'northern cape', lat: -29.0, lng: 22.0, province: 'Northern Cape' },
]

// ── Classification functions ──────────────────────────────────────────────────
export function classifyArticle(title: string, description = ''): {
  category: NewsCategory | null
  categoryColor: string
  severity: 'low' | 'medium' | 'high'
  tags: string[]
  is_breaking: boolean
} {
  const text = `${title} ${description}`.toLowerCase()

  let category: NewsCategory | null = null
  let categoryColor = 'var(--text-muted)'
  let severity: 'low' | 'medium' | 'high' = 'low'
  const tags: string[] = []

  for (const rule of CATEGORY_RULES) {
    const matched = rule.keywords.filter((kw) => text.includes(kw.toLowerCase()))
    if (matched.length > 0) {
      if (!category) {
        category = rule.cat
        categoryColor = rule.color
        severity = rule.severity
      }
      tags.push(...matched.slice(0, 2))
    }
  }

  const is_breaking = BREAKING_INDICATORS.some((ind) => text.includes(ind))
  if (is_breaking && severity === 'low') severity = 'medium'

  return { category, categoryColor, severity, tags: [...new Set(tags)].slice(0, 5), is_breaking }
}

export function geolocateArticle(title: string, description = ''): {
  province: string | null
  municipality: string | null
  lat: number
  lng: number
} {
  const text = `${title} ${description}`.toLowerCase()

  for (const entry of SA_GEO_DB) {
    const names = [entry.name, ...(entry.aliases ?? [])]
    if (names.some((n) => text.includes(n.toLowerCase()))) {
      return {
        province: entry.province,
        municipality: entry.municipality ?? null,
        lat: entry.lat,
        lng: entry.lng,
      }
    }
  }

  return { province: null, municipality: null, lat: -28.5, lng: 24.0 }
}

export function getCategoryColor(cat: NewsCategory | string | null | undefined): string {
  return CATEGORY_RULES.find((r) => r.cat === cat)?.color ?? 'var(--text-muted)'
}

export const ALL_CATEGORIES = CATEGORY_RULES.map((r) => r.cat)
