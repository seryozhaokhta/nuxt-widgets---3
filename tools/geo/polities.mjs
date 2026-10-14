// Builds the states layer of the time map from Cliopatria, a geospatial
// database of world polities from 3400 BCE to 2024 CE (Seshat Global History
// Databank, CC BY 4.0): https://github.com/Seshat-Global-History-Databank/cliopatria
//
// Output, in OUT_DIR/polities/:
//   index.json        names (English; Russian via Wikidata/Wikipedia) and time chunks
//   <from>-<to>.json  records alive in that span, rings stored once ("3400bce-203bce.json")
//
// Rings are kept as integer hundredths of a degree, delta-encoded:
// [x0, y0, dx1, dy1, ...]. Each record: [entity, fromYear, toYear,
// [[outerRing, ...holes], ...polygons], [labelLon, labelLat], areaKm2, umbrella?].
// `umbrella` (1) marks a record drawn as an outline over the states inside it.
//
// On top of Cliopatria, the build:
//   - renames and trims records listed in CORRECTIONS (tools/geo/config.mjs);
//   - drops an overseas part of a state for the years another state holds it
//     (Algeria in France's record after 1962), and outlines a state whose land
//     is all held by others (Kievan Rus' over its principalities);
//   - bridges short gaps where Cliopatria leaves a state's land empty (Mexico
//     in 1913–1919);
//   - puts each label inside the part of the state that holds its capital.
// Everything it changes is listed in tools/geo/polity-check.md.
//
// Run: npm run geo:polities

import { mkdir, readFile, readdir, writeFile, access, rm } from 'node:fs/promises'
import { inflateRawSync } from 'node:zlib'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { geoArea } from 'd3-geo'
import polygonClipping from 'polygon-clipping'
import { bounds, cleanRing, depth, distanceToPolygon, orient, pointInPolygon, polylabel, rasterize, ringArea } from './geometry.mjs'
import { CAPITALS, CORRECTIONS, DE_JURE, DISPUTED, OUT_DIR, RUSSIAN_NAMES } from './config.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const CACHE = join(tmpdir(), 'art-widgets-geo')
const ZIP_URL = 'https://raw.githubusercontent.com/Seshat-Global-History-Databank/cliopatria/main/cliopatria.geojson.zip'
const DISPUTED_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_disputed_areas.geojson'
const TOLERANCE = 0.1 // degrees, Douglas–Peucker
const MIN_RING_AREA = 0.02 // square degrees
const CHUNK_BYTES = 400 * 1024
const EARTH_RADIUS = 6371.0088 // km
/** Grid for comparing land between states, in degrees. */
const CELL = 0.25
/** A part of a state this much covered by others belongs to them for those years. */
const HELD = 0.8
/** A state this much covered by two or more others is drawn as an outline over them. */
const UMBRELLA = 0.85
/** Longest gap in a state's records that is bridged, in years. */
const MAX_GAP = 30

async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

/** Extracts the single file of a zip archive (deflate) without dependencies. */
function unzipSingle(zip) {
  let end = zip.length - 22
  while (end >= 0 && zip.readUInt32LE(end) !== 0x06054b50) end--
  if (end < 0) throw new Error('not a zip archive')
  const central = zip.readUInt32LE(end + 16)
  if (zip.readUInt32LE(central) !== 0x02014b50) throw new Error('bad central directory')
  const method = zip.readUInt16LE(central + 10)
  const compressedSize = zip.readUInt32LE(central + 20)
  const localOffset = zip.readUInt32LE(central + 42)
  const nameLength = zip.readUInt16LE(localOffset + 26)
  const extraLength = zip.readUInt16LE(localOffset + 28)
  const start = localOffset + 30 + nameLength + extraLength
  const data = zip.subarray(start, start + compressedSize)
  if (method === 0) return data
  if (method !== 8) throw new Error('unsupported zip method ' + method)
  return inflateRawSync(data)
}

async function loadCliopatria() {
  const zipPath = join(CACHE, 'cliopatria.geojson.zip')
  if (!(await exists(zipPath))) {
    console.log('downloading cliopatria.geojson.zip')
    const response = await fetch(ZIP_URL)
    if (!response.ok) throw new Error(`${ZIP_URL}: ${response.status}`)
    await writeFile(zipPath, Buffer.from(await response.arrayBuffer()))
  }
  return JSON.parse(unzipSingle(await readFile(zipPath)).toString('utf8'))
}

