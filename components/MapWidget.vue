<!-- components/MapWidget.vue -->

<template>
    <div class="map-widget">
        <div class="current-year">{{ formattedCurrentYear }}</div>

        <div class="map-container" ref="mapContainer" @wheel="handleWheel" @mousedown="startPan" @mousemove="panMap"
            @mouseup="endPan" @mouseleave="endPan" @touchstart="startPanTouch" @touchmove="panMapTouch"
            @touchend="endPan">
            <div class="map-content" :style="mapStyle">
                <img ref="mapImage" :src="mapSrc" alt="Карта мира" class="map-image" />
                <MapPoint v-for="point in sortedPoints" :key="point.id" :point="point" :currentYear="currentYear"
                    :zoomScale="zoomScale" @selectPoint="selectPoint" />
            </div>

            <!-- Модальное окно внутри .map-container -->
            <ModalWindow v-if="modalVisible" ref="modalRef" @close="closeModal">
                <template #header>
                    <h2 class="modal-title">{{ selectedPoint.name }}</h2>
                    <p class="modal-founded">
                        {{ selectedPoint.founded }} <sup>Foundation</sup>
                    </p>
                </template>
                <template #body>
                    <!-- Отображение текущего периода, если есть -->
                    <div v-if="currentPeriod">
                        <h3 class="modal-period-title">{{ currentPeriod.title }}</h3>
                        <p class="modal-period-description">{{ currentPeriod.description }}</p>
                        <p class="modal-period-year"><em>{{ currentPeriod.yearRange }}</em></p>
                    </div>
                    <p v-else class="modal-description">{{ selectedPoint.description }}</p>

                    <!-- Таймлайн -->
                    <MapTimeline v-if="selectedPoint.periods" :periods="selectedPoint.periods"
                        v-model:currentPeriodIndex="currentPeriodIndex" @periodSelected="onPeriodSelected" />
                </template>
            </ModalWindow>
        </div>

        <MapControls v-model:currentYear="currentYear" :minYear="minYear" :maxYear="maxYear" @zoomIn="zoomIn"
            @zoomOut="zoomOut" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick, onBeforeUnmount } from 'vue';
import MapControls from './MapControls.vue';
import MapPoint from './MapPoint.vue';
import ModalWindow from './ModalWindow.vue';
import MapTimeline from './MapTimeline.vue';
import { formatYearTooltip } from '@/composables/mapUtils';
import { minZoom, maxZoom, zoomStep } from '@/composables/constants';
import gsap from 'gsap';
import debounce from 'lodash/debounce';

const props = defineProps({
    data: {
        type: Object,
        required: true,
    },
});

const mapSrc = ref('/assets/map/World_map_blank_without_borders.svg');
const mapPoints = ref([]);
const sortedPoints = ref([]);
const currentYear = ref(0);
const zoomScale = ref(1);
const mapPosition = ref({ x: 0, y: 0 });
const isPanning = ref(false);
const startPanPosition = ref({ x: 0, y: 0 });
const mapContainer = ref(null);
const selectedPoint = ref(null);
const modalVisible = ref(false);
const modalRef = ref(null);
const pendingPoint = ref(null);
const currentPeriodIndex = ref(0);

const minYear = ref(0);
const maxYear = ref(0);

// Функция для парсинга yearRange
function parseYearRange(yearRange) {
    // Удаляем все символы, кроме цифр, тире, BCE и CE
    const sanitized = yearRange.replace(/[^\d–BCECE]/g, '');
    const rangeMatch = sanitized.match(/(\d+)(BCE|CE)?–(\d+)(BCE|CE)?/);
    const singleMatch = sanitized.match(/^(\d+)(BCE|CE)?$/);

    if (rangeMatch) {
        let [_, startYear, startEra, endYear, endEra] = rangeMatch;
        startYear = parseInt(startYear, 10);
        endYear = parseInt(endYear, 10);
        startEra = startEra || 'BCE';
        endEra = endEra || 'BCE';

        startYear = startEra === 'BCE' ? -startYear : startYear;
        endYear = endEra === 'BCE' ? -endYear : endYear;

        return {
            startYear: Math.min(startYear, endYear),
            endYear: Math.max(startYear, endYear),
        };
    } else if (singleMatch) {
        let [_, year, era] = singleMatch;
        year = parseInt(year, 10);
        era = era || 'BCE';
        year = era === 'BCE' ? -year : year;
        return {
            startYear: year,
            endYear: year,
        };
    }

    return null;
}

onMounted(() => {
    mapPoints.value = props.data.mapPoints || [];
    mapPoints.value.forEach((point) => {
        point.periods = point.periods.map((period) => {
            const years = parseYearRange(period.yearRange);
            return {
                ...period,
                ...years,
            };
        });
    });

    sortedPoints.value = [...mapPoints.value].sort((a, b) => a.year - b.year);

    if (sortedPoints.value.length > 0) {
        minYear.value = sortedPoints.value.reduce((min, point) => Math.min(min, point.year), Infinity);
        maxYear.value = new Date().getFullYear(); // Текущий год
        currentYear.value = minYear.value;
    }
});

// Добавляем дебаунсинг для currentYear
const debouncedCurrentYear = ref(currentYear.value);

watch(
    () => currentYear.value,
    debounce((newYear) => {
        debouncedCurrentYear.value = newYear;
    }, 100),
);

const mapStyle = computed(() => ({
    transform: `translate(${mapPosition.value.x}px, ${mapPosition.value.y}px) scale(${zoomScale.value})`,
    transition: isPanning.value ? 'none' : 'transform 0.3s ease',
    transformOrigin: 'top left',
}));

