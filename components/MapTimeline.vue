<!-- components/MapTimeline.vue -->

<template>
    <div class="map-timeline">
        <div v-for="(period, index) in periods" :key="index" class="map-timeline__item" @click="selectPeriod(index)"
            :class="{ 'map-timeline__item--active': currentPeriodIndex === index }">
            <div class="map-timeline__label">{{ period.title }}</div>
            <div class="map-timeline__fill" :style="getProgressStyle(index)"></div>
        </div>
    </div>
</template>

<script setup>
import { ref, watchEffect } from 'vue';

const props = defineProps({
    periods: {
        type: Array,
        required: true,
    },
});

const emits = defineEmits(['update:currentPeriodIndex', 'periodSelected']);

const currentPeriodIndex = ref(0);

watchEffect(() => {
    emits('update:currentPeriodIndex', currentPeriodIndex.value);
});

function selectPeriod(index) {
    currentPeriodIndex.value = index;
    emits('periodSelected', props.periods[index]);
}

function getProgressStyle(index) {
    return {
        width: currentPeriodIndex.value === index ? '100%' : '0%',
        backgroundColor:
            currentPeriodIndex.value === index
                ? '#fff'
                : 'rgba(255, 255, 255, 0.4)',
    };
}
</script>

<style scoped>
.map-timeline {
    display: flex;
    gap: 8px;
    justify-content: center;
    margin-top: 20px;
}

.map-timeline__item {
    flex: 1;
    height: 5px;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    cursor: pointer;
    overflow: hidden;
    position: relative;
}

.map-timeline__item--active {
    background-color: rgba(255, 255, 255, 0.4);
}

.map-timeline__label {
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 12px;
    color: #fff;
    white-space: nowrap;
}

.map-timeline__fill {
    height: 100%;
    background-color: #fff;
    transition: width 0.3s ease;
}
</style>
