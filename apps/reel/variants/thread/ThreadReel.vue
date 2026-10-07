<!-- A "Threads" reel: plays a ThreadConfig's scenes in order (see types.ts). -->
<template>
    <div ref="root" class="th">
        <!-- Story widgets mount a moment early, so a picture can shrink into them. -->
        <template v-for="item in stories" :key="'story' + item.start">
            <div v-if="t >= item.start - 0.8 && t < item.end + 0.4" :ref="(el) => setStoryEl(item.start, el)"
                class="th__story" :style="storyStyle(item)">
                <ArtStory :data="item.scene.data" locale="en" />
            </div>
        </template>

        <template v-for="item in stills" :key="'still' + item.start">
            <div v-if="t >= item.start && t < item.end + 0.2 && !item.scene.framed" class="th__picture" :style="stillStyle(item)">
                <img :src="item.scene.picture.src" alt="" />
            </div>
            <div v-else-if="t >= item.start && t < item.end" class="th__print" :style="printStyle(item)">
                <img :src="item.scene.picture.src" alt="" />
            </div>
        </template>

        <ReelMap v-if="flight" v-bind="flight.map" />
        <div v-if="flight?.card" class="th__card" :style="flight.card.style">
            <p class="th__card-head">{{ flight.card.head }}</p>
            <p class="th__card-name">{{ flight.card.name }}</p>
            <p v-for="line in flight.card.lines" :key="line" class="th__card-line">{{ line }}</p>
        </div>

        <Compare v-for="item in compares" v-show="item.visible" :key="'cmp' + item.start" v-bind="item.props" />
        <p v-for="item in compares" v-show="item.footnoteOpacity > 0" :key="'fn' + item.start" class="th__footnote"
            :style="{ opacity: item.footnoteOpacity }">{{ item.footnote }}</p>

        <div v-if="graph" class="th__graph" :style="graph.style">
            <svg class="th__threads" viewBox="0 0 432 768" aria-hidden="true">
                <path v-for="thread in graph.threads" :key="thread.id" :d="thread.d" pathLength="1"
                    :class="['th__thread', { 'th__thread--second': thread.second }]"
                    :style="{ strokeDashoffset: 1 - thread.progress }" />
            </svg>
            <div v-for="node in graph.nodes" :key="node.id" :class="['th__node', 'th__node--' + node.kind]" :style="node.style">
                <span v-if="node.kind !== 'text'" class="th__node-image" :style="node.image" />
                <span v-else class="th__node-dot" />
                <span class="th__node-label" :style="node.labelStyle">
                    <span class="th__node-year">{{ node.yearText }}</span>{{ node.name }}
                </span>
            </div>
        </div>

        <div class="th__shade" :style="{ opacity: counter.visible }" />
        <div :class="['th__counter', { 'th__counter--right': counter.right }]" :style="{ opacity: counter.visible }">
            <YearCounter :year="counter.year" :size="56" />
            <p class="th__context">{{ counter.context }}</p>
        </div>
        <p class="th__chapter" :style="{ opacity: counter.chapterOpacity }">
            <span class="th__chapter-number">{{ counter.chapter.n }}</span>{{ counter.chapter.title }}
        </p>

        <RevealText v-for="caption in captions" :key="caption.key"
            :class="['th__caption', 'th__caption--' + caption.place]" :lines="caption.lines" :at="caption.at"
            :out="caption.out" :duration="caption.duration" />
        <p v-for="item in stillNotes" :key="'note' + item.start" class="th__note" :style="{ opacity: item.opacity }">{{ item.text }}</p>

        <div v-if="ending" class="th__end" :style="{ opacity: ending.opacity }">
            <p class="th__series">{{ config.series }}</p>
            <RevealText class="th__end-title" :lines="['Art Widgets']" :at="ending.at" />
            <RevealText class="th__end-lead" :lines="ending.lead" :at="ending.at + 0.25" :stagger="0.08" />
            <p class="th__end-list" :style="{ opacity: span(t, ending.at + 0.8, ending.at + 1.2) }">
                Map of time · A closer look · Nodes &amp; threads
            </p>
        </div>

        <TouchDot :state="touch" />
        <Grain :amount="0.06" :vignette="0.6" />
    </div>
</template>

