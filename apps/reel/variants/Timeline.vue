<!-- Variant A, "Timeline": see timeline.ts for the plan and timings. -->
<template>
    <div ref="root" class="tl">
        <!-- 01 Map: the map's own drawing, full-bleed, years running under a finger -->
        <ReelMap v-if="t < T.venusCut" :year="mapYear" :camera="camera" :pins="pins" :label-area="550_000"
            :avoid="[{ x: 0, y: 0, w: 432, h: 190 }, { x: 0, y: 450, w: 432, h: 318 }]" />
        <div v-if="t < T.venusCut" class="tl__slider" :style="{ opacity: 1 - span(t, T.diveStart, T.diveStart + 0.3) }">
            <YearSlider ref="sliderRef" :model-value="mapYear" :min="-10000" :max="2024" scale="sqrt"
                :ticks="[-5000, -2000, 1, 1000, 1500]" />
        </div>

        <!-- 02 Painting: full-bleed, then shrinks into the story widget -->
        <div v-if="t >= T.storyMount && t < T.cardsCut" class="tl__story" :style="storyStyle">
            <ArtStory ref="storyRef" :data="venus" locale="en" />
        </div>
        <div v-if="t >= T.venusCut && t < T.shrinkEnd + 0.2" class="tl__painting" :style="paintingStyle">
            <img :src="venus.image" alt="" class="tl__painting-image" />
            <button ref="markerRef" type="button" class="tl__marker" :style="markerStyle" aria-label="Zoom to detail">
                <span class="tl__marker-dot" />
            </button>
        </div>

        <!-- 03 Cards fold into nodes on a line of years -->
        <template v-if="t >= T.cardsCut && t < T.end">
            <div class="tl__axis" :style="axisStyle">
                <span class="tl__axis-line" />
                <span v-for="stop in stops" :key="stop.year" class="tl__axis-year" :style="{ left: stop.x + 'px' }">{{ stop.year }}</span>
            </div>
            <svg class="tl__threads" :style="axisStyle" viewBox="0 0 432 768" aria-hidden="true">
                <path v-for="(thread, i) in threads" :key="i" :d="thread" pathLength="1" class="tl__thread"
                    :style="{ strokeDashoffset: 1 - threadProgress(i) }" />
            </svg>
            <div class="tl__node tl__node--venus" :style="venusNodeStyle">
                <img :src="venus.image" alt="" />
            </div>
            <div ref="budeRef" class="tl__card" :style="cardStyle(T.cardsCut, T.budeFold, stops[1]!.x)">
                <NodeCard :data="bude" locale="en" />
            </div>
            <div v-if="t >= T.bocklinIn" ref="bocklinRef" class="tl__card" :style="cardStyle(T.bocklinIn, T.bocklinFold, stops[2]!.x)">
                <NodeCard :data="bocklin" locale="en" />
            </div>
            <div class="tl__next" :style="{ opacity: fade(t, T.threads + 0.3, T.endTitle, 0.4, 0.3) }">
                <span class="tl__next-dot" /> Next: threads of influence
            </div>
        </template>

        <!-- Shade under the counter -->
        <div class="tl__shade" :style="{ opacity: t < T.cardsCut ? 1 : 0 }" />

        <!-- Counter, the spine of the reel -->
        <div class="tl__counter" :style="{ opacity: counterOpacity }">
            <YearCounter :year="counterYear" :size="58" />
            <p class="tl__context">{{ context }}</p>
        </div>
        <p class="tl__chapter" :style="{ opacity: counterOpacity }">
            <span class="tl__chapter-number">{{ chapter.n }}</span>{{ chapter.title }}
        </p>

        <!-- Captions -->
        <RevealText class="tl__caption" :lines="['12,000 years', 'on one slider.']" :at="0.25" :out="2.5" />
        <RevealText class="tl__caption" :lines="['Coastlines follow', 'the sea level.']" :at="2.9" :out="5.0" />
        <RevealText class="tl__caption" :lines="['1,600 states,', 'real borders.']" :at="5.4" :out="7.45" />
        <p class="tl__source" :style="{ opacity: fade(t, 5.7, 7.5, 0.3, 0.2) }">Data: Cliopatria / Seshat · CC BY 4.0</p>
        <RevealText class="tl__caption" :lines="['Read a painting', 'detail by detail.']" :at="8.75" :out="11.0" />
        <RevealText class="tl__caption tl__caption--top" :lines="['Cards fold', 'into nodes.']" :at="20.2" :out="22.6" />

        <!-- End -->
        <div class="tl__end" :style="endStyle">
            <RevealText class="tl__end-title" :lines="['Art Widgets']" :at="T.endTitle" />
            <RevealText class="tl__end-lead" :lines="['Interactive pieces for telling', 'the history of art.']"
                :at="T.endTitle + 0.25" :stagger="0.08" />
            <ul class="tl__end-list">
                <li v-for="(item, i) in endItems" :key="item" :style="endItemStyle(i)">
                    <span>0{{ i + 1 }}</span>{{ item }}
                </li>
            </ul>
        </div>

        <TouchDot :state="touch" />
        <Grain :amount="0.06" :vignette="t < T.cardsCut ? 0.7 : 0.35" />
        <div class="tl__flash" :style="{ opacity: flash }" />
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArtStory } from '@art-widgets/story'
import { NodeCard } from '@art-widgets/node-card'
import ReelMap, { type MapCamera, type MapPin } from '~/components/ReelMap.vue'
import RevealText from '~/components/RevealText.vue'
import TouchDot from '~/components/TouchDot.vue'
import Grain from '~/components/Grain.vue'
import YearCounter from '~/components/YearCounter.vue'
import YearSlider from '@art-widgets/time-map/YearSlider.vue'
import { bocklin, bude, places, venus } from '~/reel/content'
import { ease, fade, keys, lerp, rectStyle, span, tween } from '~/reel/motion'
import { holdFirstFrame, reelTime, STAGE } from '~/reel/time'
import { useTouch } from '~/reel/touch'
import { yearBetween } from '~/reel/years'
import { T } from './timeline'

