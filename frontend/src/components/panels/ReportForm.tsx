'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, CheckCircle, AlertCircle, MapPin, Loader2 } from 'lucide-react'

interface Props {
  coords: { lat: number; lng: number } | null
  onClose: () => void
}

type IssueType =
  | 'Water Outage'
  | 'Power Outage'
  | 'Pothole'
  | 'Protest'
  | 'Crime'
  | 'Vandalism'
  | 'Other'

const ISSUE_TYPES: IssueType[] = [
  'Water Outage',
  'Power Outage',
  'Pothole',
  'Protest',
  'Crime',
  'Vandalism',
  'Other',
]

const ISSUE_COLORS: Record<IssueType, string> = {
  'Water Outage': 'var(--accent)',
  'Power Outage': 'var(--warning)',
  'Pothole': '#ffeb3b',
  'Protest': 'var(--critical)',
  'Crime': '#9c27b0',
  'Vandalism': 'var(--warning)',
  'Other': 'rgba(255,255,255,0.5)',
}

interface FormState {
  issueType: IssueType
  municipality: string
  description: string
  contact: string
}

type SubmitState = 'idle' | 'loading' | 'success' | 'error'

function InputLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        fontFamily: 'var(--font-data)',
        fontSize: '0.5rem',
        color: 'var(--accent)',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        display: 'block',
        marginBottom: '5px',
      }}
    >
      {children}
    </label>
  )
}

const sharedInputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  padding: '8px 11px',
  color: 'rgba(255,255,255,0.85)',
  fontFamily: 'var(--font-data)',
  fontSize: '0.68rem',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
}

const focusStyle: React.CSSProperties = {
  borderColor: 'rgba(14,165,233,0.5)',
  boxShadow: '0 0 0 2px rgba(14,165,233,0.1)',
}

