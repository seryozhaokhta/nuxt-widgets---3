import type { LonLat, TimeMapData, TimeMapFeatureKind } from './types'

const KINDS = new Set<TimeMapFeatureKind>(['state', 'culture', 'ice', 'water', 'river', 'place'])

function isLonLat(value: unknown): value is LonLat {
  return Array.isArray(value) && value.length === 2
    && typeof value[0] === 'number' && Math.abs(value[0]) <= 180
    && typeof value[1] === 'number' && Math.abs(value[1]) <= 90
}

/**
 * Checks map data that arrives untyped (a JSON import, a fetch) and returns it
 * typed. Throws with the offending id, so a typo in a kind or a coordinate is
 * caught at once instead of drawing nothing.
 */
export function asTimeMapData(input: unknown): TimeMapData {
  const data = input as TimeMapData
  if (!data || !Array.isArray(data.points) || !Array.isArray(data.geography?.epochs)) {
    throw new Error('[time-map] data needs "points" and "geography.epochs"')
  }
  for (const point of data.points) {
    if (!isLonLat(point.at)) throw new Error(`[time-map] point ${point.id}: "at" must be [lon, lat]`)
  }
  for (const feature of data.features ?? []) {
    if (!KINDS.has(feature.kind)) throw new Error(`[time-map] feature ${feature.id}: unknown kind "${feature.kind}"`)
    if (feature.label && !isLonLat(feature.label)) throw new Error(`[time-map] feature ${feature.id}: bad label`)
    for (const ring of feature.shape ?? []) {
      if (!ring.every(isLonLat)) throw new Error(`[time-map] feature ${feature.id}: bad coordinates`)
    }
    if (feature.from > feature.to) throw new Error(`[time-map] feature ${feature.id}: "from" is after "to"`)
  }
  return data
}
