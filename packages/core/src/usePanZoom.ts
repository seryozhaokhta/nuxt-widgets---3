import { computed, onScopeDispose, ref, type Ref } from 'vue'

export interface PanZoomOptions {
  minZoom?: number
  maxZoom?: number
  /** Zoom change per wheel notch or button press. */
  step?: number
  /**
   * "modifier": the wheel zooms only with Ctrl/⌘ held (trackpad pinch sends
   * Ctrl too), so plain scrolling still scrolls the page. Default.
   * "always": the wheel always zooms.
   */
  wheel?: 'modifier' | 'always'
}

interface Point {
  x: number
  y: number
}

const HINT_MS = 1600

/**
 * Pan and zoom for content that fills `container` and is transformed with
 * `style` (origin top-left). The content can't be dragged past its edges.
 */
export function usePanZoom(container: Ref<HTMLElement | null>, options: PanZoomOptions = {}) {
  const { minZoom = 1, maxZoom = 5, step = 0.5, wheel = 'modifier' } = options

  const scale = ref(1)
  const position = ref<Point>({ x: 0, y: 0 })
  const isPanning = ref(false)
  /** True for a moment after an unmodified wheel in "modifier" mode. */
  const showWheelHint = ref(false)
  let panOrigin: Point = { x: 0, y: 0 }
  let hintTimer: ReturnType<typeof setTimeout> | undefined

  function clamp(point: Point, atScale: number): Point {
    const el = container.value
    if (!el) return point
    const minX = el.clientWidth * (1 - atScale)
    const minY = el.clientHeight * (1 - atScale)
    return {
      x: Math.min(0, Math.max(minX, point.x)),
      y: Math.min(0, Math.max(minY, point.y)),
    }
  }

  /** Zooms by `delta` around a viewport point, or around the centre. */
  function zoomBy(delta: number, clientX?: number, clientY?: number) {
    const el = container.value
    if (!el) return
    const next = Math.min(Math.max(scale.value + delta, minZoom), maxZoom)
    const rect = el.getBoundingClientRect()
    const originX = clientX === undefined ? rect.width / 2 : clientX - rect.left
    const originY = clientY === undefined ? rect.height / 2 : clientY - rect.top
    const factor = next / scale.value - 1
    position.value = clamp(
      {
        x: position.value.x - (originX - position.value.x) * factor,
        y: position.value.y - (originY - position.value.y) * factor,
      },
      next,
    )
    scale.value = next
  }

  function reset() {
    scale.value = minZoom
    position.value = { x: 0, y: 0 }
  }

  /** Centres a point of the content, given as fractions of its size, at a zoom. */
  function centerOn(fractionX: number, fractionY: number, zoom: number) {
    const el = container.value
    if (!el) return
    const next = Math.min(Math.max(zoom, minZoom), maxZoom)
    scale.value = next
    position.value = clamp(
      {
        x: el.clientWidth / 2 - fractionX * el.clientWidth * next,
        y: el.clientHeight / 2 - fractionY * el.clientHeight * next,
      },
      next,
    )
  }

  function flashWheelHint() {
    showWheelHint.value = true
    clearTimeout(hintTimer)
    hintTimer = setTimeout(() => {
      showWheelHint.value = false
    }, HINT_MS)
  }

  function panStart(clientX: number, clientY: number) {
    isPanning.value = true
    panOrigin = { x: clientX, y: clientY }
  }

  function panMove(clientX: number, clientY: number) {
    if (!isPanning.value) return
    position.value = clamp(
      {
        x: position.value.x + clientX - panOrigin.x,
        y: position.value.y + clientY - panOrigin.y,
      },
      scale.value,
    )
    panOrigin = { x: clientX, y: clientY }
  }

  function panEnd() {
    isPanning.value = false
  }

  /** Event handlers to bind on the container with v-on="handlers". */
  const handlers = {
    wheel(event: WheelEvent) {
      if (wheel === 'modifier' && !event.ctrlKey && !event.metaKey) {
        flashWheelHint()
        return
      }
      event.preventDefault()
      zoomBy(event.deltaY < 0 ? step : -step, event.clientX, event.clientY)
    },
    mousedown: (event: MouseEvent) => panStart(event.clientX, event.clientY),
    mousemove: (event: MouseEvent) => panMove(event.clientX, event.clientY),
    mouseup: panEnd,
    mouseleave: panEnd,
    touchstart(event: TouchEvent) {
      const touch = event.touches[0]
      if (touch) panStart(touch.clientX, touch.clientY)
    },
    touchmove(event: TouchEvent) {
      const touch = event.touches[0]
      if (touch) panMove(touch.clientX, touch.clientY)
    },
    touchend: panEnd,
  }

  const style = computed(() => ({
    transform: `translate(${position.value.x}px, ${position.value.y}px) scale(${scale.value})`,
    transition: isPanning.value ? 'none' : 'transform 0.3s ease',
    transformOrigin: 'top left',
  }))

  onScopeDispose(() => clearTimeout(hintTimer))

  return {
    scale,
    style,
    handlers,
    showWheelHint,
    isZoomed: computed(() => scale.value > minZoom),
    zoomIn: () => zoomBy(step),
    zoomOut: () => zoomBy(-step),
    reset,
    centerOn,
  }
}