/** Natural Earth's breakaway and disputed areas (public domain), for DE_JURE. */
async function loadDisputed() {
  const path = join(CACHE, 'ne_10m_admin_0_disputed_areas.geojson')
  if (!(await exists(path))) {
    console.log('downloading ne_10m_admin_0_disputed_areas.geojson')
    const response = await fetch(DISPUTED_URL)
    if (!response.ok) throw new Error(`${DISPUTED_URL}: ${response.status}`)
    await writeFile(path, Buffer.from(await response.arrayBuffer()))
  }
  return JSON.parse(await readFile(path, 'utf8'))
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** One request a second; waits and retries when Wikidata asks to slow down. */
async function politeFetch(url) {
  for (let attempt = 0; attempt < 6; attempt++) {
    await sleep(1000)
    const response = await fetch(url, { headers: { 'User-Agent': 'art-widgets-geo-build/0.1 (map data build script)' } })
    if (response.ok) return response.json()
    if (response.status !== 429 && response.status < 500) throw new Error(`wikidata: ${response.status}`)
    const wait = Number(response.headers.get('retry-after')) || 2 ** attempt * 5
    console.log(`wikidata: ${response.status}, waiting ${wait}s`)
    await sleep(wait * 1000)
  }
  throw new Error('wikidata: too many retries')
}

/**
 * Russian names via Wikidata: each English Wikipedia title Cliopatria gives is
 * looked up, and the Russian Wikipedia title (or Russian label) is kept.
 * Cliopatria's own Wikidata ids are not used: some point to the wrong item.
 */
async function russianTitles(titles) {
  const cachePath = join(CACHE, 'wikipedia-titles.json')
  const cache = (await exists(cachePath)) ? JSON.parse(await readFile(cachePath, 'utf8')) : {}
  const missing = titles.filter((title) => !(title in cache))
  const key = (title) => title.replace(/_/g, ' ').replace(/^./, (first) => first.toUpperCase())
  for (let i = 0; i < missing.length; i += 50) {
    const batch = missing.slice(i, i + 50)
    const url = 'https://www.wikidata.org/w/api.php?action=wbgetentities&sites=enwiki&props=labels%7Csitelinks'
      + '&languages=ru&sitefilter=enwiki%7Cruwiki&format=json&titles=' + batch.map(encodeURIComponent).join('%7C')
    const { entities } = await politeFetch(url)
    const found = new Map()
    for (const entity of Object.values(entities ?? {})) {
      const en = entity.sitelinks?.enwiki?.title
      if (en) found.set(key(en), { id: entity.id, ruwiki: entity.sitelinks?.ruwiki?.title ?? null, ru: entity.labels?.ru?.value ?? null })
    }
    for (const title of batch) cache[title] = found.get(key(title)) ?? null
    // Saved after every batch, so an interrupted run resumes where it stopped.
    await writeFile(cachePath, JSON.stringify(cache))
    console.log(`wikipedia titles ${Math.min(i + 50, missing.length)}/${missing.length}`)
  }
  return cache
}

/**
 * Second pass for titles Wikidata didn't match (usually redirects): Wikipedia
 * follows the redirect and gives the Russian article title.
 */
async function russianLanglinks(titles) {
  const cachePath = join(CACHE, 'wikipedia-langlinks.json')
  const cache = (await exists(cachePath)) ? JSON.parse(await readFile(cachePath, 'utf8')) : {}
  const missing = titles.filter((title) => !(title in cache))
  for (let i = 0; i < missing.length; i += 50) {
    const batch = missing.slice(i, i + 50)
    const url = 'https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1&prop=langlinks&lllang=ru'
      + '&lllimit=max&titles=' + batch.map(encodeURIComponent).join('%7C')
    const json = await politeFetch(url)
    const target = new Map(batch.map((title) => [title, title]))
    for (const step of [...(json.query?.normalized ?? []), ...(json.query?.redirects ?? [])]) {
      for (const [title, current] of target) if (current === step.from) target.set(title, step.to)
    }
    const russian = new Map(Object.values(json.query?.pages ?? {})
      .map((page) => [page.title, page.langlinks?.[0]?.['*'] ?? null]))
    for (const title of batch) cache[title] = russian.get(target.get(title)) ?? null
    await writeFile(cachePath, JSON.stringify(cache))
  }
  return cache
}

/** Inception (P571) and dissolution (P576) years from Wikidata, by item id. */
async function lifespans(ids) {
  const cachePath = join(CACHE, 'wikidata-lifespans.json')
  const cache = (await exists(cachePath)) ? JSON.parse(await readFile(cachePath, 'utf8')) : {}
  const missing = ids.filter((id) => !(id in cache))
  const year = (value) => (value ? Number(value.match(/^(-?\d+)/)?.[1]) : null)
  for (let i = 0; i < missing.length; i += 200) {
    const batch = missing.slice(i, i + 200)
    const query = 'SELECT ?item (MIN(?s) AS ?start) (MAX(?e) AS ?end) WHERE { VALUES ?item { '
      + batch.map((id) => 'wd:' + id).join(' ')
      + ' } OPTIONAL { ?item wdt:P571 ?s } OPTIONAL { ?item wdt:P576 ?e } } GROUP BY ?item'
    const json = await politeFetch('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(query))
    for (const id of batch) cache[id] = { start: null, end: null }
    for (const row of json.results.bindings) {
      const id = row.item.value.split('/').pop()
      cache[id] = { start: year(row.start?.value), end: year(row.end?.value) }
    }
    await writeFile(cachePath, JSON.stringify(cache))
    console.log(`wikidata lifespans ${Math.min(i + 200, missing.length)}/${missing.length}`)
  }
  return cache
}

/** Coordinates of every capital (P36 → P625) a state had on Wikidata, by item id. */
async function capitals(ids) {
  const cachePath = join(CACHE, 'wikidata-capitals.json')
  const cache = (await exists(cachePath)) ? JSON.parse(await readFile(cachePath, 'utf8')) : {}
  const missing = ids.filter((id) => !(id in cache))
  for (let i = 0; i < missing.length; i += 200) {
    const batch = missing.slice(i, i + 200)
    const query = 'SELECT ?item ?coord WHERE { VALUES ?item { '
      + batch.map((id) => 'wd:' + id).join(' ')
      + ' } ?item wdt:P36 ?capital . ?capital wdt:P625 ?coord }'
    const json = await politeFetch('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(query))
    for (const id of batch) cache[id] = []
    for (const row of json.results.bindings) {
      const id = row.item.value.split('/').pop()
      const [lon, lat] = row.coord.value.match(/Point\(([-\d.e]+) ([-\d.e]+)\)/i)?.slice(1).map(Number) ?? []
      if (Number.isFinite(lon) && Number.isFinite(lat)) cache[id].push([lon, lat])
    }
    await writeFile(cachePath, JSON.stringify(cache))
    console.log(`wikidata capitals ${Math.min(i + 200, missing.length)}/${missing.length}`)
  }
  return cache
}

// ---------------------------------------------------------------- records

/** Polygons simplified for display, specks dropped, wound for d3-geo. */
function polygonsOf(geometry) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  const result = []
  for (const polygon of polygons) {
    const rings = []
    for (const [index, ring] of polygon.entries()) {
      const cleaned = cleanRing(ring, TOLERANCE)
      if (!cleaned || ringArea(cleaned) < MIN_RING_AREA) {
        if (index === 0) break
        continue
      }
      rings.push(cleaned)
    }
    if (rings.length) result.push(orient(rings))
  }
  return result
}

/** English display name: Cliopatria's, without the brackets it puts around some. */
function englishName(name) {
  return name.replace(/^\((.*)\)$/, '$1').trim()
}

/** Russian display name; falls back to English when Wikipedia only has a topic article. */
function russianName(english, wiki) {
  if (RUSSIAN_NAMES[english]) return RUSSIAN_NAMES[english]
  const candidate = wiki?.ruwiki?.replace(/\s*\([^)]*\)$/, '') ?? wiki?.ru
  if (!candidate || /^(История|Список|Период)/.test(candidate)) return english
  return candidate.charAt(0).toUpperCase() + candidate.slice(1)
}

const polygonArea = (polygon) => geoArea({ type: 'Polygon', coordinates: polygon }) * EARTH_RADIUS ** 2

/** A copy of the record limited to [from, to], or null when they don't meet. */
function clip(record, from, to) {
  const start = Math.max(record.from, from)
  const end = Math.min(record.to, to)
  return start <= end ? { ...record, from: start, to: end } : null
}

/**
 * Applies CORRECTIONS to one Cliopatria record. A correction covers only its
 * own years, so a record that runs past them is cut in pieces; `at` limits it
 * to the record whose land holds that point.
 */
function correct(record) {
  let pieces = [record]
  for (const fix of CORRECTIONS) {
    if (fix.name !== record.source) continue
    pieces = pieces.flatMap((piece) => {
      const inside = clip(piece, fix.from, fix.to)
      if (!inside) return [piece]
      if (fix.at && !piece.polygons.some((polygon) => pointInPolygon(fix.at, polygon))) return [piece]
      const kept = fix.dropAt
        ? piece.polygons.filter((polygon) => !fix.dropAt.some((point) => pointInPolygon(point, polygon)))
        : piece.polygons
      if (kept.length === piece.polygons.length && !fix.en && !fix.remove) return [piece]
      const rest = [clip(piece, -Infinity, fix.from - 1), clip(piece, fix.to + 1, Infinity)].filter(Boolean)
      if (fix.remove || !kept.length) return rest
      if (fix.en) Object.assign(inside, { name: fix.en, ru: fix.ru })
      if (kept.length < piece.polygons.length) {
        inside.polygons = kept
        inside.area = Math.round(kept.reduce((sum, polygon) => sum + polygonArea(polygon), 0))
      }
      inside.fixed = true
      return [...rest, inside]
    })
  }
  return pieces
}

/** Sorted cell ids of a record's land, all polygons together. */
function cellsOf(record) {
  if (!record.cells) {
    record.parts = record.polygons.map((polygon) => rasterize(polygon, CELL))
    record.cells = Int32Array.from(new Set(record.parts.flatMap((part) => [...part]))).sort()
    record.box = bounds(record.polygons)
  }
  return record.cells
}

function common(a, b) {
  const shared = []
  for (let i = 0, j = 0; i < a.length && j < b.length;) {
    if (a[i] < b[j]) i++
    else if (a[i] > b[j]) j++
    else {
      shared.push(a[i])
      i++
      j++
    }
  }
  return shared
}

const boxesMeet = (a, b) => a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3]

