// Builds the physical geography layers for the time map:
//   land-<epoch>.json  land outline at each epoch's sea level
//   rivers.json        major rivers
//   lakes.json         large lakes
//   coast-modern.json  today's coastline, for comparison
//   borders-modern.json today's borders between countries
//
// Sources (public domain), downloaded into the OS temp folder on first run:
//   ETOPO1 elevation grid (NOAA NGDC) via ERDDAP, subsampled to 1/6 degree
//   Natural Earth 1:50m rivers, lakes and borders, 1:110m coastline
//
// Run: npm run geo:build

import { mkdir, readFile, writeFile, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { NetCDFReader } from 'netcdfjs'
import { contours } from 'd3-contour'
import { cleanRing, orient, ringArea, round2 as round, simplify } from './geometry.mjs'
import { EPOCHS, SEAS, LAKES, OUT_DIR } from './config.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const CACHE = join(tmpdir(), 'art-widgets-geo')
const STRIDE = 10 // ETOPO1 is 1 arc-minute; 10 gives a 1/6 degree grid.
const NE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/'
const SOURCES = {
  etopo: {
    file: 'etopo1-6th.nc',
    url: 'https://upwell.pfeg.noaa.gov/erddap/griddap/etopo180.nc?altitude'
      + `%5B(-90.0):${STRIDE}:(90.0)%5D%5B(-180.0):${STRIDE}:(180.0)%5D`,
  },
  rivers: { file: 'ne_50m_rivers_lake_centerlines.geojson', url: NE + 'ne_50m_rivers_lake_centerlines.geojson' },
  lakes: { file: 'ne_50m_lakes.geojson', url: NE + 'ne_50m_lakes.geojson' },
  coast: { file: 'ne_110m_coastline.geojson', url: NE + 'ne_110m_coastline.geojson' },
  borders: {
    file: 'ne_50m_admin_0_boundary_lines_land.geojson',
    url: NE + 'ne_50m_admin_0_boundary_lines_land.geojson',
  },
}

async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function source(name) {
  const { file, url } = SOURCES[name]
  const path = join(CACHE, file)
  if (!(await exists(path))) {
    console.log(`downloading ${file}`)
    const response = await fetch(url)
    if (!response.ok) throw new Error(`${url}: ${response.status}`)
    await writeFile(path, Buffer.from(await response.arrayBuffer()))
  }
  return readFile(path)
}

function featureCollection(features) {
  return { type: 'FeatureCollection', features }
}

// ---------------------------------------------------------------- elevation

async function loadGrid() {
  const reader = new NetCDFReader(await source('etopo'))
  const lat = reader.getDataVariable('latitude')
  const lon = reader.getDataVariable('longitude')
  const altitude = Int16Array.from(reader.getDataVariable('altitude').flat(Infinity))
  if (lat[0] > lat[lat.length - 1]) throw new Error('expected latitude ascending')
  return { width: lon.length, height: lat.length, lat0: lat[0], lon0: lon[0], step: lon[1] - lon[0], altitude }
}

function cellOf(grid, [lat, lon]) {
  const x = Math.round((lon - grid.lon0) / grid.step)
  const y = Math.round((lat - grid.lat0) / grid.step)
  return y * grid.width + x
}

/** Marks cells below `level` reachable from `seed` ([lat, lon]); longitude wraps. */
function flood(grid, water, seed, level) {
  const { width, height, altitude } = grid
  const start = cellOf(grid, seed)
  if (altitude[start] >= level) return 0
  const queue = new Int32Array(width * height)
  let head = 0
  let tail = 0
  const visit = (cell) => {
    if (water[cell] || altitude[cell] >= level) return
    water[cell] = 1
    queue[tail++] = cell
  }
  visit(start)
  while (head < tail) {
    const cell = queue[head++]
    const x = cell % width
    const y = (cell - x) / width
    visit(y * width + ((x + 1) % width))
    visit(y * width + ((x - 1 + width) % width))
    if (y > 0) visit(cell - width)
    if (y < height - 1) visit(cell + width)
  }
  return tail
}

function landOutline(grid, water, tolerance, minArea) {
  const { width, height, lat0, lon0, step } = grid
  const land = new Float64Array(width * height)
  for (let i = 0; i < land.length; i++) land[i] = water[i] ? 0 : 1
  const [contour] = contours().size([width, height]).thresholds([0.5])(land)
  // d3-contour puts sample i at i + 0.5.
  const toLonLat = ([x, y]) => [
    Math.max(-180, Math.min(180, lon0 + (x - 0.5) * step)),
    Math.max(-90, Math.min(90, lat0 + (y - 0.5) * step)),
  ]
  const polygons = []
  for (const polygon of contour.coordinates) {
    const rings = []
    for (const [index, ring] of polygon.entries()) {
      const cleaned = cleanRing(ring.map(toLonLat), tolerance)
      if (!cleaned || ringArea(cleaned) < minArea) {
        if (index === 0) break
        continue
      }
      rings.push(cleaned)
    }
    if (rings.length) polygons.push(orient(rings))
  }
  return { type: 'Feature', properties: {}, geometry: { type: 'MultiPolygon', coordinates: polygons } }
}

// ---------------------------------------------------------------- vectors

function simplifyLines(geometry, tolerance) {
  const lines = geometry.type === 'LineString' ? [geometry.coordinates] : geometry.coordinates
  const kept = lines
    .map((line) => simplify(line, tolerance).map(([x, y]) => [round(x), round(y)]))
    .filter((line) => line.length >= 2)
  return kept.length ? { type: 'MultiLineString', coordinates: kept } : null
}

function simplifyPolygons(geometry, tolerance) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  const kept = polygons
    .map((polygon) => polygon.map((ring) => cleanRing(ring, tolerance)).filter(Boolean))
    .filter((polygon) => polygon.length)
    .map(orient)
  return kept.length ? { type: 'MultiPolygon', coordinates: kept } : null
}

