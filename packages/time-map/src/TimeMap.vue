<!--
  Historical world map with a year slider: coastlines change with sea level,
  areas and points appear and disappear with their dates.
-->
<template>
    <div class="time-map" :lang="locale" @keydown.esc="onEscape">
        <header class="time-map__header">
            <div class="time-map__heading">
                <p v-if="data.title" class="time-map__eyebrow">{{ l(data.title) }}</p>
                <p v-if="seaLevelText" class="time-map__eyebrow time-map__sea-level">{{ seaLevelText }}</p>
            </div>
            <p ref="yearRef" class="time-map__year">{{ year(displayYear) }}</p>
        </header>

        <div class="time-map__stage">
            <div ref="viewportRef" class="time-map__viewport" v-on="panZoomHandlers" @pointerdown="onPointerDown"
                @click="onMapClick">
                <div class="time-map__content" :style="panZoomStyle">
                    <TimeMapGeography :geography="data.geography" :features="features" :polities="polities"
                        :projection="projection"
                        :land-url="epochs[epochIndex]?.land" :year="currentYear" :zoom="scale"
                        :label="l(data.title) || t('worldMap')" />
                    <span v-for="label in labels" :key="label.id"
                        :class="['time-map__label', 'time-map__label--' + label.kind, { 'time-map__label--visible': label.visible }]"
                        :style="label.style" :data-polity="label.kind === 'state' ? label.id : undefined"
                        aria-hidden="true">{{ label.text }}</span>
                    <TimeMapMarker v-for="marker in markers" :key="marker.point.id" :point="marker.point"
                        :name="marker.name" :x="marker.x" :y="marker.y" :visible="isOnMap(marker.point)"
                        :active="marker.point.id === subject?.point?.id" :zoom="scale"
                        @select="selectPoint(marker.point)" />
                </div>

                <div ref="zoomRef" class="time-map__zoom" @mousedown.stop @touchstart.stop>
                    <IconButton icon="plus" variant="glass" size="sm" :label="t('zoomIn')" @click="zoomIn" />
                    <IconButton icon="minus" variant="glass" size="sm" :label="t('zoomOut')" @click="zoomOut" />
                    <IconButton icon="fit" variant="glass" size="sm" :label="t('resetView')" :disabled="!isZoomed"
                        @click="resetView" />
                </div>

                <Transition name="time-map-hint">
                    <p v-if="showWheelHint" class="time-map__hint">{{ t(hintKind === 'touch' ? 'touchHint' : 'wheelHint') }}</p>
                </Transition>
            </div>

            <TimeMapPanel v-if="subject" ref="panelRef" v-model:period-index="periodIndex" class="time-map__panel"
                :point="subject.point" :state="subject.state && { name: subject.state.polity.name, info: subject.state.info }"
                @select-period="onPeriodSelected" @closed="onPanelClosed" />
        </div>

        <YearSlider v-model="currentYear" class="time-map__slider" :min="minYear" :max="maxYear" :step="yearStep"
            :scale="data.timeScale" :ticks="data.ticks" :eras="data.eras" :ideas="data.ideas" />
        <TimeMapLegend class="time-map__legend" :kinds="featureKinds" :show-coast="!!data.geography.modernCoast"
            :show-borders="!!data.geography.borders" :credits="l(data.credits)" :sources="data.sources" />
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { refDebounced, useElementSize } from '@vueuse/core'
import { geoCentroid, geoContains } from 'd3-geo'
import gsap from 'gsap'
import { provideI18n, usePanZoom, type Locale, type Year } from '@art-widgets/core'
import { IconButton } from '@art-widgets/ui'
import TimeMapGeography from './TimeMapGeography.vue'
import { usePolities, type Polity, type PolityInfo } from './usePolities'
import TimeMapLegend from './TimeMapLegend.vue'
import TimeMapMarker from './TimeMapMarker.vue'
import TimeMapPanel from './TimeMapPanel.vue'
import YearSlider from './YearSlider.vue'
import { createProjection, featureGeometry, MAP_HEIGHT, MAP_WIDTH } from './geo'
import type { LonLat, TimeMapData, TimeMapPeriod, TimeMapPoint } from './types'

const props = defineProps<{
    data: TimeMapData
    locale?: Locale
    /** Year to open at (e.g. from the page's URL); the slider reports changes with update:year. */
    year?: Year
}>()

