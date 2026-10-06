import { onScopeDispose, ref, toValue, type MaybeRefOrGetter } from 'vue'

export interface StepTimerOptions {
  /** Length of one step in milliseconds. */
  duration: MaybeRefOrGetter<number>
  /** Called each time progress reaches 100%; progress is already reset to 0. */
  onComplete: () => void
}

/** Progress (0–100) of a timed step, driven by requestAnimationFrame. */
export function useStepTimer({ duration, onComplete }: StepTimerOptions) {
  const progress = ref(0)
  const isPaused = ref(false)
  let frame = 0
  let last = 0

  function tick(now: number) {
    progress.value += ((now - last) / toValue(duration)) * 100
    last = now
    if (progress.value >= 100) {
      progress.value = 0
      onComplete()
    }
    frame = requestAnimationFrame(tick)
  }

  function start() {
    stop()
    last = performance.now()
    frame = requestAnimationFrame(tick)
  }

  function stop() {
    if (frame) cancelAnimationFrame(frame)
    frame = 0
  }

  function togglePause() {
    if (isPaused.value) start()
    else stop()
    isPaused.value = !isPaused.value
  }

  function restart() {
    progress.value = 0
    isPaused.value = false
    start()
  }

  function reset() {
    progress.value = 0
  }

  onScopeDispose(stop)

  return { progress, isPaused, start, stop, togglePause, restart, reset }
}
