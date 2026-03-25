'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { CyberButton } from '@/components/ui/CyberButton'
import { Switch } from '@/components/ui/switch'

export default function SettingsModal() {
  const settingsOpen = useStore((s) => s.settingsOpen)
  const setSettingsOpen = useStore((s) => s.setSettingsOpen)
  const minimal = useStore((s) => s.minimal)
  const setMinimal = useStore((s) => s.setMinimal)
  const setSupporterOpen = useStore((s) => s.setSupporterOpen)

  const [scanlines, setScanlines] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)

  function close() {
    setSettingsOpen(false)
  }

  function handleScanlines(checked: boolean) {
    setScanlines(checked)
    if (typeof document !== 'undefined') {
      if (checked) {
        document.body.classList.add('scanlines-on')
      } else {
        document.body.classList.remove('scanlines-on')
      }
    }
  }

  function handleReduceMotion(checked: boolean) {
    setReduceMotion(checked)
    if (typeof document !== 'undefined') {
      if (checked) {
        document.documentElement.classList.add('motion-reduce')
      } else {
        document.documentElement.classList.remove('motion-reduce')
      }
    }
  }

  function handleBecomeSupporter() {
    setSupporterOpen(true)
    close()
  }

  return (
    <AnimatePresence>
      {settingsOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="max-w-sm w-full rounded-xl overflow-hidden"
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
                SETTINGS
              </span>
              <button
                onClick={close}
                className="text-[var(--t-meta)] hover:text-[var(--accent)] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* DISPLAY section */}
              <div>
                <p className="text-[9px] font-orbitron text-[var(--t-meta)] uppercase tracking-widest mb-2">
                  DISPLAY
                </p>
                <div className="space-y-0">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-[var(--t-value)]">Minimal Mode</span>
                    <Switch
                      checked={minimal}
                      onCheckedChange={(checked) => setMinimal(checked)}
                    />
                  </div>
                  <div
                    className="w-full h-px"
                    style={{ background: 'rgba(14,165,233,0.06)' }}
                  />
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-[var(--t-value)]">Scanlines Effect</span>
                    <Switch
                      checked={scanlines}
                      onCheckedChange={handleScanlines}
                    />
                  </div>
                  <div
                    className="w-full h-px"
                    style={{ background: 'rgba(14,165,233,0.06)' }}
                  />
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-[var(--t-value)]">Reduce Motion</span>
                    <Switch
                      checked={reduceMotion}
                      onCheckedChange={handleReduceMotion}
                    />
                  </div>
                </div>
              </div>

              <div
                className="w-full h-px"
                style={{ background: 'rgba(14,165,233,0.08)' }}
              />

              {/* ABOUT section */}
              <div>
                <p className="text-[9px] font-orbitron text-[var(--t-meta)] uppercase tracking-widest mb-2">
                  ABOUT
                </p>
                <p className="font-orbitron text-[var(--accent)] text-sm mb-1">LoudWatch ZA v2.0</p>
                <p className="text-[9px] text-[var(--t-label)] font-fira mb-2 leading-relaxed">
                  Sources: Stats SA · AGSA · DWS · ACLED · OpenSky
                </p>
                <a
                  href="mailto:hello@loudwatch.co.za"
                  className="text-[9px] text-[var(--t-meta)] hover:text-[var(--t-label)] transition-colors font-fira"
                >
                  hello@loudwatch.co.za
                </a>
              </div>

              <div
                className="w-full h-px"
                style={{ background: 'rgba(14,165,233,0.08)' }}
              />

              {/* SUPPORT section */}
              <div>
                <p className="text-[9px] font-orbitron text-[var(--t-meta)] uppercase tracking-widest mb-2">
                  SUPPORT
                </p>
                <CyberButton
                  variant="primary"
                  className="w-full"
                  onClick={handleBecomeSupporter}
                >
                  Become a Supporter
                </CyberButton>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
