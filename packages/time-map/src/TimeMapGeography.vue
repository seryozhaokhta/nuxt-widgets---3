<!-- The map drawing: sea, land of the current epoch, lakes, rivers, ice and hand-drawn areas. -->
<template>
    <svg class="geo" :viewBox="'0 0 ' + MAP_WIDTH + ' ' + MAP_HEIGHT" :style="{ '--zoom': zoom }" role="img"
        :aria-label="label">
        <defs>
            <clipPath :id="clipId">
                <path :d="landPath" />
            </clipPath>
        </defs>

        <path class="geo__sea" :d="spherePath" />
        <path class="geo__grid" :d="gridPath" />

        <Transition name="geo-fade">
            <path v-if="landPath" :key="landUrl" class="geo__land" :d="landPath" />
        </Transition>
        <path v-if="lakesPath" class="geo__sea" :d="lakesPath" />

        <!-- Areas are clipped to the land of the epoch, so they can be drawn loosely along coasts. -->
        <g :clip-path="'url(#' + clipId + ')'">
            <path v-for="shape in shapes.water" :key="shape.id" :class="classes(shape, 'geo__sea')" :d="shape.d" />
        </g>
        <path v-if="riversPath.major" class="geo__river" :d="riversPath.major" />
        <path v-if="riversPath.minor" class="geo__river geo__river--minor" :d="riversPath.minor" />
        <path v-for="shape in shapes.river" :key="shape.id" :class="classes(shape, 'geo__river geo__river--old')"
            :d="shape.d" />
        <path v-for="shape in shapes.ice" :key="shape.id" :class="classes(shape, 'geo__ice')" :d="shape.d" />
        <g :clip-path="'url(#' + clipId + ')'">
            <path v-for="shape in shapes.culture" :key="shape.id" :class="classes(shape, 'geo__culture')"
                :d="shape.d" />
            <path v-for="shape in shapes.state" :key="shape.id" :class="classes(shape, 'geo__state')"
                :d="shape.d" />
        </g>

        <path v-if="bordersPath" :class="['geo__borders', 'geo__feature', { 'geo__feature--visible': showBorders }]"
            :d="bordersPath" />
        <path v-if="coastPath" class="geo__coast" :d="coastPath" />
    </svg>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import type { GeoProjection } from 'd3-geo'
import type { FeatureCollection } from 'geojson'
import { createPath, featureGeometry, graticule, MAP_HEIGHT, MAP_WIDTH, type GeoJson } from './geo'
import { useGeoJson } from './useGeoJson'
import type { TimeMapFeature, TimeMapFeatureKind, TimeMapGeography } from './types'

const props = defineProps<{
    geography: TimeMapGeography
    features: TimeMapFeature[]
    projection: GeoProjection
    /** URL of the land outline to show. */
    landUrl?: string
    year: number
    zoom: number
    label: string
}>()

const clipId = 'time-map-land-' + useId()

const path = computed(() => createPath(props.projection))
const draw = (layer: GeoJson | null | undefined) => (layer ? path.value(layer) ?? '' : '')

const spherePath = computed(() => draw({ type: 'Sphere' } as unknown as GeoJson))
const gridPath = computed(() => draw(graticule))

// Every epoch's land is loaded up front (once per file) so moving the slider is instant.
const lands = new Map([...new Set(props.geography.epochs.map((epoch) => epoch.land))]
    .map((url) => [url, useGeoJson(() => url)]))
const landPath = computed(() => draw(props.landUrl ? lands.get(props.landUrl)?.value : null))

const lakes = useGeoJson(() => props.geography.lakes)
const rivers = useGeoJson(() => props.geography.rivers)
const coast = useGeoJson(() => props.geography.modernCoast)
const borders = useGeoJson(() => props.geography.borders?.url)
const bordersPath = computed(() => draw(borders.value))
const showBorders = computed(() => props.year >= (props.geography.borders?.from ?? Infinity))
const lakesPath = computed(() => draw(lakes.value))
const coastPath = computed(() => draw(coast.value))

/** Big rivers (Natural Earth rank 0–2) are drawn heavier than the rest. */
const riversPath = computed(() => {
    const collection = rivers.value as FeatureCollection | null
    if (!collection?.features) return { major: '', minor: '' }
    const pick = (major: boolean) => draw({
        type: 'FeatureCollection',
        features: collection.features.filter((feature) => (Number(feature.properties?.rank ?? 9) <= 2) === major),
    })
    return { major: pick(true), minor: pick(false) }
})

interface Shape {
    id: string
    d: string
    from: number
    to: number
}

const shapes = computed(() => {
    const groups: Record<Exclude<TimeMapFeatureKind, 'place'>, Shape[]> = {
        water: [], river: [], ice: [], culture: [], state: [],
    }
    for (const feature of props.features) {
        if (feature.kind === 'place') continue
        const geometry = featureGeometry(feature)
        if (!geometry) continue
        groups[feature.kind].push({ id: feature.id, d: draw(geometry), from: feature.from, to: feature.to })
    }
    return groups
})

function classes(shape: Shape, base: string) {
    const visible = shape.from <= props.year && props.year <= shape.to
    return [base, 'geo__feature', { 'geo__feature--visible': visible }]
}
</script>

<style scoped>
.geo {
    display: block;
    width: 100%;
    height: 100%;
    pointer-events: none;
}

.geo__sea {
    fill: var(--aw-map-sea);
}

.geo__grid {
    fill: none;
    stroke: var(--aw-map-grid);
    stroke-width: calc(0.6px / var(--zoom));
}

.geo__land {
    fill: var(--aw-map-land);
}

.geo__river {
    fill: none;
    stroke: var(--aw-map-river);
    stroke-width: calc(0.9px / var(--zoom));
    stroke-linecap: round;
    stroke-linejoin: round;
}

.geo__river--minor {
    stroke-width: calc(0.5px / var(--zoom));
    opacity: 0.7;
}

.geo__river--old {
    stroke-width: calc(1px / var(--zoom));
    stroke-dasharray: calc(3px / var(--zoom)) calc(2px / var(--zoom));
}

.geo__ice {
    fill: var(--aw-map-ice);
    stroke: var(--aw-map-ice-edge);
    stroke-width: calc(0.6px / var(--zoom));
}

.geo__culture {
    fill: var(--aw-map-culture);
    stroke: var(--aw-map-culture-edge);
    stroke-width: calc(0.7px / var(--zoom));
    stroke-dasharray: calc(2.5px / var(--zoom)) calc(2px / var(--zoom));
}

.geo__state {
    fill: var(--aw-map-state);
    stroke: var(--aw-map-state-edge);
    stroke-width: calc(0.9px / var(--zoom));
}

.geo__borders {
    fill: none;
    stroke: var(--aw-map-border);
    stroke-width: calc(0.6px / var(--zoom));
    stroke-linejoin: round;
}

.geo__coast {
    fill: none;
    stroke: var(--aw-map-coast);
    stroke-width: calc(0.5px / var(--zoom));
    stroke-dasharray: calc(1.5px / var(--zoom)) calc(1.5px / var(--zoom));
}

.geo__feature {
    opacity: 0;
    transition: opacity 0.5s var(--aw-ease);
}

.geo__feature--visible {
    opacity: 1;
}

.geo-fade-enter-active,
.geo-fade-leave-active {
    transition: opacity 0.7s var(--aw-ease);
}

.geo-fade-enter-from,
.geo-fade-leave-to {
    opacity: 0;
}
</style>
