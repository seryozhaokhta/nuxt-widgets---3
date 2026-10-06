<!-- A point on the map that pops in and out as it becomes visible. -->
<template>
    <button v-if="rendered" ref="el" type="button" :class="['time-map-marker', { 'time-map-marker--active': active }]"
        :style="style" :data-id="point.id" @click="emit('select')" @mousedown.stop @touchstart.stop>
        <span class="time-map-marker__dot" />
        <span class="time-map-marker__label">{{ l(point.name) }}</span>
    </button>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import gsap from 'gsap'
import { useI18n } from '@art-widgets/core'
import type { TimeMapPoint } from './types'

const props = defineProps<{
    point: TimeMapPoint
    visible: boolean
    /** Its panel is open. */
    active: boolean
    /** Map zoom; the marker is counter-scaled to keep its size. */
    zoom: number
}>()

const emit = defineEmits<{ select: [] }>()

const { l } = useI18n()

const el = ref<HTMLElement | null>(null)
const rendered = ref(false)

const style = computed(() => ({
    left: props.point.x + '%',
    top: props.point.y + '%',
    transform: 'translate(-50%, -50%) scale(' + 1 / props.zoom + ')',
}))

function appear() {
    rendered.value = true
    nextTick(() => {
        if (!el.value) return
        gsap.killTweensOf(el.value)
        gsap.fromTo(el.value, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' })
    })
}

function disappear() {
    if (!el.value) {
        rendered.value = false
        return
    }
    gsap.to(el.value, {
        opacity: 0,
        scale: 0,
        duration: 0.4,
        ease: 'power2.in',
        onComplete: () => {
            rendered.value = false
        },
    })
}

onMounted(() => {
    if (props.visible) appear()
})

watch(() => props.visible, (now, before) => {
    if (now && !before) appear()
    else if (!now && before) disappear()
})
</script>

<style scoped>
.time-map-marker {
    position: absolute;
    width: 22px;
    height: 22px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: none;
    color: var(--aw-color-text);
    font: inherit;
    cursor: pointer;
    transform-origin: center;
}

.time-map-marker__dot {
    position: absolute;
    inset: 6px;
    border-radius: 50%;
    background-color: var(--aw-color-gold);
    box-shadow: 0 0 0 3px rgba(201, 164, 106, 0.22), 0 0 12px rgba(201, 164, 106, 0.45);
    transition: box-shadow var(--aw-duration) var(--aw-ease), background-color var(--aw-duration) var(--aw-ease);
}

.time-map-marker:hover .time-map-marker__dot,
.time-map-marker--active .time-map-marker__dot {
    background-color: var(--aw-color-gold-bright);
    box-shadow: 0 0 0 5px rgba(201, 164, 106, 0.3), 0 0 18px rgba(228, 199, 146, 0.6);
}

.time-map-marker:focus-visible {
    outline: none;
    box-shadow: var(--aw-focus-ring);
}

.time-map-marker__label {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    color: var(--aw-color-text-muted);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.02em;
    text-shadow: 0 1px 3px #000, 0 0 8px #000;
    white-space: nowrap;
    transition: color var(--aw-duration) var(--aw-ease);
}

.time-map-marker:hover .time-map-marker__label,
.time-map-marker--active .time-map-marker__label {
    color: var(--aw-color-text);
}
</style>
