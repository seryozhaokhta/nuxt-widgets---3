import { ref, type Ref } from 'vue'

const ZOOM = 2

/** Zooms an image towards a point given in percent, without exposing its edges. */
export function useZoomToPoint(image: Ref<HTMLElement | null>) {
  const translate = ref({ x: 0, y: 0 })
  const scale = ref(1)
  const isZoomedIn = ref(false)

  function zoomTo(point: { x: number; y: number }) {
    const el = image.value
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    const maxX = (width * (ZOOM - 1)) / 2
    const maxY = (height * (ZOOM - 1)) / 2
    const x = -((point.x / 100) * width - width / 2) * (ZOOM - 1)
    const y = -((point.y / 100) * height - height / 2) * (ZOOM - 1)
    translate.value = {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    }
    scale.value = ZOOM
    isZoomedIn.value = true
  }

  function reset() {
    translate.value = { x: 0, y: 0 }
    scale.value = 1
    isZoomedIn.value = false
  }

  return { translate, scale, isZoomedIn, zoomTo, reset }
}