/**
 * Other states' records that share land with this one at some time: `shared`
 * is all the common land; `holds`, the part of it the other state keeps
 * against this one — its own core, or anything when it is the smaller state.
 * (Without that, two empires listing the same island would both drop it.)
 */
function rivals(record, records, capitalsOf) {
  const cells = cellsOf(record)
  return records.flatMap((other) => {
    if (other === record || other.entity === record.entity || other.realm) return []
    if (other.from > record.to || other.to < record.from) return []
    cellsOf(other)
    if (!boxesMeet(record.box, other.box)) return []
    const shared = common(cells, other.cells)
    if (!shared.length) return []
    other.coreCells ??= new Set(coreParts(other, capitalsOf).flatMap((k) => [...other.parts[k]]))
    const holds = other.area < record.area ? shared : shared.filter((cell) => other.coreCells.has(cell))
    return [{ record: other, shared: new Set(shared), holds: new Set(holds) }]
  })
}

/** A capital this close to a part (degrees) counts as in it: simplified coasts can leave a port outside. */
const CAPITAL_REACH = 0.5

/** Indexes of the polygons that make the state itself: the one with its capital, or the largest. */
function coreParts(record, capitalsOf) {
  const points = capitalsOf(record) ?? []
  const withCapital = record.polygons.flatMap((polygon, i) =>
    points.some((point) => pointInPolygon(point, polygon)) ? [i] : [])
  if (withCapital.length) return withCapital
  let nearest = { part: -1, distance: CAPITAL_REACH }
  for (const [i, polygon] of record.polygons.entries()) {
    for (const point of points) {
      const distance = distanceToPolygon(point, polygon)
      if (distance < nearest.distance) nearest = { part: i, distance }
    }
  }
  if (nearest.part >= 0) return [nearest.part]
  const largest = record.polygons.reduce((best, polygon, i) =>
    (ringArea(polygon[0]) > ringArea(record.polygons[best][0]) ? i : best), 0)
  return [largest]
}

