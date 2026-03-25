'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { Map as MapLibreMap, GeoJSONSource } from 'maplibre-gl'
import type {
  Aircraft,
  Vessel,
  Incident,
  NewsArticle,
  Municipality,
  LoadsheddingStatus,
  LayerState,
  GHSRecord,
  CensusRecord,
  HungerRecord,
} from '@/types'
import { SA_CENTER, SA_ZOOM, BASEMAP_URL, ALL_MILITARY_BASES, ALL_GOVT_BUILDINGS, BORDER_POSTS, UNHCR_OFFICES, ALL_CONSERVATION_SITES } from '@/lib/constants'
import type { WantedPerson } from '@/types'
import {
  buildAircraftGeoJSON,
  buildShipsGeoJSON,
  buildProtestsGeoJSON,
  buildNewsGeoJSON,
  buildHungerGeoJSON,
} from './layers'
import { roundFeatureCoords } from '@/lib/geo-utils'
import { cullToViewport, boundsFromMap } from '@/lib/viewport-cull'
import { animateMarkers, cancelAnimations } from '@/lib/interpolate'

export interface RightClickContext {
  lat: number
  lng: number
  x: number
  y: number
  feature?: { type: string; props: Record<string, unknown> }
}

interface MapLibreMapProps {
  layers: LayerState
  onMapClick?: (lat: number, lng: number) => void
  onMapRightClick?: (ctx: RightClickContext) => void
  onFeatureClick: (feature: GeoJSON.Feature, type: string) => void
  aircraft: Aircraft[]
  ships: Vessel[]
  protests: Incident[]
  news: NewsArticle[]
  painMunicipalities: Municipality[]
  loadshedding: LoadsheddingStatus | null
  showMinimal: boolean
  dams?: import('@/types').Dam[]
  ghsData?: GHSRecord[]
  censusData?: CensusRecord[]
  hungerData?: HungerRecord[]
  wantedPersons?: WantedPerson[]
  gpsJammingPoints?: { lat: number; lng: number; level: number }[]
  nasaDate?: string
}

const EMPTY_FC: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
}

function buildGHSCirclesGeoJSON(records: GHSRecord[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: records
      .filter((r) => (r as GHSRecord & { lat?: number }).lat != null && (r as GHSRecord & { lng?: number }).lng != null)
      .map((r) => {
        const rec = r as GHSRecord & { lat: number; lng: number }
        return {
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [rec.lng, rec.lat],
          },
          properties: {
            municipality: r.municipality,
            province: r.province,
            service_fail_score: r.service_fail_score ?? 0,
            pct_no_electricity: r.pct_no_electricity ?? 0,
            pct_no_piped_water: r.pct_no_piped_water ?? 0,
            pct_no_flush_toilet: r.pct_no_flush_toilet ?? 0,
            pct_food_insecure: r.pct_food_insecure ?? 0,
          },
        }
      }),
  }
}

function buildCensusCirclesGeoJSON(records: CensusRecord[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: records
      .filter((r) => (r as CensusRecord & { lat?: number }).lat != null && (r as CensusRecord & { lng?: number }).lng != null)
      .map((r) => {
        const rec = r as CensusRecord & { lat: number; lng: number }
        return {
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [rec.lng, rec.lat],
          },
          properties: {
            municipality: r.municipality,
            province: r.province,
            pop_total: r.pop_total ?? 0,
            pct_no_electricity: r.pct_no_electricity ?? 0,
            pct_no_piped_water: r.pct_no_piped_water ?? 0,
            pct_no_sanitation: r.pct_no_sanitation ?? 0,
            median_income: r.median_income ?? 0,
          },
        }
      }),
  }
}

function buildGpsJammingGeoJSON(
  points: { lat: number; lng: number; level: number }[],
): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: points
      .filter((p) => p.level > 0)
      .map((p) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
        properties: { level: p.level },
      })),
  }
}

function buildMunicipalitiesGeoJSON(municipalities: import('@/types').Municipality[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: municipalities
      .filter((m) => m.lat != null && m.lng != null)
      .map((m) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [m.lng, m.lat] },
        properties: {
          name:             m.name,
          province:         m.province,
          pain_score:       m.pain_score ?? 0,
          audit_score:      m.audit_score ?? 0,
          unemployment_rate: m.unemployment_rate ?? 0,
        },
      })),
  }
}

