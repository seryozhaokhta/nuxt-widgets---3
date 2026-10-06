import { onMounted, shallowRef, watch, type ShallowRef } from 'vue'
import type { GeoJson } from './geo'

/** Loads a GeoJSON layer in the browser; stays null on the server and on errors. */
export function useGeoJson(url: () => string | undefined): ShallowRef<GeoJson | null> {
  const layer = shallowRef<GeoJson | null>(null)

  async function load(target: string | undefined) {
    layer.value = null
    if (!target) return
    try {
      const response = await fetch(target)
      if (!response.ok) throw new Error(response.status + ' ' + target)
      layer.value = await response.json()
    } catch (error) {
      console.warn('[time-map] layer not loaded:', error)
    }
  }

  onMounted(() => {
    load(url())
    watch(url, load)
  })

  return layer
}
