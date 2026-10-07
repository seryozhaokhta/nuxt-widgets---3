<!--
  The time map's own drawing (TimeMapGeography) filmed full-bleed: a camera
  over longitude/latitude, states for the given year, names placed so they
  don't collide, and pins.
-->
<template>
    <div :class="['reel-map', 'reel-map--' + mode]" :style="{ opacity }">
        <div class="reel-map__world" :style="worldStyle">
            <TimeMapGeography :geography="map.geography" :features="map.features ?? []" :polities="polities"
                :projection="projection" :land-url="landUrl" :year="year" :zoom="camera.zoom * strokeZoom"
                label="World map" />
            <svg v-if="highlighted.length" class="reel-map__highlight" :viewBox="`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`"
                :style="{ '--zoom': camera.zoom * strokeZoom }" aria-hidden="true">
                <path v-for="shape in highlighted" :key="shape.key" :d="shape.d" :style="{ opacity: shape.opacity }" />
            </svg>
        </div>
        <span v-for="label in labels" :key="label.key" :class="['reel-map__label', { 'reel-map__label--strong': label.strong }]"
            :style="label.style">{{ label.text }}</span>
        <svg v-if="placedArcs.length" class="reel-map__arcs" :viewBox="`0 0 ${STAGE.width} ${STAGE.height}`" aria-hidden="true">
            <path v-for="(arc, i) in placedArcs" :key="i" :d="arc.d" pathLength="1"
                :style="{ strokeDashoffset: 1 - arc.progress }" />
        </svg>
        <div v-for="pin in placedPins" :key="pin.id" class="reel-map__pin" :style="pin.style">
            <span class="reel-map__pin-dot" />
            <span v-if="pin.label" :class="['reel-map__pin-label', { 'reel-map__pin-label--left': pin.flip }]">{{ pin.label }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { geoCentroid, geoContains } from 'd3-geo'
import { asTimeMapData, type LonLat } from '@art-widgets/time-map'
import TimeMapGeography from '@art-widgets/time-map/TimeMapGeography.vue'
import { createPath, createProjection, featureGeometry, MAP_HEIGHT, MAP_WIDTH } from '@art-widgets/time-map/geo'
import type { Polity } from '@art-widgets/time-map/usePolities'
import mapJson from '~data/map-ancient.json'
import { loadPolities, politiesAt } from '~/reel/polities'
import { holdFirstFrame, STAGE } from '~/reel/time'
import { clamp } from '~/reel/motion'

export interface MapCamera {
    lon: number
    lat: number
    /** 1: the map's height fills the stage. */
    zoom: number
}

export interface MapArc {
    from: LonLat
    to: LonLat
    /** 0–1: how much of the arc is drawn, from `from`. */
    progress: number
}

export interface MapPin {
    id: string
    at: LonLat
    label?: string
    opacity?: number
}

const props = withDefaults(defineProps<{
    year: number
    camera: MapCamera
    pins?: MapPin[]
    arcs?: MapArc[]
    /** Name states larger than this (km²); 0 hides state names. */
    labelArea?: number
    /** Name cultures, ice sheets and lost lands. */
    featureLabels?: boolean
    opacity?: number
    /** Stroke weight relative to the widget. */
    strokeZoom?: number
    /**
     * "full": the widget's look. "quiet": hairline borders, no fills or
     * names except for highlighted states, so the route and places read first.
     */
    mode?: 'full' | 'quiet'
    /** Places whose state is filled in gold and named; `opacity` fades each one. */
    highlight?: { at: LonLat; opacity?: number }[]
    /** Stage areas kept free of names (captions, UI). */
    avoid?: { x: number; y: number; w: number; h: number }[]
}>(), {
    avoid: () => [],
    mode: 'full',
    highlight: () => [],
    pins: () => [],
    arcs: () => [],
    labelArea: 400_000,
    featureLabels: true,
    opacity: 1,
    strokeZoom: 0.8,
})

const map = asTimeMapData(mapJson)
const projection = createProjection()

/** CSS pixels per map unit when zoom is 1. */
const BASE = STAGE.height / MAP_HEIGHT

const chunks = shallowRef<Awaited<ReturnType<typeof loadPolities>>>([])
onMounted(() => {
    if (map.geography.polities) {
        holdFirstFrame(loadPolities(map.geography.polities).then((loaded) => {
            chunks.value = loaded
        }))
    }
    // The geography component fetches its layers on mount; preload them for the first frame.
    const urls = [map.geography.rivers, map.geography.lakes, map.geography.modernCoast,
        ...map.geography.epochs.map((epoch) => epoch.land)].filter(Boolean) as string[]
    holdFirstFrame(Promise.all([...new Set(urls)].map((url) => fetch(url))))
})

const polities = computed<Polity[]>(() => politiesAt(chunks.value, props.year))

const path = createPath(projection)
const pathCache = new Map<string, string>()

/** The state each highlighted place lies in (realms are skipped: they cover their vassals). */
/** Borders are simplified to 0.1°, so a coastal city can fall just outside its state; look around it too. */
const NEAR = [[0, 0], [0.15, 0], [-0.15, 0], [0, 0.15], [0, -0.15], [0.3, 0.3], [-0.3, 0.3], [0.3, -0.3], [-0.3, -0.3]]

const highlightedPolities = computed(() => {
    const found = new Map<string, { polity: Polity; opacity: number }>()
    for (const place of props.highlight) {
        for (const [dx, dy] of NEAR) {
            const at: LonLat = [place.at[0] + dx!, place.at[1] + dy!]
            const polity = polities.value.find((item) => !item.realm && geoContains(item.geometry, at))
            if (!polity) continue
            // Two places in one state light it once.
            const opacity = Math.max(found.get(polity.key)?.opacity ?? 0, place.opacity ?? 1)
            found.set(polity.key, { polity, opacity })
            break
        }
    }
    return [...found.values()]
})

const highlighted = computed(() => highlightedPolities.value.map(({ polity, opacity }) => {
    let d = pathCache.get(polity.key)
    if (d === undefined) {
        d = path(polity.geometry) ?? ''
        pathCache.set(polity.key, d)
    }
    return { key: polity.key, d, opacity }
}))

const epochs = [...map.geography.epochs].sort((a, b) => a.from - b.from)
const landUrl = computed(() => epochs.reduce((found, epoch) => (epoch.from <= props.year ? epoch.land : found), epochs[0]?.land))

/** Map units → stage pixels for the current camera. */
const view = computed(() => {
    const scale = BASE * props.camera.zoom
    const center = projection([props.camera.lon, props.camera.lat]) ?? [MAP_WIDTH / 2, MAP_HEIGHT / 2]
    return {
        scale,
        x: STAGE.width / 2 - center[0] * scale,
        y: STAGE.height / 2 - center[1] * scale,
    }
})

const worldStyle = computed(() => ({
    width: MAP_WIDTH * BASE + 'px',
    height: MAP_HEIGHT * BASE + 'px',
    transform: `translate(${view.value.x}px, ${view.value.y}px) scale(${props.camera.zoom})`,
}))

function toStage(at: LonLat) {
    const point = projection(at)
    if (!point) return null
    return { x: view.value.x + point[0] * view.value.scale, y: view.value.y + point[1] * view.value.scale }
}

interface Box { x: number; y: number; w: number; h: number }

/** Names move with a transform, not left/top, so they glide instead of stepping a pixel at a time. */
const centredAt = (p: { x: number; y: number }) => `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`
const overlaps = (a: Box, b: Box) => Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.y - b.y) * 2 < a.h + b.h

