<!-- Guided tour of a painting: steps through details with text, progress and zoom. -->
<template>
    <section class="story" tabindex="0" :lang="locale" :aria-label="t('storyRegion') + ': ' + l(data.title)"
        @keydown="onKeydown">
        <div class="story__layout">
            <div class="story__frame" :style="{ aspectRatio }">
                <img ref="imageRef" :src="data.image" :alt="l(data.alt ?? data.title)"
                    :class="['story__image', { 'story__image--zoomed': isZoomedIn }]" :style="imageStyle"
                    @load="onImageLoad" @click="resetZoom" />
                <StoryMarker v-if="point" :x="point.x" :y="point.y" :hidden="isZoomedIn" @activate="toggleZoom" />
            </div>

            <div class="story__panel">
                <p v-if="meta" class="story__eyebrow">{{ meta }}</p>
                <h2 class="story__title">{{ l(data.title) }}</h2>

                <div class="story__step" aria-live="polite">
                    <p class="story__counter">
                        <span class="story__counter-current">{{ pad(index + 1) }}</span> / {{ pad(data.points.length) }}
                    </p>
                    <h3 v-if="point?.title" class="story__step-title">{{ l(point.title) }}</h3>
                    <p class="story__step-text">{{ l(point?.text) }}</p>
                </div>

                <SegmentedProgress class="story__progress" cumulative :labels="stepLabels" :current="index"
                    :progress="progress" @select="goTo" />
                <StoryControls :is-paused="isPaused" :is-zoomed-in="isZoomedIn" @previous="goTo(index - 1)"
                    @next="goTo(index + 1)" @toggle-pause="togglePause" @toggle-zoom="toggleZoom" @restart="startOver" />
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { provideI18n, useStepTimer, type Locale } from '@art-widgets/core'
import { SegmentedProgress } from '@art-widgets/ui'
import StoryMarker from './StoryMarker.vue'
import StoryControls from './StoryControls.vue'
import { useZoomToPoint } from './useZoomToPoint'
import type { StoryData } from './types'

const props = defineProps<{
    data: StoryData
    locale?: Locale
}>()

const { t, l, yearRange, locale } = provideI18n(() => props.locale)

const imageRef = ref<HTMLImageElement | null>(null)
const index = ref(0)
const point = computed(() => props.data.points[index.value])

const stepLabels = computed(() =>
    props.data.points.map((_, i) => t('step', { n: i + 1, total: props.data.points.length })))

const meta = computed(() => {
    const parts = [l(props.data.author)]
    const dated = props.data.dated
    if (dated) {
        const end = dated.end ?? dated.start
        parts.push(dated.start >= 0
            ? (end === dated.start ? String(dated.start) : dated.start + '–' + end)
            : yearRange(dated.start, end))
    }
    return parts.filter(Boolean).join(' · ')
})

// The frame takes the painting's proportions, so nothing is cropped and
// point coordinates are percentages of the whole image.
const naturalAspect = ref<number | null>(null)
const aspectRatio = computed(() => {
    const size = props.data.size
    if (size) return size.width + ' / ' + size.height
    return String(naturalAspect.value ?? 3 / 2)
})

function onImageLoad() {
    const img = imageRef.value
    if (img?.naturalWidth) naturalAspect.value = img.naturalWidth / img.naturalHeight
}

const { translate, scale, isZoomedIn, zoomTo, reset: resetZoom } = useZoomToPoint(imageRef)

// Longer texts stay on screen longer.
const stepDuration = computed(() => {
    if (props.data.stepDuration) return props.data.stepDuration
    const length = l(point.value?.text).length + l(point.value?.title).length
    return Math.min(12000, Math.max(5000, 2500 + length * 45))
})

const { progress, isPaused, start, togglePause, restart, reset: resetProgress } = useStepTimer({
    duration: stepDuration,
    onComplete: () => goTo(index.value + 1),
})

onMounted(start)

/** Moves to a point (wrapping around) and restarts its timer and zoom. */
function goTo(target: number) {
    const count = props.data.points.length
    resetZoom()
    resetProgress()
    index.value = count ? ((target % count) + count) % count : 0
}

function startOver() {
    goTo(0)
    restart()
}

function toggleZoom() {
    if (isZoomedIn.value) resetZoom()
    else if (point.value) zoomTo(point.value)
}

const imageStyle = computed(() => ({
    transform: `translate(${translate.value.x}px, ${translate.value.y}px) scale(${scale.value})`,
}))

function pad(value: number): string {
    return String(value).padStart(2, '0')
}

function onKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') {
        event.preventDefault()
        goTo(index.value + 1)
    } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goTo(index.value - 1)
    } else if (event.key === ' ' && !(event.target as HTMLElement).closest('button')) {
        // Space on a focused button is that button's own click.
        event.preventDefault()
        togglePause()
    }
}
</script>

<style scoped>
.story {
    container-type: inline-size;
    width: 100%;
    color: var(--aw-color-text);
    font-family: var(--aw-font-sans);
}

.story__layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: 40px;
    align-items: center;
}

.story:focus-visible {
    outline: 1px solid var(--aw-color-gold-soft);
    outline-offset: 12px;
    border-radius: var(--aw-radius-sm);
}

.story__frame {
    position: relative;
    overflow: hidden;
    border-radius: var(--aw-radius-xs);
    background-color: var(--aw-color-ink);
}

.story__image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    cursor: default;
    will-change: transform;
    transition: transform 0.8s var(--aw-ease);
}

.story__image--zoomed {
    cursor: zoom-out;
}

.story__panel {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.story__eyebrow,
.story__counter {
    margin: 0;
    color: var(--aw-color-text-subtle);
    font-family: var(--aw-font-mono);
    font-size: var(--aw-label-size);
    font-weight: 400;
}

.story__title {
    margin: 10px 0 0;
    font-family: var(--aw-font-artwork);
    font-size: 42px;
    font-style: italic;
    font-weight: 400;
    letter-spacing: var(--aw-tracking-title);
    line-height: 1.05;
    text-wrap: balance;
}

.story__step {
    min-height: 168px;
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid var(--aw-color-line);
}

.story__counter-current {
    color: var(--aw-color-gold);
}

.story__step-title {
    margin: 12px 0 0;
    font-family: var(--aw-font-display);
    font-size: 20px;
    font-weight: 600;
    letter-spacing: var(--aw-tracking-heading);
    line-height: 1.15;
}

.story__step-text {
    margin: 10px 0 0;
    color: var(--aw-color-text-muted);
    font-size: var(--aw-text-md);
    line-height: 1.6;
}

.story__progress {
    margin: 16px 0 8px;
}

@container (max-width: 760px) {
    .story__layout {
        grid-template-columns: minmax(0, 1fr);
        gap: 20px;
    }

    .story__panel {
        padding: 0 4px;
    }

    .story__title {
        font-size: 34px;
    }

    .story__step {
        min-height: 0;
    }
}
</style>
