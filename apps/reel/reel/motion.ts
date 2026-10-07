/** Motion helpers: everything on screen is a pure function of the reel time. */

export type Easing = (progress: number) => number

export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))
export const lerp = (from: number, to: number, progress: number) => from + (to - from) * progress

/** Progress (0–1) of `time` through [start, end]. */
export const span = (time: number, start: number, end: number) =>
    end === start ? (time >= end ? 1 : 0) : clamp((time - start) / (end - start))

/** Is `time` inside [start, end)? */
export const during = (time: number, start: number, end: number) => time >= start && time < end

/** CSS-style cubic Bézier easing. */
export function bezier(x1: number, y1: number, x2: number, y2: number): Easing {
    const cx = 3 * x1
    const bx = 3 * (x2 - x1) - cx
    const ax = 1 - cx - bx
    const cy = 3 * y1
    const by = 3 * (y2 - y1) - cy
    const ay = 1 - cy - by
    const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t
    const sampleY = (t: number) => ((ay * t + by) * t + cy) * t
    const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx
    return (x: number) => {
        if (x <= 0) return 0
        if (x >= 1) return 1
        let t = x
        for (let i = 0; i < 8; i++) {
            const error = sampleX(t) - x
            const slope = slopeX(t)
            if (Math.abs(error) < 1e-6) break
            if (Math.abs(slope) < 1e-6) break
            t -= error / slope
        }
        if (t < 0 || t > 1 || Math.abs(sampleX(t) - x) > 1e-4) {
            let low = 0
            let high = 1
            t = x
            for (let i = 0; i < 30; i++) {
                const value = sampleX(t)
                if (Math.abs(value - x) < 1e-6) break
                if (value < x) low = t
                else high = t
                t = (low + high) / 2
            }
        }
        return sampleY(t)
    }
}

export const ease = {
    linear: (p: number) => p,
    /** The design system's ease (--aw-ease). */
    out: bezier(0.2, 0.7, 0.2, 1),
    in: bezier(0.55, 0, 0.8, 0.2),
    inOut: bezier(0.65, 0, 0.35, 1),
    /** Fast start, long settle: for type and camera landings. */
    expoOut: (p: number) => (p >= 1 ? 1 : 1 - 2 ** (-10 * p)),
    expoIn: (p: number) => (p <= 0 ? 0 : 2 ** (10 * p - 10)),
    expoInOut: (p: number) =>
        p <= 0 ? 0 : p >= 1 ? 1 : p < 0.5 ? 2 ** (20 * p - 10) / 2 : (2 - 2 ** (-20 * p + 10)) / 2,
    quartOut: (p: number) => 1 - (1 - p) ** 4,
    quartInOut: (p: number) => (p < 0.5 ? 8 * p ** 4 : 1 - (-2 * p + 2) ** 4 / 2),
    /** Slight overshoot, for things that land. */
    backOut: bezier(0.34, 1.4, 0.64, 1),
} satisfies Record<string, Easing>

/** Eased progress of `time` through [start, end]. */
export const tween = (time: number, start: number, end: number, easing: Easing = ease.out) =>
    easing(span(time, start, end))

export type Key = [time: number, value: number, easing?: Easing]

/**
 * Value at `time` along keyframes; each segment uses the easing of the key
 * it arrives at.
 */
export function keys(time: number, frames: Key[]): number {
    const first = frames[0]
    if (!first) return 0
    if (time <= first[0]) return first[1]
    for (let i = 1; i < frames.length; i++) {
        const to = frames[i]!
        const from = frames[i - 1]!
        if (time <= to[0]) return lerp(from[1], to[1], (to[2] ?? ease.inOut)(span(time, from[0], to[0])))
    }
    return frames[frames.length - 1]![1]
}

/** Deterministic pseudo-random number in [0, 1) for an integer seed. */
export function hash(seed: number): number {
    let x = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b)
    x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35)
    x ^= x >>> 16
    return (x >>> 0) / 4294967296
}

/** Opacity for an element shown between `start` and `end` with fades. */
export function fade(time: number, start: number, end: number, fadeIn = 0.3, fadeOut = 0.3): number {
    if (time < start || time > end) return 0
    return Math.min(fadeIn ? span(time, start, start + fadeIn) : 1, fadeOut ? 1 - span(time, end - fadeOut, end) : 1)
}

export interface Rect {
    left: number
    top: number
    width: number
    height: number
}

/**
 * Places a box of a fixed base size over `rect` with a transform. Layout
 * properties snap to whole device pixels, so a slow pan or zoom done with
 * them shakes; a transform moves by fractions of a pixel.
 */
export function rectStyle(rect: Rect, base: { width: number; height: number }) {
    return {
        left: '0px',
        top: '0px',
        width: base.width + 'px',
        height: base.height + 'px',
        transform: `translate(${rect.left}px, ${rect.top}px) scale(${rect.width / base.width}, ${rect.height / base.height})`,
        transformOrigin: '0 0',
    }
}
