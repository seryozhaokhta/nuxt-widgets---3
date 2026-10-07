<!-- A fingertip, the way screen recordings show touches: a soft disc that presses and ripples. -->
<template>
    <div v-if="state.opacity > 0" class="touch" :style="{ left: state.x + 'px', top: state.y + 'px', opacity: state.opacity }"
        aria-hidden="true">
        <span class="touch__ring" :style="{ transform: `scale(${1 + state.ripple * 1.6})`, opacity: state.ripple ? 1 - state.ripple : 0 }" />
        <span class="touch__disc" :style="{ transform: `scale(${state.scale})` }" />
    </div>
</template>

<script setup lang="ts">
export interface TouchState {
    x: number
    y: number
    opacity: number
    /** Disc scale: 1 resting, smaller when pressed. */
    scale: number
    /** 0 = no ripple; 0–1 while it spreads. */
    ripple: number
}

defineProps<{ state: TouchState }>()
</script>

<style scoped>
.touch {
    position: absolute;
    z-index: 40;
    width: 0;
    height: 0;
    pointer-events: none;
}

.touch__disc,
.touch__ring {
    position: absolute;
    left: -17px;
    top: -17px;
    width: 34px;
    height: 34px;
    border-radius: 50%;
}

.touch__disc {
    background: rgba(242, 238, 230, 0.32);
    box-shadow: 0 0 0 1px rgba(242, 238, 230, 0.55), 0 4px 18px rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(2px);
}

.touch__ring {
    box-shadow: 0 0 0 1.5px rgba(242, 238, 230, 0.7);
}
</style>
