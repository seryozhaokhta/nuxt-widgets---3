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
  /**
   * Size of the content at zoom 1, px, when it isn't the container's (a map
   * that keeps its proportions in a taller frame and overflows its sides);
   * null while unknown. Default: the container's size.
   */
  content?: () => { width: number; height: number } | null
}

interface Point {
  x: number
  y: number
}

const HINT_MS = 1600
/** A one-finger drag this long (px) on touch is a page scroll: time for the two-finger hint. */
const TOUCH_SCROLL = 12

/**
 * Pan and zoom for content that fills `container` (or, with `content`, covers
 * it) and is transformed with `style` (origin top-left). The content can't be
 * dragged past its edges.
 *
 * On touch screens one finger scrolls the page as usual and two fingers move
 * and pinch the content; give the container `touch-action: pan-x pan-y` so the
 * browser leaves the pinch to us.
 */
export function usePanZoom(container: Ref<HTMLElement | null>, options: PanZoomOptions = {}) {
  const { minZoom = 1, maxZoom = 5, step = 0.5, wheel = 'modifier' } = options

  const scale = ref(1)
  const position = ref<Point>({ x: 0, y: 0 })
  const isPanning = ref(false)
  /** True for a moment after an unmodified wheel in "modifier" mode. */
  const showWheelHint = ref(false)
  /** What the hint is about: the wheel needs a modifier, touch needs two fingers. */
  const hintKind = ref<'wheel' | 'touch'>('wheel')
  let panOrigin: Point = { x: 0, y: 0 }
  let hintTimer: ReturnType<typeof setTimeout> | undefined
  /** Finger distance at the last move of a pinch; null when not pinching. */
  let pinchDistance: number | null = null
  let touchStart: Point | null = null

  const sizeOf = (el: HTMLElement) => options.content?.() ?? { width: el.clientWidth, height: el.clientHeight }

  function clamp(point: Point, atScale: number): Point {
    const el = container.value
    if (!el) return point
    const { width, height } = sizeOf(el)
    const minX = el.clientWidth - width * atScale
    const minY = el.clientHeight - height * atScale
    return {
      x: Math.min(0, Math.max(minX, point.x)),
      y: Math.min(0, Math.max(minY, point.y)),
    }
  }

  /** Zooms by `delta` around a viewport point, or around the centre. */
  function zoomBy(delta: number, clientX?: number, clientY?: number) {
    zoomTo(scale.value + delta, clientX, clientY)
  }

  /** Zooms to `zoom` around a viewport point, or around the centre. */
  function zoomTo(zoom: number, clientX?: number, clientY?: number) {
    const el = container.value
    if (!el) return
    const next = Math.min(Math.max(zoom, minZoom), maxZoom)
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

  /** The whole content at the smallest zoom, centred. */
  function reset() {
    scale.value = minZoom
    const el = container.value
    if (!el) {
      position.value = { x: 0, y: 0 }
      return
    }
    const { width, height } = sizeOf(el)
    position.value = clamp({ x: (el.clientWidth - width * minZoom) / 2, y: (el.clientHeight - height * minZoom) / 2 }, minZoom)
  }

  /** Centres a point of the content, given as fractions of its size, at a zoom. */
  function centerOn(fractionX: number, fractionY: number, zoom: number) {
    const el = container.value
    if (!el) return
    const next = Math.min(Math.max(zoom, minZoom), maxZoom)
    const { width, height } = sizeOf(el)
    scale.value = next
    position.value = clamp(
      {
        x: el.clientWidth / 2 - fractionX * width * next,
        y: el.clientHeight / 2 - fractionY * height * next,
      },
      next,
    )
  }

  function flashWheelHint(kind: 'wheel' | 'touch' = 'wheel') {
    hintKind.value = kind
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
      const [a, b] = [event.touches[0], event.touches[1]]
      if (a && b) {
        touchStart = null
        pinchDistance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
        panStart((a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2)
      } else if (a) {
        touchStart = { x: a.clientX, y: a.clientY }
      }
    },
    touchmove(event: TouchEvent) {
      const [a, b] = [event.touches[0], event.touches[1]]
      if (a && b && pinchDistance) {
        const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
        const midX = (a.clientX + b.clientX) / 2
        const midY = (a.clientY + b.clientY) / 2
        zoomTo(scale.value * (distance / pinchDistance), midX, midY)
        pinchDistance = distance
        panMove(midX, midY)
      } else if (a && touchStart && Math.hypot(a.clientX - touchStart.x, a.clientY - touchStart.y) > TOUCH_SCROLL) {
        touchStart = null
        flashWheelHint('touch')
      }
    },
    touchend(event: TouchEvent) {
      if (event.touches.length < 2) {
        pinchDistance = null
        panEnd()
      }
    },
  }

  const style = computed(() => ({
    transform: `translate(${position.value.x}px, ${position.value.y}px) scale(${scale.value})`,
    transition: isPanning.value ? 'none' : 'transform 0.3s ease',
    transformOrigin: 'top left',
  }))

  onScopeDispose(() => clearTimeout(hintTimer))

  return {
    scale,
    /** Offset of the content's top-left corner in the container, px. */
    offset: computed(() => position.value),
    style,
    handlers,
    showWheelHint,
    hintKind,
    isZoomed: computed(() => scale.value > minZoom),
    zoomIn: () => zoomBy(step),
    zoomOut: () => zoomBy(-step),
    reset,
    centerOn,
  }
}