<script setup lang="ts">
import { computed, ref, type ComponentPublicInstance } from 'vue'
import { ArtStory } from '@art-widgets/story'
import { createProjection, MAP_HEIGHT } from '@art-widgets/time-map/geo'
import ReelMap from '~/components/ReelMap.vue'
import Compare from '~/components/Compare.vue'
import RevealText from '~/components/RevealText.vue'
import TouchDot from '~/components/TouchDot.vue'
import Grain from '~/components/Grain.vue'
import YearCounter from '~/components/YearCounter.vue'
import { ease, fade, keys, lerp, rectStyle, span, tween, type Rect } from '~/reel/motion'
import { holdFirstFrame, reelTime, STAGE } from '~/reel/time'
import { useTouch, type TouchStep } from '~/reel/touch'
import {
    COMPARE, FLIGHT, graphTimes, timeline,
    type CompareScene, type EndScene, type FlightScene, type GraphNode, type GraphScene, type StillScene,
    type StoryScene, type ThreadConfig, type Timed,
} from './types'

const props = defineProps<{ config: ThreadConfig }>()

const t = computed(() => reelTime.value)
const root = ref<HTMLElement | null>(null)

const items = timeline(props.config)
const ofKind = <K extends string>(kind: K) => items.filter((item) => item.scene.kind === kind) as never
const stills: Timed<StillScene>[] = ofKind('still')
const stories: Timed<StoryScene>[] = ofKind('story')
const flights: Timed<FlightScene>[] = ofKind('flight')
const compareItems: Timed<CompareScene>[] = ofKind('compare')
const graphItem = (ofKind('graph') as Timed<GraphScene>[])[0]
const endItem = (ofKind('end') as Timed<EndScene>[])[0]

// Every picture is decoded before the first frame.
const sources = new Set<string>()
for (const { scene } of items) {
    if (scene.kind === 'still') sources.add(scene.picture.src)
    if (scene.kind === 'story') sources.add(scene.data.image)
    if (scene.kind === 'compare') sources.add(scene.top.src).add(scene.bottom.src)
    if (scene.kind === 'graph') [scene.hub, ...scene.nodes].forEach((node) => node.picture && sources.add(node.picture.src))
}
for (const src of sources) {
    const image = new Image()
    image.src = src
    holdFirstFrame(image.decode())
}

const current = computed(() => items.find((item) => t.value >= item.start && t.value < item.end) ?? items[items.length - 1]!)

// ── Stills and the story widget ────────────────────────────────────────────

const storyEls = new Map<number, HTMLElement>()
function setStoryEl(start: number, el: Element | ComponentPublicInstance | null) {
    if (el instanceof HTMLElement) storyEls.set(start, el)
    else storyEls.delete(start)
}
const frames = new Map<number, Rect>()

function measureFrame(storyStart: number): Rect | null {
    const cached = frames.get(storyStart)
    if (cached) return cached
    const frame = storyEls.get(storyStart)?.querySelector('.story__frame')
    const stage = root.value
    if (!frame || !stage) return null
    const outer = stage.getBoundingClientRect()
    const rect = frame.getBoundingClientRect()
    const k = outer.width / STAGE.width
    const measured = { left: (rect.left - outer.left) / k, top: (rect.top - outer.top) / k, width: rect.width / k, height: rect.height / k }
    frames.set(storyStart, measured)
    return measured
}

function coverRect(aspect: number, zoom: number, px: number, py: number): Rect {
    const baseHeight = Math.max(STAGE.height, STAGE.width / aspect)
    const height = baseHeight * zoom
    const width = height * aspect
    return {
        left: Math.min(0, Math.max(STAGE.width - width, STAGE.width / 2 - (px / 100) * width)),
        top: Math.min(0, Math.max(STAGE.height - height, STAGE.height / 2 - (py / 100) * height)),
        width,
        height,
    }
}

const MORPH = 0.7