const t = computed(() => reelTime.value)

const root = ref<HTMLElement | null>(null)
const markerRef = ref<HTMLElement | null>(null)
const storyRef = ref<{ $el: HTMLElement } | null>(null)
const budeRef = ref<HTMLElement | null>(null)
const bocklinRef = ref<HTMLElement | null>(null)
const sliderRef = ref<{ $el: HTMLElement } | null>(null)

// Images are decoded before the first frame, so cuts never show an empty frame.
for (const src of [venus.image, bude.image, bocklin.image]) {
    const image = new Image()
    image.src = src
    holdFirstFrame(image.decode())
}

// ── 01 Map ────────────────────────────────────────────────────────────────

const dragProgress = (time: number) => ease.inOut(span(time, T.mapDragStart, T.mapDragEnd))
const mapYear = computed(() => yearBetween(-10000, 1510, dragProgress(t.value)))

const camera = computed<MapCamera>(() => {
    const time = t.value
    const dive = tween(time, T.diveStart, T.venusCut, ease.expoIn)
    const lon = keys(time, [[0, 24], [4, 31], [T.diveStart, 21]])
    const lat = keys(time, [[0, 47], [4, 40], [T.diveStart, 43]])
    const zoom = keys(time, [[0, 2.15], [4, 2.35], [T.diveStart, 2.7]])
    return {
        lon: lerp(lon, places.venice.at[0], dive),
        lat: lerp(lat, places.venice.at[1], dive),
        zoom: lerp(zoom, 14, dive),
    }
})

const pins = computed<MapPin[]>(() => {
    const opacity = span(t.value, 6.9, 7.3)
    return opacity > 0 ? [{ id: 'venice', at: places.venice.at, label: 'VENICE · 1510', opacity }] : []
})

// ── 02 Painting ───────────────────────────────────────────────────────────

const ASPECT = 3017 / 1882
const COVER_W = STAGE.height * ASPECT

/** Full-bleed rect with image point (px, py) at the stage centre, kept covering the stage. */
function coverRect(zoom: number, px: number, py: number) {
    const width = COVER_W * zoom
    const height = STAGE.height * zoom
    const left = Math.min(0, Math.max(STAGE.width - width, STAGE.width / 2 - px * width))
    const top = Math.min(0, Math.max(STAGE.height - height, STAGE.height / 2 - py * height))
    return { left, top, width, height }
}

const goddess = venus.points[0]!
const storyFrame = ref<{ left: number; top: number; width: number; height: number } | null>(null)

