'use client'

import { useEffect } from 'react'
import { useStore } from '@/store/useStore'

const MOBILE_BP  = 768   // px — collapse both sidebars
const TABLET_BP  = 1100  // px — collapse right sidebar only

/**
 * Automatically collapses sidebars based on viewport width.
 * Also re-opens them when the viewport expands back to desktop size.
 */
export function useResponsiveLayout() {
  const setLeft  = (v: boolean) => useStore.getState().leftSidebarOpen  !== v && useStore.setState({ leftSidebarOpen:  v })
  const setRight = (v: boolean) => useStore.getState().rightSidebarOpen !== v && useStore.setState({ rightSidebarOpen: v })

  useEffect(() => {
    function apply() {
      const w = window.innerWidth
      if (w < MOBILE_BP) {
        setLeft(false)
        setRight(false)
      } else if (w < TABLET_BP) {
        setLeft(true)
        setRight(false)
      } else {
        setLeft(true)
        setRight(true)
      }
    }

    apply() // run immediately on mount

    const mq1 = window.matchMedia(`(max-width: ${MOBILE_BP - 1}px)`)
    const mq2 = window.matchMedia(`(max-width: ${TABLET_BP - 1}px)`)
    mq1.addEventListener('change', apply)
    mq2.addEventListener('change', apply)
    return () => {
      mq1.removeEventListener('change', apply)
      mq2.removeEventListener('change', apply)
    }
  }, [])
}
