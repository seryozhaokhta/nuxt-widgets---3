<!--
  Historical world map with a year slider: coastlines change with sea level,
  areas and points appear and disappear with their dates.
-->
<template>
    <div class="time-map" :lang="locale" @keydown.esc="panelRef?.close()">
        <header class="time-map__header">
            <div class="time-map__heading">
                <p v-if="data.title" class="time-map__eyebrow">{{ l(data.title) }}</p>
                <p v-if="seaLevelText" class="time-map__eyebrow time-map__sea-level">{{ seaLevelText }}</p>
            </div>
            <p ref="yearRef" class="time-map__year">{{ year(displayYear) }}</p>
        </header>

        <div class="time-map__stage">
            <div ref="viewportRef" class="time-map__viewport" v-on="panZoomHandlers">
                <div class="time-map__content" :style="panZoomStyle">
                    <TimeMapGeography :geography="data.geography" :features="features" :projection="projection"
                        :epoch-index="epochIndex" :year="currentYear" :zoom="scale"
                        :label="l(data.title) || t('worldMap')" />
                    <span v-for="label in labels" :key="label.id"
                        :class="['time-map__label', 'time-map__label--' + label.kind, { 'time-map__label--visible': label.visible }]"
                        :style="label.style" aria-hidden="true">{{ label.text }}</span>
                    <TimeMapMarker v-for="marker in markers" :key="marker.point.id" :point="marker.point" :x="marker.x"
                        :y="marker.y" :visible="marker.point.founded <= currentYear"
                        :active="marker.point.id === selected?.id" :zoom="scale" @select="selectPoint(marker.point)" />
                </div>

                <div class="time-map__zoom" @mousedown.stop @touchstart.stop>
                    <IconButton icon="plus" variant="glass" size="sm" :label="t('zoomIn')" @click="zoomIn" />
                    <IconButton icon="minus" variant="glass" size="sm" :label="t('zoomOut')" @click="zoomOut" />
                    <IconButton icon="fit" variant="glass" size="sm" :label="t('resetView')" :disabled="!isZoomed"
                        @click="resetView" />
                </div>

                <Transition name="time-map-hint">
                    <p v-if="showWheelHint" class="time-map__hint">{{ t('wheelHint') }}</p>
                </Transition>
            </div>

            <TimeMapPanel v-if="selected" ref="panelRef" v-model:period-index="periodIndex" class="time-map__panel"
                :point="selected" @select-period="onPeriodSelected" @closed="onPanelClosed" />
        </div>

        <YearSlider v-model="currentYear" class="time-map__slider" :min="minYear" :max="maxYear" :step="yearStep"
            :marks="points.map((point) => point.founded)" />
        <TimeMapLegend class="time-map__legend" :kinds="featureKinds" :show-coast="!!data.geography.modernCoast"
            :credits="l(data.credits)" />
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { refDebounced, useElementSize } from '@vueuse/core'
import { geoCentroid } from 'd3-geo'
import gsap from 'gsap'
import { provideI18n, usePanZoom, type Locale, type Year } from '@art-widgets/core'
import { IconButton } from '@art-widgets/ui'
import TimeMapGeography from './TimeMapGeography.vue'
import TimeMapLegend from './TimeMapLegend.vue'
import TimeMapMarker from './TimeMapMarker.vue'
import TimeMapPanel from './TimeMapPanel.vue'
import YearSlider from './YearSlider.vue'
import { createProjection, featureGeometry, MAP_HEIGHT, MAP_WIDTH } from './geo'
import type { LonLat, TimeMapData, TimeMapPeriod, TimeMapPoint } from './types'

const props = defineProps<{
    data: TimeMapData
    locale?: Locale
}>()

const { t, l, year, locale } = provideI18n(() => props.locale)

const projection = createProjection()

/** Map position of a place, in percent of the map's width and height. */
function toPercent(at: LonLat): { x: number; y: number } | null {
    const projected = projection(at)
    return projected ? { x: (projected[0] / MAP_WIDTH) * 100, y: (projected[1] / MAP_HEIGHT) * 100 } : null
}

const points = computed(() => [...props.data.points].sort((a, b) => a.founded - b.founded))
const features = computed(() => props.data.features ?? [])
const featureKinds = computed(() => new Set(features.value.map((feature) => feature.kind)))
const epochs = computed(() => [...props.data.geography.epochs].sort((a, b) => a.from - b.from))
const yearStep = computed(() => props.data.yearStep ?? 50)

// Default range: from the earliest founding to the latest date in the data,
// rounded up to the slider's step.
const minYear = computed(() =>
    props.data.range?.start ?? Math.min(...props.data.points.map((point) => point.founded)))
const maxYear = computed(() => {
    if (props.data.range?.end !== undefined) return props.data.range.end
    const latest = Math.max(...props.data.points.flatMap((point) =>
        [point.founded, ...(point.periods ?? []).map((period) => period.end)]))
    return minYear.value + Math.ceil((latest - minYear.value) / yearStep.value) * yearStep.value
})

