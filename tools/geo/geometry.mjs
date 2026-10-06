// Geometry helpers shared by the geo build scripts. Coordinates are [lon, lat].

import { geoArea } from 'd3-geo'

export const round2 = (value) => Math.round(value * 100) / 100

/** Ramer–Douglas–Peucker, tolerance in degrees. */
export function simplify(points, tolerance) {
  if (points.length < 4) return points
  const keep = new Uint8Array(points.length)
  keep[0] = keep[points.length - 1] = 1
  const stack = [[0, points.length - 1]]
  while (stack.length) {
    const [first, last] = stack.pop()
    const [ax, ay] = points[first]
    const [bx, by] = points[last]
    const dx = bx - ax
    const dy = by - ay
    const length = Math.hypot(dx, dy)
    let max = 0
    let index = -1
    for (let i = first + 1; i < last; i++) {
      const [px, py] = points[i]
      // A closed ring starts and ends at the same point: measure to that point.
      const distance = length
        ? Math.abs(dy * px - dx * py + bx * ay - by * ax) / length
        : Math.hypot(px - ax, py - ay)
      if (distance > max) {
        max = distance
        index = i
      }
    }
    if (max > tolerance && index > 0) {
      keep[index] = 1
      stack.push([first, index], [index, last])
    }
  }
  return points.filter((_, i) => keep[i])
}

/** Simplified, rounded ring without repeated points; null if it degenerates. */
export function cleanRing(ring, tolerance) {
  const simplified = simplify(ring, tolerance).map(([x, y]) => [round2(x), round2(y)])
  const unique = simplified.filter((point, i) =>
    i === 0 || point[0] !== simplified[i - 1][0] || point[1] !== simplified[i - 1][1])
  return unique.length >= 4 ? unique : null
}

/** Planar ring area in square degrees, to drop specks. */
export function ringArea(ring) {
  let sum = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    sum += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1])
  }
  return Math.abs(sum / 2)
}

/** d3-geo wants exterior rings clockwise; flip polygons that cover "everything else". */
export function orient(polygon) {
  return geoArea({ type: 'Polygon', coordinates: polygon }) > 2 * Math.PI
    ? polygon.map((ring) => [...ring].reverse())
    : polygon
}
