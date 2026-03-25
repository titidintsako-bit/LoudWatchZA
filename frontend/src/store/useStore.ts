import { create } from 'zustand'
import type {
  LayerState,
  LoadsheddingStatus,
  Municipality,
  Dam,
  NewsArticle,
  Incident,
  Aircraft,
  Vessel,
  DossierData,
  ExchangeRate,
  PetrolPrice,
  GoodNewsItem,
  LoadsheddingStreak,
  WantedPerson,
} from '@/types'
import type { Language } from '@/lib/i18n'
import type { TrendingData } from '@/hooks/useTrending'

const DEFAULT_LAYERS: LayerState = {
  loadshedding: true,
  painIndex: true,
  dams: true,
  crime: false,
  audits: false,
  unemployment: false,
  protests: true,
  news: true,
  aircraft: true,
  ships: true,
  serviceAccess: false,
  noElectricity: false,
  noPipedWater: false,
  noSanitation: false,
  hungerIndex: false,
  gdp: false,
  budget: false,
  population: false,
  military: false,
  govtHQ: false,
  conservation: false,
  borderMigration: false,
  wanted: false,
  gpsJamming: false,
  nasaSatellite: false,
}

export type ProductMode = 'overview' | 'governance' | 'economy' | 'safety' | 'environment' | 'judiciary'
export type TimeFilter = '1H' | '6H' | '24H' | '48H' | '7D' | 'ALL'
export type MapProjection = '2d' | '3d' | 'globe'
export type { Language }

interface AppStore {
  // Layer visibility
  layers: LayerState
  setLayers: (layers: Partial<LayerState>) => void
  toggleLayer: (layer: keyof LayerState) => void

  // UI state
  leftSidebarOpen: boolean
  rightSidebarOpen: boolean
  minimal: boolean
  selectedProvince: string | null
  toggleLeftSidebar: () => void
  toggleRightSidebar: () => void
  setMinimal: (v: boolean) => void
  setSelectedProvince: (p: string | null) => void

  // Product mode
  activeMode: ProductMode
  setActiveMode: (m: ProductMode) => void

  // Time filter
  timeFilter: TimeFilter
  setTimeFilter: (t: TimeFilter) => void

  // Map projection
  mapProjection: MapProjection
  setMapProjection: (p: MapProjection) => void

  // Map state
  mapZoom: number
  mapCenter: [number, number]
  setMapView: (zoom: number, center: [number, number]) => void
  zoomToMunicipality: (lat: number, lng: number) => void

  // Language
  language: Language
  setLanguage: (l: Language) => void

  // Modals
  searchOpen: boolean
  reportOpen: boolean
  settingsOpen: boolean
  supporterOpen: boolean
  citizenIntelOpen: boolean
  setSearchOpen: (v: boolean) => void
  setReportOpen: (v: boolean) => void
  setSettingsOpen: (v: boolean) => void
  setSupporterOpen: (v: boolean) => void
  setCitizenIntelOpen: (v: boolean) => void

  // Dossier
  dossier: DossierData | null
  setDossier: (d: DossierData | null) => void

  // Report coords
  reportCoords: { lat: number; lng: number } | null
  setReportCoords: (c: { lat: number; lng: number } | null) => void

  // Data caches
  loadshedding: LoadsheddingStatus | null
  municipalities: Municipality[]
  dams: Dam[]
  articles: NewsArticle[]
  protests: Incident[]
  aircraft: Aircraft[]
  ships: Vessel[]

  setLoadshedding: (d: LoadsheddingStatus) => void
  setMunicipalities: (m: Municipality[]) => void
  setDams: (d: Dam[]) => void
  setArticles: (a: NewsArticle[]) => void
  setProtests: (p: Incident[]) => void
  setAircraft: (a: Aircraft[]) => void
  setShips: (s: Vessel[]) => void

  // Live economic data
  exchangeRate: ExchangeRate | null
  petrolPrice: PetrolPrice | null
  powerLostHours: number

  setExchangeRate: (r: ExchangeRate) => void
  setPetrolPrice: (p: PetrolPrice) => void
  setPowerLostHours: (h: number) => void

