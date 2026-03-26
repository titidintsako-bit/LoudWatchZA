'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import MapContextMenu from '@/components/map/MapContextMenu'
import type { RightClickContext } from '@/components/map/MapLibreMap'
import { useStore } from '@/store/useStore'
import { useLoadshedding } from '@/hooks/useLoadshedding'
import { useDamLevels } from '@/hooks/useDamLevels'
import { usePainIndex } from '@/hooks/usePainIndex'
import { useNews } from '@/hooks/useNews'
import { useProtests } from '@/hooks/useProtests'
import { useAircraft } from '@/hooks/useAircraft'
import { useShips } from '@/hooks/useShips'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { usePetrolPrice } from '@/hooks/usePetrolPrice'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useWanted } from '@/hooks/useWanted'
import { useTrending } from '@/hooks/useTrending'
import { useGpsJamming } from '@/hooks/useGpsJamming'
import { useGHSData, useCensusData, useHungerIndex } from '@/hooks/useStatsSA'
import { usePersistedPreferences } from '@/hooks/usePersistedPreferences'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import { useDeviceType } from '@/hooks/useDeviceType'
import { BORDER_POSTS } from '@/lib/constants'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import LoadsheddingBadge from '@/components/hud/LoadsheddingBadge'

const CitizenIntelModal = dynamic(() => import('@/components/modals/CitizenIntelModal'), { ssr: false })
const MobileDashboard   = dynamic(() => import('@/components/mobile/MobileDashboard'), { ssr: false })

// Dynamic imports — avoid SSR for heavy/browser-only components
const MapLibreMap = dynamic(() => import('@/components/map/MapLibreMap'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#4a5568', letterSpacing: '0.15em', marginBottom: 8 }}>
          INITIALIZING LOUDWATCH ZA
        </div>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#2d3748' }}>
          Loading data feeds…
        </div>
      </div>
    </div>
  ),
})

