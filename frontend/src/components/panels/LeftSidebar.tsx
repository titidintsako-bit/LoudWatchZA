'use client'

import { useStore } from '@/store/useStore'
import LayerControl from './LayerControl'

export default function LeftSidebar() {
  const layers    = useStore((s) => s.layers)
  const setLayers = useStore((s) => s.setLayers)
  const setCitizenIntelOpen = useStore((s) => s.setCitizenIntelOpen)

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* SA SITUATION header */}
      <div style={{
        height: 24,
        padding: '0 10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--div)',
        background: 'var(--bg-1)',
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 8,
          color: 'var(--t-dim)',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
        }}>
          SA SITUATION
        </span>
        <span className="live-badge">
          <span className="live-dot" />
          LIVE
        </span>
      </div>

      {/* Layer control — scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
        <LayerControl layers={layers} onChange={(l) => setLayers(l)} />
      </div>

      {/* Submit Intel button */}
      <div style={{ flexShrink: 0, padding: '8px 10px', borderTop: '1px solid var(--div)' }}>
        <button
          type="button"
          onClick={() => setCitizenIntelOpen(true)}
          style={{
            width: '100%',
            height: 28,
            background: 'transparent',
            border: '1px solid var(--div-strong)',
            color: 'var(--t-secondary)',
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 8,
            letterSpacing: '0.05em',
            cursor: 'pointer',
            transition: 'border-color 0.12s, color 0.12s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--green)'
            e.currentTarget.style.color = 'var(--t-primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--div-strong)'
            e.currentTarget.style.color = 'var(--t-secondary)'
          }}
        >
          + SUBMIT INTEL
        </button>
      </div>
    </div>
  )
}
