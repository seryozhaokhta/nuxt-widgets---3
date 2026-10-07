<!-- Variant B, "Kinetic": see kinetic.ts for the shot list. -->
<template>
    <div ref="root" :class="['kn', 'kn--' + ground]">
        <!-- Shots that keep state run underneath the word cards. -->
        <div v-if="t >= 10.5 && t < 12.5" class="kn__story">
            <ArtStory ref="storyRef" :data="venus" locale="en" />
        </div>
        <div v-if="t >= 13 && t < 16.5" class="kn__fold">
            <div ref="cardRef" class="kn__card" :style="cardStyle">
                <NodeCard :data="bocklin" locale="en" />
            </div>
            <div v-for="node in nodes" :key="node.id" class="kn__node" :style="node.style">
                <img :src="node.image" alt="" :style="{ objectPosition: node.position }" />
            </div>
            <svg class="kn__threads" viewBox="0 0 432 768" aria-hidden="true">
                <path v-for="(thread, i) in threads" :key="i" :d="thread" pathLength="1"
                    :style="{ strokeDashoffset: 1 - tween(t, 15.85 + i * 0.2, 16.35 + i * 0.2, ease.inOut) }" />
            </svg>
            <p class="kn__tag" :style="{ opacity: span(t, 16.0, 16.2) }">Next — threads of influence</p>
        </div>

        <template v-if="shot.kind === 'map'">
            <ReelMap :year="mapYear" :camera="mapCamera" :label-area="0" :feature-labels="false" :stroke-zoom="0.9" />
            <div class="kn__shade" />
            <YearCounter class="kn__year" :year="mapYear" :size="64" />
        </template>

        <div v-else-if="shot.kind === 'slider'" class="kn__slider-shot">
            <YearCounter class="kn__slider-year" :year="sliderYear" :size="92" />
            <div class="kn__slider">
                <YearSlider ref="sliderRef" :model-value="sliderYear" :min="-10000" :max="2024" scale="sqrt"
                    :ticks="[]" />
            </div>
        </div>

        <div v-else-if="shot.kind === 'crops'" class="kn__crop">
            <img :src="venus.image" alt="" class="kn__crop-image" :style="crop.style" />
            <div class="kn__reticle">
                <span class="kn__reticle-ring" />
                <span class="kn__reticle-h" />
                <span class="kn__reticle-v" />
            </div>
            <p class="kn__crop-label">{{ crop.label }}<span>x {{ crop.x.toFixed(1) }} · y {{ crop.y.toFixed(1) }}</span></p>
        </div>

        <div v-else-if="shot.kind === 'triptych'" class="kn__triptych">
            <div v-for="(band, i) in bands" :key="band.title" class="kn__band" :style="bandStyle(i)">
                <div class="kn__band-inner" :style="{ top: -(BAND_CENTER - band.height / 2) + 'px' }">
                    <ReelMap v-if="i === 0" :year="tripYear" :camera="{ lon: 20, lat: 40, zoom: 2.6 + 0.2 * span(t, 16.5, 18.5) }"
                        :label-area="0" :feature-labels="false" />
                    <img v-else-if="i === 1" :src="venus.image" alt="" class="kn__band-image" :style="bandPainting" />
                    <img v-else :src="bocklin.image" alt="" class="kn__band-image" :style="bandPortrait" />
                </div>
                <p class="kn__band-label"><span>0{{ i + 1 }}</span>{{ band.title }}</p>
            </div>
        </div>

        <div v-else-if="shot.kind === 'end'" class="kn__end">
            <template v-if="t < 19.5">
                <div class="kn__word kn__word--solo" :style="wordMotion(t < 19 ? 18.5 : 19)">
                    <FitWord :text="t < 19 ? 'ART' : 'WIDGETS'" :width="384" />
                </div>
            </template>
            <template v-else>
                <div class="kn__lockup" :style="lockupStyle">
                    <FitWord text="ART" :width="384" />
                    <FitWord text="WIDGETS" :width="384" class="kn__lockup-gold" />
                </div>
                <RevealText class="kn__end-lead" :lines="['Interactive pieces for telling', 'the history of art.']" :at="19.75" />
                <p class="kn__end-list" :style="{ opacity: span(t, 20.2, 20.5) }">Map of time · A closer look · Nodes</p>
            </template>
        </div>

        <div v-else-if="shot.kind === 'word'" class="kn__word" :style="wordMotion(shot.from)">
            <FitWord :text="shot.word!" :width="384" />
        </div>

        <!-- Poster frame: hairlines, marks and metadata -->
        <div :class="['kn__frame', { 'kn__frame--top-only': shot.kind === 'story' }]" aria-hidden="true">
            <span class="kn__rule kn__rule--top" />
            <span class="kn__rule kn__rule--bottom" />
            <span class="kn__meta kn__meta--tl">Art Widgets</span>
            <span class="kn__meta kn__meta--tr">{{ String(shotIndex + 1).padStart(2, '0') }} / {{ SHOTS.length }}</span>
            <span class="kn__meta kn__meta--bl">{{ timecode }}</span>
            <span class="kn__meta kn__meta--br">{{ shot.caption ?? BPM + ' bpm' }}</span>
        </div>

        <TouchDot :state="touch" />
        <Grain :amount="0.05" :vignette="0.25" />
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArtStory } from '@art-widgets/story'
import { NodeCard } from '@art-widgets/node-card'
import YearSlider from '@art-widgets/time-map/YearSlider.vue'
import ReelMap, { type MapCamera } from '~/components/ReelMap.vue'
import FitWord from '~/components/FitWord.vue'
import RevealText from '~/components/RevealText.vue'
import TouchDot from '~/components/TouchDot.vue'
import Grain from '~/components/Grain.vue'
import YearCounter from '~/components/YearCounter.vue'
import { bocklin, bude, venus } from '~/reel/content'
import { ease, lerp, rectStyle, span, tween } from '~/reel/motion'
import { holdFirstFrame, reelTime, STAGE } from '~/reel/time'
import { useTouch } from '~/reel/touch'
import { yearBetween } from '~/reel/years'
import { BPM, SHOTS, T } from './kinetic'

