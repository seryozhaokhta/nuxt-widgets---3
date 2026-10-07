import { computed, watch, type Ref } from 'vue'
import { reelTime, STAGE } from './time'
import { clamp, ease, span, tween } from './motion'
import type { TouchState } from '~/components/TouchDot.vue'

/** A finger comes in, taps an element (a real click) and lifts. */
export interface TapStep {
    kind: 'tap'
    at: number
    target: () => Element | null | undefined
    /** Seconds the finger takes to arrive. */
    lead?: number
    /** Seconds it stays after the tap. */
    hold?: number
}

/** A finger holds a range input's thumb and moves it; the widget gets input events. */
export interface DragStep {
    kind: 'drag'
    start: number
    end: number
    target: () => HTMLInputElement | null | undefined
    /** Thumb position (0–1) at a time between start and end. */
    position: (time: number) => number
    /** Half-width of the thumb, px. */
    thumb?: number
}

export type TouchStep = TapStep | DragStep

const HIDDEN: TouchState = { x: 0, y: 0, opacity: 0, scale: 1, ripple: 0 }

/** Element box relative to the stage, in stage pixels. */
function boxOf(stage: HTMLElement | null, element: Element | null | undefined) {
    if (!stage || !element) return null
    const outer = stage.getBoundingClientRect()
    const rect = element.getBoundingClientRect()
    const k = outer.width / STAGE.width || 1
    return {
        x: (rect.left - outer.left) / k,
        y: (rect.top - outer.top) / k,
        width: rect.width / k,
        height: rect.height / k,
    }
}

export function useTouch(stage: Ref<HTMLElement | null>, steps: TouchStep[]) {
    const measured = new Map<TouchStep, ReturnType<typeof boxOf>>()
    const done = new Set<TouchStep>()

    // Side effects: clicks and slider input, in time order.
    watch(reelTime, (now) => {
        for (const step of steps) {
            if (step.kind === 'tap') {
                if (now >= step.at && !done.has(step)) {
                    done.add(step)
                    ;(step.target() as HTMLElement | null)?.click()
                }
            } else if (now >= step.start && now <= step.end + 0.05) {
                const input = step.target()
                if (!input) continue
                const value = String(Math.round(clamp(step.position(Math.min(now, step.end))) * Number(input.max || 1)))
                if (input.value !== value) {
                    input.value = value
                    input.dispatchEvent(new Event('input', { bubbles: true }))
                }
            }
        }
    })

    const state = computed<TouchState>(() => {
        const t = reelTime.value
        for (const step of steps) {
            if (step.kind === 'tap') {
                const lead = step.lead ?? 0.45
                const hold = step.hold ?? 0.35
                if (t < step.at - lead || t > step.at + hold + 0.25) continue
                if (!measured.has(step)) measured.set(step, boxOf(stage.value, step.target()))
                const box = measured.get(step)
                if (!box) continue
                const cx = box.x + box.width / 2
                const cy = box.y + box.height / 2
                const arrive = tween(t, step.at - lead, step.at - 0.05, ease.quartOut)
                const leave = tween(t, step.at + hold, step.at + hold + 0.25, ease.in)
                const press = t >= step.at - 0.06 && t < step.at + 0.12
                return {
                    x: cx + (1 - arrive) * 26 + leave * 10,
                    y: cy + (1 - arrive) * 46 + leave * 18,
                    opacity: Math.min(span(t, step.at - lead, step.at - lead + 0.15), 1 - leave),
                    scale: press ? 0.8 : 1,
                    ripple: t >= step.at ? span(t, step.at, step.at + 0.5) : 0,
                }
            }
            if (t < step.start - 0.35 || t > step.end + 0.3) continue
            const box = boxOf(stage.value, step.target())
            if (!box) continue
            const thumb = step.thumb ?? 8
            const position = clamp(step.position(clamp(t, step.start, step.end)))
            const x = box.x + thumb + (box.width - thumb * 2) * position
            const y = box.y + box.height / 2
            const arrive = tween(t, step.start - 0.35, step.start, ease.quartOut)
            const leave = tween(t, step.end, step.end + 0.3, ease.in)
            return {
                x: x + (1 - arrive) * 20,
                y: y + (1 - arrive) * 40 + leave * 16,
                opacity: Math.min(arrive, 1 - leave),
                scale: t >= step.start && t <= step.end ? 0.84 : 1,
                ripple: 0,
            }
        }
        return HIDDEN
    })

    return { touch: state }
}
