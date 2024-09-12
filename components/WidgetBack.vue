<!-- components/WidgetBack.vue -->

<template>
    <div :class="['widget__back', { 'widget__back--hidden': !showDetails }]">
        <h2>{{ data.title }}</h2>
        <p>Author: {{ data.author }}</p>
        <p v-if="data.description">{{ data.description }}</p>

        <!-- Проверка на наличие источника -->
        <div v-if="data.source" class="widget__source">
            <a :href="data.source.url" target="_blank" rel="noopener noreferrer" class="widget__source-link">
                <img :src="data.source.icon" alt="Source icon" class="widget__source-icon" />
                Source
            </a>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    data: Object,
    showDetails: Boolean
});
</script>

<style scoped>
@import '../css/widget-back.css';
</style>