/**
 * Cuts a record where its rivals begin or end, asks `decide` about each span
 * (given the rivals active in it) and joins neighbouring spans with the same
 * answer: [{ from, to, value }].
 */
function bySpans(record, others, decide) {
  const starts = new Set([record.from])
  for (const { record: other } of others) {
    if (other.from > record.from) starts.add(other.from)
    if (other.to < record.to) starts.add(other.to + 1)
  }
  const years = [...starts].sort((a, b) => a - b)
  const spans = []
  for (const [i, from] of years.entries()) {
    const to = (years[i + 1] ?? record.to + 1) - 1
    const value = decide(others.filter(({ record: other }) => other.from <= from && other.to >= from))
    const last = spans.at(-1)
    if (last && JSON.stringify(last.value) === JSON.stringify(value)) last.to = to
    else spans.push({ from, to, value })
  }
  return spans
}

const fresh = (record, changes) => ({ ...record, ...changes, cells: null, coreCells: null })

/**
 * Where states overlap in the same years. First, an overseas part of a state
 * that another state holds (≥ HELD) and that isn't its core leaves the record
 * for those years. Then a state whose remaining land is held by two or more
 * smaller ones (≥ UMBRELLA) becomes an outline over them. Disputed modern
 * borders are left as Cliopatria draws them.
 */
function resolveClaims(records, capitalsOf, log) {
  const settled = (record) => record.realm || DISPUTED.includes(record.name)

  const trimmed = records.flatMap((record) => {
    if (settled(record)) return [record]
    const others = rivals(record, records, capitalsOf)
    if (!others.length) return [record]
    const core = coreParts(record, capitalsOf)
    return bySpans(record, others, (active) => {
      const lost = new Set(active.flatMap(({ holds }) => [...holds]))
      return record.parts.flatMap((part, k) => {
        const share = part.length ? part.filter((cell) => lost.has(cell)).length / part.length : 0
        return share >= HELD && !core.includes(k) ? [] : [k]
      })
    }).map(({ from, to, value: keep }) => {
      if (keep.length === record.polygons.length) return fresh(record, { from, to })
      const dropped = record.polygons.filter((_, k) => !keep.includes(k))
      log.push({ name: record.name, from, to, places: dropped.map((polygon) => polylabel(polygon, 0.5).map(Math.round)) })
      const polygons = keep.map((k) => record.polygons[k])
      const area = Math.round(polygons.reduce((sum, polygon) => sum + polygonArea(polygon), 0))
      return fresh(record, { from, to, polygons, area })
    })
  })

  return trimmed.flatMap((record) => {
    if (settled(record)) return [record]
    const others = rivals(record, trimmed, capitalsOf).filter(({ record: other }) => other.area < record.area)
    if (others.length < 2) return [record]
    const cells = cellsOf(record)
    return bySpans(record, others, (active) => {
      const held = new Set(active.flatMap(({ shared }) => [...shared]))
      const holders = new Set(active.map(({ record: other }) => other.entity))
      return holders.size >= 2 && held.size / cells.length >= UMBRELLA
    }).map(({ from, to, value: umbrella }) => fresh(record, { from, to, umbrella }))
  })
}

