<!--
  The time map's own drawing (TimeMapGeography) filmed full-bleed: a camera
  over longitude/latitude, states for the given year, names placed so they
  don't collide, and pins.
-->
<template>
    <div class="reel-map" :style="{ opacity }">
        <div class="reel-map__world" :style="worldStyle">
            <TimeMapGeography :geography="map.geography" :features="map.features ?? []" :polities="polities"
                :projection="projection" :land-url="landUrl" :year="year" :zoom="camera.zoom * strokeZoom"
                label="World map" />
        </div>
        <span v-for="label in labels" :key="label.key" class="reel-map__label" :style="label.style">{{ label.text }}</span>
        <div v-for="pin in placedPins" :key="pin.id" class="reel-map__pin" :style="pin.style">
            <span class="reel-map__pin-dot" />
            <span v-if="pin.label" class="reel-map__pin-label">{{ pin.label }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { geoCentroid } from 'd3-geo'
import { asTimeMapData, type LonLat } from '@art-widgets/time-map'
import TimeMapGeography from '@art-widgets/time-map/TimeMapGeography.vue'
import { createProjection, featureGeometry, MAP_HEIGHT, MAP_WIDTH } from '@art-widgets/time-map/geo'
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
    /** Name states larger than this (km²); 0 hides state names. */
    labelArea?: number
    /** Name cultures, ice sheets and lost lands. */
    featureLabels?: boolean
    opacity?: number
    /** Stroke weight relative to the widget. */
    strokeZoom?: number
    /** Stage areas kept free of names (captions, UI). */
    avoid?: { x: number; y: number; w: number; h: number }[]
}>(), {
    avoid: () => [],
    pins: () => [],
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
const overlaps = (a: Box, b: Box) => Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.y - b.y) * 2 < a.h + b.h

const labels = computed(() => {
    // Avoid areas are given by their top-left corner; boxes here are centred.
    const placed: Box[] = props.avoid.map((a) => ({ x: a.x + a.w / 2, y: a.y + a.h / 2, w: a.w, h: a.h }))
    const out: { key: string; text: string; style: Record<string, string> }[] = []
    const inside = (p: { x: number; y: number }) => p.x > 20 && p.x < STAGE.width - 20 && p.y > 20 && p.y < STAGE.height - 20

    for (const pin of props.pins) {
        const p = toStage(pin.at)
        if (p) placed.push({ x: p.x, y: p.y, w: 24, h: 24 }, { x: p.x + 50, y: p.y, w: 100, h: 18 })
    }
    if (props.labelArea > 0) {
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
            out.push({ key: polity.key, text, style: { left: p.x + 'px', top: p.y + 'px', opacity: String(age) } })
        }
    }
    if (props.featureLabels) {
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
            out.push({ key: feature.id, text, style: { left: p.x + 'px', top: p.y + 'px' } })
        }
    }
    return out.map((label) => ({ ...label, style: { ...label.style } }))
})

const placedPins = computed(() => props.pins.flatMap((pin) => {
    const p = toStage(pin.at)
    if (!p) return []
    return [{ ...pin, style: { left: p.x + 'px', top: p.y + 'px', opacity: String(pin.opacity ?? 1) } }]
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
    transform: translate(-50%, -50%);
    color: var(--aw-color-gold-bright);
    font-family: var(--aw-font-sans);
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.01em;
    white-space: nowrap;
    text-shadow: 0 1px 2px #000, 0 0 8px #000;
    pointer-events: none;
}

.reel-map__pin {
    position: absolute;
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
    font-size: 11px;
    letter-spacing: 0.04em;
    white-space: nowrap;
    text-shadow: 0 1px 2px #000, 0 0 8px #000;
}
</style>
