<!--
  Thin gold year slider. On a "sqrt" scale the slider position follows the
  square root of the time left until `max`, so recent centuries get more room
  than deep prehistory. The track is cut into eras (the current one is named
  under it), and ages of ideas run as a thin line above it; only the one the
  year falls in is named.
-->
<template>
    <div class="year-slider">
        <div v-if="ideaLines.length" class="year-slider__ideas" aria-hidden="true">
            <span v-for="idea in ideaLines" :key="idea.key"
                :class="['year-slider__idea', { 'year-slider__idea--active': idea.active }]"
                :style="{ '--from': idea.from, '--to': idea.to }" :title="idea.title" />
            <span v-if="activeIdea" class="year-slider__label year-slider__idea-name"
                :style="labelStyle(activeIdea.center, activeIdea.name, 0, 0)">{{ activeIdea.name }}</span>
        </div>
        <div class="year-slider__rail">
            <span v-for="segment in segments" :key="segment.key" class="year-slider__segment" :style="segment.style"
                aria-hidden="true" />
            <input type="range" class="year-slider__input" min="0" :max="RESOLUTION" step="1"
                :value="Math.round(toPosition(model) * RESOLUTION)" :aria-label="t('year')"
                :aria-valuetext="valueText" @input="onInput" @keydown="onKeydown" />
        </div>
        <div ref="scaleRef" class="year-slider__scale" aria-hidden="true">
            <span>{{ startLabel }}</span>
            <span v-for="tick in visibleTicks" :key="tick" class="year-slider__tick"
                :style="{ '--at': toPosition(tick) }">{{ tickLabel(tick) }}</span>
            <span v-if="currentEra" class="year-slider__label year-slider__era"
                :style="labelStyle(currentEra.center, currentEra.name, startLabel.length, endLabel.length)">
                {{ currentEra.name }}</span>
            <span>{{ endLabel }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useElementSize } from '@vueuse/core'
import { useI18n } from '@art-widgets/core'
import type { TimeMapEra, TimeMapIdea } from './types'

const props = withDefaults(defineProps<{
    min: number
    max: number
    /** Snap step in years on a linear scale. */
    step?: number
    scale?: 'linear' | 'sqrt'
    /** Years to label under the track. */
    ticks?: number[]
    /** Eras the track is cut into. */
    eras?: TimeMapEra[]
    /** Ages of ideas drawn above the track. */
    ideas?: TimeMapIdea[]
}>(), {
    step: 50,
    scale: 'linear',
    ticks: () => [],
    eras: () => [],
    ideas: () => [],
})

const model = defineModel<number>({ required: true })

const { t, l, year } = useI18n()

/** Slider positions; fine enough that every step of the scale is reachable. */
const RESOLUTION = 2000

const span = computed(() => Math.max(1, props.max - props.min))

function toPosition(value: number): number {
    const clamped = Math.min(props.max, Math.max(props.min, value))
    return props.scale === 'sqrt'
        ? 1 - Math.sqrt((props.max - clamped) / span.value)
        : (clamped - props.min) / span.value
}

function fromPosition(position: number): number {
    return props.scale === 'sqrt'
        ? props.max - (1 - position) ** 2 * span.value
        : props.min + position * span.value
}

/** Step that suits the distance from the end: millennia ago, 50 years; recently, 1. */
function stepAt(value: number): number {
    if (props.scale === 'linear') return props.step
    const before = props.max - value
    return before > 4000 ? 50 : before > 1000 ? 10 : before > 200 ? 5 : 1
}

function snap(value: number): number {
    const step = stepAt(value)
    let snapped = Math.round((value - props.min) / step) * step + props.min
    snapped = Math.min(props.max, Math.max(props.min, snapped))
    // There is no year 0: 1 BCE is followed by 1 CE.
    return snapped === 0 ? 1 : snapped
}

function onInput(event: Event) {
    model.value = snap(fromPosition(Number((event.target as HTMLInputElement).value) / RESOLUTION))
}

// ---------------------------------------------------------------- eras and ideas

/** Eras in order, each running until the next one starts. */
const eraSpans = computed(() => {
    const sorted = [...props.eras].sort((a, b) => a.start - b.start)
    return sorted.map((era, i) => ({ era, start: era.start, end: sorted[i + 1]?.start ?? props.max }))
})

/** Space between two eras on the track, px each side. */
const GAP = 2

