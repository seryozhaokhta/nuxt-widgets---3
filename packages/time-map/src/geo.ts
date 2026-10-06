import { geoArea, geoGraticule, geoNaturalEarth1, geoPath, type GeoProjection } from 'd3-geo'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import type { LonLat, TimeMapFeature } from './types'

/** Size of the map's SVG coordinate space; the viewport has the same 16:9 shape. */
export const MAP_WIDTH = 1000
export const MAP_HEIGHT = 562.5

export function createProjection(): GeoProjection {
  return geoNaturalEarth1().fitExtent([[8, 8], [MAP_WIDTH - 8, MAP_HEIGHT - 8]], { type: 'Sphere' })
}

export function createPath(projection: GeoProjection) {
  return geoPath(projection)
}

export const graticule = geoGraticule().step([30, 30])()

/**
 * d3-geo reads polygons on the sphere: a ring wound the wrong way covers the
 * rest of the globe. Hand-drawn shapes are fixed up here, whatever their winding.
 */
export function featureGeometry(feature: TimeMapFeature): Geometry | null {
  const shape = feature.shape
  if (!shape?.length) return null
  if (feature.kind === 'river') return { type: 'LineString', coordinates: shape[0] ?? [] }
  const polygon = { type: 'Polygon' as const, coordinates: shape.map((ring) => closeRing(ring)) }
  return geoArea(polygon) > 2 * Math.PI
    ? { ...polygon, coordinates: polygon.coordinates.map((ring) => [...ring].reverse()) }
    : polygon
}

function closeRing(ring: LonLat[]): LonLat[] {
  const first = ring[0]
  const last = ring[ring.length - 1]
  if (!first || !last) return ring
  return first[0] === last[0] && first[1] === last[1] ? ring : [...ring, first]
}

export type GeoJson = FeatureCollection | Feature | Geometry