const t = computed(() => reelTime.value)
const root = ref<HTMLElement | null>(null)
const storyRef = ref<{ $el: HTMLElement } | null>(null)
const cardRef = ref<HTMLElement | null>(null)
const sliderRef = ref<{ $el: HTMLElement } | null>(null)

for (const src of [venus.image, bude.image, bocklin.image]) {
    const image = new Image()
    image.src = src
    holdFirstFrame(image.decode())
}

const shotIndex = computed(() => {
    const index = SHOTS.findIndex((shot) => t.value >= shot.from && t.value < shot.to)
    return index === -1 ? SHOTS.length - 1 : index
})
const shot = computed(() => SHOTS[shotIndex.value]!)
const ground = computed(() => (shot.value.kind === 'word' ? shot.value.ground ?? 'ink' : 'ink'))

const timecode = computed(() => {
    const frames = Math.floor(t.value * 24)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `00:00:${pad(Math.floor(frames / 24))}:${pad(frames % 24)}`
})

/** Words land fast: a short drop with a stretch, then a slow settle. */
function wordMotion(from: number) {
    const land = tween(t.value, from, from + 0.16, ease.expoOut)
    const settle = span(t.value, from, from + 0.5)
    return {
        transform: `translateY(${(1 - land) * 40}px) scale(${lerp(1.08, 1, ease.out(settle))}, ${lerp(1.3, 1, land) * lerp(1.08, 1, ease.out(settle))})`,
        opacity: land > 0 ? 1 : 0,
    }
}

