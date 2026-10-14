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

/** Even-odd test of a point against a polygon given as [outer, ...holes]. */
export function pointInPolygon([x, y], polygon) {
  let inside = false
  for (const ring of polygon) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [ax, ay] = ring[i]
      const [bx, by] = ring[j]
      if ((ay > y) !== (by > y) && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) inside = !inside
    }
  }
  return inside
}

/** [west, south, east, north] of a list of polygons. */
export function bounds(polygons) {
  const box = [Infinity, Infinity, -Infinity, -Infinity]
  for (const polygon of polygons) {
    for (const [x, y] of polygon[0]) {
      if (x < box[0]) box[0] = x
      if (y < box[1]) box[1] = y
      if (x > box[2]) box[2] = x
      if (y > box[3]) box[3] = y
    }
  }
  return box
}

/**
 * Cells of a `cell`-degree grid whose centres fall inside the polygon, as
 * sorted ids (row * columns + column). Used to compare areas cheaply.
 */
export function rasterize(polygon, cell) {
  const columns = Math.round(360 / cell)
  const rows = Math.round(180 / cell)
  const [, south, , north] = bounds([polygon])
  const cells = []
  const first = Math.max(0, Math.floor((south + 90) / cell))
  const last = Math.min(rows - 1, Math.floor((north + 90) / cell))
  for (let row = first; row <= last; row++) {
    const y = -90 + (row + 0.5) * cell
    const crossings = []
    for (const ring of polygon) {
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [ax, ay] = ring[i]
        const [bx, by] = ring[j]
        if ((ay > y) !== (by > y)) crossings.push(ax + ((y - ay) * (bx - ax)) / (by - ay))
      }
    }
    crossings.sort((a, b) => a - b)
    for (let k = 0; k + 1 < crossings.length; k += 2) {
      const from = Math.max(0, Math.ceil((crossings[k] + 180) / cell - 0.5))
      const to = Math.min(columns - 1, Math.floor((crossings[k + 1] + 180) / cell - 0.5))
      for (let column = from; column <= to; column++) cells.push(row * columns + column)
    }
  }
  return Int32Array.from(new Set(cells)).sort()
}

function segmentDistance2(x, y, [ax, ay], [bx, by]) {
  let px = ax
  let py = ay
  const dx = bx - ax
  const dy = by - ay
  if (dx || dy) {
    const t = ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)
    if (t > 1) {
      px = bx
      py = by
    } else if (t > 0) {
      px += dx * t
      py += dy * t
    }
  }
  return (x - px) ** 2 + (y - py) ** 2
}

/** Signed distance from a point to the polygon's edges: positive inside. */
function edgeDistance(x, y, polygon) {
  let inside = false
  let min = Infinity
  for (const ring of polygon) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [ax, ay] = ring[i]
      const [bx, by] = ring[j]
      if ((ay > y) !== (by > y) && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) inside = !inside
      min = Math.min(min, segmentDistance2(x, y, ring[i], ring[j]))
    }
  }
  return (inside ? 1 : -1) * Math.sqrt(min)
}

/** Radius of the widest circle that fits in the polygon, degrees: small for specks and slivers. */
export function depth(polygon) {
  const [x, y] = polylabel(polygon, 0.01)
  return edgeDistance(x, y, polygon)
}

/** Distance in degrees from a point outside the polygon to its edge; 0 inside. */
export function distanceToPolygon([x, y], polygon) {
  return Math.max(0, -edgeDistance(x, y, polygon))
}

/**
 * The point inside a polygon farthest from its edges ("pole of
 * inaccessibility", after Mapbox's polylabel): unlike the centroid, it never
 * falls outside a crescent or a long coast. Longitude is scaled by the cosine
 * of the latitude so the polygon's shape is judged as it looks on the map.
 */
export function polylabel(polygon, precision = 0.05) {
  const [west, south, east, north] = bounds([polygon])
  const k = Math.cos((((south + north) / 2) * Math.PI) / 180) || 1
  const rings = polygon.map((ring) => simplify(ring, 0.05).map(([x, y]) => [x * k, y]))
  const minX = west * k
  const maxX = east * k
  const size = Math.min(maxX - minX, north - south)
  if (!(size > 0)) return [west, south]
  const cell = (x, y, h) => {
    const d = edgeDistance(x, y, rings)
    return { x, y, h, d, max: d + h * Math.SQRT2 }
  }
  // Max-heap on the best distance a cell could still contain.
  const heap = []
  const push = (item) => {
    heap.push(item)
    for (let i = heap.length - 1; i > 0;) {
      const parent = (i - 1) >> 1
      if (heap[parent].max >= heap[i].max) break
      ;[heap[parent], heap[i]] = [heap[i], heap[parent]]
      i = parent
    }
  }
  const pop = () => {
    const top = heap[0]
    const end = heap.pop()
    if (heap.length) {
      heap[0] = end
      for (let i = 0; ;) {
        const left = 2 * i + 1
        const right = left + 1
        let largest = i
        if (left < heap.length && heap[left].max > heap[largest].max) largest = left
        if (right < heap.length && heap[right].max > heap[largest].max) largest = right
        if (largest === i) break
        ;[heap[largest], heap[i]] = [heap[i], heap[largest]]
        i = largest
      }
    }
    return top
  }
  const h = size / 2
  for (let x = minX; x < maxX; x += size) {
    for (let y = south; y < north; y += size) push(cell(x + h, y + h, h))
  }
  let best = cell((minX + maxX) / 2, (south + north) / 2, 0)
  while (heap.length) {
    const next = pop()
    if (next.d > best.d) best = next
    if (next.max - best.d <= precision) continue
    const half = next.h / 2
    push(cell(next.x - half, next.y - half, half))
    push(cell(next.x + half, next.y - half, half))
    push(cell(next.x - half, next.y + half, half))
    push(cell(next.x + half, next.y + half, half))
  }
  return [best.x / k, best.y]
}
