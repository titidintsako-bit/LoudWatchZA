/**
 * Coordinate precision utilities.
 * Rounds to 5 decimal places (~1.1m resolution) — sufficient for all
 * LoudWatch map layers and reduces payload size vs raw float64.
 */

const PRECISION = 5

export function roundCoord(v: number): number {
  const factor = Math.pow(10, PRECISION)
  return Math.round(v * factor) / factor
}

export function roundCoords(coords: [number, number]): [number, number] {
  return [roundCoord(coords[0]), roundCoord(coords[1])]
}

export function roundFeatureCoords(
  fc: GeoJSON.FeatureCollection,
): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: fc.features.map((f) => {
      if (!f.geometry || f.geometry.type !== 'Point') return f
      const [lng, lat] = (f.geometry as GeoJSON.Point).coordinates
      return {
        ...f,
        geometry: {
          type: 'Point' as const,
          coordinates: [roundCoord(lng), roundCoord(lat)],
        },
      }
    }),
  }
}
