import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0a0e17',
        'bg-secondary': '#0d1220',
        cyan: '#00f0ff',
        green: '#00ff9d',
        red: '#ff1744',
        amber: '#ff9100',
        purple: '#7b2fff',
      },
      fontFamily: {
        orbitron: ['var(--font-orbitron)', 'sans-serif'],
        'fira-code': ['var(--font-fira-code)', 'monospace'],
      },
      animation: {
        'pulse-red': 'pulse-red 1.5s ease-in-out infinite',
        blink: 'blink 1s step-end infinite',
        scanline: 'scanline 4s linear infinite',
      },
      keyframes: {
        'pulse-red': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px #ff174466' },
          '50%': { opacity: '0.6', boxShadow: '0 0 40px #ff1744aa' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
