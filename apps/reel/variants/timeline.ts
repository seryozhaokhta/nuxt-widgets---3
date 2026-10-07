import type { SoundCue } from '~/reel/time'

/**
 * Variant A, "Timeline": one take through 12,000 years. The year counter is
 * the spine: the map runs to 1510, the painting of that year opens, the
 * cards of 1536 and 1872 fold into nodes, the counter lands on today.
 * 100 bpm: a beat is 0.6 s; scene changes fall on beats.
 */
export const BPM = 100
export const BEAT = 60 / BPM

export const T = {
    mapDragStart: 0.5,
    mapDragEnd: 7.8,
    diveStart: 7.6,
    venusCut: 8.4,
    panEnd: 11.2,
    markerIn: 11.0,
    markerTap: 11.6,
    shrinkStart: 12.6,
    shrinkEnd: 13.3,
    storyMount: 12.3,
    storyNext: 14.4,
    cardsCut: 15.6,
    budeFlip: 16.5,
    budeFold: 17.4,
    bocklinIn: 18.0,
    bocklinFlip: 18.9,
    bocklinFold: 19.8,
    venusNode: 20.6,
    threads: 20.9,
    todayRoll: 22.8,
    endTitle: 23.4,
    end: 27.6,
} as const

export const DURATION = T.end

const ticks: SoundCue[] = []
for (let at = T.mapDragStart; at < T.mapDragEnd; at += BEAT / 4) {
    ticks.push({ at, kind: 'tick', gain: 0.35 + 0.25 * Math.sin(at) ** 2 })
}

export const SOUNDS: SoundCue[] = [
    { at: 0, kind: 'swell', gain: 0.6 },
    ...ticks,
    { at: 2.9, kind: 'thud', gain: 0.5 },
    { at: 5.4, kind: 'thud', gain: 0.5 },
    { at: T.diveStart, kind: 'rise', note: 0.8 },
    { at: T.venusCut, kind: 'hit', gain: 1 },
    { at: T.markerTap, kind: 'tap' },
    { at: T.shrinkStart, kind: 'whoosh', gain: 0.7 },
    { at: T.storyNext, kind: 'tap' },
    { at: T.cardsCut, kind: 'hit', gain: 0.8 },
    { at: T.budeFlip, kind: 'tap' },
    { at: T.budeFold, kind: 'tap' },
    { at: T.budeFold + 0.15, kind: 'thud', gain: 0.6 },
    { at: T.bocklinIn, kind: 'hit', gain: 0.6 },
    { at: T.bocklinFlip, kind: 'tap' },
    { at: T.bocklinFold, kind: 'tap' },
    { at: T.bocklinFold + 0.15, kind: 'thud', gain: 0.6 },
    { at: T.venusNode, kind: 'chime', note: 0 },
    { at: T.threads, kind: 'swell', gain: 0.5 },
    { at: T.todayRoll, kind: 'rise', note: 0.6 },
    { at: T.endTitle, kind: 'hit', gain: 1 },
    { at: T.endTitle + 0.3, kind: 'chime', note: 2 },
]
