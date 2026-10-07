<!-- Variant E, "Meninas": see meninas.ts for the plan and timings. -->
<template>
    <div ref="root" class="mn">
        <!-- 01 The picture: full-bleed, then it shrinks into the story widget -->
        <div v-if="t >= T.storyMount && t < T.storyOut + 0.4" class="mn__story" :style="storyStyle">
            <ArtStory ref="storyRef" :data="meninas" locale="en" />
        </div>
        <div v-if="t < T.shrink[1] + 0.2" class="mn__painting" :style="paintingStyle">
            <img :src="meninas.image" alt="" />
        </div>

        <!-- Flights on the map -->
        <ReelMap v-if="flight" :year="counterYear" :camera="flight.camera" :pins="flight.pins" :arcs="flight.arcs"
            :label-area="900_000" :feature-labels="false"
            :avoid="[{ x: 0, y: 0, w: 432, h: 200 }, { x: 0, y: 440, w: 432, h: 328 }]" />
        <div v-if="registerOpacity > 0" class="mn__register" :style="{ opacity: registerOpacity, transform: `translateY(${(1 - registerOpacity) * 12}px) rotate(1.5deg)` }">
            <p class="mn__register-head">Museo del Prado · Copyists’ register</p>
            <p class="mn__register-name">John S. Sargent</p>
            <p class="mn__register-line">copies <em>Las Meninas</em>, Velázquez</p>
            <p class="mn__register-line">Madrid, autumn 1879</p>
        </div>

        <!-- Compare scenes -->
        <Compare v-for="scene in compares" v-show="scene.visible" :key="scene.kind" v-bind="scene.props" />
        <p class="mn__footnote" :style="{ opacity: footnoteOpacity }">The panel hung in the king’s collection, which Velázquez looked after</p>

        <!-- The graph -->
        <div v-if="t >= T.graph - 0.1" class="mn__graph" :style="graphStyle">
            <svg class="mn__threads" viewBox="0 0 432 768" aria-hidden="true">
                <path v-for="thread in graphThreads" :key="thread.id" :d="thread.d" pathLength="1"
                    :class="['mn__thread', { 'mn__thread--second': thread.second }]"
                    :style="{ strokeDashoffset: 1 - thread.progress }" />
            </svg>
            <div v-for="node in graphNodes" :key="node.id" :class="['mn__node', 'mn__node--' + node.kind]" :style="node.style">
                <span v-if="node.kind !== 'text'" class="mn__node-image" :style="node.image" />
                <span v-else class="mn__node-dot" />
                <span class="mn__node-label" :style="node.labelStyle">
                    <span class="mn__node-year">{{ node.year }}</span>{{ node.name }}
                </span>
            </div>
        </div>

        <!-- Shade under the counter -->
        <div class="mn__shade" :style="{ opacity: shadeOpacity }" />

        <!-- Counter and chapter -->
        <div :class="['mn__counter', { 'mn__counter--right': counterRight }]" :style="{ opacity: counterOpacity }">
            <YearCounter :year="counterYear" :size="56" />
            <p class="mn__context">{{ context }}</p>
        </div>
        <p class="mn__chapter" :style="{ opacity: chapterOpacity }">
            <span class="mn__chapter-number">{{ chapter.n }}</span>{{ chapter.title }}
        </p>

        <!-- Captions -->
        <RevealText class="mn__caption" :lines="['She’s looking at you.']" :at="0.25" :out="1.35" />
        <RevealText class="mn__caption" :lines="['So is the painter.']" :at="1.45" :out="2.65" />
        <RevealText class="mn__caption" :lines="['Where did the', 'mirror come from?']" :at="9.1" :out="10.15" />
        <RevealText v-for="line in nodeLines" :key="line.id" class="mn__caption mn__caption--top" :lines="line.lines"
            :at="line.at" :out="line.out" :duration="0.45" />
        <RevealText class="mn__caption mn__caption--top mn__caption--big" :lines="['Every picture', 'answers another.']"
            :at="T.endLine" :out="T.endTitle - 0.1" />

        <!-- End -->
        <div class="mn__end" :style="{ opacity: t >= T.endTitle ? 1 : 0 }">
            <RevealText class="mn__end-title" :lines="['Art Widgets']" :at="T.endTitle" />
            <RevealText class="mn__end-lead" :lines="['Threads of influence: one of the', 'mechanics for telling the history of art.']"
                :at="T.endTitle + 0.25" :stagger="0.08" />
            <p class="mn__end-list" :style="{ opacity: span(t, T.endTitle + 0.8, T.endTitle + 1.2) }">
                Map of time · A closer look · Nodes &amp; threads
            </p>
        </div>

        <TouchDot :state="touch" />
        <Grain :amount="0.06" :vignette="0.6" />
        <div class="mn__flash" :style="{ opacity: flash }" />
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArtStory } from '@art-widgets/story'
import ReelMap, { type MapArc, type MapCamera, type MapPin } from '~/components/ReelMap.vue'
import Compare, { type Panel } from '~/components/Compare.vue'
import RevealText from '~/components/RevealText.vue'
import TouchDot from '~/components/TouchDot.vue'
import Grain from '~/components/Grain.vue'
import YearCounter from '~/components/YearCounter.vue'
import { meninas, works } from '~/reel/content'
import { ease, fade, keys, lerp, span, tween } from '~/reel/motion'
import { holdFirstFrame, reelTime, STAGE } from '~/reel/time'
import { useTouch } from '~/reel/touch'
import { COMPARES, NODE_TIMES, STEP, T } from './meninas'