const segments = computed(() => {
    const spans = eraSpans.value.length ? eraSpans.value : [{ start: props.min, end: props.max }]
    const at = toPosition(model.value)
    return spans.map((item, i) => {
        const from = toPosition(item.start)
        const to = toPosition(item.end)
        const fill = to > from ? Math.min(1, Math.max(0, (at - from) / (to - from))) : 0
        return {
            key: item.start,
            style: {
                '--from': from,
                '--to': to,
                '--fill': fill,
                '--gap-start': (i === 0 ? 0 : GAP) + 'px',
                '--gap-end': (i === spans.length - 1 ? 0 : GAP) + 'px',
            },
        }
    })
})

const currentEra = computed(() => {
    const found = eraSpans.value.find((item) => item.start <= model.value && model.value < item.end)
        ?? eraSpans.value.at(-1)
    if (!found || found.start > model.value) return null
    return { name: l(found.era.name), center: (toPosition(found.start) + toPosition(found.end)) / 2 }
})

const ideaLines = computed(() => props.ideas.map((idea) => ({
    key: idea.start,
    from: toPosition(idea.start),
    to: toPosition(idea.end),
    active: idea.start <= model.value && model.value <= idea.end,
    title: `${l(idea.name)}: ${year(idea.start)} — ${year(idea.end)}`,
    name: l(idea.name),
    center: (toPosition(idea.start) + toPosition(idea.end)) / 2,
})))

const activeIdea = computed(() => ideaLines.value.find((idea) => idea.active) ?? null)

const valueText = computed(() =>
    [year(model.value), currentEra.value?.name, activeIdea.value?.name].filter(Boolean).join(', '))

const startLabel = computed(() => year(props.min))
const endLabel = computed(() => year(props.max))

/**
 * A name centred over a point of the track, kept inside it and clear of the
 * end labels (`before`/`after` characters). The labels are monospaced, so
 * widths are counted in `ch`; this works before the slider is measured.
 */
function labelStyle(center: number, text: string, before: number, after: number) {
    const half = text.length / 2
    const low = before ? `${before + 1.5 + half}ch` : `${half}ch`
    const high = after ? `calc(100% - ${after + 1.5 + half}ch)` : `calc(100% - ${half}ch)`
    return { left: `clamp(${low}, calc(8px + (100% - 16px) * ${center}), ${high})` }
}

// ---------------------------------------------------------------- keys

// Arrows move by whole steps of the scale (a step of the native range can be
// less than a year near the end and so change nothing); Page Up and Page Down
// jump to the next or previous era.
const KEY_STEPS: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }

function stepBy(steps: number) {
    let value = model.value
    for (let i = 0; i < Math.abs(steps); i++) {
        let target = value + Math.sign(steps) * stepAt(value)
        if (target === 0) target = Math.sign(steps)
        const next = snap(target)
        if (next === value) break
        value = next
    }
    model.value = value
}

function jumpEra(direction: 1 | -1) {
    if (!eraSpans.value.length) return stepBy(10 * direction)
    const starts = eraSpans.value.map((item) => Math.max(props.min, item.start))
    model.value = direction > 0
        ? starts.find((start) => start > model.value) ?? props.max
        : [...starts].reverse().find((start) => start < model.value) ?? props.min
}

function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Home') model.value = props.min
    else if (event.key === 'End') model.value = props.max
    else if (event.key === 'PageUp') jumpEra(1)
    else if (event.key === 'PageDown') jumpEra(-1)
    else if (KEY_STEPS[event.key]) stepBy(KEY_STEPS[event.key]!)
    else return
    event.preventDefault()
}

// ---------------------------------------------------------------- ticks

const scaleRef = ref<HTMLElement | null>(null)
const { width } = useElementSize(scaleRef)
/** Width of a character of the 12 px mono labels, px. */
const CHAR = 7.4

// Year labels that would run into a neighbour, the era name or the end labels
// on a narrow screen are left out.
const visibleTicks = computed(() => {
    const inside = props.ticks.filter((tick) => tick > props.min && tick < props.max)
    if (!width.value) return inside
    const left = startLabel.value.length * CHAR + 10
    const right = width.value - endLabel.value.length * CHAR - 10
    const taken: [number, number][] = []
    const era = currentEra.value
    if (era) {
        const half = (era.name.length * CHAR) / 2
        const x = Math.min(right - half, Math.max(left + half, 8 + (width.value - 16) * era.center))
        taken.push([x - half - 18, x + half + 18])
    }
    const shown: number[] = []
    let last = -Infinity
    for (const tick of inside) {
        const x = 8 + (width.value - 16) * toPosition(tick)
        const half = (tickLabel(tick).length * CHAR) / 2
        if (x - half < Math.max(left, last + 10) || x + half > right) continue
        if (taken.some(([from, to]) => x + half > from && x - half < to)) continue
        shown.push(tick)
        last = x + half
    }
    return shown
})

