'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Check } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { CyberButton } from '@/components/ui/CyberButton'
import { NeonBadge } from '@/components/ui/NeonBadge'

const FREE_FEATURES = [
  'Full interactive map',
  'Loadshedding status',
  'Pain Index',
  'SASSA payment dates',
  'News feeds',
  'Municipal contacts',
]

const SUPPORTER_FEATURES = [
  'Everything in Free',
  'Email alerts',
  'Dam level alerts',
  'Data exports',
  'Supporter badge',
]

export default function SupporterModal() {
  const supporterOpen = useStore((s) => s.supporterOpen)
  const setSupporterOpen = useStore((s) => s.setSupporterOpen)

  function close() {
    setSupporterOpen(false)
  }

  function handleSubscribe() {
    window.open('https://payfast.io', '_blank')
  }

  function handleDonate() {
    window.open('https://payfast.io', '_blank')
  }

  return (
    <AnimatePresence>
      {supporterOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="max-w-md w-full rounded-xl overflow-hidden"
            style={{
              background: 'rgba(13,18,32,0.97)',
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
                SUPPORT LOUDWATCH ZA
              </span>
              <button
                onClick={close}
                className="text-[var(--t-meta)] hover:text-[var(--accent)] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Mission blurb */}
              <p className="text-sm text-[var(--t-label)] leading-relaxed">
                LoudWatch ZA monitors South Africa&apos;s service delivery, protests, water
                levels, and governance data — free for all citizens. Your support keeps us
                independent and running 24/7.
              </p>

              {/* Plan cards */}
              <div className="grid grid-cols-2 gap-3">
                {/* Free card */}
                <div
                  className="rounded-lg p-3 border"
                  style={{
                    borderColor: 'rgba(14,165,233,0.15)',
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div className="mb-2">
                    <NeonBadge variant="cyan">FREE FOREVER</NeonBadge>
                  </div>
                  <ul className="space-y-1.5 mt-2">
                    {FREE_FEATURES.map((feature) => (
                      <li key={feature} className="flex items-start gap-1.5">
                        <Check className="w-3 h-3 text-[var(--accent)] flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-[var(--t-value)]">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Supporter card */}
                <div
                  className="rounded-lg p-3 border"
                  style={{
                    borderColor: 'rgba(22,163,74,0.4)',
                    background: 'rgba(22,163,74,0.03)',
                  }}
                >
                  <div className="mb-2">
                    <NeonBadge variant="green">SUPPORTER — R49/mo</NeonBadge>
                  </div>
                  <ul className="space-y-1.5 mt-2 mb-3">
                    {SUPPORTER_FEATURES.map((feature) => (
                      <li key={feature} className="flex items-start gap-1.5">
                        <Check className="w-3 h-3 text-[var(--normal)] flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-[var(--t-value)]">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <CyberButton
                    variant="success"
                    className="w-full"
                    onClick={handleSubscribe}
                  >
                    SUBSCRIBE — R49/MONTH
                  </CyberButton>
                  <p className="text-[9px] text-[var(--t-meta)] text-center mt-1 font-fira">
                    or R490/year
                  </p>
                </div>
              </div>

              {/* One-time donation */}
              <div
                className="pt-3 border-t space-y-2"
                style={{ borderColor: 'rgba(14,165,233,0.08)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--t-label)]">Buy us a server ☕</span>
                  <CyberButton variant="ghost" size="sm" onClick={handleDonate}>
                    Donate
                  </CyberButton>
                </div>
                <p className="text-[8px] text-[var(--t-meta)] font-fira">
                  All payments via PayFast — South Africa&apos;s trusted gateway
                </p>
              </div>

              {/* Sign in link */}
              <div className="text-center">
                <button
                  className="text-[10px] text-[var(--accent)] hover:underline transition-colors font-fira"
                  onClick={close}
                >
                  Already a supporter? Sign in →
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
