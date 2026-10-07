import type { StoryData } from '@art-widgets/story'
import type { LonLat } from '@art-widgets/time-map'
import type { Panel } from '~/components/Compare.vue'
import type { SoundCue } from '~/reel/time'

/**
 * A "Threads" reel is a list of scenes played one after another. Each topic
 * of the series is only data: pictures, where their details are, and words.
 */

export interface Picture {
    src: string
    size: { width: number; height: number }
}

export interface Chapter {
    n: string
    title: string
}

interface SceneBase {
    duration: number
    chapter?: Chapter
    /** Mono line under the year. */
    context?: string
}

/** A picture full-bleed: a slow push or pull, captions one after another. */
export interface StillScene extends SceneBase {
    kind: 'still'
    picture: Picture
    year: number
    /** Image point (percent) at the centre, and zoom (1: covers the stage), at the start and the end. */
    from: { x: number; y: number; zoom: number }
    to: { x: number; y: number; zoom: number }
    /** Each caption is one or two lines; they share the scene's time. */
    captions?: string[][]
    /** The picture ends by shrinking into the story widget of the next scene. */
    intoStory?: boolean
    /** Small mono line at the bottom, e.g. a credit for a photograph. */
    note?: string
    /** Shown as a print on the dark ground instead of full-bleed (old or small photographs). */
    framed?: boolean
}

/** The story widget on a picture; a finger steps through it. */
export interface StoryScene extends SceneBase {
    kind: 'story'
    data: StoryData
    year: number
    /** Widget width before scaling (≤ 760 keeps the narrow layout) and its scale. */
    width: number
    scale: number
    taps: { at: number; button: 'next' | 'zoom' }[]
}

export interface Place {
    at: LonLat
    label: string
}

/** A flight on the map: hold on the start, glide while the arc draws and the years run, hold on the end. */
export interface FlightScene extends SceneBase {
    kind: 'flight'
    from: Place
    to: Place
    years: [number, number]
    caption?: string[]
    /** A paper card, e.g. a register entry. */
    card?: { head: string; name: string; lines: string[] }
}

/** Two pictures, the borrowed details outlined in both and joined. */
export interface CompareScene extends SceneBase {
    kind: 'compare'
    top: Panel
    bottom: Panel
    /** Kind of influence: Motif, Quotation, Copy… */
    type: string
    note: string
    footnote?: string
    years: [number, number]
    /** Keep the counter off a detail on the left. */
    counterSide?: 'left' | 'right'
}

export interface GraphNode {
    id: string
    year: number
    /** Shown instead of the year, e.g. "1830s–50s". */
    yearLabel?: string
    name: string
    /** A round crop of a picture; without it the node is a dot. */
    picture?: Picture & { x: number; y: number; span: number }
    /** Threads run from the hub out, or into the hub (a source). */
    direction?: 'in' | 'out'
    /** Shown with a caption, one after another; nodes without lines are there from the start. */
    lines?: string[]
    /** Another node this one also answers: a second thread. */
    alsoFrom?: string
}

export interface GraphScene extends SceneBase {
    kind: 'graph'
    hub: GraphNode & { picture: Picture & { x: number; y: number; span: number } }
    nodes: GraphNode[]
}

export interface EndScene extends SceneBase {
    kind: 'end'
    line: string[]
    lead: string[]
}

export type Scene = StillScene | StoryScene | FlightScene | CompareScene | GraphScene | EndScene

export interface ThreadConfig {
    id: string
    title: string
    description: string
    /** Place in the series, e.g. "01 / 03". */
    series: string
    bpm: number
    scenes: Scene[]
}

export interface Timed<S extends Scene = Scene> {
    scene: S
    start: number
    end: number
}

export function timeline(config: ThreadConfig): Timed[] {
    let start = 0
    return config.scenes.map((scene) => {
        const timed = { scene, start, end: start + scene.duration }
        start += scene.duration
        return timed
    })
}

export const duration = (config: ThreadConfig) => config.scenes.reduce((sum, scene) => sum + scene.duration, 0)

/** Timings inside scenes, shared by the picture and the sound. */
export const FLIGHT = { hold: 0.8, settle: 0.8 }
export const COMPARE = { reveal: [0, 0.5], outline: [0.7, 1.3], thread: [1.3, 2.1], chip: 1.8 } as const
export const GRAPH = { first: 0.6, step: 1.15 }

export function graphTimes(scene: GraphScene, start: number) {
    const stepped = scene.nodes.filter((node) => node.lines)
    return Object.fromEntries(scene.nodes.map((node, i) => {
        const index = stepped.indexOf(node)
        return [node.id, index === -1 ? start + 0.15 + i * 0.12 : start + GRAPH.first + index * GRAPH.step]
    }))
}

export function sounds(config: ThreadConfig): SoundCue[] {
    const beat = 60 / config.bpm
    const cues: SoundCue[] = []
    const ticks = (from: number, to: number) => {
        for (let at = from; at < to; at += beat / 4) cues.push({ at, kind: 'tick', gain: 0.3 })
    }
    for (const { scene, start, end } of timeline(config)) {
        switch (scene.kind) {
            case 'still':
                cues.push({ at: start, kind: start === 0 ? 'swell' : 'thud', gain: 0.6 })
                if (scene.intoStory) cues.push({ at: end - 0.7, kind: 'whoosh', gain: 0.4 })
                break
            case 'story':
                for (const tap of scene.taps) cues.push({ at: start + tap.at, kind: 'tap' })
                break
            case 'flight':
                cues.push({ at: start + FLIGHT.hold, kind: 'whoosh', gain: 0.55 })
                ticks(start + FLIGHT.hold, end - FLIGHT.settle)
                cues.push({ at: end - FLIGHT.settle, kind: 'chime', note: 1 })
                break
            case 'compare':
                cues.push({ at: start, kind: 'hit', gain: 0.8 })
                ticks(start + COMPARE.thread[0], start + COMPARE.thread[1])
                cues.push({ at: start + COMPARE.thread[1], kind: 'chime', note: 2 })
                break
            case 'graph': {
                cues.push({ at: start, kind: 'hit', gain: 0.7 })
                const times = graphTimes(scene, start)
                scene.nodes.filter((node) => node.lines).forEach((node, i) => cues.push({ at: times[node.id]!, kind: 'chime', note: i }))
                break
            }
            case 'end':
                cues.push({ at: start, kind: 'swell', gain: 0.6 })
                cues.push({ at: start + 1.2, kind: 'hit', gain: 1 })
                cues.push({ at: start + 1.5, kind: 'chime', note: 4 })
                break
        }
    }
    return cues
}
