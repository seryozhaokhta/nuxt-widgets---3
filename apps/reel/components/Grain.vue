<!-- Film grain and a soft vignette over the whole frame; grain changes 24 times a second. -->
<template>
    <div class="grain" aria-hidden="true">
        <div v-if="tile" class="grain__noise" :style="noiseStyle" />
        <div class="grain__vignette" :style="{ opacity: vignette }" />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { reelTime } from '~/reel/time'
import { hash } from '~/reel/motion'

const props = withDefaults(defineProps<{ amount?: number; vignette?: number }>(), { amount: 0.07, vignette: 0.6 })

const tile = ref('')

onMounted(() => {
    const size = 192
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext('2d')!
    const image = context.createImageData(size, size)
    for (let i = 0; i < size * size; i++) {
        const value = Math.round(hash(i + 7) * 255)
        image.data[i * 4] = value
        image.data[i * 4 + 1] = value
        image.data[i * 4 + 2] = value
        image.data[i * 4 + 3] = 255
    }
    context.putImageData(image, 0, 0)
    tile.value = canvas.toDataURL('image/png')
})

const noiseStyle = computed(() => {
    const frame = Math.floor(reelTime.value * 24)
    return {
        backgroundImage: `url(${tile.value})`,
        backgroundPosition: `${Math.round(hash(frame) * 192)}px ${Math.round(hash(frame + 991) * 192)}px`,
        opacity: props.amount,
    }
})
</script>

<style scoped>
.grain {
    position: absolute;
    inset: 0;
    z-index: 50;
    pointer-events: none;
}

.grain__noise {
    position: absolute;
    inset: 0;
    background-size: 96px 96px;
    image-rendering: pixelated;
    mix-blend-mode: overlay;
}

.grain__vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(120% 80% at 50% 45%, transparent 55%, rgba(0, 0, 0, 0.55) 100%);
}
</style>
