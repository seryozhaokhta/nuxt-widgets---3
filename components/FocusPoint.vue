<!-- components/FocusPoint.vue -->
<template>
    <div :style="focusPointStyle" class="focus-point" :class="{ 'focus-point--active': isZoomedIn }"
        @click="$emit('toggle-zoom')" aria-label="Zoom to focus point"></div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    coordinates: {
        type: Object,
        required: true,
    },
    isZoomedIn: {
        type: Boolean,
        required: true,
    },
});

const focusPointStyle = computed(() => ({
    left: `${props.coordinates.x}%`,
    top: `${props.coordinates.y}%`,
    transform: 'translate(-50%, -50%)',
}));
</script>

<style scoped>
.focus-point {
    position: absolute;
    width: 15px;
    height: 15px;
    background-color: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(5px);
    border-radius: 50%;
    border: 1px solid white;
    cursor: pointer;
    transition: all 0.3s ease;
}

.focus-point--active {
    width: 300px;
    height: 300px;
    border: 0.5px solid rgba(255, 255, 255, 0.5);
    background-color: transparent;
    backdrop-filter: blur(0px);
}
</style>