/** Compact labels: "−5000", "1500". */
function tickLabel(tick: number): string {
    return tick < 0 ? '−' + Math.abs(tick) : String(tick)
}
</script>

<style scoped>
/* Thumb is 16px wide; its centre travels between 8px and (width - 8px). */
.year-slider__rail {
    position: relative;
    height: 24px;
}

/* Era segments of the track, gold up to the thumb. */
.year-slider__segment {
    position: absolute;
    top: 50%;
    left: calc(8px + (100% - 16px) * var(--from) + var(--gap-start));
    width: calc((100% - 16px) * (var(--to) - var(--from)) - var(--gap-start) - var(--gap-end));
    height: 2px;
    margin-top: -1px;
    border-radius: 1px;
    background: linear-gradient(to right,
            var(--aw-color-gold) calc(var(--fill) * 100%),
            var(--aw-color-line-strong) calc(var(--fill) * 100%));
    pointer-events: none;
}

.year-slider__input {
    -webkit-appearance: none;
    appearance: none;
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    background: transparent;
    cursor: pointer;
}

.year-slider__input:focus {
    outline: none;
}

/* The track itself is drawn by the segments. */
.year-slider__input::-webkit-slider-runnable-track {
    height: 2px;
    background: transparent;
}

.year-slider__input::-moz-range-track {
    height: 2px;
    background: transparent;
}

.year-slider__input::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    margin-top: -7px;
    border: 3px solid var(--aw-color-bg);
    border-radius: 50%;
    background: var(--aw-color-gold);
    box-shadow: 0 0 0 1px var(--aw-color-gold-soft);
    transition: transform var(--aw-duration-fast) var(--aw-ease), background-color var(--aw-duration-fast);
}

.year-slider__input::-moz-range-thumb {
    box-sizing: border-box;
    width: 16px;
    height: 16px;
    border: 3px solid var(--aw-color-bg);
    border-radius: 50%;
    background: var(--aw-color-gold);
    box-shadow: 0 0 0 1px var(--aw-color-gold-soft);
    transition: transform var(--aw-duration-fast) var(--aw-ease), background-color var(--aw-duration-fast);
}

.year-slider__input:hover::-webkit-slider-thumb,
.year-slider__input:active::-webkit-slider-thumb {
    background: var(--aw-color-gold-bright);
    transform: scale(1.2);
}

.year-slider__input:hover::-moz-range-thumb,
.year-slider__input:active::-moz-range-thumb {
    background: var(--aw-color-gold-bright);
    transform: scale(1.2);
}

.year-slider__input:focus-visible::-webkit-slider-thumb {
    box-shadow: var(--aw-focus-ring);
}

.year-slider__input:focus-visible::-moz-range-thumb {
    box-shadow: var(--aw-focus-ring);
}

/* Ages of ideas: a hairline above the track, gold while the year is inside. */
.year-slider__ideas {
    position: relative;
    height: 20px;
    font-family: var(--aw-font-mono);
    font-size: var(--aw-label-size);
}

.year-slider__idea {
    position: absolute;
    bottom: 0;
    left: calc(8px + (100% - 16px) * var(--from));
    width: calc((100% - 16px) * (var(--to) - var(--from)));
    height: 1px;
    /* A taller box than the line, so the name shows on hover. */
    padding-top: 6px;
    background-clip: content-box;
    background-color: var(--aw-color-line-strong);
    transition: background-color var(--aw-duration-fast);
}

.year-slider__idea--active {
    background-color: var(--aw-color-gold);
}

.year-slider__label {
    position: absolute;
    transform: translateX(-50%);
    white-space: nowrap;
    pointer-events: none;
}

.year-slider__idea-name {
    top: 0;
    color: var(--aw-color-gold);
}

.year-slider__scale {
    position: relative;
    display: flex;
    justify-content: space-between;
    margin-top: 2px;
    color: var(--aw-color-text-subtle);
    font-family: var(--aw-font-mono);
    font-size: var(--aw-label-size);
    font-weight: 400;
}

.year-slider__tick {
    position: absolute;
    top: 0;
    left: calc(8px + (100% - 16px) * var(--at));
    transform: translateX(-50%);
    color: var(--aw-color-text-subtle);
    opacity: 0.8;
}

.year-slider__era {
    top: 0;
    color: var(--aw-color-text-muted);
}
</style>