const paintingRect = computed(() => {
    const time = t.value
    const pan = tween(time, T.venusCut, T.panEnd, ease.inOut)
    const zoomIn = tween(time, T.markerTap + 0.05, T.markerTap + 0.85, ease.out)
    const zoom = lerp(1 + 0.06 * pan, 1.9, zoomIn)
    const px = lerp(lerp(0.8, 0.22, pan), goddess.x / 100, zoomIn)
    const py = lerp(0.5, goddess.y / 100, zoomIn)
    const cover = coverRect(zoom, px, py)
    const shrink = tween(time, T.shrinkStart, T.shrinkEnd, ease.quartInOut)
    if (shrink <= 0) return { ...cover, radius: 0 }
    if (!storyFrame.value) measureStory()
    const to = storyFrame.value ?? cover
    return {
        left: lerp(cover.left, to.left, shrink),
        top: lerp(cover.top, to.top, shrink),
        width: lerp(cover.width, to.width, shrink),
        height: lerp(cover.height, to.height, shrink),
        radius: 6 * shrink,
    }
})

function measureStory() {
    const frame = storyRef.value?.$el.querySelector('.story__frame')
    const stage = root.value
    if (!frame || !stage) return
    const outer = stage.getBoundingClientRect()
    const rect = frame.getBoundingClientRect()
    const k = outer.width / STAGE.width
    storyFrame.value = {
        left: (rect.left - outer.left) / k,
        top: (rect.top - outer.top) / k,
        width: rect.width / k,
        height: rect.height / k,
    }
}

const paintingStyle = computed(() => {
    const rect = paintingRect.value
    return {
        ...rectStyle(rect, { width: COVER_W, height: STAGE.height }),
        borderRadius: (rect.radius * COVER_W) / rect.width + 'px',
        opacity: 1 - span(t.value, T.shrinkEnd, T.shrinkEnd + 0.15),
    }
})

const markerStyle = computed(() => ({
    left: goddess.x + '%',
    top: goddess.y + '%',
    opacity: fade(t.value, T.markerIn, T.markerTap + 0.2, 0.25, 0.2),
    transform: `scale(${lerp(0.4, 1, tween(t.value, T.markerIn, T.markerIn + 0.4, ease.backOut))})`,
}))

const STORY_SCALE = 0.86
const storyStyle = computed(() => {
    const appear = tween(t.value, T.shrinkEnd - 0.3, T.shrinkEnd + 0.3, ease.out)
    const leave = tween(t.value, T.cardsCut - 0.25, T.cardsCut, ease.in)
    return {
        transform: `scale(${STORY_SCALE})`,
        opacity: t.value < T.shrinkStart ? 0 : 1,
        '--panel-opacity': String(appear * (1 - leave)),
    }
})

// ── 03 Cards → nodes ─────────────────────────────────────────────────────

const AXIS_Y = 556
const stops = [
    { year: 1510, x: 92 },
    { year: 1536, x: 216 },
    { year: 1872, x: 340 },
]
const CARD_CENTER = { x: 216, y: 362 }

function cardStyle(enter: number, fold: number, axisX: number) {
    const time = t.value
    const appear = tween(time, enter, enter + 0.7, ease.expoOut)
    const drop = tween(time, fold + 0.5, fold + 1.0, ease.quartInOut)
    const x = lerp(0, axisX - CARD_CENTER.x, drop)
    const y = lerp((1 - appear) * 90, AXIS_Y - CARD_CENTER.y, drop)
    return {
        transform: `translate(${x}px, ${y}px) scale(${lerp(0.84, 0.9, appear)})`,
        opacity: String(appear),
    }
}

const axisStyle = computed(() => ({
    opacity: span(t.value, T.budeFold + 0.4, T.budeFold + 0.9),
}))

const venusNodeStyle = computed(() => {
    const pop = tween(t.value, T.venusNode, T.venusNode + 0.5, ease.backOut)
    return {
        left: stops[0]!.x + 'px',
        top: AXIS_Y + 'px',
        transform: `translate(-50%, -50%) scale(${pop * 0.9})`,
        opacity: String(Math.min(1, pop * 2)),
    }
})

const threads = [
    `M ${stops[0]!.x} ${AXIS_Y - 34} C ${stops[0]!.x + 20} ${AXIS_Y - 110}, ${stops[1]!.x - 20} ${AXIS_Y - 110}, ${stops[1]!.x} ${AXIS_Y - 34}`,
    `M ${stops[1]!.x} ${AXIS_Y - 34} C ${stops[1]!.x + 20} ${AXIS_Y - 130}, ${stops[2]!.x - 20} ${AXIS_Y - 130}, ${stops[2]!.x} ${AXIS_Y - 34}`,
]
const threadProgress = (i: number) => tween(t.value, T.threads + i * 0.35, T.threads + i * 0.35 + 0.8, ease.inOut)

// ── Counter, chapters, end ───────────────────────────────────────────────

function roll(time: number, from: number, to: number, start: number, length = 0.5) {
    return Math.round(lerp(from, to, tween(time, start, start + length, ease.quartOut)))
}