const t = computed(() => reelTime.value)

const root = ref<HTMLElement | null>(null)
const storyRef = ref<{ $el: HTMLElement } | null>(null)

for (const work of [works.meninas, works.arnolfini, works.goya, works.boit]) {
    const image = new Image()
    image.src = work.image
    holdFirstFrame(image.decode())
}

// ── 01 The picture ─────────────────────────────────────────────────────────

const ASPECT = 3840 / 4420
const COVER_W = STAGE.height * ASPECT
const infanta = { x: 49, y: 66.5 }

function coverRect(zoom: number, px: number, py: number) {
    const width = COVER_W * zoom
    const height = STAGE.height * zoom
    return {
        left: Math.min(0, Math.max(STAGE.width - width, STAGE.width / 2 - px * width)),
        top: Math.min(0, Math.max(STAGE.height - height, STAGE.height / 2 - py * height)),
        width,
        height,
    }
}

const storyFrame = ref<{ left: number; top: number; width: number; height: number } | null>(null)

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
    const time = t.value
    const out = tween(time, ...T.hookOut, ease.inOut)
    const zoom = lerp(3.1, 1, out)
    const cover = coverRect(zoom, lerp(infanta.x / 100, 0.42, out), lerp(infanta.y / 100, 0.55, out))
    const shrink = tween(time, ...T.shrink, ease.quartInOut)
    let rect = cover
    if (shrink > 0) {
        if (!storyFrame.value) measureStory()
        const to = storyFrame.value ?? cover
        rect = {
            left: lerp(cover.left, to.left, shrink),
            top: lerp(cover.top, to.top, shrink),
            width: lerp(cover.width, to.width, shrink),
            height: lerp(cover.height, to.height, shrink),
        }
    }
    return {
        left: rect.left + 'px',
        top: rect.top + 'px',
        width: rect.width + 'px',
        height: rect.height + 'px',
        borderRadius: 6 * shrink + 'px',
        opacity: 1 - span(time, T.shrink[1], T.shrink[1] + 0.15),
    }
})

const storyStyle = computed(() => {
    const appear = tween(t.value, T.shrink[1] - 0.3, T.shrink[1] + 0.3, ease.out)
    return {
        opacity: (t.value < T.shrink[0] ? 0 : 1) * (1 - span(t.value, T.storyOut, T.storyOut + 0.35)),
        '--panel-opacity': String(appear),
    }
})

// ── Flights ────────────────────────────────────────────────────────────────

const madrid = works.meninas.at as [number, number]
const bruges = works.arnolfini.at as [number, number]
const paris = works.boit.at as [number, number]

