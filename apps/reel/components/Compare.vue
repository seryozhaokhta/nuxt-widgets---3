<!--
  Two pictures, one above the other; the borrowed details are outlined in
  gold on both and joined by threads. The kind of influence sits between them.
-->
<template>
    <div class="compare" :style="{ opacity }">
        <div v-for="(panel, i) in panels" :key="i" class="compare__panel" :style="panel.style">
            <img :src="panel.src" alt="" class="compare__image" :style="panel.image" />
            <div class="compare__shade" :class="'compare__shade--' + (i ? 'bottom' : 'top')" />
            <p :class="['compare__label', { 'compare__label--right': panel.align === 'right' }]"
                :style="{ top: panel.labelTop + 'px', opacity: reveal }">
                <span class="compare__meta">{{ panel.meta }}</span>
                <span class="compare__title">{{ panel.title }}</span>
            </p>
        </div>
        <svg class="compare__lines" :viewBox="`0 0 ${STAGE.width} ${STAGE.height}`" aria-hidden="true">
            <rect v-for="(box, i) in boxes" :key="'b' + i" :x="box.x" :y="box.y" :width="box.w" :height="box.h" rx="3"
                pathLength="1" class="compare__box" :style="{ strokeDashoffset: 1 - outline }" />
            <path v-for="(thread, i) in threads" :key="'t' + i" :d="thread" pathLength="1" class="compare__thread"
                :style="{ strokeDashoffset: 1 - threadProgress }" />
        </svg>
        <p class="compare__chip" :style="{ opacity: chipOpacity, transform: `translate(-50%, -50%) scale(${0.92 + 0.08 * chipOpacity})` }">
            <strong>{{ kind }}</strong>{{ note }}
        </p>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { STAGE } from '~/reel/time'

export interface Box {
    /** Percent of the image. */
    x: number
    y: number
    w: number
    h: number
}

export interface Panel {
    src: string
    size: { width: number; height: number }
    meta: string
    title: string
    /** Image point (percent) to place at the panel's focus. */
    focus: { x: number; y: number }
    /** 1: the image just covers the panel. */
    zoom: number
    boxes: Box[]
    /** Side of the panel the caption sits on; keep it off the outlines. */
    align?: 'left' | 'right'
}

const props = defineProps<{
    top: Panel
    bottom: Panel
    /** 0–1: panels wipe in. */
    reveal: number
    /** 0–1: outlines draw. */
    outline: number
    /** 0–1: threads draw from the top picture to the bottom one. */
    threadProgress: number
    kind: string
    note: string
    chipOpacity: number
    opacity?: number
}>()

/** Panel rectangles on the stage, and where in each the borrowed detail should sit. */
const GAP = 8
const SPLIT = 380
const LAYOUT = [
    { top: 0, height: SPLIT, focusY: 236 },
    { top: SPLIT + GAP, height: STAGE.height - SPLIT - GAP, focusY: 92 },
]

function place(panel: Panel, index: number) {
    const frame = LAYOUT[index]!
    const aspect = panel.size.width / panel.size.height
    const coverHeight = Math.max(frame.height, STAGE.width / aspect)
    const height = coverHeight * panel.zoom
    const width = height * aspect
    const left = Math.min(0, Math.max(STAGE.width - width, STAGE.width / 2 - (panel.focus.x / 100) * width))
    const top = Math.min(0, Math.max(frame.height - height, frame.focusY - (panel.focus.y / 100) * height))
    return { frame, width, height, left, top }
}

const panels = computed(() => [props.top, props.bottom].map((panel, i) => {
    const { frame, width, height, left, top } = place(panel, i)
    // Top wipes in from the left, bottom from the right.
    const hidden = (1 - props.reveal) * 100
    return {
        src: panel.src,
        meta: panel.meta,
        title: panel.title,
        align: panel.align ?? 'left',
        labelTop: i === 0 ? frame.height - 70 : 146,
        style: {
            top: frame.top + 'px',
            height: frame.height + 'px',
            clipPath: i === 0 ? `inset(0 ${hidden}% 0 0)` : `inset(0 0 0 ${hidden}%)`,
        },
        image: { left: left + 'px', top: top + 'px', width: width + 'px', height: height + 'px' },
    }
}))