const emit = defineEmits<{ 'update:year': [year: Year] }>()

const { t, l, year, locale } = provideI18n(() => props.locale)

const projection = createProjection()

// Rounded so that the server (Node) and the browser, whose trigonometry can
// differ in the last digits, render the same styles and hydrate cleanly.
const round = (value: number) => Math.round(value * 1e4) / 1e4

/** Map position of a place, in percent of the map's width and height. */
function toPercent(at: LonLat): { x: number; y: number } | null {
    const projected = projection(at)
    return projected ? { x: round((projected[0] / MAP_WIDTH) * 100), y: round((projected[1] / MAP_HEIGHT) * 100) } : null
}

const points = computed(() => [...props.data.points].sort((a, b) => a.founded - b.founded))
const features = computed(() => props.data.features ?? [])
const featureKinds = computed(() => new Set([
    ...features.value.map((feature) => feature.kind),
    ...(props.data.geography.polities ? (['state'] as const) : []),
]))
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

/** A year inside the slider's range; there is no year 0. */
function clampYear(value: number): Year {
    const clamped = Math.round(Math.min(maxYear.value, Math.max(minYear.value, value)))
    return clamped === 0 ? 1 : clamped
}

const currentYear = ref(props.year === undefined ? minYear.value : clampYear(props.year))
const displayYear = refDebounced(currentYear, 100)

watch(() => props.year, (next) => {
    if (next !== undefined && clampYear(next) !== currentYear.value) currentYear.value = clampYear(next)
})
watch(currentYear, (next) => emit('update:year', next))

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

const { polities, polityInfo } = usePolities(() => props.data.geography.polities, currentYear)

