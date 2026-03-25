'use client'

import {
  Zap, AlertTriangle, Droplets, Skull, ClipboardCheck, TrendingDown,
  Megaphone, Newspaper, Plane, Ship, Wrench, ZapOff, Utensils,
  BarChart2, Wallet, Users, Shield, Landmark, Leaf, Milestone, AlertOctagon,
  Radio, Satellite,
} from 'lucide-react'
import type { LayerState } from '@/types'

interface Props {
  layers: LayerState
  onChange: (layers: LayerState) => void
}

type LayerKey = keyof LayerState

interface LayerConfig {
  key: LayerKey
  label: string
  icon: React.ElementType
  frequency: string
  live: boolean
}

const CORE_LAYERS: LayerConfig[] = [
  { key: 'loadshedding', label: 'Loadshedding',   icon: Zap,          frequency: 'LIVE',   live: true  },
  { key: 'painIndex',    label: 'Pain Index',      icon: AlertTriangle,frequency: 'DAILY',  live: false },
  { key: 'dams',         label: 'Dam Levels',      icon: Droplets,     frequency: 'WEEKLY', live: false },
  { key: 'crime',        label: 'Crime Heatmap',   icon: Skull,        frequency: 'QTRLY',  live: false },
  { key: 'audits',       label: 'Municipal Audits',icon: ClipboardCheck,frequency: 'ANNUAL',live: false },
  { key: 'unemployment', label: 'Unemployment',    icon: TrendingDown, frequency: 'QTRLY',  live: false },
  { key: 'protests',     label: 'Protests',        icon: Megaphone,    frequency: 'DAILY',  live: false },
  { key: 'news',         label: 'News Pins',       icon: Newspaper,    frequency: '5M',     live: true  },
  { key: 'aircraft',     label: 'ADS-B Aircraft',  icon: Plane,        frequency: 'LIVE',   live: true  },
  { key: 'ships',        label: 'AIS Ships',       icon: Ship,         frequency: 'LIVE',   live: true  },
]

const STATS_SA_LAYERS: LayerConfig[] = [
  { key: 'serviceAccess', label: 'Service Access',   icon: Wrench,       frequency: 'ANNUAL', live: false },
  { key: 'noElectricity', label: 'No Electricity',   icon: ZapOff,       frequency: 'CENSUS', live: false },
  { key: 'noPipedWater',  label: 'No Piped Water',   icon: Droplets,     frequency: 'CENSUS', live: false },
  { key: 'noSanitation',  label: 'No Sanitation',    icon: AlertTriangle,frequency: 'CENSUS', live: false },
  { key: 'hungerIndex',   label: 'Hunger Index',     icon: Utensils,     frequency: 'ANNUAL', live: false },
]

const ECONOMIC_LAYERS: LayerConfig[] = [
  { key: 'gdp',        label: 'GDP per Province',   icon: BarChart2, frequency: 'ANNUAL', live: false },
  { key: 'budget',     label: 'Budget Underspend',  icon: Wallet,    frequency: 'ANNUAL', live: false },
  { key: 'population', label: 'Population Density', icon: Users,     frequency: 'CENSUS', live: false },
]

const DEFENCE_LAYERS: LayerConfig[] = [
  { key: 'military',       label: 'Military Bases',    icon: Shield,      frequency: 'STATIC', live: false },
  { key: 'govtHQ',         label: 'Govt Buildings',    icon: Landmark,    frequency: 'STATIC', live: false },
  { key: 'conservation',   label: 'Conservation',      icon: Leaf,        frequency: 'ANNUAL', live: false },
  { key: 'borderMigration',label: 'Border & Migration',icon: Milestone,   frequency: 'QTRLY',  live: false },
  { key: 'wanted',         label: 'Most Wanted',       icon: AlertOctagon,frequency: 'DAILY',  live: false },
  { key: 'gpsJamming',     label: 'GPS Jamming',       icon: Radio,       frequency: 'DAILY',  live: false },
  { key: 'nasaSatellite',  label: 'NASA Satellite',    icon: Satellite,   frequency: '30D',    live: false },
]

const SECTIONS = [
  { label: 'CORE',              configs: CORE_LAYERS     },
  { label: 'STATS SA',          configs: STATS_SA_LAYERS },
  { label: 'ECONOMIC',          configs: ECONOMIC_LAYERS },
  { label: 'DEFENCE & SECURITY',configs: DEFENCE_LAYERS  },
]

const ALL_CONFIGS = [...CORE_LAYERS, ...STATS_SA_LAYERS, ...ECONOMIC_LAYERS, ...DEFENCE_LAYERS]

// ── Minimal toggle ────────────────────────────────────────────────────────────
function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on ? 'true' : 'false'}
      title={on ? `Disable ${label}` : `Enable ${label}`}
      onClick={(e) => { e.stopPropagation(); onToggle() }}
      style={{
        width: 24, height: 14, borderRadius: 7, border: 'none', cursor: 'pointer',
        background: on ? 'var(--normal)' : 'var(--div)',
        position: 'relative', flexShrink: 0, transition: 'background 0.15s',
        padding: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: on ? 12 : 2,
        width: 10, height: 10, borderRadius: '50%',
        background: 'var(--t-value)', transition: 'left 0.15s',
        display: 'block',
      }} />
    </button>
  )
}

// ── Layer row ─────────────────────────────────────────────────────────────────
function LayerRow({ config, isOn, onToggle }: { config: LayerConfig; isOn: boolean; onToggle: () => void }) {
  const Icon = config.icon
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() } }}
      className="layer-row"
      style={{ borderLeft: isOn ? '2px solid var(--accent)' : '2px solid transparent', paddingLeft: isOn ? 10 : 12 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
        <Icon size={13} style={{ color: isOn ? 'var(--t-label)' : 'var(--t-dim)', flexShrink: 0 }} />
        <span style={{
          fontFamily: 'var(--font-ui)', fontSize: 12,
          color: isOn ? 'var(--t-value)' : 'var(--t-label)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {config.label}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span className="layer-badge">
          {isOn && config.live ? <span className="live-dot" style={{ width: 4, height: 4, marginRight: 3, display: 'inline-block' }} /> : null}
          {config.frequency}
        </span>
        <Toggle on={isOn} onToggle={onToggle} label={config.label} />
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LayerControl({ layers, onChange }: Props) {
  function toggleLayer(key: LayerKey) {
    onChange({ ...layers, [key]: !layers[key] })
  }

  const enabledCount = ALL_CONFIGS.filter((c) => layers[c.key]).length
  const allOn = ALL_CONFIGS.every((c) => layers[c.key])

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {SECTIONS.map((section) => (
        <div key={section.label}>
          <div className="section-header">{section.label}</div>
          {section.configs.map((config) => (
            <LayerRow
              key={config.key}
              config={config}
              isOn={!!layers[config.key]}
              onToggle={() => toggleLayer(config.key)}
            />
          ))}
        </div>
      ))}

      {/* Footer */}
      <div style={{
        height: 28, padding: '0 12px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', borderTop: '1px solid var(--div)',
      }}>
        <span style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--t-meta)' }}>
          {enabledCount}/{ALL_CONFIGS.length} active
        </span>
        <button
          type="button"
          onClick={() => {
            const next = Object.fromEntries(ALL_CONFIGS.map((c) => [c.key, !allOn]))
            onChange({ ...layers, ...next })
          }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--t-meta)',
            transition: 'color 0.1s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--t-label)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t-meta)')}
        >
          {allOn ? 'DISABLE ALL' : 'ENABLE ALL'}
        </button>
      </div>
    </div>
  )
}
