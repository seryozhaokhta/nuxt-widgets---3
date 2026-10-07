import type { Polity } from '@art-widgets/time-map/usePolities'
import type { LonLat } from '@art-widgets/time-map'

// The map widget fetches state borders chunk by chunk as the slider moves.
// A reel races through 12,000 years in seconds, so it loads every chunk up
// front. The format is the one tools/geo/polities.mjs writes (see usePolities).

interface PolityIndex {
    entities: { en: string; ru: string; realm?: 1 }[]
    chunks: { from: number; to: number; file: string }[]
}

type RawRecord = [entity: number, from: number, to: number, polygons: number[][], label: LonLat, area: number]

interface Chunk {
    from: number
    to: number
    polities: Polity[]
}

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

const cache = new Map<string, Promise<Chunk[]>>()

export function loadPolities(indexUrl: string): Promise<Chunk[]> {
    let task = cache.get(indexUrl)
    if (!task) {
        task = (async () => {
            const base = new URL(indexUrl, location.href)
            const index: PolityIndex = await (await fetch(base)).json()
            return Promise.all(index.chunks.map(async (chunk) => {
                const raw: { rings: number[][]; records: RawRecord[] } = await (await fetch(new URL(chunk.file, base))).json()
                const rings = raw.rings.map(decodeRing)
                const polities = raw.records.map(([entity, from, to, polygons, label, area], i): Polity => ({
                    key: chunk.file + ':' + i,
                    name: index.entities[entity] ?? '',
                    realm: !!index.entities[entity]?.realm,
                    from,
                    to,
                    geometry: { type: 'MultiPolygon', coordinates: polygons.map((polygon) => polygon.map((ring) => rings[ring] ?? [])) },
                    label,
                    area,
                }))
                return { from: chunk.from, to: chunk.to, polities }
            }))
        })()
        cache.set(indexUrl, task)
    }
    return task
}

export function politiesAt(chunks: Chunk[], year: number): Polity[] {
    const chunk = chunks.find((item) => item.from <= year && year <= item.to)
    return chunk?.polities.filter((polity) => polity.from <= year && year <= polity.to) ?? []
}
