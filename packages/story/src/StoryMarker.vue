<template>
    <button type="button" :class="['story-marker', { 'story-marker--hidden': hidden }]" :style="style"
        :aria-label="t('zoomToPoint')" :tabindex="hidden ? -1 : undefined" @click="emit('activate')">
        <span class="story-marker__dot" />
    </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@art-widgets/core'

const props = defineProps<{
    /** Percent of the image. */
    x: number
    y: number
    hidden: boolean
}>()

const emit = defineEmits<{ activate: [] }>()

const { t } = useI18n()

const style = computed(() => ({ left: props.x + '%', top: props.y + '%' }))
</script>

<style scoped>
.story-marker {
    position: absolute;
    width: 28px;
    height: 28px;
    margin: -14px 0 0 -14px;
    padding: 0;
    border: 1.5px solid var(--aw-color-gold);
    border-radius: 50%;
    background-color: rgba(0, 0, 0, 0.25);
    cursor: zoom-in;
    transition:
        left var(--aw-duration-slow) var(--aw-ease),
        top var(--aw-duration-slow) var(--aw-ease),
        opacity var(--aw-duration) var(--aw-ease),
        transform var(--aw-duration) var(--aw-ease);
}

/* Slow halo that draws the eye to the current detail. */
.story-marker::after {
    content: "";
    position: absolute;
    inset: -1.5px;
    border: 1.5px solid var(--aw-color-gold);
    border-radius: 50%;
    animation: story-marker-halo 2.2s var(--aw-ease) infinite;
}

.story-marker__dot {
    position: absolute;
    inset: 50% auto auto 50%;
    width: 6px;
    height: 6px;
    margin: -3px 0 0 -3px;
    border-radius: 50%;
    background-color: var(--aw-color-gold);
}

.story-marker:hover {
    transform: scale(1.15);
}

.story-marker:focus-visible {
    outline: none;
    box-shadow: var(--aw-focus-ring);
}

.story-marker--hidden {
    opacity: 0;
    transform: scale(0.6);
    pointer-events: none;
}

@keyframes story-marker-halo {
    from {
        opacity: 0.7;
        transform: scale(1);
    }

    to {
        opacity: 0;
        transform: scale(2.2);
    }
}

@media (prefers-reduced-motion: reduce) {
    .story-marker::after {
        animation: none;
        opacity: 0;
    }
}
</style>
