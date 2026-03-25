'use client'

import { useState } from 'react'
import { Tv, RefreshCw } from 'lucide-react'

type ChannelId = 'enca' | 'sabc' | 'news24' | 'parliament'

const CHANNELS: { id: ChannelId; label: string; channelId: string; url: string }[] = [
  { id: 'enca',       label: 'eNCA',   channelId: 'UCl5sL9V-WLwJGBN8FMhTKxw', url: 'https://www.youtube.com/channel/UCl5sL9V-WLwJGBN8FMhTKxw' },
  { id: 'sabc',       label: 'SABC',   channelId: 'UCqogzNJkNc01XUZBg4dfHqA', url: 'https://www.youtube.com/channel/UCqogzNJkNc01XUZBg4dfHqA' },
  { id: 'news24',     label: 'N24',    channelId: 'UCNrBHxevWGJhBFnMp2I76vg', url: 'https://www.youtube.com/channel/UCNrBHxevWGJhBFnMp2I76vg' },
  { id: 'parliament', label: 'PARL',   channelId: 'UCqMnkGKQHbzSRN-bFXJKtfg', url: 'https://www.youtube.com/channel/UCqMnkGKQHbzSRN-bFXJKtfg' },
]

function buildEmbedUrl(channelId: string): string {
  return `https://www.youtube-nocookie.com/embed/live_stream?channel=${channelId}&autoplay=1&mute=1&controls=1&modestbranding=1&rel=0`
}

// Corner bracket decoration
function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const style: React.CSSProperties = {
    position: 'absolute',
    width: 8, height: 8,
    borderColor: 'rgba(0,232,122,0.4)',
    borderStyle: 'solid',
    borderTopWidth: pos.startsWith('t') ? 1 : 0,
    borderBottomWidth: pos.startsWith('b') ? 1 : 0,
    borderLeftWidth: pos.endsWith('l') ? 1 : 0,
    borderRightWidth: pos.endsWith('r') ? 1 : 0,
    top:    pos.startsWith('t') ? 4 : undefined,
    bottom: pos.startsWith('b') ? 4 : undefined,
    left:   pos.endsWith('l')   ? 4 : undefined,
    right:  pos.endsWith('r')   ? 4 : undefined,
  }
  return <div style={style} />
}

export default function LiveTVPanel() {
  const [channel, setChannel] = useState<ChannelId>('enca')
  const [isPlaying, setIsPlaying] = useState(false)
  const [retryKey, setRetryKey] = useState(0)
  const [offline, setOffline] = useState(false)

  const active = CHANNELS.find((c) => c.id === channel)!

  function handleChannelSwitch(id: ChannelId) {
    setChannel(id)
    setOffline(false)
    setIsPlaying(false)
    setRetryKey((k) => k + 1)
  }

  return (
    <div style={{ borderBottom: '1px solid var(--div)' }}>
      {/* Panel header */}
      <div className="panel-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Tv size={9} style={{ color: 'var(--t-muted)' }} />
          <span className="panel-title">LIVE TV</span>
        </span>
        <span className="badge-live-red">
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--red)', animation: 'pulse 1s infinite', display: 'inline-block', marginRight: 3 }} />
          LIVE
        </span>
      </div>

      {/* Channel tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--div)',
        background: 'var(--bg-1)',
        height: 24,
        alignItems: 'stretch',
      }}>
        {CHANNELS.map((ch) => (
          <button
            key={ch.id}
            type="button"
            onClick={() => handleChannelSwitch(ch.id)}
            style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 8,
              color: channel === ch.id ? 'var(--green)' : 'var(--t-secondary)',
              padding: '0 8px',
              background: 'transparent',
              border: 'none',
              borderBottom: channel === ch.id ? '2px solid var(--green)' : '2px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              marginBottom: -1,
            }}
          >
            {ch.label}
          </button>
        ))}
      </div>

      {/* TV screen */}
      <div
        style={{
          height: 75,
          background: '#050608',
          position: 'relative',
          overflow: 'hidden',
          cursor: isPlaying ? 'default' : 'pointer',
        }}
        onClick={() => { if (!isPlaying) setIsPlaying(true) }}
      >
        <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />

        {offline ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 6 }}>
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'var(--t-muted)' }}>STREAM OFFLINE</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setOffline(false); setIsPlaying(false); setRetryKey((k) => k + 1) }}
              style={{
                background: 'var(--bg-2)', border: '1px solid var(--div-strong)',
                color: 'var(--t-secondary)', fontFamily: 'IBM Plex Mono, monospace',
                fontSize: 8, padding: '2px 8px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <RefreshCw size={9} /> RETRY
            </button>
          </div>
        ) : isPlaying ? (
          <iframe
            key={`${channel}-${retryKey}`}
            src={buildEmbedUrl(active.channelId)}
            style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            title={`${active.label} Live`}
            onError={() => setOffline(true)}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 4 }}>
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, fontWeight: 500, color: 'var(--t-primary)', letterSpacing: '0.1em' }}>
              {active.label}
            </span>
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: 'var(--t-dim)' }}>
              ► Click to watch live
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        height: 24, padding: '0 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: '1px solid var(--div)',
      }}>
        <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: 'var(--t-muted)' }}>
          {active.label} · Live Stream
        </span>
        <span className="live-badge">
          <span className="live-dot" />
          LIVE
        </span>
      </div>
    </div>
  )
}
