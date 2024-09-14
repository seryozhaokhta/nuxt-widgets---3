<!-- components/FocusProgressBar.vue -->
<template>
    <div class="progress-bar">
        <div v-for="(point, index) in focusPoints" :key="index" class="progress-bar__item"
            @click="$emit('set-focus-point', index)" :aria-current="currentFocusIndex === index ? 'step' : null">
            <div class="progress-bar__fill" :style="getProgressStyle(index)"></div>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    focusPoints: {
        type: Array,
        required: true,
    },
    currentFocusIndex: {
        type: Number,
        required: true,
    },
    progress: {
        type: Number,
        required: true,
    },
});

const getProgressStyle = (index) => ({
    width: props.currentFocusIndex === index ? `${props.progress}%` : '0%',
    backgroundColor:
        props.currentFocusIndex === index ? '#fff' : 'rgba(255, 255, 255, 0.4)',
});
</script>

<style scoped>
.progress-bar {
    display: flex;
    gap: 8px;
    flex: 1;
    justify-content: center;
}

.progress-bar__item {
    flex: 1;
    height: 5px;
    background-color: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(15px);
    border-radius: 10px;
    cursor: pointer;
    overflow: hidden;
    position: relative;
}

.progress-bar__fill {
    height: 100%;
    background-color: #fff;
    transition: width 0.1s linear;
}

/* Ensuring that the progress bar remains visible on mobile screens */
@media screen and (max-width: 768px) {
    .progress-bar {
        width: 100%;
        margin-top: 10px;
    }
}
</style>
