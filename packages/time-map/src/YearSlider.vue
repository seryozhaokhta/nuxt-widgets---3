<!-- Thin gold range input with ticks at notable years and the range ends below. -->
<template>
    <div class="year-slider">
        <div class="year-slider__rail">
            <span v-for="mark in marks" :key="mark" class="year-slider__mark"
                :class="{ 'year-slider__mark--passed': mark <= model }" :style="{ '--at': fraction(mark) }"
                aria-hidden="true" />
            <input type="range" class="year-slider__input" :min="min" :max="max" :step="step" :value="model"
                :style="{ '--fill': 'calc(8px + (100% - 16px) * ' + fraction(model) + ')' }" :aria-label="t('year')"
                :aria-valuetext="year(model)" @input="onInput" />
        </div>
        <div class="year-slider__scale" aria-hidden="true">
            <span>{{ year(min) }}</span>
            <span>{{ year(max) }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useI18n } from '@art-widgets/core'

const props = withDefaults(defineProps<{
    min: number
    max: number
    step: number
    /** Years to tick on the track. */
    marks?: number[]
}>(), {
    marks: () => [],
})

const model = defineModel<number>({ required: true })

const { t, year } = useI18n()

function fraction(value: number): number {
    if (props.max === props.min) return 0
    return Math.min(1, Math.max(0, (value - props.min) / (props.max - props.min)))
}

function onInput(event: Event) {
    model.value = Number((event.target as HTMLInputElement).value)
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
    border: 3px solid var(--aw-color-surface);
    border-radius: 50%;
    background: var(--aw-color-gold);
    box-shadow: 0 0 0 1px var(--aw-color-gold-soft);
    transition: transform var(--aw-duration-fast) var(--aw-ease), background-color var(--aw-duration-fast);
}

.year-slider__input::-moz-range-thumb {
    box-sizing: border-box;
    width: 16px;
    height: 16px;
    border: 3px solid var(--aw-color-surface);
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
    display: flex;
    justify-content: space-between;
    margin-top: 2px;
    color: var(--aw-color-text-subtle);
    font-size: var(--aw-text-xs);
    font-weight: 500;
    letter-spacing: var(--aw-label-tracking);
    text-transform: uppercase;
}
</style>
