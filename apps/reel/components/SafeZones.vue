<!-- Areas the Reels interface covers; shown in preview with ?safe. -->
<template>
    <div class="safe" aria-hidden="true">
        <div class="safe__zone" :style="{ top: 0, left: 0, right: 0, height: SAFE.top + 'px' }" />
        <div class="safe__zone" :style="{ bottom: 0, left: 0, right: 0, height: SAFE.bottom + 'px' }" />
        <div class="safe__zone" :style="{ top: SAFE.top + 'px', bottom: SAFE.bottom + 'px', right: 0, width: SAFE.right + 'px' }" />
        <div class="safe__zone" :style="{ top: SAFE.top + 'px', bottom: SAFE.bottom + 'px', left: 0, width: SAFE.left + 'px' }" />
    </div>
</template>

<script setup lang="ts">
import { SAFE } from '~/reel/time'
</script>

<style scoped>
.safe {
    position: absolute;
    inset: 0;
    z-index: 100;
    pointer-events: none;
}

.safe__zone {
    position: absolute;
    background: rgba(255, 40, 40, 0.18);
    box-shadow: inset 0 0 0 1px rgba(255, 60, 60, 0.6);
}
</style>