const logZoom = (time: number, frames: [number, number][]) =>
    Math.exp(keys(time, frames.map(([at, zoom]) => [at, Math.log(zoom), ease.inOut])))

const flight = computed<{ camera: MapCamera; pins: MapPin[]; arcs: MapArc[] } | null>(() => {
    const time = t.value
    const fly = (from: [number, number], to: [number, number], [start, end]: readonly [number, number], fromLabel: string, toLabel: string) => {
        const p = ease.inOut(span(time, start + 0.1, end - 0.3))
        return {
            camera: {
                lon: lerp(from[0], to[0], p),
                lat: lerp(from[1], to[1], p),
                zoom: logZoom(time, [[start, 6], [(start + end) / 2, 3.4], [end, 6]]),
            },
            pins: [
                { id: 'from', at: from, label: fromLabel, opacity: span(time, start, start + 0.3) },
                { id: 'to', at: to, label: toLabel, opacity: span(time, end - 0.6, end - 0.3) },
            ],
            arcs: [{ from, to, progress: tween(time, start + 0.2, end - 0.3, ease.inOut) }],
        }
    }
    if (time >= T.flightBruges[0] - 0.05 && time < T.flightBruges[1]) {
        return fly(madrid, bruges, T.flightBruges, 'MADRID · 1656', 'BRUGES · 1434')
    }
    if (time >= T.flightParis[0] - 0.05 && time < T.flightParis[1]) {
        return fly(madrid, paris, T.flightParis, 'MADRID · 1879', 'PARIS · 1882')
    }
    return null
})

const registerOpacity = computed(() => fade(t.value, T.flightParis[0] + 0.3, T.flightParis[1] - 0.1, 0.35, 0.25))

// ── Compares ───────────────────────────────────────────────────────────────

const menPanel = (focus: { x: number; y: number }, zoom: number, boxes: Panel['boxes']): Panel => ({
    src: works.meninas.image,
    size: works.meninas.size,
    meta: '1656 · Velázquez · Madrid',
    title: 'Las Meninas',
    focus,
    zoom,
    boxes,
})

const SCENES = [
    {
        kind: 'Motif',
        note: 'A mirror shows who stands where we stand',
        top: {
            src: works.arnolfini.image, size: works.arnolfini.size,
            meta: '1434 · Jan van Eyck · Bruges', title: 'The Arnolfini Portrait',
            focus: { x: 50.2, y: 29.6 }, zoom: 2.1,
            boxes: [{ x: 42.4, y: 23.8, w: 15.6, h: 11.6 }],
        },
        bottom: menPanel({ x: 42, y: 56.5 }, 3.0, [{ x: 37.4, y: 50.5, w: 9.8, h: 12.5 }]),
    },
    {
        kind: 'Quotation',
        note: 'The painter at work, his canvas from behind',
        top: { ...menPanel({ x: 16, y: 44.5 }, 1.21, [
            { x: 0.6, y: 20, w: 16, h: 42 },
            { x: 17.5, y: 49, w: 11.5, h: 17 },
        ]), align: 'right' as const },
        bottom: {
            src: works.goya.image, size: works.goya.size,
            meta: '1800 · Francisco Goya · Madrid', title: 'The Family of Charles IV',
            focus: { x: 10, y: 38 }, zoom: 1.25, align: 'right' as const,
            boxes: [
                { x: 0.3, y: 20, w: 7.6, h: 35 },
                { x: 10.5, y: 27, w: 9.5, h: 15 },
            ],
        },
    },
    {
        kind: 'Study',
        note: 'The gaze, the dark room behind',
        top: menPanel({ x: 47, y: 70 }, 1.35, [{ x: 39, y: 58, w: 18, h: 24 }]),
        bottom: {
            src: works.boit.image, size: works.boit.size,
            meta: '1882 · John Singer Sargent · Paris', title: 'The Daughters of Edward Darley Boit',
            focus: { x: 13, y: 42 }, zoom: 1.6, align: 'right' as const,
            boxes: [{ x: 4, y: 35, w: 18, h: 33 }],
        },
    },
]