/** Polygons of a Natural Earth geometry, lightly simplified (the areas are small). */
function finePolygons(geometry) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  return polygons.flatMap((polygon) => {
    const rings = polygon.map((ring) => cleanRing(ring, 0.01)).filter(Boolean)
    return rings.length ? [rings] : []
  })
}

/**
 * Polygons from a clipping result, wound for d3-geo; specks and slivers left
 * where two sources draw the same coast a little differently are dropped.
 */
function tidy(multipolygon) {
  return multipolygon
    .filter((polygon) => ringArea(polygon[0]) >= MIN_RING_AREA && depth(polygon) >= 0.03)
    .map(orient)
}

/**
 * Borders under international law (DE_JURE in tools/geo/config.mjs): for each
 * rule's years, its land is cut from every other record and joined to the
 * owner's; an owner without a record in some of those years gets one.
 */
function applyDeJure(records, disputed, entityOf, log) {
  for (const rule of DE_JURE) {
    const parts = rule.areas.flatMap((area) => {
      if (area.ne) {
        const features = disputed.features.filter((feature) => feature.properties.BRK_NAME === area.ne)
        if (!features.length) throw new Error(`DE_JURE: no Natural Earth area "${area.ne}"`)
        return features.flatMap((feature) => finePolygons(feature.geometry))
      }
      const source = records.find((record) => record.name === area.record && !record.realm
        && record.from <= area.year && record.to >= area.year)
      if (!source) throw new Error(`DE_JURE: no record of "${area.record}" in ${area.year}`)
      return source.polygons.filter((polygon) => {
        if (area.at) return pointInPolygon(area.at, polygon)
        if (!area.within) return true
        const [west, south, east, north] = bounds([polygon])
        return west >= area.within[0] && south >= area.within[1] && east <= area.within[2] && north <= area.within[3]
      })
    })
    // Clipping output winds the other way from d3-geo, hence orient() before any area.
    const land = polygonClipping.union(...parts.map((polygon) => [polygon])).map(orient)
    const landArea = land.reduce((sum, polygon) => sum + polygonArea(polygon), 0)
    const box = bounds(land)
    const owned = (record) => rule.owner.includes(record.name) && !record.realm
    // Only the parts of a record that reach the land are clipped; the rest
    // (other islands, other coasts) stays exactly as it was.
    const reaches = (polygon) => boxesMeet(bounds([polygon]), box)
    const sizeOf = (polygons) => polygons.reduce((sum, polygon) => sum + polygonArea(polygon), 0)
    /** The record's polygons with the land joined or cut, and the change in km²; null if none. */
    const changeOf = (record) => {
      const near = record.polygons.filter(reaches)
      const far = record.polygons.filter((polygon) => !reaches(polygon))
      if (owned(record)) {
        const joined = polygonClipping.union(...near.map((polygon) => [polygon]), land).map(orient)
        const delta = sizeOf(joined) - sizeOf(near)
        return delta > 1 ? { polygons: [...far, ...joined], delta } : null
      }
      let delta = 0
      const kept = near.flatMap((polygon) => {
        const left = polygonClipping.difference([polygon], land).map(orient)
        const cut = polygonArea(polygon) - sizeOf(left)
        if (cut < 1) return [polygon]
        const tidied = tidy(left)
        delta -= polygonArea(polygon) - sizeOf(tidied)
        return tidied
      })
      return delta < 0 ? { polygons: [...far, ...kept], delta } : null
    }
    records = records.flatMap((record) => {
      const inside = clip(record, rule.from, rule.to)
      if (!inside || !boxesMeet(bounds(record.polygons), box)) return [record]
      let change
      try {
        change = changeOf(record)
      } catch (error) {
        console.warn(`DE_JURE: could not clip ${record.name} ${inside.from}–${inside.to}: ${error.message}`)
        return [record]
      }
      // Nothing of the land was there (or all of it already was).
      if (!change) return [record]
      // A border drawn a little differently by the two sources is not a change worth listing.
      if (Math.abs(change.delta) > Math.min(500, landArea / 20)) {
        log.push({ name: record.name, from: inside.from, to: inside.to, change: change.delta > 0 ? 'gains' : 'loses', basis: rule.basis })
      }
      const rest = [clip(record, -Infinity, rule.from - 1), clip(record, rule.to + 1, Infinity)].filter(Boolean)
      const area = Math.max(0, Math.round(record.area + change.delta))
      return change.polygons.length ? [...rest, fresh(inside, { polygons: change.polygons, area, fixed: true })] : rest
    })
    if (rule.create) {
      const held = new Set()
      for (const record of records) {
        if (!owned(record)) continue
        for (let year = Math.max(record.from, rule.from); year <= Math.min(record.to, rule.to); year++) held.add(year)
      }
      const polygons = land
      const area = Math.round(landArea)
      for (let year = rule.from; year <= rule.to; year++) {
        if (held.has(year)) continue
        let to = year
        while (to < rule.to && !held.has(to + 1)) to++
        const entity = entityOf(rule.owner[0], rule.ru)
        records.push({ name: rule.owner[0], entity, from: year, to, polygons, area, realm: false, fixed: true, item: null })
        log.push({ name: rule.owner[0], from: year, to, change: 'drawn', basis: rule.basis })
        year = to
      }
    }
  }
  return records
}

