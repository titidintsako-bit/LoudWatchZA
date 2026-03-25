'use client'

import { useStore } from '@/store/useStore'
import type { ProductMode } from '@/store/useStore'
import type { LayerState } from '@/types'

const MODES: Array<{ key: ProductMode; label: string }> = [
  { key: 'overview',    label: 'OVERVIEW' },
  { key: 'governance',  label: 'GOVERN' },
  { key: 'economy',     label: 'ECONOMY' },
  { key: 'safety',      label: 'SAFETY' },
  { key: 'environment', label: 'ENVIRON' },
  { key: 'judiciary',   label: 'COURTS' },
]

const MODE_LAYERS: Record<ProductMode, Partial<LayerState>> = {
  overview:    { loadshedding: true,  painIndex: true,  dams: true,  protests: true,  news: true,  aircraft: true,  ships: true,  crime: false, audits: false },
  governance:  { loadshedding: false, painIndex: true,  dams: false, protests: true,  news: false, aircraft: false, ships: false, audits: true, budget: true, unemployment: true },
  economy:     { loadshedding: false, painIndex: false, dams: false, protests: false, news: true,  ships: true, gdp: true, budget: true, population: true, unemployment: true },
  safety:      { loadshedding: false, painIndex: false, dams: false, protests: true,  news: false, crime: true, military: true, wanted: true, borderMigration: true },
  environment: { loadshedding: false, painIndex: false, dams: true,  protests: false, news: false, conservation: true, noPipedWater: true, hungerIndex: true },
  judiciary:   { loadshedding: false, painIndex: true,  dams: false, protests: true,  news: true,  crime: true, audits: true, wanted: true },
}

export default function TabBar() {
  const activeMode    = useStore((s) => s.activeMode)
  const setActiveMode = useStore((s) => s.setActiveMode)
  const setLayers     = useStore((s) => s.setLayers)

  function handleMode(mode: ProductMode) {
    setActiveMode(mode)
    setLayers(MODE_LAYERS[mode])
  }

  return (
    <div style={{
      height: 26,
      background: '#000',
      borderBottom: '1px solid var(--div)',
      display: 'flex',
      alignItems: 'flex-end',
      padding: '0 10px',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {MODES.map((m) => (
        <button
          key={m.key}
          type="button"
          onClick={() => handleMode(m.key)}
          className={`mode-tab${activeMode === m.key ? ' active' : ''}`}
        >
          {m.label}
        </button>
      ))}
      {/* CULTURE tab — visual only, no data change */}
      <button
        type="button"
        onClick={() => handleMode('overview')}
        className="mode-tab"
        style={{ opacity: 0.6 }}
      >
        CULTURE
      </button>
    </div>
  )
}