function stillStyle({ scene, start, end }: Timed<StillScene>) {
    const time = t.value
    const aspect = scene.picture.size.width / scene.picture.size.height
    const moveEnd = scene.intoStory ? end - MORPH : end
    const p = ease.inOut(span(time, start, moveEnd))
    const cover = coverRect(aspect, lerp(scene.from.zoom, scene.to.zoom, p), lerp(scene.from.x, scene.to.x, p), lerp(scene.from.y, scene.to.y, p))
    let rect = cover
    let radius = 0
    const morph = scene.intoStory ? tween(time, end - MORPH, end, ease.quartInOut) : 0
    if (morph > 0) {
        const to = measureFrame(end)
        if (to) {
            rect = {
                left: lerp(cover.left, to.left, morph),
                top: lerp(cover.top, to.top, morph),
                width: lerp(cover.width, to.width, morph),
                height: lerp(cover.height, to.height, morph),
            }
            radius = 6 * morph
        }
    }
    const base = coverRect(aspect, 1, 50, 50)
    return {
        ...rectStyle(rect, { width: base.width, height: base.height }),
        borderRadius: (radius * base.width) / rect.width + 'px',
        opacity: scene.intoStory ? 1 - span(time, end, end + 0.15) : fade(time, start, end, 0, 0),
    }
}

/** An old photograph as a print: a white border, a slight tilt, a slow push. */
function printStyle({ scene, start, end }: Timed<StillScene>) {
    const time = t.value
    const p = ease.inOut(span(time, start, end))
    const appear = tween(time, start, start + 0.6, ease.out)
    const width = 270
    const height = (width * scene.picture.size.height) / scene.picture.size.width
    const zoom = lerp(scene.from.zoom, scene.to.zoom, p)
    return {
        width: width + 'px',
        height: height + 'px',
        left: (STAGE.width - width) / 2 + 'px',
        top: 270 - height / 2 + 'px',
        opacity: appear,
        transform: `translateY(${(1 - appear) * 20}px) rotate(-1.2deg) scale(${zoom})`,
    }
}

const stillNotes = computed(() => stills.filter(({ scene }) => scene.note).map(({ scene, start, end }) => ({
    start,
    text: scene.note!,
    opacity: fade(t.value, start + 0.4, end, 0.4, 0.3),
})))

function storyStyle({ scene, start, end }: Timed<StoryScene>) {
    const time = t.value
    const previous = items[items.findIndex((item) => item.start === start) - 1]
    const morphed = previous?.scene.kind === 'still' && previous.scene.intoStory
    const appear = morphed ? tween(time, start - 0.3, start + 0.3, ease.out) : tween(time, start, start + 0.4, ease.out)
    return {
        left: (STAGE.width - scene.width * scene.scale) / 2 + 'px',
        width: scene.width + 'px',
        transform: `scale(${scene.scale})`,
        opacity: (morphed ? (time < start - MORPH ? 0 : 1) : appear) * (1 - span(time, end - 0.3, end + 0.05)),
        '--panel-opacity': String(appear),
    }
}

// ── Flights ────────────────────────────────────────────────────────────────

const projection = createProjection()
const BASE = STAGE.height / MAP_HEIGHT

/** Zoom at which both places fit comfortably on the stage. */
function fitZoom(scene: FlightScene) {
    const a = projection(scene.from.at)
    const b = projection(scene.to.at)
    if (!a || !b) return 3
    const dx = Math.abs(a[0] - b[0]) * BASE
    const dy = Math.abs(a[1] - b[1]) * BASE
    return Math.min(8, (STAGE.width * 0.62) / Math.max(dx, 1), (STAGE.height * 0.34) / Math.max(dy, 1))
}