/** Outlines in stage pixels, top panel first. */
const placedBoxes = computed(() => [props.top, props.bottom].map((panel, i) => {
    const { frame, width, height, left, top } = place(panel, i)
    return panel.boxes.map((box) => ({
        x: left + (box.x / 100) * width,
        y: frame.top + top + (box.y / 100) * height,
        w: (box.w / 100) * width,
        h: (box.h / 100) * height,
    }))
}))

const boxes = computed(() => placedBoxes.value.flat())

const threads = computed(() => {
    const [upper = [], lower = []] = placedBoxes.value
    return upper.flatMap((a, i) => {
        const b = lower[i]
        if (!b) return []
        const x1 = a.x + a.w / 2
        const y1 = a.y + a.h
        const x2 = b.x + b.w / 2
        const y2 = b.y
        const bend = Math.max(40, (y2 - y1) * 0.5)
        return [`M ${x1} ${y1} C ${x1} ${y1 + bend}, ${x2} ${y2 - bend}, ${x2} ${y2}`]
    })
})

const opacity = computed(() => props.opacity ?? 1)

</script>

<style scoped>
.compare {
    position: absolute;
    inset: 0;
    background: #050505;
}

.compare__panel {
    position: absolute;
    left: 0;
    width: 100%;
    overflow: hidden;
    background: #000;
}

.compare__image {
    position: absolute;
    max-width: none;
}

.compare__shade {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

.compare__shade--top {
    background:
        linear-gradient(to bottom, rgba(5, 5, 5, 0.75), transparent 34%),
        linear-gradient(to top, rgba(5, 5, 5, 0.8), transparent 30%);
}

.compare__shade--bottom {
    background:
        linear-gradient(to top, rgba(5, 5, 5, 0.85), transparent 58%);
}

.compare__label {
    position: absolute;
    left: 24px;
    right: 60px;
    display: grid;
    gap: 4px;
    margin: 0;
    text-shadow: 0 1px 10px rgba(0, 0, 0, 0.9);
}

.compare__label--right {
    left: auto;
    right: 60px;
    width: 220px;
    justify-items: end;
    text-align: right;
}

.compare__meta {
    color: var(--aw-color-gold-bright);
    font-family: var(--aw-font-mono);
    font-size: 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.compare__title {
    font-family: var(--aw-font-artwork);
    font-size: 20px;
    font-style: italic;
    line-height: 1.1;
}

.compare__lines {
    position: absolute;
    inset: 0;
    width: 432px;
    height: 768px;
    overflow: visible;
    pointer-events: none;
}

.compare__box {
    fill: none;
    stroke: var(--aw-color-gold-bright);
    stroke-width: 1.6;
    stroke-dasharray: 1 1;
    filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.9));
}

.compare__thread {
    fill: none;
    stroke: var(--aw-color-gold);
    stroke-width: 1.4;
    stroke-dasharray: 1 1;
    filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.9));
}

.compare__chip {
    position: absolute;
    z-index: 2;
    left: 50%;
    top: 384px;
    display: flex;
    gap: 10px;
    align-items: center;
    margin: 0;
    padding: 8px 14px;
    border-radius: 999px;
    background: rgba(8, 8, 8, 0.92);
    box-shadow: 0 0 0 1px var(--aw-color-gold-soft), 0 10px 30px rgba(0, 0, 0, 0.6);
    color: var(--aw-color-text-muted);
    font-family: var(--aw-font-mono);
    font-size: 10px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    white-space: nowrap;
}

.compare__chip strong {
    color: var(--aw-color-gold-bright);
    font-weight: 500;
}
</style>