const currentYear = ref(minYear.value)
const displayYear = refDebounced(currentYear, 100)

const yearRef = ref<HTMLElement | null>(null)
watch(displayYear, () => {
    if (yearRef.value) gsap.fromTo(yearRef.value, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.3 })
})

/** The latest epoch that has begun; before the first one, the first. */
const epochIndex = computed(() =>
    epochs.value.reduce((found, epoch, index) => (epoch.from <= currentYear.value ? index : found), 0))

const seaLevelText = computed(() => {
    const level = epochs.value[epochIndex.value]?.seaLevel
    if (level === undefined) return ''
    return level >= 0 ? t('seaLevelToday') : t('seaLevel', { value: '−' + Math.abs(level) })
})

const viewportRef = ref<HTMLElement | null>(null)
const {
    scale,
    style: panZoomStyle,
    handlers: panZoomHandlers,
    showWheelHint,
    isZoomed,
    zoomIn,
    zoomOut,
    reset: resetView,
    centerOn,
} = usePanZoom(viewportRef, { minZoom: 1, maxZoom: 8, step: 0.5 })

onMounted(() => {
    const view = props.data.view
    const center = view && toPercent(view.center)
    if (view && center) centerOn(center.x / 100, center.y / 100, view.zoom)
})

const markers = computed(() => points.value.flatMap((point) => {
    const position = toPercent(point.at)
    return position ? [{ point, ...position }] : []
}))

// Names of areas show once the map is zoomed in enough to tell them apart;
// names of places (land bridges, lakes) show at any zoom.
const AREA_LABEL_ZOOM = 1.6
const LABEL_PRIORITY: Record<string, number> = { state: 0, culture: 1, water: 1, river: 1, ice: 1, place: 2 }

const { width: mapWidth } = useElementSize(viewportRef)

interface Box {
    x: number
    y: number
    width: number
    height: number
}

const overlaps = (a: Box, b: Box) =>
    Math.abs(a.x - b.x) * 2 < a.width + b.width && Math.abs(a.y - b.y) * 2 < a.height + b.height

/** Screen position (px) of a map position given in percent, at the current zoom. */
function onScreen(position: { x: number; y: number }) {
    const width = mapWidth.value * scale.value
    return { x: (position.x / 100) * width, y: (position.y / 100) * width * (MAP_HEIGHT / MAP_WIDTH) }
}

const labels = computed(() => {
    const candidates = features.value.flatMap((feature) => {
        if (!feature.name || feature.hideLabel) return []
        const geometry = featureGeometry(feature)
        const at = feature.label ?? (geometry ? (geoCentroid(geometry) as LonLat) : null)
        const position = at && toPercent(at)
        if (!position) return []
        const active = feature.from <= currentYear.value && currentYear.value <= feature.to
        return [{
            id: feature.id,
            kind: feature.kind,
            text: l(feature.name),
            position,
            wanted: active && (feature.kind === 'place' || scale.value >= AREA_LABEL_ZOOM),
        }]
    })

    // Greedy placement: visible points (dot and name) come first, then areas
    // by importance; a name that would overlap one already placed waits for
    // more zoom. Sizes are estimates for 11–12 px text.
    const placed: Box[] = markers.value
        .filter((marker) => marker.point.founded <= currentYear.value)
        .flatMap((marker) => {
            const { x, y } = onScreen(marker)
            const name = l(marker.point.name)
            return [{ x, y, width: 22, height: 22 }, { x, y: y - 19, width: name.length * 6.8 + 8, height: 16 }]
        })
    const shown = new Set<string>()
    const order = candidates
        .filter((label) => label.wanted)
        .sort((a, b) => (LABEL_PRIORITY[a.kind] ?? 9) - (LABEL_PRIORITY[b.kind] ?? 9))
    for (const label of order) {
        const box = { ...onScreen(label.position), width: label.text.length * 6.2 + 8, height: 15 }
        if (placed.some((other) => overlaps(box, other))) continue
        placed.push(box)
        shown.add(label.id)
    }

    return candidates.map((label) => ({
        id: label.id,
        kind: label.kind,
        text: label.text,
        visible: shown.has(label.id),
        style: {
            left: label.position.x + '%',
            top: label.position.y + '%',
            transform: 'translate(-50%, -50%) scale(' + 1 / scale.value + ')',
        },
    }))
})

// Panel of the selected point. Selecting another point while the panel is
// open closes it first and reopens it with the new point.
const panelRef = ref<InstanceType<typeof TimeMapPanel> | null>(null)
const selected = ref<TimeMapPoint | null>(null)
const periodIndex = ref(0)
let pending: TimeMapPoint | null = null

function periodIndexAt(point: TimeMapPoint, at: Year): number {
    return point.periods?.findIndex((period) => at >= period.start && at <= period.end) ?? -1
}

