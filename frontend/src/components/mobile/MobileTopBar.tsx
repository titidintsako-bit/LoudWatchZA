'use client'

import { Zap, Search, Bell } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { usePushNotifications } from '@/hooks/usePushNotifications'

interface MobileTopBarProps {
  onSearchOpen: () => void
}

export default function MobileTopBar({ onSearchOpen }: MobileTopBarProps) {
  const loadshedding = useStore((s) => s.loadshedding)
  const { subscribed, subscribe } = usePushNotifications()

  const stage = loadshedding?.stage ?? 0
  const stageColor = stage === 0 ? 'var(--live)' : stage <= 2 ? 'var(--warning)' : 'var(--critical)'

  return (
    <div style={{
      height: 44,
      background: 'var(--bg-panel)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 12px',
      flexShrink: 0,
      zIndex: 100,
      position: 'relative',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Zap size={14} style={{ color: 'var(--accent)' }} fill="var(--accent)" />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.08em' }}>
          LOUDWATCH
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)', background: 'var(--accent)18', border: '1px solid var(--accent)44', borderRadius: 4, padding: '1px 5px' }}>
          ZA
        </span>
      </div>

      {/* Center — stage badge */}
      <div style={{
        position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: stageColor, boxShadow: `0 0 6px ${stageColor}` }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: stageColor, fontWeight: 600 }}>
          {stage === 0 ? 'NO SHEDDING' : `STAGE ${stage}`}
        </span>
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          onClick={onSearchOpen}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }}
        >
          <Search size={16} />
        </button>
        <button
          type="button"
          onClick={() => !subscribed && subscribe()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: subscribed ? 'var(--accent)' : 'var(--text-muted)', display: 'flex', padding: 4 }}
        >
          <Bell size={16} fill={subscribed ? 'var(--accent)' : 'none'} />
        </button>
      </div>
    </div>
  )
}
