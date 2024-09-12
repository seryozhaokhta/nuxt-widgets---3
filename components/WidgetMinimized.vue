<!-- components/WidgetMinimized.vue -->

<template>
    <div class="widget__minimized" @click="onClick">
        <img :src="data.image" :alt="data.alt" class="widget__image--minimized" />
    </div>
</template>

<script setup>
const props = defineProps({
    data: Object,
});
const emit = defineEmits(['toggleMinimize']);

function onClick() {
    emit('toggleMinimize');
}
</script>

<style scoped>
@import '../css/widget-minimized.css';
</style>
