'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { CyberButton } from '@/components/ui/CyberButton'
import { BACKEND_URL } from '@/lib/constants'

const REPORT_TYPES = [
  'Service Delivery',
  'Infrastructure',
  'Safety',
  'Loadshedding',
  'Water',
  'Road',
  'Other',
]

export default function ReportModal() {
  const reportOpen = useStore((s) => s.reportOpen)
  const reportCoords = useStore((s) => s.reportCoords)
  const setReportOpen = useStore((s) => s.setReportOpen)
  const setReportCoords = useStore((s) => s.setReportCoords)

  const [type, setType] = useState('Service Delivery')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const autoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function close() {
    setReportOpen(false)
    setReportCoords(null)
    setType('Service Delivery')
    setDescription('')
    setLocation('')
    setFile(null)
    setSubmitting(false)
    setSubmitted(false)
    setError('')
    if (autoCloseRef.current) clearTimeout(autoCloseRef.current)
  }

  useEffect(() => {
    return () => {
      if (autoCloseRef.current) clearTimeout(autoCloseRef.current)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const body = {
        type,
        description,
        lat: reportCoords?.lat ?? undefined,
        lng: reportCoords?.lng ?? undefined,
        location: !reportCoords ? location : undefined,
      }

      const res = await fetch(`${BACKEND_URL}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        throw new Error(`Server error ${res.status}`)
      }

      setSubmitting(false)
      setSubmitted(true)
      autoCloseRef.current = setTimeout(() => close(), 2500)
    } catch (err) {
      setSubmitting(false)
      setError(err instanceof Error ? err.message : 'Failed to submit report. Please try again.')
    }
  }

  return (
    <AnimatePresence>
      {reportOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="max-w-md w-full rounded-xl overflow-hidden"
            style={{
              background: 'rgba(13,18,32,0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(14,165,233,0.2)',
            }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: 'rgba(14,165,233,0.1)' }}
            >
              <span className="font-orbitron text-[10px] tracking-widest uppercase text-[var(--accent)]">
                SUBMIT REPORT
              </span>
              <button
                onClick={close}
                className="text-[var(--t-meta)] hover:text-[var(--accent)] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4">
              {submitted ? (
                <div className="py-6 text-center">
                  <p className="text-[var(--normal)] text-sm font-fira leading-relaxed">
                    ✓ Report submitted. Thank you for contributing to LoudWatch ZA.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  {/* Type */}
                  <div>
                    <label className="block text-[9px] font-orbitron text-[var(--t-label)] uppercase tracking-wider mb-1">
                      Report Type
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full bg-[var(--bg-2)] border border-[var(--accent)]/15 text-[var(--t-value)] text-sm rounded px-2 py-1.5 outline-none focus:border-[var(--accent)]/40"
                    >
                      {REPORT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Coords / Location */}
                  <div>
                    <label className="block text-[9px] font-orbitron text-[var(--t-label)] uppercase tracking-wider mb-1">
                      Location
                    </label>
                    {reportCoords ? (
                      <div
                        className="flex items-center gap-2 px-2 py-1.5 rounded border text-sm font-fira"
                        style={{
                          background: '#0d1220',
                          borderColor: 'rgba(14,165,233,0.15)',
                          color: 'var(--t-value)',
                        }}
                      >
                        <span>📍</span>
                        <span>
                          {reportCoords.lat.toFixed(4)}, {reportCoords.lng.toFixed(4)}
                        </span>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Enter location or address..."
                        className="w-full bg-[var(--bg-2)] border border-[var(--accent)]/15 text-[var(--t-value)] text-sm rounded px-2 py-1.5 placeholder-[var(--t-meta)] outline-none focus:border-[var(--accent)]/40"
                      />
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-[9px] font-orbitron text-[var(--t-label)] uppercase tracking-wider mb-1">
                      Description
                    </label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the issue in detail..."
                      className="w-full bg-[var(--bg-2)] border border-[var(--accent)]/15 text-[var(--t-value)] text-sm rounded p-2 placeholder-[var(--t-meta)] outline-none focus:border-[var(--accent)]/40 resize-none font-inter"
                      required
                    />
                  </div>

                  {/* Photo upload */}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                    <label
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 w-full border border-dashed border-[var(--accent)]/20 rounded px-3 py-2 text-[10px] text-[var(--t-meta)] hover:border-[var(--accent)]/40 hover:text-[var(--t-label)] cursor-pointer transition-colors font-fira"
                    >
                      📷 Attach photo (optional)
                    </label>
                    {file && (
                      <p className="text-[var(--normal)] text-xs font-fira mt-1 truncate">{file.name}</p>
                    )}
                  </div>

                  {error && (
                    <p className="text-[var(--critical)] text-xs font-fira">{error}</p>
                  )}

                  <CyberButton
                    type="submit"
                    variant="primary"
                    className="w-full"
                    loading={submitting}
                    disabled={!description.trim()}
                  >
                    SUBMIT REPORT
                  </CyberButton>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
