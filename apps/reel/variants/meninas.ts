import type { SoundCue } from '~/reel/time'

/**
 * Variant E, "Meninas": the threads of influence around Velázquez's Las
 * Meninas (research/meninas.md). Each borrowing is shown, not told: two
 * pictures, the borrowed part outlined in both and joined by a thread; then
 * every work becomes a node in a growing graph. 100 bpm; a beat is 0.6 s.
 */
export const BPM = 100
export const BEAT = 60 / BPM

export const T = {
    // 01 The picture
    hookOut: [1.5, 2.7] as const,
    storyMount: 2.6,
    shrink: [3.0, 3.7] as const,
    toMirror: 5.1,
    zoomMirror: 6.0,
    toDoor: 7.5,
    storyOut: 8.7,
    // 02 Mirror: back to Bruges
    flightBruges: [9.0, 10.8] as const,
    arnolfini: 10.8,
    // 03 Goya
    goya: 15.0,
    // 04 Sargent
    flightParis: [19.8, 21.6] as const,
    sargent: 21.6,
    // 05 The graph grows
    graph: 25.8,
    nodeStep: 1.1,
    // 06 End
    endLine: 33.1,
    endTitle: 34.3,
    end: 38.4,
} as const

export const DURATION = T.end

/** Compare scenes: start time and length. */
export const COMPARES = [
    { at: T.arnolfini, until: T.goya },
    { at: T.goya, until: T.flightParis[0] },
    { at: T.sargent, until: T.graph },
] as const

/** Times within a compare scene. */
export const STEP = { reveal: [0, 0.5], outline: [0.7, 1.3], thread: [1.3, 2.0], chip: 1.7 } as const

const late = ['picasso', 'dali', 'foucault', 'hamilton', 'struth', 'street'] as const
export const NODE_TIMES = Object.fromEntries(late.map((id, i) => [id, T.graph + 0.6 + i * T.nodeStep])) as Record<(typeof late)[number], number>

const rolls: SoundCue[] = []
function ticksBetween(start: number, end: number) {
    for (let at = start; at < end; at += BEAT / 4) rolls.push({ at, kind: 'tick', gain: 0.35 })
}
ticksBetween(...T.flightBruges)
ticksBetween(T.goya + STEP.thread[0], T.goya + STEP.thread[1])
ticksBetween(...T.flightParis)

export const SOUNDS: SoundCue[] = [
    { at: 0, kind: 'swell', gain: 0.6 },
    { at: T.hookOut[0], kind: 'whoosh', gain: 0.5 },
    { at: T.shrink[0], kind: 'thud', gain: 0.5 },
    { at: T.toMirror, kind: 'tap' },
    { at: T.zoomMirror, kind: 'tap' },
    { at: T.toDoor, kind: 'tap' },
    { at: T.flightBruges[0], kind: 'whoosh', gain: 0.6 },
    ...rolls,
    ...COMPARES.flatMap(({ at }) => [
        { at, kind: 'hit' as const, gain: 0.8 },
        { at: at + STEP.thread[1], kind: 'chime' as const, note: 2 },
    ]),
    { at: T.flightParis[0], kind: 'whoosh', gain: 0.6 },
    { at: T.graph, kind: 'hit', gain: 0.7 },
    ...late.map((id, i) => ({ at: NODE_TIMES[id], kind: 'chime' as const, note: i })),
    { at: T.endLine, kind: 'swell', gain: 0.6 },
    { at: T.endTitle, kind: 'hit', gain: 1 },
    { at: T.endTitle + 0.3, kind: 'chime', note: 4 },
]