const labels = computed(() => {
    // Avoid areas are given by their top-left corner; boxes here are centred.
    const placed: Box[] = props.avoid.map((a) => ({ x: a.x + a.w / 2, y: a.y + a.h / 2, w: a.w, h: a.h }))
    const out: { key: string; text: string; style: Record<string, string>; strong?: boolean }[] = []
    const inside = (p: { x: number; y: number }) => p.x > 20 && p.x < STAGE.width - 20 && p.y > 20 && p.y < STAGE.height - 20

    for (const pin of props.pins) {
        const p = toStage(pin.at)
        const width = (pin.label?.length ?? 0) * 7.2 + 16
        const flip = p && p.x + 16 + width > STAGE.width - 8
        if (p) placed.push({ x: p.x, y: p.y, w: 28, h: 28 }, { x: flip ? p.x - 14 - width / 2 : p.x + 14 + width / 2, y: p.y, w: width, h: 20 })
    }
    for (const { polity, opacity } of highlightedPolities.value) {
        const p = toStage(polity.label)
        const text = typeof polity.name === 'string' ? polity.name : polity.name.en
        if (!p || !text) continue
        // Next to the city's pin, the state's name moves to the first free spot around its centre.
        const w = text.length * 8 + 12
        for (const [dx, dy] of [[0, 0], [0, 26], [0, -26], [0, 48], [0, -48], [w / 2 + 20, 0], [-w / 2 - 20, 0]]) {
            const x = clamp(p.x + dx!, 10 + w / 2, STAGE.width - 10 - w / 2)
            const box = { x, y: p.y + dy!, w, h: 20 }
            if (placed.some((other) => overlaps(box, other))) continue
            placed.push(box)
            out.push({ key: 'hl:' + polity.key, text, style: { transform: centredAt(box), opacity: String(opacity) }, strong: true })
            break
        }
    }
    if (props.labelArea > 0 && props.mode === 'full') {
        const states = polities.value.filter((polity) => !polity.realm && polity.area >= props.labelArea)
            .sort((a, b) => b.area - a.area)
        for (const polity of states) {
            const p = toStage(polity.label)
            const text = typeof polity.name === 'string' ? polity.name : polity.name.en
            if (!p || !inside(p) || !text) continue
            const box = { x: p.x, y: p.y, w: text.length * 6.4 + 10, h: 15 }
            if (placed.some((other) => overlaps(box, other))) continue
            placed.push(box)
            // States fade in over their first years, so names don't pop.
            const age = clamp((props.year - polity.from) / 40 + 0.35)
            out.push({ key: polity.key, text, style: { transform: centredAt(p), opacity: String(age) } })
        }
    }
    if (props.featureLabels && props.mode === 'full') {
        for (const feature of map.features ?? []) {
            if (!feature.name || feature.hideLabel || feature.kind === 'state') continue
            if (props.year < feature.from || props.year > feature.to) continue
            const geometry = featureGeometry(feature)
            const at = feature.label ?? (geometry ? (geoCentroid(geometry) as LonLat) : null)
            const p = at && toStage(at)
            const text = typeof feature.name === 'string' ? feature.name : feature.name.en
            if (!p || !inside(p) || !text) continue
            const box = { x: p.x, y: p.y, w: text.length * 6 + 10, h: 15 }
            if (placed.some((other) => overlaps(box, other))) continue
            placed.push(box)
            out.push({ key: feature.id, text, style: { transform: centredAt(p) } })
        }
    }
    return out.map((label) => ({ ...label, style: { ...label.style } }))
})

