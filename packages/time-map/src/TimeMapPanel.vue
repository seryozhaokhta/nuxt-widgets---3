<!-- Side panel (bottom sheet on narrow screens) with a point's details and periods. -->
<template>
    <div ref="panelRef" class="time-map-panel" tabindex="-1" role="dialog" :aria-label="l(point.name)">
        <div class="time-map-panel__top">
            <p class="time-map-panel__eyebrow">
                {{ year(point.founded, { approx: point.approx }) }} · {{ t('founded') }}
            </p>
            <IconButton class="time-map-panel__close" icon="close" size="sm" :label="t('close')" @click="close" />
        </div>
        <h2 class="time-map-panel__title">{{ l(point.name) }}</h2>

        <div v-if="period" class="time-map-panel__period">
            <p class="time-map-panel__period-years">
                {{ yearRange(period.start, period.end, { approx: period.approx }) }}
            </p>
            <h3 class="time-map-panel__period-title">{{ l(period.title) }}</h3>
            <p class="time-map-panel__text">{{ l(period.description) }}</p>
        </div>
        <p v-else class="time-map-panel__text">{{ l(point.description) }}</p>

        <SegmentedProgress v-if="point.periods?.length" class="time-map-panel__periods" smooth
            :labels="periodLabels" :current="periodIndex" @select="selectPeriod" />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import gsap from 'gsap'
import { useI18n } from '@art-widgets/core'
import { IconButton, SegmentedProgress } from '@art-widgets/ui'
import type { TimeMapPeriod, TimeMapPoint } from './types'

const props = defineProps<{ point: TimeMapPoint }>()

const periodIndex = defineModel<number>('periodIndex', { required: true })

const emit = defineEmits<{
    selectPeriod: [period: TimeMapPeriod]
    /** The close animation has finished. */
    closed: []
}>()

const { t, l, year, yearRange } = useI18n()

const period = computed(() => props.point.periods?.[periodIndex.value])
const periodLabels = computed(() => props.point.periods?.map((item) => l(item.title)) ?? [])

function selectPeriod(index: number) {
    const selected = props.point.periods?.[index]
    if (!selected) return
    periodIndex.value = index
    emit('selectPeriod', selected)
}

const panelRef = ref<HTMLElement | null>(null)

function open() {
    if (!panelRef.value) return
    gsap.fromTo(panelRef.value, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' })
    // Focus keeps Esc working for this map only.
    panelRef.value.focus({ preventScroll: true })
}

function close() {
    if (!panelRef.value) return
    gsap.to(panelRef.value, {
        opacity: 0,
        y: 12,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: () => emit('closed'),
    })
}

onMounted(open)

defineExpose({ open, close })
</script>

<style scoped>
.time-map-panel {
    position: absolute;
    top: 12px;
    right: 12px;
    bottom: 12px;
    width: 300px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    padding: 18px 20px 14px;
    overflow-y: auto;
    border-radius: var(--aw-radius-md);
    background-color: var(--aw-color-ink);
    box-shadow: 0 0 0 1px var(--aw-color-line), 0 24px 48px -16px rgba(0, 0, 0, 0.9);
    color: var(--aw-color-text);
    cursor: default;
}

.time-map-panel:focus {
    outline: none;
}

.time-map-panel__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.time-map-panel__close {
    margin: -6px -8px -6px 0;
}

.time-map-panel__eyebrow,
.time-map-panel__period-years {
    margin: 0;
    color: var(--aw-color-gold);
    font-size: var(--aw-text-xs);
    font-weight: 500;
    letter-spacing: var(--aw-label-tracking);
    text-transform: uppercase;
}

.time-map-panel__title {
    margin: 8px 0 0;
    font-family: var(--aw-font-serif);
    font-size: 30px;
    font-weight: 500;
    line-height: 1.05;
}

.time-map-panel__period {
    margin-top: 18px;
    padding-top: 16px;
    border-top: 1px solid var(--aw-color-line);
}

.time-map-panel__period-years {
    color: var(--aw-color-text-subtle);
}

.time-map-panel__period-title {
    margin: 6px 0 0;
    font-family: var(--aw-font-serif);
    font-size: 21px;
    font-weight: 500;
    line-height: 1.15;
}

.time-map-panel__text {
    margin: 8px 0 0;
    color: var(--aw-color-text-muted);
    font-size: 14px;
    line-height: 1.6;
}

.time-map-panel__periods {
    margin-top: auto;
    padding-top: 16px;
}

@container (max-width: 760px) {
    .time-map-panel {
        position: static;
        width: auto;
        margin-top: 12px;
        padding: 14px 16px 10px;
        overflow: visible;
    }

    .time-map-panel__title {
        font-size: 24px;
    }

    .time-map-panel__period {
        margin-top: 12px;
        padding-top: 12px;
    }
}
</style>