const viewportRef = ref<HTMLElement | null>(null)
const {
    scale,
    offset,
    style: panZoomStyle,
    handlers: panZoomHandlers,
    showWheelHint,
    hintKind,
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

// ---------------------------------------------------------------- clicks on states

/** A click on a state opens it in the panel; a drag that pans the map doesn't. */
let pressedAt: { x: number; y: number } | null = null

function onPointerDown(event: PointerEvent) {
    pressedAt = { x: event.clientX, y: event.clientY }
}

/** The topmost (so the smallest) filled state under a point of the viewport. */
function polityAt(clientX: number, clientY: number): Polity | null {
    const rect = viewportRef.value?.getBoundingClientRect()
    if (!rect?.width) return null
    const x = ((clientX - rect.left - offset.value.x) / scale.value / rect.width) * MAP_WIDTH
    const y = ((clientY - rect.top - offset.value.y) / scale.value / rect.height) * MAP_HEIGHT
    const at = projection.invert?.([x, y])
    if (!at) return null
    return [...polities.value].reverse().find((polity) => !polity.realm && geoContains(polity.geometry, at)) ?? null
}

function onMapClick(event: MouseEvent) {
    const target = event.target as Element
    if (target.closest('button, a')) return
    if (pressedAt && Math.hypot(event.clientX - pressedAt.x, event.clientY - pressedAt.y) > 5) return
    // A name may stand a little off its state to make room for others; it
    // still opens its own state.
    const key = target.closest<HTMLElement>('[data-polity]')?.dataset.polity
    const polity = (key && polities.value.find((item) => item.key === key)) || polityAt(event.clientX, event.clientY)
    if (polity) selectState(polity)
}

function onEscape() {
    panelRef.value?.close()
}

/** A point shows from its founding until `until` or the end of its last period. */
function isOnMap(point: TimeMapPoint): boolean {
    const ends = (point.periods ?? []).map((period) => period.end)
    const until = point.until ?? (ends.length ? Math.max(...ends) : Infinity)
    return point.founded <= currentYear.value && currentYear.value <= until
}

// A period may move a point and rename it (Rome's empire goes on in Constantinople).
const markers = computed(() => points.value.flatMap((point) => {
    const period = point.periods?.[periodIndexAt(point, currentYear.value)]
    const position = toPercent(period?.at ?? point.at)
    return position ? [{ point, name: period?.name ?? point.name, ...position }] : []
}))

// Names of areas show once the map is zoomed in enough to tell them apart;
// names of places (land bridges, lakes) show at any zoom.
const AREA_LABEL_ZOOM = 1.6
/** States this large (km²) are named even on the whole-world view. */
const BIG_STATE = 1_500_000
const LABEL_PRIORITY: Record<string, number> = { state: 0, culture: 1, water: 1, river: 1, ice: 1, place: 2 }

const { width: mapWidth, height: mapHeight } = useElementSize(viewportRef)
const zoomRef = ref<HTMLElement | null>(null)
const { width: zoomWidth, height: zoomHeight } = useElementSize(zoomRef)
// Names are placed for the part of the map in view, once a drag settles.
const settledOffset = refDebounced(offset, 120)
/** Names keep this far from the edges of the view, px. */
const EDGE = 4

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
    // A state drawn in several records at once (a part joined from elsewhere)
    // is named once, on its largest record; one a civilization's point already
    // names (Byzantium) isn't named again.
    const named = new Set<string>(markers.value.filter((marker) => isOnMap(marker.point)).map((marker) => l(marker.name)))
    const stateLabels = polities.value
        .filter((polity) => !polity.realm)
        .sort((a, b) => b.area - a.area)
        .flatMap((polity) => {
            const text = l(polity.name)
            if (named.has(text)) return []
            named.add(text)
            const position = toPercent(polity.label)
            if (!position) return []
            return [{
                id: polity.key,
                kind: 'state' as const,
                text,
                position,
                wanted: scale.value >= AREA_LABEL_ZOOM || polity.area >= BIG_STATE,
            }]
        })
    const featureLabels = features.value.flatMap((feature) => {
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
    const candidates = [...stateLabels, ...featureLabels]

    // Greedy placement: visible points (dot and name) come first, then areas
    // by importance; a name that would overlap one already placed waits for
    // more zoom. Sizes are estimates for 11–12 px text.
    const placed: Box[] = markers.value
        .filter((marker) => isOnMap(marker.point))
        .flatMap((marker) => {
            const { x, y } = onScreen(marker)
            const name = l(marker.name)
            return [{ x, y, width: 22, height: 22 }, { x, y: y - 19, width: name.length * 6.8 + 8, height: 16 }]
        })
    // The part of the zoomed map in view, in the same pixels as onScreen; the
    // zoom buttons in its corner count as taken.
    const left = -settledOffset.value.x
    const top = -settledOffset.value.y
    const view = { left: left + EDGE, top: top + EDGE, right: left + mapWidth.value - EDGE, bottom: top + mapHeight.value - EDGE }
    placed.push({
        x: left + 12 + zoomWidth.value / 2,
        y: top + 12 + zoomHeight.value / 2,
        width: zoomWidth.value + 8,
        height: zoomHeight.value + 8,
    })
    const inView = (box: Box) => box.x - box.width / 2 >= view.left && box.x + box.width / 2 <= view.right
        && box.y - box.height / 2 >= view.top && box.y + box.height / 2 <= view.bottom
    // A name that collides or runs off the view tries a few nearby spots before giving up.
    const shown = new Map<string, { x: number; y: number }>()
    const order = candidates
        .filter((label) => label.wanted)
        .sort((a, b) => (LABEL_PRIORITY[a.kind] ?? 9) - (LABEL_PRIORITY[b.kind] ?? 9))
    for (const label of order) {
        const width = label.text.length * 6.2 + 8
        const center = onScreen(label.position)
        const nudges = [[0, 0], [0, 16], [0, -16], [width / 2 + 8, 0], [-width / 2 - 8, 0]] as const
        for (const [dx, dy] of nudges) {
            const box = { x: center.x + dx, y: center.y + dy, width, height: 15 }
            if (!inView(box) || placed.some((other) => overlaps(box, other))) continue
            placed.push(box)
            shown.set(label.id, { x: dx, y: dy })
            break
        }
    }

    // Nudges are in screen pixels; positions are in percent of the zoomed map.
    const zoomedWidth = Math.max(1, mapWidth.value * scale.value)
    const zoomedHeight = zoomedWidth * (MAP_HEIGHT / MAP_WIDTH)

    return candidates.map((label) => {
        const nudge = shown.get(label.id) ?? { x: 0, y: 0 }
        return {
            id: label.id,
            kind: label.kind,
            text: label.text,
            visible: shown.has(label.id),
            style: {
                left: label.position.x + (nudge.x / zoomedWidth) * 100 + '%',
                top: label.position.y + (nudge.y / zoomedHeight) * 100 + '%',
                transform: 'translate(-50%, -50%) scale(' + 1 / scale.value + ')',
            },
        }
    })
})

// ---------------------------------------------------------------- panel

/**
 * What the panel shows: a civilization (a point with its story), a state, or
 * a state that is a chapter of a civilization, with that story beneath.
 */
interface Subject {
    point: TimeMapPoint | null
    state: { polity: Polity; info: PolityInfo | null } | null
}

// Opening something else while the panel is open closes it first and reopens
// it with the new subject.
const panelRef = ref<InstanceType<typeof TimeMapPanel> | null>(null)
const subject = ref<Subject | null>(null)
const periodIndex = ref(0)
let pending: Subject | null = null

function periodIndexAt(point: TimeMapPoint, at: Year): number {
    return point.periods?.findIndex((period) => at >= period.start && at <= period.end) ?? -1
}

function show(next: Subject) {
    subject.value = next
    if (next.point) periodIndex.value = Math.max(0, periodIndexAt(next.point, currentYear.value))
    if (next.state && !next.state.info) loadInfo(next.state.polity)
}

function open(next: Subject) {
    if (subject.value) {
        pending = next
        panelRef.value?.close()
    } else {
        show(next)
    }
}

function onPanelClosed() {
    if (pending) {
        show(pending)
        pending = null
        nextTick(() => panelRef.value?.open())
    } else {
        subject.value = null
    }
}

async function loadInfo(polity: Polity) {
    const info = await polityInfo(polity)
    const state = subject.value?.state
    if (state?.polity.entity === polity.entity) subject.value = { ...subject.value!, state: { ...state, info } }
}

/** The civilization on the map now whose chapters include this state. */
function civilizationOf(polity: Polity): TimeMapPoint | null {
    const name = typeof polity.name === 'string' ? polity.name : polity.name.en
    return points.value.find((point) => isOnMap(point) && point.states?.includes(name ?? '')) ?? null
}

function selectPoint(point: TimeMapPoint) {
    if (subject.value?.point?.id === point.id && !subject.value.state) return
    open({ point, state: null })
}

function selectState(polity: Polity) {
    if (subject.value?.state?.polity.entity === polity.entity) return
    open({ point: civilizationOf(polity), state: { polity, info: null } })
}

// The story goes on with the slider: when the shown state leaves the map, the
// civilization's state of the new year takes its place (the Ming give way to
// the Qing); with no story to follow, the panel closes.
function follow(current: Subject, shown: readonly Polity[]): Subject | null {
    const state = current.state
    if (!state || shown.some((polity) => polity.entity === state.polity.entity)) return current
    const point = current.point && isOnMap(current.point) ? current.point : null
    const next = point && shown.find((polity) => !polity.realm && civilizationOf(polity)?.id === point.id)
    if (next) return { point, state: { polity: next, info: null } }
    return point ? { point, state: null } : null
}

watch(polities, (shown) => {
    // While the panel closes to open something else, only that something follows.
    if (pending) {
        pending = follow(pending, shown)
        return
    }
    const current = subject.value
    if (!current) return
    const next = follow(current, shown)
    if (next === current) return
    if (next) show(next)
    else panelRef.value?.close()
})

// Year and period follow each other: picking a period moves the slider to its
// middle; moving the slider out of the shown period switches to the matching one.
function onPeriodSelected(period: TimeMapPeriod) {
    const middle = Math.floor((period.start + period.end) / 2)
    currentYear.value = Math.min(Math.max(middle, minYear.value), maxYear.value)
}

watch(currentYear, (now) => {
    const point = subject.value?.point
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
    /* One finger scrolls the page; the two-finger pinch is the map's (usePanZoom). */
    touch-action: pan-x pan-y;
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

.time-map__label--state.time-map__label--visible {
    pointer-events: auto;
    cursor: pointer;
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

/* Narrow: the panel moves under the slider instead of covering the map, ahead
   of the legend and the credits, so it opens next to where it was asked for. */
@container (max-width: 760px) {
    .time-map__stage {
        display: contents;
    }

    .time-map__slider {
        order: 1;
    }

    .time-map__panel {
        order: 2;
    }

    .time-map__legend {
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