  // Good news feed
  goodNews: GoodNewsItem[]
  setGoodNews: (items: GoodNewsItem[]) => void

  // Loadshedding streaks
  loadsheddingStreaks: LoadsheddingStreak[]
  setLoadsheddingStreaks: (s: LoadsheddingStreak[]) => void

  // Wanted persons
  wantedPersons: WantedPerson[]
  wantedLastUpdated: string | null
  setWantedPersons: (persons: WantedPerson[], lastUpdated: string | null) => void

  // Trending
  trending: TrendingData | null
  setTrending: (d: TrendingData) => void
}

export const useStore = create<AppStore>((set, get) => ({
  // Layers
  layers: DEFAULT_LAYERS,
  setLayers: (layers) => set((s) => ({ layers: { ...s.layers, ...layers } })),
  toggleLayer: (layer) =>
    set((s) => ({ layers: { ...s.layers, [layer]: !s.layers[layer] } })),

  // UI
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  minimal: false,
  selectedProvince: null,
  toggleLeftSidebar: () => set((s) => ({ leftSidebarOpen: !s.leftSidebarOpen })),
  toggleRightSidebar: () => set((s) => ({ rightSidebarOpen: !s.rightSidebarOpen })),
  setMinimal: (v) => set({ minimal: v }),
  setSelectedProvince: (p) => set({ selectedProvince: p }),

  // Product mode
  activeMode: 'overview',
  setActiveMode: (m) => set({ activeMode: m }),

  // Time filter
  timeFilter: 'ALL',
  setTimeFilter: (t) => set({ timeFilter: t }),

  // Map projection
  mapProjection: '2d',
  setMapProjection: (p) => set({ mapProjection: p }),

  // Map
  mapZoom: 5.5,
  mapCenter: [-28.5, 24.0],
  setMapView: (zoom, center) => {
    set({ mapZoom: zoom, mapCenter: center })
    // Broadcast to MapLibre via custom event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('loudwatch:mapZoom', { detail: { zoom, center } }),
      )
    }
  },
  zoomToMunicipality: (lat, lng) => {
    get().setMapView(10, [lat, lng])
  },

  // Language
  language: 'en',
  setLanguage: (l) => set({ language: l }),

  // Modals
  searchOpen: false,
  reportOpen: false,
  settingsOpen: false,
  supporterOpen: false,
  citizenIntelOpen: false,
  setSearchOpen: (v) => set({ searchOpen: v }),
  setReportOpen: (v) => set({ reportOpen: v }),
  setSettingsOpen: (v) => set({ settingsOpen: v }),
  setSupporterOpen: (v) => set({ supporterOpen: v }),
  setCitizenIntelOpen: (v) => set({ citizenIntelOpen: v }),

  // Dossier
  dossier: null,
  setDossier: (d) => set({ dossier: d }),

  // Report
  reportCoords: null,
  setReportCoords: (c) => set({ reportCoords: c }),

  // Data
  loadshedding: null,
  municipalities: [],
  dams: [],
  articles: [],
  protests: [],
  aircraft: [],
  ships: [],

  setLoadshedding: (d) => set({ loadshedding: d }),
  setMunicipalities: (m) => set({ municipalities: m }),
  setDams: (d) => set({ dams: d }),
  setArticles: (a) => set({ articles: a }),
  setProtests: (p) => set({ protests: p }),
  setAircraft: (a) => set({ aircraft: a }),
  setShips: (s) => set({ ships: s }),

  // Economic
  exchangeRate: null,
  petrolPrice: null,
  powerLostHours: 0,

  setExchangeRate: (r) => set({ exchangeRate: r }),
  setPetrolPrice: (p) => set({ petrolPrice: p }),
  setPowerLostHours: (h) => set({ powerLostHours: h }),

  goodNews: [],
  setGoodNews: (items) => set({ goodNews: items }),

  loadsheddingStreaks: [],
  setLoadsheddingStreaks: (s) => set({ loadsheddingStreaks: s }),

  wantedPersons: [],
  wantedLastUpdated: null,
  setWantedPersons: (persons, lastUpdated) => set({ wantedPersons: persons, wantedLastUpdated: lastUpdated }),

  trending: null,
  setTrending: (d) => set({ trending: d }),
}))
