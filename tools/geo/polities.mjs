// Builds the states layer of the time map from Cliopatria, a geospatial
// database of world polities from 3400 BCE to 2024 CE (Seshat Global History
// Databank, CC BY 4.0): https://github.com/Seshat-Global-History-Databank/cliopatria
//
// Output, in OUT_DIR/polities/:
//   index.json        names (English; Russian via Wikidata/Wikipedia) and time chunks
//   <from>_<to>.json  records alive in that span, with rings stored once
//
// Rings are kept as integer hundredths of a degree, delta-encoded:
// [x0, y0, dx1, dy1, ...]. Each record: [entity, fromYear, toYear,
// [[outerRing, ...holes], ...polygons], [labelLon, labelLat], areaKm2].
//
// Run: npm run geo:polities

import { mkdir, readFile, readdir, writeFile, access, rm } from 'node:fs/promises'
import { inflateRawSync } from 'node:zlib'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { geoCentroid } from 'd3-geo'
import { cleanRing, orient, ringArea } from './geometry.mjs'
import { CORRECTIONS, OUT_DIR, RUSSIAN_NAMES } from './config.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const CACHE = join(tmpdir(), 'art-widgets-geo')
const ZIP_URL = 'https://raw.githubusercontent.com/Seshat-Global-History-Databank/cliopatria/main/cliopatria.geojson.zip'
const TOLERANCE = 0.1 // degrees, Douglas–Peucker
const MIN_RING_AREA = 0.02 // square degrees
const CHUNK_BYTES = 400 * 1024

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
    '# Cliopatria: records outside the lifespan on Wikidata',
    '',
    'Generated by `npm run geo:polities`. Each row is a state whose Cliopatria records fall',
    'more than 25 years outside the inception–dissolution dates of its Wikipedia article’s',
    'Wikidata item. Some are real errors (a wrong name for a later state), some are differences',
    'of definition. Confirmed errors go into CORRECTIONS in tools/geo/config.mjs.',
    '',
    `${rows.length} states.`,
    '',
    '| Cliopatria name | Records | Wikidata lifespan | Wikipedia |',
    '| --- | --- | --- | --- |',
    ...rows,
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
  const spans = await lifespans([...new Set(Object.values(titles).filter(Boolean).map((title) => title.id))])
  const issues = []

  const entities = []
  const entityIndex = new Map()
  const records = []
  for (const feature of features) {
    const { FromYear, ToYear, Area, Wikipedia } = feature.properties
    const polygons = polygonsOf(feature.geometry)
    if (!polygons.length) continue
    // Corrections to names found while checking (see tools/geo/config.mjs).
    const fix = CORRECTIONS.find((item) => item.name === feature.properties.Name
      && FromYear <= item.to && ToYear >= item.from)
    const Name = fix ? fix.en : feature.properties.Name
    // A name in brackets marks an umbrella over other states (a realm with its
    // vassals, an empire with its colonies); it is drawn as an outline only.
    const realm = /^\(.*\)$/.test(Name)
    if (!entityIndex.has(Name)) {
      entityIndex.set(Name, entities.length)
      const en = englishName(Name)
      entities.push({ en, ru: fix?.ru ?? russianName(en, titles[Wikipedia]), ...(realm ? { realm: 1 } : {}) })
    }
    const span = spans[titles[Wikipedia]?.id]
    const late = span?.end != null && FromYear > span.end + 25
    const early = span?.start != null && ToYear < span.start - 25
    if (!fix && (late || early)) {
      issues.push({ name: Name, wikipedia: Wikipedia, from: FromYear, to: ToYear, start: span.start, end: span.end })
    }
    const largest = polygons.reduce((a, b) => (ringArea(b[0]) > ringArea(a[0]) ? b : a))
    const [lon, lat] = geoCentroid({ type: 'Polygon', coordinates: largest })
    const bytes = polygons.flat().reduce((sum, ring) => sum + ring.length * 7, 0)
    records.push({
      entity: entityIndex.get(Name),
      from: FromYear,
      to: ToYear,
      polygons,
      label: [Math.round(lon * 10) / 10, Math.round(lat * 10) / 10],
      area: Math.round(Area),
      bytes,
    })
  }

  const out = join(ROOT, OUT_DIR, 'polities')
  // Old chunks are removed file by file: on Windows a watched folder can't be
  // deleted and recreated at once.
  await mkdir(out, { recursive: true })
  for (const name of await readdir(out)) if (name.endsWith('.json')) await rm(join(out, name))
  const chunks = []
  let total = 0
  for (const span of chunkSpans(records)) {
    const file = `${span[0]}_${span[1]}.json`
    const text = JSON.stringify(chunkFile(span, records))
    await writeFile(join(out, file), text)
    chunks.push({ from: span[0], to: span[1], file })
    total += text.length
  }
  const index = {
    source: 'Cliopatria v0.2.1, Seshat Global History Databank, CC BY 4.0',
    entities,
    chunks,
  }
  await writeFile(join(out, 'index.json'), JSON.stringify(index))
  await writeFile(join(ROOT, 'tools', 'geo', 'polity-check.md'), checkReport(issues))
  console.log(`${records.length} records, ${entities.length} states, ${chunks.length} chunks, ${(total / 1048576).toFixed(1)} MB`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
