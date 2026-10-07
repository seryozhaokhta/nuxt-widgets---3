<!-- Variant C, "Wall label": see wall.ts for the plan and timings. -->
<template>
    <div ref="root" class="wl">
        <!-- Opening lines -->
        <div class="wl__open">
            <p class="wl__kicker" :style="soft(0.2, T.linesOut)">Art Widgets — a map of time</p>
            <p v-for="(line, i) in openLines" :key="line" class="wl__line" :style="soft(0.5 + i * 0.7, T.linesOut + i * 0.1)">{{ line }}</p>
        </div>

        <!-- The map, flying to each place in its year -->
        <ReelMap v-if="t >= 3 && t < 22.4" :year="mapYear" :camera="camera" :pins="pins" :label-area="700_000"
            :feature-labels="false" :opacity="mapOpacity"
            :avoid="[{ x: 0, y: 0, w: 432, h: 200 }, { x: 0, y: 560, w: 432, h: 208 }]" />
        <div class="wl__map-text" :style="{ opacity: mapOpacity }">
            <p class="wl__year">{{ yearDigits(mapYear) }}<span>{{ era(mapYear) }}</span></p>
            <p class="wl__place">{{ place }}</p>
        </div>

        <!-- Sleeping Venus -->
        <div v-if="t >= T.toVenus[0] && t < T.toMapParis[1]" class="wl__painting" :style="venusStyle">
            <img :src="venus.image" alt="" />
            <span class="wl__marker" :style="markerStyle"><span /></span>
        </div>
        <div class="wl__story" :style="{ opacity: fade(t, 9.9, 12.0, 0.6, 0.5) }">
            <p class="wl__story-step"><span>01 / 03</span> The goddess</p>
            <p class="wl__story-text">{{ venus.points[0]!.text }}</p>
        </div>

        <!-- Budé -->
        <div v-if="t >= T.toBude[0] && t < T.toMapMunich[1]" class="wl__card-scene" :style="{ opacity: crossfade(T.toBude, T.toMapMunich) }">
            <div ref="budeRef" class="wl__card" :style="{ transform: `scale(${lerp(0.94, 1, span(t, T.toBude[0], T.toMapMunich[0]))})` }">
                <NodeCard :data="bude" locale="en" />
            </div>
        </div>

        <!-- Böcklin: the painting, then its card -->
        <div v-if="t >= T.toBocklin[0] && t < T.toCard[1]" class="wl__painting" :style="bocklinStyle">
            <img :src="bocklin.image" alt="" />
        </div>
        <div v-if="t >= T.toCard[0]" class="wl__card-scene" :style="{ opacity: span(t, ...T.toCard) }">
            <div ref="bocklinRef" class="wl__card" :style="bocklinCardStyle">
                <NodeCard :data="bocklin" locale="en" />
            </div>
        </div>

        <!-- Wall labels -->
        <WallLabel v-for="label in labels" :key="label.title" :label="label" :style="labelStyle(label)" />

        <!-- Nodes and the end -->
        <template v-if="t >= T.nodes - 0.2">
            <div v-for="node in nodes" :key="node.id" class="wl__node" :style="node.style">
                <img :src="node.image" alt="" :style="{ objectPosition: node.position }" />
            </div>
            <svg class="wl__threads" viewBox="0 0 432 768" aria-hidden="true">
                <path v-for="(thread, i) in threads" :key="i" :d="thread" pathLength="1"
                    :style="{ strokeDashoffset: 1 - tween(t, T.nodes + 0.3 + i * 0.3, T.nodes + 1.3 + i * 0.3, ease.inOut) }" />
            </svg>
        </template>
        <div class="wl__end">
            <p class="wl__kicker" :style="soft(T.endText, 99)">Art Widgets</p>
            <p v-for="(line, i) in endLines" :key="line" class="wl__line" :style="soft(T.endText + 0.3 + i * 0.35, 99)">{{ line }}</p>
        </div>
        <p class="wl__end-list" :style="soft(T.endText + 1.2, 99)">Map of time · A closer look · Nodes</p>

        <TouchDot :state="touch" />
        <Grain :amount="0.085" :vignette="0.85" />
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { NodeCard } from '@art-widgets/node-card'
import ReelMap, { type MapCamera, type MapPin } from '~/components/ReelMap.vue'
import TouchDot from '~/components/TouchDot.vue'
import Grain from '~/components/Grain.vue'
import WallLabel, { type Label } from '~/components/WallLabel.vue'
import { bocklin, bude, places, venus } from '~/reel/content'
import { ease, fade, keys, lerp, span, tween } from '~/reel/motion'
import { holdFirstFrame, reelTime, STAGE } from '~/reel/time'
import { useTouch } from '~/reel/touch'
import { era, yearBetween, yearDigits } from '~/reel/years'
import { T } from './wall'

