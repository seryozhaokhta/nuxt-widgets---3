<!-- components/MapCustomSlider.vue -->

<template>
    <div class="map-custom-slider-container">
        <input type="range" class="map-custom-slider" :min="min" :max="max" :step="step" :value="modelValue"
            @input="updateValue($event.target.value)" @change="updateValue($event.target.value)" />
        <div class="slider-tooltip" v-if="tooltip">
            {{ formattedValue }}
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    modelValue: {
        type: Number,
        required: true,
    },
    min: {
        type: Number,
        default: 0,
    },
    max: {
        type: Number,
        default: 100,
    },
    step: {
        type: Number,
        default: 1,
    },
    tooltip: {
        type: Boolean,
        default: false,
    },
    tooltipFormatter: {
        type: Function,
        default: (value) => value,
    },
});

const emits = defineEmits(['update:modelValue']);

const formattedValue = computed(() => {
    return props.tooltipFormatter(props.modelValue);
});

function updateValue(value) {
    emits('update:modelValue', Number(value));
}
</script>

<style scoped>
.map-custom-slider-container {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
}

.map-custom-slider {
    /* Убираем стандартное оформление слайдера */
    -webkit-appearance: none;
    appearance: none;
    /* Стандартное свойство для совместимости */

    width: 100%;
    height: 10px;
    /* Толщина слайдера */
    border-radius: 5px;
    background: #ccc;
    /* Цвет фона слайдера */
    outline: none;
    transition: background 0.3s;
}

/* Стили для вебкита (Chrome, Safari) */
.map-custom-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    /* Стандартное свойство для совместимости */

    width: 24px;
    /* Размер бегунка */
    height: 24px;
    border-radius: 50%;
    background: #ff0000;
    /* Цвет бегунка */
    cursor: pointer;
    transition: background 0.3s, transform 0.3s;
    border: none;
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
}

/* Стили для Firefox */
.map-custom-slider::-moz-range-thumb {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #00bfff;
    cursor: pointer;
    transition: background 0.3s, transform 0.3s;
    border: none;
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
}

/* Стили при наведении */
.map-custom-slider:hover {
    background: #bbb;
    /* Цвет фона при наведении */
}

/* Стили при активном нажатии (вебкит) */
.map-custom-slider:active::-webkit-slider-thumb {
    background: #1e90ff;
    /* Цвет бегунка при нажатии */
    transform: scale(1.2);
}

/* Стили при активном нажатии (Firefox) */
.map-custom-slider:active::-moz-range-thumb {
    background: #1e90ff;
    transform: scale(1.2);
}

.slider-tooltip {
    position: absolute;
    top: -35px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.75);
    color: #fff;
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 14px;
    white-space: nowrap;
    pointer-events: none;
}
</style>
