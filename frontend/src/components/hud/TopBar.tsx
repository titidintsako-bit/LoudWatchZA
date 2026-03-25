'use client'

import { useState, useEffect } from 'react'
import { Search, Settings, Eye, EyeOff } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { SA_PROVINCES, ZOOM_PRESETS } from '@/lib/constants'
import LanguageSelector from './LanguageSelector'

// ── Health check ──────────────────────────────────────────────────────────────
type HealthStatus = 'ok' | 'degraded' | 'down' | 'unknown'
function useHealthCheck(): HealthStatus {
  const [status, setStatus] = useState<HealthStatus>('unknown')
  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch('/api/health', { signal: AbortSignal.timeout(5000) })
        setStatus(r.ok ? 'ok' : 'degraded')
      } catch { setStatus('down') }
    }
    check()
    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
  }, [])
  return status
}

// ── Loadshedding widget ───────────────────────────────────────────────────────
function LoadsheddingWidget() {
  const loadshedding = useStore((s) => s.loadshedding)
  const stage = loadshedding?.stage ?? 0
  let cls = 'stage-badge stage-ok'
  let text = 'STAGE 0 · CLEAR'
  if (stage >= 3) { cls = 'stage-badge stage-critical'; text = `STAGE ${stage} · CRITICAL` }
  else if (stage >= 1) { cls = 'stage-badge stage-warn'; text = `STAGE ${stage} · ACTIVE` }
  return <span className={cls} style={{ marginRight: 10 }}>{text}</span>
}

// ── Exchange widget ───────────────────────────────────────────────────────────
function ExchangeWidget() {
  const rate = useStore((s) => s.exchangeRate)
  if (!rate) return null
  const up = (rate.usdChange ?? 0) >= 0
  return (
    <div className="topbar-widget">
      <span className="topbar-widget-label">ZAR/USD</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <span className="topbar-widget-value">R{rate.usd?.toFixed(2) ?? '—'}</span>
        {rate.usdChange != null && (
          <span className={up ? 'topbar-widget-change-up' : 'topbar-widget-change-down'}>
            {up ? '▲' : '▼'}{Math.abs(rate.usdChange).toFixed(2)}%
          </span>
        )}
      </div>
    </div>
  )
}

// ── Petrol widget ─────────────────────────────────────────────────────────────
function PetrolWidget() {
  const petrol = useStore((s) => s.petrolPrice)
  if (!petrol) return null
  return (
    <div className="topbar-widget">
      <span className="topbar-widget-label">95 ULP</span>
      <span className="topbar-widget-value">R{petrol.unleaded95?.toFixed(2) ?? '—'}/L</span>
    </div>
  )
}

// ── Power lost widget ─────────────────────────────────────────────────────────
function PowerLostWidget() {
  const hours = useStore((s) => s.powerLostHours)
  if (!hours) return null
  return (
    <div className="topbar-widget">
      <span className="topbar-widget-label">POWER LOST {new Date().getFullYear()}</span>
      <span className="topbar-widget-value" style={{ color: 'var(--red)' }}>{hours.toLocaleString()} HRS</span>
    </div>
  )
}