const flight = computed(() => {
    const item = flights.find(({ start, end }) => t.value >= start - 0.05 && t.value < end)
    if (!item) return null
    const { scene, start, end } = item
    const time = t.value
    const glideStart = start + FLIGHT.hold
    const glideEnd = end - FLIGHT.settle
    const p = ease.inOut(span(time, glideStart, glideEnd))
    const fit = fitZoom(scene)
    // Close enough at both ends to read the states, even on a long flight.
    const near = Math.min(9, Math.max(2.2, fit * 1.35))
    const zoom = Math.exp(keys(time, [[start, Math.log(near)], [glideStart, Math.log(near)], [(glideStart + glideEnd) / 2, Math.log(fit)], [glideEnd, Math.log(near)]].map(([at, z]) => [at!, z!, ease.inOut])))
    const year = Math.round(lerp(scene.years[0], scene.years[1], p))
    const arrived = span(time, glideEnd - 0.3, glideEnd + 0.1)
    const card = scene.card && {
        ...scene.card,
        style: (() => {
            const o = fade(time, start + 0.4, end - 0.1, 0.35, 0.25)
            return { opacity: o, transform: `translateY(${(1 - o) * 12}px) rotate(1.5deg)` }
        })(),
    }
    return {
        card,
        map: {
            year,
            camera: { lon: lerp(scene.from.at[0], scene.to.at[0], p), lat: lerp(scene.from.at[1], scene.to.at[1], p), zoom },
            mode: 'quiet' as const,
            strokeZoom: 2.4,
            labelArea: 0,
            featureLabels: false,
            highlight: [{ at: scene.from.at, opacity: span(time, start, start + 0.3) }, { at: scene.to.at, opacity: arrived }],
            pins: [
                { id: 'from', at: scene.from.at, label: scene.from.label, opacity: span(time, start, start + 0.3) },
                { id: 'to', at: scene.to.at, label: scene.to.label, opacity: arrived },
            ],
            arcs: [{ from: scene.from.at, to: scene.to.at, progress: tween(time, glideStart, glideEnd, ease.inOut) }],
            avoid: [{ x: 0, y: 0, w: 432, h: 200 }, { x: 0, y: 470, w: 432, h: 298 }],
        },
    }
})

// ── Compares ───────────────────────────────────────────────────────────────

const compares = computed(() => compareItems.map(({ scene, start, end }) => {
    const local = t.value - start
    return {
        start,
        visible: t.value >= start && t.value < end,
        footnote: scene.footnote,
        footnoteOpacity: scene.footnote ? fade(t.value, start + COMPARE.thread[1] + 0.3, end - 0.2, 0.4, 0.2) : 0,
        props: {
            top: scene.top,
            bottom: scene.bottom,
            drift: 1 + 0.05 * ease.inOut(span(t.value, start, end)),
            reveal: ease.quartOut(span(local, ...COMPARE.reveal)),
            outline: ease.inOut(span(local, ...COMPARE.outline)),
            threadProgress: ease.inOut(span(local, ...COMPARE.thread)),
            kind: scene.type,
            note: scene.note,
            chipOpacity: tween(local, COMPARE.chip, COMPARE.chip + 0.35, ease.out),
            opacity: 1 - span(t.value, end - 0.2, end),
        },
    }
}))

// ── The graph ──────────────────────────────────────────────────────────────

const CENTER = { x: 216, y: 384 }
const RADIUS = { x: 132, y: 160 }
const SIZES = { hub: 84, image: 50, text: 14 }

function cropStyle(picture: NonNullable<GraphNode['picture']>, diameter: number) {
    const width = diameter * picture.span
    const height = width / (picture.size.width / picture.size.height)
    return {
        backgroundImage: `url(${picture.src})`,
        backgroundSize: `${width}px ${height}px`,
        backgroundPosition: `${diameter / 2 - (picture.x / 100) * width}px ${diameter / 2 - (picture.y / 100) * height}px`,
    }
}

function curve(a: { x: number; y: number }, b: { x: number; y: number }, bend = 0.18) {
    const mx = (a.x + b.x) / 2
    const my = (a.y + b.y) / 2
    return `M ${a.x} ${a.y} Q ${mx - (b.y - a.y) * bend} ${my + (b.x - a.x) * bend} ${b.x} ${b.y}`
}

const yearText = (year: number) => (year < 0 ? Math.abs(year) + ' BCE' : String(year))

const graphLayout = graphItem && (() => {
    const { scene, start } = graphItem
    const times = graphTimes(scene, start)
    const count = scene.nodes.length
    const first = -150
    const last = 190
    const positions = Object.fromEntries(scene.nodes.map((node, i) => {
        const angle = ((first + ((last - first) * i) / Math.max(1, count - 1)) * Math.PI) / 180
        return [node.id, { x: CENTER.x + RADIUS.x * Math.cos(angle), y: CENTER.y + RADIUS.y * Math.sin(angle) }]
    }))
    positions[scene.hub.id] = CENTER
    return { scene, start, times, positions }
})()