const compares = computed(() => SCENES.map((scene, i) => {
    const { at, until } = COMPARES[i]!
    const local = t.value - at
    const zoomDrift = 1 + 0.05 * span(t.value, at, until)
    const drift = (panel: Panel) => ({ ...panel, zoom: panel.zoom * zoomDrift })
    return {
        kind: scene.kind,
        visible: t.value >= at && t.value < until,
        props: {
            top: drift(scene.top as Panel),
            bottom: drift(scene.bottom as Panel),
            reveal: ease.quartOut(span(local, ...STEP.reveal)),
            outline: ease.inOut(span(local, ...STEP.outline)),
            threadProgress: ease.inOut(span(local, ...STEP.thread)),
            kind: scene.kind,
            note: scene.note,
            chipOpacity: tween(local, STEP.chip, STEP.chip + 0.35, ease.out),
            opacity: 1 - span(t.value, until - 0.2, until),
        },
    }
}))

const footnoteOpacity = computed(() => fade(t.value, T.arnolfini + 2.3, T.goya - 0.2, 0.4, 0.2))

// ── The graph ──────────────────────────────────────────────────────────────

const CENTER = { x: 216, y: 384 }
const RADIUS = { x: 132, y: 160 }

interface GraphNode {
    id: string
    kind: 'hub' | 'image' | 'text'
    year: number
    name: string
    angle?: number
    at: number
    image?: { src: string; size: { width: number; height: number }; x: number; y: number; span: number }
}

const NODES: GraphNode[] = [
    { id: 'meninas', kind: 'hub', year: 1656, name: 'Velázquez', at: T.graph,
        image: { src: works.meninas.image, size: works.meninas.size, x: infanta.x, y: infanta.y - 1.5, span: 9 } },
    { id: 'arnolfini', kind: 'image', year: 1434, name: 'Van Eyck', angle: -150, at: T.graph + 0.15,
        image: { src: works.arnolfini.image, size: works.arnolfini.size, x: 50.2, y: 29.6, span: 7 } },
    { id: 'goya', kind: 'image', year: 1800, name: 'Goya', angle: -107.5, at: T.graph + 0.3,
        image: { src: works.goya.image, size: works.goya.size, x: 14.7, y: 32.4, span: 16 } },
    { id: 'boit', kind: 'image', year: 1882, name: 'Sargent', angle: -65, at: T.graph + 0.45,
        image: { src: works.boit.image, size: works.boit.size, x: 13.5, y: 40.5, span: 14 } },
    { id: 'picasso', kind: 'text', year: 1957, name: 'Picasso', angle: -22.5, at: NODE_TIMES.picasso },
    { id: 'dali', kind: 'text', year: 1958, name: 'Dalí', angle: 20, at: NODE_TIMES.dali },
    { id: 'foucault', kind: 'text', year: 1966, name: 'Foucault', angle: 62.5, at: NODE_TIMES.foucault },
    { id: 'hamilton', kind: 'text', year: 1973, name: 'Hamilton', angle: 105, at: NODE_TIMES.hamilton },
    { id: 'struth', kind: 'text', year: 2005, name: 'Struth', angle: 147.5, at: NODE_TIMES.struth },
    { id: 'street', kind: 'text', year: 2018, name: 'Madrid streets', angle: 190, at: NODE_TIMES.street },
]

const nodePosition = (node: GraphNode) => {
    if (node.angle === undefined) return CENTER
    const a = (node.angle * Math.PI) / 180
    return { x: CENTER.x + RADIUS.x * Math.cos(a), y: CENTER.y + RADIUS.y * Math.sin(a) }
}

const SIZES = { hub: 84, image: 50, text: 14 }

function cropStyle(image: NonNullable<GraphNode['image']>, diameter: number) {
    const width = diameter * image.span
    const height = width / (image.size.width / image.size.height)
    return {
        backgroundImage: `url(${image.src})`,
        backgroundSize: `${width}px ${height}px`,
        backgroundPosition: `${diameter / 2 - (image.x / 100) * width}px ${diameter / 2 - (image.y / 100) * height}px`,
    }
}

