'use client'

import { Zap, Droplets, BarChart2, Gavel, TrendingUp, Newspaper } from 'lucide-react'

export type MobileTab = 'loadshedding' | 'water' | 'stats' | 'judiciary' | 'trending' | 'news'

interface BottomNavProps {
  active: MobileTab
  onChange: (tab: MobileTab) => void
}

const TABS: { id: MobileTab; icon: React.ReactNode; label: string }[] = [
  { id: 'loadshedding', icon: <Zap size={18} />, label: 'Power' },
  { id: 'water',        icon: <Droplets size={18} />, label: 'Water' },
  { id: 'stats',        icon: <BarChart2 size={18} />, label: 'Stats' },
  { id: 'judiciary',   icon: <Gavel size={18} />, label: 'Courts' },
  { id: 'trending',    icon: <TrendingUp size={18} />, label: 'Trending' },
  { id: 'news',        icon: <Newspaper size={18} />, label: 'News' },
]

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: 56,
      background: 'var(--bg-panel)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      zIndex: 300,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {TABS.map((tab) => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 3, background: 'none', border: 'none',
              cursor: 'pointer',
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              transition: 'color 0.15s',
            }}
          >
            {tab.icon}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.04em', fontWeight: isActive ? 600 : 400 }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