const graph = computed(() => {
    if (!graphLayout || t.value < graphLayout.start - 0.1) return null
    const { scene, start, times, positions } = graphLayout
    const time = t.value
    const all = [{ ...scene.hub, kind: 'hub' as const, at: start }, ...scene.nodes.map((node) => ({
        ...node, kind: node.picture ? ('image' as const) : ('text' as const), at: times[node.id]!,
    }))]
    const nodes = all.map((node) => {
        const p = positions[node.id]!
        const pop = tween(time, node.at, node.at + 0.45, ease.backOut)
        const size = SIZES[node.kind]
        const below = node.kind === 'hub' || p.y - CENTER.y > -40
        return {
            id: node.id,
            kind: node.kind,
            yearText: node.yearLabel ?? yearText(node.year),
            name: node.name,
            style: {
                left: p.x + 'px',
                top: p.y + 'px',
                width: size + 'px',
                height: size + 'px',
                opacity: String(Math.min(1, pop * 1.5)),
                transform: `translate(-50%, -50%) scale(${pop})`,
            },
            image: node.picture ? cropStyle(node.picture, size) : {},
            labelStyle: below
                ? { top: size + 6 + 'px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' as const }
                : { bottom: size + 6 + 'px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' as const },
        }
    })
    const threads = scene.nodes.flatMap((node) => {
        const into = node.direction === 'in'
        const from = into ? positions[node.id]! : CENTER
        const to = into ? CENTER : positions[node.id]!
        const at = times[node.id]!
        const list = [{ id: node.id, d: curve(from, to), progress: tween(time, at - 0.1, at + 0.4, ease.inOut), second: false }]
        if (node.alsoFrom && positions[node.alsoFrom]) {
            list.push({
                id: node.id + '-also',
                d: curve(positions[node.alsoFrom]!, positions[node.id]!, -0.25),
                progress: tween(time, at + 0.15, at + 0.65, ease.inOut),
                second: true,
            })
        }
        return list
    })
    const settle = endItem ? tween(time, endItem.start + 1.0, endItem.start + 1.8, ease.quartInOut) : 0
    return {
        nodes,
        threads,
        style: {
            opacity: span(time, start - 0.1, start + 0.3),
            transform: `translateY(${lerp(0, -150, settle)}px) scale(${lerp(1, 0.62, settle)})`,
        },
    }
})

// ── Captions ───────────────────────────────────────────────────────────────

interface Caption {
    key: string
    lines: string[]
    at: number
    out?: number
    duration?: number
    place: 'bottom' | 'top' | 'big'
}

const captions: Caption[] = []
for (const { scene, start, end } of stills) {
    const list = scene.captions ?? []
    const until = scene.intoStory ? end - MORPH : end
    const slot = (until - start - 0.1) / Math.max(1, list.length)
    list.forEach((lines, i) => {
        const at = start + 0.15 + i * slot
        captions.push({ key: `s${start}-${i}`, lines, at, out: at + slot - 0.5, place: 'bottom' })
    })
}
for (const { scene, start, end } of flights) {
    if (scene.caption) captions.push({ key: `f${start}`, lines: scene.caption, at: start + 0.1, out: end - 0.45, place: 'bottom' })
}
if (graphLayout) {
    const stepped = graphLayout.scene.nodes.filter((node) => node.lines)
    stepped.forEach((node, i) => {
        const at = graphLayout.times[node.id]! - 0.05
        const next = stepped[i + 1] ? graphLayout.times[stepped[i + 1]!.id]! - 0.05 : (endItem?.start ?? at + 1.2)
        captions.push({ key: `g${node.id}`, lines: node.lines!, at, out: next - 0.45, duration: 0.45, place: 'top' })
    })
}
if (endItem) {
    captions.push({ key: 'end', lines: endItem.scene.line, at: endItem.start, out: endItem.start + 1.05, place: 'big' })
}

const ending = computed(() => {
    if (!endItem || t.value < endItem.start + 1.2) return null
    return { at: endItem.start + 1.2, lead: endItem.scene.lead, opacity: 1 }
})

// ── Counter and chapter ────────────────────────────────────────────────────

function yearAt(item: Timed): number {
    const { scene, start, end } = item
    const time = t.value
    switch (scene.kind) {
        case 'still':
        case 'story':
            return scene.year
        case 'flight':
            return Math.round(lerp(scene.years[0], scene.years[1], ease.inOut(span(time, start + FLIGHT.hold, end - FLIGHT.settle))))
        case 'compare':
            return Math.round(lerp(scene.years[0], scene.years[1], ease.inOut(span(time, start + COMPARE.thread[0], start + COMPARE.thread[1]))))
        default:
            return 0
    }
}

