'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Zap, Droplets, BarChart2, Gavel, TrendingUp, Newspaper } from 'lucide-react'
import MobileTopBar from './MobileTopBar'
import BottomNav, { type MobileTab } from './BottomNav'
import BottomSheet from './BottomSheet'
import LoadsheddingSheet from './sheets/LoadsheddingSheet'
import WaterSheet from './sheets/WaterSheet'
import StatsSheet from './sheets/StatsSheet'
import JudiciarySheet from './sheets/JudiciarySheet'
import TrendingSheet from './sheets/TrendingSheet'
import NewsSheet from './sheets/NewsSheet'
import { useStore } from '@/store/useStore'

const MapLibreMap = dynamic(() => import('@/components/map/MapLibreMap'), { ssr: false })

const SHEET_CONFIG: Record<MobileTab, { title: string; icon: React.ReactNode }> = {
  loadshedding: { title: 'Loadshedding',       icon: <Zap size={14} /> },
  water:        { title: 'Water & Dams',        icon: <Droplets size={14} /> },
  stats:        { title: 'Stats & Pain Index',  icon: <BarChart2 size={14} /> },
  judiciary:    { title: 'Judiciary',           icon: <Gavel size={14} /> },
  trending:     { title: 'Trending in SA',      icon: <TrendingUp size={14} /> },
  news:         { title: 'Intel Feed',          icon: <Newspaper size={14} /> },
}

export default function MobileDashboard() {
  const [activeTab, setActiveTab] = useState<MobileTab | null>(null)

  // Store data for MapLibreMap props
  const layers       = useStore((s) => s.layers)
  const loadshedding = useStore((s) => s.loadshedding)
  const aircraft     = useStore((s) => s.aircraft)
  const ships        = useStore((s) => s.ships)
  const protests     = useStore((s) => s.protests)
  const articles     = useStore((s) => s.articles)
  const municipalities = useStore((s) => s.municipalities)
  const dams         = useStore((s) => s.dams)

  const handleTabPress = useCallback((tab: MobileTab) => {
    setActiveTab((prev) => (prev === tab ? null : tab))
  }, [])

  const closeSheet = useCallback(() => setActiveTab(null), [])

  const navActive = activeTab ?? 'loadshedding'

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg-base)',
      overflow: 'hidden',
    }}>
      {/* Top bar */}
      <MobileTopBar onSearchOpen={() => useStore.getState().setSearchOpen(true)} />

      {/* Map — fills remaining space */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <MapLibreMap
          layers={layers}
          loadshedding={loadshedding}
          aircraft={aircraft}
          ships={ships}
          protests={protests}
          news={articles}
          painMunicipalities={municipalities}
          dams={dams}
          showMinimal={true}
          onFeatureClick={() => {}}
        />
      </div>

      {/* Bottom navigation */}
      <BottomNav active={navActive} onChange={handleTabPress} />

      {/* Bottom sheets */}
      {activeTab && (
        <BottomSheet
          open={true}
          onClose={closeSheet}
          title={SHEET_CONFIG[activeTab].title}
          icon={SHEET_CONFIG[activeTab].icon}
        >
          {activeTab === 'loadshedding' && <LoadsheddingSheet />}
          {activeTab === 'water'        && <WaterSheet />}
          {activeTab === 'stats'        && <StatsSheet />}
          {activeTab === 'judiciary'    && <JudiciarySheet />}
          {activeTab === 'trending'     && <TrendingSheet />}
          {activeTab === 'news'         && <NewsSheet />}
        </BottomSheet>
      )}
    </div>
  )
}
