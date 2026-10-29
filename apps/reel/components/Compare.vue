<!--
  Two pictures, one above the other; the borrowed details are outlined in
  gold on both and joined by threads. The kind of influence sits between them.
-->
<template>
    <div class="compare" :style="{ opacity }">
        <div v-for="(panel, i) in panels" :key="i" class="compare__panel" :style="panel.style">
            <!-- Where the picture doesn't reach the panel's edge, a dark, blurred copy fills the rest. -->
            <img v-if="panel.ambient" :src="panel.src" alt="" class="compare__ambient" :style="panel.ambient" />
            <img :src="panel.src" alt="" class="compare__image" :style="panel.image" />
            <div class="compare__shade" :class="'compare__shade--' + (i ? 'bottom' : 'top')" />
        </div>
        <!-- Names sit in the band between the pictures, never over the outlines. -->
        <p v-for="(panel, i) in panels" :key="'label' + i" :class="['compare__label', 'compare__label--' + (i ? 'bottom' : 'top')]"
            :style="{ opacity: reveal }">
            <span class="compare__plate">
                <span class="compare__meta">{{ panel.meta }}</span>
                <span class="compare__title">{{ panel.title }}</span>
            </span>
        </p>
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
import { rectStyle } from '~/reel/motion'

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
    /** Slow push-in on both pictures, as a factor of their zoom. */
    drift?: number
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
    const base = { width: coverHeight * panel.zoom * aspect, height: coverHeight * panel.zoom }
    const height = base.height * (props.drift ?? 1)
    const width = height * aspect
    const left = Math.min(0, Math.max(STAGE.width - width, STAGE.width / 2 - (panel.focus.x / 100) * width))
    // Vertically the detail wins: a detail near a picture's edge may leave a gap above or below it.
    const top = frame.focusY - (panel.focus.y / 100) * height
    return { frame, base, width, height, left, top, gapTop: top > 0.5, gapBottom: top + height < frame.height - 0.5 }
}

/** The picture blurred and dimmed, covering the whole panel, for the gap a detail near an edge leaves. */
function ambient(panel: Panel, frame: (typeof LAYOUT)[number]) {
    const aspect = panel.size.width / panel.size.height
    const width = Math.max(STAGE.width, frame.height * aspect)
    const height = width / aspect
    return {
        left: Math.min(0, Math.max(STAGE.width - width, STAGE.width / 2 - (panel.focus.x / 100) * width)) + 'px',
        top: Math.min(0, Math.max(frame.height - height, frame.height / 2 - (panel.focus.y / 100) * height)) + 'px',
        width: width + 'px',
        height: height + 'px',
    }
}

/** Fade the picture's own edge into the gap, so it doesn't end on a hard line. */
function edgeMask(gapTop: boolean, gapBottom: boolean) {
    if (!gapTop && !gapBottom) return {}
    const stops = [gapTop ? 'transparent 0%, #000 7%' : '#000 0%', gapBottom ? '#000 93%, transparent 100%' : '#000 100%']
    const mask = `linear-gradient(to bottom, ${stops.join(', ')})`
    return { maskImage: mask, WebkitMaskImage: mask }
}

const panels = computed(() => [props.top, props.bottom].map((panel, i) => {
    const { frame, base, width, height, left, top, gapTop, gapBottom } = place(panel, i)
    // Top wipes in from the left, bottom from the right.
    const hidden = (1 - props.reveal) * 100
    return {
        src: panel.src,
        meta: panel.meta,
        title: panel.title,
        style: {
            top: frame.top + 'px',
            height: frame.height + 'px',
            clipPath: i === 0 ? `inset(0 ${hidden}% 0 0)` : `inset(0 0 0 ${hidden}%)`,
        },
        image: { ...rectStyle({ left, top, width, height }, base), ...edgeMask(gapTop, gapBottom) },
        ambient: gapTop || gapBottom ? ambient(panel, frame) : null,
    }
}))

/** Outlines in stage pixels, top panel first, cut to their own panel. */
const placedBoxes = computed(() => [props.top, props.bottom].map((panel, i) => {
    const { frame, width, height, left, top } = place(panel, i)
    const inset = 4
    return panel.boxes.map((box) => {
        const x = left + (box.x / 100) * width
        const y = frame.top + top + (box.y / 100) * height
        const x1 = Math.max(inset, x)
        const y1 = Math.max(frame.top + inset, y)
        const x2 = Math.min(STAGE.width - inset, x + (box.w / 100) * width)
        const y2 = Math.min(frame.top + frame.height - inset, y + (box.h / 100) * height)
        return { x: x1, y: y1, w: Math.max(0, x2 - x1), h: Math.max(0, y2 - y1) }
    })
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

.compare__ambient {
    position: absolute;
    max-width: none;
    filter: blur(18px) brightness(0.3) saturate(1.15);
    transform: scale(1.1);
}

.compare__shade {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

.compare__shade--top {
    background:
        linear-gradient(to bottom, rgba(5, 5, 5, 0.75), transparent 34%),
        linear-gradient(to top, rgba(5, 5, 5, 0.85), transparent 22%);
}

.compare__shade--bottom {
    background:
        linear-gradient(to bottom, rgba(5, 5, 5, 0.85), transparent 22%),
        linear-gradient(to top, rgba(5, 5, 5, 0.8), transparent 40%);
}

/* Names sit on dark plates, so the outlines and threads pass behind them. */
.compare__label {
    position: absolute;
    z-index: 2;
    left: 16px;
    right: 16px;
    display: flex;
    justify-content: center;
    margin: 0;
    white-space: nowrap;
}

.compare__label--top {
    top: 338px;
}

.compare__label--bottom {
    top: 404px;
}

.compare__plate {
    display: flex;
    gap: 8px;
    align-items: baseline;
    max-width: 100%;
    padding: 4px 12px 5px;
    border-radius: 999px;
    background: rgba(8, 8, 8, 0.86);
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.5);
}

.compare__meta {
    flex: none;
    color: var(--aw-color-gold-bright);
    font-family: var(--aw-font-mono);
    font-size: 10.5px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
}

.compare__title {
    overflow: hidden;
    color: var(--aw-color-text);
    text-overflow: ellipsis;
    font-family: var(--aw-font-artwork);
    font-size: 16.5px;
    font-style: italic;
    line-height: 1.2;
}

.compare__lines {
    position: absolute;
    z-index: 1;
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
    padding: 8px 15px;
    border-radius: 999px;
    background: rgba(8, 8, 8, 0.94);
    box-shadow: 0 0 0 1px var(--aw-color-gold-soft), 0 10px 30px rgba(0, 0, 0, 0.6);
    color: rgba(242, 238, 230, 0.86);
    font-family: var(--aw-font-mono);
    font-size: 11px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    white-space: nowrap;
}

.compare__chip strong {
    color: var(--aw-color-gold-bright);
    font-weight: 500;
}
</style>