const t = computed(() => reelTime.value)
const root = ref<HTMLElement | null>(null)
const budeRef = ref<HTMLElement | null>(null)
const bocklinRef = ref<HTMLElement | null>(null)

for (const src of [venus.image, bude.image, bocklin.image]) {
    const image = new Image()
    image.src = src
    holdFirstFrame(image.decode())
}

const openLines = ['Every painting', 'has a place', 'and a year.']
const endLines = ['Mechanics for telling', 'the history of art.']

/** Soft entrance: from a blur, a little below; leaves the same way. */
function soft(at: number, out: number) {
    const time = t.value
    const enter = tween(time, at, at + 1.2, ease.out)
    const leave = tween(time, out, out + 0.6, ease.in)
    const visible = enter * (1 - leave)
    return {
        opacity: visible,
        filter: visible < 1 ? `blur(${(1 - visible) * 8}px)` : 'none',
        transform: `translateY(${(1 - enter) * 10 - leave * 6}px)`,
    }
}

/** Opacity of a layer that dissolves in over `into` and out over `outOf`. */
const crossfade = (into: readonly [number, number], outOf: readonly [number, number]) =>
    Math.min(span(t.value, ...into), 1 - span(t.value, ...outOf))

// ── Map ──
const venice = { lon: places.venice.at[0], lat: places.venice.at[1] }
const paris = { lon: places.paris.at[0], lat: places.paris.at[1] }
const munich = { lon: places.munich.at[0], lat: places.munich.at[1] }

/** Zoom moves in log space, so the flight speed feels even. */
const logZoom = (time: number, frames: [number, number][]) =>
    Math.exp(keys(time, frames.map(([at, zoom]) => [at, Math.log(zoom), ease.inOut])))

const camera = computed<MapCamera>(() => {
    const time = t.value
    if (time < 10) {
        const p = ease.inOut(span(time, 3.2, 8.6))
        return { lon: lerp(18, venice.lon, p), lat: lerp(36, venice.lat, p), zoom: logZoom(time, [[3.2, 1.3], [8.6, 7]]) }
    }
    if (time < 17) {
        const p = ease.inOut(span(time, 12.4, 15.4))
        return { lon: lerp(venice.lon, paris.lon, p), lat: lerp(venice.lat, paris.lat, p), zoom: logZoom(time, [[12, 7], [13.7, 3.2], [16, 6.5]]) }
    }
    const p = ease.inOut(span(time, 18.8, 21.4))
    return { lon: lerp(paris.lon, munich.lon, p), lat: lerp(paris.lat, munich.lat, p), zoom: logZoom(time, [[18.4, 6.5], [19.9, 3.4], [22.2, 6.8]]) }
})

const mapYear = computed(() => {
    const time = t.value
    if (time < 10) return yearBetween(1250, 1510, ease.out(span(time, 3.4, 7.4)))
    if (time < 17) return Math.round(lerp(1510, 1536, ease.inOut(span(time, 13, 14.8))))
    return yearBetween(1536, 1872, ease.inOut(span(time, 19, 21.2)))
})

const mapOpacity = computed(() => Math.max(
    crossfade(T.mapIn, [7.8, 8.6]),
    crossfade(T.toMapParis, T.toBude),
    crossfade(T.toMapMunich, T.toBocklin),
))

const pins = computed<MapPin[]>(() => {
    const time = t.value
    const list: MapPin[] = []
    const show = (from: number, to: number) => fade(time, from, to, 0.5, 0.4)
    if (show(6.4, 8.6)) list.push({ id: 'venice', at: places.venice.at, label: 'VENICE', opacity: show(6.4, 8.6) })
    if (show(14.4, 16.0)) list.push({ id: 'paris', at: places.paris.at, label: 'FRANCE', opacity: show(14.4, 16.0) })
    if (show(20.6, 22.2)) list.push({ id: 'munich', at: places.munich.at, label: 'MUNICH', opacity: show(20.6, 22.2) })
    return list
})

const place = computed(() => {
    const time = t.value
    if (time < 10) return time < 6 ? 'Europe' : 'Venice · 45.44° N, 12.34° E'
    if (time < 17) return time < 14 ? 'Leaving Venice' : 'France'
    return time < 20.4 ? 'Leaving France' : 'Munich · 48.14° N, 11.58° E'
})