const TopBar      = dynamic(() => import('@/components/hud/TopBar'), { ssr: false })
const TabBar      = dynamic(() => import('@/components/hud/TabBar'), { ssr: false })
const DeckGLOverlay = dynamic(() => import('@/components/map/DeckGLOverlay'), { ssr: false })
const LeftSidebar   = dynamic(() => import('@/components/panels/LeftSidebar'), { ssr: false })
const RightSidebar  = dynamic(() => import('@/components/panels/RightSidebar'), {
  ssr: false,
  loading: () => (
    <div style={{ padding: '10px', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--t-muted)' }}>
      LOADING…
    </div>
  ),
})
const NewsStrip     = dynamic(() => import('@/components/news/NewsStrip'), { ssr: false })
const SearchModal   = dynamic(() => import('@/components/modals/SearchModal'), { ssr: false })
const ReportModal   = dynamic(() => import('@/components/modals/ReportModal'), { ssr: false })
const SettingsModal = dynamic(() => import('@/components/modals/SettingsModal'), { ssr: false })
const SupporterModal = dynamic(() => import('@/components/modals/SupporterModal'), { ssr: false })

export default function DashboardPage() {
  // Context menu state
  const [ctxMenu, setCtxMenu] = useState<RightClickContext | null>(null)
  const closeCtxMenu = useCallback(() => setCtxMenu(null), [])

  // Store selectors
  const layers       = useStore((s) => s.layers)
  const minimal      = useStore((s) => s.minimal)
  const loadshedding = useStore((s) => s.loadshedding)
  const aircraft     = useStore((s) => s.aircraft)
  const ships        = useStore((s) => s.ships)
  const protests     = useStore((s) => s.protests)
  const articles     = useStore((s) => s.articles)
  const municipalities = useStore((s) => s.municipalities)
  const dams         = useStore((s) => s.dams)
  const setDossier   = useStore((s) => s.setDossier)
  const searchOpen   = useStore((s) => s.searchOpen)
  const reportOpen   = useStore((s) => s.reportOpen)
  const settingsOpen = useStore((s) => s.settingsOpen)
  const supporterOpen = useStore((s) => s.supporterOpen)
  const citizenIntelOpen = useStore((s) => s.citizenIntelOpen)
  const timeFilter   = useStore((s) => s.timeFilter)

  // Store setters
  const setLoadshedding   = useStore((s) => s.setLoadshedding)
  const setDams           = useStore((s) => s.setDams)
  const setMunicipalities = useStore((s) => s.setMunicipalities)
  const setArticles       = useStore((s) => s.setArticles)
  const setProtests       = useStore((s) => s.setProtests)
  const setAircraft       = useStore((s) => s.setAircraft)
  const setShips          = useStore((s) => s.setShips)

  // Data hooks
  const { data: loadsheddingData }             = useLoadshedding()
  const { dams: damsData }                     = useDamLevels()
  const { municipalities: municipalitiesData } = usePainIndex()
  const { articles: articlesData }             = useNews()
  const { incidents: protestsData }            = useProtests()
  const { aircraft: aircraftData }             = useAircraft()
  const { ships: shipsData }                   = useShips()

  // Live data hooks
  useExchangeRate()
  usePetrolPrice()
  const { connected: wsConnected } = useWebSocket()
  const { wantedPersons }          = useWanted()
  useTrending()
  const { points: gpsJammingPoints } = useGpsJamming(layers.gpsJamming)
  const { data: ghsData }            = useGHSData()
  const { data: censusData }         = useCensusData()
  const { data: hungerData }         = useHungerIndex()
  usePersistedPreferences()
  useResponsiveLayout()
  const device = useDeviceType()

  // Time filter
  const cutoffMs = useMemo(() => {
    const now = Date.now()
    const map: Record<string, number> = { '1H': 3600000, '6H': 21600000, '24H': 86400000, '48H': 172800000, '7D': 604800000 }
    return timeFilter === 'ALL' ? 0 : now - (map[timeFilter] ?? 0)
  }, [timeFilter])

  const filteredArticles = useMemo(() => (
    cutoffMs === 0 ? articles : articles.filter((a) => new Date(a.published_at).getTime() >= cutoffMs)
  ), [articles, cutoffMs])

  const filteredProtests = useMemo(() => (
    cutoffMs === 0 ? protests : protests.filter((p) => new Date(p.date).getTime() >= cutoffMs)
  ), [protests, cutoffMs])

  // Sync hook data → Zustand store
  useEffect(() => { if (loadsheddingData) setLoadshedding(loadsheddingData) }, [loadsheddingData, setLoadshedding])
  useEffect(() => { if (damsData.length) setDams(damsData) }, [damsData, setDams])
  useEffect(() => { if (municipalitiesData.length) setMunicipalities(municipalitiesData) }, [municipalitiesData, setMunicipalities])
  useEffect(() => { if (articlesData.length) setArticles(articlesData) }, [articlesData, setArticles])
  useEffect(() => { if (protestsData.length) setProtests(protestsData) }, [protestsData, setProtests])
  useEffect(() => { if (aircraftData.length) setAircraft(aircraftData) }, [aircraftData, setAircraft])
  useEffect(() => { if (shipsData.length) setShips(shipsData) }, [shipsData, setShips])

  // Zoom-to event bridge
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      window.dispatchEvent(new CustomEvent('loudwatch:mapZoom', { detail: e.detail }))
    }
    window.addEventListener('loudwatch:zoomTo', handler as EventListener)
    return () => window.removeEventListener('loudwatch:zoomTo', handler as EventListener)
  }, [])

  // Ctrl+K → search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        useStore.getState().setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const stage = loadshedding?.stage ?? 0

  const mapProps = {
    layers,
    onMapRightClick: (ctx: RightClickContext) => {
      useStore.getState().setReportCoords({ lat: ctx.lat, lng: ctx.lng })
      setCtxMenu(ctx)
    },
    onFeatureClick: (feature: GeoJSON.Feature, type: string) => {
      const props = feature.properties ?? {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const coords = (feature.geometry as any)?.coordinates ?? [0, 0]
      setDossier({
        municipality: props.municipality ?? props.name ?? 'Unknown',
        province: props.province ?? '',
        pain_score: props.pain_score ?? 0,
        loadshedding_stage: loadshedding?.stage ?? 0,
        dam_level: null,
        unemployment_rate: props.unemployment_rate ?? 0,
        protest_count_7d: type === 'protest' ? 1 : 0,
        news_count_7d: type === 'news' ? 1 : 0,
        audit_outcome: props.audit_outcome ?? 'Unknown',
        lat: coords[1] ?? 0,
        lng: coords[0] ?? 0,
      })
    },
    aircraft,
    ships,
    protests: filteredProtests,
    news: filteredArticles,
    painMunicipalities: municipalities,
    loadshedding,
    dams,
    wantedPersons,
    gpsJammingPoints,
    ghsData,
    censusData,
    hungerData,
  }

  // Mobile gets a separate layout
  if (device === 'mobile') {
    return (
      <ErrorBoundary name="MobileDashboard">
        <MobileDashboard />
      </ErrorBoundary>
    )
  }

  // Minimal mode: full-screen map
  if (minimal) {
    return (
      <ErrorBoundary name="DashboardPage">
        <div className="scanlines" style={{ position: 'fixed', inset: 0, zIndex: 200, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#000', overflow: 'hidden' }}>
          <MapLibreMap {...mapProps} showMinimal />
          <DeckGLOverlay protests={filteredProtests} municipalities={municipalities} dams={dams} borderPosts={BORDER_POSTS} layerVisible={layers.protests || layers.painIndex || layers.borderMigration} />
          <div style={{ position: 'absolute', top: 12, right: 12 }}>
            <LoadsheddingBadge />
          </div>
        </div>
        <AnimatePresence>{searchOpen && <SearchModal key="search" />}</AnimatePresence>
        <AnimatePresence>{reportOpen && <ReportModal key="report" />}</AnimatePresence>
        <AnimatePresence>{settingsOpen && <SettingsModal key="settings" />}</AnimatePresence>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary name="DashboardPage">
      {/* Fixed overlays */}
      <div className="scanlines" style={{ position: 'fixed', inset: 0, zIndex: 200, pointerEvents: 'none' }} />
      {stage >= 4 && <div className="alert-border" />}

      {/* CSS Grid layout */}
      <main style={{
        display: 'grid',
        gridTemplateRows: '36px 26px 1fr 22px',
        gridTemplateColumns: '180px 1fr 220px',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#000',
      }}>

        {/* TopBar: row 1, all columns */}
        <div style={{ gridColumn: '1 / -1', gridRow: 1, overflow: 'hidden' }}>
          <TopBar />
        </div>

        {/* TabBar: row 2, all columns */}
        <div style={{ gridColumn: '1 / -1', gridRow: 2 }}>
          <TabBar />
        </div>

        {/* LeftSidebar: row 3, col 1 */}
        <div style={{ gridColumn: 1, gridRow: 3, overflow: 'hidden', borderRight: '1px solid var(--div)' }}>
          <LeftSidebar />
        </div>

        {/* Map: row 3, col 2 */}
        <div style={{ gridColumn: 2, gridRow: 3, position: 'relative', overflow: 'hidden', height: '100%' }}>
          <MapLibreMap {...mapProps} showMinimal={false} />
          <DeckGLOverlay
            protests={filteredProtests}
            municipalities={municipalities}
            dams={dams}
            borderPosts={BORDER_POSTS}
            layerVisible={layers.borderMigration}
          />
          {process.env.NODE_ENV === 'development' && (
            <div style={{ position: 'absolute', bottom: 6, right: 6, fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: '#2d3748', pointerEvents: 'none' }}>
              WS: {wsConnected ? '●' : '○'}
            </div>
          )}
        </div>

        {/* RightPanel: row 3, col 3 */}
        <div style={{ gridColumn: 3, gridRow: 3, overflow: 'hidden', borderLeft: '1px solid var(--div)' }}>
          <RightSidebar />
        </div>

        {/* BottomTicker: row 4, col 2 */}
        <div style={{ gridColumn: 2, gridRow: 4 }}>
          <NewsStrip />
        </div>

        {/* Corner cells — row 4 */}
        <div style={{ gridColumn: 1, gridRow: 4, background: '#000', borderRight: '1px solid var(--div)', borderTop: '1px solid var(--div)' }} />
        <div style={{ gridColumn: 3, gridRow: 4, background: '#000', borderLeft: '1px solid var(--div)', borderTop: '1px solid var(--div)' }} />
      </main>

      {/* Modals */}
      <AnimatePresence>
        {searchOpen && <SearchModal key="search" />}
      </AnimatePresence>
      <AnimatePresence>
        {reportOpen && <ReportModal key="report" />}
      </AnimatePresence>
      <AnimatePresence>
        {settingsOpen && <SettingsModal key="settings" />}
      </AnimatePresence>
      <AnimatePresence>
        {supporterOpen && <SupporterModal key="supporter" />}
      </AnimatePresence>
      <AnimatePresence>
        {citizenIntelOpen && <CitizenIntelModal key="citizen-intel" />}
      </AnimatePresence>

      {/* Right-click context menu — positioned over the map */}
      <AnimatePresence>
        {ctxMenu && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 300, pointerEvents: 'none' }}>
            <MapContextMenu
              key="ctx-menu"
              x={ctxMenu.x}
              y={ctxMenu.y}
              lat={ctxMenu.lat}
              lng={ctxMenu.lng}
              feature={ctxMenu.feature}
              onClose={closeCtxMenu}
              onReportIssue={() => {
                useStore.getState().setReportOpen(true)
                closeCtxMenu()
              }}
              onViewDossier={() => {
                const f = ctxMenu.feature
                if (f) {
                  const p = f.props
                  setDossier({
                    municipality: (p.municipality ?? p.name ?? 'Unknown') as string,
                    province: (p.province ?? '') as string,
                    pain_score: (p.pain_score ?? 0) as number,
                    loadshedding_stage: loadshedding?.stage ?? 0,
                    dam_level: null,
                    unemployment_rate: (p.unemployment_rate ?? 0) as number,
                    protest_count_7d: f.type === 'protest' ? 1 : 0,
                    news_count_7d: f.type === 'news' ? 1 : 0,
                    audit_outcome: (p.audit_outcome ?? 'Unknown') as string,
                    lat: ctxMenu.lat,
                    lng: ctxMenu.lng,
                  })
                }
                closeCtxMenu()
              }}
            />
          </div>
        )}
      </AnimatePresence>
    </ErrorBoundary>
  )
}