// ── Population counter ────────────────────────────────────────────────────────
const POP_BASE = 63_108_000
const BIRTHS_PER_MS = 3940 / 86_400_000
function PopulationWidget() {
  const [pop, setPop] = useState(POP_BASE)
  useEffect(() => {
    const t0 = Date.now()
    const id = setInterval(() => setPop(Math.floor(POP_BASE + (Date.now() - t0) * BIRTHS_PER_MS)), 1200)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="topbar-widget">
      <span className="topbar-widget-label">POPULATION</span>
      <span className="topbar-widget-value">{pop.toLocaleString('en-ZA')}</span>
    </div>
  )
}

// ── Main TopBar ───────────────────────────────────────────────────────────────
export default function TopBar() {
  const minimal          = useStore((s) => s.minimal)
  const setMinimal       = useStore((s) => s.setMinimal)
  const setSearchOpen    = useStore((s) => s.setSearchOpen)
  const setSettingsOpen  = useStore((s) => s.setSettingsOpen)
  const setSelectedProvince = useStore((s) => s.setSelectedProvince)
  const selectedProvince = useStore((s) => s.selectedProvince)
  const setMapView       = useStore((s) => s.setMapView)
  const mapProjection    = useStore((s) => s.mapProjection)
  const setMapProjection = useStore((s) => s.setMapProjection)
  const timeFilter       = useStore((s) => s.timeFilter)
  const setTimeFilter    = useStore((s) => s.setTimeFilter)
  const health           = useHealthCheck()

  const healthColor = health === 'ok' ? 'var(--green)' : health === 'degraded' ? 'var(--amber)' : health === 'down' ? 'var(--red)' : 'var(--t-dim)'

  return (
    <div style={{
      height: 36,
      display: 'flex',
      alignItems: 'center',
      background: '#000',
      borderBottom: '1px solid var(--div)',
      padding: '0 10px',
      overflow: 'hidden',
    }}>

      {/* Identity */}
      <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, fontWeight: 500, color: '#fff', letterSpacing: '0.05em', marginRight: 6, flexShrink: 0 }}>
        LOUDWATCH <span style={{ color: 'var(--green)' }}>ZA</span>
      </span>
      <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'var(--t-dim)', marginRight: 10, flexShrink: 0 }}>v2.0</span>

      {/* Live dot */}
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', marginRight: 4, flexShrink: 0, animation: 'pulse 2s infinite' }} />
      <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'var(--t-dim)', marginRight: 10, flexShrink: 0 }}>LIVE</span>

      {/* Health dot */}
      <div
        title={health === 'ok' ? 'All systems OK' : health === 'degraded' ? 'Degraded' : health === 'down' ? 'Down' : 'Checking…'}
        style={{ width: 5, height: 5, borderRadius: '50%', background: healthColor, flexShrink: 0, marginRight: 10 }}
      />

      {/* Vertical divider */}
      <div style={{ width: 1, height: 16, background: 'var(--div-strong)', margin: '0 10px', flexShrink: 0 }} />

      {/* Loadshedding badge */}
      <LoadsheddingWidget />

      {/* HUD widgets */}
      <ExchangeWidget />
      <PetrolWidget />
      <PowerLostWidget />
      <PopulationWidget />

      {/* RIGHT: margin-left auto pushes everything right */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>

        {/* Vertical divider */}
        <div style={{ width: 1, height: 16, background: 'var(--div-strong)', margin: '0 8px', flexShrink: 0 }} />

        {/* Time filters */}
        {(['1H','6H','24H','7D','ALL'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTimeFilter(t === '7D' ? '7D' : t as typeof timeFilter)}
            style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 8,
              color: timeFilter === t ? 'var(--t-primary)' : 'var(--t-dim)',
              padding: '2px 5px',
              background: 'none',
              border: 'none',
              borderBottom: timeFilter === t ? '1px solid var(--green)' : 'none',
              cursor: 'pointer',
            }}
          >{t}</button>
        ))}

        <div style={{ width: 1, height: 16, background: 'var(--div-strong)', margin: '0 6px', flexShrink: 0 }} />

        {/* Map mode [2D][3D][GLOBE] */}
        <div style={{ display: 'flex', gap: 0 }}>
          {(['2d','3d','globe'] as const).map((p) => (
            <button key={p} type="button"
              onClick={() => { setMapProjection(p); window.dispatchEvent(new CustomEvent('loudwatch:setProjection', { detail: p })) }}
              style={{
                fontFamily: 'IBM Plex Mono, monospace',
                fontSize: 8,
                padding: '2px 6px',
                border: '1px solid var(--div-strong)',
                background: mapProjection === p ? 'var(--green)' : 'transparent',
                color: mapProjection === p ? '#000' : 'var(--t-dim)',
                cursor: 'pointer',
                marginLeft: -1,
                transition: 'all 0.12s',
              }}
            >{p.toUpperCase()}</button>
          ))}
        </div>

        <div style={{ width: 1, height: 16, background: 'var(--div-strong)', margin: '0 6px', flexShrink: 0 }} />

        {/* Province selector */}
        <select
          value={selectedProvince ?? ''} onChange={(e) => setSelectedProvince(e.target.value || null)}
          aria-label="Filter by province"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--div-strong)', color: 'var(--t-secondary)', fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, padding: '2px 4px', cursor: 'pointer', outline: 'none', height: 18 }}
        >
          <option value="" style={{ background: '#000' }}>ALL PROV</option>
          {SA_PROVINCES.map((p) => <option key={p} value={p} style={{ background: '#000' }}>{p.toUpperCase().slice(0, 8)}</option>)}
        </select>

        <div style={{ width: 1, height: 16, background: 'var(--div-strong)', margin: '0 6px', flexShrink: 0 }} />

        {/* Zoom presets */}
        {Object.entries(ZOOM_PRESETS).map(([key, preset]) => (
          <button key={key} type="button" onClick={() => setMapView(preset.zoom, preset.center)}
            style={{ background: 'transparent', border: '1px solid var(--div-strong)', color: 'var(--t-dim)', fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, padding: '2px 4px', cursor: 'pointer', height: 18, transition: 'all 0.12s' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--t-primary)'; e.currentTarget.style.borderColor = 'var(--t-muted)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--t-dim)'; e.currentTarget.style.borderColor = 'var(--div-strong)' }}
          >
            {key === 'CapeTown' ? 'CT' : key === 'Durban' ? 'DBN' : key}
          </button>
        ))}

        <div style={{ width: 1, height: 16, background: 'var(--div-strong)', margin: '0 6px', flexShrink: 0 }} />

        {/* Search */}
        <button type="button" onClick={() => setSearchOpen(true)} title="Search (⌘K)"
          style={{ background: 'none', border: '1px solid var(--div-strong)', color: 'var(--t-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px', height: 18, fontFamily: 'IBM Plex Mono, monospace', fontSize: 8 }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--t-secondary)'; e.currentTarget.style.borderColor = 'var(--t-muted)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--t-dim)'; e.currentTarget.style.borderColor = 'var(--div-strong)' }}
        >
          <Search size={10} /> ⌘K
        </button>

        <LanguageSelector />

        {/* Minimal toggle */}
        <button type="button" onClick={() => setMinimal(!minimal)} title={minimal ? 'Full mode' : 'Minimal mode'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t-dim)', padding: '0 6px', display: 'flex', alignItems: 'center', height: '100%' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--t-secondary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t-dim)')}
        >
          {minimal ? <Eye size={12} /> : <EyeOff size={12} />}
        </button>

        {/* Settings */}
        <button type="button" onClick={() => setSettingsOpen(true)} title="Settings"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t-dim)', padding: '0 6px', display: 'flex', alignItems: 'center', height: '100%' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--t-secondary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t-dim)')}
        >
          <Settings size={12} />
        </button>
      </div>
    </div>
  )
}
