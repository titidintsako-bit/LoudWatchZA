'use client'

import { useState, useEffect } from 'react'

export type DeviceType = 'mobile' | 'tablet' | 'desktop'

const MOBILE_MAX  = 768
const TABLET_MAX  = 1024

function getDevice(w: number): DeviceType {
  if (w < MOBILE_MAX)  return 'mobile'
  if (w < TABLET_MAX)  return 'tablet'
  return 'desktop'
}

export function useDeviceType(): DeviceType {
  const [device, setDevice] = useState<DeviceType>('desktop')

  useEffect(() => {
    setDevice(getDevice(window.innerWidth))

    const mq1 = window.matchMedia(`(max-width: ${MOBILE_MAX - 1}px)`)
    const mq2 = window.matchMedia(`(max-width: ${TABLET_MAX - 1}px)`)

    const handler = () => setDevice(getDevice(window.innerWidth))
    mq1.addEventListener('change', handler)
    mq2.addEventListener('change', handler)
    return () => {
      mq1.removeEventListener('change', handler)
      mq2.removeEventListener('change', handler)
    }
  }, [])

  return device
}
