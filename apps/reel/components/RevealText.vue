<!-- Lines that rise out of a mask one after another, and leave upwards. -->
<template>
    <div class="reveal" :aria-label="lines.join(' ')">
        <span v-for="(line, i) in lines" :key="i" class="reveal__mask">
            <span class="reveal__line" :style="lineStyle(i)">{{ line }}</span>
        </span>
    </div>
</template>

<script setup lang="ts">
import { reelTime } from '~/reel/time'
import { ease, tween } from '~/reel/motion'

const props = withDefaults(defineProps<{
    lines: string[]
    /** Time the first line starts to rise. */
    at: number
    /** Time the first line starts to leave; omit to stay. */
    out?: number
    stagger?: number
    duration?: number
}>(), { stagger: 0.07, duration: 0.75 })

function lineStyle(i: number) {
    const t = reelTime.value
    const start = props.at + i * props.stagger
    const enter = tween(t, start, start + props.duration, ease.expoOut)
    let y = (1 - enter) * 105
    if (props.out !== undefined) {
        const leave = tween(t, props.out + i * props.stagger * 0.6, props.out + i * props.stagger * 0.6 + props.duration * 0.7, ease.expoIn)
        y -= leave * 105
    }
    return { transform: `translateY(${y}%)`, visibility: enter > 0 && y > -104 ? ('visible' as const) : ('hidden' as const) }
}
</script>

<style scoped>
.reveal {
    display: flex;
    flex-direction: column;
}

.reveal__mask {
    display: block;
    overflow: hidden;
    padding-bottom: 0.08em;
    margin-bottom: -0.08em;
}

.reveal__line {
    display: block;
    white-space: pre;
}
</style>
