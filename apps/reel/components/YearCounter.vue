<!-- Big year with its era, as on the map's header; digits are tabular so the width holds while it runs. -->
<template>
    <div class="year-counter" :style="{ fontSize: size + 'px' }">
        <span class="year-counter__digits">{{ yearDigits(year) }}</span>
        <span class="year-counter__era">{{ era(year) }}</span>
    </div>
</template>

<script setup lang="ts">
import { era, yearDigits } from '~/reel/years'

withDefaults(defineProps<{ year: number; size?: number }>(), { size: 60 })
</script>

<style scoped>
.year-counter {
    display: flex;
    align-items: baseline;
    gap: 0.16em;
    font-family: var(--aw-font-display);
    font-weight: 600;
    line-height: 0.9;
    letter-spacing: -0.045em;
    font-variant-numeric: lining-nums tabular-nums;
    white-space: nowrap;
}

.year-counter__era {
    color: var(--aw-color-gold);
    font-family: var(--aw-font-mono);
    font-size: 0.22em;
    font-weight: 500;
    letter-spacing: 0.04em;
}
</style>
