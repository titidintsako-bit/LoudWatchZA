/**
 * Position interpolation for moving targets (aircraft, ships).
 *
 * When a poll returns new positions we smoothly animate each marker from its
 * last known position to the new position over `durationMs` using
 * requestAnimationFrame, rather than jumping instantly.
 */

export interface MovingTarget {
  id: string   // icao24 or mmsi
  lat: number
  lng: number
  heading?: number
}

interface InterpolationState {
  fromLat: number
  fromLng: number
  toLat: number
  toLng: number
  startTime: number
  durationMs: number
}

const activeInterpolations = new Map<string, InterpolationState>()
let rafHandle: number | null = null
let onFrameCallback: ((positions: Map<string, { lat: number; lng: number }>) => void) | null = null
let lastFrameEmitTime = 0
const FRAME_EMIT_INTERVAL_MS = 100 // cap setData calls at 10fps

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

function tick() {
  const now = performance.now()
  const current = new Map<string, { lat: number; lng: number }>()
  let anyActive = false

  activeInterpolations.forEach((state, id) => {
    const elapsed = now - state.startTime
    const t = Math.min(elapsed / state.durationMs, 1)
    const ease = easeInOut(t)
    current.set(id, {
      lat: lerp(state.fromLat, state.toLat, ease),
      lng: lerp(state.fromLng, state.toLng, ease),
    })
    if (t < 1) anyActive = true
    else activeInterpolations.delete(id)
  })

  // Throttle setData calls to max 10fps — MapLibre retiles on every setData call
  if (onFrameCallback && current.size > 0 && (now - lastFrameEmitTime) >= FRAME_EMIT_INTERVAL_MS) {
    lastFrameEmitTime = now
    onFrameCallback(current)
  }

  if (anyActive) {
    rafHandle = requestAnimationFrame(tick)
  } else {
    rafHandle = null
  }
}

/**
 * Start or update interpolation for a batch of targets.
 *
 * @param targets     New positions from the latest poll
 * @param prevMap     Previous known positions (id → position)
 * @param durationMs  Animation duration (default 10 000ms = poll interval)
 * @param onFrame     Called each RAF frame with current interpolated positions
 */
export function animateMarkers(
  targets: MovingTarget[],
  prevMap: Map<string, { lat: number; lng: number }>,
  durationMs = 10_000,
  onFrame: (positions: Map<string, { lat: number; lng: number }>) => void,
) {
  onFrameCallback = onFrame
  const now = performance.now()

  targets.forEach((target) => {
    const prev = prevMap.get(target.id)
    if (!prev) return  // no previous position — no animation needed

    const existing = activeInterpolations.get(target.id)
    activeInterpolations.set(target.id, {
      fromLat: existing ? lerp(existing.fromLat, existing.toLat, Math.min((now - existing.startTime) / existing.durationMs, 1)) : prev.lat,
      fromLng: existing ? lerp(existing.fromLng, existing.toLng, Math.min((now - existing.startTime) / existing.durationMs, 1)) : prev.lng,
      toLat: target.lat,
      toLng: target.lng,
      startTime: now,
      durationMs,
    })
  })

  if (!rafHandle) {
    rafHandle = requestAnimationFrame(tick)
  }
}

/** Cancel all active interpolations (call on unmount). */
export function cancelAnimations() {
  if (rafHandle != null) {
    cancelAnimationFrame(rafHandle)
    rafHandle = null
  }
  activeInterpolations.clear()
  onFrameCallback = null
}