/**
 * Cliopatria sometimes leaves a state out for a few years with nobody else on
 * its land (Mexico during the revolution, 1913–1919), and the map would show
 * that land empty. Gaps up to MAX_GAP years where at least half of the land is
 * free are bridged with the borders on either side.
 */
function bridgeGaps(records, log) {
  const byEntity = new Map()
  for (const record of records) {
    if (record.realm) continue
    if (!byEntity.has(record.entity)) byEntity.set(record.entity, [])
    byEntity.get(record.entity).push(record)
  }
  const bridges = []
  for (const list of byEntity.values()) {
    list.sort((a, b) => a.from - b.from)
    let last = list[0]
    for (const next of list.slice(1)) {
      const gap = [last.to + 1, next.from - 1]
      if (gap[1] >= gap[0] && gap[1] - gap[0] < MAX_GAP) {
        const middle = (gap[0] + gap[1]) / 2
        const free = (year) => {
          const side = year <= middle ? last : next
          const cells = cellsOf(side)
          if (!cells.length) return false
          const held = new Set()
          for (const other of records) {
            if (other.entity === side.entity || other.realm || other.from > year || other.to < year) continue
            cellsOf(other)
            if (!boxesMeet(side.box, other.box)) continue
            for (const cell of common(cells, other.cells)) held.add(cell)
          }
          return held.size / cells.length < 0.5
        }
        let run = null
        for (let year = gap[0]; year <= gap[1] + 1; year++) {
          if (year <= gap[1] && free(year)) {
            run ??= { from: year, to: year }
            run.to = year
            continue
          }
          if (run) {
            const side = run.to <= middle || run.from === gap[0] ? last : next
            bridges.push({ ...side, from: run.from, to: run.to, umbrella: false, cells: null })
            log.push({ name: side.name, from: run.from, to: run.to })
            run = null
          }
        }
      }
      if (next.to > last.to) last = next
    }
  }
  return bridges
}

/** Label point: deep inside the part of the state that holds its capital, or its largest part. */
function labelOf(record, capitalsOf) {
  const core = coreParts(record, capitalsOf)
  const polygon = core
    .map((k) => record.polygons[k])
    .reduce((best, polygon) => (ringArea(polygon[0]) > ringArea(best[0]) ? polygon : best))
  return polylabel(polygon).map((value) => Math.round(value * 10) / 10)
}

function encodeRing(ring) {
  const out = []
  let px = 0
  let py = 0
  for (const [i, [lon, lat]] of ring.entries()) {
    const x = Math.round(lon * 100)
    const y = Math.round(lat * 100)
    if (i === 0) out.push(x, y)
    else out.push(x - px, y - py)
    px = x
    py = y
  }
  return out
}

/** Splits the timeline so each chunk holds about CHUNK_BYTES of records. */
function chunkSpans(records) {
  const years = [...new Set(records.map((record) => record.from))].sort((a, b) => a - b)
  const last = Math.max(...records.map((record) => record.to))
  const spans = []
  let start = years[0]
  let previous = start
  for (const year of [...years.slice(1), last + 1]) {
    const size = records
      .filter((record) => record.from < year && record.to >= start)
      .reduce((sum, record) => sum + record.bytes, 0)
    if (size > CHUNK_BYTES && previous > start) {
      spans.push([start, previous - 1])
      start = previous
    }
    previous = year
  }
  spans.push([start, last])
  return spans
}

function chunkFile(span, records) {
  const rings = []
  const ringIndex = new Map()
  const ref = (ring) => {
    const encoded = encodeRing(ring)
    const key = encoded.join(',')
    if (!ringIndex.has(key)) {
      ringIndex.set(key, rings.length)
      rings.push(encoded)
    }
    return ringIndex.get(key)
  }
  const inSpan = records.filter((record) => record.from <= span[1] && record.to >= span[0])
  return {
    from: span[0],
    to: span[1],
    rings,
    records: inSpan.map((record) => [
      record.entity,
      record.from,
      record.to,
      record.polygons.map((polygon) => polygon.map(ref)),
      record.label,
      record.area,
      ...(record.umbrella ? [1] : []),
    ]),
  }
}