// ── Paintings ──
const VENUS_ASPECT = 3017 / 1882
const venusStyle = computed(() => {
    const time = t.value
    const p = ease.inOut(span(time, T.toVenus[0], T.toMapParis[1]))
    const zoom = lerp(1.4, 1.12, p)
    const width = STAGE.height * VENUS_ASPECT * zoom
    const height = STAGE.height * zoom
    const px = lerp(0.2, 0.46, p)
    const py = lerp(0.42, 0.5, p)
    return {
        width: width + 'px',
        height: height + 'px',
        left: Math.min(0, Math.max(STAGE.width - width, STAGE.width / 2 - px * width)) + 'px',
        top: Math.min(0, Math.max(STAGE.height - height, STAGE.height / 2 - py * height)) + 'px',
        opacity: crossfade(T.toVenus, [12.2, 13.0]),
    }
})

const markerStyle = computed(() => ({
    left: venus.points[0]!.x + '%',
    top: venus.points[0]!.y + '%',
    opacity: fade(t.value, T.venusMarker, 12.0, 0.5, 0.4),
}))

const BOCKLIN_ASPECT = 3543 / 4389
const bocklinStyle = computed(() => {
    const time = t.value
    const p = ease.inOut(span(time, T.toBocklin[0], T.toCard[1]))
    const zoom = lerp(1.18, 1.0, p)
    const height = STAGE.height * zoom
    const width = height * BOCKLIN_ASPECT
    return {
        width: width + 'px',
        height: height + 'px',
        left: (STAGE.width - width) / 2 + lerp(40, 0, p) + 'px',
        top: (STAGE.height - height) * 0.3 + 'px',
        opacity: crossfade(T.toBocklin, T.toCard),
    }
})

// ── Labels ──
interface TimedLabel extends Label {
    from: number
    to: number
}
const labels: TimedLabel[] = [
    {
        artist: 'Giorgione',
        title: 'Sleeping Venus',
        date: 'c. 1510',
        medium: 'Oil on canvas',
        place: 'Gemäldegalerie Alte Meister, Dresden',
        from: 8.8,
        to: 12.0,
    },
    {
        artist: 'Jean Clouet',
        title: 'Guillaume Budé',
        date: 'c. 1536',
        medium: 'Oil on wood',
        place: 'The Metropolitan Museum of Art, New York',
        from: 16.2,
        to: 18.4,
    },
    {
        artist: 'Arnold Böcklin',
        title: 'Self-Portrait with Death Playing the Fiddle',
        date: '1872',
        medium: 'Oil on canvas',
        place: 'Alte Nationalgalerie, Berlin',
        from: 22.0,
        to: 24.6,
    },
]
function labelStyle(label: TimedLabel) {
    const enter = tween(t.value, label.from, label.from + 0.8, ease.out)
    const leave = tween(t.value, label.to - 0.5, label.to, ease.in)
    return { opacity: enter * (1 - leave), transform: `translateY(${(1 - enter) * 14}px)` }
}

// ── Cards and nodes ──
const NODE_Y = 470
const bocklinCardStyle = computed(() => {
    const slide = tween(t.value, T.fold + 0.55, T.fold + 1.1, ease.quartInOut)
    return { transform: `translate(${slide * 114}px, ${slide * (NODE_Y - 276)}px)` }
})
const nodes = computed(() => [
    { id: 'venus', image: venus.image, position: '19% 36%', at: T.nodes, x: 102 },
    { id: 'bude', image: bude.image, position: '50% 30%', at: T.nodes + 0.25, x: 216 },
].map((node) => {
    const pop = tween(t.value, node.at, node.at + 0.7, ease.out)
    return { ...node, style: { left: node.x + 'px', top: NODE_Y + 'px', opacity: pop, transform: `translate(-50%, -50%) scale(${lerp(0.7, 1, pop)})` } }
}))
const threads = [
    `M 102 ${NODE_Y - 32} C 122 ${NODE_Y - 110}, 196 ${NODE_Y - 110}, 216 ${NODE_Y - 32}`,
    `M 216 ${NODE_Y - 32} C 236 ${NODE_Y - 110}, 310 ${NODE_Y - 110}, 330 ${NODE_Y - 32}`,
]

// ── Touches ──
const { touch } = useTouch(root, [
    { kind: 'tap', at: T.budeFlip, target: () => budeRef.value?.querySelector('.node-card__flip'), lead: 0.6, hold: 0.5 },
    { kind: 'tap', at: T.fold, target: () => bocklinRef.value?.querySelector('.node-card__collapse'), lead: 0.6, hold: 0.4 },
])
</script>