function show(point: TimeMapPoint) {
    selected.value = point
    periodIndex.value = Math.max(0, periodIndexAt(point, currentYear.value))
}

function selectPoint(point: TimeMapPoint) {
    if (selected.value) {
        pending = point
        panelRef.value?.close()
    } else {
        show(point)
    }
}

function onPanelClosed() {
    if (pending) {
        show(pending)
        pending = null
        nextTick(() => panelRef.value?.open())
    } else {
        selected.value = null
    }
}

// Year and period follow each other: picking a period moves the slider to its
// middle; moving the slider out of the shown period switches to the matching one.
function onPeriodSelected(period: TimeMapPeriod) {
    const middle = Math.floor((period.start + period.end) / 2)
    currentYear.value = Math.min(Math.max(middle, minYear.value), maxYear.value)
}

watch(currentYear, (now) => {
    const point = selected.value
    if (!point) return
    const shown = point.periods?.[periodIndex.value]
    if (shown && now >= shown.start && now <= shown.end) return
    const index = periodIndexAt(point, now)
    if (index !== -1) periodIndex.value = index
})
</script>

<style scoped>
.time-map {
    container-type: inline-size;
    display: flex;
    flex-direction: column;
    width: 100%;
    color: var(--aw-color-text);
    font-family: var(--aw-font-sans);
}

.time-map__header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 14px;
}

.time-map__heading {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.time-map__eyebrow {
    margin: 0;
    color: var(--aw-color-text-subtle);
    font-family: var(--aw-font-mono);
    font-size: var(--aw-label-size);
    font-weight: 400;
}

.time-map__sea-level {
    color: var(--aw-color-text-muted);
}

.time-map__year {
    margin: 0 0 0 auto;
    font-family: var(--aw-font-display);
    font-size: 40px;
    font-weight: 600;
    letter-spacing: var(--aw-tracking-heading);
    line-height: 1;
    font-variant-numeric: lining-nums tabular-nums;
}

.time-map__stage {
    position: relative;
}

.time-map__viewport {
    position: relative;
    overflow: hidden;
    aspect-ratio: 16 / 9;
    border-radius: var(--aw-radius-md);
    background-color: var(--aw-color-bg);
    box-shadow: 0 0 0 1px var(--aw-color-line);
    cursor: grab;
}

.time-map__viewport:active {
    cursor: grabbing;
}

.time-map__content {
    position: absolute;
    inset: 0;
    transform-origin: top left;
}

.time-map__label {
    position: absolute;
    color: var(--aw-color-text-muted);
    font-size: 11px;
    line-height: 1;
    white-space: nowrap;
    text-shadow: 0 1px 2px #000, 0 0 6px #000;
    opacity: 0;
    pointer-events: none;
    transform-origin: center;
    transition: opacity 0.4s var(--aw-ease);
}

.time-map__label--visible {
    opacity: 1;
}

.time-map__label--state {
    color: var(--aw-color-gold-bright);
    font-weight: 600;
    letter-spacing: 0.01em;
}

.time-map__label--culture,
.time-map__label--ice,
.time-map__label--water,
.time-map__label--river {
    font-style: italic;
}

.time-map__label--place {
    color: var(--aw-color-text-subtle);
    font-family: var(--aw-font-mono);
    font-size: 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.time-map__zoom {
    position: absolute;
    top: 12px;
    left: 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    cursor: default;
}

.time-map__hint {
    position: absolute;
    left: 50%;
    bottom: 16px;
    margin: 0;
    padding: 8px 14px;
    transform: translateX(-50%);
    border-radius: var(--aw-radius-pill);
    background-color: var(--aw-color-scrim);
    backdrop-filter: blur(var(--aw-blur));
    -webkit-backdrop-filter: blur(var(--aw-blur));
    box-shadow: 0 0 0 1px var(--aw-color-line);
    color: var(--aw-color-text);
    font-size: var(--aw-text-sm);
    white-space: nowrap;
    pointer-events: none;
}

.time-map-hint-enter-active,
.time-map-hint-leave-active {
    transition: opacity var(--aw-duration) var(--aw-ease);
}

.time-map-hint-enter-from,
.time-map-hint-leave-to {
    opacity: 0;
}

.time-map__slider {
    margin-top: 16px;
}

.time-map__legend {
    margin-top: 14px;
}

/* Narrow: the panel moves under the slider instead of covering the map. */
@container (max-width: 760px) {
    .time-map__stage {
        display: contents;
    }

    .time-map__slider {
        order: 1;
    }

    .time-map__legend {
        order: 2;
    }

    .time-map__panel {
        order: 3;
    }
}

@container (max-width: 560px) {
    .time-map__year {
        font-size: 30px;
    }

    .time-map__hint {
        width: max-content;
        max-width: calc(100% - 32px);
        white-space: normal;
        text-align: center;
    }
}
</style>
