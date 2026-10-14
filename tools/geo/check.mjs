// Checks the built states layer (apps/playground/public/geo/polities) for
// regressions after `npm run geo:polities`: the chunks cover the timeline,
// every name has a Russian form, labels sit inside their states, and a set of
// known places belongs to the right state in the right year.
//
// Run: npm run geo:check (exits with 1 and a list when something is off)

import { readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { distanceToPolygon, pointInPolygon } from './geometry.mjs'
import { OUT_DIR } from './config.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const DIR = join(ROOT, OUT_DIR, 'polities')

/**
 * [year, [lon, lat], state that must hold the place (filled, not an outline),
 * states that must not]. Places where the map went wrong once, and places
 * whose borders follow international law (DE_JURE).
 */
const PLACES = [
  [-300, [29.9, 31.2], 'Ptolemaic Kingdom'],
  [100, [12.5, 41.9], 'Roman Empire'],
  [800, [28.6, 41.2], 'Byzantine Empire'],
  [1200, [2.35, 48.86], 'Kingdom of France'],
  [1200, [-1.5, 52.5], 'Angevin Empire'],
  [1500, [116.4, 39.9], 'Ming Dynasty'],
  [1800, [-0.13, 51.51], 'Kingdom of Great Britain'],
  [1915, [-99.13, 19.43], 'Mexico'],
  [1915, [20.46, 44.82], 'Kingdom of Serbia'],
  [1990, [47.98, 29.37], 'State of Kuwait', ['Iraqi Republic']],
  [2000, [37.62, 55.75], 'Russian Federation'],
  [2000, [45.7, 43.3], 'Russian Federation'],
  [2000, [3.0, 33.0], "People's Democratic Republic of Algeria", ['French Fifth Republic']],
  [2000, [58.4, 23.6], 'Sultanate of Oman', ['Kingdom of Great Britain']],
  [2000, [13.2, -8.8], "People's Republic of Angola", ['Portugal']],
  [2020, [34.1, 45.0], 'Ukraine', ['Russian Federation']],
  [2024, [34.1, 45.0], 'Ukraine', ['Russian Federation']],
  [2020, [29.6, 46.84], 'Republic of Moldova'],
  [2020, [43.96, 42.23], 'Georgia'],
  [2020, [46.75, 39.82], 'Republic of Azerbaijan', ['Republic of Armenia']],
  [2020, [33.32, 35.33], 'Republic of Cyprus'],
  [2020, [35.75, 33.0], 'Syria', ['State of Israel']],
  [2020, [35.1, 31.53], 'Palestinian territories', ['State of Israel']],
  [2020, [-13.2, 27.15], 'Western Sahara'],
  [1980, [17.08, -22.56], 'South West Africa', ['South Africa']],
  [1990, [125.57, -8.56], 'East Timor', ['Republic of Indonesia']],
  [1970, [33.8, 29.5], 'United Arab Republic', ['State of Israel']],
]

/** Russian names that are a topic, not a state: the Wikipedia link went astray. */
const TOPIC = /^(Список|История|Период )|колонизац|завоевани|^Раздел|^Колониальный раздел/i

function decode(encoded) {
  const ring = []
  let x = 0
  let y = 0
  for (let i = 0; i < encoded.length; i += 2) {
    x += encoded[i]
    y += encoded[i + 1]
    ring.push([x / 100, y / 100])
  }
  return ring
}

async function main() {
  const problems = []
  const index = JSON.parse(await readFile(join(DIR, 'index.json'), 'utf8'))

  const info = JSON.parse(await readFile(join(DIR, index.info), 'utf8'))
  if (info.length !== index.entities.length) problems.push(`info: ${info.length} rows for ${index.entities.length} states`)
  for (const [i, [, , en, ru]] of info.entries()) {
    if (/\(disambiguation\)|\(значения\)/.test(en + ru)) problems.push(`info: "${index.entities[i].en}" links to a disambiguation page`)
  }

  for (const [i, entity] of index.entities.entries()) {
    if (!/[А-Яа-яЁё]/.test(entity.ru)) problems.push(`name: "${entity.en}" has no Russian form ("${entity.ru}")`)
    else if (TOPIC.test(entity.ru)) problems.push(`name: "${entity.en}" is named after a topic: "${entity.ru}" (#${i})`)
  }

  const records = []
  let expected = index.chunks[0].from
  for (const chunk of index.chunks) {
    if (chunk.from !== expected) problems.push(`chunks: ${chunk.file} starts at ${chunk.from}, expected ${expected}`)
    expected = chunk.to + 1
    const data = JSON.parse(await readFile(join(DIR, chunk.file), 'utf8'))
    const rings = data.rings.map(decode)
    for (const [entity, from, to, polygons, label, area, umbrella] of data.records) {
      if (from < chunk.from && records.some((r) => r.entity === entity && r.from === from && r.to === to)) continue
      records.push({
        entity,
        from,
        to,
        label,
        area,
        outline: !!index.entities[entity].realm || umbrella === 1,
        polygons: polygons.map((polygon) => polygon.map((ring) => rings[ring])),
      })
    }
  }
  if (expected - 1 < 2024) problems.push(`chunks: end at ${expected - 1}, before 2024`)

  for (const record of records) {
    if (record.outline) continue
    const near = Math.min(...record.polygons.map((polygon) => distanceToPolygon(record.label, polygon)))
    if (near > 0.1) {
      problems.push(`label: ${index.entities[record.entity].en} ${record.from}–${record.to} at [${record.label}] is ${near.toFixed(2)}° outside`)
    }
  }

  const holders = (year, at) => records
    .filter((record) => !record.outline && record.from <= year && record.to >= year
      && record.polygons.some((polygon) => pointInPolygon(at, polygon)))
    .map((record) => index.entities[record.entity].en)
  for (const [year, at, state, others = []] of PLACES) {
    const found = holders(year, at)
    if (!found.includes(state)) problems.push(`place: [${at}] in ${year} should be ${state}, is ${found.join(', ') || 'nobody'}`)
    for (const other of others) {
      if (found.includes(other)) problems.push(`place: [${at}] in ${year} should not be ${other}`)
    }
  }

  if (problems.length) {
    console.error(problems.join('\n'))
    console.error(`\n${problems.length} problem(s)`)
    process.exit(1)
  }
  console.log(`ok: ${index.entities.length} states, ${records.length} records, ${PLACES.length} places`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
