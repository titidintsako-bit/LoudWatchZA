'use client'

import { useStore } from '@/store/useStore'
import { LANGUAGES } from '@/lib/i18n'
import type { Language } from '@/lib/i18n'

export default function LanguageSelector() {
  const language = useStore((s) => s.language)
  const setLanguage = useStore((s) => s.setLanguage)

  return (
    <div
      className="hidden sm:flex items-center rounded overflow-hidden"
      style={{ border: '1px solid var(--border)' }}
    >
      {LANGUAGES.map((lang, i) => (
        <button
          key={lang.code}
          type="button"
          title={lang.name}
          onClick={() => setLanguage(lang.code as Language)}
          style={{
            background: language === lang.code ? 'rgba(0,212,255,0.12)' : 'transparent',
            color: language === lang.code ? 'var(--accent)' : 'var(--text-muted)',
            border: 'none',
            borderRight: i < LANGUAGES.length - 1 ? '1px solid var(--border)' : 'none',
            padding: '2px 6px',
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}
