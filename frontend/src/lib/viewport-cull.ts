/**
 * Viewport culling — drop features outside the current map bounds before
 * calling source.setData().  Reduces MapLibre tile-rebuild work for dense
 * layers like news pins or hunger circles.
 */

export interface BBox {
  minLng: number
  minLat: number
  maxLng: number
  maxLat: number
}

/**
 * Return only Point features whose coordinates fall within `bbox`.
 * Non-Point features are always passed through unchanged.
 *
 * @param fc   GeoJSON FeatureCollection to cull
 * @param bbox Map viewport bounds
 * @param pad  Extra padding in degrees (default 0.5) so features just outside
 *             the visible area still render without popping in.
 */
export function cullToViewport(
  fc: GeoJSON.FeatureCollection,
  bbox: BBox,
  pad = 0.5,
): GeoJSON.FeatureCollection {
  const minLng = bbox.minLng - pad
  const maxLng = bbox.maxLng + pad
  const minLat = bbox.minLat - pad
  const maxLat = bbox.maxLat + pad

  return {
    type: 'FeatureCollection',
    features: fc.features.filter((f) => {
      if (!f.geometry || f.geometry.type !== 'Point') return true
      const [lng, lat] = (f.geometry as GeoJSON.Point).coordinates
      return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat
    }),
  }
}

/**
 * Extract a BBox from a MapLibre LngLatBounds-like object.
 */
export function boundsFromMap(map: {
  getBounds: () => {
    getWest: () => number
    getEast: () => number
    getSouth: () => number
    getNorth: () => number
  }
}): BBox {
  const b = map.getBounds()
  return {
    minLng: b.getWest(),
    maxLng: b.getEast(),
    minLat: b.getSouth(),
    maxLat: b.getNorth(),
  }
}