// ---------------------------------------------------------------- main

async function main() {
  await mkdir(CACHE, { recursive: true })
  const out = join(ROOT, OUT_DIR)
  await mkdir(out, { recursive: true })
  const write = async (name, data) => {
    const text = JSON.stringify(data)
    await writeFile(join(out, name), text)
    console.log(`${name.padEnd(24)} ${(text.length / 1024).toFixed(0).padStart(5)} KB`)
  }

  const grid = await loadGrid()
  console.log(`grid ${grid.width} x ${grid.height}, step ${grid.step.toFixed(4)} deg`)

  for (const epoch of EPOCHS) {
    const water = new Uint8Array(grid.width * grid.height)
    for (const sea of SEAS) flood(grid, water, sea.seed, sea.level ?? epoch.seaLevel)
    for (const lake of LAKES) {
      const level = epoch.lakes?.[lake.id]
      if (level !== undefined) flood(grid, water, lake.seed, level)
    }
    await write(`land-${epoch.id}.json`, featureCollection([landOutline(grid, water, 0.07, 0.15)]))
  }

  const rivers = JSON.parse(await source('rivers'))
  await write('rivers.json', featureCollection(rivers.features
    .filter((feature) => feature.properties.scalerank <= 4)
    .map((feature) => ({
      type: 'Feature',
      properties: { name: feature.properties.name, rank: feature.properties.scalerank },
      geometry: simplifyLines(feature.geometry, 0.03),
    }))
    .filter((feature) => feature.geometry)))

  const lakes = JSON.parse(await source('lakes'))
  await write('lakes.json', featureCollection(lakes.features
    // Lake Chad and the Caspian come from the elevation grid instead.
    .filter((feature) => feature.properties.scalerank <= 2 && !/Chad|Caspian/.test(feature.properties.name ?? ''))
    .map((feature) => ({
      type: 'Feature',
      properties: { name: feature.properties.name },
      geometry: simplifyPolygons(feature.geometry, 0.03),
    }))
    .filter((feature) => feature.geometry)))

  const borders = JSON.parse(await source('borders'))
  await write('borders-modern.json', featureCollection(borders.features
    .map((feature) => ({ type: 'Feature', properties: {}, geometry: simplifyLines(feature.geometry, 0.04) }))
    .filter((feature) => feature.geometry)))

  const coast = JSON.parse(await source('coast'))
  await write('coast-modern.json', featureCollection(coast.features
    .map((feature) => ({ type: 'Feature', properties: {}, geometry: simplifyLines(feature.geometry, 0.05) }))
    .filter((feature) => feature.geometry)))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
