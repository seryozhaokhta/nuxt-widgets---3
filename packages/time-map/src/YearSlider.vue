<!--
  Thin gold year slider with ticks at notable years. On a "sqrt" scale the
  slider position follows the square root of the time left until `max`, so
  recent centuries get more room than deep prehistory.
-->
<template>
    <div class="year-slider">
        <div class="year-slider__rail">
            <span v-for="mark in marks" :key="mark" class="year-slider__mark"
                :class="{ 'year-slider__mark--passed': mark <= model }" :style="{ '--at': toPosition(mark) }"
                aria-hidden="true" />
            <input type="range" class="year-slider__input" min="0" :max="RESOLUTION" step="1"
                :value="Math.round(toPosition(model) * RESOLUTION)"
                :style="{ '--fill': 'calc(8px + (100% - 16px) * ' + toPosition(model) + ')' }" :aria-label="t('year')"
                :aria-valuetext="year(model)" @input="onInput" />
        </div>
        <div class="year-slider__scale" aria-hidden="true">
            <span>{{ year(min) }}</span>
            <span v-for="tick in visibleTicks" :key="tick" class="year-slider__tick"
                :style="{ '--at': toPosition(tick) }">{{ tickLabel(tick) }}</span>
            <span>{{ year(max) }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@art-widgets/core'

const props = withDefaults(defineProps<{
    min: number
    max: number
    /** Snap step in years on a linear scale. */
    step?: number
    scale?: 'linear' | 'sqrt'
    /** Years to tick on the track. */
    marks?: number[]
    /** Years to label under the track. */
    ticks?: number[]
}>(), {
    step: 50,
    scale: 'linear',
    marks: () => [],
    ticks: () => [],
})

const model = defineModel<number>({ required: true })

const { t, year } = useI18n()

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

/** Round to a step that suits the distance from the end: millennia ago, 50 years; recently, 1. */
function snap(value: number): number {
    const before = props.max - value
    const step = props.scale === 'linear' ? props.step : before > 4000 ? 50 : before > 1000 ? 10 : before > 200 ? 5 : 1
    let snapped = Math.round((value - props.min) / step) * step + props.min
    snapped = Math.min(props.max, Math.max(props.min, snapped))
    // There is no year 0: 1 BCE is followed by 1 CE.
    return snapped === 0 ? 1 : snapped
}

function onInput(event: Event) {
    model.value = snap(fromPosition(Number((event.target as HTMLInputElement).value) / RESOLUTION))
}

const visibleTicks = computed(() => props.ticks.filter((tick) => tick > props.min && tick < props.max))

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

.year-slider__input::-webkit-slider-runnable-track {
    height: 2px;
    border-radius: 1px;
    background: linear-gradient(to right, var(--aw-color-gold) var(--fill), var(--aw-color-line-strong) var(--fill));
}

.year-slider__input::-moz-range-track {
    height: 2px;
    border-radius: 1px;
    background: var(--aw-color-line-strong);
}

.year-slider__input::-moz-range-progress {
    height: 2px;
    border-radius: 1px;
    background: var(--aw-color-gold);
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

.year-slider__mark {
    position: absolute;
    top: 50%;
    left: calc(8px + (100% - 16px) * var(--at));
    width: 1px;
    height: 8px;
    margin-top: -4px;
    background-color: var(--aw-color-line-strong);
    pointer-events: none;
}

.year-slider__mark--passed {
    background-color: var(--aw-color-gold);
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
</style>