// ── Map shots ──
const mapYear = computed(() => {
    const time = t.value
    if (time < 2.5) return yearBetween(-10000, -2000, span(time, ...T.mapARace))
    return yearBetween(-2000, 1500, span(time, ...T.mapBRace))
})
const mapCamera = computed<MapCamera>(() => {
    const time = t.value
    if (time < 2.5) {
        const p = ease.out(span(time, 1, 2.5))
        return { lon: lerp(18, 26, p), lat: lerp(50, 44, p), zoom: lerp(2.2, 2.8, p) }
    }
    const p = ease.out(span(time, 3.5, 5))
    return { lon: lerp(52, 72, p), lat: lerp(38, 36, p), zoom: lerp(1.5, 1.8, p) }
})

// ── Slider ──
const sliderProgress = (time: number) => ease.inOut(span(time, ...T.slider))
const sliderYear = computed(() => yearBetween(-10000, 2024, sliderProgress(t.value)))

// ── Painting crops ──
const CROPS = [
    { x: 19.5, y: 34, label: 'The goddess' },
    { x: 42.8, y: 32, label: 'The tree' },
    { x: 80, y: 29, label: 'The village' },
    { x: 9, y: 62, label: 'The red cushion' },
]
const ASPECT = 3017 / 1882
const crop = computed(() => {
    const i = Math.min(3, Math.max(0, Math.floor((t.value - 8.5) / 0.5)))
    const c = CROPS[i]!
    const local = span(t.value, 8.5 + i * 0.5, 9 + i * 0.5)
    const zoom = lerp(3.0, 3.3, ease.out(local))
    const width = STAGE.height * ASPECT * zoom
    const height = STAGE.height * zoom
    return {
        ...c,
        style: rectStyle(
            { width, height, left: STAGE.width / 2 - (c.x / 100) * width, top: STAGE.height / 2 - (c.y / 100) * height },
            { width: STAGE.height * ASPECT * 3, height: STAGE.height * 3 },
        ),
    }
})

// ── Card, fold, nodes ──
const cardStyle = computed(() => {
    const time = t.value
    const enter = tween(time, 13, 13.3, ease.expoOut)
    const slide = tween(time, 15.45, 15.8, ease.quartInOut)
    return {
        transform: `translate(${slide * 114}px, ${(1 - enter) * 60}px) scale(${lerp(1.15, 1.25, enter)})`,
    }
})
const NODE_Y = 384
const nodes = computed(() => [
    { id: 'venus', image: venus.image, position: '19% 36%', at: 15.75, x: 102 },
    { id: 'bude', image: bude.image, position: '50% 30%', at: 16.0, x: 216 },
].map((node) => {
    const pop = tween(t.value, node.at, node.at + 0.4, ease.backOut)
    return {
        ...node,
        style: { left: node.x + 'px', top: NODE_Y + 'px', transform: `translate(-50%, -50%) scale(${pop})` },
    }
}))
const threads = [
    `M 102 ${NODE_Y - 44} C 122 ${NODE_Y - 130}, 196 ${NODE_Y - 130}, 216 ${NODE_Y - 44}`,
    `M 216 ${NODE_Y - 44} C 236 ${NODE_Y - 130}, 310 ${NODE_Y - 130}, 330 ${NODE_Y - 44}`,
]