/** Records whose years fall outside the state's lifespan on Wikidata (±25 years). */
function checkReport(issues) {
  const byName = new Map()
  for (const issue of issues) {
    const known = byName.get(issue.name)
    if (known) {
      known.from = Math.min(known.from, issue.from)
      known.to = Math.max(known.to, issue.to)
    } else {
      byName.set(issue.name, { ...issue })
    }
  }
  const rows = [...byName.values()].sort((a, b) => a.from - b.from)
    .map((item) => `| ${item.name} | ${item.from}…${item.to} | ${item.start ?? '?'}…${item.end ?? '?'} | ${item.wikipedia} |`)
  return [
    '## Records outside the lifespan on Wikidata',
    '',
    'Each row is a state whose Cliopatria records fall more than 25 years outside the',
    'inception–dissolution dates of its Wikipedia article’s Wikidata item. Some are real errors',
    '(a wrong name for a later state), some are differences of definition. Confirmed errors go',
    'into CORRECTIONS in tools/geo/config.mjs.',
    '',
    `${rows.length} states.`,
    '',
    '| Cliopatria name | Records | Wikidata lifespan | Wikipedia |',
    '| --- | --- | --- | --- |',
    ...rows,
    '',
  ].join('\n')
}

/** Joins consecutive years of the same change into one row. */
function spansOf(log, key) {
  const open = new Map()
  const rows = []
  for (const item of [...log].sort((a, b) => a.from - b.from)) {
    const row = open.get(key(item))
    if (row && item.from <= row.to + 1) {
      row.to = Math.max(row.to, item.to)
      continue
    }
    const next = { ...item }
    open.set(key(item), next)
    rows.push(next)
  }
  return rows
}

function lawReport(log) {
  const rows = spansOf(log, (item) => item.name + item.change + item.basis)
  return [
    '## Borders under international law',
    '',
    'Land that Cliopatria gives to whoever held it, moved to the state it belongs to under',
    'international law (DE_JURE in tools/geo/config.mjs).',
    '',
    '| State | Years | Change | Basis |',
    '| --- | --- | --- | --- |',
    ...rows.map((row) => `| ${row.name} | ${row.from}…${row.to} | ${row.change} | ${row.basis} |`),
    '',
  ].join('\n')
}

function changesReport(dropped, bridged, umbrellas) {
  const parts = spansOf(dropped, (item) => item.name + JSON.stringify(item.places))
  const gaps = spansOf(bridged, (item) => item.name)
  const outlines = spansOf(umbrellas, (item) => item.name)
  return [
    '## Outlined over the states inside',
    '',
    'Records whose land two or more other states hold almost entirely (a union over its members,',
    'an overlord over its vassals); they are drawn as an outline, like the realms Cliopatria marks.',
    '',
    '| State | Years |',
    '| --- | --- |',
    ...outlines.map((row) => `| ${row.name} | ${row.from}…${row.to} |`),
    '',
    '## Overseas parts dropped',
    '',
    'Land a state’s Cliopatria record still includes while another state holds it (a colony after',
    'independence, an occupation zone after the occupation). It is left out for those years.',
    'Places are [lon, lat] of each dropped part.',
    '',
    '| State | Years | Places |',
    '| --- | --- | --- |',
    ...parts.map((row) => `| ${row.name} | ${row.from}…${row.to} | ${row.places.map((place) => `[${place}]`).join(' ')} |`),
    '',
    '## Gaps bridged',
    '',
    `Years where Cliopatria leaves a state out (up to ${MAX_GAP} years) and nobody else holds at least`,
    'half of its land; the borders of the nearest record are kept.',
    '',
    '| State | Years |',
    '| --- | --- |',
    ...gaps.map((row) => `| ${row.name} | ${row.from}…${row.to} |`),
    '',
  ].join('\n')
}

// ---------------------------------------------------------------- main