const counterYear = computed(() => {
    const time = t.value
    if (time < T.cardsCut) return mapYear.value
    if (time < T.bocklinIn) return roll(time, 1510, 1536, T.cardsCut, 0.4)
    if (time < T.todayRoll) return roll(time, 1536, 1872, T.bocklinIn, 0.55)
    return roll(time, 1872, 2024, T.todayRoll, 0.55)
})

const context = computed(() => {
    const time = t.value
    if (time < T.venusCut) {
        const year = mapYear.value
        const level = year < -8000 ? -55 : year < -6000 ? -35 : year < -4000 ? -15 : year < -2000 ? -3 : year < 1 ? -1 : 0
        return level ? `Sea level −${-level} m` : 'Sea level as today'
    }
    if (time < T.cardsCut) return 'Giorgione · Sleeping Venus'
    if (time < T.bocklinIn) return 'Jean Clouet · Guillaume Budé'
    if (time < T.todayRoll) return 'Arnold Böcklin · Self-portrait'
    return 'Today'
})

const chapter = computed(() => {
    const time = t.value
    if (time < T.venusCut) return { n: '01', title: 'Map of time' }
    if (time < T.cardsCut) return { n: '02', title: 'A closer look' }
    return { n: '03', title: 'Nodes' }
})

const counterOpacity = computed(() => 1 - span(t.value, T.endTitle - 0.3, T.endTitle + 0.1))

const flash = computed(() => {
    const time = t.value
    const cut = (at: number) => (time >= at && time < at + 0.12 ? 1 - span(time, at, at + 0.12) : 0)
    return Math.max(cut(T.venusCut) * 0.3, cut(T.cardsCut) * 0.15)
})

const endItems = ['Map of time', 'A closer look', 'Nodes']
const endStyle = computed(() => ({
    opacity: t.value >= T.endTitle ? 1 : 0,
    transform: `scale(${lerp(1, 1.03, span(t.value, T.endTitle, T.end))})`,
}))
const endItemStyle = (i: number) => {
    const p = tween(t.value, T.endTitle + 0.7 + i * 0.12, T.endTitle + 1.3 + i * 0.12, ease.expoOut)
    return { opacity: p, transform: `translateY(${(1 - p) * 12}px)` }
}

// ── Touches ──────────────────────────────────────────────────────────────

const storyButton = (index: number) => storyRef.value?.$el.querySelectorAll('.story-controls button')[index]
const { touch } = useTouch(root, [
    {
        kind: 'drag',
        start: T.mapDragStart,
        end: T.mapDragEnd,
        target: () => sliderRef.value?.$el.querySelector('input'),
        position: dragProgress,
    },
    { kind: 'tap', at: T.markerTap, target: () => markerRef.value },
    { kind: 'tap', at: T.storyNext, target: () => storyButton(2) },
    { kind: 'tap', at: T.budeFlip, target: () => budeRef.value?.querySelector('.node-card__flip') },
    { kind: 'tap', at: T.budeFold, target: () => budeRef.value?.querySelector('.node-card__collapse') },
    { kind: 'tap', at: T.bocklinFlip, target: () => bocklinRef.value?.querySelector('.node-card__flip') },
    { kind: 'tap', at: T.bocklinFold, target: () => bocklinRef.value?.querySelector('.node-card__collapse') },
])
</script>

<style scoped>
.tl {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: var(--aw-color-bg);
}

.tl__slider {
    position: absolute;
    z-index: 20;
    left: 24px;
    right: 24px;
    top: 600px;
}

/* Painting */
.tl__painting {
    position: absolute;
    z-index: 5;
    overflow: hidden;
    background: #000;
}

.tl__painting-image {
    display: block;
    width: 100%;
    height: 100%;
}

.tl__marker {
    position: absolute;
    width: 28px;
    height: 28px;
    margin: -14px 0 0 -14px;
    padding: 0;
    border: 1.5px solid var(--aw-color-gold);
    border-radius: 50%;
    background-color: rgba(0, 0, 0, 0.25);
}

.tl__marker::after {
    content: "";
    position: absolute;
    inset: -1.5px;
    border: 1.5px solid var(--aw-color-gold);
    border-radius: 50%;
    animation: tl-halo 2.2s var(--aw-ease) infinite;
}

.tl__marker-dot {
    position: absolute;
    inset: 50% auto auto 50%;
    width: 6px;
    height: 6px;
    margin: -3px 0 0 -3px;
    border-radius: 50%;
    background-color: var(--aw-color-gold);
}

