import { readonly, ref, watch, type Component } from 'vue'

/** Width and height of the stage in CSS pixels; rendered at 2.5× to 1080×1920. */
export const STAGE = { width: 432, height: 768, scale: 2.5 }

/**
 * Reels UI covers the top, the bottom (caption, buttons) and the right edge
 * (like, comment, share). Text that must be read stays inside this box.
 */
export const SAFE = { top: 100, bottom: 180, left: 24, right: 60 }

const time = ref(0)

/** Seconds since the start of the reel. */
export const reelTime = readonly(time)

export function setReelTime(seconds: number) {
    time.value = seconds
}

export interface Cue {
    at: number
    run: () => void
}

/**
 * Runs each cue once when the reel reaches its time. Rendering only moves
 * forward, so cues drive widgets the way a person would: clicks and drags.
 */
export function useCues(cues: Cue[]) {
    const fired = new Set<Cue>()
    watch(
        time,
        (now) => {
            for (const cue of cues) {
                if (fired.has(cue) || now < cue.at) continue
                fired.add(cue)
                cue.run()
            }
        },
        { immediate: true },
    )
}

/** A sound for the temp track, placed at a time in seconds. */
export interface SoundCue {
    at: number
    kind: 'hit' | 'tick' | 'whoosh' | 'tap' | 'swell' | 'rise' | 'thud' | 'chime'
    gain?: number
    /** Pitch or length variant, by kind. */
    note?: number
}

export interface ReelVariant {
    id: string
    title: string
    description: string
    duration: number
    /** Beats per minute of the edit; the temp track follows it. */
    bpm: number
    mood: 'pulse' | 'drive' | 'ambient'
    sounds: SoundCue[]
    component: () => Promise<Component | { default: Component }>
}

const gates: Promise<unknown>[] = []

/** Holds the first frame until `task` settles (data to preload, images to decode). */
export function holdFirstFrame(task: Promise<unknown>) {
    gates.push(task.catch((error) => console.warn('[reel] preload failed:', error)))
}

/** Resolves once every task passed to holdFirstFrame has settled, including ones added meanwhile. */
export async function firstFrameReady() {
    let count = -1
    while (count !== gates.length) {
        count = gates.length
        await Promise.all(gates)
    }
}