export default function MapLibreMapComponent({
  layers,
  onMapClick,
  onMapRightClick,
  onFeatureClick,
  aircraft,
  ships,
  protests,
  news,
  loadshedding,
  showMinimal,
  painMunicipalities = [],
  ghsData = [],
  censusData = [],
  hungerData = [],
  wantedPersons = [],
  gpsJammingPoints = [],
  nasaDate,
}: MapLibreMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const initializedRef = useRef(false)
  const [mapError, setMapError] = useState(false)

  // Data refs — always hold the latest values so map.on('load') can seed
  // sources with data that arrived while the style was still loading
  const aircraftRef          = useRef(aircraft)
  const shipsRef             = useRef(ships)
  const protestsRef          = useRef(protests)
  const newsRef              = useRef(news)
  const wantedRef            = useRef(wantedPersons)
  const ghsRef               = useRef(ghsData)
  const censusRef            = useRef(censusData)
  const hungerRef            = useRef(hungerData)
  const painMunicipalitiesRef = useRef(painMunicipalities)
  const gpsJammingRef         = useRef(gpsJammingPoints)

  useEffect(() => { aircraftRef.current           = aircraft },            [aircraft])
  useEffect(() => { shipsRef.current              = ships },               [ships])
  useEffect(() => { protestsRef.current           = protests },            [protests])
  useEffect(() => { newsRef.current               = news },                [news])
  useEffect(() => { wantedRef.current             = wantedPersons },       [wantedPersons])
  useEffect(() => { ghsRef.current                = ghsData },             [ghsData])
  useEffect(() => { censusRef.current             = censusData },          [censusData])
  useEffect(() => { hungerRef.current             = hungerData },          [hungerData])
  useEffect(() => { painMunicipalitiesRef.current = painMunicipalities },  [painMunicipalities])
  useEffect(() => { gpsJammingRef.current         = gpsJammingPoints },    [gpsJammingPoints])

  // Keep stable refs for callbacks so closures inside load() don't go stale
  const onFeatureClickRef = useRef(onFeatureClick)
  useEffect(() => { onFeatureClickRef.current = onFeatureClick }, [onFeatureClick])
  const onMapClickRef = useRef(onMapClick)
  useEffect(() => { onMapClickRef.current = onMapClick }, [onMapClick])
  const onMapRightClickRef = useRef(onMapRightClick)
  useEffect(() => { onMapRightClickRef.current = onMapRightClick }, [onMapRightClick])

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return

    let map: MapLibreMap

    const init = async () => {
      try {
        const maplibre = await import('maplibre-gl')
        // @ts-expect-error — maplibre CSS dynamic import has no type declarations
        await import('maplibre-gl/dist/maplibre-gl.css')

        // WebGL check
        const testCanvas = document.createElement('canvas')
        const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl')
        if (!gl) {
          console.error('[LoudWatch] WebGL not supported — map cannot render')
          setMapError(true)
          return
        }

        if (!containerRef.current) {
          console.error('[LoudWatch] Map container ref is null at init time')
          setMapError(true)
          return
        }

        map = new maplibre.Map({
          container: containerRef.current,
          style: BASEMAP_URL,
          center: [SA_CENTER.lng, SA_CENTER.lat],
          zoom: SA_ZOOM,
          attributionControl: false,
          logoPosition: 'bottom-left',
        })

        map.on('error', (e) => {
          console.error('[LoudWatch] MapLibre error:', e)
        })

        mapRef.current = map
        initializedRef.current = true

      map.addControl(new maplibre.NavigationControl(), 'top-right')

      map.on('load', () => {
        // Notify DeckGLOverlay that the map is ready
        window.dispatchEvent(new CustomEvent('loudwatch:mapReady', { detail: map }))

        // ── Static GeoJSON sources ──
        map.addSource('sa-provinces', {
          type: 'geojson',
          data: '/geojson/sa-provinces.geojson',
        })

        map.addSource('sa-municipalities', {
          type: 'geojson',
          data: '/geojson/sa-municipalities.geojson',
        })

        // ── Pain municipalities point source (live data from Supabase) ──
        // The static sa-municipalities.geojson has no pain_score properties,
        // so we use a separate point source built from Municipality lat/lng.
        map.addSource('pain-municipalities-source', { type: 'geojson', data: EMPTY_FC })
        map.addLayer({
          id: 'pain-municipalities-layer',
          type: 'circle',
          source: 'pain-municipalities-source',
          paint: {
            'circle-radius': [
              'interpolate', ['linear'],
              ['coalesce', ['get', 'pain_score'], 0],
              0, 4, 3, 10, 5, 18,
            ],
            'circle-color': [
              'interpolate', ['linear'],
              ['coalesce', ['get', 'pain_score'], 0],
              0, '#16a34a',
              1, '#aaff00',
              2, '#ffeb3b',
              3, '#d97706',
              4, '#dc2626',
              5, '#9c27b0',
            ],
            'circle-opacity': 0.70,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#000000',
          },
          layout: { visibility: layers.painIndex ? 'visible' : 'none' },
        })

        // ── Dynamic point sources ──
        map.addSource('aircraft-source', { type: 'geojson', data: EMPTY_FC })
        map.addSource('ships-source', { type: 'geojson', data: EMPTY_FC })

        // Clustered sources — protests, news, wanted
        map.addSource('protests-source', {
          type: 'geojson', data: EMPTY_FC,
          cluster: true, clusterMaxZoom: 9, clusterRadius: 50,
        })
        map.addSource('news-source', {
          type: 'geojson', data: EMPTY_FC,
          cluster: true, clusterMaxZoom: 10, clusterRadius: 40,
        })
        map.addSource('wanted-source', {
          type: 'geojson', data: EMPTY_FC,
          cluster: true, clusterMaxZoom: 11, clusterRadius: 35,
        })

        // Stats SA point sources
        map.addSource('ghs-circles-source', { type: 'geojson', data: EMPTY_FC })
        map.addSource('census-circles-source', { type: 'geojson', data: EMPTY_FC })
        map.addSource('hunger-source', { type: 'geojson', data: EMPTY_FC })

        // ── 1. Province outline (always visible) ──
        map.addLayer({
          id: 'provinces-outline',
          type: 'line',
          source: 'sa-provinces',
          paint: {
            'line-color': '#0ea5e9',
            'line-width': 1,
            'line-opacity': 0.35,
          },
        })

        // ── 2. Loadshedding fill ──
        map.addLayer({
          id: 'loadshedding-fill',
          type: 'fill',
          source: 'sa-provinces',
          paint: {
            'fill-color': '#dc2626',
            'fill-opacity': 0,
          },
          layout: {
            visibility: layers.loadshedding ? 'visible' : 'none',
          },
        })

        // ── 3. Pain index choropleth ──
        map.addLayer({
          id: 'pain-index-fill',
          type: 'fill',
          source: 'sa-municipalities',
          paint: {
            'fill-color': [
              'interpolate',
              ['linear'],
              ['coalesce', ['get', 'pain_score'], 0],
              0, '#16a34a',
              1, '#aaff00',
              2, '#ffeb3b',
              3, '#d97706',
              4, '#dc2626',
              5, '#9c27b0',
            ],
            'fill-opacity': 0.45,
          },
          layout: {
            visibility: layers.painIndex ? 'visible' : 'none',
          },
        })

        map.addLayer({
          id: 'pain-index-outline',
          type: 'line',
          source: 'sa-municipalities',
          paint: {
            'line-color': '#ffffff',
            'line-width': 0.3,
            'line-opacity': 0.15,
          },
          layout: {
            visibility: layers.painIndex ? 'visible' : 'none',
          },
        })

        // ── 4. Protests — clusters + unclustered ──
        map.addLayer({
          id: 'protests-clusters',
          type: 'circle',
          source: 'protests-source',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': ['step', ['get', 'point_count'], '#dc2626', 10, '#ff5500', 30, '#9c27b0'],
            'circle-radius': ['step', ['get', 'point_count'], 18, 10, 24, 30, 30],
            'circle-opacity': 0.85,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
          layout: { visibility: layers.protests ? 'visible' : 'none' },
        })
        map.addLayer({
          id: 'protests-cluster-count',
          type: 'symbol',
          source: 'protests-source',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-size': 11,
            'text-allow-overlap': true,
            visibility: layers.protests ? 'visible' : 'none',
          },
          paint: { 'text-color': '#ffffff' },
        })
        map.addLayer({
          id: 'protests-layer',
          type: 'circle',
          source: 'protests-source',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-radius': 8,
            'circle-color': '#dc2626',
            'circle-opacity': 0.85,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
          layout: { visibility: layers.protests ? 'visible' : 'none' },
        })
        map.addLayer({
          id: 'protests-pulse',
          type: 'circle',
          source: 'protests-source',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-radius': 16,
            'circle-color': '#dc2626',
            'circle-opacity': 0.25,
            'circle-stroke-width': 0,
          },
          layout: { visibility: layers.protests ? 'visible' : 'none' },
        })

        // ── 5. News pins — clusters + unclustered ──
        map.addLayer({
          id: 'news-clusters',
          type: 'circle',
          source: 'news-source',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': ['step', ['get', 'point_count'], '#d97706', 10, '#0ea5e9', 50, '#7b2fff'],
            'circle-radius': ['step', ['get', 'point_count'], 16, 10, 22, 50, 28],
            'circle-opacity': 0.80,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff',
          },
          layout: { visibility: layers.news ? 'visible' : 'none' },
        })
        map.addLayer({
          id: 'news-cluster-count',
          type: 'symbol',
          source: 'news-source',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-size': 10,
            'text-allow-overlap': true,
            visibility: layers.news ? 'visible' : 'none',
          },
          paint: { 'text-color': '#ffffff' },
        })
        map.addLayer({
          id: 'news-layer',
          type: 'circle',
          source: 'news-source',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-radius': 6,
            'circle-color': [
              'interpolate', ['linear'],
              ['coalesce', ['get', 'sentiment'], 0],
              -1, '#dc2626', 0, '#d97706', 1, '#16a34a',
            ],
            'circle-opacity': 0.8,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff',
          },
          layout: { visibility: layers.news ? 'visible' : 'none' },
        })

        // ── 6. Aircraft symbols ──
        map.addLayer({
          id: 'aircraft-layer',
          type: 'symbol',
          source: 'aircraft-source',
          layout: {
            'text-field': '✈',
            'text-size': 16,
            'text-rotate': ['get', 'heading'],
            'text-rotation-alignment': 'map',
            'text-allow-overlap': true,
            'text-ignore-placement': true,
            visibility: layers.aircraft ? 'visible' : 'none',
          },
          paint: {
            'text-color': '#0ea5e9',
            'text-halo-color': '#0a0e17',
            'text-halo-width': 1,
          },
        })

        // ── 7. Ships symbols ──
        map.addLayer({
          id: 'ships-layer',
          type: 'symbol',
          source: 'ships-source',
          layout: {
            'text-field': '⛵',
            'text-size': 14,
            'text-rotate': ['get', 'heading'],
            'text-rotation-alignment': 'map',
            'text-allow-overlap': true,
            'text-ignore-placement': true,
            visibility: layers.ships ? 'visible' : 'none',
          },
          paint: {
            'text-color': '#7b2fff',
            'text-halo-color': '#0a0e17',
            'text-halo-width': 1,
          },
        })

        // ── 8. SERVICE ACCESS circles (GHS service_fail_score) ──
        map.addLayer({
          id: 'service-access-layer',
          type: 'circle',
          source: 'ghs-circles-source',
          paint: {
            'circle-radius': [
              'interpolate', ['linear'],
              ['coalesce', ['get', 'service_fail_score'], 0],
              0, 8,
              1, 30,
            ],
            'circle-color': [
              'interpolate', ['linear'],
              ['coalesce', ['get', 'service_fail_score'], 0],
              0,   '#16a34a',
              0.2, '#ffeb3b',
              0.4, '#d97706',
              0.6, '#dc2626',
              1.0, '#7b2fff',
            ],
            'circle-opacity': 0.72,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff',
          },
          layout: {
            visibility: layers.serviceAccess ? 'visible' : 'none',
          },
        })

        // ── 9. NO ELECTRICITY circles ──
        map.addLayer({
          id: 'no-electricity-layer',
          type: 'circle',
          source: 'census-circles-source',
          paint: {
            'circle-radius': [
              'interpolate', ['linear'],
              ['coalesce', ['get', 'pct_no_electricity'], 0],
              0, 6,
              60, 28,
            ],
            'circle-color': [
              'interpolate', ['linear'],
              ['coalesce', ['get', 'pct_no_electricity'], 0],
              0,  '#ffffff',
              10, '#ffeb3b',
              25, '#d97706',
              40, '#dc2626',
            ],
            'circle-opacity': 0.75,
            'circle-stroke-width': 1,
            'circle-stroke-color': 'rgba(255,145,0,0.5)',
          },
          layout: {
            visibility: layers.noElectricity ? 'visible' : 'none',
          },
        })

        // ── 10. NO PIPED WATER circles ──
        map.addLayer({
          id: 'no-piped-water-layer',
          type: 'circle',
          source: 'census-circles-source',
          paint: {
            'circle-radius': [
              'interpolate', ['linear'],
              ['coalesce', ['get', 'pct_no_piped_water'], 0],
              0, 6,
              60, 28,
            ],
            'circle-color': [
              'interpolate', ['linear'],
              ['coalesce', ['get', 'pct_no_piped_water'], 0],
              0,  '#ffffff',
              10, '#b3e5fc',
              25, '#0288d1',
              40, '#01579b',
            ],
            'circle-opacity': 0.75,
            'circle-stroke-width': 1,
            'circle-stroke-color': 'rgba(14,165,233,0.4)',
          },
          layout: {
            visibility: layers.noPipedWater ? 'visible' : 'none',
          },
        })

        // ── 11. NO SANITATION circles ──
        map.addLayer({
          id: 'no-sanitation-layer',
          type: 'circle',
          source: 'census-circles-source',
          paint: {
            'circle-radius': [
              'interpolate', ['linear'],
              ['coalesce', ['get', 'pct_no_sanitation'], 0],
              0, 6,
              60, 28,
            ],
            'circle-color': [
              'interpolate', ['linear'],
              ['coalesce', ['get', 'pct_no_sanitation'], 0],
              0,  '#ffffff',
              10, '#ef9a9a',
              25, '#f44336',
              40, '#b71c1c',
            ],
            'circle-opacity': 0.75,
            'circle-stroke-width': 1,
            'circle-stroke-color': 'rgba(220,38,38,0.4)',
          },
          layout: {
            visibility: layers.noSanitation ? 'visible' : 'none',
          },
        })

        // ── 12. HUNGER INDEX circles ──
        map.addLayer({
          id: 'hunger-layer',
          type: 'circle',
          source: 'hunger-source',
          paint: {
            'circle-radius': [
              'interpolate', ['linear'],
              ['coalesce', ['get', 'food_insecure_pct'], 0],
              0, 6,
              60, 24,
            ],
            'circle-color': '#d97706',
            'circle-opacity': 0.75,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff',
          },
          layout: {
            visibility: layers.hungerIndex ? 'visible' : 'none',
          },
        })

        // ── 13. WANTED / MISSING PERSONS — clusters + unclustered ──
        map.addLayer({
          id: 'wanted-clusters',
          type: 'circle',
          source: 'wanted-source',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': ['step', ['get', 'point_count'], '#dc2626', 5, '#ff5500', 15, '#9c27b0'],
            'circle-radius': ['step', ['get', 'point_count'], 16, 5, 22, 15, 28],
            'circle-opacity': 0.9,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
          layout: { visibility: layers.wanted ? 'visible' : 'none' },
        })
        map.addLayer({
          id: 'wanted-cluster-count',
          type: 'symbol',
          source: 'wanted-source',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-size': 10,
            'text-allow-overlap': true,
            visibility: layers.wanted ? 'visible' : 'none',
          },
          paint: { 'text-color': '#ffffff' },
        })
        map.addLayer({
          id: 'wanted-layer',
          type: 'circle',
          source: 'wanted-source',
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'is_missing'], false]],
          paint: {
            'circle-radius': 8,
            'circle-color': '#dc2626',
            'circle-opacity': 0.9,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
          layout: { visibility: layers.wanted ? 'visible' : 'none' },
        })
        map.addLayer({
          id: 'missing-layer',
          type: 'circle',
          source: 'wanted-source',
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'is_missing'], true]],
          paint: {
            'circle-radius': 7,
            'circle-color': '#0ea5e9',
            'circle-opacity': 0.85,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
          layout: { visibility: layers.wanted ? 'visible' : 'none' },
        })
        map.addLayer({
          id: 'wanted-pulse',
          type: 'circle',
          source: 'wanted-source',
          filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'is_missing'], false]],
          paint: {
            'circle-radius': 16,
            'circle-color': '#dc2626',
            'circle-opacity': 0.2,
          },
          layout: { visibility: layers.wanted ? 'visible' : 'none' },
        })

        // ── 14. MILITARY BASES (static GeoJSON) ──
        const militaryFC: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: ALL_MILITARY_BASES.map((b) => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [b.lng, b.lat] },
            properties: { id: b.id, name: b.name, branch: b.branch, description: b.description },
          })),
        }
        map.addSource('military-source', { type: 'geojson', data: militaryFC })
        map.addLayer({
          id: 'military-layer',
          type: 'symbol',
          source: 'military-source',
          layout: {
            'text-field': ['case', ['==', ['get', 'branch'], 'Navy'], '⚓', '✈'],
            'text-size': 14,
            'text-allow-overlap': true,
            'text-ignore-placement': true,
            visibility: layers.military ? 'visible' : 'none',
          },
          paint: {
            'text-color': '#dc2626',
            'text-halo-color': '#0a0e17',
            'text-halo-width': 1.5,
          },
        })
        map.addLayer({
          id: 'military-label',
          type: 'symbol',
          source: 'military-source',
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 9,
            'text-anchor': 'top',
            'text-offset': [0, 1],
            'text-allow-overlap': false,
            visibility: layers.military ? 'visible' : 'none',
          },
          paint: {
            'text-color': 'rgba(220,38,38,0.7)',
            'text-halo-color': '#0a0e17',
            'text-halo-width': 1,
          },
        })

        // ── 15. GOVT BUILDINGS (static GeoJSON) ──
        const govtFC: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: ALL_GOVT_BUILDINGS.map((b) => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [b.lng, b.lat] },
            properties: { id: b.id, name: b.name, type: b.type, province: b.province, occupant: b.occupant ?? '' },
          })),
        }
        map.addSource('govt-hq-source', { type: 'geojson', data: govtFC })
        map.addLayer({
          id: 'govt-hq-layer',
          type: 'circle',
          source: 'govt-hq-source',
          paint: {
            'circle-radius': ['case', ['==', ['get', 'type'], 'national'], 8, 6],
            'circle-color': ['case', ['==', ['get', 'type'], 'national'], '#ffeb3b', '#ffd54f'],
            'circle-opacity': 0.9,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#0a0e17',
          },
          layout: { visibility: layers.govtHQ ? 'visible' : 'none' },
        })
        map.addLayer({
          id: 'govt-hq-label',
          type: 'symbol',
          source: 'govt-hq-source',
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 8,
            'text-anchor': 'top',
            'text-offset': [0, 1],
            'text-allow-overlap': false,
            visibility: layers.govtHQ ? 'visible' : 'none',
          },
          paint: {
            'text-color': 'rgba(255,235,59,0.7)',
            'text-halo-color': '#0a0e17',
            'text-halo-width': 1,
          },
        })

        // ── 15. CONSERVATION (static GeoJSON) ──
        const conservationFC: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: ALL_CONSERVATION_SITES.map((p) => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
            properties: { id: p.id, name: p.name, type: p.type, province: p.province, area_km2: p.area_km2 ?? 0 },
          })),
        }
        map.addSource('conservation-source', { type: 'geojson', data: conservationFC })
        map.addLayer({
          id: 'conservation-layer',
          type: 'circle',
          source: 'conservation-source',
          paint: {
            'circle-radius': [
              'interpolate', ['linear'],
              ['coalesce', ['get', 'area_km2'], 0],
              0, 5, 500, 8, 5000, 14, 20000, 20,
            ],
            'circle-color': ['case', ['==', ['get', 'type'], 'marine_protected'], '#0288d1', '#16a34a'],
            'circle-opacity': 0.65,
            'circle-stroke-width': 1,
            'circle-stroke-color': ['case', ['==', ['get', 'type'], 'marine_protected'], '#0ea5e9', '#16a34a'],
          },
          layout: { visibility: layers.conservation ? 'visible' : 'none' },
        })
        map.addLayer({
          id: 'conservation-label',
          type: 'symbol',
          source: 'conservation-source',
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 8,
            'text-anchor': 'top',
            'text-offset': [0, 1],
            'text-allow-overlap': false,
            visibility: layers.conservation ? 'visible' : 'none',
          },
          paint: {
            'text-color': 'rgba(22,163,74,0.7)',
            'text-halo-color': '#0a0e17',
            'text-halo-width': 1,
          },
        })

        // ── 16. BORDER POSTS + UNHCR (static GeoJSON) ──
        const borderFeatures: GeoJSON.Feature[] = [
          ...BORDER_POSTS.map((b) => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [b.lng, b.lat] },
            properties: { id: b.id, name: b.name, kind: 'border', country: b.country, status: b.status },
          })),
          ...UNHCR_OFFICES.map((u) => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [u.lng, u.lat] },
            properties: { id: u.id, name: u.name, kind: 'unhcr', country: 'South Africa', status: 'open' },
          })),
        ]
        const borderFC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: borderFeatures }
        map.addSource('border-source', { type: 'geojson', data: borderFC })
        map.addLayer({
          id: 'border-layer',
          type: 'circle',
          source: 'border-source',
          paint: {
            'circle-radius': ['case', ['==', ['get', 'kind'], 'unhcr'], 6, 7],
            'circle-color': ['case', ['==', ['get', 'kind'], 'unhcr'], '#0ea5e9', '#d97706'],
            'circle-opacity': 0.85,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#0a0e17',
          },
          layout: { visibility: layers.borderMigration ? 'visible' : 'none' },
        })
        map.addLayer({
          id: 'border-label',
          type: 'symbol',
          source: 'border-source',
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 8,
            'text-anchor': 'top',
            'text-offset': [0, 1],
            'text-allow-overlap': false,
            visibility: layers.borderMigration ? 'visible' : 'none',
          },
          paint: {
            'text-color': 'rgba(255,145,0,0.7)',
            'text-halo-color': '#0a0e17',
            'text-halo-width': 1,
          },
        })

        // ── 17. GPS JAMMING heatmap ──
        map.addSource('gps-jamming-source', { type: 'geojson', data: EMPTY_FC })
        map.addLayer({
          id: 'gps-jamming-layer',
          type: 'heatmap',
          source: 'gps-jamming-source',
          paint: {
            'heatmap-weight': ['interpolate', ['linear'], ['get', 'level'], 0, 0, 3, 1],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 4, 0.6, 9, 1.5],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 4, 18, 9, 36],
            'heatmap-opacity': 0.72,
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0,   'rgba(0,0,0,0)',
              0.2, 'rgba(255,235,59,0.5)',
              0.5, 'rgba(255,85,0,0.7)',
              0.8, 'rgba(220,38,38,0.85)',
              1,   'rgba(156,39,176,0.95)',
            ],
          },
          layout: { visibility: layers.gpsJamming ? 'visible' : 'none' },
        })

        // ── 18. NASA GIBS MODIS Terra raster ──
        const nasaTileDate = nasaDate ?? (() => {
          const d = new Date(); d.setDate(d.getDate() - 1)
          return d.toISOString().split('T')[0]
        })()
        map.addSource('nasa-gibs-source', {
          type: 'raster',
          tiles: [
            `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${nasaTileDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
          ],
          tileSize: 256,
          attribution: 'NASA GIBS · MODIS Terra',
          minzoom: 0,
          maxzoom: 9,
        })
        map.addLayer(
          {
            id: 'nasa-gibs-layer',
            type: 'raster',
            source: 'nasa-gibs-source',
            paint: { 'raster-opacity': 0.80 },
            layout: { visibility: layers.nasaSatellite ? 'visible' : 'none' },
          },
          // Insert below all data layers so labels/icons render on top
          'provinces-outline',
        )

        // ── Seed sources with any data that arrived during style load ──
        const seedSource = (id: string, data: GeoJSON.FeatureCollection) => {
          const src = map.getSource(id) as GeoJSONSource | undefined
          if (src && data.features.length > 0) src.setData(data)
        }
        seedSource('pain-municipalities-source', buildMunicipalitiesGeoJSON(painMunicipalitiesRef.current))
        // Seed GPS jamming
        if (gpsJammingRef.current.length > 0) {
          const jammingSrc = map.getSource('gps-jamming-source') as GeoJSONSource | undefined
          if (jammingSrc) jammingSrc.setData(buildGpsJammingGeoJSON(gpsJammingRef.current))
        }
        seedSource('aircraft-source',      buildAircraftGeoJSON(aircraftRef.current))
        seedSource('ships-source',         buildShipsGeoJSON(shipsRef.current))
        seedSource('protests-source',      buildProtestsGeoJSON(protestsRef.current))
        seedSource('news-source',          buildNewsGeoJSON(newsRef.current))
        seedSource('ghs-circles-source',   buildGHSCirclesGeoJSON(ghsRef.current))
        seedSource('census-circles-source',buildCensusCirclesGeoJSON(censusRef.current))
        seedSource('hunger-source',        buildHungerGeoJSON(hungerRef.current))
        if (wantedRef.current.length > 0) {
          const wantedSrc = map.getSource('wanted-source') as GeoJSONSource | undefined
          if (wantedSrc) {
            wantedSrc.setData({
              type: 'FeatureCollection',
              features: wantedRef.current
                .filter((p) => p.lat != null && p.lng != null)
                .map((p) => ({
                  type: 'Feature' as const,
                  geometry: { type: 'Point' as const, coordinates: [p.lng!, p.lat!] },
                  properties: {
                    id: p.id, full_name: p.full_name,
                    crime_category: p.crime_category ?? '',
                    charges: p.charges ?? '',
                    last_known_location: p.last_known_location ?? '',
                    province: p.province ?? '',
                    case_number: p.case_number ?? '',
                    is_missing: p.is_missing,
                  },
                })),
            })
          }
        }

        // ── Click handlers ──

        // Cluster layers — click zooms in to expand
        const clusterLayers = [
          'protests-clusters', 'news-clusters', 'wanted-clusters',
        ] as const
        const clusterSourceMap: Record<string, string> = {
          'protests-clusters': 'protests-source',
          'news-clusters': 'news-source',
          'wanted-clusters': 'wanted-source',
        }
        clusterLayers.forEach((layerId) => {
          map.on('click', layerId, (e) => {
            const features = map.queryRenderedFeatures(e.point, { layers: [layerId] })
            if (!features.length) return
            const clusterId = features[0].properties?.cluster_id as number | undefined
            if (clusterId == null) return
            const src = map.getSource(clusterSourceMap[layerId]) as GeoJSONSource & {
              getClusterExpansionZoom: (id: number, cb: (err: Error | null, zoom: number) => void) => void
            }
            src.getClusterExpansionZoom(clusterId, (err, zoom) => {
              if (err) return
              const coords = (features[0].geometry as GeoJSON.Point).coordinates as [number, number]
              map.easeTo({ center: coords, zoom: zoom + 0.5, duration: 400 })
            })
          })
          map.on('mouseenter', layerId, () => { map.getCanvas().style.cursor = 'pointer' })
          map.on('mouseleave', layerId, () => { map.getCanvas().style.cursor = '' })
        })

        // Individual feature layers — click opens dossier
        const clickableLayers = [
          'protests-layer',
          'news-layer',
          'aircraft-layer',
          'ships-layer',
          'hunger-layer',
          'service-access-layer',
          'no-electricity-layer',
          'no-piped-water-layer',
          'no-sanitation-layer',
          'wanted-layer',
          'missing-layer',
          'military-layer',
          'govt-hq-layer',
          'conservation-layer',
          'border-layer',
        ]
        const layerTypeMap: Record<string, string> = {
          'protests-layer': 'protest',
          'news-layer': 'news',
          'aircraft-layer': 'aircraft',
          'ships-layer': 'ship',
          'hunger-layer': 'hunger',
          'service-access-layer': 'serviceAccess',
          'no-electricity-layer': 'noElectricity',
          'no-piped-water-layer': 'noPipedWater',
          'no-sanitation-layer': 'noSanitation',
          'wanted-layer': 'wanted',
          'missing-layer': 'missing',
          'military-layer': 'military',
          'govt-hq-layer': 'govtHQ',
          'conservation-layer': 'conservation',
          'border-layer': 'border',
        }

        clickableLayers.forEach((layerId) => {
          map.on('click', layerId, (e) => {
            if (e.features && e.features.length > 0) {
              onFeatureClickRef.current(
                e.features[0] as unknown as GeoJSON.Feature,
                layerTypeMap[layerId],
              )
              e.preventDefault()
            }
          })

          map.on('mouseenter', layerId, () => {
            map.getCanvas().style.cursor = 'pointer'
          })
          map.on('mouseleave', layerId, () => {
            map.getCanvas().style.cursor = ''
          })
        })

        // Right-click context menu — query nearest feature + emit full context
        map.on('contextmenu', (e) => {
          e.preventDefault()
          const allQueryLayers = [
            'protests-layer', 'news-layer', 'aircraft-layer', 'ships-layer',
            'wanted-layer', 'missing-layer', 'military-layer', 'govt-hq-layer',
            'conservation-layer', 'border-layer', 'hunger-layer',
            'service-access-layer', 'pain-municipalities-layer',
          ]
          const hits = map.queryRenderedFeatures(e.point, { layers: allQueryLayers })
          let feature: RightClickContext['feature'] | undefined
          if (hits.length > 0) {
            const hit = hits[0]
            // Map layer id → semantic type
            const layerToType: Record<string, string> = {
              'protests-layer': 'protest', 'news-layer': 'news',
              'aircraft-layer': 'aircraft', 'ships-layer': 'ship',
              'wanted-layer': 'wanted', 'missing-layer': 'missing',
              'military-layer': 'military', 'govt-hq-layer': 'govtHQ',
              'conservation-layer': 'conservation', 'border-layer': 'border',
              'hunger-layer': 'hunger', 'service-access-layer': 'serviceAccess',
              'pain-municipalities-layer': 'municipality',
            }
            feature = {
              type: layerToType[hit.layer.id] ?? hit.layer.id,
              props: (hit.properties ?? {}) as Record<string, unknown>,
            }
          }
          onMapRightClickRef.current?.({
            lat: e.lngLat.lat,
            lng: e.lngLat.lng,
            x: e.point.x,
            y: e.point.y,
            feature,
          })
        })
      })
      } catch (err) {
        console.error('[LoudWatch] Map init failed:', err)
        setMapError(true)
      }
    }

    init()

    return () => {
      cancelAnimations()
      if (map) map.remove()
      mapRef.current = null
      initializedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Debounce helper ──
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const setSourceDebounced = useCallback(
    (sourceId: string, data: GeoJSON.FeatureCollection, delayMs: number) => {
      clearTimeout(debounceTimers.current[sourceId])
      debounceTimers.current[sourceId] = setTimeout(() => {
        const map = mapRef.current
        if (!map || !map.isStyleLoaded()) return
        const src = map.getSource(sourceId) as GeoJSONSource | undefined
        if (src) src.setData(roundFeatureCoords(data))
      }, delayMs)
    },
    [],
  )

  // ── Previous aircraft/ships positions for interpolation ──
  const prevAircraftPositions = useRef<Map<string, { lat: number; lng: number }>>(new Map())
  const prevShipsPositions    = useRef<Map<string, { lat: number; lng: number }>>(new Map())

  // Update aircraft source — fast cycle (15s), with position interpolation
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    // Build prev-position map from current aircraft
    const prevMap = prevAircraftPositions.current
    const newPrev = new Map<string, { lat: number; lng: number }>()
    aircraft.forEach((a) => newPrev.set(a.icao24, { lat: a.lat, lng: a.lng }))

    animateMarkers(
      aircraft.map((a) => ({ id: a.icao24, lat: a.lat, lng: a.lng })),
      prevMap,
      14_000,
      (interpolated) => {
        const map2 = mapRef.current
        if (!map2 || !map2.isStyleLoaded()) return
        const src = map2.getSource('aircraft-source') as GeoJSONSource | undefined
        if (!src) return
        const fc = buildAircraftGeoJSON(
          aircraft.map((a) => {
            const pos = interpolated.get(a.icao24)
            return pos ? { ...a, lat: pos.lat, lng: pos.lng } : a
          }),
        )
        src.setData(roundFeatureCoords(fc))
      },
    )
    prevAircraftPositions.current = newPrev
  }, [aircraft])

  // Update ships source — fast cycle (30s), with position interpolation
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    const prevMap = prevShipsPositions.current
    const newPrev = new Map<string, { lat: number; lng: number }>()
    ships.forEach((v) => newPrev.set(v.mmsi, { lat: v.lat, lng: v.lng }))

    animateMarkers(
      ships.map((v) => ({ id: v.mmsi, lat: v.lat, lng: v.lng })),
      prevMap,
      29_000,
      (interpolated) => {
        const map2 = mapRef.current
        if (!map2 || !map2.isStyleLoaded()) return
        const src = map2.getSource('ships-source') as GeoJSONSource | undefined
        if (!src) return
        const fc = buildShipsGeoJSON(
          ships.map((v) => {
            const pos = interpolated.get(v.mmsi)
            return pos ? { ...v, lat: pos.lat, lng: pos.lng } : v
          }),
        )
        src.setData(roundFeatureCoords(fc))
      },
    )
    prevShipsPositions.current = newPrev
  }, [ships])

  // Update protests source — slow cycle (1h), debounced 300ms + viewport cull
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    const bbox = boundsFromMap(map)
    const culled = cullToViewport(buildProtestsGeoJSON(protests), bbox)
    setSourceDebounced('protests-source', culled, 300)
  }, [protests, setSourceDebounced])

  // Update news source — slow cycle (5min), debounced 300ms + viewport cull
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    const bbox = boundsFromMap(map)
    const culled = cullToViewport(buildNewsGeoJSON(news), bbox)
    setSourceDebounced('news-source', culled, 300)
  }, [news, setSourceDebounced])

  // Update GHS circles source — debounced 2000ms (dense layer)
  useEffect(() => {
    setSourceDebounced('ghs-circles-source', buildGHSCirclesGeoJSON(ghsData), 2000)
  }, [ghsData, setSourceDebounced])

  // Update census circles source — debounced 2000ms (dense layer)
  useEffect(() => {
    setSourceDebounced('census-circles-source', buildCensusCirclesGeoJSON(censusData), 2000)
  }, [censusData, setSourceDebounced])

  // Update hunger source — debounced 2000ms (dense layer)
  useEffect(() => {
    setSourceDebounced('hunger-source', buildHungerGeoJSON(hungerData), 2000)
  }, [hungerData, setSourceDebounced])

  // Update pain municipalities source — debounced 300ms
  useEffect(() => {
    setSourceDebounced('pain-municipalities-source', buildMunicipalitiesGeoJSON(painMunicipalities), 300)
  }, [painMunicipalities, setSourceDebounced])

  // Update GPS jamming source — daily data, debounced 500ms
  useEffect(() => {
    setSourceDebounced('gps-jamming-source', buildGpsJammingGeoJSON(gpsJammingPoints), 500)
  }, [gpsJammingPoints, setSourceDebounced])

  // Update NASA tile URL when date changes
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    if (!nasaDate) return
    if (!map.getSource('nasa-gibs-source')) return
    // Replace the raster source with the new date — must remove/re-add layer+source
    const wasVisible = map.getLayoutProperty('nasa-gibs-layer', 'visibility') === 'visible'
    if (map.getLayer('nasa-gibs-layer')) map.removeLayer('nasa-gibs-layer')
    if (map.getSource('nasa-gibs-source')) map.removeSource('nasa-gibs-source')
    map.addSource('nasa-gibs-source', {
      type: 'raster',
      tiles: [
        `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${nasaDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
      ],
      tileSize: 256,
      attribution: 'NASA GIBS · MODIS Terra',
      minzoom: 0, maxzoom: 9,
    })
    map.addLayer(
      { id: 'nasa-gibs-layer', type: 'raster', source: 'nasa-gibs-source',
        paint: { 'raster-opacity': 0.80 },
        layout: { visibility: wasVisible ? 'visible' : 'none' },
      },
      'provinces-outline',
    )
  }, [nasaDate])

  // Update wanted/missing source
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    const source = map.getSource('wanted-source') as GeoJSONSource | undefined
    if (!source) return
    const fc: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: wantedPersons
        .filter((p) => p.lat != null && p.lng != null)
        .map((p) => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [p.lng!, p.lat!] },
          properties: {
            id: p.id,
            full_name: p.full_name,
            crime_category: p.crime_category ?? '',
            charges: p.charges ?? '',
            last_known_location: p.last_known_location ?? '',
            province: p.province ?? '',
            case_number: p.case_number ?? '',
            is_missing: p.is_missing,
          },
        })),
    }
    source.setData(fc)
  }, [wantedPersons])

  // Toggle layer visibility
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    const layerMap: Record<string, boolean> = {
      'loadshedding-fill': layers.loadshedding,
      'pain-index-fill': layers.painIndex,
      'pain-index-outline': layers.painIndex,
      'pain-municipalities-layer': layers.painIndex,
      'protests-clusters': layers.protests,
      'protests-cluster-count': layers.protests,
      'protests-layer': layers.protests,
      'protests-pulse': layers.protests,
      'news-clusters': layers.news,
      'news-cluster-count': layers.news,
      'news-layer': layers.news,
      'aircraft-layer': layers.aircraft,
      'ships-layer': layers.ships,
      'service-access-layer': layers.serviceAccess,
      'no-electricity-layer': layers.noElectricity,
      'no-piped-water-layer': layers.noPipedWater,
      'no-sanitation-layer': layers.noSanitation,
      'hunger-layer': layers.hungerIndex,
      'wanted-clusters': layers.wanted,
      'wanted-cluster-count': layers.wanted,
      'wanted-layer': layers.wanted,
      'missing-layer': layers.wanted,
      'wanted-pulse': layers.wanted,
      'military-layer': layers.military,
      'military-label': layers.military,
      'govt-hq-layer': layers.govtHQ,
      'govt-hq-label': layers.govtHQ,
      'conservation-layer': layers.conservation,
      'conservation-label': layers.conservation,
      'border-layer': layers.borderMigration,
      'border-label': layers.borderMigration,
      'gps-jamming-layer': layers.gpsJamming,
      'nasa-gibs-layer': layers.nasaSatellite,
    }

    Object.entries(layerMap).forEach(([layerId, visible]) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')
      }
    })
  }, [layers])

  // Update loadshedding opacity based on stage
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded() || !loadshedding) return
    if (!map.getLayer('loadshedding-fill')) return

    const stage = loadshedding.stage
    const opacity = stage === 0 ? 0 : Math.min(0.12 + stage * 0.06, 0.55)
    const color =
      stage <= 1 ? '#d97706' : stage <= 3 ? '#ff5500' : '#dc2626'

    map.setPaintProperty('loadshedding-fill', 'fill-color', color)
    map.setPaintProperty('loadshedding-fill', 'fill-opacity', opacity)
  }, [loadshedding])

  // Suppress unused-var warning — showMinimal may be used for future layer filtering
  void showMinimal

  // Listen for projection change events
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const map = mapRef.current
      if (!map) return
      const proj = e.detail as string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const m = map as any
      if (proj === 'globe') {
        m.setProjection?.({ type: 'globe' })
        m.setFog?.({ color: '#0a0e17', 'high-color': '#0ea5e9', 'horizon-blend': 0.1, 'space-color': '#0a0e17', 'star-intensity': 0.15 })
      } else if (proj === '3d') {
        m.setProjection?.({ type: 'mercator' })
        m.setFog?.(null)
        map.easeTo({ pitch: 45, duration: 600 })
      } else {
        m.setProjection?.({ type: 'mercator' })
        m.setFog?.(null)
        map.easeTo({ pitch: 0, duration: 600 })
      }
    }
    window.addEventListener('loudwatch:setProjection', handler as EventListener)
    return () => window.removeEventListener('loudwatch:setProjection', handler as EventListener)
  }, [])

  if (mapError) {
    return (
      <div style={{
        width: '100%', height: '100%', minHeight: 0,
        background: '#000', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#dc2626', letterSpacing: '0.1em' }}>
          MAP LOAD FAILED
        </span>
        <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#4a5568' }}>
          WebGL unavailable or tile fetch failed — check console
        </span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            fontFamily: 'IBM Plex Mono, monospace', fontSize: 9,
            color: '#00e87a', background: 'transparent',
            border: '1px solid rgba(0,232,122,0.3)',
            padding: '4px 12px', cursor: 'pointer', marginTop: 4,
          }}
        >
          ↺ RETRY
        </button>
      </div>
    )
  }

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
      background: '#0a0e17',
    }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
