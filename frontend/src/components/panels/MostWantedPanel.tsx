'use client'

import { useState, useMemo } from 'react'
import NextImage from 'next/image'
import { AlertOctagon, Search, Share2, Phone, UserX, Eye } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useStore } from '@/store/useStore'
import { SA_PROVINCES } from '@/lib/constants'
import type { WantedPerson } from '@/types'

const CRIME_STOP = '08600 10111'
const SHARE_CAPTION = `Help catch this person. Call ${CRIME_STOP} with any info. #CrimeStop #LoudWatchZA`

const CATEGORY_COLORS: Record<string, string> = {
  Murder: 'var(--critical)',
  Robbery: '#ff5500',
  'Sexual Offences': '#e91e63',
  'Fraud & Corruption': '#ffeb3b',
  Drugs: '#7b2fff',
  Assault: 'var(--warning)',
  Theft: 'var(--warning)',
  Kidnapping: 'var(--critical)',
  Terrorism: '#cc0033',
  Other: '#6b7280',
}

// ── Share card generator ────────────────────────────────────────────────────
function generateShareCard(person: WantedPerson): Promise<Blob | null> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = 600
    canvas.height = 340
    const ctx = canvas.getContext('2d')
    if (!ctx) { resolve(null); return }

    // Background
    ctx.fillStyle = '#0a0e17'
    ctx.fillRect(0, 0, 600, 340)

    // Red accent top bar
    ctx.fillStyle = 'var(--critical)'
    ctx.fillRect(0, 0, 600, 6)

    // Header text
    ctx.fillStyle = 'var(--critical)'
    ctx.font = 'bold 11px "Courier New", monospace'
    ctx.fillText('⚠ MOST WANTED — SOUTH AFRICAN POLICE SERVICE', 20, 30)

    // Photo (if available)
    const drawText = () => {
      // Name
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 22px "Courier New", monospace'
      const nameX = person.photo_url ? 200 : 20
      ctx.fillText(person.full_name.toUpperCase(), nameX, 70)

      // Crime category badge
      const catColor = CATEGORY_COLORS[person.crime_category ?? ''] ?? '#6b7280'
      ctx.fillStyle = catColor + '33'
      ctx.fillRect(nameX, 80, 180, 22)
      ctx.fillStyle = catColor
      ctx.font = 'bold 10px "Courier New", monospace'
      ctx.fillText(person.crime_category ?? 'Unknown', nameX + 6, 95)

      // Charges
      if (person.charges) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)'
        ctx.font = '11px "Courier New", monospace'
        const charges = person.charges.slice(0, 80)
        ctx.fillText(charges, nameX, 122)
      }

      // Location
      if (person.last_known_location) {
        ctx.fillStyle = 'rgba(255,255,255,0.5)'
        ctx.font = '10px "Courier New", monospace'
        ctx.fillText(`Last known: ${person.last_known_location}`, nameX, 142)
      }

      // Case / station
      if (person.case_number) {
        ctx.fillStyle = 'rgba(14,165,233,0.7)'
        ctx.font = '10px "Courier New", monospace'
        ctx.fillText(`CAS: ${person.case_number}`, nameX, 162)
      }

      // Divider
      ctx.strokeStyle = 'rgba(220,38,38,0.3)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(20, 250)
      ctx.lineTo(580, 250)
      ctx.stroke()

      // Crime Stop CTA
      ctx.fillStyle = 'var(--normal)'
      ctx.font = 'bold 14px "Courier New", monospace'
      ctx.fillText(`📞 CRIME STOP: ${CRIME_STOP}`, 20, 278)

      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.font = '11px "Courier New", monospace'
      ctx.fillText('Help catch this person. All info treated confidentially.', 20, 298)

      // Watermark
      ctx.fillStyle = 'rgba(14,165,233,0.4)'
      ctx.font = '9px "Courier New", monospace'
      ctx.fillText('loudwatch.co.za', 480, 330)

      canvas.toBlob((blob) => resolve(blob), 'image/png')
    }

    if (person.photo_url) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        // Draw photo left column
        ctx.drawImage(img, 20, 40, 160, 190)
        ctx.strokeStyle = 'rgba(220,38,38,0.5)'
        ctx.lineWidth = 2
        ctx.strokeRect(20, 40, 160, 190)
        drawText()
      }
      img.onerror = drawText
      img.src = person.photo_url
    } else {
      drawText()
    }
  })
}

