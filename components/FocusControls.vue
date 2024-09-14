<!-- components/FocusControls.vue -->
<template>
    <div class="controls">
        <img :src="restartIcon" alt="Restart" class="restart-icon" @click="$emit('restart-progress')"
            aria-label="Restart progress" />
        <img :src="isPaused ? playIcon : pauseIcon" :alt="isPaused ? 'Play' : 'Pause'" class="pause-icon"
            @click="$emit('toggle-pause')" :aria-label="isPaused ? 'Resume progress' : 'Pause progress'" />
    </div>
</template>

<script setup>
import restartIcon from '@/assets/restart.svg';
import playIcon from '@/assets/play.svg';
import pauseIcon from '@/assets/pause.svg';

const props = defineProps({
    isPaused: {
        type: Boolean,
        required: true,
    },
});
</script>

<style scoped>
.controls {
    display: flex;
    gap: 10px;
    align-items: center;
}

.restart-icon,
.pause-icon {
    width: 20px;
    height: 20px;
    cursor: pointer;
    transition: transform 0.2s ease;
}

.restart-icon:hover {
    transform: rotate(90deg);
}
</style>