const counter = computed(() => {
    const item = current.value
    const index = items.indexOf(item)
    const inherited = <K extends 'chapter' | 'context'>(key: K) => {
        for (let i = index; i >= 0; i--) {
            const value = items[i]!.scene[key]
            if (value) return value
        }
        return undefined
    }
    const time = t.value
    // A print carries its own year in the caption; the counter would sit on it.
    const hides = (other?: Timed) => !!other && (other.scene.kind === 'story' || other.scene.kind === 'graph'
        || other.scene.kind === 'end' || (other.scene.kind === 'still' && !!other.scene.framed))
    const hidden = hides(item)
    // Fade around the scenes that hide it.
    let visible = hidden ? 0 : 1
    if (!hidden) {
        const next = items[index + 1]
        const prev = items[index - 1]
        if (hides(next)) visible = Math.min(visible, 1 - span(time, item.end - 0.3, item.end))
        if (hides(prev)) visible = Math.min(visible, span(time, item.start, item.start + 0.3))
    }
    return {
        year: yearAt(item.scene.kind === 'graph' || item.scene.kind === 'end' ? items[Math.max(0, index - 1)]! : item),
        visible,
        right: item.scene.kind === 'compare' && item.scene.counterSide === 'right',
        context: inherited('context') ?? '',
        chapter: inherited('chapter') ?? { n: '', title: '' },
        chapterOpacity: (item.scene.kind === 'compare' && item.scene.counterSide === 'right') || item.scene.kind === 'end'
            || (item.scene.kind === 'still' && item.scene.framed) ? 0 : 1,
    }
})

// ── Touches ────────────────────────────────────────────────────────────────

const steps: TouchStep[] = stories.flatMap(({ scene, start }) => scene.taps.map((tap) => ({
    kind: 'tap' as const,
    at: start + tap.at,
    target: () => storyEls.get(start)?.querySelectorAll('.story-controls button')[tap.button === 'next' ? 2 : 3],
    lead: 0.5,
    hold: 0.3,
})))
const { touch } = useTouch(root, steps)
</script>

<style scoped>
.th {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: var(--aw-color-bg);
}

.th__picture {
    position: absolute;
    z-index: 5;
    overflow: hidden;
    background: #000;
}

.th__picture img {
    display: block;
    width: 100%;
    height: 100%;
}

.th__print {
    position: absolute;
    z-index: 5;
    padding: 10px 10px 34px;
    background: #ece6da;
    box-shadow: 0 24px 60px -20px rgba(0, 0, 0, 0.9);
    box-sizing: content-box;
}

.th__print img {
    display: block;
    width: 100%;
    height: 100%;
    filter: contrast(1.05);
}

.th__story {
    position: absolute;
    top: 104px;
    transform-origin: 0 0;
}

.th__story :deep(.story__panel) {
    opacity: var(--panel-opacity);
}

.th__card {
    position: absolute;
    z-index: 25;
    right: 60px;
    top: 214px;
    width: 236px;
    padding: 14px 16px 13px;
    border-radius: 2px;
    background: #ece6da;
    box-shadow: 0 18px 40px -16px rgba(0, 0, 0, 0.8);
    color: #141210;
}

.th__card p {
    margin: 0;
}

