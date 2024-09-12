<!-- components/FocusImageView.vue -->

<template>
    <div class="focus-image" tabindex="0" @keydown="handleKeydown" role="region"
        aria-label="Image viewer with focus points">
        <img ref="imageRef" :src="data.image" :alt="data.alt" class="focus-image__img" :style="imageTransformStyle"
            @click="handleImageClick" />

        <!-- Фокусирующая точка -->
        <div v-if="currentFocusPoint" :style="getFocusPointStyle(currentFocusPoint.coordinates)" class="focus-point"
            :class="{ 'focus-point--active': isZoomedIn }" @click="toggleZoomToPoint" aria-label="Zoom to focus point">
        </div>

        <!-- Описание текущей точки -->
        <div class="focus-image__description" :style="descriptionPosition" aria-live="polite">
            <h2>{{ data.title }}</h2>
            <p>{{ currentFocusPoint.description }}</p>
        </div>

        <!-- Прогресс-бар -->
        <div class="progress-container">
            <div class="progress-bar">
                <div v-for="(point, index) in data.focusPoints" :key="index" class="progress-bar__item"
                    @click="setFocusPoint(index)" :aria-current="currentFocusIndex === index ? 'step' : null">
                    <div class="progress-bar__fill" :style="getProgressStyle(index)"></div>
                </div>
            </div>

            <!-- Иконки перезапуска и паузы -->
            <div class="controls">
                <img src="/assets/restart.svg" alt="Restart" class="restart-icon" @click="restartProgress"
                    aria-label="Restart progress" />
                <img src="/assets/pause.svg" alt="Pause" class="pause-icon" @click="togglePause"
                    aria-label="Pause/Resume progress" />
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

// Вычисляем текущую фокус-точку
const currentFocusPoint = computed(() => props.data.focusPoints[currentFocusIndex.value]);

// Стиль трансформации изображения
const imageTransformStyle = computed(() => ({
    transform: `translate(${translate.value.x}px, ${translate.value.y}px) scale(${scaleValue.value})`,
    transition: 'transform 0.5s ease-in-out',
}));

// Стиль фокус-точки
const getFocusPointStyle = (coordinates) => ({
    left: `${coordinates.x}%`,
    top: `${coordinates.y}%`,
    transform: 'translate(-50%, -50%)',
});

// Стиль прогресс-бара
const getProgressStyle = (index) => ({
    width: currentFocusIndex.value === index ? `${progress.value}%` : '0%',
    backgroundColor: currentFocusIndex.value === index ? '#fff' : 'rgba(255, 255, 255, 0.4)',
});

// Вычисляемое свойство для позиции описания
const descriptionPosition = computed(() => {
    if (currentFocusPoint.value && currentFocusPoint.value.coordinates.x > 50) {
        // Если фокус-точка находится в правой половине изображения
        return {
            top: '10px',
            left: '10px',
            right: 'auto',
            transition: 'all 0.5s ease-in-out',
        };
    } else {
        // Если фокус-точка находится в левой половине изображения
        return {
            top: '10px',
            right: '10px',
            left: 'auto',
            transition: 'all 0.5s ease-in-out',
        };
    }
});

// Устанавливаем текущую фокусирующую точку без автоматического зума
const setFocusPoint = (index) => {
    resetZoom(); // Сбрасываем зум при переключении фокус-точек
    currentFocusIndex.value = index;
    resetProgress();
};

// Переключение зума при клике на фокус-точку
const toggleZoomToPoint = () => {
    if (isZoomedIn.value) {
        resetZoom();
    } else {
        zoomToFocusPoint(currentFocusPoint.value.coordinates);
    }
};

// Обработка клавиатуры
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

// Следующая фокус-точка
const nextFocusPoint = () => {
    setFocusPoint((currentFocusIndex.value + 1) % props.data.focusPoints.length);
};

// Предыдущая фокус-точка
const previousFocusPoint = () => {
    setFocusPoint(
        (currentFocusIndex.value - 1 + props.data.focusPoints.length) %
        props.data.focusPoints.length
    );
};

// Сброс прогресса
const resetProgress = () => {
    progress.value = 0;
};

// Перезапуск прогресса
const restartProgress = () => {
    clearInterval(progressInterval);
    currentFocusIndex.value = 0;
    progress.value = 0;
    isPaused.value = false;
    resetZoom();
    startProgress();
};

// Пауза и возобновление прогресса
const togglePause = () => {
    if (isPaused.value) {
        startProgress();
    } else {
        clearInterval(progressInterval);
    }
    isPaused.value = !isPaused.value;
};

// Запуск прогресса
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

// Приближение к фокус-точке с ограничением смещения
const zoomToFocusPoint = (coordinates) => {
    const img = imageRef.value;
    if (img) {
        const containerRect = img.getBoundingClientRect();

        const scale = 2; // Коэффициент увеличения

        // Вычисляем позицию фокус-точки в пикселях относительно изображения
        const focusX = (coordinates.x / 100) * containerRect.width;
        const focusY = (coordinates.y / 100) * containerRect.height;

        // Вычисляем максимальное смещение
        const maxTranslateX = (containerRect.width * (scale - 1)) / 2;
        const maxTranslateY = (containerRect.height * (scale - 1)) / 2;

        // Вычисляем смещение
        const offsetX = (focusX - containerRect.width / 2) * (scale - 1);
        const offsetY = (focusY - containerRect.height / 2) * (scale - 1);

        // Ограничиваем смещение, чтобы изображение не выходило за границы
        let translateX = -offsetX;
        let translateY = -offsetY;

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

// Сброс зума
const resetZoom = () => {
    translate.value = { x: 0, y: 0 };
    scaleValue.value = 1;
    isZoomedIn.value = false;
};

// Обработка клика по изображению для сброса зума
const handleImageClick = () => {
    resetZoom();
};

onMounted(() => {
    startProgress();
});

onUnmounted(() => {
    clearInterval(progressInterval);
});
</script>

<style scoped>
.focus-image {
    position: relative;
    width: 100%;
    max-width: 800px;
    height: auto;
    overflow: hidden;
}

.focus-image__img {
    display: block;
    width: 100%;
    height: auto;
    cursor: pointer;
    will-change: transform;
}

/* Фокус-точка */
.focus-point {
    position: absolute;
    width: 15px;
    height: 15px;
    background-color: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(5px);
    border-radius: 50%;
    border: 1px solid white;
    cursor: pointer;
    transform: translate(-50%, -50%);
    transition: all 0.3s ease;
}

/* Активное состояние фокус-точки */
.focus-point--active {
    width: 300px;
    height: 300px;
    border: 0.5px solid rgba(255, 255, 255, 0.5);
    background-color: transparent;
    backdrop-filter: blur(0px);
}

.focus-image__description {
    position: absolute;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(15px);
    color: white;
    padding: 10px;
    border-radius: 8px;
    max-width: 250px;
    text-align: left;
    /* Позиционирование задается динамически */
}

/* Прогресс-бар и иконки управления */
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

/* Иконки управления */
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

/* Поворот только для иконки перезапуска */
.restart-icon:hover {
    transform: rotate(90deg);
}
</style>