const graphNodes = computed(() => NODES.map((node) => {
    const p = nodePosition(node)
    const pop = tween(t.value, node.at, node.at + 0.45, ease.backOut)
    const size = SIZES[node.kind]
    // Names go under the node, except at the top of the ring, where they go above.
    const below = node.kind === 'hub' || p.y - CENTER.y > -40
    return {
        id: node.id,
        kind: node.kind,
        year: node.year,
        name: node.name,
        style: {
            left: p.x + 'px',
            top: p.y + 'px',
            width: size + 'px',
            height: size + 'px',
            opacity: String(Math.min(1, pop * 1.5)),
            transform: `translate(-50%, -50%) scale(${pop})`,
        },
        image: node.image ? cropStyle(node.image, size) : {},
        labelStyle: below
            ? { top: size + 6 + 'px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' as const }
            : { bottom: size + 6 + 'px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' as const },
    }
}))

function curve(a: { x: number; y: number }, b: { x: number; y: number }, bend = 0.18) {
    const mx = (a.x + b.x) / 2
    const my = (a.y + b.y) / 2
    return `M ${a.x} ${a.y} Q ${mx - (b.y - a.y) * bend} ${my + (b.x - a.x) * bend} ${b.x} ${b.y}`
}

const graphThreads = computed(() => {
    const byId = Object.fromEntries(NODES.map((node) => [node.id, node]))
    const threads = NODES.filter((node) => node.kind !== 'hub').map((node) => {
        // Van Eyck feeds into Velázquez; everything else comes out of him.
        const from = node.id === 'arnolfini' ? nodePosition(node) : CENTER
        const to = node.id === 'arnolfini' ? CENTER : nodePosition(node)
        return {
            id: node.id,
            d: curve(from, to),
            progress: tween(t.value, node.at - 0.1, node.at + 0.4, ease.inOut),
            second: false,
        }
    })
    // Hamilton answers Picasso's answer: a second thread.
    const picasso = nodePosition(byId.picasso!)
    const hamilton = nodePosition(byId.hamilton!)
    threads.push({
        id: 'picasso-hamilton',
        d: curve(picasso, hamilton, -0.25),
        progress: tween(t.value, NODE_TIMES.hamilton + 0.15, NODE_TIMES.hamilton + 0.65, ease.inOut),
        second: true,
    })
    return threads
})

const graphStyle = computed(() => {
    const time = t.value
    const appear = span(time, T.graph - 0.1, T.graph + 0.3)
    const settle = tween(time, T.endTitle - 0.2, T.endTitle + 0.6, ease.quartInOut)
    return {
        opacity: appear,
        transform: `translateY(${lerp(0, -150, settle)}px) scale(${lerp(1, 0.62, settle)})`,
    }
})

const nodeLines = [
    { id: 'picasso', lines: ['Picasso paints it', '58 times.'] },
    { id: 'dali', lines: ['Dalí paints Velázquez', 'painting her.'] },
    { id: 'foucault', lines: ['Foucault opens', 'a book with it.'] },
    { id: 'hamilton', lines: ['Hamilton redraws', 'Picasso’s version.'] },
    { id: 'struth', lines: ['Struth photographs', 'people looking at it.'] },
    { id: 'street', lines: ['80 meninas walk out', 'into Madrid.'] },
].map((line, i, all) => {
    const at = NODE_TIMES[line.id as keyof typeof NODE_TIMES]
    const next = all[i + 1] ? NODE_TIMES[all[i + 1]!.id as keyof typeof NODE_TIMES] : T.endLine
    return { ...line, at: at - 0.05, out: next - 0.45 }
})

// ── Counter, chapter, shade ────────────────────────────────────────────────

function roll(time: number, from: number, to: number, start: number, length: number) {
    return Math.round(lerp(from, to, tween(time, start, start + length, ease.inOut)))
}

