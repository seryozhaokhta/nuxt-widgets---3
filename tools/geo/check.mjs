// Checks the built states layer (apps/playground/public/geo/polities) for
// regressions after `npm run geo:polities`: the chunks cover the timeline,
// every name has a Russian form, labels sit inside their states, and a set of
// known places belongs to the right state in the right year.
//
// Run: npm run geo:check (exits with 1 and a list when something is off)

import { readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { bounds, distanceToPolygon, pointInPolygon, rasterize } from './geometry.mjs'
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
  [1990, [47.6, 29.2], 'State of Kuwait', ['Iraqi Republic']],
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
  [2020, [35.75, 33.0], 'Syrian Arab Republic', ['State of Israel']],
  [2020, [35.1, 31.53], 'Palestinian territories', ['State of Israel']],
  [2020, [-13.2, 27.15], 'Western Sahara'],
  [1980, [17.08, -22.56], 'South West Africa', ['South Africa']],
  [1990, [125.57, -8.56], 'East Timor', ['Republic of Indonesia']],
  [1970, [33.8, 29.5], 'United Arab Republic', ['State of Israel']],
  [-325, [52.89, 29.93], 'Macedonian Empire', ['Ptolemaic Kingdom']],
  [380, [118.78, 32.06], 'Eastern Jin', ['Western Jin']],
  [1455, [28.6, 41.2], 'Ottoman Empire', ['Byzantine Empire']],
  [1896, [51.39, 35.69], 'Qajar Dynasty', ['Dutch East Indies']],
  [1896, [110.4, -7.3], 'Dutch East Indies', ['Qajar Dynasty']],
  // Land Cliopatria leaves to no one (FILLS): Chukotka beyond 180°.
  [2024, [-171, 65.6], 'Russian Federation'],
  [1970, [-171, 65.6], 'Union of Soviet Socialist Republics'],
  // Wrong names and colonies inside others' records (CORRECTIONS).
  [1500, [21.01, 52.23], 'Poland–Lithuania'],
  [1500, [16.37, 48.21], 'Habsburg lands'],
  [1830, [13.4, 52.52], 'Kingdom of Prussia'],
  [1830, [20.5, 54.7], 'Kingdom of Prussia'],
  [1830, [9.73, 52.37], 'Kingdom of Hanover', ['British Empire']],
  [1920, [116.4, 39.9], 'Republic of China', ['Kuomintang']],
  [1930, [3.38, 6.6], 'Colony and Protectorate of Nigeria', ['British Gold Coast']],
  [1914, [-75.7, 45.42], 'Canada', ['British Colonial Empire']],
  [1902, [149.13, -35.28], 'Commonwealth of Australia', ['British Colonial Empire']],
  [1930, [175.5, -39.5], 'New Zealand', ['British Colonial Empire']],
  [1930, [-55.5, 48.5], 'Dominion of Newfoundland', ['British Colonial Empire']],
  [1930, [35.21, 31.77], 'British mandates', ['British Africa']],
  [1980, [69.18, 34.53], 'Democratic Republic of Afghanistan', ['Union of Soviet Socialist Republics']],
  [1990, [69.18, 34.53], 'Republic of Afghanistan', ['Afghanistan Mujahideen']],
  [2003, [69.18, 34.53], 'Islamic Republic of Afghanistan', ['Taliban']],
  // Occupations: the land stays its owner's, the occupier is hatched over it (DE_JURE).
  [1916, [4.35, 50.85], 'Kingdom of Belgium', ['German Empire']],
  [1939, [38.74, 9.03], 'Ethiopian Empire', ['Italian Africa']],
  [1940, [116.4, 39.9], 'Republic of China', ['Empire of Japan']],
  [1942, [21.01, 52.23], 'Second Polish Republic', ['Nazi Germany']],
  [1942, [2.35, 48.86], 'Vichy France', ['Nazi Germany']],
  [1942, [10.75, 59.91], 'Kingdom of Norway', ['Nazi Germany']],
  [1942, [30.52, 50.45], 'Union of Soviet Socialist Republics', ['Nazi Germany']],
  [1943, [51.39, 35.69], 'Pahlavi Dynasty', ['British Empire', 'British Colonial Empire']],
  [1943, [-21.9, 64.15], 'Kingdom of Iceland', ['United States of America']],
  [1947, [10.0, 51.0], 'Germany', ['Union of Soviet Socialist Republics', 'French Fourth Republic']],
  [1946, [16.37, 48.21], 'Second Republic of Austria', ['Union of Soviet Socialist Republics']],
  [1948, [139.69, 35.69], 'Japan', ['United States of America']],
  [1950, [21.01, 52.23], 'Republic of Poland', ['Union of Soviet Socialist Republics']],
  [1960, [24.75, 59.44], 'Estonia', ['Union of Soviet Socialist Republics']],
  [1970, [13.3, 52.5], 'West Berlin'],
  [1970, [13.45, 52.52], 'German Democratic Republic'],
  [1970, [106.7, 10.85], 'Republic of Vietnam', ['United States of America']],
  [1900, [31.24, 30.04], 'Khedivate of Egypt', ['British Africa']],
  [1920, [31.24, 30.04], 'Sultanate of Egypt', ['British Africa']],
  [1920, [28.05, -26.2], 'Union of South Africa', ['British Africa']],
  [1944, [12.49, 41.9], 'Kingdom of Italy', ['Nazi Germany']],
  [1944, [14.8, 40.9], 'Kingdom of Italy'],
  [1933, [116.03, 25.89], 'Republic of China', ['Chinese Soviet Republic']],
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
    for (const [entity, from, to, polygons, label, area, kind] of data.records) {
      if (from < chunk.from && records.some((r) => r.entity === entity && r.from === from && r.to === to)) continue
      records.push({
        entity,
        from,
        to,
        label,
        area,
        // Umbrellas and occupations are drawn over states, not as states.
        outline: !!index.entities[entity].realm || kind >= 1,
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

  checkOverlaps(index, records, problems)
  const map = JSON.parse(await readFile(join(ROOT, 'apps', 'playground', 'app', 'data', 'map-ancient.json'), 'utf8'))
  checkCivilizations(map.points, index, records, problems)

  if (problems.length) {
    console.error(problems.join('\n'))
    console.error(`\n${problems.length} problem(s)`)
    process.exit(1)
  }
  console.log(`ok: ${index.entities.length} states, ${records.length} records, ${PLACES.length} places`)
}

/** Pairs of states one of which lies in the other on purpose (English names). */
const NESTED = [
  // Federates settled on Roman land in 443.
  ['Burgundian Kingdom', 'Western Roman Empire'],
]

/**
 * In sample years: no two filled states share much land (the map would fill
 * it twice, a sign of a duplicate or a stale record), and no two states shown
 * at once carry one Russian name.
 */
function checkOverlaps(index, records, problems) {
  const CELL = 0.5
  const cells = new Map()
  const cellsOf = (record) => {
    if (!cells.has(record)) cells.set(record, new Set(record.polygons.flatMap((polygon) => [...rasterize(polygon, CELL)])))
    return cells.get(record)
  }
  const nameOf = (record) => index.entities[record.entity].en
  const nested = (a, b) => NESTED.some(([x, y]) => (x === a && y === b) || (x === b && y === a))
  const seen = new Set()
  for (let year = -3400; year <= 2024; year += year < 0 ? 50 : year < 1500 ? 25 : 5) {
    const shown = records.filter((record) => !record.outline && record.from <= year && record.to >= year)
    const owner = new Map()
    for (const record of shown) {
      for (const cell of cellsOf(record)) {
        if (!owner.has(cell)) owner.set(cell, [])
        owner.get(cell).push(record)
      }
    }
    const shared = new Map()
    for (const list of owner.values()) {
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          if (list[i].entity === list[j].entity) continue
          const key = [list[i], list[j]]
          const id = key.map(nameOf).sort().join(' and ')
          shared.set(id, { pair: key, count: (shared.get(id)?.count ?? 0) + 1 })
        }
      }
    }
    for (const [id, { pair: [a, b], count }] of shared) {
      const share = count / Math.min(cellsOf(a).size, cellsOf(b).size)
      if (count < 20 || share < 0.5 || nested(nameOf(a), nameOf(b)) || seen.has(id)) continue
      seen.add(id)
      problems.push(`overlap: ${id} fill the same land in ${year} (${Math.round(share * 100)}% of the smaller)`)
    }
    const byRussian = new Map()
    for (const record of shown) {
      const { en, ru } = index.entities[record.entity]
      if (!byRussian.has(ru)) byRussian.set(ru, new Set())
      byRussian.get(ru).add(en)
    }
    for (const [ru, names] of byRussian) {
      const id = 'ru:' + ru
      if (names.size < 2 || seen.has(id)) continue
      seen.add(id)
      problems.push(`name: "${ru}" names ${[...names].join(' and ')} at once in ${year}`)
    }
  }
}

/** Cliopatria may start or end a state a few years off the history books. */
const LAG = 30
/** Shapes are simplified to 0.1°: a capital on the coast can fall just outside. */
const NEAR = 0.25

/**
 * A civilization's periods are chapters: they follow one another from its
 * founding, name states of the layer (`states`, its own; `under`, the rulers
 * of its land), and no state is a chapter of two civilizations. Year by year,
 * the point stands in its chapter's state when that state is on the map, and
 * a state under the point is one of the civilization's or one the chapter was
 * `under`; a run of years longer than LAG that breaks either rule is a problem.
 */
function checkCivilizations(points, index, records, problems) {
  const names = new Set(index.entities.map((entity) => entity.en))
  const stateNames = new Set(index.entities.filter((entity) => !entity.realm).map((entity) => entity.en))
  const firstYear = Math.min(...records.map((record) => record.from))
  const lastYear = Math.max(...records.map((record) => record.to))
  const byCentury = new Map()
  for (const record of records) {
    if (record.outline) continue
    record.box = bounds(record.polygons)
    for (let century = Math.floor(record.from / 100); century <= Math.floor(record.to / 100); century++) {
      if (!byCentury.has(century)) byCentury.set(century, [])
      byCentury.get(century).push(record)
    }
  }
  const shownAt = (year) => (byCentury.get(Math.floor(year / 100)) ?? []).filter((record) => record.from <= year && record.to >= year)
  const near = (record, [x, y]) => {
    const [west, south, east, north] = record.box
    if (x < west - NEAR || x > east + NEAR || y < south - NEAR || y > north + NEAR) return false
    return record.polygons.some((polygon) => distanceToPolygon([x, y], polygon) <= NEAR)
  }
  const nameOf = (record) => index.entities[record.entity].en

  const owner = new Map()
  for (const point of points) {
    const civ = point.name.en
    const periods = point.periods ?? []
    // The state of the chapter before often stays on Cliopatria's map a while longer.
    const chapters = new Set(periods.flatMap((period) => period.states ?? []))
    if (periods[0]?.start !== point.founded) problems.push(`civilization: ${civ} is founded in ${point.founded}, its first chapter starts in ${periods[0]?.start}`)
    for (const [i, period] of periods.entries()) {
      const title = `${civ} "${period.title.en}"`
      if (period.start >= period.end) problems.push(`civilization: ${title} ends before it starts`)
      const next = periods[i + 1]
      if (next && next.start !== period.end) problems.push(`civilization: ${title} ends in ${period.end}, the next chapter starts in ${next.start}`)
      for (const name of period.states ?? []) {
        if (!stateNames.has(name)) problems.push(`civilization: ${title} lists "${name}", which is not in the states layer`)
        const other = owner.get(name)
        if (other && other !== civ) problems.push(`civilization: "${name}" is a chapter of both ${other} and ${civ}`)
        owner.set(name, civ)
      }
      for (const name of period.under ?? []) {
        if (!names.has(name)) problems.push(`civilization: ${title} is under "${name}", which is not in the states layer`)
      }

      const own = new Set(period.states ?? [])
      const known = new Set([...chapters, ...(period.under ?? [])])
      const at = period.at ?? point.at
      let seen = false
      const runs = { outside: null, foreign: null }
      const report = (kind, text) => {
        const run = runs[kind]
        if (run && run.to - run.from + 1 > LAG) problems.push(`civilization: ${title}: ${text(run)} in ${run.from}–${run.to}`)
        runs[kind] = null
      }
      const last = next ? period.end - 1 : period.end
      for (let year = Math.max(period.start, firstYear); year <= Math.min(last, lastYear); year++) {
        const shown = shownAt(year)
        const chapter = shown.filter((record) => own.has(nameOf(record)))
        if (chapter.length) seen = true
        if (chapter.length && !chapter.some((record) => near(record, at))) {
          runs.outside ??= { from: year }
          runs.outside.to = year
        } else {
          report('outside', () => `the point [${at}] is outside its states`)
        }
        const holders = shown.filter((record) => near(record, at))
        if (holders.length && !holders.some((record) => known.has(nameOf(record)))) {
          runs.foreign ??= { from: year, names: new Set() }
          runs.foreign.to = year
          for (const record of holders) runs.foreign.names.add(nameOf(record))
        } else {
          report('foreign', (run) => `the point stands in ${[...run.names].join(', ')}, neither its states nor "under"`)
        }
      }
      report('outside', () => `the point [${at}] is outside its states`)
      report('foreign', (run) => `the point stands in ${[...run.names].join(', ')}, neither its states nor "under"`)
      if (own.size && !seen && period.end > firstYear) problems.push(`civilization: ${title}: none of its states is on the map`)
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