<style scoped>
.wl {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: #070707;
}

.wl__open,
.wl__end {
    position: absolute;
    z-index: 20;
    left: 24px;
    right: 60px;
}

.wl__open {
    top: 300px;
}

.wl__end {
    top: 190px;
}

.wl__kicker {
    margin: 0 0 18px;
    color: var(--aw-color-gold);
    font-family: var(--aw-font-mono);
    font-size: 10.5px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
}

.wl__line {
    margin: 0;
    font-family: var(--aw-font-artwork);
    font-size: 40px;
    font-style: italic;
    font-weight: 400;
    line-height: 1.08;
    letter-spacing: -0.015em;
}

.wl__map-text {
    position: absolute;
    z-index: 20;
    left: 24px;
    top: 104px;
    text-shadow: 0 1px 16px rgba(0, 0, 0, 0.8);
}

.wl__year {
    margin: 0;
    font-family: var(--aw-font-artwork);
    font-size: 64px;
    font-style: italic;
    line-height: 1;
    letter-spacing: -0.02em;
    font-variant-numeric: lining-nums tabular-nums;
}

.wl__year span {
    margin-left: 8px;
    color: var(--aw-color-gold);
    font-family: var(--aw-font-mono);
    font-size: 12px;
    font-style: normal;
    letter-spacing: 0.06em;
}

.wl__place {
    margin: 8px 0 0;
    color: var(--aw-color-text-muted);
    font-family: var(--aw-font-mono);
    font-size: 10.5px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.wl__painting {
    position: absolute;
    overflow: hidden;
}

.wl__painting img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
}

.wl__marker {
    position: absolute;
    width: 28px;
    height: 28px;
    margin: -14px 0 0 -14px;
    border: 1.5px solid var(--aw-color-gold);
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.25);
}

.wl__marker span {
    position: absolute;
    inset: 50% auto auto 50%;
    width: 6px;
    height: 6px;
    margin: -3px 0 0 -3px;
    border-radius: 50%;
    background: var(--aw-color-gold);
}

.wl__marker::after {
    content: "";
    position: absolute;
    inset: -1.5px;
    border: 1.5px solid var(--aw-color-gold);
    border-radius: 50%;
    animation: wl-halo 2.2s var(--aw-ease) infinite;
}

@keyframes wl-halo {
    from {
        opacity: 0.7;
        transform: scale(1);
    }

    to {
        opacity: 0;
        transform: scale(2.2);
    }
}

.wl__story {
    position: absolute;
    z-index: 20;
    left: 24px;
    right: 60px;
    top: 104px;
    padding: 14px 16px;
    border-radius: 10px;
    background: rgba(8, 8, 8, 0.55);
    backdrop-filter: blur(12px);
}

.wl__story-step {
    margin: 0;
    color: var(--aw-color-text);
    font-family: var(--aw-font-display);
    font-size: 15px;
    font-weight: 600;
    letter-spacing: -0.02em;
}

.wl__story-step span {
    margin-right: 8px;
    color: var(--aw-color-gold);
    font-family: var(--aw-font-mono);
    font-size: 10.5px;
    font-weight: 400;
    letter-spacing: 0.04em;
}

.wl__story-text {
    margin: 6px 0 0;
    color: var(--aw-color-text-muted);
    font-size: 14px;
    line-height: 1.5;
}

.wl__card-scene {
    position: absolute;
    inset: 0;
    background: #070707;
}

.wl__card {
    position: absolute;
    inset: 0 0 216px;
    display: grid;
    place-items: center;
}

.wl__card :deep(.node-card) {
    transform: scale(0.86);
}

.wl__node {
    position: absolute;
    z-index: 5;
    width: 56px;
    height: 56px;
    overflow: hidden;
    border-radius: 50%;
    box-shadow: 0 0 0 1px var(--aw-color-gold-soft);
}

.wl__node img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.wl__threads {
    position: absolute;
    z-index: 5;
    inset: 0;
    width: 432px;
    height: 768px;
}

.wl__threads path {
    fill: none;
    stroke: var(--aw-color-gold);
    stroke-width: 1.2;
    stroke-dasharray: 1 1;
}

.wl__end-list {
    position: absolute;
    z-index: 20;
    left: 24px;
    right: 24px;
    top: 540px;
    margin: 0;
    color: var(--aw-color-text-subtle);
    font-family: var(--aw-font-mono);
    font-size: 10.5px;
    letter-spacing: 0.08em;
    text-align: center;
    text-transform: uppercase;
}
</style>
