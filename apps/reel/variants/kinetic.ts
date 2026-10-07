import type { SoundCue } from '~/reel/time'

/**
 * Variant B, "Kinetic": a fast poster-style edit on a 120 bpm grid. Single
 * words slam in on beats and alternate with close-ups of the real widgets.
 * A beat is 0.5 s; every cut is on a beat.
 */
export const BPM = 120
export const BEAT = 60 / BPM

export type Ground = 'ink' | 'gold' | 'paper'

export interface Shot {
    from: number
    to: number
    kind: 'word' | 'map' | 'slider' | 'crops' | 'story' | 'card' | 'fold' | 'triptych' | 'end'
    word?: string
    ground?: Ground
    caption?: string
}

export const SHOTS: Shot[] = [
    { from: 0, to: 0.5, kind: 'word', word: '12,000', ground: 'ink' },
    { from: 0.5, to: 1, kind: 'word', word: 'YEARS', ground: 'gold' },
    { from: 1, to: 2.5, kind: 'map', caption: 'Fig. 01 — Map of time' },
    { from: 2.5, to: 3, kind: 'word', word: '1,600', ground: 'ink' },
    { from: 3, to: 3.5, kind: 'word', word: 'STATES', ground: 'gold' },
    { from: 3.5, to: 5, kind: 'map', caption: 'Data — Cliopatria / Seshat' },
    { from: 5, to: 5.5, kind: 'word', word: 'ONE', ground: 'ink' },
    { from: 5.5, to: 6, kind: 'word', word: 'SLIDER', ground: 'paper' },
    { from: 6, to: 7.5, kind: 'slider', caption: 'Square-root time scale' },
    { from: 7.5, to: 8, kind: 'word', word: 'LOOK', ground: 'ink' },
    { from: 8, to: 8.5, kind: 'word', word: 'CLOSER', ground: 'gold' },
    { from: 8.5, to: 10.5, kind: 'crops', caption: 'Fig. 02 — A closer look' },
    { from: 10.5, to: 12.5, kind: 'story' },
    { from: 12.5, to: 13, kind: 'word', word: 'FLIP', ground: 'paper' },
    { from: 13, to: 14.5, kind: 'card', caption: 'Fig. 03 — Nodes' },
    { from: 14.5, to: 15, kind: 'word', word: 'FOLD', ground: 'gold' },
    { from: 15, to: 16.5, kind: 'fold' },
    { from: 16.5, to: 18.5, kind: 'triptych' },
    { from: 18.5, to: 22, kind: 'end' },
]

export const T = {
    mapARace: [1, 2.5] as const,
    mapBRace: [3.5, 5] as const,
    slider: [6.1, 7.4] as const,
    storyNext: [11, 11.75] as const,
    cardFlip: 13.25,
    cardFold: 15.1,
    end: 22,
}

export const DURATION = T.end

const hits: SoundCue[] = SHOTS.map((shot) => ({
    at: shot.from,
    kind: shot.kind === 'word' ? 'hit' : 'thud',
    gain: shot.kind === 'word' ? (shot.ground === 'gold' ? 1 : 0.8) : 0.55,
}))

const ticks: SoundCue[] = []
for (const [start, end] of [T.mapARace, T.mapBRace, T.slider]) {
    for (let at = start; at < end; at += BEAT / 4) ticks.push({ at, kind: 'tick', gain: 0.4 })
}

export const SOUNDS: SoundCue[] = [
    ...hits,
    ...ticks,
    { at: 8.5, kind: 'whoosh', gain: 0.5 },
    { at: 9, kind: 'tap', gain: 0.5 },
    { at: 9.5, kind: 'tap', gain: 0.5 },
    { at: 10, kind: 'tap', gain: 0.5 },
    { at: T.storyNext[0], kind: 'tap' },
    { at: T.storyNext[1], kind: 'tap' },
    { at: T.cardFlip, kind: 'tap' },
    { at: T.cardFold, kind: 'tap' },
    { at: 15.75, kind: 'chime', note: 0 },
    { at: 16, kind: 'chime', note: 1 },
    { at: 18, kind: 'rise', note: 0.5 },
    { at: 18.5, kind: 'hit', gain: 1 },
    { at: 19, kind: 'hit', gain: 1 },
    { at: 19.5, kind: 'chime', note: 2 },
]
