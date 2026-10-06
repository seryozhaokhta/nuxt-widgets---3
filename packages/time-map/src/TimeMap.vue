<!-- World map with a year slider: points appear once the year reaches their founding date. -->
<template>
    <div class="time-map" :lang="locale" @keydown.esc="panelRef?.close()">
        <header class="time-map__header">
            <p v-if="data.title" class="time-map__eyebrow">{{ l(data.title) }}</p>
            <p ref="yearRef" class="time-map__year">{{ year(displayYear) }}</p>
        </header>

        <div class="time-map__stage">
            <div ref="viewportRef" class="time-map__viewport" v-on="panZoomHandlers">
                <div class="time-map__content" :style="panZoomStyle">
                    <img :src="data.basemap" :alt="l(data.basemapAlt) || t('worldMap')" class="time-map__basemap" />
                    <TimeMapMarker v-for="point in points" :key="point.id" :point="point"
                        :visible="point.founded <= currentYear" :active="point.id === selected?.id" :zoom="scale"
                        @select="selectPoint(point)" />
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
                :point="selected"
                @select-period="onPeriodSelected" @closed="onPanelClosed" />
        </div>

        <YearSlider v-model="currentYear" class="time-map__slider" :min="minYear" :max="maxYear" :step="yearStep"
            :marks="points.map((point) => point.founded)" />
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { refDebounced } from '@vueuse/core'
import gsap from 'gsap'
import { provideI18n, usePanZoom, type Locale, type Year } from '@art-widgets/core'
import { IconButton } from '@art-widgets/ui'
import TimeMapMarker from './TimeMapMarker.vue'
import TimeMapPanel from './TimeMapPanel.vue'
import YearSlider from './YearSlider.vue'
import type { TimeMapData, TimeMapPeriod, TimeMapPoint } from './types'

const props = defineProps<{
    data: TimeMapData
    locale?: Locale
}>()

const { t, l, year, locale } = provideI18n(() => props.locale)

const points = computed(() => [...props.data.points].sort((a, b) => a.founded - b.founded))
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
} = usePanZoom(viewportRef, { minZoom: 1, maxZoom: 5, step: 0.5 })

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
    padding: 20px 20px 16px;
    box-sizing: border-box;
    border-radius: var(--aw-radius-lg);
    background-color: var(--aw-color-surface);
    box-shadow: 0 0 0 1px var(--aw-color-line);
    color: var(--aw-color-text);
    font-family: var(--aw-font-sans);
}

.time-map__header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 14px;
}

.time-map__eyebrow {
    margin: 0;
    color: var(--aw-color-text-subtle);
    font-size: var(--aw-text-xs);
    font-weight: 500;
    letter-spacing: var(--aw-label-tracking);
    text-transform: uppercase;
}

.time-map__year {
    margin: 0 0 0 auto;
    font-family: var(--aw-font-serif);
    font-size: 36px;
    font-weight: 500;
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
    border-radius: var(--aw-radius-sm);
    background-color: #070707;
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

.time-map__basemap {
    display: block;
    width: 100%;
    height: 100%;
    filter: brightness(0.3) sepia(0.4) saturate(0.7);
    user-select: none;
    pointer-events: none;
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

/* Narrow: the panel moves under the slider instead of covering the map. */
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
}

@container (max-width: 560px) {
    .time-map__year {
        font-size: 28px;
    }

    .time-map__hint {
        width: max-content;
        max-width: calc(100% - 32px);
        white-space: normal;
        text-align: center;
    }
}
</style>
