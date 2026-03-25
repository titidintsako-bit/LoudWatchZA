'use client'

import { useStore } from '@/store/useStore'
import type { ProductMode } from '@/store/useStore'
import type { LayerState } from '@/types'

const MODES: Array<{ key: ProductMode; label: string }> = [
  { key: 'overview',    label: 'OVERVIEW' },
  { key: 'governance',  label: 'GOVERNANCE' },
  { key: 'economy',     label: 'ECONOMY' },
  { key: 'safety',      label: 'SAFETY' },
  { key: 'environment', label: 'ENVIRONMENT' },
  { key: 'judiciary',   label: 'JUDICIARY' },
]

const MODE_LAYERS: Record<ProductMode, Partial<LayerState>> = {
  overview: {
    loadshedding: true, painIndex: true, dams: true, protests: true, news: true,
    aircraft: true, ships: true, crime: false, audits: false,
    gdp: false, budget: false, population: false, military: false, wanted: false,
  },
  governance: {
    loadshedding: false, painIndex: true, dams: false, protests: true, news: false,
    aircraft: false, ships: false, crime: false, audits: true,
    gdp: false, budget: true, population: false, unemployment: true,
  },
  economy: {
    loadshedding: false, painIndex: false, dams: false, protests: false, news: true,
    aircraft: false, ships: true, crime: false, audits: false,
    gdp: true, budget: true, population: true, unemployment: true,
  },
  safety: {
    loadshedding: false, painIndex: false, dams: false, protests: true, news: false,
    aircraft: false, ships: false, crime: true, audits: false,
    gdp: false, budget: false, military: true, wanted: true, borderMigration: true,
  },
  environment: {
    loadshedding: false, painIndex: false, dams: true, protests: false, news: false,
    aircraft: false, ships: false, crime: false, audits: false,
    conservation: true, noPipedWater: true, noElectricity: false, hungerIndex: true,
  },
  judiciary: {
    loadshedding: false, painIndex: true, dams: false, protests: true, news: true,
    aircraft: false, ships: false, crime: true, audits: true,
    gdp: false, budget: false, military: false, wanted: true,
  },
}

export default function ProductModeTabs() {
  const activeMode = useStore((s) => s.activeMode)
  const setActiveMode = useStore((s) => s.setActiveMode)
  const setLayers = useStore((s) => s.setLayers)

  function handleModeChange(mode: ProductMode) {
    setActiveMode(mode)
    setLayers(MODE_LAYERS[mode])
  }

  return (
    <div
      className="flex items-center h-full"
      style={{ overflowX: 'auto' }}
    >
      {MODES.map((m) => {
        const active = activeMode === m.key
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => handleModeChange(m.key)}
            style={{
              height: '100%',
              padding: '0 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
              color: active ? 'var(--text-primary)' : 'var(--text-muted)',
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              cursor: 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
            }}
            onMouseLeave={(e) => {
              if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'
            }}
          >
            {m.label}
          </button>
        )
      })}
    </div>
  )
}