/** Arcs bow to one side of the straight line, like flight paths. */
const placedArcs = computed(() => props.arcs.flatMap((arc) => {
    const a = toStage(arc.from)
    const b = toStage(arc.to)
    if (!a || !b) return []
    const mx = (a.x + b.x) / 2
    const my = (a.y + b.y) / 2
    const dx = b.x - a.x
    const dy = b.y - a.y
    const bow = 0.3
    const cx = mx + dy * bow
    // Long flights bow less, so the arc stays on screen.
    const cy = my - Math.min(70, Math.abs(dx) * bow) - Math.abs(dy) * 0.1
    return [{ d: `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`, progress: arc.progress }]
}))

const placedPins = computed(() => props.pins.flatMap((pin) => {
    const p = toStage(pin.at)
    if (!p) return []
    const flip = p.x + 16 + (pin.label?.length ?? 0) * 7.2 > STAGE.width - 8
    return [{ ...pin, flip, style: { transform: `translate(${p.x}px, ${p.y}px)`, opacity: String(pin.opacity ?? 1) } }]
}))
</script>

<style scoped>
.reel-map {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: var(--aw-map-sea);
}

.reel-map__world {
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: 0 0;
}

.reel-map__world :deep(.geo__grid) {
    stroke: rgba(242, 238, 230, 0.07);
}

.reel-map__label {
    position: absolute;
    top: 0;
    left: 0;
    color: var(--aw-color-gold-bright);
    font-family: var(--aw-font-sans);
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.01em;
    white-space: nowrap;
    text-shadow: 0 1px 2px #000, 0 0 8px #000;
    pointer-events: none;
}

.reel-map__highlight {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
}

.reel-map__highlight path {
    fill: rgba(201, 164, 106, 0.26);
    stroke: var(--aw-color-gold-bright);
    stroke-width: calc(1.1px / var(--zoom));
    stroke-linejoin: round;
}

/* Quiet: the land and the route first; borders are hairlines, no fills. */
.reel-map--quiet .reel-map__world :deep(.geo__state) {
    fill: none;
    stroke: rgba(201, 164, 106, 0.3);
}

.reel-map--quiet .reel-map__world :deep(.geo__realm) {
    display: none;
}

.reel-map--quiet .reel-map__world :deep(.geo__river) {
    opacity: 0.55;
}

.reel-map--quiet .reel-map__world :deep(.geo__culture),
.reel-map--quiet .reel-map__world :deep(.geo__ice) {
    display: none;
}

.reel-map__label--strong {
    color: var(--aw-color-gold-bright);
    font-family: var(--aw-font-display);
    font-size: 14px;
    font-weight: 600;
    letter-spacing: -0.01em;
}

.reel-map__pin-label--left {
    right: 14px;
    left: auto;
}

.reel-map__arcs {
    position: absolute;
    inset: 0;
    width: 432px;
    height: 768px;
    overflow: visible;
}

.reel-map__arcs path {
    fill: none;
    stroke: var(--aw-color-gold-bright);
    stroke-width: 1.6;
    stroke-dasharray: 1 1;
    filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.9));
}

.reel-map__pin {
    position: absolute;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
}

.reel-map__pin-dot {
    position: absolute;
    left: -6px;
    top: -6px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--aw-color-gold);
    box-shadow: 0 0 0 4px rgba(201, 164, 106, 0.25), 0 0 0 1px #000;
}

.reel-map__pin-label {
    position: absolute;
    left: 14px;
    top: -8px;
    color: var(--aw-color-text);
    font-family: var(--aw-font-mono);
    font-size: 11.5px;
    letter-spacing: 0.04em;
    white-space: nowrap;
    text-shadow: 0 1px 2px #000, 0 0 8px #000;
}
</style>
