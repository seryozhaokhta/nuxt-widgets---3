<!-- pages/index.vue -->

<template>
    <div class="widget-container">
        <!-- Верхний контейнер для квадратных виджетов -->
        <div class="upper-container">
            <component :is="getWidgetComponent(widget.type)" v-for="(widget, index) in upperWidgets" :key="index"
                :data="widget" />
        </div>

        <!-- Нижний контейнер для "Sleeping Venus" -->
        <div class="lower-container">
            <component :is="getWidgetComponent(widget.type)" v-for="(widget, index) in lowerWidgets" :key="index"
                :data="widget" />
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import WidgetView from '~/components/WidgetView.vue';
import FocusImageView from '~/components/FocusImageView.vue';  // компонент для "Sleeping Venus"

const widgets = ref([]);

// Разделение на верхние и нижние виджеты
const upperWidgets = computed(() => {
    return widgets.value.filter(widget => widget.type === 'image');
});

const lowerWidgets = computed(() => {
    return widgets.value.filter(widget => widget.type === 'focus-image');
});

onMounted(async () => {
    try {
        const response = await fetch('/data/widgets.json');
        if (!response.ok) {
            throw new Error('Failed to fetch widgets');
        }
        widgets.value = await response.json();
    } catch (error) {
        console.error(error.message);
    }
});

// Функция для выбора компонента в зависимости от типа виджета
const getWidgetComponent = (type) => {
    if (type === 'image') return WidgetView;
    if (type === 'focus-image') return FocusImageView;
    return WidgetView;  // по умолчанию
};
</script>

<style scoped>
@import '../css/main.css';

/* Верхний контейнер для квадратных виджетов */
.upper-container {
    display: flex;
    justify-content: center;
    gap: 20px;
    flex-direction: row;
    /* Виджеты располагаются в ряд */
    margin-bottom: 20px;
    /* Отступ вниз */
}

/* Нижний контейнер для "Sleeping Venus" */
.lower-container {
    display: flex;
    justify-content: center;
    flex-direction: row;
    /* Горизонтальное выравнивание */
    width: 70%;
    /* Виджет будет растянут на всю ширину */
    padding: 20px;
    background-color: rgba(0, 0, 0, 0.8);
    /* Для контраста */
}
</style>
