<!-- components/WidgetView.vue -->

<template>
    <div :class="['widget', { 'widget--minimized': isMinimized }]">
        <!-- Изображение на лицевой стороне -->
        <img class="widget__image" :src="data.image" :alt="data.alt" v-if="!isMinimized && !showDetails" />

        <!-- Лицевая сторона -->
        <WidgetFront v-if="!isMinimized" :data="data" :showDetails="showDetails" />

        <!-- Оборотная сторона -->
        <WidgetBack v-if="!isMinimized" :data="data" :showDetails="showDetails" />

        <!-- Кнопка раскрытия -->
        <button class="widget__toggle-description" @click="toggleDescription" v-if="!isMinimized">
            <img :class="{ 'widget__toggle-description--rotated': showDetails }" src="/assets/expand-arrow.svg"
                alt="Expand" />
        </button>

        <!-- Минимизированный виджет -->
        <WidgetMinimized v-if="isMinimized" :data="data" @toggleMinimize="toggleMinimize" />

        <!-- Кнопка сворачивания -->
        <button class="widget__close-btn" @click="toggleMinimize" v-else>
            <img src="/assets/cross.svg" alt="Close" />
        </button>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import WidgetFront from './WidgetFront.vue';
import WidgetBack from './WidgetBack.vue';
import WidgetMinimized from './WidgetMinimized.vue';

const props = defineProps({
    data: Object
});

const isMinimized = ref(false);
const showDetails = ref(false);

function toggleDescription() {
    showDetails.value = !showDetails.value;
}

function toggleMinimize() {
    if (isMinimized.value) {
        showDetails.value = false;
    }
    isMinimized.value = !isMinimized.value;
}
</script>

<style scoped>
@import '../css/widget-buttons.css';
</style>