async function main() {
  await mkdir(CACHE, { recursive: true })
  const cliopatria = await loadCliopatria()
  // RELATION rows repeat their members' land (e.g. an empire over its colonies).
  const features = cliopatria.features.filter((feature) => feature.properties.Type === 'POLITY')
  const titles = await russianTitles([...new Set(features.map((feature) => feature.properties.Wikipedia).filter(Boolean))])
  const unmatched = Object.entries(titles).filter(([, value]) => !value?.ruwiki).map(([title]) => title)
  const langlinks = await russianLanglinks(unmatched)
  for (const title of unmatched) {
    if (langlinks[title]) titles[title] = { ...(titles[title] ?? {}), ruwiki: langlinks[title] }
  }
  const items = [...new Set(Object.values(titles).filter(Boolean).map((title) => title.id))]
  const spans = await lifespans(items)
  const capitalsById = await capitals(items)
  const issues = []

  const entities = []
  const entityIndex = new Map()
  // One entity per name; a correction may give a name its own Russian form.
  // An umbrella (a name in brackets in Cliopatria) stays apart from the state
  // of the same name: "(Russian Federation)" over "Russian Federation".
  const entityOf = (en, ru, realm = false) => {
    ru ??= entities.find((entity) => entity.en === en && !entity.realm === !realm)?.ru ?? en
    const key = [en, ru, realm].join('|')
    if (!entityIndex.has(key)) {
      entityIndex.set(key, entities.length)
      entities.push({ en, ru, ...(realm ? { realm: 1 } : {}) })
    }
    return entityIndex.get(key)
  }
  let records = []
  for (const feature of features) {
    const { Name: source, FromYear, ToYear, Area, Wikipedia } = feature.properties
    const polygons = polygonsOf(feature.geometry)
    if (!polygons.length) continue
    const item = titles[Wikipedia]?.id
    // Corrections found while checking (see tools/geo/config.mjs).
    for (const piece of correct({ source, name: source, from: FromYear, to: ToYear, polygons, area: Math.round(Area), item })) {
      const en = englishName(piece.name)
      // A name in brackets marks an umbrella over other states (a realm with
      // its vassals, an empire with its colonies); it is drawn as an outline only.
      const realm = /^\(.*\)$/.test(piece.name)
      const entity = entityOf(en, piece.ru ?? russianName(en, titles[Wikipedia]), realm)
      const span = spans[item]
      const late = span?.end != null && piece.from > span.end + 25
      const early = span?.start != null && piece.to < span.start - 25
      if (!piece.fixed && (late || early)) {
        issues.push({ name: piece.name, wikipedia: Wikipedia, from: piece.from, to: piece.to, start: span.start, end: span.end })
      }
      records.push({ ...piece, name: en, entity, realm })
    }
  }
  // Some records (often an umbrella) come without a Wikipedia link: they take
  // the Russian name another record of the same state has.
  const cyrillic = /[А-Яа-яЁё]/
  for (const entity of entities) {
    if (cyrillic.test(entity.ru)) continue
    entity.ru = entities.find((other) => other.en === entity.en && cyrillic.test(other.ru))?.ru ?? entity.ru
  }

  // A capital counts only when it lies in the record's land, so an item that
  // fits a renamed record less well does no harm.
  const capitalsOf = (record) => [...(CAPITALS[record.name] ?? []), ...(capitalsById[record.item] ?? [])]
  const dropped = []
  const bridged = []
  const lawful = []
  records = resolveClaims(records, capitalsOf, dropped)
  records = applyDeJure(records, await loadDisputed(), (en, ru) => entityOf(en, ru), lawful)
  records.push(...bridgeGaps(records, bridged))
  for (const record of records) {
    record.label = labelOf(record, capitalsOf)
    record.bytes = record.polygons.flat().reduce((sum, ring) => sum + ring.length * 7, 0)
  }
  records.sort((a, b) => a.from - b.from || b.area - a.area)

  const out = join(ROOT, OUT_DIR, 'polities')
  // Old chunks are removed file by file: on Windows a watched folder can't be
  // deleted and recreated at once.
  await mkdir(out, { recursive: true })
  for (const name of await readdir(out)) if (name.endsWith('.json')) await rm(join(out, name))
  const chunks = []
  let total = 0
  for (const span of chunkSpans(records)) {
    // Nuxt leaves out public files whose names start with "-" (ignorePrefix), so
    // years before the era are written as "3400bce".
    const year = (value) => (value < 0 ? -value + 'bce' : String(value))
    const file = `${year(span[0])}-${year(span[1])}.json`
    const text = JSON.stringify(chunkFile(span, records))
    await writeFile(join(out, file), text)
    chunks.push({ from: span[0], to: span[1], file })
    total += text.length
  }
  const index = {
    source: 'Cliopatria v0.2.1, Seshat Global History Databank, CC BY 4.0 (modified)',
    entities,
    chunks,
  }
  await writeFile(join(out, 'index.json'), JSON.stringify(index))
  await writeFile(join(ROOT, 'tools', 'geo', 'polity-check.md'), [
    '# Cliopatria: checks and automatic changes',
    '',
    'Generated by `npm run geo:polities`.',
    '',
    lawReport(lawful),
    changesReport(dropped, bridged, records.filter((record) => record.umbrella)),
    checkReport(issues),
  ].join('\n'))
  console.log(`${records.length} records, ${entities.length} states, ${chunks.length} chunks, ${(total / 1048576).toFixed(1)} MB`)
  console.log(`${dropped.length} overseas parts dropped, ${bridged.length} gaps bridged, ${records.filter((r) => r.umbrella).length} umbrella records`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