async function shareCard(person: WantedPerson) {
  const blob = await generateShareCard(person)

  // Try Web Share API (mobile)
  if (blob && navigator.canShare?.({ files: [new File([blob], 'wanted.png', { type: 'image/png' })] })) {
    try {
      await navigator.share({
        title: `MOST WANTED: ${person.full_name}`,
        text: SHARE_CAPTION,
        files: [new File([blob], 'wanted.png', { type: 'image/png' })],
      })
      return
    } catch { /* fall through */ }
  }

  // Download image + open share URLs
  if (blob) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wanted-${person.full_name.replace(/\s+/g, '-').toLowerCase()}.png`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Open WhatsApp share as fallback
  const text = encodeURIComponent(`${SHARE_CAPTION}\n\nName: ${person.full_name}\nCharges: ${person.charges ?? 'See SAPS'}`)
  window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener')
}

// ── Person card ─────────────────────────────────────────────────────────────
function PersonCard({ person, onShare }: { person: WantedPerson; onShare: () => void }) {
  const [imgError, setImgError] = useState(false)
  const catColor = CATEGORY_COLORS[person.crime_category ?? ''] ?? '#6b7280'

  return (
    <div
      className="flex gap-2.5 px-3 py-2.5"
      style={{
        borderLeft: `2px solid ${person.is_missing ? 'var(--accent)44' : 'var(--critical)44'}`,
        background: person.is_missing ? 'rgba(14,165,233,0.02)' : 'rgba(220,38,38,0.02)',
      }}
    >
      {/* Photo */}
      <div
        className="flex-shrink-0 rounded overflow-hidden"
        style={{
          width: 44,
          height: 52,
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${person.is_missing ? 'rgba(14,165,233,0.2)' : 'rgba(220,38,38,0.2)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {person.photo_url && !imgError ? (
          <NextImage
            src={person.photo_url}
            alt={person.full_name}
            width={44}
            height={52}
            style={{ objectFit: 'cover' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <UserX size={18} style={{ color: 'rgba(255,255,255,0.2)' }} />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p
          style={{
            fontFamily: 'var(--font-data)',
            fontSize: '0.6rem',
            color: person.is_missing ? 'rgba(14,165,233,0.9)' : 'rgba(255,255,255,0.9)',
            fontWeight: 600,
            lineHeight: 1.3,
          }}
        >
          {person.full_name}
        </p>

        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {person.crime_category && (
            <span
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: '0.38rem',
                letterSpacing: '0.08em',
                padding: '1px 4px',
                borderRadius: 2,
                background: catColor + '22',
                color: catColor,
                border: `1px solid ${catColor}44`,
              }}
            >
              {person.crime_category}
            </span>
          )}
          {person.province && (
            <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.42rem', color: 'rgba(255,255,255,0.3)' }}>
              {person.province}
            </span>
          )}
        </div>

        {person.charges && (
          <p
            style={{
              fontFamily: 'var(--font-data)',
              fontSize: '0.48rem',
              color: 'rgba(255,255,255,0.5)',
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {person.charges}
          </p>
        )}

        {person.last_known_location && (
          <p style={{ fontFamily: 'var(--font-data)', fontSize: '0.42rem', color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
            Last seen: {person.last_known_location}
          </p>
        )}
      </div>

      {/* Share button */}
      <button
        type="button"
        onClick={onShare}
        title="Share on social media"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', flexShrink: 0, alignSelf: 'flex-start' }}
      >
        <Share2 size={11} style={{ color: 'rgba(255,255,255,0.3)' }} />
      </button>
    </div>
  )
}

// ── Main panel ───────────────────────────────────────────────────────────────
export default function MostWantedPanel() {
  const [open, setOpen] = useState(true)
  const [tab, setTab] = useState<'wanted' | 'missing'>('wanted')
  const [province, setProvince] = useState<string>('')
  const [category, setCategory] = useState<string>('')
  const [search, setSearch] = useState<string>('')

  const wantedPersons = useStore((s) => s.wantedPersons)
  const wantedLastUpdated = useStore((s) => s.wantedLastUpdated)

  const staleDays = useMemo(() => {
    if (!wantedLastUpdated) return null
    const diff = Date.now() - new Date(wantedLastUpdated).getTime()
    return Math.floor(diff / 86_400_000)
  }, [wantedLastUpdated])

  const filtered = useMemo(() => {
    return wantedPersons.filter((p) => {
      if (p.is_missing !== (tab === 'missing')) return false
      if (province && p.province !== province) return false
      if (category && p.crime_category !== category) return false
      if (search) {
        const q = search.toLowerCase()
        if (!p.full_name.toLowerCase().includes(q) &&
            !(p.last_known_location ?? '').toLowerCase().includes(q) &&
            !(p.charges ?? '').toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [wantedPersons, tab, province, category, search])

  const categories = useMemo(() => {
    const cats = new Set(
      wantedPersons
        .filter((p) => !p.is_missing && p.crime_category)
        .map((p) => p.crime_category!)
    )
    return Array.from(cats).sort()
  }, [wantedPersons])

  const wantedCount = wantedPersons.filter((p) => !p.is_missing).length
  const missingCount = wantedPersons.filter((p) => p.is_missing).length

  return (
    <div>
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <div className="flex items-center gap-2">
          <AlertOctagon size={12} style={{ color: 'var(--critical)' }} />
          <span
            style={{
              fontFamily: 'var(--font-data)',
              fontSize: '0.6rem',
              color: 'var(--critical)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            Most Wanted
          </span>
          {wantedCount > 0 && (
            <span
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: '0.38rem',
                background: 'rgba(220,38,38,0.15)',
                color: 'var(--critical)',
                border: '1px solid rgba(220,38,38,0.3)',
                borderRadius: 2,
                padding: '1px 4px',
              }}
            >
              {wantedCount + missingCount}
            </span>
          )}
        </div>
        <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.5rem', color: 'rgba(220,38,38,0.4)' }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div className="pb-2">
          {/* Crime Stop banner */}
          <div
            className="mx-3 mb-2 px-3 py-2 rounded flex items-center gap-2"
            style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}
          >
            <Phone size={12} style={{ color: 'var(--critical)', flexShrink: 0 }} />
            <div>
              <p style={{ fontFamily: 'var(--font-data)', fontSize: '0.5rem', color: 'var(--critical)', letterSpacing: '0.1em' }}>
                CRIME STOP
              </p>
              <p style={{ fontFamily: 'var(--font-data)', fontSize: '0.7rem', color: 'var(--critical)', letterSpacing: '0.05em', fontWeight: 700 }}>
                {CRIME_STOP}
              </p>
            </div>
            <p style={{ fontFamily: 'var(--font-data)', fontSize: '0.45rem', color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>
              Confidential tip-offs. Anonymous. 24/7.
            </p>
          </div>

          {/* Stale data notice */}
          {staleDays !== null && staleDays > 1 && (
            <div className="mx-3 mb-2 px-2 py-1 rounded" style={{ background: 'rgba(255,145,0,0.08)', border: '1px solid rgba(255,145,0,0.15)' }}>
              <p style={{ fontFamily: 'var(--font-data)', fontSize: '0.45rem', color: 'rgba(255,145,0,0.7)' }}>
                ⚠ Last updated {staleDays} days ago — scraper may need attention
              </p>
            </div>
          )}

          {/* Wanted / Missing tabs */}
          <div className="flex mx-3 mb-2" style={{ borderBottom: '1px solid rgba(220,38,38,0.1)' }}>
            <button
              type="button"
              onClick={() => setTab('wanted')}
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: '0.42rem',
                letterSpacing: '0.1em',
                color: tab === 'wanted' ? 'var(--critical)' : 'rgba(255,255,255,0.3)',
                background: 'none',
                border: 'none',
                borderBottom: tab === 'wanted' ? '1px solid var(--critical)' : '1px solid transparent',
                cursor: 'pointer',
                padding: '4px 8px',
                marginBottom: -1,
              }}
            >
              WANTED ({wantedCount})
            </button>
            <button
              type="button"
              onClick={() => setTab('missing')}
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: '0.42rem',
                letterSpacing: '0.1em',
                color: tab === 'missing' ? 'var(--accent)' : 'rgba(255,255,255,0.3)',
                background: 'none',
                border: 'none',
                borderBottom: tab === 'missing' ? '1px solid var(--accent)' : '1px solid transparent',
                cursor: 'pointer',
                padding: '4px 8px',
                marginBottom: -1,
              }}
            >
              <Eye size={8} style={{ display: 'inline', marginRight: 3 }} />
              MISSING ({missingCount})
            </button>
          </div>

          {/* Filters */}
          <div className="px-3 mb-2 flex gap-1.5 flex-wrap">
            {/* Search */}
            <div className="flex items-center gap-1 flex-1 min-w-0"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3, padding: '3px 6px' }}>
              <Search size={9} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, location…"
                style={{
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'var(--font-data)',
                  fontSize: '0.5rem',
                  color: 'rgba(255,255,255,0.7)',
                  width: '100%',
                }}
              />
            </div>

            {/* Province */}
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              title="Filter by province"
              aria-label="Filter by province"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 3,
                fontFamily: 'var(--font-data)',
                fontSize: '0.45rem',
                color: 'rgba(255,255,255,0.5)',
                padding: '3px 4px',
                outline: 'none',
              }}
            >
              <option value="">All provinces</option>
              {SA_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Category pills (wanted tab only) */}
          {tab === 'wanted' && categories.length > 0 && (
            <div className="px-3 mb-2 flex gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => setCategory('')}
                style={{
                  fontFamily: 'var(--font-data)',
                  fontSize: '0.38rem',
                  letterSpacing: '0.06em',
                  padding: '2px 5px',
                  borderRadius: 2,
                  background: !category ? 'rgba(220,38,38,0.15)' : 'rgba(255,255,255,0.04)',
                  color: !category ? 'var(--critical)' : 'rgba(255,255,255,0.3)',
                  border: `1px solid ${!category ? 'rgba(220,38,38,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  cursor: 'pointer',
                }}
              >
                ALL
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat === category ? '' : cat)}
                  style={{
                    fontFamily: 'var(--font-data)',
                    fontSize: '0.38rem',
                    letterSpacing: '0.06em',
                    padding: '2px 5px',
                    borderRadius: 2,
                    background: cat === category ? (CATEGORY_COLORS[cat] ?? 'var(--critical)') + '22' : 'rgba(255,255,255,0.04)',
                    color: cat === category ? (CATEGORY_COLORS[cat] ?? 'var(--critical)') : 'rgba(255,255,255,0.3)',
                    border: `1px solid ${cat === category ? (CATEGORY_COLORS[cat] ?? 'var(--critical)') + '44' : 'rgba(255,255,255,0.08)'}`,
                    cursor: 'pointer',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Person list */}
          {filtered.length === 0 ? (
            <div className="px-3 py-6 text-center">
              {wantedPersons.length === 0 ? (
                <div>
                  <p style={{ fontFamily: 'var(--font-data)', fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)' }}>
                    No data — enable the Wanted layer or check backend
                  </p>
                  <p style={{ fontFamily: 'var(--font-data)', fontSize: '0.45rem', color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>
                    Run: python backend/scripts/scrape_wanted.py
                  </p>
                </div>
              ) : (
                <p style={{ fontFamily: 'var(--font-data)', fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)' }}>
                  No matches for current filters
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-0">
              {filtered.map((person, i) => (
                <div key={person.id ?? person.scrape_key ?? i}>
                  <PersonCard
                    person={person}
                    onShare={() => shareCard(person)}
                  />
                  {i < filtered.length - 1 && (
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.03)', marginLeft: 12, marginRight: 12 }} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Footer: source */}
          <div className="px-3 pt-2">
            <p style={{ fontFamily: 'var(--font-data)', fontSize: '0.42rem', color: 'rgba(255,255,255,0.2)' }}>
              Source: saps.gov.za · Scraped daily 08:00 SAST
              {wantedLastUpdated && (
                <> · {formatDistanceToNow(new Date(wantedLastUpdated), { addSuffix: true })}</>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
