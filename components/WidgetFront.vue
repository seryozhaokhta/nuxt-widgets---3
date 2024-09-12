<!-- components/WidgetFront.vue -->

<template>
    <div :class="['widget__details', { 'widget__details--hidden': showDetails }]">
        <span class="widget__tag">{{ data.tag }}</span>
        <h2 class="widget__title">{{ data.title }}</h2>
        <p class="widget__author">Author: <span>{{ data.author }}</span></p>
    </div>
</template>

<script setup>
const props = defineProps({
    data: Object,
    showDetails: Boolean
});
</script>

<style scoped>
@import '../css/widget-front.css';
</style>