export default function ReportForm({ coords, onClose }: Props) {
  const [form, setForm] = useState<FormState>({
    issueType: 'Other',
    municipality: '',
    description: '',
    contact: '',
  })
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [validationError, setValidationError] = useState('')
  const overlayRef = useRef<HTMLDivElement>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (overlayRef.current && e.target === overlayRef.current) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  // Escape to close
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }
  }, [])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (name === 'description' && validationError) {
      if (value.trim().length >= 20) setValidationError('')
    }
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    Object.assign(e.target.style, focusStyle)
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    e.target.style.borderColor = 'rgba(255,255,255,0.1)'
    e.target.style.boxShadow = 'none'
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (form.description.trim().length < 20) {
      setValidationError('Description must be at least 20 characters.')
      return
    }

    setSubmitState('loading')
    setErrorMsg('')

    try {
      const payload = {
        issue_type: form.issueType,
        municipality: form.municipality.trim() || null,
        description: form.description.trim(),
        contact: form.contact.trim() || null,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      }

      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData?.detail ?? `Submission failed (${res.status})`)
      }

      setSubmitState('success')
      setForm({ issueType: 'Other', municipality: '', description: '', contact: '' })

      closeTimerRef.current = setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err: unknown) {
      setSubmitState('error')
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error. Please try again.')
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative w-full max-w-md mx-4 rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(10,14,23,0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(14,165,233,0.1)',
        }}
      >
        {/* Top accent */}
        <div
          className="h-0.5 w-full"
          style={{ background: 'linear-gradient(90deg, transparent, var(--accent), var(--normal), transparent)' }}
        />

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div>
            <p
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: '0.5rem',
                color: 'var(--accent)',
                letterSpacing: '0.2em',
                marginBottom: '3px',
              }}
            >
              LOUDWATCH ZA
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: '0.9rem',
                color: '#fff',
                fontWeight: 700,
                letterSpacing: '0.05em',
              }}
            >
              Submit Report
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = 'rgba(220,38,38,0.15)'
              el.style.borderColor = 'rgba(220,38,38,0.4)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = 'rgba(255,255,255,0.05)'
              el.style.borderColor = 'rgba(255,255,255,0.1)'
            }}
          >
            <X size={14} style={{ color: 'rgba(255,255,255,0.6)' }} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <AnimatePresence mode="wait">
            {submitState === 'success' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-8 gap-3"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15, delay: 0.1 }}
                >
                  <CheckCircle size={48} style={{ color: 'var(--normal)' }} />
                </motion.div>
                <p
                  style={{
                    fontFamily: 'var(--font-data)',
                    fontSize: '0.8rem',
                    color: 'var(--normal)',
                    textAlign: 'center',
                    letterSpacing: '0.05em',
                    textShadow: '0 0 12px rgba(22,163,74,0.4)',
                  }}
                >
                  Report submitted. Thank you.
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-data)',
                    fontSize: '0.6rem',
                    color: 'rgba(255,255,255,0.3)',
                  }}
                >
                  Closing in 2 seconds...
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="flex flex-col gap-4"
              >
                {/* Coords display */}
                {coords && (
                  <div
                    className="flex items-center gap-2 rounded-lg px-3 py-2"
                    style={{
                      background: 'rgba(14,165,233,0.05)',
                      border: '1px solid rgba(14,165,233,0.15)',
                    }}
                  >
                    <MapPin size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    <span
                      style={{
                        fontFamily: 'var(--font-data)',
                        fontSize: '0.62rem',
                        color: 'rgba(14,165,233,0.8)',
                      }}
                    >
                      {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-data)',
                        fontSize: '0.42rem',
                        color: 'rgba(14,165,233,0.5)',
                        marginLeft: 'auto',
                        letterSpacing: '0.08em',
                      }}
                    >
                      AUTO-DETECTED
                    </span>
                  </div>
                )}

                {/* Issue Type */}
                <div>
                  <InputLabel>Issue Type *</InputLabel>
                  <div className="relative">
                    <select
                      name="issueType"
                      value={form.issueType}
                      onChange={handleChange}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                      required
                      style={{
                        ...sharedInputStyle,
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        cursor: 'pointer',
                        color: ISSUE_COLORS[form.issueType],
                      }}
                    >
                      {ISSUE_TYPES.map(t => (
                        <option
                          key={t}
                          value={t}
                          style={{
                            background: '#0a0e17',
                            color: ISSUE_COLORS[t],
                          }}
                        >
                          {t}
                        </option>
                      ))}
                    </select>
                    <div
                      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'rgba(255,255,255,0.3)' }}
                    >
                      ▾
                    </div>
                  </div>
                </div>

                {/* Municipality */}
                <div>
                  <InputLabel>Municipality (optional)</InputLabel>
                  <input
                    type="text"
                    name="municipality"
                    value={form.municipality}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder="e.g. City of Cape Town"
                    style={sharedInputStyle}
                  />
                </div>

                {/* Description */}
                <div>
                  <InputLabel>Description *</InputLabel>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder="Describe the incident in detail (min. 20 characters)..."
                    rows={4}
                    required
                    style={{
                      ...sharedInputStyle,
                      resize: 'vertical',
                      minHeight: '88px',
                    }}
                  />
                  <div className="flex justify-between mt-1">
                    {validationError ? (
                      <span
                        style={{
                          fontFamily: 'var(--font-data)',
                          fontSize: '0.55rem',
                          color: 'var(--critical)',
                        }}
                      >
                        {validationError}
                      </span>
                    ) : (
                      <span />
                    )}
                    <span
                      style={{
                        fontFamily: 'var(--font-data)',
                        fontSize: '0.55rem',
                        color:
                          form.description.trim().length < 20
                            ? 'rgba(255,255,255,0.3)'
                            : 'var(--normal)',
                      }}
                    >
                      {form.description.trim().length}/20
                    </span>
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <InputLabel>Contact (optional)</InputLabel>
                  <input
                    type="text"
                    name="contact"
                    value={form.contact}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder="Email or phone number"
                    style={sharedInputStyle}
                  />
                </div>

                {/* Error display */}
                {submitState === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5"
                    style={{
                      background: 'rgba(220,38,38,0.08)',
                      border: '1px solid rgba(220,38,38,0.25)',
                    }}
                  >
                    <AlertCircle size={13} style={{ color: 'var(--critical)', flexShrink: 0 }} />
                    <span
                      style={{
                        fontFamily: 'var(--font-data)',
                        fontSize: '0.62rem',
                        color: 'var(--critical)',
                      }}
                    >
                      {errorMsg}
                    </span>
                  </motion.div>
                )}

                {/* Submit button */}
                <motion.button
                  type="submit"
                  disabled={submitState === 'loading'}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3 transition-all"
                  style={{
                    background: submitState === 'loading'
                      ? 'rgba(14,165,233,0.1)'
                      : 'linear-gradient(135deg, rgba(14,165,233,0.15), rgba(22,163,74,0.1))',
                    border: '1px solid rgba(14,165,233,0.4)',
                    cursor: submitState === 'loading' ? 'not-allowed' : 'pointer',
                  }}
                  whileHover={
                    submitState !== 'loading'
                      ? {
                          boxShadow: '0 0 20px rgba(14,165,233,0.25)',
                          borderColor: 'rgba(14,165,233,0.7)',
                        }
                      : {}
                  }
                  whileTap={submitState !== 'loading' ? { scale: 0.98 } : {}}
                >
                  {submitState === 'loading' ? (
                    <Loader2 size={14} className="animate-spin" style={{ color: 'var(--accent)' }} />
                  ) : (
                    <Send size={14} style={{ color: 'var(--accent)' }} />
                  )}
                  <span
                    style={{
                      fontFamily: 'var(--font-data)',
                      fontSize: '0.65rem',
                      color: submitState === 'loading' ? 'rgba(14,165,233,0.5)' : 'var(--accent)',
                      letterSpacing: '0.1em',
                      textShadow: submitState !== 'loading' ? '0 0 8px rgba(14,165,233,0.4)' : 'none',
                    }}
                  >
                    {submitState === 'loading' ? 'SUBMITTING...' : 'SUBMIT REPORT'}
                  </span>
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