@keyframes tl-halo {
    from {
        opacity: 0.7;
        transform: scale(1);
    }

    to {
        opacity: 0;
        transform: scale(2.2);
    }
}

/* Story widget */
.tl__story {
    position: absolute;
    top: 192px;
    left: 24px;
    width: calc((432px - 48px) / 0.86);
    transform-origin: 0 0;
}

.tl__story :deep(.story__panel) {
    opacity: var(--panel-opacity);
}

/* Cards and nodes */
.tl__card {
    position: absolute;
    left: 0;
    top: 0;
    display: grid;
    place-items: center;
    width: 432px;
    height: 724px;
}

.tl__node {
    position: absolute;
    width: 64px;
    height: 64px;
    overflow: hidden;
    border-radius: 50%;
    box-shadow: 0 0 0 1px var(--aw-color-gold-soft);
}

.tl__node img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 22% 40%;
    transform: scale(2.4);
    transform-origin: 22% 40%;
}

.tl__axis {
    position: absolute;
    inset: 0;
}

.tl__axis-line {
    position: absolute;
    left: 24px;
    right: 24px;
    top: 556px;
    height: 1px;
    background: var(--aw-color-line-strong);
}

.tl__axis-year {
    position: absolute;
    top: 596px;
    transform: translateX(-50%);
    color: var(--aw-color-text-muted);
    font-family: var(--aw-font-mono);
    font-size: 11px;
}

.tl__threads {
    position: absolute;
    inset: 0;
    width: 432px;
    height: 768px;
}

.tl__thread {
    fill: none;
    stroke: var(--aw-color-gold);
    stroke-width: 1.2;
    stroke-dasharray: 1 1;
}

.tl__next {
    position: absolute;
    left: 24px;
    top: 372px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--aw-color-gold-bright);
    font-family: var(--aw-font-mono);
    font-size: 11px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.tl__next-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--aw-color-gold);
}

/* Counter */
.tl__shade {
    position: absolute;
    inset: 0 0 auto;
    z-index: 10;
    height: 300px;
    background: linear-gradient(to bottom, rgba(5, 5, 5, 0.86) 0%, rgba(5, 5, 5, 0.6) 45%, transparent 100%);
    pointer-events: none;
}

.tl__counter {
    position: absolute;
    z-index: 20;
    left: 24px;
    top: 104px;
}

.tl__context {
    margin: 10px 0 0;
    color: var(--aw-color-text-muted);
    font-family: var(--aw-font-mono);
    font-size: 10.5px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.tl__chapter {
    position: absolute;
    z-index: 20;
    top: 106px;
    right: 60px;
    margin: 0;
    color: var(--aw-color-text-muted);
    font-family: var(--aw-font-mono);
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.tl__chapter-number {
    margin-right: 8px;
    color: var(--aw-color-gold);
}

/* Captions */
.tl__caption {
    position: absolute;
    z-index: 20;
    left: 24px;
    bottom: 196px;
    font-family: var(--aw-font-display);
    font-size: 40px;
    font-weight: 600;
    line-height: 1.02;
    letter-spacing: -0.04em;
    text-shadow: 0 2px 24px rgba(0, 0, 0, 0.6);
}

.tl__caption--top {
    top: 226px;
    bottom: auto;
}

.tl__source {
    position: absolute;
    z-index: 20;
    left: 24px;
    bottom: 186px;
    margin: 0;
    color: var(--aw-color-text-subtle);
    font-family: var(--aw-font-mono);
    font-size: 9.5px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
}

/* End */
.tl__end {
    position: absolute;
    z-index: 20;
    left: 24px;
    right: 60px;
    top: 196px;
    transform-origin: 0 50%;
}

.tl__end-title {
    font-family: var(--aw-font-display);
    font-size: 62px;
    font-weight: 600;
    line-height: 0.95;
    letter-spacing: -0.05em;
}

.tl__end-lead {
    margin-top: 16px;
    color: var(--aw-color-text-muted);
    font-size: 18px;
    line-height: 1.35;
    letter-spacing: -0.01em;
}

.tl__end-list {
    display: grid;
    gap: 10px;
    margin: 34px 0 0;
    padding: 18px 0 0;
    border-top: 1px solid var(--aw-color-line-strong);
    list-style: none;
    font-family: var(--aw-font-mono);
    font-size: 12px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.tl__end-list span {
    display: inline-block;
    width: 34px;
    color: var(--aw-color-gold);
}

.tl__flash {
    position: absolute;
    inset: 0;
    z-index: 60;
    background: #f2eee6;
    pointer-events: none;
}
</style>
