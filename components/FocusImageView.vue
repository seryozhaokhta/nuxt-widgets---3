<!-- components/FocusImageView.vue -->
<template>
    <div class="focus-image" tabindex="0" @keydown="handleKeydown" role="region"
        aria-label="Image viewer with focus points">
        <div class="image-container">
            <img ref="imageRef" :src="data.image" :alt="data.alt" class="focus-image__img" :style="imageTransformStyle"
                @click="handleImageClick" />

            <!-- Focus Point -->
            <FocusPoint v-if="currentFocusPoint" :coordinates="currentFocusPoint.coordinates" :is-zoomed-in="isZoomedIn"
                @toggle-zoom="toggleZoomToPoint" />
        </div>

        <!-- Description -->
        <FocusDescription :title="data.title" :description="currentFocusPoint.description"
            :description-position="descriptionPosition" />

        <!-- Progress Bar and Controls Container -->
        <div class="progress-controls-container">
            <!-- Progress Bar -->
            <FocusProgressBar :focus-points="data.focusPoints" :current-focus-index="currentFocusIndex"
                :progress="progress" @set-focus-point="handleSetFocusPoint" />

            <!-- Controls -->
            <FocusControls :is-paused="isPaused" @restart-progress="restartProgress" @toggle-pause="togglePause" />
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import FocusPoint from './FocusPoint.vue';
import FocusDescription from './FocusDescription.vue';
import FocusProgressBar from './FocusProgressBar.vue';
import FocusControls from './FocusControls.vue';

import useFocusPoints from '../composables/useFocusPoints.js';
import useZoom from '../composables/useZoom.js';
import useProgress from '../composables/useProgress.js';

const props = defineProps({
    data: {
        type: Object,
        required: true,
    },
});

const imageRef = ref(null);

const {
    currentFocusIndex,
    currentFocusPoint,
    setFocusPoint,
    nextFocusPoint,
    previousFocusPoint,
} = useFocusPoints(props.data.focusPoints);

const {
    translate,
    scaleValue,
    isZoomedIn,
    zoomToFocusPoint,
    resetZoom,
} = useZoom(imageRef);

const {
    progress,
    isPaused,
    startProgress,
    stopProgress,
    togglePause,
    restartProgress,
    resetProgress,
} = useProgress({
    durationMs: 5000,
    onProgressComplete: handleNextFocusPoint,
});

// Image transformation style
const imageTransformStyle = computed(() => ({
    transform: `translate(${translate.value.x}px, ${translate.value.y}px) scale(${scaleValue.value})`,
    transition: 'transform 0.5s ease-in-out',
}));

// Description position
const descriptionPosition = computed(() => {
    if (isMobile.value) {
        return {}; // Default positioning on mobile
    }
    if (currentFocusPoint.value && currentFocusPoint.value.coordinates.x > 50) {
        return {
            top: '10px',
            left: '10px',
            right: 'auto',
            transition: 'all 0.5s ease-in-out',
        };
    } else {
        return {
            top: '10px',
            right: '10px',
            left: 'auto',
            transition: 'all 0.5s ease-in-out',
        };
    }
});

// Determine if the device is mobile
const isMobile = ref(false);
const updateIsMobile = () => {
    isMobile.value = window.innerWidth <= 768;
};

onMounted(() => {
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    startProgress();
});

onUnmounted(() => {
    window.removeEventListener('resize', updateIsMobile);
    stopProgress();
});

// Handle image click to reset zoom
const handleImageClick = () => {
    resetZoom();
};

// Toggle zoom on focus point click
const toggleZoomToPoint = () => {
    if (isZoomedIn.value) {
        resetZoom();
    } else {
        zoomToFocusPoint(currentFocusPoint.value.coordinates);
    }
};

// Keyboard navigation
const handleKeydown = (event) => {
    if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleNextFocusPoint();
    } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePreviousFocusPoint();
    } else if (event.key === ' ') {
        event.preventDefault();
        togglePause();
    }
};

// Handler for setting focus point with reset
const handleSetFocusPoint = (index) => {
    resetZoom();
    resetProgress();
    setFocusPoint(index);
};

// Handler for next focus point with reset
function handleNextFocusPoint() {
    resetZoom();
    resetProgress();
    nextFocusPoint();
}

// Handler for previous focus point with reset
function handlePreviousFocusPoint() {
    resetZoom();
    resetProgress();
    previousFocusPoint();
}
</script>

<style scoped>
.focus-image {
    position: relative;
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
}

.image-container {
    position: relative;
    width: 100%;
    padding-top: 56.25%;
    /* Aspect ratio (height / width * 100%) */
    overflow: hidden;
}

.focus-image__img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    cursor: pointer;
    will-change: transform;
}

/* Progress Bar and Controls Container */
.progress-controls-container {
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 10px;
    width: 95%;
    justify-content: center;
}

/* For mobile devices, we make sure the controls and progress bar are visible and positioned properly */
@media screen and (max-width: 768px) {
    .progress-controls-container {
        flex-direction: column;
        align-items: center;
        position: static;
        margin-top: 10px;
        transform: none;
        width: 100%;
    }
}
</style>