const formattedCurrentYear = computed(() => formatYearTooltip(debouncedCurrentYear.value));

function handleWheel(event) {
    event.preventDefault();
    const zoomFactor = event.deltaY < 0 ? zoomStep : -zoomStep;
    zoom(zoomFactor, event);
}

function zoomIn() {
    zoom(zoomStep);
}

function zoomOut() {
    zoom(-zoomStep);
}

function zoom(step, event = null) {
    const newZoomScale = Math.min(Math.max(zoomScale.value + step, minZoom), maxZoom);

    if (event) {
        const rect = mapContainer.value.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;
        const offsetY = event.clientY - rect.top;
        const dx = (offsetX - mapPosition.value.x) * (newZoomScale / zoomScale.value - 1);
        const dy = (offsetY - mapPosition.value.y) * (newZoomScale / zoomScale.value - 1);

        mapPosition.value.x -= dx;
        mapPosition.value.y -= dy;
    } else {
        const rect = mapContainer.value.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const dx = (centerX - mapPosition.value.x) * (newZoomScale / zoomScale.value - 1);
        const dy = (centerY - mapPosition.value.y) * (newZoomScale / zoomScale.value - 1);

        mapPosition.value.x -= dx;
        mapPosition.value.y -= dy;
    }

    zoomScale.value = newZoomScale;
}

function startPan(event) {
    isPanning.value = true;
    startPanPosition.value = { x: event.clientX, y: event.clientY };
}

function panMap(event) {
    if (!isPanning.value) return;
    const deltaX = event.clientX - startPanPosition.value.x;
    const deltaY = event.clientY - startPanPosition.value.y;
    mapPosition.value.x += deltaX;
    mapPosition.value.y += deltaY;
    startPanPosition.value = { x: event.clientX, y: event.clientY };
}

function startPanTouch(event) {
    isPanning.value = true;
    startPanPosition.value = { x: event.touches[0].clientX, y: event.touches[0].clientY };
}

function panMapTouch(event) {
    if (!isPanning.value) return;
    const deltaX = event.touches[0].clientX - startPanPosition.value.x;
    const deltaY = event.touches[0].clientY - startPanPosition.value.y;
    mapPosition.value.x += deltaX;
    mapPosition.value.y += deltaY;
    startPanPosition.value = { x: event.touches[0].clientX, y: event.touches[0].clientY };
}

function endPan() {
    isPanning.value = false;
}

function selectPoint(point) {
    currentPeriodIndex.value = 0; // Сброс индекса периода при выборе новой точки
    if (modalVisible.value) {
        pendingPoint.value = point;
        modalRef.value.close();
    } else {
        selectedPoint.value = point;
        modalVisible.value = true;
    }
}

function closeModal() {
    if (pendingPoint.value) {
        selectedPoint.value = pendingPoint.value;
        pendingPoint.value = null;
        nextTick(() => {
            modalRef.value.open();
        });
    } else {
        modalVisible.value = false;
        selectedPoint.value = null;
    }
}

// Вычисляем текущий период на основе выбранной точки и индекса периода
const currentPeriod = computed(() => {
    if (selectedPoint.value && selectedPoint.value.periods) {
        return selectedPoint.value.periods[currentPeriodIndex.value];
    } else {
        return null;
    }
});

// Функция обработки выбора подпериода
function onPeriodSelected(period) {
    currentYear.value = Math.floor((period.startYear + period.endYear) / 2);
}

// Отслеживание изменений currentYear для обновления currentPeriodIndex
watch(currentYear, (newYear) => {
    if (selectedPoint.value && selectedPoint.value.periods) {
        const index = selectedPoint.value.periods.findIndex((period) => {
            return newYear >= period.startYear && newYear <= period.endYear;
        });
        if (index !== -1 && index !== currentPeriodIndex.value) {
            currentPeriodIndex.value = index;
        }
    }
});

// Анимация года
watch(debouncedCurrentYear, () => {
    gsap.fromTo(
        '.current-year',
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.3 }
    );
});
</script>

<style scoped>
.map-widget {
    position: relative;
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
}

.current-year {
    text-align: center;
    font-size: 24px;
    margin-bottom: 10px;
    color: #fff;
}

.map-container {
    overflow: hidden;
    position: relative;
    cursor: grab;
    width: 100%;
    height: 0;
    padding-bottom: 56.25%;
    /* Соотношение сторон 16:9 */
}

.map-container:active {
    cursor: grabbing;
}

.map-content {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transform-origin: top left;
}

.map-image {
    width: 100%;
    height: 100%;
    user-select: none;
    pointer-events: none;
}

/* Стили для контролов */
.map-controls {
    margin-top: 10px;
}

/* Дополнительные стили для модального контента */
.modal-title {
    font-size: 24px;
    margin: 0;
}

.modal-founded {
    font-size: 16px;
    margin: 0;
    color: #ccc;
}

.modal-period-title {
    font-size: 20px;
    margin-top: 10px;
    margin-bottom: 5px;
}

.modal-period-description {
    font-size: 16px;
    margin-bottom: 5px;
}

.modal-period-year {
    font-size: 14px;
    color: #aaa;
}

.modal-description {
    font-size: 16px;
    margin-bottom: 10px;
}

@media screen and (max-width: 600px) {
    .modal-title {
        font-size: 18px;
    }

    .modal-founded {
        font-size: 14px;
    }

    .modal-period-title {
        font-size: 16px;
    }

    .modal-period-description {
        font-size: 14px;
        margin-bottom: 5px;
    }

    .modal-period-year {
        font-size: 12px;
        color: #aaa;
    }

    .modal-description {
        font-size: 14px;
        margin-bottom: 5px;
    }
}
</style>
