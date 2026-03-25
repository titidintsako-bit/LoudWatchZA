'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { X, MapPin, Camera, AlertTriangle, Send, Loader } from 'lucide-react'
import { useStore } from '@/store/useStore'

const CATEGORIES = [
  { id: 'infrastructure', label: 'Infrastructure failure', icon: '⚡' },
  { id: 'crime',          label: 'Crime / safety threat', icon: '🚨' },
  { id: 'protest',        label: 'Protest / civil unrest', icon: '✊' },
  { id: 'corruption',     label: 'Corruption / fraud',    icon: '💰' },
  { id: 'water',          label: 'Water / sanitation',    icon: '💧' },
  { id: 'other',          label: 'Other civic issue',     icon: '📋' },
]

interface IntelResult {
  relevance: number
  credibility: number
  sensitivity: 'low' | 'medium' | 'high'
  municipality: string
  summary: string
  published: boolean
}

export default function CitizenIntelModal() {
  const close = useStore((s) => s.setCitizenIntelOpen)

  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [locationText, setLocationText] = useState('')
  const [anonymous, setAnonymous] = useState(true)
  const [photo, setPhoto] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<IntelResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleGPS() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocationText(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`),
      () => setError('GPS unavailable — enter location manually'),
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!category || description.trim().length < 20) {
      setError('Please select a category and provide at least 20 characters of description.')
      return
    }

    setSubmitting(true)
    setError(null)

    const formData = new FormData()
    formData.append('category', category)
    formData.append('description', description)
    formData.append('location', locationText)
    formData.append('anonymous', String(anonymous))
    if (photo) formData.append('photo', photo)

    try {
      const res = await fetch('/api/citizen-intel', { method: 'POST', body: formData })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-sans)',
    fontSize: 13,
    padding: '8px 10px',
    outline: 'none',
    resize: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    display: 'block',
    marginBottom: 5,
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) close(false) }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: 480,
          maxHeight: '90vh',
          overflow: 'auto',
          margin: '0 16px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              Submit Citizen Intelligence
            </p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Report civic issues. AI-verified before publishing.
            </p>
          </div>
          <button
            type="button"
            onClick={() => close(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex' }}
          >
            <X size={16} />
          </button>
        </div>

        {result ? (
          /* Success state */
          <div style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>
              {result.published ? '✅' : '📋'}
            </div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              {result.published ? 'Intel Published!' : 'Intel Received — Under Review'}
            </p>
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 12, marginBottom: 16, textAlign: 'left' }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{result.summary}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Relevance',    value: `${result.relevance}/100` },
                  { label: 'Credibility',  value: `${result.credibility}/100` },
                  { label: 'Municipality', value: result.municipality },
                ].map((s) => (
                  <div key={s.label}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>{s.label}</p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)' }}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => close(false)}
              style={{ background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-md)', color: 'var(--bg-base)', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, padding: '8px 24px', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Category */}
            <div>
              <label style={labelStyle}>Category *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    style={{
                      background: category === c.id ? 'rgba(0,212,255,0.1)' : 'var(--bg-elevated)',
                      border: `1px solid ${category === c.id ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-md)',
                      color: category === c.id ? 'var(--accent)' : 'var(--text-secondary)',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 11,
                      padding: '6px 8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>{c.icon}</span> {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>Description * (min 20 characters)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you witnessed. Include time, location, and any relevant details."
                rows={4}
                style={inputStyle}
              />
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>
                {description.length} chars
              </p>
            </div>

            {/* Location */}
            <div>
              <label style={labelStyle}>Location</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  placeholder="Address or suburb"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleGPS}
                  title="Use my GPS location"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', padding: '0 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <MapPin size={14} />
                </button>
              </div>
            </div>

            {/* Photo */}
            <div>
              <label style={labelStyle}>Photo (optional)</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{ ...inputStyle, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: photo ? 'var(--text-primary)' : 'var(--text-muted)' }}
              >
                <Camera size={14} /> {photo ? photo.name : 'Attach photo'}
              </button>
            </div>

            {/* Anonymous toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                role="switch"
                aria-checked={anonymous}
                onClick={() => setAnonymous((v) => !v)}
                style={{
                  width: 32,
                  height: 18,
                  borderRadius: 9,
                  background: anonymous ? 'var(--accent)' : 'var(--bg-elevated)',
                  border: `1px solid ${anonymous ? 'var(--accent)' : 'var(--border)'}`,
                  cursor: 'pointer',
                  position: 'relative',
                  flexShrink: 0,
                  transition: 'background 0.2s',
                }}
              >
                <span style={{
                  position: 'absolute',
                  top: 2,
                  left: anonymous ? 14 : 2,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: anonymous ? 'var(--bg-base)' : 'var(--text-muted)',
                  transition: 'left 0.2s',
                }} />
              </button>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-secondary)' }}>
                Submit anonymously
              </span>
            </div>

            {/* Error */}
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(232,54,74,0.08)', border: '1px solid rgba(232,54,74,0.2)', borderRadius: 'var(--radius-md)', padding: '8px 10px' }}>
                <AlertTriangle size={12} style={{ color: 'var(--critical)', flexShrink: 0 }} />
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--critical)' }}>{error}</p>
              </div>
            )}

            {/* Disclaimer */}
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              By submitting you agree to our terms. False reports are deleted. High-credibility intel (score &gt;70) is published to the map and Intel Feed. All submissions are AI-screened.
            </p>

            <button
              type="submit"
              disabled={submitting}
              style={{
                background: submitting ? 'var(--bg-elevated)' : 'var(--accent)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: submitting ? 'var(--text-muted)' : 'var(--bg-base)',
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                fontWeight: 600,
                padding: '10px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'background 0.2s',
              }}
            >
              {submitting ? <><Loader size={14} className="animate-spin" /> Processing…</> : <><Send size={14} /> Submit Intel</>}
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  )
}
