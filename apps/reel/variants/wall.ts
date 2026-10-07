import type { SoundCue } from '~/reel/time'

/**
 * Variant C, "Wall label": slow and quiet. The map flies to where each work
 * was made, in its year; the work fades in with a museum wall label; at the
 * end the cards fold into nodes. 72 bpm, ambient; long dissolves.
 */
export const BPM = 72

export const T = {
    linesOut: 3.2,
    mapIn: [3.2, 4.2] as const,
    toVenus: [7.6, 8.6] as const,
    venusMarker: 9.6,
    toMapParis: [12.0, 13.0] as const,
    toBude: [15.2, 16.0] as const,
    budeFlip: 17.0,
    toMapMunich: [18.4, 19.2] as const,
    toBocklin: [21.4, 22.2] as const,
    toCard: [23.4, 24.0] as const,
    fold: 24.8,
    nodes: 25.5,
    endText: 26.2,
    end: 30,
}

export const DURATION = T.end

export const SOUNDS: SoundCue[] = [
    { at: 0, kind: 'swell', gain: 0.5 },
    { at: 0.5, kind: 'chime', note: 0 },
    { at: 1.2, kind: 'chime', note: 2 },
    { at: 1.9, kind: 'chime', note: 4 },
    { at: T.mapIn[0], kind: 'whoosh', gain: 0.35 },
    { at: 6.4, kind: 'chime', note: 1 },
    { at: T.toVenus[0], kind: 'swell', gain: 0.6 },
    { at: T.venusMarker, kind: 'chime', note: 3 },
    { at: T.toMapParis[0], kind: 'whoosh', gain: 0.35 },
    { at: 14.6, kind: 'chime', note: 1 },
    { at: T.toBude[0], kind: 'swell', gain: 0.5 },
    { at: T.budeFlip, kind: 'tap', gain: 0.6 },
    { at: T.toMapMunich[0], kind: 'whoosh', gain: 0.35 },
    { at: 20.8, kind: 'chime', note: 1 },
    { at: T.toBocklin[0], kind: 'swell', gain: 0.6 },
    { at: T.fold, kind: 'tap', gain: 0.6 },
    { at: T.nodes, kind: 'chime', note: 0 },
    { at: T.nodes + 0.3, kind: 'chime', note: 2 },
    { at: T.endText, kind: 'swell', gain: 0.7 },
    { at: T.endText + 0.2, kind: 'chime', note: 4 },
]
