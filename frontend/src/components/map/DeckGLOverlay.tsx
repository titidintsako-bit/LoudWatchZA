'use client'

/**
 * DeckGLOverlay
 * Attaches a deck.gl MapboxOverlay (compatible with MapLibre GL v4) to the map.
 * Renders ArcLayer (protest→city, border→city, dam→city) and
 * ScatterplotLayer (animated bubbles for protests + pain index).
 *
 * Mounts via a custom event 'loudwatch:mapReady' that fires from MapLibreMap
 * after the style has loaded, passing the map instance.
 */

import { useEffect, useRef } from 'react'
import type { Incident, Municipality, Dam } from '@/types'
import type { BorderPost } from '@/types'

// Major SA city centroids for arc targets
const CITIES = [
  { name: 'Johannesburg', lat: -26.2041, lng: 28.0473 },
  { name: 'Cape Town',    lat: -33.9249, lng: 18.4241 },
  { name: 'Durban',       lat: -29.8587, lng: 31.0218 },
  { name: 'Port Elizabeth', lat: -33.9608, lng: 25.6022 },
  { name: 'Pretoria',    lat: -25.7479, lng: 28.2293 },
  { name: 'Bloemfontein', lat: -29.0852, lng: 26.1596 },
]

function nearestCity(lat: number, lng: number) {
  return CITIES.reduce((best, city) => {
    const d = Math.hypot(city.lat - lat, city.lng - lng)
    const bd = Math.hypot(best.lat - lat, best.lng - lng)
    return d < bd ? city : best
  }, CITIES[0])
}

interface Props {
  protests: Incident[]
  municipalities: Municipality[]
  dams: Dam[]
  borderPosts: BorderPost[]
  layerVisible: boolean
}

export default function DeckGLOverlay({ protests, municipalities, dams, borderPosts, layerVisible }: Props) {
  const overlayRef = useRef<unknown>(null)
  const mapRef = useRef<unknown>(null)

  // Build arc data
  function buildArcs() {
    const arcs: Array<{ source: [number, number]; target: [number, number]; width: number }> = []

    // Protests → nearest city
    protests.slice(0, 60).forEach((p) => {
      const city = nearestCity(p.lat, p.lng)
      arcs.push({ source: [p.lng, p.lat], target: [city.lng, city.lat], width: 1 })
    })

    // Border posts → nearest city
    borderPosts.forEach((b) => {
      const city = nearestCity(b.lat, b.lng)
      arcs.push({ source: [b.lng, b.lat], target: [city.lng, city.lat], width: 1.5 })
    })

    // Dams → nearest city (supply arcs)
    dams.slice(0, 20).forEach((d) => {
      if (!d.lat || !d.lng) return
      const city = nearestCity(d.lat, d.lng)
      arcs.push({ source: [d.lng, d.lat], target: [city.lng, city.lat], width: 0.8 })
    })

    return arcs
  }

  // Build scatter data
  function buildScatter() {
    return [
      // Protests — radius by fatalities
      ...protests.map((p) => ({
        position: [p.lng, p.lat] as [number, number],
        radius: (p.fatalities ?? 0) * 500 + 2000,
        color: [255, 23, 68, 80] as [number, number, number, number],
      })),
      // Pain municipalities — radius by pain_score
      ...municipalities.slice(0, 80).map((m) => ({
        position: [m.lng ?? 0, m.lat ?? 0] as [number, number],
        radius: (m.pain_score ?? 0) * 3000,
        color: [0, 240, 255, 40] as [number, number, number, number],
      })),
    ].filter((d) => d.position[0] !== 0 && d.position[1] !== 0)
  }

  async function updateLayers() {
    const overlay = overlayRef.current as { setProps?: (p: unknown) => void } | null
    if (!overlay?.setProps) return

    const { ArcLayer, ScatterplotLayer } = await import('@deck.gl/layers')

    const arcs = buildArcs()
    const scatter = buildScatter()

    overlay.setProps({
      layers: layerVisible ? [
        new ArcLayer({
          id: 'arc-layer',
          data: arcs,
          getSourcePosition: (d: { source: [number, number] }) => d.source,
          getTargetPosition: (d: { target: [number, number] }) => d.target,
          getSourceColor: [0, 240, 255, 90],
          getTargetColor: [0, 255, 157, 90],
          getWidth: (d: { width: number }) => d.width,
          opacity: 0.35,
          transitions: { opacity: 800 },
        }),
        new ScatterplotLayer({
          id: 'scatter-layer',
          data: scatter,
          getPosition: (d: { position: [number, number] }) => d.position,
          getRadius: (d: { radius: number }) => d.radius,
          getFillColor: (d: { color: [number, number, number, number] }) => d.color,
          radiusUnits: 'meters',
          opacity: 1,
          transitions: { opacity: 800 },
        }),
      ] : [],
    })
  }

  // Attach to map when it becomes ready
  useEffect(() => {
    const handler = async (e: CustomEvent) => {
      const map = e.detail
      if (!map) return
      mapRef.current = map

      const { MapboxOverlay } = await import('@deck.gl/mapbox')
      const overlay = new MapboxOverlay({ interleaved: false, layers: [] })
      overlayRef.current = overlay
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(map as any).addControl(overlay)
      updateLayers()
    }
    window.addEventListener('loudwatch:mapReady', handler as unknown as EventListener)
    return () => window.removeEventListener('loudwatch:mapReady', handler as unknown as EventListener)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-render layers when data or visibility changes
  useEffect(() => {
    updateLayers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protests, municipalities, dams, borderPosts, layerVisible])

  return null // purely imperative — no DOM output
}