const counterYear = computed(() => {
    const time = t.value
    if (time < T.flightBruges[0]) return 1656
    if (time < T.arnolfini) return roll(time, 1656, 1434, T.flightBruges[0] + 0.2, 1.4)
    if (time < T.goya) return roll(time, 1434, 1656, T.arnolfini + STEP.thread[0], 0.7)
    if (time < T.flightParis[0]) return roll(time, 1656, 1800, T.goya + STEP.thread[0], 0.7)
    if (time < T.graph) {
        const to1879 = roll(time, 1800, 1879, T.flightParis[0] + 0.2, 0.6)
        return time < T.flightParis[1] - 0.6 ? to1879 : roll(time, 1879, 1882, T.flightParis[1] - 0.6, 0.3)
    }
    return 1882
})

const context = computed(() => {
    const time = t.value
    if (time < T.flightBruges[0]) return 'Velázquez · Las Meninas'
    if (time < T.goya) return 'Van Eyck → Velázquez'
    if (time < T.flightParis[0]) return 'Velázquez → Goya'
    return 'Velázquez → Sargent'
})

const chapter = computed(() => {
    const time = t.value
    if (time < T.flightBruges[0]) return { n: '01', title: 'A closer look' }
    if (time < T.graph) return { n: '02', title: 'Threads' }
    return { n: '03', title: 'Nodes' }
})

/** The counter steps aside while the story widget and the graph have the screen. */
const counterOpacity = computed(() => {
    const time = t.value
    const story = fade(time, T.shrink[0], T.storyOut + 0.3, 0.3, 0.3)
    return Math.max(0, 1 - story) * (1 - span(time, T.graph - 0.3, T.graph))
})
/** In the Goya scene the painter stands at the left, so the counter moves right. */
const counterRight = computed(() => t.value >= T.goya && t.value < T.flightParis[0])
const chapterOpacity = computed(() => (counterRight.value ? 0 : 1 - span(t.value, T.endLine - 0.3, T.endLine)))
const shadeOpacity = computed(() => (t.value < T.graph ? counterOpacity.value : 0))

const flash = computed(() => {
    const time = t.value
    const cut = (at: number) => (time >= at && time < at + 0.1 ? 0.2 * (1 - span(time, at, at + 0.1)) : 0)
    return Math.max(cut(T.arnolfini), cut(T.goya), cut(T.sargent), cut(T.graph))
})

// ── Touches ────────────────────────────────────────────────────────────────

const storyButton = (index: number) => storyRef.value?.$el.querySelectorAll('.story-controls button')[index]
const { touch } = useTouch(root, [
    { kind: 'tap', at: T.toMirror, target: () => storyButton(2), lead: 0.5, hold: 0.3 },
    { kind: 'tap', at: T.zoomMirror, target: () => storyButton(3), lead: 0.45, hold: 0.3 },
    { kind: 'tap', at: T.toDoor, target: () => storyButton(2), lead: 0.5, hold: 0.35 },
])
</script>

<style scoped>
.mn {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: var(--aw-color-bg);
}

.mn__painting {
    position: absolute;
    z-index: 5;
    overflow: hidden;
    background: #000;
}

.mn__painting img {
    display: block;
    width: 100%;
    height: 100%;
}

.mn__story {
    position: absolute;
    top: 104px;
    left: 66px;
    width: 400px;
    transform: scale(0.75);
    transform-origin: 0 0;
}

.mn__story :deep(.story__panel) {
    opacity: var(--panel-opacity);
}

