<!-- Style sketches for the map; not a reel. One still per second. -->
<template>
    <div class="mt">
        <ReelMap v-bind="frame.map" />
        <p class="mt__note">{{ frame.note }}</p>
        <YearCounter class="mt__year" :year="frame.map.year" :size="44" />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ReelMap from '~/components/ReelMap.vue'
import YearCounter from '~/components/YearCounter.vue'
import { reelTime } from '~/reel/time'

const madrid: [number, number] = [-3.69, 40.41]
const bruges: [number, number] = [3.22, 51.21]
const florence: [number, number] = [11.26, 43.77]
const milan: [number, number] = [9.19, 45.46]
const venice: [number, number] = [12.34, 45.44]
const edo: [number, number] = [139.69, 35.69]
const paris: [number, number] = [2.35, 48.86]

const FRAMES = [
    {
        note: 'Now: widget look, close in',
        map: { year: 1550, camera: { lon: 0, lat: 46, zoom: 5 }, labelArea: 900_000, featureLabels: false,
            pins: [{ id: 'm', at: madrid, label: 'MADRID' }, { id: 'b', at: bruges, label: 'BRUGES' }],
            arcs: [{ from: madrid, to: bruges, progress: 1 }] },
    },
    {
        note: 'Quiet: hairlines, further out, two states lit',
        map: { year: 1656, camera: { lon: 2, lat: 46, zoom: 3.2 }, mode: 'quiet' as const, strokeZoom: 2.6,
            highlight: [{ at: madrid }, { at: bruges }],
            pins: [{ id: 'm', at: madrid, label: 'MADRID · 1656' }, { id: 'b', at: bruges, label: 'BRUGES · 1434' }],
            arcs: [{ from: madrid, to: bruges, progress: 1 }] },
    },
    {
        note: 'Quiet, Italy 1495: Florence, Milan, Venice',
        map: { year: 1495, camera: { lon: 11, lat: 44.6, zoom: 9 }, mode: 'quiet' as const, strokeZoom: 2.6,
            highlight: [{ at: florence }, { at: milan }, { at: venice }],
            pins: [{ id: 'f', at: florence, label: 'FLORENCE' }, { id: 'm', at: milan, label: 'MILAN' }, { id: 'v', at: venice, label: 'VENICE' }],
            arcs: [{ from: florence, to: milan, progress: 1 }] },
    },
    {
        note: 'Quiet, world: Edo 1857 → Paris 1887',
        map: { year: 1857, camera: { lon: 71, lat: 38, zoom: 0.7 }, mode: 'quiet' as const, strokeZoom: 1.2,
            highlight: [{ at: edo }, { at: paris }],
            pins: [{ id: 'e', at: edo, label: 'EDO · 1857' }, { id: 'p', at: paris, label: 'PARIS · 1887' }],
            arcs: [{ from: edo, to: paris, progress: 1 }] },
    },
]

const frame = computed(() => FRAMES[Math.min(FRAMES.length - 1, Math.floor(reelTime.value))]!)
</script>

<style scoped>
.mt {
    position: absolute;
    inset: 0;
}

.mt__note {
    position: absolute;
    z-index: 30;
    left: 24px;
    bottom: 200px;
    margin: 0;
    padding: 6px 10px;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.7);
    color: var(--aw-color-text);
    font-family: var(--aw-font-mono);
    font-size: 11px;
}

.mt__year {
    position: absolute;
    z-index: 30;
    left: 24px;
    top: 104px;
}
</style>
