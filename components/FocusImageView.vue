<!-- components/FocusImageView.vue -->

<template>
    <div class="focus-image" tabindex="0" @keydown="handleKeydown" role="region"
        aria-label="Image viewer with focus points">
        <div class="image-container">
            <img ref="imageRef" :src="data.image" :alt="data.alt" class="focus-image__img" :style="imageTransformStyle"
                @click="handleImageClick" />

            <!-- Focus Point -->
            <div v-if="currentFocusPoint" :style="getFocusPointStyle(currentFocusPoint.coordinates)" class="focus-point"
                :class="{ 'focus-point--active': isZoomedIn }" @click="toggleZoomToPoint"
                aria-label="Zoom to focus point"></div>
        </div>

        <!-- Description -->
        <div class="focus-image__description" :style="descriptionPosition" aria-live="polite">
            <h2>{{ data.title }}</h2>
            <p>{{ currentFocusPoint.description }}</p>
        </div>

        <!-- Progress Bar -->
        <div class="progress-container">
            <div class="progress-bar">
                <div v-for="(point, index) in data.focusPoints" :key="index" class="progress-bar__item"
                    @click="setFocusPoint(index)" :aria-current="currentFocusIndex === index ? 'step' : null">
                    <div class="progress-bar__fill" :style="getProgressStyle(index)"></div>
                </div>
            </div>

            <!-- Control Icons -->
            <div class="controls">
                <img src="/assets/restart.svg" alt="Restart" class="restart-icon" @click="restartProgress"
                    aria-label="Restart progress" />
                <img :src="isPaused ? '/assets/play.svg' : '/assets/pause.svg'" :alt="isPaused ? 'Play' : 'Pause'"
                    class="pause-icon" @click="togglePause"
                    :aria-label="isPaused ? 'Resume progress' : 'Pause progress'" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
    data: {
        type: Object,
        required: true,
    },
});

const imageRef = ref(null);

const currentFocusIndex = ref(0);
const progress = ref(0);
const isZoomedIn = ref(false);
const isPaused = ref(false);

const translate = ref({ x: 0, y: 0 });
const scaleValue = ref(1);

let progressInterval = null;
const PROGRESS_INTERVAL_MS = 100;
const FOCUS_POINT_DURATION_MS = 5000;

// Calculate current focus point
const currentFocusPoint = computed(() => props.data.focusPoints[currentFocusIndex.value]);

// Image transformation style
const imageTransformStyle = computed(() => ({
    transform: `translate(${translate.value.x}px, ${translate.value.y}px) scale(${scaleValue.value})`,
    transition: 'transform 0.5s ease-in-out',
}));

// Focus point style
const getFocusPointStyle = (coordinates) => ({
    left: `${coordinates.x}%`,
    top: `${coordinates.y}%`,
    transform: 'translate(-50%, -50%)',
});

// Progress bar style
const getProgressStyle = (index) => ({
    width: currentFocusIndex.value === index ? `${progress.value}%` : '0%',
    backgroundColor: currentFocusIndex.value === index ? '#fff' : 'rgba(255, 255, 255, 0.4)',
});

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
    clearInterval(progressInterval);
});

// Set focus point without zoom
const setFocusPoint = (index) => {
    resetZoom();
    currentFocusIndex.value = index;
    resetProgress();
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
        nextFocusPoint();
    } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        previousFocusPoint();
    } else if (event.key === ' ') {
        event.preventDefault();
        togglePause();
    }
};

// Next focus point
const nextFocusPoint = () => {
    setFocusPoint((currentFocusIndex.value + 1) % props.data.focusPoints.length);
};

// Previous focus point
const previousFocusPoint = () => {
    setFocusPoint(
        (currentFocusIndex.value - 1 + props.data.focusPoints.length) % props.data.focusPoints.length
    );
};

// Reset progress
const resetProgress = () => {
    progress.value = 0;
};

// Restart progress
const restartProgress = () => {
    clearInterval(progressInterval);
    currentFocusIndex.value = 0;
    progress.value = 0;
    isPaused.value = false;
    resetZoom();
    startProgress();
};

// Toggle pause
const togglePause = () => {
    if (isPaused.value) {
        startProgress();
    } else {
        clearInterval(progressInterval);
    }
    isPaused.value = !isPaused.value;
};

// Start progress
const startProgress = () => {
    if (progressInterval) clearInterval(progressInterval);
    progressInterval = setInterval(() => {
        progress.value += (PROGRESS_INTERVAL_MS / FOCUS_POINT_DURATION_MS) * 100;
        if (progress.value >= 100) {
            progress.value = 0;
            nextFocusPoint();
        }
    }, PROGRESS_INTERVAL_MS);
};

// Zoom to focus point
const zoomToFocusPoint = (coordinates) => {
    const img = imageRef.value;
    if (img) {
        const containerRect = img.getBoundingClientRect();

        const scale = 2; // Zoom factor

        // Calculate focus point position in pixels
        const focusX = (coordinates.x / 100) * containerRect.width;
        const focusY = (coordinates.y / 100) * containerRect.height;

        // Calculate maximum translation
        const maxTranslateX = (containerRect.width * (scale - 1)) / 2;
        const maxTranslateY = (containerRect.height * (scale - 1)) / 2;

        // Calculate translation
        let translateX = -((focusX - containerRect.width / 2) * (scale - 1));
        let translateY = -((focusY - containerRect.height / 2) * (scale - 1));

        // Limit translation to prevent overflow
        translateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, translateX));
        translateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, translateY));

        translate.value = {
            x: translateX,
            y: translateY,
        };
        scaleValue.value = scale;
        isZoomedIn.value = true;
    }
};

// Reset zoom
const resetZoom = () => {
    translate.value = { x: 0, y: 0 };
    scaleValue.value = 1;
    isZoomedIn.value = false;
};

// Handle image click to reset zoom
const handleImageClick = () => {
    resetZoom();
};
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
    /* Use 'contain' if you prefer */
    cursor: pointer;
    will-change: transform;
}

/* Focus Point */
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

/* Description */
.focus-image__description {
    position: absolute;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(15px);
    color: white;
    padding: 10px;
    border-radius: 8px;
    max-width: 250px;
    text-align: left;
    /* Positioning handled dynamically */
}

/* Progress Bar and Controls */
.progress-container {
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

.progress-bar {
    display: flex;
    gap: 8px;
    flex: 1;
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

.controls {
    display: flex;
    gap: 10px;
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

/* --- Responsive Styles for Mobile Devices --- */
@media screen and (max-width: 768px) {
    .focus-image__description {
        position: static;
        margin-top: 10px;
        left: auto;
        right: auto;
        top: auto;
        bottom: auto;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: none;
        max-width: 100%;
        width: 100%;
        box-sizing: border-box;
    }

    .progress-container {
        position: static;
        margin-top: 10px;
        transform: none;
        width: 100%;
    }

    .controls {
        justify-content: center;
    }

    .image-container {
        padding-top: 56.25%;
        /* Maintain aspect ratio on mobile */
    }
}
</style>
