'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { MapPin, FileText, Copy, X, Plane, Ship, AlertTriangle, Newspaper, Flame, Droplets, Zap } from 'lucide-react'

interface FeatureContext {
  type: string
  props: Record<string, unknown>
}

interface MapContextMenuProps {
  x: number
  y: number
  lat: number
  lng: number
  feature?: FeatureContext
  onClose: () => void
  onViewDossier: () => void
  onReportIssue: () => void
}

// ── Entity-specific dossier summary rows ──────────────────────────────────────
function DossierSummary({ feature }: { feature: FeatureContext }) {
  const p = feature.props
  switch (feature.type) {
    case 'aircraft':
      return (
        <div className="px-3 py-2 border-b border-white/10 space-y-0.5">
          <Row icon={<Plane size={10} className="text-[#0ea5e9]" />}
            label="Callsign" value={String(p.callsign || '—')} />
          <Row label="Alt" value={p.altitude_m != null ? `${Math.round(Number(p.altitude_m))} m` : '—'} />
          <Row label="Speed" value={p.velocity_ms != null ? `${Math.round(Number(p.velocity_ms) * 3.6)} km/h` : '—'} />
          <Row label="Type" value={String(p.aircraft_type || '—')} />
        </div>
      )
    case 'ship':
      return (
        <div className="px-3 py-2 border-b border-white/10 space-y-0.5">
          <Row icon={<Ship size={10} className="text-[#7b2fff]" />}
            label="Vessel" value={String(p.name || '—')} />
          <Row label="Flag" value={String(p.flag || '—')} />
          <Row label="Speed" value={p.speed_kts != null ? `${Number(p.speed_kts).toFixed(1)} kts` : '—'} />
          <Row label="Dest" value={String(p.destination || '—')} />
        </div>
      )
    case 'protest':
      return (
        <div className="px-3 py-2 border-b border-white/10 space-y-0.5">
          <Row icon={<AlertTriangle size={10} className="text-[#dc2626]" />}
            label="Title" value={String(p.title || '—')} truncate />
          <Row label="Category" value={String(p.category || '—')} />
          <Row label="Date" value={String(p.date || '—')} />
        </div>
      )
    case 'news':
      return (
        <div className="px-3 py-2 border-b border-white/10 space-y-0.5">
          <Row icon={<Newspaper size={10} className="text-[#d97706]" />}
            label="Title" value={String(p.title || '—')} truncate />
          <Row label="Source" value={String(p.source || '—')} />
          <Row label="Sentiment" value={
            Number(p.sentiment) >= 0.2 ? '▲ Positive' :
            Number(p.sentiment) <= -0.2 ? '▼ Negative' : '— Neutral'
          } />
        </div>
      )
    case 'wanted':
    case 'missing':
      return (
        <div className="px-3 py-2 border-b border-white/10 space-y-0.5">
          <Row icon={<AlertTriangle size={10} className="text-[#dc2626]" />}
            label="Name" value={String(p.full_name || '—')} />
          <Row label="Category" value={String(p.crime_category || feature.type === 'missing' ? 'MISSING PERSON' : '—')} />
          <Row label="Province" value={String(p.province || '—')} />
        </div>
      )
    case 'municipality':
      return (
        <div className="px-3 py-2 border-b border-white/10 space-y-0.5">
          <Row icon={<MapPin size={10} className="text-[var(--accent)]" />}
            label="Name" value={String(p.name || '—')} />
          <Row label="Pain score" value={p.pain_score != null ? `${Number(p.pain_score).toFixed(1)} / 5` : '—'} />
          <Row label="Unemployment" value={p.unemployment_rate != null ? `${Number(p.unemployment_rate).toFixed(1)}%` : '—'} />
        </div>
      )
    case 'hunger':
      return (
        <div className="px-3 py-2 border-b border-white/10 space-y-0.5">
          <Row icon={<Flame size={10} className="text-[#d97706]" />}
            label="Area" value={String(p.municipality || '—')} />
          <Row label="Food insecure" value={p.food_insecure_pct != null ? `${Number(p.food_insecure_pct).toFixed(1)}%` : '—'} />
        </div>
      )
    case 'serviceAccess':
      return (
        <div className="px-3 py-2 border-b border-white/10 space-y-0.5">
          <Row icon={<Droplets size={10} className="text-[#0ea5e9]" />}
            label="Area" value={String(p.municipality || '—')} />
          <Row label="Fail score" value={p.service_fail_score != null ? `${(Number(p.service_fail_score) * 100).toFixed(0)}%` : '—'} />
        </div>
      )
    case 'military':
      return (
        <div className="px-3 py-2 border-b border-white/10 space-y-0.5">
          <Row icon={<Zap size={10} className="text-[#dc2626]" />}
            label="Base" value={String(p.name || '—')} />
          <Row label="Branch" value={String(p.branch || '—')} />
        </div>
      )
    default:
      return null
  }
}

function Row({ icon, label, value, truncate }: {
  icon?: React.ReactNode
  label: string
  value: string
  truncate?: boolean
}) {
  return (
    <div className="flex items-center gap-1.5">
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="text-[9px] text-[#4a5568] font-mono shrink-0 uppercase tracking-wide">{label}</span>
      <span className={`text-[9px] text-[#9ca3af] font-mono ml-auto ${truncate ? 'truncate max-w-[110px]' : ''}`}>{value}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default function MapContextMenu({
  x, y, lat, lng, feature,
  onClose, onViewDossier, onReportIssue,
}: MapContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose()
    }
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    const handleScroll = () => onClose()
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [onClose])

  const copyCoords = () => {
    navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`).catch(() => {})
    onClose()
  }

  // Viewport edge detection
  const menuW = 192
  const menuH = feature ? 240 : 160
  const adjustedX = x + menuW > window.innerWidth  ? x - menuW : x
  const adjustedY = y + menuH > window.innerHeight ? y - menuH : y

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.10 }}
      className="glass absolute z-50 py-1 pointer-events-auto"
      style={{ left: adjustedX, top: adjustedY, width: menuW, pointerEvents: 'auto' }}
    >
      {/* Coordinate header */}
      <div className="px-3 py-1.5 border-b border-white/10">
        <p className="text-[10px] text-[#6b7280] font-mono">
          {lat.toFixed(4)}°, {lng.toFixed(4)}°
        </p>
      </div>

      {/* Entity-specific dossier summary */}
      {feature && <DossierSummary feature={feature} />}

      {/* Actions */}
      <button
        type="button"
        onClick={() => { onViewDossier(); onClose() }}
        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-[#e8eaf0] hover:bg-white/5 hover:text-[var(--accent)] transition-colors"
      >
        <MapPin size={14} className="text-[var(--accent)]" />
        <span>{feature ? 'Open Dossier' : 'View Location'}</span>
      </button>

      <button
        type="button"
        onClick={() => { onReportIssue(); onClose() }}
        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-[#e8eaf0] hover:bg-white/5 hover:text-[var(--critical)] transition-colors"
      >
        <FileText size={14} className="text-[var(--warning)]" />
        <span>Report Issue</span>
      </button>

      <button
        type="button"
        onClick={copyCoords}
        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-[#e8eaf0] hover:bg-white/5 hover:text-[var(--normal)] transition-colors"
      >
        <Copy size={14} className="text-[#6b7280]" />
        <span>Copy Coordinates</span>
      </button>

      <div className="border-t border-white/10 mt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-[#6b7280] hover:bg-white/5 hover:text-[#e8eaf0] transition-colors"
        >
          <X size={12} />
          <span>Dismiss</span>
        </button>
      </div>
    </motion.div>
  )
}
