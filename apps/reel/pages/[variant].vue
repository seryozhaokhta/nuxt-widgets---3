<!--
  Stage for one reel. In a browser it plays in real time with a scrubber
  (?safe shows the areas the Reels UI covers). With ?render the renderer
  drives it frame by frame through window.__reel.
-->
<template>
    <div :class="['host', { 'host--render': render }]">
        <div class="host__fit" :style="fitStyle">
            <div class="stage" :style="{ width: STAGE.width + 'px', height: STAGE.height + 'px' }">
                <component :is="view" v-if="view" :key="take" />
                <SafeZones v-if="showSafe" />
            </div>
        </div>

        <div v-if="!render && variant" class="host__bar">
            <button type="button" class="host__button" @click="togglePlay">{{ playing ? 'Pause' : 'Play' }}</button>
            <input class="host__scrub" type="range" min="0" :max="variant.duration" step="0.01" :value="now"
                @input="onScrub" />
            <span class="host__time">{{ now.toFixed(2) }} / {{ variant.duration.toFixed(1) }}</span>
            <label class="host__safe"><input v-model="showSafe" type="checkbox" /> safe zones</label>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, type Component } from 'vue'
import SafeZones from '~/components/SafeZones.vue'
import { firstFrameReady, reelTime, setReelTime, STAGE } from '~/reel/time'
import { variants } from '~/variants'

interface Clock {
    now: number
    advanceTo: (ms: number) => Promise<void>
    syncAnimations: () => void
    idle: () => Promise<void>
    realFrame: () => Promise<void>
}

const route = useRoute()
const render = 'render' in route.query
const variant = variants.find((item) => item.id === route.params.variant)
const view = shallowRef<Component | null>(null)
/** Remounting the variant restarts its cues (loop, or a seek backwards). */
const take = ref(0)
const showSafe = ref('safe' in route.query)
const now = computed(() => reelTime.value)

const windowHeight = ref(800)
const fitStyle = computed(() => {
    if (render) return {}
    const scale = Math.min(1.25, (windowHeight.value - 72) / STAGE.height)
    return { transform: `scale(${scale})`, transformOrigin: 'top center' }
})

/** Waits until data, images and fonts the current frame needs are in. */
async function settle(clock: Clock | undefined) {
    for (let pass = 0; pass < 6; pass++) {
        await nextTick()
        await clock?.idle()
        const loading = [...document.images].filter((image) => !image.complete || !image.naturalWidth)
        await Promise.all(loading.map((image) => image.decode().catch(() => undefined)))
        await document.fonts.ready
        await clock?.realFrame()
        await nextTick()
        if (pass >= 1 && !loading.length) break
    }
    clock?.syncAnimations()
}

let origin = 0

async function frame(seconds: number) {
    const clock = (window as unknown as { __clock?: Clock }).__clock
    await clock?.advanceTo(origin + seconds * 1000)
    setReelTime(seconds)
    await settle(clock)
}

// Preview playback
const playing = ref(true)
let startedAt = 0
let raf = 0

function loop() {
    if (!variant) return
    if (playing.value) {
        let seconds = (performance.now() - startedAt) / 1000
        if (seconds >= variant.duration) {
            startedAt = performance.now()
            seconds = 0
            take.value++
        }
        setReelTime(seconds)
    }
    raf = requestAnimationFrame(loop)
}

function togglePlay() {
    playing.value = !playing.value
    if (playing.value) startedAt = performance.now() - reelTime.value * 1000
}

function onScrub(event: Event) {
    const seconds = Number((event.target as HTMLInputElement).value)
    if (seconds < reelTime.value) take.value++
    setReelTime(seconds)
    startedAt = performance.now() - seconds * 1000
}

function onResize() {
    windowHeight.value = window.innerHeight
}

onMounted(async () => {
    if (!variant) return
    const loaded = await variant.component()
    view.value = 'default' in loaded ? (loaded.default as Component) : loaded
    setReelTime(0)
    await nextTick()

    if (render) {
        const ready = (async () => {
            await firstFrameReady()
            await settle(undefined)
        })()
        Object.assign(window, {
            __reel: {
                id: variant.id,
                duration: variant.duration,
                bpm: variant.bpm,
                mood: variant.mood,
                sounds: variant.sounds,
                ready,
                /** Call once after freezing the clock. */
                start() {
                    origin = (window as unknown as { __clock?: Clock }).__clock?.now ?? 0
                },
                frame,
            },
        })
        return
    }

    onResize()
    window.addEventListener('resize', onResize)
    await firstFrameReady()
    startedAt = performance.now()
    raf = requestAnimationFrame(loop)
})

onBeforeUnmount(() => {
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
.host {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 100vh;
    padding-top: 12px;
    background: #050505;
}

.host--render {
    display: block;
    min-height: 0;
    padding: 0;
    background: #000;
}

.stage {
    position: relative;
    overflow: hidden;
    background: var(--aw-color-bg);
    isolation: isolate;
}

.host:not(.host--render) .stage {
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.host__bar {
    position: fixed;
    left: 50%;
    bottom: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    width: min(640px, calc(100vw - 32px));
    padding: 8px 12px;
    transform: translateX(-50%);
    border-radius: 999px;
    background: rgba(20, 20, 20, 0.9);
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
    color: var(--aw-color-text-muted);
    font-family: var(--aw-font-mono);
    font-size: 12px;
}

.host__button {
    padding: 4px 12px;
    border: none;
    border-radius: 999px;
    background: var(--aw-color-gold);
    color: #000;
    font: inherit;
    cursor: pointer;
}

.host__scrub {
    flex: 1;
    accent-color: var(--aw-color-gold);
}

.host__time {
    font-variant-numeric: tabular-nums;
}

.host__safe {
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
}
</style>