// ── Triptych ──
const BAND_CENTER = 384
const bands = [
    { title: 'Map of time', height: 158 },
    { title: 'A closer look', height: 158 },
    { title: 'Nodes', height: 158 },
]
function bandStyle(i: number) {
    const wipe = tween(t.value, 16.5 + i * 0.1, 16.85 + i * 0.1, ease.quartOut)
    return {
        top: 100 + i * 164 + 'px',
        height: bands[i]!.height + 'px',
        clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`,
    }
}
const tripYear = computed(() => yearBetween(1000, 1600, span(t.value, 16.5, 18.5)))
const bandPainting = computed(() => {
    const p = ease.inOut(span(t.value, 16.5, 18.5))
    const height = 360
    const width = height * ASPECT
    return rectStyle({ height, width, left: lerp(0, STAGE.width - width, p), top: BAND_CENTER - height * 0.45 }, { width, height })
})
const bandPortrait = computed(() => {
    const zoom = lerp(1, 1.08, span(t.value, 16.5, 18.5))
    const width = STAGE.width * zoom
    const height = width * (4389 / 3543)
    return rectStyle(
        { width, height, left: (STAGE.width - width) / 2, top: BAND_CENTER - height * 0.3 },
        { width: STAGE.width, height: STAGE.width * (4389 / 3543) },
    )
})

// ── End ──
const lockupStyle = computed(() => {
    const p = tween(t.value, 19.5, 19.9, ease.expoOut)
    return { transform: `translateY(${(1 - p) * 40}px)`, opacity: p }
})

// ── Touches ──
const storyButton = (index: number) => storyRef.value?.$el.querySelectorAll('.story-controls button')[index]
const { touch } = useTouch(root, [
    { kind: 'drag', start: T.slider[0], end: T.slider[1], target: () => sliderRef.value?.$el.querySelector('input'), position: sliderProgress },
    { kind: 'tap', at: T.storyNext[0], target: () => storyButton(2), lead: 0.35, hold: 0.2 },
    { kind: 'tap', at: T.storyNext[1], target: () => storyButton(2), lead: 0.3, hold: 0.25 },
    { kind: 'tap', at: T.cardFlip, target: () => cardRef.value?.querySelector('.node-card__flip'), lead: 0.25, hold: 0.25 },
    { kind: 'tap', at: T.cardFold, target: () => cardRef.value?.querySelector('.node-card__collapse'), lead: 0.1, hold: 0.25 },
])

</script>

<style scoped>
.kn {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: var(--ground);
    color: var(--ink);
    --ground: var(--aw-color-bg);
    --ink: var(--aw-color-text);
    --rule: rgba(242, 238, 230, 0.16);
}

.kn--gold {
    --ground: var(--aw-color-gold);
    --ink: #0a0a0a;
    --rule: rgba(10, 10, 10, 0.25);
}

.kn--paper {
    --ground: #ece6da;
    --ink: #0a0a0a;
    --rule: rgba(10, 10, 10, 0.2);
}

/* Words */
.kn__word {
    position: absolute;
    z-index: 30;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 24px;
    background: var(--ground);
    color: var(--ink);
    transform-origin: 50% 50%;
}

.kn__word--solo {
    background: var(--aw-color-bg);
    color: var(--aw-color-text);
}

/* Map */
.kn__shade {
    position: absolute;
    inset: 0 0 auto;
    height: 280px;
    background: linear-gradient(rgba(5, 5, 5, 0.85), transparent);
}

.kn__year {
    position: absolute;
    left: 24px;
    top: 124px;
}

/* Slider */
.kn__slider-shot {
    position: absolute;
    inset: 0;
    background: var(--aw-color-bg);
}

.kn__slider-year {
    position: absolute;
    left: 24px;
    top: 232px;
}

.kn__slider {
    position: absolute;
    left: 24px;
    top: 380px;
    width: calc(384px / 1.5);
    transform: scale(1.5);
    transform-origin: 0 0;
}

/* Crops */
.kn__crop {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: #000;
}

.kn__crop-image {
    position: absolute;
    max-width: none;
}

.kn__reticle {
    position: absolute;
    left: 216px;
    top: 384px;
}

.kn__reticle-ring {
    position: absolute;
    left: -30px;
    top: -30px;
    width: 60px;
    height: 60px;
    border: 1.5px solid var(--aw-color-gold);
    border-radius: 50%;
}

.kn__reticle-h,
.kn__reticle-v {
    position: absolute;
    background: var(--aw-color-gold);
}

.kn__reticle-h {
    left: -60px;
    width: 120px;
    top: 0;
    height: 1px;
    mask: linear-gradient(to right, #000 25%, transparent 25% 75%, #000 75%);
}

.kn__reticle-v {
    top: -60px;
    height: 120px;
    left: 0;
    width: 1px;
    mask: linear-gradient(#000 25%, transparent 25% 75%, #000 75%);
}

.kn__crop-label {
    position: absolute;
    left: 252px;
    top: 420px;
    display: grid;
    gap: 4px;
    margin: 0;
    color: var(--aw-color-text);
    font-family: var(--aw-font-artwork);
    font-size: 22px;
    font-style: italic;
    text-shadow: 0 1px 12px rgba(0, 0, 0, 0.8);
}

.kn__crop-label span {
    color: var(--aw-color-gold-bright);
    font-family: var(--aw-font-mono);
    font-size: 10px;
    font-style: normal;
    letter-spacing: 0.06em;
}

/* Story */
.kn__story {
    position: absolute;
    left: 24px;
    top: 118px;
    width: 384px;
}

/* Card and nodes */
.kn__fold {
    position: absolute;
    inset: 0;
    background: var(--aw-color-bg);
}

.kn__card {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
}

.kn__node {
    position: absolute;
    width: 80px;
    height: 80px;
    overflow: hidden;
    border-radius: 50%;
    box-shadow: 0 0 0 1px var(--aw-color-gold-soft);
}

.kn__node img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.kn__threads {
    position: absolute;
    inset: 0;
    width: 432px;
    height: 768px;
}

.kn__threads path {
    fill: none;
    stroke: var(--aw-color-gold);
    stroke-width: 1.4;
    stroke-dasharray: 1 1;
}

.kn__tag {
    position: absolute;
    left: 24px;
    right: 24px;
    top: 470px;
    margin: 0;
    color: var(--aw-color-gold-bright);
    font-family: var(--aw-font-mono);
    font-size: 11px;
    letter-spacing: 0.06em;
    text-align: center;
    text-transform: uppercase;
}

/* Triptych */
.kn__triptych {
    position: absolute;
    inset: 0;
    background: var(--aw-color-bg);
}

.kn__band {
    position: absolute;
    left: 0;
    right: 0;
    overflow: hidden;
    background: #000;
}

.kn__band-inner {
    position: absolute;
    left: 0;
    width: 432px;
    height: 768px;
}

.kn__band-image {
    position: absolute;
    max-width: none;
}

.kn__band-label {
    position: absolute;
    left: 24px;
    bottom: 10px;
    margin: 0;
    color: var(--aw-color-text);
    font-family: var(--aw-font-mono);
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-shadow: 0 1px 8px rgba(0, 0, 0, 0.9);
}

.kn__band-label span {
    margin-right: 8px;
    color: var(--aw-color-gold-bright);
}

/* End */
.kn__end {
    position: absolute;
    inset: 0;
    background: var(--aw-color-bg);
}

.kn__lockup {
    position: absolute;
    left: 24px;
    top: 128px;
    display: grid;
    gap: 6px;
}

.kn__lockup-gold {
    color: var(--aw-color-gold);
}

.kn__end-lead {
    position: absolute;
    left: 24px;
    top: 404px;
    color: var(--aw-color-text-muted);
    font-size: 20px;
    line-height: 1.3;
    letter-spacing: -0.01em;
}

.kn__end-list {
    position: absolute;
    left: 24px;
    top: 488px;
    margin: 0;
    color: var(--aw-color-text-subtle);
    font-family: var(--aw-font-mono);
    font-size: 11px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

/* Frame */
.kn__frame {
    position: absolute;
    inset: 0;
    z-index: 45;
    color: var(--ink);
    pointer-events: none;
}

.kn__rule {
    position: absolute;
    left: 24px;
    right: 24px;
    height: 1px;
    background: var(--rule);
}

.kn__rule--top {
    top: 96px;
}

.kn__rule--bottom {
    top: 592px;
}

.kn__frame--top-only .kn__rule--bottom,
.kn__frame--top-only .kn__meta--bl,
.kn__frame--top-only .kn__meta--br {
    display: none;
}

.kn__meta {
    position: absolute;
    font-family: var(--aw-font-mono);
    font-size: 9.5px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0.8;
}

.kn__meta--tl,
.kn__meta--tr {
    top: 80px;
}

.kn__meta--bl,
.kn__meta--br {
    top: 600px;
}

.kn__meta--tl,
.kn__meta--bl {
    left: 24px;
}

.kn__meta--tr,
.kn__meta--br {
    right: 24px;
}
</style>
