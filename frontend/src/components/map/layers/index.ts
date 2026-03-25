import type { Aircraft, Vessel, Incident, NewsArticle, Municipality, GHSRecord, CensusRecord, HungerRecord } from '@/types'

export function buildAircraftGeoJSON(
  aircraft: Aircraft[],
): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: aircraft.map((a) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [a.lng, a.lat],
      },
      properties: {
        icao24: a.icao24,
        callsign: a.callsign ?? '',
        altitude_m: a.altitude_m,
        velocity_ms: a.velocity_ms,
        heading: a.heading ?? 0,
        aircraft_type: a.aircraft_type ?? '',
        registration: a.registration ?? '',
        on_ground: a.on_ground,
      },
    })),
  }
}

export function buildShipsGeoJSON(ships: Vessel[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: ships.map((v) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [v.lng, v.lat],
      },
      properties: {
        mmsi: v.mmsi,
        name: v.name ?? '',
        speed_kts: v.speed_kts,
        heading: v.heading ?? 0,
        vessel_type: v.vessel_type ?? '',
        flag: v.flag ?? '',
        destination: v.destination ?? '',
      },
    })),
  }
}

export function buildProtestsGeoJSON(
  incidents: Incident[],
): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: incidents.map((i) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [i.lng, i.lat],
      },
      properties: {
        id: i.id,
        title: i.title,
        date: i.date,
        description: i.description ?? '',
        category: i.category ?? '',
        municipality: i.municipality ?? '',
      },
    })),
  }
}

export function buildNewsGeoJSON(
  articles: NewsArticle[],
): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: articles
      .filter((a) => a.lat != null && a.lng != null)
      .map((a) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [a.lng, a.lat],
        },
        properties: {
          id: a.id,
          title: a.title,
          url: a.url,
          source: a.source ?? '',
          published_at: a.published_at,
          sentiment: a.sentiment ?? 0,
          summary: a.summary ?? '',
        },
      })),
  }
}

export function buildPainGeoJSON(
  municipalities: Municipality[],
): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: municipalities.map((m) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [m.lng, m.lat],
      },
      properties: {
        id: m.id,
        name: m.name,
        province: m.province,
        pain_score: m.pain_score,
        audit_score: m.audit_score,
        unemployment_rate: m.unemployment_rate,
        loadshedding_days: m.loadshedding_days,
        water_shortage: m.water_shortage,
        blue_green_fail: m.blue_green_fail,
      },
    })),
  }
}

// GHSRecord and CensusRecord are provincial aggregates without lat/lng.
// They are used for choropleth styling, not point rendering.
export function buildGHSGeoJSON(_records: GHSRecord[]): GeoJSON.FeatureCollection {
  return { type: 'FeatureCollection', features: [] }
}

export function buildCensusGeoJSON(_records: CensusRecord[]): GeoJSON.FeatureCollection {
  return { type: 'FeatureCollection', features: [] }
}

export function buildHungerGeoJSON(records: HungerRecord[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: records
      .filter((r) => r.lat != null && r.lng != null)
      .map((r) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [r.lng, r.lat],
        },
        properties: {
          municipality: r.municipality,
          province: r.province,
          food_insecure_pct: r.food_insecure_pct,
        },
      })),
  }
}
