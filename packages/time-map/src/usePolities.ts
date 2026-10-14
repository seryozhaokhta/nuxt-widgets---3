import { computed, onMounted, shallowRef, watch, watchEffect, type Ref } from 'vue'
import type { MultiPolygon } from 'geojson'
import type { Localized } from '@art-widgets/core'
import type { LonLat } from './types'

/** A state as it was in a given span of years. */
export interface Polity {
  /** Unique per record (a state has many records as its borders change). */
  key: string
  name: Localized
  from: number
  to: number
  geometry: MultiPolygon
  label: LonLat
  /** km² */
  area: number
  /**
   * An umbrella over other states (a realm with vassals, an empire with
   * colonies, a union whose land its members hold): drawn as an outline.
   */
  realm: boolean
  /** The state across its records; keys its card info. */
  entity: number
}

/** What a state's card shows: its years on the map and its Wikipedia articles. */
export interface PolityInfo {
  from: number
  to: number
  /** Wikipedia titles; '' when there is none. */
  wiki: { en: string; ru: string }
}

interface PolityIndex {
  source: string
  entities: { en: string; ru: string; realm?: 1 }[]
  chunks: { from: number; to: number; file: string }[]
  /** File with a [from, to, enTitle, ruTitle] row per entity. */
  info?: string
}

type RawRecord = [
  entity: number,
  from: number,
  to: number,
  polygons: number[][],
  label: LonLat,
  area: number,
  umbrella?: 1,
]

interface RawChunk {
  rings: number[][]
  records: RawRecord[]
}

/** Rings are hundredths of a degree, delta-encoded: [x0, y0, dx1, dy1, ...]. */
function decodeRing(encoded: number[]): LonLat[] {
  const ring: LonLat[] = []
  let x = 0
  let y = 0
  for (let i = 0; i < encoded.length; i += 2) {
    x += encoded[i] ?? 0
    y += encoded[i + 1] ?? 0
    ring.push([x / 100, y / 100])
  }
  return ring
}

/**
 * States alive in `year`, from a time-chunked layer built by
 * tools/geo/polities.mjs. Only the chunk for the current year (and its
 * neighbours, ahead of time) is fetched.
 */
export function usePolities(indexUrl: () => string | undefined, year: Ref<number>) {
  const index = shallowRef<PolityIndex | null>(null)
  const loaded = shallowRef(new Map<string, Polity[]>())
  const pending = new Map<string, Promise<void>>()
  // A chunk that failed once isn't requested again in this session.
  const failed = new Set<string>()

  async function loadIndex(url: string | undefined) {
    index.value = null
    if (!url) return
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(response.status + ' ' + url)
      index.value = await response.json()
    } catch (error) {
      console.warn('[time-map] states not loaded:', error)
    }
  }

  function loadChunk(file: string) {
    const url = indexUrl()
    if (!url || loaded.value.has(file) || pending.has(file) || failed.has(file)) return
    const entities = index.value?.entities ?? []
    const task = fetch(new URL(file, new URL(url, location.href)))
      .then((response) => {
        if (!response.ok) throw new Error(response.status + ' ' + file)
        return response.json() as Promise<RawChunk>
      })
      .then((chunk) => {
        const rings = chunk.rings.map(decodeRing)
        const polities = chunk.records.map(([entity, from, to, polygons, label, area, umbrella]): Polity => ({
          // The same record sits in every chunk it spans; one key keeps its shape across them.
          key: [entity, from, to, label].join(':'),
          name: entities[entity] ?? '',
          realm: !!entities[entity]?.realm || umbrella === 1,
          entity,
          from,
          to,
          geometry: { type: 'MultiPolygon', coordinates: polygons.map((polygon) => polygon.map((ring) => rings[ring] ?? [])) },
          label,
          area,
        }))
        loaded.value = new Map(loaded.value).set(file, polities)
      })
      .catch((error) => {
        failed.add(file)
        console.warn('[time-map] states not loaded:', error)
      })
      .finally(() => pending.delete(file))
    pending.set(file, task)
  }

  const chunkIndex = computed(() =>
    index.value?.chunks.findIndex((chunk) => chunk.from <= year.value && year.value <= chunk.to) ?? -1)

  onMounted(() => {
    loadIndex(indexUrl())
    watch(indexUrl, loadIndex)
    // The current chunk, plus its neighbours so the slider doesn't wait at the edges.
    watch([index, chunkIndex], ([current, at]) => {
      if (!current || at < 0) return
      for (const i of [at, at + 1, at - 1]) {
        const chunk = current.chunks[i]
        if (chunk) loadChunk(chunk.file)
      }
    }, { immediate: true })
  })

  // Larger states first, so smaller ones inside them (vassals, enclaves) are drawn on top.
  const polities = shallowRef<Polity[]>([])
  watchEffect(() => {
    const chunk = index.value?.chunks[chunkIndex.value]
    if (!chunk) {
      polities.value = []
      return
    }
    const records = loaded.value.get(chunk.file)
    // While the chunk for a new year loads, the last year's states stay up
    // instead of the map going blank.
    if (!records) return
    polities.value = records
      .filter((polity) => polity.from <= year.value && year.value <= polity.to)
      .sort((a, b) => b.area - a.area)
  })

  // Card info for all states, fetched on the first click on a state.
  let info: Promise<PolityInfo[] | null> | null = null
  async function polityInfo(polity: Polity): Promise<PolityInfo | null> {
    const url = indexUrl()
    const file = index.value?.info
    if (!url || !file) return null
    info ??= fetch(new URL(file, new URL(url, location.href)))
      .then((response) => {
        if (!response.ok) throw new Error(response.status + ' ' + file)
        return response.json() as Promise<[number, number, string, string][]>
      })
      .then((rows) => rows.map(([from, to, en, ru]) => ({ from, to, wiki: { en, ru } })))
      .catch((error) => {
        // Asked again on the next click.
        info = null
        console.warn('[time-map] state info not loaded:', error)
        return null
      })
    return (await info)?.[polity.entity] ?? null
  }

  return { polities, polityInfo, source: computed(() => index.value?.source ?? '') }
}
