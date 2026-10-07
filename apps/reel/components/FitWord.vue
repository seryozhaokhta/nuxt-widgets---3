<!-- A word set exactly as wide as `width`, in the display face. -->
<template>
    <span class="fit-word" :style="{ fontSize: size + 'px', letterSpacing: tracking + 'em' }">{{ text }}</span>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { holdFirstFrame } from '~/reel/time'

const props = withDefaults(defineProps<{
    text: string
    width: number
    /** Cap for short words. */
    maxSize?: number
    tracking?: number
    weight?: number
}>(), { maxSize: 260, tracking: -0.055, weight: 700 })

const FAMILY = '"Inter Tight Variable"'
const loaded = ref(false)
const loading = document.fonts.load(`700 100px ${FAMILY}`).then(() => {
    loaded.value = true
})
holdFirstFrame(loading)

const canvas = document.createElement('canvas').getContext('2d')!

const size = computed(() => {
    if (!loaded.value) return 100
    canvas.font = `${props.weight} 100px ${FAMILY}`
    canvas.letterSpacing = props.tracking * 100 + 'px'
    // The tracking after the last letter doesn't count.
    const width = canvas.measureText(props.text).width - props.tracking * 100
    return Math.min(props.maxSize, (100 * props.width) / width)
})
</script>

<style scoped>
.fit-word {
    display: block;
    font-family: var(--aw-font-display);
    font-weight: v-bind(weight);
    line-height: 0.8;
    white-space: nowrap;
    font-variant-numeric: lining-nums;
}
</style>