.th__card-head {
    padding-bottom: 8px;
    margin-bottom: 8px !important;
    border-bottom: 1px solid rgba(20, 18, 16, 0.2);
    font-family: var(--aw-font-mono);
    font-size: 9px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.th__card-name {
    font-family: var(--aw-font-artwork);
    font-size: 21px;
    font-style: italic;
}

.th__card-line {
    font-size: 11.5px;
    line-height: 1.5;
}

.th__footnote,
.th__note {
    position: absolute;
    z-index: 21;
    left: 24px;
    right: 24px;
    margin: 0;
    color: var(--aw-color-text-muted);
    font-family: var(--aw-font-mono);
    font-size: 9px;
    letter-spacing: 0.04em;
    text-align: center;
    text-shadow: 0 1px 8px #000;
}

.th__footnote {
    top: 568px;
}

.th__note {
    top: 596px;
}

/* Graph */
.th__graph {
    position: absolute;
    inset: 0;
    transform-origin: 216px 384px;
}

.th__threads {
    position: absolute;
    inset: 0;
    width: 432px;
    height: 768px;
    overflow: visible;
}

.th__thread {
    fill: none;
    stroke: var(--aw-color-gold);
    stroke-width: 1.2;
    stroke-dasharray: 1 1;
    opacity: 0.85;
}

.th__thread--second {
    stroke: var(--aw-color-gold-bright);
    stroke-width: 1.6;
    opacity: 1;
}

.th__node {
    position: absolute;
}

.th__node-image {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background-repeat: no-repeat;
    box-shadow: 0 0 0 1px var(--aw-color-gold-soft), 0 8px 24px rgba(0, 0, 0, 0.6);
}

.th__node--hub .th__node-image {
    box-shadow: 0 0 0 1.5px var(--aw-color-gold), 0 0 32px rgba(201, 164, 106, 0.25);
}

.th__node-dot {
    position: absolute;
    inset: 0;
    border: 1.5px solid var(--aw-color-gold);
    border-radius: 50%;
    background: var(--aw-color-bg);
}

.th__node-dot::after {
    content: "";
    position: absolute;
    inset: 3px;
    border-radius: 50%;
    background: var(--aw-color-gold);
}

.th__node-label {
    position: absolute;
    display: grid;
    gap: 1px;
    color: var(--aw-color-text);
    font-family: var(--aw-font-sans);
    font-size: 10.5px;
    font-weight: 500;
    line-height: 1.2;
    white-space: nowrap;
    text-shadow: 0 1px 6px #000;
}

.th__node-year {
    color: var(--aw-color-gold-bright);
    font-family: var(--aw-font-mono);
    font-size: 9px;
    font-weight: 400;
    letter-spacing: 0.04em;
}

/* Counter */
.th__shade {
    position: absolute;
    inset: 0 0 auto;
    z-index: 10;
    height: 280px;
    background: linear-gradient(to bottom, rgba(5, 5, 5, 0.85) 0%, rgba(5, 5, 5, 0.55) 45%, transparent 100%);
    pointer-events: none;
}

.th__counter {
    position: absolute;
    z-index: 20;
    left: 24px;
    top: 104px;
}

.th__counter--right {
    left: auto;
    right: 60px;
    text-align: right;
}

.th__counter--right :deep(.year-counter) {
    justify-content: flex-end;
}

.th__context {
    margin: 10px 0 0;
    color: var(--aw-color-text-muted);
    font-family: var(--aw-font-mono);
    font-size: 10.5px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.th__chapter {
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

.th__chapter-number {
    margin-right: 8px;
    color: var(--aw-color-gold);
}

/* Captions */
.th__caption {
    position: absolute;
    z-index: 22;
    left: 24px;
    right: 48px;
    font-family: var(--aw-font-display);
    font-weight: 600;
    line-height: 1.02;
    letter-spacing: -0.04em;
    text-shadow: 0 2px 24px rgba(0, 0, 0, 0.6);
}

.th__caption--bottom {
    bottom: 196px;
    font-size: 38px;
}

.th__caption--top {
    top: 100px;
    font-size: 28px;
}

.th__caption--big {
    top: 100px;
    font-size: 40px;
}

/* End */
.th__end {
    position: absolute;
    z-index: 20;
    left: 24px;
    right: 60px;
    top: 392px;
}

.th__series {
    margin: 0 0 12px;
    color: var(--aw-color-gold);
    font-family: var(--aw-font-mono);
    font-size: 10.5px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.th__end-title {
    font-family: var(--aw-font-display);
    font-size: 56px;
    font-weight: 600;
    line-height: 0.95;
    letter-spacing: -0.05em;
}

.th__end-lead {
    margin-top: 12px;
    color: var(--aw-color-text-muted);
    font-size: 16px;
    line-height: 1.35;
}

.th__end-list {
    margin: 18px 0 0;
    padding-top: 14px;
    border-top: 1px solid var(--aw-color-line-strong);
    color: var(--aw-color-text-subtle);
    font-family: var(--aw-font-mono);
    font-size: 10.5px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}
</style>