.mn__register {
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

.mn__register p {
    margin: 0;
}

.mn__register-head {
    padding-bottom: 8px;
    margin-bottom: 8px !important;
    border-bottom: 1px solid rgba(20, 18, 16, 0.2);
    font-family: var(--aw-font-mono);
    font-size: 9px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.mn__register-name {
    font-family: var(--aw-font-artwork);
    font-size: 21px;
    font-style: italic;
}

.mn__register-line {
    font-size: 11.5px;
    line-height: 1.5;
}

.mn__footnote {
    position: absolute;
    z-index: 3;
    left: 24px;
    right: 24px;
    top: 404px;
    margin: 0;
    color: var(--aw-color-text-muted);
    font-family: var(--aw-font-mono);
    font-size: 9px;
    letter-spacing: 0.04em;
    text-align: center;
    text-shadow: 0 1px 8px #000;
}

/* Graph */
.mn__graph {
    position: absolute;
    inset: 0;
    transform-origin: 216px 384px;
}

.mn__threads {
    position: absolute;
    inset: 0;
    width: 432px;
    height: 768px;
    overflow: visible;
}

.mn__thread {
    fill: none;
    stroke: var(--aw-color-gold);
    stroke-width: 1.2;
    stroke-dasharray: 1 1;
    opacity: 0.85;
}

.mn__thread--second {
    stroke: var(--aw-color-gold-bright);
    stroke-width: 1.6;
    opacity: 1;
}

.mn__node {
    position: absolute;
}

.mn__node-image {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background-repeat: no-repeat;
    box-shadow: 0 0 0 1px var(--aw-color-gold-soft), 0 8px 24px rgba(0, 0, 0, 0.6);
}

.mn__node--hub .mn__node-image {
    box-shadow: 0 0 0 1.5px var(--aw-color-gold), 0 0 32px rgba(201, 164, 106, 0.25);
}

.mn__node-dot {
    position: absolute;
    inset: 0;
    border: 1.5px solid var(--aw-color-gold);
    border-radius: 50%;
    background: var(--aw-color-bg);
}

.mn__node-dot::after {
    content: "";
    position: absolute;
    inset: 3px;
    border-radius: 50%;
    background: var(--aw-color-gold);
}

.mn__node-label {
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

.mn__node-year {
    color: var(--aw-color-gold-bright);
    font-family: var(--aw-font-mono);
    font-size: 9px;
    font-weight: 400;
    letter-spacing: 0.04em;
}

/* Counter */
.mn__shade {
    position: absolute;
    inset: 0 0 auto;
    z-index: 10;
    height: 280px;
    background: linear-gradient(to bottom, rgba(5, 5, 5, 0.85) 0%, rgba(5, 5, 5, 0.55) 45%, transparent 100%);
    pointer-events: none;
}

.mn__counter {
    position: absolute;
    z-index: 20;
    left: 24px;
    top: 104px;
}

.mn__counter--right {
    left: auto;
    right: 60px;
    text-align: right;
}

.mn__counter--right :deep(.year-counter) {
    justify-content: flex-end;
}

.mn__context {
    margin: 10px 0 0;
    color: var(--aw-color-text-muted);
    font-family: var(--aw-font-mono);
    font-size: 10.5px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.mn__chapter {
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

.mn__chapter-number {
    margin-right: 8px;
    color: var(--aw-color-gold);
}

/* Captions */
.mn__caption {
    position: absolute;
    z-index: 20;
    left: 24px;
    bottom: 196px;
    font-family: var(--aw-font-display);
    font-size: 38px;
    font-weight: 600;
    line-height: 1.02;
    letter-spacing: -0.04em;
    text-shadow: 0 2px 24px rgba(0, 0, 0, 0.6);
}

.mn__caption--top {
    top: 100px;
    bottom: auto;
    font-size: 28px;
}

.mn__caption--big {
    font-size: 40px;
}

/* End */
.mn__end {
    position: absolute;
    z-index: 20;
    left: 24px;
    right: 60px;
    top: 392px;
}

.mn__end-title {
    font-family: var(--aw-font-display);
    font-size: 56px;
    font-weight: 600;
    line-height: 0.95;
    letter-spacing: -0.05em;
}

.mn__end-lead {
    margin-top: 12px;
    color: var(--aw-color-text-muted);
    font-size: 16px;
    line-height: 1.35;
}

.mn__end-list {
    margin: 18px 0 0;
    padding-top: 14px;
    border-top: 1px solid var(--aw-color-line-strong);
    color: var(--aw-color-text-subtle);
    font-family: var(--aw-font-mono);
    font-size: 10.5px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.mn__flash {
    position: absolute;
    inset: 0;
    z-index: 60;
    background: #f2eee6;
    pointer-events: none;
}
</style>
